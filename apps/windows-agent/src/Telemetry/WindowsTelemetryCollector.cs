using System;
using System.IO;
using System.Net.NetworkInformation;
using System.Text;
using System.Windows.Forms;

namespace XennGuard.Agent.Telemetry
{
    public class WindowsTelemetryData
    {
        public int? BatteryPercentage { get; set; }
        public bool? Charging { get; set; }
        public long? StorageTotal { get; set; }
        public long? StorageAvailable { get; set; }
        public string NetworkType { get; set; }

        public void Validate()
        {
            if (BatteryPercentage.HasValue)
            {
                if (BatteryPercentage.Value < 0 || BatteryPercentage.Value > 100)
                {
                    throw new ArgumentOutOfRangeException("BatteryPercentage", "Battery percentage must be between 0 and 100.");
                }
            }
            if (StorageTotal.HasValue && StorageTotal.Value < 0)
            {
                throw new ArgumentOutOfRangeException("StorageTotal", "Storage total must be non-negative.");
            }
            if (StorageAvailable.HasValue && StorageAvailable.Value < 0)
            {
                throw new ArgumentOutOfRangeException("StorageAvailable", "Storage available must be non-negative.");
            }
            if (StorageTotal.HasValue && StorageAvailable.HasValue && StorageAvailable.Value > StorageTotal.Value)
            {
                throw new InvalidOperationException("Available storage cannot exceed total storage.");
            }

            if (!string.IsNullOrEmpty(NetworkType))
            {
                string t = NetworkType.ToLowerInvariant();
                if (t != "wifi" && t != "cellular" && t != "ethernet" && t != "none" && t != "other")
                {
                    throw new ArgumentException("Invalid network type: " + NetworkType, "NetworkType");
                }
            }
        }

        public string ToJson()
        {
            Validate();

            StringBuilder sb = new StringBuilder();
            sb.Append("{");
            bool first = true;

            if (BatteryPercentage.HasValue)
            {
                sb.AppendFormat("\"battery_percentage\":{0}", BatteryPercentage.Value);
                first = false;
            }

            if (Charging.HasValue)
            {
                if (!first) sb.Append(",");
                sb.AppendFormat("\"charging\":{0}", Charging.Value ? "true" : "false");
                first = false;
            }

            if (StorageTotal.HasValue)
            {
                if (!first) sb.Append(",");
                sb.AppendFormat("\"storage_total\":{0}", StorageTotal.Value);
                first = false;
            }

            if (StorageAvailable.HasValue)
            {
                if (!first) sb.Append(",");
                sb.AppendFormat("\"storage_available\":{0}", StorageAvailable.Value);
                first = false;
            }

            if (!string.IsNullOrEmpty(NetworkType))
            {
                if (!first) sb.Append(",");
                sb.AppendFormat("\"network_type\":\"{0}\"", NetworkType.ToLowerInvariant());
                first = false;
            }

            sb.Append("}");
            return sb.ToString();
        }
    }

    public static class WindowsTelemetryCollector
    {
        public static WindowsTelemetryData Collect()
        {
            var data = new WindowsTelemetryData();

            // 1. Battery & Power Status
            try
            {
                PowerStatus power = SystemInformation.PowerStatus;
                if (power.PowerLineStatus == PowerLineStatus.Online)
                {
                    data.Charging = true;
                }
                else if (power.PowerLineStatus == PowerLineStatus.Offline)
                {
                    data.Charging = false;
                }

                float percent = power.BatteryLifePercent;
                if (percent >= 0.0f && percent <= 1.0f)
                {
                    data.BatteryPercentage = (int)Math.Round(percent * 100.0f);
                }
            }
            catch (Exception)
            {
                // Graceful fallback for headless or restricted environments
            }

            // 2. Storage Information
            try
            {
                long totalBytes = 0;
                long availableBytes = 0;
                bool found = false;

                string sysRoot = Path.GetPathRoot(Environment.SystemDirectory);
                DriveInfo[] drives = DriveInfo.GetDrives();

                foreach (DriveInfo drive in drives)
                {
                    if (drive.IsReady && drive.DriveType == DriveType.Fixed)
                    {
                        if (string.Equals(drive.RootDirectory.FullName, sysRoot, StringComparison.OrdinalIgnoreCase))
                        {
                            totalBytes = drive.TotalSize;
                            availableBytes = drive.AvailableFreeSpace;
                            found = true;
                            break;
                        }
                    }
                }

                if (!found && drives.Length > 0)
                {
                    foreach (DriveInfo drive in drives)
                    {
                        if (drive.IsReady && drive.DriveType == DriveType.Fixed)
                        {
                            totalBytes += drive.TotalSize;
                            availableBytes += drive.AvailableFreeSpace;
                            found = true;
                        }
                    }
                }

                if (found)
                {
                    data.StorageTotal = totalBytes;
                    data.StorageAvailable = Math.Min(availableBytes, totalBytes);
                }
            }
            catch (Exception)
            {
                // Storage metrics unavailable
            }

            // 3. Network Connectivity
            try
            {
                data.NetworkType = DetectNetworkType();
            }
            catch (Exception)
            {
                data.NetworkType = "other";
            }

            return data;
        }

        public static string DetectNetworkType()
        {
            if (!NetworkInterface.GetIsNetworkAvailable())
            {
                return "none";
            }

            NetworkInterface[] interfaces = NetworkInterface.GetAllNetworkInterfaces();
            string bestMatch = "none";

            foreach (NetworkInterface ni in interfaces)
            {
                if (ni.OperationalStatus != OperationalStatus.Up) continue;
                if (ni.NetworkInterfaceType == NetworkInterfaceType.Loopback ||
                    ni.NetworkInterfaceType == NetworkInterfaceType.Tunnel) continue;

                // Priority: WiFi > Cellular > Ethernet > Other
                if (ni.NetworkInterfaceType == NetworkInterfaceType.Wireless80211)
                {
                    return "wifi";
                }
                if (ni.NetworkInterfaceType.ToString().IndexOf("Wwan", StringComparison.OrdinalIgnoreCase) >= 0 ||
                    ni.NetworkInterfaceType == NetworkInterfaceType.Ppp)
                {
                    bestMatch = "cellular";
                }
                else if (ni.NetworkInterfaceType == NetworkInterfaceType.Ethernet && bestMatch != "cellular")
                {
                    bestMatch = "ethernet";
                }
                else if (bestMatch == "none")
                {
                    bestMatch = "other";
                }
            }

            return bestMatch;
        }
    }
}
