package com.familyguard.app

import android.content.Intent
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
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

private class AdminSession(origin: String, private val apiKey: String) {
    private val server = FamilyGuardApi.validateServer(origin)
    private var accessToken: String? = null

    private fun call(path: String, body: JSONObject? = null, useFunction: Boolean = true, token: String? = accessToken): JSONObject {
        val base = if (useFunction) "$server/functions/v1/xennguard-api" else server
        val url = URL(base + path)
        val connection = url.openConnection() as HttpURLConnection
        try {
            connection.instanceFollowRedirects = false
            connection.connectTimeout = 10000
            connection.readTimeout = 10000
            connection.setRequestProperty("Accept", "application/json")
            connection.setRequestProperty("apikey", apiKey)
            if (token != null) connection.setRequestProperty("Authorization", "Bearer $token")
            if (body != null) {
                connection.requestMethod = "POST"
                connection.doOutput = true
                connection.setRequestProperty("Content-Type", "application/json")
                connection.outputStream.use { it.write(body.toString().toByteArray(Charsets.UTF_8)) }
            }
            val status = connection.responseCode
            val stream = if (status in 200..299) connection.inputStream else connection.errorStream
            val response = stream?.bufferedReader()?.use { it.readText() }.orEmpty()
            if (status !in 200..299) throw IllegalStateException("Request failed (HTTP $status).")
            return if (response.isBlank()) JSONObject() else JSONObject(response)
        } finally {
            connection.disconnect()
        }
    }

    fun login(email: String, password: String): String {
        val result = call("/auth/v1/token?grant_type=password", JSONObject().put("email", email).put("password", password), useFunction = false, token = null)
        accessToken = result.getString("access_token")
        return call("/api/v1/auth/me").getJSONObject("user").getString("name")
    }

    fun devices(): List<JSONObject> {
        val data = call("/api/v1/devices").getJSONArray("data")
        return (0 until data.length()).map { data.getJSONObject(it) }
    }

    fun logout() {
        call("/auth/v1/logout", JSONObject(), useFunction = false)
        accessToken = null
    }
}

class AdminActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            XennGuardTheme {
                var server by remember { mutableStateOf("") }
                var apiKey by remember { mutableStateOf("") }
                var email by remember { mutableStateOf("") }
                var password by remember { mutableStateOf("") }
                var name by remember { mutableStateOf("") }
                var session by remember { mutableStateOf<AdminSession?>(null) }
                var devices by remember { mutableStateOf<List<JSONObject>?>(null) }
                var busy by remember { mutableStateOf(false) }
                var error by remember { mutableStateOf("") }
                var successMessage by remember { mutableStateOf("") }
                val scope = rememberCoroutineScope()

                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                        .navigationBarsPadding()
                        .statusBarsPadding()
                        .padding(horizontal = 20.dp, vertical = 18.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Top Brand Header Platter
                    XennHeader(
                        subtitle = "WORKSPACE MANAGEMENT",
                        isProtected = session != null
                    )

                    // Navigation bar back to Device screen
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .border(1.dp, XennPalette.BorderCard, RoundedCornerShape(12.dp))
                            .clickable { finish() },
                        color = Color.White
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 14.dp, vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                Icons.AutoMirrored.Outlined.ArrowBack,
                                contentDescription = null,
                                tint = XennPalette.TextSecondary,
                                modifier = Modifier.size(16.dp)
                            )
                            Text(
                                "Back to Device Dashboard",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = XennPalette.TextSecondary
                            )
                        }
                    }

                    if (session == null) {
                        // ---------------------------------------------------------
                        // SIGN IN CARD
                        // ---------------------------------------------------------
                        Surface(
                            shape = RoundedCornerShape(16.dp),
                            color = Color.White,
                            modifier = Modifier
                                .fillMaxWidth()
                                .border(1.dp, XennPalette.BorderCard, RoundedCornerShape(16.dp))
                        ) {
                            Column(
                                modifier = Modifier.padding(20.dp),
                                verticalArrangement = Arrangement.spacedBy(14.dp)
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
                                            Icons.Outlined.Lock,
                                            contentDescription = null,
                                            tint = XennPalette.AccentSage,
                                            modifier = Modifier.size(18.dp)
                                        )
                                    }
                                    Column {
                                        Text(
                                            "Administrator Sign In",
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 17.sp,
                                            color = XennPalette.TextPrimary
                                        )
                                        Text(
                                            "Enter workspace master credentials",
                                            fontSize = 12.sp,
                                            color = XennPalette.TextMuted
                                        )
                                    }
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
                                    value = apiKey,
                                    onValueChange = { apiKey = it },
                                    label = { Text("Supabase publishable key") },
                                    singleLine = true,
                                    shape = RoundedCornerShape(10.dp),
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = XennPalette.BrandPrimary,
                                        unfocusedBorderColor = XennPalette.BorderInput
                                    )
                                )

                                OutlinedTextField(
                                    value = email,
                                    onValueChange = { email = it },
                                    label = { Text("Email Address") },
                                    singleLine = true,
                                    shape = RoundedCornerShape(10.dp),
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = XennPalette.BrandPrimary,
                                        unfocusedBorderColor = XennPalette.BorderInput
                                    )
                                )

                                OutlinedTextField(
                                    value = password,
                                    onValueChange = { password = it },
                                    label = { Text("Password") },
                                    visualTransformation = PasswordVisualTransformation(),
                                    singleLine = true,
                                    shape = RoundedCornerShape(10.dp),
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = XennPalette.BrandPrimary,
                                        unfocusedBorderColor = XennPalette.BorderInput
                                    )
                                )

                                Button(
                                    enabled = !busy && server.isNotBlank() && apiKey.isNotBlank() && email.isNotBlank() && password.isNotBlank(),
                                    onClick = {
                                        val address = server.trim()
                                        val user = email.trim()
                                        val secret = password
                                        busy = true
                                        error = ""
                                        successMessage = ""
                                        scope.launch {
                                            try {
                                                val result = withContext(Dispatchers.IO) {
                                                    val client = AdminSession(address, apiKey.trim())
                                                    client to client.login(user, secret)
                                                }
                                                session = result.first
                                                name = result.second
                                                password = ""
                                                val loadedDevices = withContext(Dispatchers.IO) { result.first.devices() }
                                                devices = loadedDevices
                                                successMessage = "Signed in as $name"
                                            } catch (e: Exception) {
                                                error = e.message ?: "Unable to sign in."
                                            }
                                            busy = false
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
                                        Icon(Icons.Outlined.LockOpen, contentDescription = null, modifier = Modifier.size(18.dp))
                                        Text("Sign In to Workspace", fontWeight = FontWeight.Bold, fontSize = 14.5.sp)
                                    }
                                }
                            }
                        }
                    } else {
                        // ---------------------------------------------------------
                        // WORKSPACE SESSION & DEVICES FLEET
                        // ---------------------------------------------------------
                        // Admin User Card
                        Surface(
                            shape = RoundedCornerShape(16.dp),
                            color = Color.White,
                            modifier = Modifier
                                .fillMaxWidth()
                                .border(1.dp, XennPalette.BorderCard, RoundedCornerShape(16.dp))
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(42.dp)
                                            .clip(CircleShape)
                                            .background(XennPalette.BrandPrimary),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            name.take(2).uppercase(),
                                            fontWeight = FontWeight.Bold,
                                            color = Color.White,
                                            fontSize = 15.sp
                                        )
                                    }
                                    Column {
                                        Text(
                                            name,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 16.sp,
                                            color = XennPalette.TextPrimary
                                        )
                                        Text(
                                            "Workspace Admin",
                                            fontSize = 11.5.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            color = XennPalette.StatusOnline
                                        )
                                    }
                                }

                                OutlinedButton(
                                    enabled = !busy,
                                    onClick = {
                                        val client = session ?: return@OutlinedButton
                                        busy = true
                                        error = ""
                                        scope.launch {
                                            try {
                                                withContext(Dispatchers.IO) { client.logout() }
                                                session = null
                                                devices = null
                                                name = ""
                                                successMessage = "Signed out."
                                            } catch (e: Exception) {
                                                error = e.message ?: "Unable to sign out."
                                            }
                                            busy = false
                                        }
                                    },
                                    colors = ButtonDefaults.outlinedButtonColors(
                                        contentColor = XennPalette.StatusCritical
                                    ),
                                    shape = RoundedCornerShape(8.dp),
                                    modifier = Modifier.height(36.dp)
                                ) {
                                    Text("Sign out", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                                }
                            }
                        }

                        // Fleet Header & Refresh
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                "Connected Fleet (${devices?.size ?: 0})",
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp,
                                color = XennPalette.TextPrimary
                            )

                            Button(
                                enabled = !busy,
                                onClick = {
                                    val client = session ?: return@Button
                                    busy = true
                                    error = ""
                                    scope.launch {
                                        try {
                                            devices = withContext(Dispatchers.IO) { client.devices() }
                                            successMessage = "Fleet list refreshed."
                                        } catch (e: Exception) {
                                            error = e.message ?: "Unable to load devices."
                                        }
                                        busy = false
                                    }
                                },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = XennPalette.AccentSageSubtle,
                                    contentColor = XennPalette.AccentSage
                                ),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.height(34.dp)
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Icon(Icons.Outlined.Refresh, contentDescription = null, modifier = Modifier.size(14.dp))
                                    Text("Refresh", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                                }
                            }
                        }

                        // Device List Items
                        if (devices == null) {
                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = Color.White,
                                modifier = Modifier.fillMaxWidth().border(1.dp, XennPalette.BorderCard, RoundedCornerShape(12.dp))
                            ) {
                                Column(
                                    modifier = Modifier.padding(24.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Icon(Icons.Outlined.Devices, contentDescription = null, tint = XennPalette.TextMuted, modifier = Modifier.size(28.dp))
                                    Text("Loading devices...", color = XennPalette.TextSecondary, fontSize = 13.sp)
                                }
                            }
                        } else if (devices!!.isEmpty()) {
                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = Color.White,
                                modifier = Modifier.fillMaxWidth().border(1.dp, XennPalette.BorderCard, RoundedCornerShape(12.dp))
                            ) {
                                Column(
                                    modifier = Modifier.padding(24.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Icon(Icons.Outlined.Devices, contentDescription = null, tint = XennPalette.TextMuted, modifier = Modifier.size(32.dp))
                                    Text("No enrolled devices found", fontWeight = FontWeight.Bold, color = XennPalette.TextPrimary, fontSize = 14.sp)
                                    Text("Enroll this phone or a computer from the web workspace to start monitoring.", color = XennPalette.TextSecondary, fontSize = 12.sp)
                                }
                            }
                        } else {
                            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                devices!!.forEach { devObj ->
                                    val devName = devObj.optString("device_name", "Unknown device")
                                    val platform = devObj.optString("platform", "android")
                                    val isRevoked = devObj.optBoolean("is_revoked", false)

                                    Surface(
                                        shape = RoundedCornerShape(14.dp),
                                        color = Color.White,
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .border(1.dp, XennPalette.BorderCard, RoundedCornerShape(14.dp))
                                    ) {
                                        Row(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .padding(14.dp),
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.SpaceBetween
                                        ) {
                                            Row(
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                                            ) {
                                                Box(
                                                    modifier = Modifier
                                                        .size(36.dp)
                                                        .clip(RoundedCornerShape(10.dp))
                                                        .background(if (platform == "android") XennPalette.AccentSageSubtle else XennPalette.AccentSkySubtle),
                                                    contentAlignment = Alignment.Center
                                                ) {
                                                    Icon(
                                                        if (platform == "android") Icons.Outlined.PhoneAndroid else Icons.Outlined.Computer,
                                                        contentDescription = null,
                                                        tint = if (platform == "android") XennPalette.AccentSage else XennPalette.AccentSky,
                                                        modifier = Modifier.size(18.dp)
                                                    )
                                                }
                                                Column {
                                                    Text(
                                                        devName,
                                                        fontWeight = FontWeight.Bold,
                                                        fontSize = 14.sp,
                                                        color = XennPalette.TextPrimary
                                                    )
                                                    Text(
                                                        platform.replaceFirstChar { it.uppercase() } + " Device",
                                                        fontSize = 11.5.sp,
                                                        color = XennPalette.TextMuted
                                                    )
                                                }
                                            }

                                            Surface(
                                                shape = CircleShape,
                                                color = if (isRevoked) XennPalette.StatusCriticalBg else XennPalette.StatusOnlineBg,
                                                modifier = Modifier.border(
                                                    1.dp,
                                                    if (isRevoked) XennPalette.StatusCriticalBorder else XennPalette.StatusOnlineBorder,
                                                    CircleShape
                                                )
                                            ) {
                                                Text(
                                                    text = if (isRevoked) "Revoked" else "Enrolled",
                                                    fontSize = 11.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    color = if (isRevoked) XennPalette.StatusCritical else XennPalette.StatusOnline,
                                                    modifier = Modifier.padding(horizontal = 9.dp, vertical = 3.dp)
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Progress Indicator
                    if (busy) {
                        CircularProgressIndicator(
                            color = XennPalette.BrandPrimary,
                            modifier = Modifier.align(Alignment.CenterHorizontally).padding(vertical = 8.dp)
                        )
                    }

                    // Feedback Message
                    if (error.isNotEmpty()) {
                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = XennPalette.StatusCriticalBg,
                            modifier = Modifier
                                .fillMaxWidth()
                                .border(1.dp, XennPalette.StatusCriticalBorder, RoundedCornerShape(10.dp))
                        ) {
                            Row(
                                modifier = Modifier.padding(14.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Icon(Icons.Outlined.Warning, contentDescription = null, tint = XennPalette.StatusCritical, modifier = Modifier.size(18.dp))
                                Text(error, fontSize = 13.sp, fontWeight = FontWeight.Medium, color = XennPalette.StatusCritical)
                            }
                        }
                    } else if (successMessage.isNotEmpty()) {
                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = XennPalette.StatusOnlineBg,
                            modifier = Modifier
                                .fillMaxWidth()
                                .border(1.dp, XennPalette.StatusOnlineBorder, RoundedCornerShape(10.dp))
                        ) {
                            Row(
                                modifier = Modifier.padding(14.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Icon(Icons.Default.Check, contentDescription = null, tint = XennPalette.StatusOnline, modifier = Modifier.size(18.dp))
                                Text(successMessage, fontSize = 13.sp, fontWeight = FontWeight.Medium, color = XennPalette.StatusOnline)
                            }
                        }
                    }

                    // Trust statement
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
                                "Zero Covert Tracking: Admin access enforces hardware proofs and logs every challenge request in the security audit journal.",
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
