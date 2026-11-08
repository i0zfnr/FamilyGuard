package com.familyguard.app

import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

object FamilyGuardApi {
    fun validateServer(server: String): String {
        val url = URL(server.trim())
        require(url.protocol == "https" && !url.host.isNullOrBlank() && url.userInfo == null && url.query == null && url.ref == null && (url.path.isEmpty() || url.path == "/")) { "Enter an HTTPS server origin without credentials, a path, query, or fragment." }
        return url.toExternalForm().trimEnd('/')
    }
    fun post(server: String, path: String, payload: JSONObject, token: String? = null): JSONObject {
        val url = URL(validateServer(server) + path)
        val connection = url.openConnection() as HttpURLConnection
        try {
            connection.instanceFollowRedirects = false
            connection.connectTimeout = 10000; connection.readTimeout = 10000
            connection.requestMethod = "POST"; connection.doOutput = true
            connection.setRequestProperty("Accept", "application/json")
            connection.setRequestProperty("Content-Type", "application/json")
            if (token != null) connection.setRequestProperty("Authorization", "Bearer $token")
            connection.outputStream.use { it.write(payload.toString().toByteArray(Charsets.UTF_8)) }
            val code = connection.responseCode
            if (code !in 200..299) throw IllegalStateException("Server rejected the request (HTTP $code).")
            return JSONObject(connection.inputStream.bufferedReader().use { it.readText() })
        } finally { connection.disconnect() }
    }
}
