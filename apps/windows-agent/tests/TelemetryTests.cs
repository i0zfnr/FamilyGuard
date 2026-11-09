using System;
using XennGuard.Agent.Telemetry;

namespace XennGuard.Agent.Tests
{
    public static class TelemetryTests
    {
        public static void RunAll()
        {
            TestTelemetryJsonSerialization();
            TestBatteryValidationRules();
            TestStorageValidationRules();
            TestNetworkTypeValidationRules();
            TestLiveCollectorBounds();
        }

        private static void TestTelemetryJsonSerialization()
        {
            var data = new WindowsTelemetryData
            {
                BatteryPercentage = 92,
                Charging = true,
                StorageTotal = 500000000000L,
                StorageAvailable = 250000000000L,
                NetworkType = "wifi"
            };

            string json = data.ToJson();
            Assert("JSON contains battery percentage", json.IndexOf("\"battery_percentage\":92") >= 0);
            Assert("JSON contains charging true", json.IndexOf("\"charging\":true") >= 0);
            Assert("JSON contains storage total", json.IndexOf("\"storage_total\":500000000000") >= 0);
            Assert("JSON contains storage available", json.IndexOf("\"storage_available\":250000000000") >= 0);
            Assert("JSON contains network type wifi", json.IndexOf("\"network_type\":\"wifi\"") >= 0);
        }

        private static void TestBatteryValidationRules()
        {
            var invalidHigh = new WindowsTelemetryData { BatteryPercentage = 101 };
            bool caughtHigh = false;
            try { invalidHigh.Validate(); } catch (ArgumentOutOfRangeException) { caughtHigh = true; }
            Assert("Rejects battery > 100", caughtHigh);

            var invalidLow = new WindowsTelemetryData { BatteryPercentage = -1 };
            bool caughtLow = false;
            try { invalidLow.Validate(); } catch (ArgumentOutOfRangeException) { caughtLow = true; }
            Assert("Rejects battery < 0", caughtLow);

            var validZero = new WindowsTelemetryData { BatteryPercentage = 0 };
            bool validZeroPassed = true;
            try { validZero.Validate(); } catch (Exception) { validZeroPassed = false; }
            Assert("Accepts battery = 0", validZeroPassed);

            var validHundred = new WindowsTelemetryData { BatteryPercentage = 100 };
            bool validHundredPassed = true;
            try { validHundred.Validate(); } catch (Exception) { validHundredPassed = false; }
            Assert("Accepts battery = 100", validHundredPassed);
        }

        private static void TestStorageValidationRules()
        {
            var invalidAvailable = new WindowsTelemetryData
            {
                StorageTotal = 1000L,
                StorageAvailable = 2000L
            };
            bool caughtOver = false;
            try { invalidAvailable.Validate(); } catch (InvalidOperationException) { caughtOver = true; }
            Assert("Rejects available storage exceeding total storage", caughtOver);

            var negativeTotal = new WindowsTelemetryData { StorageTotal = -10L, StorageAvailable = 0L };
            bool caughtNeg = false;
            try { negativeTotal.Validate(); } catch (ArgumentOutOfRangeException) { caughtNeg = true; }
            Assert("Rejects negative storage total", caughtNeg);

            var validStorage = new WindowsTelemetryData { StorageTotal = 1000L, StorageAvailable = 1000L };
            bool validStoragePassed = true;
            try { validStorage.Validate(); } catch (Exception) { validStoragePassed = false; }
            Assert("Accepts available equal to total storage", validStoragePassed);
        }

        private static void TestNetworkTypeValidationRules()
        {
            string[] validTypes = new string[] { "wifi", "cellular", "ethernet", "none", "other" };
            foreach (string t in validTypes)
            {
                var telem = new WindowsTelemetryData { NetworkType = t };
                bool passed = true;
                try { telem.Validate(); } catch (Exception) { passed = false; }
                Assert("Accepts network type: " + t, passed);
            }

            var invalidType = new WindowsTelemetryData { NetworkType = "bluetooth" };
            bool caughtInvalid = false;
            try { invalidType.Validate(); } catch (ArgumentException) { caughtInvalid = true; }
            Assert("Rejects unsupported network type", caughtInvalid);
        }

        private static void TestLiveCollectorBounds()
        {
            WindowsTelemetryData data = WindowsTelemetryCollector.Collect();
            Assert("Live telemetry object returned", data != null);

            if (data.BatteryPercentage.HasValue)
            {
                Assert("Live battery in range 0..100", data.BatteryPercentage.Value >= 0 && data.BatteryPercentage.Value <= 100);
            }

            if (data.StorageTotal.HasValue && data.StorageAvailable.HasValue)
            {
                Assert("Live storage total non-negative", data.StorageTotal.Value >= 0);
                Assert("Live storage available <= total", data.StorageAvailable.Value <= data.StorageTotal.Value);
            }

            if (!string.IsNullOrEmpty(data.NetworkType))
            {
                string t = data.NetworkType;
                bool valid = t == "wifi" || t == "cellular" || t == "ethernet" || t == "none" || t == "other";
                Assert("Live network type is valid enum", valid);
            }
        }

        private static void Assert(string name, bool condition)
        {
            TestRunner.RecordAssertion(name, condition);
        }
    }
}
