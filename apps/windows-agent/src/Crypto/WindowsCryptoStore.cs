using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;

namespace XennGuard.Agent.Crypto
{
    public class DeviceCredential
    {
        public string Server { get; set; }
        public string DeviceToken { get; set; }
        public string DeviceId { get; set; }
        public string ApiKey { get; set; }

        public DeviceCredential(string server, string deviceToken, string deviceId, string apiKey = null)
        {
            Server = server;
            DeviceToken = deviceToken;
            DeviceId = deviceId;
            ApiKey = apiKey;
        }
    }

    public class WindowsCryptoStore
    {
        private const string KeyContainerName = "XennGuard_Device_Identity_RSA";
        private const int KeySizeBits = 2048;
        private static readonly byte[] DpapiEntropy = Encoding.UTF8.GetBytes("XennGuard_DPAPI_Entropy_Salt_2026");

        private readonly string _credentialsPath;

        public WindowsCryptoStore(string customStorageDir = null)
        {
            string baseDir = !string.IsNullOrEmpty(customStorageDir)
                ? customStorageDir
                : Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "XennGuard");

            if (!Directory.Exists(baseDir))
            {
                Directory.CreateDirectory(baseDir);
            }
            _credentialsPath = Path.Combine(baseDir, "device_credentials.dat");
        }

        public string GetOrGeneratePublicKeyPem()
        {
            CspParameters csp = new CspParameters(24) // PROV_RSA_AES
            {
                KeyContainerName = KeyContainerName,
                Flags = CspProviderFlags.UseExistingKey
            };

            RSACryptoServiceProvider rsa = null;
            try
            {
                rsa = new RSACryptoServiceProvider(csp);
            }
            catch (CryptographicException)
            {
                // Key does not exist yet; generate new 2048-bit key
                CspParameters createCsp = new CspParameters(24)
                {
                    KeyContainerName = KeyContainerName
                };
                rsa = new RSACryptoServiceProvider(KeySizeBits, createCsp);
            }

            using (rsa)
            {
                RSAParameters rsaParams = rsa.ExportParameters(false);
                byte[] pubDer = ExportSubjectPublicKeyInfoDer(rsaParams);
                string b64 = Convert.ToBase64String(pubDer, Base64FormattingOptions.InsertLineBreaks);
                return "-----BEGIN PUBLIC KEY-----\n" + b64 + "\n-----END PUBLIC KEY-----\n";
            }
        }

        public string SignChallenge(string challengeId, string challengeToken)
        {
            if (string.IsNullOrEmpty(challengeId)) throw new ArgumentNullException("challengeId");
            if (string.IsNullOrEmpty(challengeToken)) throw new ArgumentNullException("challengeToken");

            string payload = challengeId + ":" + challengeToken;
            byte[] dataBytes = Encoding.UTF8.GetBytes(payload);

            CspParameters csp = new CspParameters(24)
            {
                KeyContainerName = KeyContainerName,
                Flags = CspProviderFlags.UseExistingKey
            };

            using (RSACryptoServiceProvider rsa = new RSACryptoServiceProvider(csp))
            {
                byte[] signature = rsa.SignData(dataBytes, "SHA256");
                return Convert.ToBase64String(signature);
            }
        }

        public void SaveCredentials(string server, string deviceToken, string deviceId, string apiKey = null)
        {
            if (string.IsNullOrEmpty(server)) throw new ArgumentNullException("server");
            if (string.IsNullOrEmpty(deviceToken)) throw new ArgumentNullException("deviceToken");
            if (string.IsNullOrEmpty(deviceId)) throw new ArgumentNullException("deviceId");

            // Simple robust serialization
            string raw = string.Format("{{\"server\":\"{0}\",\"device_token\":\"{1}\",\"device_id\":\"{2}\",\"api_key\":\"{3}\"}}",
                EscapeJson(server), EscapeJson(deviceToken), EscapeJson(deviceId), EscapeJson(apiKey));

            byte[] plaintext = Encoding.UTF8.GetBytes(raw);
            byte[] ciphertext = ProtectedData.Protect(plaintext, DpapiEntropy, DataProtectionScope.CurrentUser);

            File.WriteAllBytes(_credentialsPath, ciphertext);
        }

        public DeviceCredential LoadCredentials()
        {
            if (!File.Exists(_credentialsPath)) return null;

            try
            {
                byte[] ciphertext = File.ReadAllBytes(_credentialsPath);
                byte[] plaintext = ProtectedData.Unprotect(ciphertext, DpapiEntropy, DataProtectionScope.CurrentUser);
                string json = Encoding.UTF8.GetString(plaintext);

                string server = ExtractJsonField(json, "server");
                string token = ExtractJsonField(json, "device_token");
                string deviceId = ExtractJsonField(json, "device_id");
                string apiKey = ExtractJsonField(json, "api_key");

                if (string.IsNullOrEmpty(server) || string.IsNullOrEmpty(token)) return null;
                return new DeviceCredential(server, token, deviceId, apiKey);
            }
            catch (Exception)
            {
                return null;
            }
        }

