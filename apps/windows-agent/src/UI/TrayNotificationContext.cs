using System;
using System.Drawing;
using System.Windows.Forms;
using XennGuard.Agent.Agent;
using XennGuard.Agent.Crypto;

namespace XennGuard.Agent.UI
{
    public class TrayNotificationContext : ApplicationContext
    {
        private readonly NotifyIcon _trayIcon;
        private readonly ContextMenuStrip _contextMenu;
        private readonly ToolStripMenuItem _statusMenuItem;
        private readonly ToolStripMenuItem _lastCheckinMenuItem;
        private readonly AgentDaemon _daemon;
        private readonly WindowsCryptoStore _cryptoStore;

        public TrayNotificationContext(AgentDaemon daemon, WindowsCryptoStore cryptoStore)
        {
            if (daemon == null) throw new ArgumentNullException("daemon");
            if (cryptoStore == null) throw new ArgumentNullException("cryptoStore");
            _daemon = daemon;
            _cryptoStore = cryptoStore;


            _contextMenu = new ContextMenuStrip();

            _statusMenuItem = new ToolStripMenuItem("Status: Active (Zero Covert Tracking)");
            _statusMenuItem.Enabled = false;
            _statusMenuItem.Font = new Font(_statusMenuItem.Font, FontStyle.Bold);

            _lastCheckinMenuItem = new ToolStripMenuItem("Last Check-in: Never");
            _lastCheckinMenuItem.Enabled = false;

            ToolStripMenuItem checkinNowItem = new ToolStripMenuItem("Check-in Now", null, OnCheckinNowClicked);
            ToolStripMenuItem viewDetailsItem = new ToolStripMenuItem("Device Details", null, OnViewDetailsClicked);
            ToolStripMenuItem unenrollItem = new ToolStripMenuItem("Remove Enrollment", null, OnUnenrollClicked);
            ToolStripSeparator separator = new ToolStripSeparator();
            ToolStripMenuItem exitItem = new ToolStripMenuItem("Exit", null, OnExitClicked);

            _contextMenu.Items.Add(_statusMenuItem);
            _contextMenu.Items.Add(_lastCheckinMenuItem);
            _contextMenu.Items.Add(new ToolStripSeparator());
            _contextMenu.Items.Add(checkinNowItem);
            _contextMenu.Items.Add(viewDetailsItem);
            _contextMenu.Items.Add(unenrollItem);
            _contextMenu.Items.Add(separator);
            _contextMenu.Items.Add(exitItem);

            _trayIcon = new NotifyIcon
            {
                Icon = CreateShieldIcon(),
                ContextMenuStrip = _contextMenu,
                Text = TruncateTooltip("XennGuard Active Protection - Transparent Monitoring"),
                Visible = true
            };

            _daemon.CheckinCompleted += OnDaemonCheckinCompleted;

            // Display ongoing transparency balloon notification
            _trayIcon.ShowBalloonTip(
                4000,
                "XennGuard Active Protection",
                "Transparent device protection is running with your explicit consent. Zero covert tracking.",
                ToolTipIcon.Info
            );

            // Start daemon
            _daemon.Start();
        }

        private void OnDaemonCheckinCompleted(object sender, CheckinEventArgs e)
        {
            if (_trayIcon == null) return;

            string time = e.Timestamp.ToLocalTime().ToString("HH:mm:ss");
            _lastCheckinMenuItem.Text = string.Format("Last Check-in: {0}", time);

            if (e.Success)
            {
                _statusMenuItem.Text = "Status: Protected (Reporting Active)";
                _trayIcon.Text = TruncateTooltip(string.Format("XennGuard Active ({0})", time));
            }
            else
            {
                _statusMenuItem.Text = "Status: Check-in Pending";
                _trayIcon.Text = TruncateTooltip("XennGuard Active - Check-in Pending");
            }
        }

        private void OnCheckinNowClicked(object sender, EventArgs e)
        {
            var res = _daemon.PerformCheckinNow();
            _trayIcon.ShowBalloonTip(
                2000,
                "XennGuard Check-in",
                res.StatusMessage,
                res.Success ? ToolTipIcon.Info : ToolTipIcon.Warning
            );
        }

        private void OnViewDetailsClicked(object sender, EventArgs e)
        {
            var cred = _cryptoStore.LoadCredentials();
            if (cred != null)
            {
                string info = string.Format(
                    "XennGuard Windows Agent\n\n" +
                    "Status: Active\n" +
                    "Server: {0}\n" +
                    "Device ID: {1}\n" +
                    "Last Report: {2}\n\n" +
                    "Zero Covert Tracking Policy: All telemetry is visible and consented.",
                    cred.Server,
                    cred.DeviceId,
                    _daemon.LastCheckinTime.HasValue ? _daemon.LastCheckinTime.Value.ToLocalTime().ToString("g") : "Never"
                );
                MessageBox.Show(info, "XennGuard Device Details", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            else
            {
                MessageBox.Show("This device is not currently enrolled.", "XennGuard Device Details", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }
        }

        private void OnUnenrollClicked(object sender, EventArgs e)
        {
            DialogResult result = MessageBox.Show(
                "Are you sure you want to remove local enrollment data?\nThis will stop telemetry reports from this computer.",
                "Remove Enrollment",
                MessageBoxButtons.YesNo,
                MessageBoxIcon.Question
            );

            if (result == DialogResult.Yes)
            {
                _daemon.Stop();
                _cryptoStore.ClearCredentials();
                _statusMenuItem.Text = "Status: Unenrolled";
                _lastCheckinMenuItem.Text = "Last Check-in: None";
                _trayIcon.ShowBalloonTip(3000, "XennGuard", "Local enrollment removed. Telemetry stopped.", ToolTipIcon.Info);
            }
        }

        private void OnExitClicked(object sender, EventArgs e)
        {
            _daemon.Stop();
            _daemon.Dispose();
            _trayIcon.Visible = false;
            _trayIcon.Dispose();
            ExitThread();
        }

        private static string TruncateTooltip(string text)
        {
            if (text == null) return "";
            if (text.Length <= 63) return text;
            return text.Substring(0, 60) + "...";
        }

        private static Icon CreateShieldIcon()
        {
            // Create a clean programmatic 16x16 shield bitmap
            using (Bitmap bmp = new Bitmap(16, 16))
            {
                using (Graphics g = Graphics.FromImage(bmp))
                {
                    g.Clear(Color.Transparent);
                    using (Brush bgBrush = new SolidBrush(Color.FromArgb(41, 70, 51))) // Xenn primary green
                    {
                        Point[] shieldPoints = new Point[] {
                            new Point(2, 2),
                            new Point(13, 2),
                            new Point(13, 8),
                            new Point(8, 14),
                            new Point(2, 8)
                        };
                        g.FillPolygon(bgBrush, shieldPoints);
                    }
                    using (Pen pen = new Pen(Color.FromArgb(106, 142, 108), 1))
                    {
                        Point[] shieldPoints = new Point[] {
                            new Point(2, 2),
                            new Point(13, 2),
                            new Point(13, 8),
                            new Point(8, 14),
                            new Point(2, 8)
                        };
                        g.DrawPolygon(pen, shieldPoints);
                    }
                }
                IntPtr hIcon = bmp.GetHicon();
                return Icon.FromHandle(hIcon);
            }
        }
    }
}
