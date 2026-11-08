package com.familyguard.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.CookieManager
import java.net.CookiePolicy
import java.net.HttpURLConnection
import java.net.URL

private class AdminSession(origin: String) {
    private val server = FamilyGuardApi.validateServer(origin)
    private val cookies = CookieManager(null, CookiePolicy.ACCEPT_ORIGINAL_SERVER)
    private fun call(path: String, body: JSONObject? = null, csrf: String? = null): JSONObject {
        val url = URL(server + path)
        val connection = url.openConnection() as HttpURLConnection
        try {
            connection.instanceFollowRedirects = false
            connection.connectTimeout = 10000; connection.readTimeout = 10000
            connection.setRequestProperty("Accept", "application/json")
            cookies.get(url.toURI(), emptyMap()).forEach { (key, values) ->
                if (key != null && values.isNotEmpty()) connection.setRequestProperty(key, values.joinToString("; "))
            }
            if (csrf != null) connection.setRequestProperty("X-CSRF-TOKEN", csrf)
            if (body != null) {
                connection.requestMethod = "POST"; connection.doOutput = true
                connection.setRequestProperty("Content-Type", "application/json")
                connection.outputStream.use { it.write(body.toString().toByteArray(Charsets.UTF_8)) }
            }
            val status = connection.responseCode
            cookies.put(url.toURI(), connection.headerFields.filterKeys { it != null })
            if (status !in 200..299) throw IllegalStateException("Request failed (HTTP $status).")
            return JSONObject(connection.inputStream.bufferedReader().use { it.readText() })
        } finally { connection.disconnect() }
    }
    fun login(email: String, password: String): String {
        val csrf = call("/api/v1/csrf").getString("csrf_token")
        return call("/api/v1/auth/login", JSONObject().put("email", email).put("password", password), csrf).getJSONObject("user").getString("name")
    }
    fun devices(): List<String> {
        val data = call("/api/v1/devices").getJSONArray("data")
        return (0 until data.length()).map { data.getJSONObject(it).getString("device_name") }
    }
    fun logout() {
        val csrf = call("/api/v1/csrf").getString("csrf_token")
        call("/api/v1/auth/logout", JSONObject(), csrf)
        cookies.cookieStore.removeAll()
    }
}

class AdminActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                var server by remember { mutableStateOf("") }; var email by remember { mutableStateOf("") }
                var password by remember { mutableStateOf("") }; var name by remember { mutableStateOf("") }
                var session by remember { mutableStateOf<AdminSession?>(null) }
                var devices by remember { mutableStateOf<List<String>?>(null) }
                var busy by remember { mutableStateOf(false) }; var error by remember { mutableStateOf("") }
                val scope = rememberCoroutineScope()
                Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(24.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("XennGuard", style = MaterialTheme.typography.headlineMedium)
                    if (session == null) {
                        Text("Sign in to view your devices.")
                        OutlinedTextField(server, { server = it }, label = { Text("HTTPS server address") }, modifier = Modifier.fillMaxWidth())
                        OutlinedTextField(email, { email = it }, label = { Text("Email") }, modifier = Modifier.fillMaxWidth())
                        OutlinedTextField(password, { password = it }, label = { Text("Password") }, visualTransformation = PasswordVisualTransformation(), modifier = Modifier.fillMaxWidth())
                        Button(enabled = !busy, onClick = {
                            val address = server.trim(); val user = email.trim(); val secret = password
                            busy = true; error = ""
                            scope.launch {
                                try {
                                    val result = withContext(Dispatchers.IO) { val client = AdminSession(address); client to client.login(user, secret) }
                                    session = result.first; name = result.second; password = ""
                                } catch (e: Exception) { error = e.message ?: "Unable to sign in." }
                                busy = false
                            }
                        }) { Text("Sign in") }
                    } else {
                        Text("Welcome, $name", style = MaterialTheme.typography.titleLarge)
                        Button(enabled = !busy, onClick = {
                            val client = session ?: return@Button
                            busy = true; error = ""
                            scope.launch {
                                try { devices = withContext(Dispatchers.IO) { client.devices() } }
                                catch (e: Exception) { error = e.message ?: "Unable to load devices." }
                                busy = false
                            }
                        }) { Text("Refresh devices") }
                        if (devices == null) Text("Tap Refresh devices to load your devices.")
                        else if (devices!!.isEmpty()) Text("No registered devices.")
                        else devices!!.forEach { Text(it) }
                        Text("QR pairing is in development. Device access requires the owner's approval.")
                        OutlinedButton(enabled = !busy, onClick = {
                            val client = session ?: return@OutlinedButton
                            busy = true; error = ""
                            scope.launch {
                                try { withContext(Dispatchers.IO) { client.logout() }; session = null; devices = null; name = "" }
                                catch (e: Exception) { error = e.message ?: "Unable to sign out." }
                                busy = false
                            }
                        }) { Text("Sign out") }
                    }
                    if (busy) CircularProgressIndicator()
                    if (error.isNotEmpty()) Text(error, color = MaterialTheme.colorScheme.error)
                }
            }
        }
    }
}
