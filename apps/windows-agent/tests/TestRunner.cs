using System;
using System.Collections.Generic;

namespace XennGuard.Agent.Tests
{
    public static class TestRunner
    {
        private static int _passedCount = 0;
        private static int _failedCount = 0;
        private static readonly List<string> _failures = new List<string>();

        public static void RecordAssertion(string testName, bool condition)
        {
            if (condition)
            {
                _passedCount++;
                Console.WriteLine("[PASS] " + testName);
            }
            else
            {
                _failedCount++;
                _failures.Add(testName);
                Console.WriteLine("[FAIL] " + testName);
            }
        }

        public static int Main(string[] args)
        {
            Console.WriteLine("========================================");
            Console.WriteLine("  XennGuard Windows Agent Test Suite    ");
            Console.WriteLine("========================================\n");

            DateTime start = DateTime.UtcNow;

            Console.WriteLine("--- Running Crypto Tests (RSA & DPAPI) ---");
            try
            {
                CryptoTests.RunAll();
            }
            catch (Exception ex)
            {
                _failedCount++;
                _failures.Add("CryptoTests unhandled exception: " + ex.Message);
                Console.WriteLine("[CRASH] CryptoTests: " + ex);
            }

            Console.WriteLine("\n--- Running Telemetry Tests ---");
            try
            {
                TelemetryTests.RunAll();
            }
            catch (Exception ex)
            {
                _failedCount++;
                _failures.Add("TelemetryTests unhandled exception: " + ex.Message);
                Console.WriteLine("[CRASH] TelemetryTests: " + ex);
            }

            Console.WriteLine("\n--- Running API Client Tests ---");
            try
            {
                ApiClientTests.RunAll();
            }
            catch (Exception ex)
            {
                _failedCount++;
                _failures.Add("ApiClientTests unhandled exception: " + ex.Message);
                Console.WriteLine("[CRASH] ApiClientTests: " + ex);
            }

            TimeSpan elapsed = DateTime.UtcNow - start;
            Console.WriteLine("\n========================================");
            Console.WriteLine(string.Format("Tests Finished in {0:0.00}s", elapsed.TotalSeconds));
            Console.WriteLine(string.Format("Total: {0} | Passed: {1} | Failed: {2}",
                _passedCount + _failedCount, _passedCount, _failedCount));
            Console.WriteLine("========================================");

            if (_failedCount > 0)
            {
                Console.WriteLine("\nFailed Assertions:");
                foreach (string failure in _failures)
                {
                    Console.WriteLine("  - " + failure);
                }
                return 1;
            }

            Console.WriteLine("\nAll tests passed successfully.");
            return 0;
        }
    }
}
