package com.familyguard.app

import android.content.Intent
import android.os.BatteryManager
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.os.StatFs
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

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val store = DeviceStore(this)
        setContent {
            MaterialTheme {
                var server by remember { mutableStateOf("") }
                var challengeId by remember { mutableStateOf("") }
                var challengeToken by remember { mutableStateOf("") }
                var deviceName by remember { mutableStateOf(Build.MODEL ?: "Android device") }
                var approved by remember { mutableStateOf(false) }
                var paired by remember { mutableStateOf(runCatching { store.credential() != null }.getOrDefault(false)) }
                var message by remember { mutableStateOf("") }
                var busy by remember { mutableStateOf(false) }
                val scope = rememberCoroutineScope()
                fun perform(work: () -> String) {
                    busy = true; message = ""
                    scope.launch {
                        message = try { withContext(Dispatchers.IO) { work() } } catch (e: Exception) { e.message ?: "Request failed." }
                        paired = runCatching { store.credential() != null }.getOrDefault(false)
                        busy = false
                    }
                }
                Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(24.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("FamilyGuard", style = MaterialTheme.typography.headlineMedium)
                    Text("Device management with your permission")
                    OutlinedButton(enabled = !busy, onClick = { startActivity(Intent(this@MainActivity, AdminActivity::class.java)) }) { Text("Sign in to manage devices") }
                    if (!paired) {
                        Text("Enrollment is experimental and disabled on the server by default. Only continue if you trust the administrator and server.")
                        OutlinedTextField(server, { server = it }, label = { Text("HTTPS server address") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                        OutlinedTextField(challengeId, { challengeId = it }, label = { Text("Challenge ID") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                        OutlinedTextField(challengeToken, { challengeToken = it }, label = { Text("Challenge secret") }, visualTransformation = PasswordVisualTransformation(), singleLine = true, modifier = Modifier.fillMaxWidth())
                        OutlinedTextField(deviceName, { deviceName = it }, label = { Text("Device name") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                        Row { Checkbox(approved, { approved = it }); Text("I own or am authorized to manage this device and approve its enrollment.") }
                        Button(enabled = approved && !busy, onClick = {
                            val url = server.trim(); val id = challengeId.trim(); val secret = challengeToken.trim(); val name = deviceName.trim()
                            perform {
                                val publicKey = store.identity()
                                val payload = JSONObject().put("challenge_id", id).put("challenge_token", secret).put("device_name", name).put("platform", "android").put("public_key", publicKey).put("signature", store.sign("$id:$secret")).put("owner_approved", true)
                                val result = FamilyGuardApi.post(url, "/api/v1/devices/enroll", payload)
                                store.save(url, result.getString("device_token"), result.getString("device_id"))
                                "Device enrolled. Health is sent only when you request it."
                            }
                        }) { Text("Approve and enroll") }
                    } else {
                        Text("This device has an enrollment credential. You can send a health report or remove it from this phone.")
                        Button(enabled = !busy, onClick = { perform {
                            val (url, token) = checkNotNull(store.credential())
                            val battery = getSystemService(BATTERY_SERVICE) as BatteryManager
                            val percent = battery.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
                            val storage = StatFs(Environment.getDataDirectory().path)
                            val payload = JSONObject().put("storage_total", storage.totalBytes).put("storage_available", storage.availableBytes)
                            if (percent in 0..100) payload.put("battery_percentage", percent)
                            FamilyGuardApi.post(url, "/api/v1/agent/heartbeat", JSONObject(), token)
                            FamilyGuardApi.post(url, "/api/v1/agent/telemetry", payload, token)
                            "Health report sent."
                        } }) { Text("Send health report") }
                        Text("To revoke access on the server, use the dashboard. Removing the credential here does not revoke it on the server.")
                        OutlinedButton(enabled = !busy, onClick = { perform { store.clear(); "Local enrollment data removed. Revoke this device in the dashboard as well." } }) { Text("Remove local enrollment") }
                    }
                    if (busy) CircularProgressIndicator()
                    if (message.isNotEmpty()) Text(message)
                    Text("Screen sharing, location, background monitoring and remote control are not available in this build.")
                }
            }
        }
    }
}
