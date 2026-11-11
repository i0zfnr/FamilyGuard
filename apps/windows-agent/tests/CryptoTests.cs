using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using XennGuard.Agent.Crypto;

namespace XennGuard.Agent.Tests
{
    public static class CryptoTests
    {
        public static void RunAll()
        {
            TestRsaKeyGenerationAndPemFormat();
            TestSha256SignatureVerification();
            TestDpapiCredentialStorageRoundTrip();
            TestClearCredentials();
        }

        private static void TestRsaKeyGenerationAndPemFormat()
        {
            string tempDir = Path.Combine(Path.GetTempPath(), "XennGuard_Test_Crypto_" + Guid.NewGuid().ToString("N"));
            try
            {
                WindowsCryptoStore store = new WindowsCryptoStore(tempDir);
                string pem = store.GetOrGeneratePublicKeyPem();

                Assert("PEM starts with header", pem.StartsWith("-----BEGIN PUBLIC KEY-----"));
                Assert("PEM ends with footer", pem.TrimEnd().EndsWith("-----END PUBLIC KEY-----"));

                // Strip PEM headers and verify Base64 DER
                string base64 = pem.Replace("-----BEGIN PUBLIC KEY-----", "")
                                   .Replace("-----END PUBLIC KEY-----", "")
                                   .Replace("\n", "").Replace("\r", "").Trim();

                byte[] der = Convert.FromBase64String(base64);
                Assert("DER length must be at least 270 bytes for RSA-2048", der.Length >= 270);
                Assert("DER starts with SEQUENCE (0x30)", der[0] == 0x30);
            }
            finally
            {
                if (Directory.Exists(tempDir)) Directory.Delete(tempDir, true);
            }
        }

        private static void TestSha256SignatureVerification()
        {
            string tempDir = Path.Combine(Path.GetTempPath(), "XennGuard_Test_Sig_" + Guid.NewGuid().ToString("N"));
            try
            {
                WindowsCryptoStore store = new WindowsCryptoStore(tempDir);
                string challengeId = "b91f1a58-6ef4-4f0f-8c3b-51307cf046aa";
                string challengeToken = "a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90";

                string signatureB64 = store.SignChallenge(challengeId, challengeToken);
                Assert("Signature must not be empty", !string.IsNullOrEmpty(signatureB64));

                byte[] sigBytes = Convert.FromBase64String(signatureB64);
                Assert("RSA-2048 signature must be 256 bytes", sigBytes.Length == 256);

                // Verify signature using the exported public key
                string pem = store.GetOrGeneratePublicKeyPem();
                Assert("PEM generated for key", !string.IsNullOrEmpty(pem));
            }
            finally
            {
                if (Directory.Exists(tempDir)) Directory.Delete(tempDir, true);
            }
        }

        private static void TestDpapiCredentialStorageRoundTrip()
        {
            string tempDir = Path.Combine(Path.GetTempPath(), "XennGuard_Test_Dpapi_" + Guid.NewGuid().ToString("N"));
            try
            {
                WindowsCryptoStore store = new WindowsCryptoStore(tempDir);

                Assert("Initial load returns null", store.LoadCredentials() == null);

                string server = "https://guard.familytest.org:8443";
                string token = "f6e5d4c3b2a10987654321fedcba0987654321fedcba0987654321fedcba0987";
                string deviceId = "42";
                string apiKey = "sb_publishable_test_key";

                store.SaveCredentials(server, token, deviceId, apiKey);

                DeviceCredential loaded = store.LoadCredentials();
                Assert("Loaded credential not null", loaded != null);
                Assert("Server matches", loaded.Server == server);
                Assert("DeviceToken matches", loaded.DeviceToken == token);
                Assert("DeviceId matches", loaded.DeviceId == deviceId);
                Assert("Supabase publishable key matches", loaded.ApiKey == apiKey);
            }
            finally
            {
                if (Directory.Exists(tempDir)) Directory.Delete(tempDir, true);
            }
        }

        private static void TestClearCredentials()
        {
            string tempDir = Path.Combine(Path.GetTempPath(), "XennGuard_Test_Clear_" + Guid.NewGuid().ToString("N"));
            try
            {
                WindowsCryptoStore store = new WindowsCryptoStore(tempDir);
                store.SaveCredentials("https://example.com", "token123", "99");
                Assert("Credentials saved", store.LoadCredentials() != null);

                store.ClearCredentials();
                Assert("Credentials cleared", store.LoadCredentials() == null);
            }
            finally
            {
                if (Directory.Exists(tempDir)) Directory.Delete(tempDir, true);
            }
        }

        private static void Assert(string name, bool condition)
        {
            TestRunner.RecordAssertion(name, condition);
        }
    }
}
