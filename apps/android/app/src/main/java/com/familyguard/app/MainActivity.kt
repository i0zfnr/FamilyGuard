package com.familyguard.app

import android.content.Intent
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val store = DeviceStore(this)

        // Ensure active notification and periodic sync run if already paired
        if (runCatching { store.credential() != null }.getOrDefault(false)) {
            ZeroCovertNotificationService.start(this)
            TelemetryWorker.schedulePeriodic(this)
        }

        setContent {
            XennGuardTheme {
                var server by remember { mutableStateOf("") }
                var challengeId by remember { mutableStateOf("") }
                var challengeToken by remember { mutableStateOf("") }
                var deviceName by remember { mutableStateOf(Build.MODEL ?: "Android device") }
                var qrPayloadText by remember { mutableStateOf("") }

                // Consent approval checklist
                var consentOwnership by remember { mutableStateOf(false) }
                var consentTelemetry by remember { mutableStateOf(false) }
                var consentTransparency by remember { mutableStateOf(false) }
                val allConsentsApproved = consentOwnership && consentTelemetry && consentTransparency

                var paired by remember { mutableStateOf(runCatching { store.credential() != null }.getOrDefault(false)) }
                var message by remember { mutableStateOf("") }
                var busy by remember { mutableStateOf(false) }
                val scope = rememberCoroutineScope()

                fun perform(work: () -> String) {
                    busy = true
                    message = ""
                    scope.launch {
                        message = try {
                            withContext(Dispatchers.IO) { work() }
                        } catch (e: Exception) {
                            e.message ?: "Request failed."
                        }
                        paired = runCatching { store.credential() != null }.getOrDefault(false)
                        busy = false
                    }
                }

                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                        .navigationBarsPadding()
                        .statusBarsPadding()
                        .padding(horizontal = 24.dp, vertical = 20.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    XennHeader("TRANSPARENT DEVICE CARE")
                    Text("Device monitoring with explicit permission and zero covert tracking.")

                    OutlinedButton(
                        enabled = !busy,
                        onClick = { startActivity(Intent(this@MainActivity, AdminActivity::class.java)) },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Sign in to manage devices")
                    }

                    if (!paired) {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text("QR / Quick Pairing", fontWeight = FontWeight.Bold)
                                Text("Paste QR pairing payload or deep link to autofill enrollment parameters:")
                                OutlinedTextField(
                                    value = qrPayloadText,
                                    onValueChange = { qrPayloadText = it },
                                    label = { Text("Pairing payload JSON or URI") },
                                    modifier = Modifier.fillMaxWidth(),
                                    maxLines = 3
                                )
                                OutlinedButton(
                                    enabled = qrPayloadText.isNotBlank() && !busy,
                                    onClick = {
                                        try {
                                            val parsed = PairingPayloadParser.parse(qrPayloadText)
                                            server = parsed.server
                                            challengeId = parsed.challengeId
                                            challengeToken = parsed.challengeToken
                                            parsed.deviceName?.let { deviceName = it }
                                            message = "Pairing parameters successfully populated."
                                        } catch (e: Exception) {
                                            message = "Payload error: ${e.message}"
                                        }
                                    }
                                ) {
                                    Text("Autofill parameters")
                                }
                            }
                        }

                        Text("Enrollment Parameters", fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
                        OutlinedTextField(
                            value = server,
                            onValueChange = { server = it },
                            label = { Text("HTTPS server origin") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )
                        OutlinedTextField(
                            value = challengeId,
                            onValueChange = { challengeId = it },
                            label = { Text("Challenge ID (UUID)") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )
                        OutlinedTextField(
                            value = challengeToken,
                            onValueChange = { challengeToken = it },
                            label = { Text("Challenge Secret (64-char hex)") },
                            visualTransformation = PasswordVisualTransformation(),
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )
                        OutlinedTextField(
                            value = deviceName,
                            onValueChange = { deviceName = it },
                            label = { Text("Device name") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )

                        Text("Explicit Consent Checklist", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        Text("All items must be confirmed before enrolling:")

                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Checkbox(checked = consentOwnership, onCheckedChange = { consentOwnership = it })
                            Spacer(Modifier.width(8.dp))
                            Text("1. I own or am authorized to manage this device.")
                        }
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Checkbox(checked = consentTelemetry, onCheckedChange = { consentTelemetry = it })
                            Spacer(Modifier.width(8.dp))
                            Text("2. I consent to automatic background health reports (battery, storage, network).")
                        }
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Checkbox(checked = consentTransparency, onCheckedChange = { consentTransparency = it })
                            Spacer(Modifier.width(8.dp))
                            Text("3. I understand a persistent notification will remain visible while active (zero covert tracking).")
                        }

                        Button(
                            enabled = allConsentsApproved && !busy && server.isNotBlank() && challengeId.isNotBlank() && challengeToken.isNotBlank(),
                            onClick = {
                                val url = server.trim()
                                val id = challengeId.trim()
                                val secret = challengeToken.trim()
                                val name = deviceName.trim()

                                perform {
                                    val publicKey = store.identity()
                                    val payload = JSONObject()
                                        .put("challenge_id", id)
                                        .put("challenge_token", secret)
                                        .put("device_name", name)
                                        .put("platform", "android")
                                        .put("public_key", publicKey)
                                        .put("signature", store.sign("$id:$secret"))
                                        .put("owner_approved", true)

                                    val result = FamilyGuardApi.post(url, "/api/v1/devices/enroll", payload)
                                    store.save(url, result.getString("device_token"), result.getString("device_id"))

                                    // Activate transparent foreground indicator and background telemetry sync
                                    ZeroCovertNotificationService.start(this@MainActivity)
                                    TelemetryWorker.schedulePeriodic(this@MainActivity)
                                    TelemetryWorker.enqueueImmediate(this@MainActivity)

                                    "Device enrolled successfully. Transparent protection is active."
                                }
                            },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Approve and enroll device")
                        }
                    } else {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text("Protection Status", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                                Text("Active protection enabled with zero covert tracking.")
                                Text("Ongoing status notification is visible in Android notification drawer.")
                                Text("Background periodic telemetry scheduled via WorkManager (15 min).")
                            }
                        }

                        Button(
                            enabled = !busy,
                            onClick = {
                                perform {
                                    val (url, token) = checkNotNull(store.credential())
                                    val telemetry = TelemetryCollector.collect(this@MainActivity)
                                    FamilyGuardApi.post(url, "/api/v1/agent/heartbeat", JSONObject(), token)
                                    FamilyGuardApi.post(url, "/api/v1/agent/telemetry", telemetry.toJson(), token)
                                    ZeroCovertNotificationService.updateStatus(
                                        this@MainActivity,
                                        "Manual health report sent. Battery: ${telemetry.batteryPercentage ?: 0}%."
                                    )
                                    "Manual health report sent successfully."
                                }
                            },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Send health report now")
                        }

                        OutlinedButton(
                            enabled = !busy,
                            onClick = {
                                perform {
                                    store.clear()
                                    TelemetryWorker.cancel(this@MainActivity)
                                    ZeroCovertNotificationService.stop(this@MainActivity)
                                    "Local enrollment data cleared and active monitoring stopped."
                                }
                            },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Remove local enrollment")
                        }
                    }

                    if (busy) {
                        CircularProgressIndicator(modifier = Modifier.align(Alignment.CenterHorizontally))
                    }
                    if (message.isNotEmpty()) {
                        Text(
                            text = message,
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Medium
                        )
                    }

                    Text(
                        "Zero Covert Tracking: XennGuard strictly prohibits hidden monitoring. A persistent notification is displayed whenever protection is active.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.outline
                    )
                }
            }
        }
    }
}
