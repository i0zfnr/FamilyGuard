using System;
using System.Threading;
using XennGuard.Agent.Api;
using XennGuard.Agent.Crypto;
using XennGuard.Agent.Telemetry;

namespace XennGuard.Agent.Agent
{
    public class CheckinEventArgs : EventArgs
    {
        public bool Success { get; private set; }
        public string StatusMessage { get; private set; }
        public DateTime Timestamp { get; private set; }

        public CheckinEventArgs(bool success, string statusMessage, DateTime timestamp)
        {
            Success = success;
            StatusMessage = statusMessage;
            Timestamp = timestamp;
        }
    }

    public class AgentDaemon : IDisposable
    {
        private readonly WindowsCryptoStore _cryptoStore;
        private readonly Timer _timer;
        private readonly object _syncLock = new object();
        private bool _isRunning;
        private int _intervalMinutes;

        public event EventHandler<CheckinEventArgs> CheckinCompleted;

        public DateTime? LastCheckinTime { get; private set; }
        public string LastStatus { get; private set; }
        public bool IsEnrolled { get { return _cryptoStore.LoadCredentials() != null; } }

        public AgentDaemon(WindowsCryptoStore cryptoStore, int intervalMinutes = 15)
        {
            _cryptoStore = cryptoStore ?? new WindowsCryptoStore();
            _intervalMinutes = Math.Max(1, intervalMinutes);
            _lastStatus = "Initialized. Waiting for next cycle.";
            _timer = new Timer(OnTimerTick, null, Timeout.Infinite, Timeout.Infinite);
        }

        private string _lastStatus;

        public void Start()
        {
            lock (_syncLock)
            {
                if (_isRunning) return;
                _isRunning = true;
                _lastStatus = "Agent active. Zero covert tracking enabled.";
                // Trigger immediate first checkin, then repeat every interval
                _timer.Change(TimeSpan.FromSeconds(2), TimeSpan.FromMinutes(_intervalMinutes));
            }
        }

        public void Stop()
        {
            lock (_syncLock)
            {
                if (!_isRunning) return;
                _isRunning = false;
                _timer.Change(Timeout.Infinite, Timeout.Infinite);
                _lastStatus = "Agent stopped.";
            }
        }

        public CheckinEventArgs PerformCheckinNow()
        {
            lock (_syncLock)
            {
                DeviceCredential credential = _cryptoStore.LoadCredentials();
                if (credential == null)
                {
                    string msg = "Device not enrolled. No credentials found.";
                    _lastStatus = msg;
                    var args = new CheckinEventArgs(false, msg, DateTime.UtcNow);
                    RaiseCheckinCompleted(args);
                    return args;
                }

                try
                {
                    // 1. Send Heartbeat
                    bool hbSuccess = FamilyGuardApiClient.SendHeartbeat(credential.Server, credential.DeviceToken);

                    // 2. Collect Telemetry
                    WindowsTelemetryData telemetry = WindowsTelemetryCollector.Collect();
                    string telemetryJson = telemetry.ToJson();

                    // 3. Send Telemetry
                    bool telemSuccess = FamilyGuardApiClient.SendTelemetry(credential.Server, credential.DeviceToken, telemetryJson);

                    bool overallSuccess = hbSuccess && telemSuccess;
                    string timeStr = DateTime.Now.ToString("HH:mm:ss");
                    string batteryInfo = telemetry.BatteryPercentage.HasValue
                        ? string.Format("Battery: {0}%", telemetry.BatteryPercentage.Value)
                        : "AC Power";

                    string msg = overallSuccess
                        ? string.Format("Check-in successful at {0} ({1}, {2})", timeStr, batteryInfo, telemetry.NetworkType ?? "net")
                        : "Check-in partially completed or server unreachable.";

                    LastCheckinTime = DateTime.UtcNow;
                    _lastStatus = msg;

                    var args = new CheckinEventArgs(overallSuccess, msg, DateTime.UtcNow);
                    RaiseCheckinCompleted(args);
                    return args;
                }
                catch (Exception ex)
                {
                    string err = "Check-in failed: " + ex.Message;
                    _lastStatus = err;
                    var args = new CheckinEventArgs(false, err, DateTime.UtcNow);
                    RaiseCheckinCompleted(args);
                    return args;
                }
            }
        }

        private void OnTimerTick(object state)
        {
            PerformCheckinNow();
        }

        private void RaiseCheckinCompleted(CheckinEventArgs args)
        {
            EventHandler<CheckinEventArgs> handler = CheckinCompleted;
            if (handler != null)
            {
                handler(this, args);
            }
        }

        public void Dispose()
        {
            Stop();
            _timer.Dispose();
        }
    }
}
