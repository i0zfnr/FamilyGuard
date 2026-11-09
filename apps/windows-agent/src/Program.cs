using System;
using System.Threading;
using System.Windows.Forms;
using XennGuard.Agent.Agent;
using XennGuard.Agent.Api;
using XennGuard.Agent.Crypto;
using XennGuard.Agent.Telemetry;
using XennGuard.Agent.UI;

namespace XennGuard.Agent
{
    public static class Program
    {
        [STAThread]
        public static int Main(string[] args)
        {
            WindowsCryptoStore cryptoStore = new WindowsCryptoStore();

            if (args == null || args.Length == 0 || args[0].Equals("--tray", StringComparison.OrdinalIgnoreCase))
            {
                Application.EnableVisualStyles();
                Application.SetCompatibleTextRenderingDefault(false);

                AgentDaemon daemon = new AgentDaemon(cryptoStore, 15);
                TrayNotificationContext context = new TrayNotificationContext(daemon, cryptoStore);
                Application.Run(context);
                return 0;
            }

            string command = args[0].ToLowerInvariant();

            switch (command)
            {
                case "--help":
                case "-h":
                case "/?":
                    PrintUsage();
                    return 0;

                case "--status":
                    return ShowStatus(cryptoStore);

                case "--checkin":
                    return DoCheckin(cryptoStore);

                case "--clear":
                    cryptoStore.ClearCredentials();
                    Console.WriteLine("Local device credentials cleared successfully.");
                    return 0;

                case "--enroll":
                    return DoEnroll(cryptoStore, args);

                case "--daemon":
                    return RunDaemon(cryptoStore);

                case "--pubkey":
                    string pem = cryptoStore.GetOrGeneratePublicKeyPem();
                    Console.WriteLine(pem);
                    return 0;

                default:
                    Console.WriteLine("Unknown command: " + args[0]);
                    PrintUsage();
                    return 1;
            }
        }

        private static int ShowStatus(WindowsCryptoStore cryptoStore)
        {
            DeviceCredential cred = cryptoStore.LoadCredentials();
            Console.WriteLine("=== XennGuard Windows Agent Status ===");
            if (cred == null)
            {
                Console.WriteLine("Enrollment Status: NOT ENROLLED");
            }
            else
            {
                Console.WriteLine("Enrollment Status: ENROLLED");
                Console.WriteLine("Server:            " + cred.Server);
                Console.WriteLine("Device ID:         " + cred.DeviceId);
                Console.WriteLine("Credential Store:  Windows DPAPI (CurrentUser)");
            }

            Console.WriteLine("Identity Key:      RSA-2048 (CNG/CryptoAPI)");
            Console.WriteLine("Zero Covert Tracking: STRICTLY ENFORCED (Notification visible on active monitoring)");

            Console.WriteLine("\n--- Current Hardware Telemetry ---");
            WindowsTelemetryData data = WindowsTelemetryCollector.Collect();
            Console.WriteLine("Battery Level:     " + (data.BatteryPercentage.HasValue ? data.BatteryPercentage.Value + "%" : "AC / Desktop"));
            Console.WriteLine("Charging / AC:     " + (data.Charging.HasValue ? (data.Charging.Value ? "Yes (AC)" : "No (Battery)") : "Unknown"));
            Console.WriteLine("Storage Total:     " + (data.StorageTotal.HasValue ? (data.StorageTotal.Value / (1024 * 1024 * 1024)) + " GB" : "N/A"));
            Console.WriteLine("Storage Available: " + (data.StorageAvailable.HasValue ? (data.StorageAvailable.Value / (1024 * 1024 * 1024)) + " GB" : "N/A"));
            Console.WriteLine("Active Network:    " + (data.NetworkType ?? "none"));
            return 0;
        }

