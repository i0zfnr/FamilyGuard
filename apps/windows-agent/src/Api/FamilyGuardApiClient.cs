using System;
using System.IO;
using System.Net;
using System.Text;

namespace XennGuard.Agent.Api
{
    public class EnrollmentResult
    {
        public string DeviceId { get; set; }
        public string DeviceToken { get; set; }
        public string ExpiresAt { get; set; }
    }

    public static class FamilyGuardApiClient
    {
        public static string ValidateServerOrigin(string serverUrl)
        {
            if (string.IsNullOrWhiteSpace(serverUrl))
            {
                throw new ArgumentException("Server URL cannot be empty.", "serverUrl");
            }

            Uri uri;
            if (!Uri.TryCreate(serverUrl.Trim(), UriKind.Absolute, out uri))
            {
                throw new ArgumentException("Invalid server URL format.", "serverUrl");
            }

            if (!string.Equals(uri.Scheme, "https", StringComparison.OrdinalIgnoreCase))
            {
                throw new ArgumentException("Server address must use the HTTPS scheme.", "serverUrl");
            }

            if (!string.IsNullOrEmpty(uri.UserInfo))
            {
                throw new ArgumentException("Server address must not include user credentials.", "serverUrl");
            }

            if (!string.IsNullOrEmpty(uri.Query) || !string.IsNullOrEmpty(uri.Fragment))
            {
                throw new ArgumentException("Server address must not include queries or fragments.", "serverUrl");
            }

            if (uri.AbsolutePath != "/" && !string.IsNullOrEmpty(uri.AbsolutePath))
            {
                throw new ArgumentException("Server address must not include a path.", "serverUrl");
            }

            return uri.GetLeftPart(UriPartial.Authority);
        }

        public static EnrollmentResult EnrollDevice(
            string serverUrl,
            string challengeId,
            string challengeToken,
            string deviceName,
            string publicKeyPem,
            string signatureBase64,
            string apiKey = null)
        {
            string origin = ValidateServerOrigin(serverUrl);
            string endpoint = (string.IsNullOrEmpty(apiKey) ? origin : origin + "/functions/v1/xennguard-api") + "/api/v1/devices/enroll";

            string jsonBody = string.Format(
                "{{\"challenge_id\":\"{0}\",\"challenge_token\":\"{1}\",\"device_name\":\"{2}\",\"platform\":\"windows\",\"public_key\":\"{3}\",\"signature\":\"{4}\",\"owner_approved\":true}}",
                EscapeJson(challengeId),
                EscapeJson(challengeToken),
                EscapeJson(deviceName),
                EscapeJson(publicKeyPem),
                EscapeJson(signatureBase64)
            );

            string responseJson = PostJson(endpoint, jsonBody, null, apiKey);

            string deviceId = ExtractJsonField(responseJson, "device_id");
            string deviceToken = ExtractJsonField(responseJson, "device_token");
            string expiresAt = ExtractJsonField(responseJson, "expires_at");

            if (string.IsNullOrEmpty(deviceToken))
            {
                throw new InvalidOperationException("Enrollment succeeded but server did not return a device token.");
            }

            return new EnrollmentResult
            {
                DeviceId = deviceId,
                DeviceToken = deviceToken,
                ExpiresAt = expiresAt
            };
        }

        public static bool SendHeartbeat(string serverUrl, string deviceToken, string apiKey = null)
        {
            string origin = ValidateServerOrigin(serverUrl);
            string endpoint = (string.IsNullOrEmpty(apiKey) ? origin : origin + "/functions/v1/xennguard-api") + "/api/v1/agent/heartbeat";
            try
            {
                PostJson(endpoint, "{}", deviceToken, apiKey);
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public static bool SendTelemetry(string serverUrl, string deviceToken, string telemetryJson, string apiKey = null)
        {
            string origin = ValidateServerOrigin(serverUrl);
            string endpoint = (string.IsNullOrEmpty(apiKey) ? origin : origin + "/functions/v1/xennguard-api") + "/api/v1/agent/telemetry";
            try
            {
                PostJson(endpoint, telemetryJson, deviceToken, apiKey);
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        private static string PostJson(string url, string jsonBody, string bearerToken, string apiKey = null)
        {
            HttpWebRequest request = (HttpWebRequest)WebRequest.Create(url);
            request.Method = "POST";
            request.ContentType = "application/json";
            request.Accept = "application/json";
            request.Timeout = 10000;
            request.ReadWriteTimeout = 10000;
            request.AllowAutoRedirect = false;

            // Security: Enforce TLS 1.2 minimum
            ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;

            if (!string.IsNullOrEmpty(bearerToken))
            {
                request.Headers["Authorization"] = "Bearer " + bearerToken;
            }
            if (!string.IsNullOrEmpty(apiKey))
            {
                request.Headers["apikey"] = apiKey;
            }

            byte[] bodyBytes = Encoding.UTF8.GetBytes(jsonBody);
            request.ContentLength = bodyBytes.Length;

            using (Stream requestStream = request.GetRequestStream())
            {
                requestStream.Write(bodyBytes, 0, bodyBytes.Length);
            }

            try
            {
                using (HttpWebResponse response = (HttpWebResponse)request.GetResponse())
                {
                    using (StreamReader reader = new StreamReader(response.GetResponseStream(), Encoding.UTF8))
                    {
                        return reader.ReadToEnd();
                    }
                }
            }
            catch (WebException wex)
            {
                string errorBody = "";
                if (wex.Response != null)
                {
                    using (StreamReader reader = new StreamReader(wex.Response.GetResponseStream(), Encoding.UTF8))
                    {
                        errorBody = reader.ReadToEnd();
                    }
                }
                throw new InvalidOperationException("API request failed: " + wex.Message + (errorBody.Length > 0 ? " (" + errorBody + ")" : ""), wex);
            }
        }

        private static string EscapeJson(string s)
        {
            if (s == null) return "";
            StringBuilder sb = new StringBuilder();
            foreach (char c in s)
            {
                switch (c)
                {
                    case '\\': sb.Append("\\\\"); break;
                    case '"': sb.Append("\\\""); break;
                    case '\n': sb.Append("\\n"); break;
                    case '\r': sb.Append("\\r"); break;
                    case '\t': sb.Append("\\t"); break;
                    default: sb.Append(c); break;
                }
            }
            return sb.ToString();
        }

        private static string ExtractJsonField(string json, string field)
        {
            // Handles both string: "field":"value" and numeric: "field":12
            string pattern = "\"" + field + "\":";
            int idx = json.IndexOf(pattern, StringComparison.Ordinal);
            if (idx == -1) return null;
            int start = idx + pattern.Length;
            while (start < json.Length && (json[start] == ' ' || json[start] == '\t')) start++;

            if (start < json.Length && json[start] == '"')
            {
                start++;
                int end = json.IndexOf("\"", start, StringComparison.Ordinal);
                if (end == -1) return null;
                return json.Substring(start, end - start);
            }
            else
            {
                int end = start;
                while (end < json.Length && json[end] != ',' && json[end] != '}' && json[end] != '\r' && json[end] != '\n')
                {
                    end++;
                }
                return json.Substring(start, end - start).Trim();
            }
        }
    }
}
