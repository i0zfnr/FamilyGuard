package com.familyguard.app

import android.content.Intent
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowForward
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
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
                var isError by remember { mutableStateOf(false) }
                var busy by remember { mutableStateOf(false) }
                val scope = rememberCoroutineScope()

                // Latest telemetry cache
                var latestBattery by remember { mutableStateOf<Int?>(null) }
                var latestStorageFree by remember { mutableStateOf<String?>(null) }
                var latestNetwork by remember { mutableStateOf("WiFi") }

                fun refreshTelemetryPreview() {
                    try {
                        val t = TelemetryCollector.collect(this@MainActivity)
                        latestBattery = t.batteryPercentage
                        val freeGiB = (t.storageAvailable ?: 0L) / (1024L * 1024L * 1024L)
                        val totalGiB = (t.storageTotal ?: 0L) / (1024L * 1024L * 1024L)
                        latestStorageFree = "$freeGiB GiB / $totalGiB GiB"
                        latestNetwork = t.networkType?.uppercase() ?: "WIFI"
                    } catch (_: Exception) {}
                }

                LaunchedEffect(paired) {
                    if (paired) {
                        refreshTelemetryPreview()
                    }
                }

                fun perform(work: () -> String) {
                    busy = true
                    message = ""
                    isError = false
                    scope.launch {
                        try {
                            val res = withContext(Dispatchers.IO) { work() }
                            message = res
                            isError = false
                        } catch (e: Exception) {
                            message = e.message ?: "Operation failed."
                            isError = true
                        }
                        paired = runCatching { store.credential() != null }.getOrDefault(false)
                        if (paired) refreshTelemetryPreview()
                        busy = false
                    }
                }

                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                        .navigationBarsPadding()
                        .statusBarsPadding()
                        .padding(horizontal = 20.dp, vertical = 18.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // 1. Top Brand Header Platter
                    XennHeader(
                        subtitle = if (paired) "TRANSPARENT DEVICE CARE" else "SETUP & PAIRING",
                        isProtected = paired
                    )

                    // 2. Workspace Access Link Button
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(14.dp))
                            .border(1.dp, XennPalette.BorderCard, RoundedCornerShape(14.dp))
                            .clickable(enabled = !busy) {
                                startActivity(Intent(this@MainActivity, AdminActivity::class.java))
                            },
                        color = Color.White
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 13.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Icon(
                                    Icons.Outlined.Shield,
                                    contentDescription = null,
                                    tint = XennPalette.BrandPrimary,
                                    modifier = Modifier.size(20.dp)
                                )
                                Column {
                                    Text(
                                        "Sign in to Workspace Management",
                                        fontWeight = FontWeight.SemiBold,
                                        fontSize = 14.sp,
                                        color = XennPalette.TextPrimary
                                    )
                                    Text(
                                        "View family devices fleet & security audit logs",
                                        fontSize = 11.5.sp,
                                        color = XennPalette.TextMuted
                                    )
                                }
                            }
                            Icon(
                                Icons.AutoMirrored.Outlined.ArrowForward,
                                contentDescription = null,
                                tint = XennPalette.TextMuted,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }

                    // 3. Conditional Flow: Paired Dashboard VS Enrollment Flow
                    if (!paired) {
                        // -------------------------------------------------------------
                        // ENROLLMENT & PAIRING FLOW
                        // -------------------------------------------------------------
                        // Hero Explanation Card
                        Surface(
                            shape = RoundedCornerShape(16.dp),
                            color = Color.White,
                            modifier = Modifier
                                .fillMaxWidth()
                                .border(1.dp, XennPalette.BorderCard, RoundedCornerShape(16.dp))
                        ) {
                            Column(
                                modifier = Modifier.padding(20.dp),
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(36.dp)
                                            .clip(RoundedCornerShape(10.dp))
                                            .background(XennPalette.AccentSageSubtle),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            Icons.Outlined.Security,
                                            contentDescription = null,
                                            tint = XennPalette.AccentSage,
                                            modifier = Modifier.size(20.dp)
                                        )
                                    }
                                    Text(
                                        "Device Enrollment",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 18.sp,
                                        letterSpacing = (-0.3).sp,
                                        color = XennPalette.TextPrimary
                                    )
                                }
                                Text(
                                    "Connect this phone with explicit mutual consent. Cryptographic keys are generated in Android Keystore with zero covert tracking.",
                                    fontSize = 13.5.sp,
                                    lineHeight = 19.sp,
                                    color = XennPalette.TextSecondary
                                )
                            }
                        }

                        // Quick QR / Deep Link Setup Card
                        Surface(
                            shape = RoundedCornerShape(16.dp),
                            color = Color.White,
                            modifier = Modifier
                                .fillMaxWidth()
                                .border(1.dp, XennPalette.BorderCard, RoundedCornerShape(16.dp))
                        ) {
                            Column(
                                modifier = Modifier.padding(18.dp),
                                verticalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Icon(
                                        Icons.Outlined.QrCodeScanner,
                                        contentDescription = null,
                                        tint = XennPalette.AccentSage,
                                        modifier = Modifier.size(18.dp)
                                    )
                                    Text(
                                        "Quick QR / Payload Setup",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 15.sp,
                                        color = XennPalette.TextPrimary
                                    )
                                }
                                Text(
                                    "Paste a QR pairing payload or deep link to autofill parameters:",
                                    fontSize = 12.5.sp,
                                    color = XennPalette.TextSecondary
                                )
                                OutlinedTextField(
                                    value = qrPayloadText,
                                    onValueChange = { qrPayloadText = it },
                                    label = { Text("Pairing payload JSON or URI") },
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(10.dp),
                                    maxLines = 3,
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = XennPalette.BrandPrimary,
                                        unfocusedBorderColor = XennPalette.BorderInput
                                    )
                                )
                                Button(
                                    enabled = qrPayloadText.isNotBlank() && !busy,
                                    onClick = {
                                        try {
                                            val parsed = PairingPayloadParser.parse(qrPayloadText)
                                            server = parsed.server
                                            challengeId = parsed.challengeId
                                            challengeToken = parsed.challengeToken
                                            parsed.deviceName?.let { deviceName = it }
                                            message = "Pairing parameters successfully populated."
                                            isError = false
                                        } catch (e: Exception) {
                                            message = "Payload error: ${e.message}"
                                            isError = true
                                        }
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = XennPalette.AccentSageSubtle, contentColor = XennPalette.AccentSage),
                                    shape = RoundedCornerShape(8.dp),
                                    modifier = Modifier.align(Alignment.End)
                                ) {
                                    Text("Autofill parameters", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                                }
                            }
                        }

                        // Connection Parameters Card
                        Surface(
                            shape = RoundedCornerShape(16.dp),
                            color = Color.White,
                            modifier = Modifier
                                .fillMaxWidth()
                                .border(1.dp, XennPalette.BorderCard, RoundedCornerShape(16.dp))
                        ) {
                            Column(
                                modifier = Modifier.padding(18.dp),
                                verticalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Icon(
                                        Icons.Outlined.Key,
                                        contentDescription = null,
                                        tint = XennPalette.BrandPrimary,
                                        modifier = Modifier.size(18.dp)
                                    )
                                    Text(
                                        "Cryptographic Parameters",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 15.sp,
                                        color = XennPalette.TextPrimary
                                    )
                                }

                                OutlinedTextField(
                                    value = server,
                                    onValueChange = { server = it },
                                    label = { Text("HTTPS Server Address") },
                                    singleLine = true,
                                    shape = RoundedCornerShape(10.dp),
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = XennPalette.BrandPrimary,
                                        unfocusedBorderColor = XennPalette.BorderInput
                                    )
                                )

                                OutlinedTextField(
                                    value = challengeId,
                                    onValueChange = { challengeId = it },
                                    label = { Text("Challenge ID (UUID)") },
                                    singleLine = true,
                                    shape = RoundedCornerShape(10.dp),
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = XennPalette.BrandPrimary,
                                        unfocusedBorderColor = XennPalette.BorderInput
                                    )
                                )

                                OutlinedTextField(
                                    value = challengeToken,
                                    onValueChange = { challengeToken = it },
                                    label = { Text("Challenge Secret (64-char Hex)") },
                                    visualTransformation = PasswordVisualTransformation(),
                                    singleLine = true,
                                    shape = RoundedCornerShape(10.dp),
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = XennPalette.BrandPrimary,
                                        unfocusedBorderColor = XennPalette.BorderInput
                                    )
                                )

                                OutlinedTextField(
                                    value = deviceName,
                                    onValueChange = { deviceName = it },
                                    label = { Text("Device Display Name") },
                                    singleLine = true,
                                    shape = RoundedCornerShape(10.dp),
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = XennPalette.BrandPrimary,
                                        unfocusedBorderColor = XennPalette.BorderInput
                                    )
                                )
                            }
                        }

                        // Informed Consent Checklist Card
                        Surface(
                            shape = RoundedCornerShape(16.dp),
                            color = Color.White,
                            modifier = Modifier
                                .fillMaxWidth()
                                .border(1.dp, XennPalette.BorderCard, RoundedCornerShape(16.dp))
                        ) {
                            Column(
                                modifier = Modifier.padding(18.dp),
                                verticalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Icon(
                                        Icons.Outlined.CheckCircle,
                                        contentDescription = null,
                                        tint = XennPalette.AccentSage,
                                        modifier = Modifier.size(18.dp)
                                    )
                                    Text(
                                        "Informed Consent Checklist",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 15.sp,
                                        color = XennPalette.TextPrimary
                                    )
                                }
                                Text(
                                    "Confirm all three permissions to authorize cryptographic key creation:",
                                    fontSize = 12.5.sp,
                                    color = XennPalette.TextSecondary
                                )

                                // Checkbox 1
                                Surface(
                                    shape = RoundedCornerShape(10.dp),
                                    color = if (consentOwnership) XennPalette.AccentSageSubtle else XennPalette.CanvasBg,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable { consentOwnership = !consentOwnership }
                                        .border(1.dp, if (consentOwnership) Color(0xFFC6E6D0) else XennPalette.BorderCard, RoundedCornerShape(10.dp))
                                ) {
                                    Row(
                                        modifier = Modifier.padding(12.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                                    ) {
                                        Checkbox(
                                            checked = consentOwnership,
                                            onCheckedChange = { consentOwnership = it },
                                            colors = CheckboxDefaults.colors(checkedColor = XennPalette.BrandPrimary)
                                        )
                                        Text(
                                            "1. I own or am authorized to manage this device.",
                                            fontSize = 13.sp,
                                            color = XennPalette.TextPrimary
                                        )
                                    }
                                }

                                // Checkbox 2
                                Surface(
                                    shape = RoundedCornerShape(10.dp),
                                    color = if (consentTelemetry) XennPalette.AccentSageSubtle else XennPalette.CanvasBg,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable { consentTelemetry = !consentTelemetry }
                                        .border(1.dp, if (consentTelemetry) Color(0xFFC6E6D0) else XennPalette.BorderCard, RoundedCornerShape(10.dp))
                                ) {
                                    Row(
                                        modifier = Modifier.padding(12.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                                    ) {
                                        Checkbox(
                                            checked = consentTelemetry,
                                            onCheckedChange = { consentTelemetry = it },
                                            colors = CheckboxDefaults.colors(checkedColor = XennPalette.BrandPrimary)
                                        )
                                        Text(
                                            "2. I consent to automatic periodic health reports (battery, storage, network).",
                                            fontSize = 13.sp,
                                            color = XennPalette.TextPrimary
                                        )
                                    }
                                }

                                // Checkbox 3
                                Surface(
                                    shape = RoundedCornerShape(10.dp),
                                    color = if (consentTransparency) XennPalette.AccentSageSubtle else XennPalette.CanvasBg,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable { consentTransparency = !consentTransparency }
                                        .border(1.dp, if (consentTransparency) Color(0xFFC6E6D0) else XennPalette.BorderCard, RoundedCornerShape(10.dp))
                                ) {
                                    Row(
                                        modifier = Modifier.padding(12.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                                    ) {
                                        Checkbox(
                                            checked = consentTransparency,
                                            onCheckedChange = { consentTransparency = it },
                                            colors = CheckboxDefaults.colors(checkedColor = XennPalette.BrandPrimary)
                                        )
                                        Text(
                                            "3. I understand a persistent notification remains visible while active (zero covert tracking).",
                                            fontSize = 13.sp,
                                            color = XennPalette.TextPrimary
                                        )
                                    }
                                }
                            }
                        }

                        // Enroll Action Button
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

                                    ZeroCovertNotificationService.start(this@MainActivity)
                                    TelemetryWorker.schedulePeriodic(this@MainActivity)
                                    TelemetryWorker.enqueueImmediate(this@MainActivity)

                                    "Device enrolled successfully. Transparent protection is active."
                                }
                            },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = XennPalette.BrandPrimary,
                                contentColor = Color.White
                            ),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(18.dp))
                                Text("Approve and enroll device", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                            }
                        }
                    } else {
                        // -------------------------------------------------------------
                        // ACTIVE PROTECTION DASHBOARD
                        // -------------------------------------------------------------
                        // Protection Status Hero Platter
                        Surface(
                            shape = RoundedCornerShape(16.dp),
                            color = Color.White,
                            modifier = Modifier
                                .fillMaxWidth()
                                .border(1.dp, XennPalette.BorderCard, RoundedCornerShape(16.dp))
                        ) {
                            Column(
                                modifier = Modifier.padding(20.dp),
                                verticalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(38.dp)
                                                .clip(RoundedCornerShape(10.dp))
                                                .background(XennPalette.StatusOnlineBg),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Icon(
                                                Icons.Outlined.Shield,
                                                contentDescription = null,
                                                tint = XennPalette.StatusOnline,
                                                modifier = Modifier.size(22.dp)
                                            )
                                        }
                                        Column {
                                            Text(
                                                "Protection Active",
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 18.sp,
                                                color = XennPalette.TextPrimary
                                            )
                                            Text(
                                                "Hardware Token Proofs Enforced",
                                                fontSize = 12.sp,
                                                color = XennPalette.StatusOnline,
                                                fontWeight = FontWeight.SemiBold
                                            )
                                        }
                                    }

                                    Surface(
                                        shape = CircleShape,
                                        color = XennPalette.StatusOnlineBg,
                                        modifier = Modifier.border(1.dp, XennPalette.StatusOnlineBorder, CircleShape)
                                    ) {
                                        Row(
                                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                                        ) {
                                            Box(
                                                modifier = Modifier
                                                    .size(6.dp)
                                                    .clip(CircleShape)
                                                    .background(XennPalette.StatusOnline)
                                            )
                                            Text("Synchronized", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = XennPalette.StatusOnline)
                                        }
                                    }
                                }

                                Text(
                                    "Zero covert tracking: an ongoing persistent status indicator remains visible in your Android notification drawer. Background telemetry synchronizes every 15 minutes.",
                                    fontSize = 13.5.sp,
                                    lineHeight = 19.sp,
                                    color = XennPalette.TextSecondary
                                )
                            }
                        }

                        // Live Telemetry Diagnostic Cards Grid
                        Text(
                            "Live Device Telemetry",
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp,
                            color = XennPalette.TextPrimary
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            // Battery Card
                            Surface(
                                shape = RoundedCornerShape(14.dp),
                                color = Color.White,
                                modifier = Modifier
                                    .weight(1f)
                                    .border(1.dp, XennPalette.BorderCard, RoundedCornerShape(14.dp))
                            ) {
                                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Text("BATTERY", fontSize = 10.5.sp, fontWeight = FontWeight.Bold, color = XennPalette.TextMuted)
                                        Icon(Icons.Outlined.BatteryChargingFull, contentDescription = null, tint = XennPalette.AccentSage, modifier = Modifier.size(16.dp))
                                    }
                                    Text(
                                        "${latestBattery ?: 0}%",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 22.sp,
                                        color = XennPalette.TextPrimary
                                    )
                                    Text("Hardware fuel gauge", fontSize = 11.5.sp, color = XennPalette.TextSecondary)
                                }
                            }

                            // Storage Card
                            Surface(
                                shape = RoundedCornerShape(14.dp),
                                color = Color.White,
                                modifier = Modifier
                                    .weight(1f)
                                    .border(1.dp, XennPalette.BorderCard, RoundedCornerShape(14.dp))
                            ) {
                                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Text("STORAGE", fontSize = 10.5.sp, fontWeight = FontWeight.Bold, color = XennPalette.TextMuted)
                                        Icon(Icons.Outlined.Storage, contentDescription = null, tint = XennPalette.AccentSky, modifier = Modifier.size(16.dp))
                                    }
                                    Text(
                                        latestStorageFree ?: "Available",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 15.sp,
                                        color = XennPalette.TextPrimary,
                                        maxLines = 1
                                    )
                                    Text("Encrypted volume", fontSize = 11.5.sp, color = XennPalette.TextSecondary)
                                }
                            }
                        }

                        // Send Health Report CTA Button
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
                                    "Manual health report synchronized successfully."
                                }
                            },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = XennPalette.BrandPrimary,
                                contentColor = Color.White
                            ),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(48.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(Icons.Outlined.Sync, contentDescription = null, modifier = Modifier.size(18.dp))
                                Text("Send health report now", fontWeight = FontWeight.Bold, fontSize = 14.5.sp)
                            }
                        }

                        // Remove Enrollment Button
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
                            colors = ButtonDefaults.outlinedButtonColors(
                                contentColor = XennPalette.StatusCritical
                            ),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(48.dp)
                        ) {
                            Text("Remove local enrollment", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                        }
                    }

                    // Progress & Message Feedback Banner
                    if (busy) {
                        CircularProgressIndicator(
                            color = XennPalette.BrandPrimary,
                            modifier = Modifier.align(Alignment.CenterHorizontally).padding(vertical = 8.dp)
                        )
                    }

                    if (message.isNotEmpty()) {
                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = if (isError) XennPalette.StatusCriticalBg else XennPalette.StatusOnlineBg,
                            modifier = Modifier
                                .fillMaxWidth()
                                .border(1.dp, if (isError) XennPalette.StatusCriticalBorder else XennPalette.StatusOnlineBorder, RoundedCornerShape(10.dp))
                        ) {
                            Row(
                                modifier = Modifier.padding(14.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Icon(
                                    if (isError) Icons.Outlined.Warning else Icons.Default.Check,
                                    contentDescription = null,
                                    tint = if (isError) XennPalette.StatusCritical else XennPalette.StatusOnline,
                                    modifier = Modifier.size(18.dp)
                                )
                                Text(
                                    text = message,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = if (isError) XennPalette.StatusCritical else XennPalette.StatusOnline
                                )
                            }
                        }
                    }

                    // Bottom Zero-Covert Trust Statement
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = XennPalette.SurfaceSubtle,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Icon(
                                Icons.Outlined.Security,
                                contentDescription = null,
                                tint = XennPalette.AccentSage,
                                modifier = Modifier.size(18.dp)
                            )
                            Text(
                                "Zero Covert Tracking: XennGuard strictly prohibits covert surveillance. Device telemetry requires mutual owner consent and visible OS indicators.",
                                fontSize = 11.5.sp,
                                lineHeight = 16.sp,
                                color = XennPalette.TextSecondary
                            )
                        }
                    }
                }
            }
        }
    }
}