        private static int DoCheckin(WindowsCryptoStore cryptoStore)
        {
            using (AgentDaemon daemon = new AgentDaemon(cryptoStore))
            {
                Console.WriteLine("Executing manual check-in...");
                CheckinEventArgs res = daemon.PerformCheckinNow();
                Console.WriteLine("Result: " + (res.Success ? "SUCCESS" : "FAILED"));
                Console.WriteLine("Details: " + res.StatusMessage);
                return res.Success ? 0 : 1;
            }
        }

        private static int DoEnroll(WindowsCryptoStore cryptoStore, string[] args)
        {
            if (args.Length < 4)
            {
                Console.WriteLine("Error: Missing required enrollment arguments.");
                Console.WriteLine("Usage: XennGuardAgent.exe --enroll <server_url> <challenge_id> <challenge_token> [device_name]");
                return 1;
            }

            string server = args[1];
            string challengeId = args[2];
            string challengeToken = args[3];
            string deviceName = args.Length >= 5 ? args[4] : Environment.MachineName;

            try
            {
                Console.WriteLine("Preparing enrollment cryptographic proof...");
                string publicKeyPem = cryptoStore.GetOrGeneratePublicKeyPem();
                string signature = cryptoStore.SignChallenge(challengeId, challengeToken);

                Console.WriteLine("Connecting to " + server + "...");
                EnrollmentResult result = FamilyGuardApiClient.EnrollDevice(
                    server,
                    challengeId,
                    challengeToken,
                    deviceName,
                    publicKeyPem,
                    signature
                );

                cryptoStore.SaveCredentials(server, result.DeviceToken, result.DeviceId);
                Console.WriteLine("Enrollment successful!");
                Console.WriteLine("Device ID: " + result.DeviceId);
                Console.WriteLine("Expires:   " + result.ExpiresAt);
                Console.WriteLine("Credentials securely stored via Windows DPAPI.");
                return 0;
            }
            catch (Exception ex)
            {
                Console.WriteLine("Enrollment failed: " + ex.Message);
                return 1;
            }
        }

        private static int RunDaemon(WindowsCryptoStore cryptoStore)
        {
            Console.WriteLine("Starting XennGuard Agent console daemon (Press Ctrl+C to terminate)...");
            Console.WriteLine("Zero Covert Tracking Notice: Background telemetry is active.");

            using (AgentDaemon daemon = new AgentDaemon(cryptoStore, 15))
            {
                daemon.CheckinCompleted += (s, e) =>
                {
                    Console.WriteLine("[{0}] Check-in {1}: {2}",
                        e.Timestamp.ToLocalTime().ToString("T"),
                        e.Success ? "OK" : "ERR",
                        e.StatusMessage
                    );
                };

                daemon.Start();

                ManualResetEvent quitEvent = new ManualResetEvent(false);
                Console.CancelKeyPress += (s, e) =>
                {
                    e.Cancel = true;
                    quitEvent.Set();
                };

                quitEvent.WaitOne();
                daemon.Stop();
                Console.WriteLine("Daemon stopped.");
                return 0;
            }
        }

        private static void PrintUsage()
        {
            Console.WriteLine("XennGuard Windows Agent — Secure Device Protection Client");
            Console.WriteLine("Usage:");
            Console.WriteLine("  XennGuardAgent.exe [--tray]                               Run in System Tray with active indicator");
            Console.WriteLine("  XennGuardAgent.exe --daemon                               Run as continuous console daemon");
            Console.WriteLine("  XennGuardAgent.exe --enroll <server> <id> <token> [name]  Enroll device using RSA challenge signature");
            Console.WriteLine("  XennGuardAgent.exe --checkin                              Perform immediate heartbeat and telemetry check-in");
            Console.WriteLine("  XennGuardAgent.exe --status                               Show enrollment and hardware status");
            Console.WriteLine("  XennGuardAgent.exe --clear                                Clear stored DPAPI credentials");
            Console.WriteLine("  XennGuardAgent.exe --pubkey                               Print device public identity key in PEM format");
        }
    }
}
