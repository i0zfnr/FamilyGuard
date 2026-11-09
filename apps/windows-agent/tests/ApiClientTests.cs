using System;
using XennGuard.Agent.Api;

namespace XennGuard.Agent.Tests
{
    public static class ApiClientTests
    {
        public static void RunAll()
        {
            TestValidServerOrigins();
            TestRejectsInvalidServerOrigins();
        }

        private static void TestValidServerOrigins()
        {
            string s1 = FamilyGuardApiClient.ValidateServerOrigin("https://example.com");
            Assert("Normalizes https://example.com", s1 == "https://example.com");

            string s2 = FamilyGuardApiClient.ValidateServerOrigin("https://example.com:8443/");
            Assert("Normalizes https://example.com:8443/", s2 == "https://example.com:8443");

            string s3 = FamilyGuardApiClient.ValidateServerOrigin("  https://guard.internal.net  ");
            Assert("Trims whitespace", s3 == "https://guard.internal.net");
        }

        private static void TestRejectsInvalidServerOrigins()
        {
            string[] invalidOrigins = new string[]
            {
                "http://example.com",
                "https://user:pass@example.com",
                "https://example.com/api/v1",
                "https://example.com/?query=1",
                "https://example.com/#fragment",
                "",
                "ftp://example.com"
            };

            foreach (string inv in invalidOrigins)
            {
                bool caught = false;
                try
                {
                    FamilyGuardApiClient.ValidateServerOrigin(inv);
                }
                catch (ArgumentException)
                {
                    caught = true;
                }
                Assert("Rejects invalid origin: " + inv, caught);
            }
        }

        private static void Assert(string name, bool condition)
        {
            TestRunner.RecordAssertion(name, condition);
        }
    }
}