        public void ClearCredentials()
        {
            if (File.Exists(_credentialsPath))
            {
                File.Delete(_credentialsPath);
            }
        }

        public void DeleteKey()
        {
            try
            {
                CspParameters csp = new CspParameters(24)
                {
                    KeyContainerName = KeyContainerName,
                    Flags = CspProviderFlags.UseExistingKey
                };
                using (RSACryptoServiceProvider rsa = new RSACryptoServiceProvider(csp))
                {
                    rsa.PersistKeyInCsp = false;
                    rsa.Clear();
                }
            }
            catch (Exception)
            {
                // Ignored if key doesn't exist
            }
        }

        public static byte[] ExportSubjectPublicKeyInfoDer(RSAParameters rsaParams)
        {
            byte[] modulus = rsaParams.Modulus;
            byte[] exponent = rsaParams.Exponent;

            using (MemoryStream ms = new MemoryStream())
            {
                using (BinaryWriter bw = new BinaryWriter(ms))
                {
                    // RSAPublicKey sequence: SEQUENCE { INTEGER (modulus), INTEGER (exponent) }
                    byte[] rsaPubKeySeq;
                    using (MemoryStream rsaMs = new MemoryStream())
                    {
                        using (BinaryWriter rsaBw = new BinaryWriter(rsaMs))
                        {
                            byte[] intSeq;
                            using (MemoryStream intMs = new MemoryStream())
                            {
                                using (BinaryWriter intBw = new BinaryWriter(intMs))
                                {
                                    WriteInteger(intBw, modulus);
                                    WriteInteger(intBw, exponent);
                                }
                                intSeq = intMs.ToArray();
                            }
                            WriteSequence(rsaBw, intSeq);
                        }
                        rsaPubKeySeq = rsaMs.ToArray();
                    }

                    // AlgorithmIdentifier: SEQUENCE { OID 1.2.840.113549.1.1.1, NULL }
                    byte[] algId = new byte[] {
                        0x30, 0x0D,
                        0x06, 0x09, 0x2A, 0x86, 0x48, 0x86, 0xF7, 0x0D, 0x01, 0x01, 0x01,
                        0x05, 0x00
                    };

                    // SubjectPublicKeyInfo: SEQUENCE { AlgorithmIdentifier, BIT STRING { RSAPublicKey } }
                    byte[] bitString;
                    using (MemoryStream bsMs = new MemoryStream())
                    {
                        using (BinaryWriter bsBw = new BinaryWriter(bsMs))
                        {
                            bsBw.Write((byte)0x00); // 0 unused bits
                            bsBw.Write(rsaPubKeySeq);
                        }
                        bitString = bsMs.ToArray();
                    }

                    byte[] totalContent;
                    using (MemoryStream tcMs = new MemoryStream())
                    {
                        using (BinaryWriter tcBw = new BinaryWriter(tcMs))
                        {
                            tcBw.Write(algId);
                            WriteBitString(tcBw, bitString);
                        }
                        totalContent = tcMs.ToArray();
                    }

                    WriteSequence(bw, totalContent);
                }
                return ms.ToArray();
            }
        }

        private static void WriteSequence(BinaryWriter bw, byte[] content)
        {
            bw.Write((byte)0x30);
            WriteLength(bw, content.Length);
            bw.Write(content);
        }

        private static void WriteBitString(BinaryWriter bw, byte[] content)
        {
            bw.Write((byte)0x03);
            WriteLength(bw, content.Length);
            bw.Write(content);
        }

        private static void WriteInteger(BinaryWriter bw, byte[] rawInt)
        {
            bw.Write((byte)0x02);
            if ((rawInt[0] & 0x80) != 0)
            {
                WriteLength(bw, rawInt.Length + 1);
                bw.Write((byte)0x00);
                bw.Write(rawInt);
            }
            else
            {
                WriteLength(bw, rawInt.Length);
                bw.Write(rawInt);
            }
        }

        private static void WriteLength(BinaryWriter bw, int length)
        {
            if (length < 0x80)
            {
                bw.Write((byte)length);
            }
            else if (length <= 0xFF)
            {
                bw.Write((byte)0x81);
                bw.Write((byte)length);
            }
            else
            {
                bw.Write((byte)0x82);
                bw.Write((byte)(length >> 8));
                bw.Write((byte)(length & 0xFF));
            }
        }

        private static string EscapeJson(string s)
        {
            if (s == null) return "";
            return s.Replace("\\", "\\\\").Replace("\"", "\\\"");
        }

        private static string ExtractJsonField(string json, string field)
        {
            string pattern = "\"" + field + "\":\"";
            int idx = json.IndexOf(pattern, StringComparison.Ordinal);
            if (idx == -1) return null;
            int start = idx + pattern.Length;
            int end = json.IndexOf("\"", start, StringComparison.Ordinal);
            if (end == -1) return null;
            return json.Substring(start, end - start);
        }
    }
}
