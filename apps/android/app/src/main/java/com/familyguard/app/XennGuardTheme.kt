package com.familyguard.app

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private val XennColors = lightColorScheme(
    primary = Color(0xFF294633), onPrimary = Color.White,
    secondary = Color(0xFF6A8E6C), onSecondary = Color.White,
    background = Color(0xFFF8F9F6), surface = Color(0xFFF8F9F6),
    surfaceVariant = Color(0xFFEAF1E8), onSurface = Color(0xFF202A22),
    outline = Color(0xFF9EADA0), error = Color(0xFFA33F3C)
)

@Composable
fun XennGuardTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = XennColors, content = { Surface(modifier = Modifier.fillMaxSize(), content = content) })
}

@Composable
fun XennHeader(subtitle: String) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
        Image(painter = painterResource(R.drawable.xennguard_icon), contentDescription = null, modifier = Modifier.size(46.dp).clip(RoundedCornerShape(14.dp)))
        Column { Text("XennGuard", fontWeight = FontWeight.Bold, fontSize = 20.sp, letterSpacing = (-0.7).sp); Text(subtitle, color = Color(0xFF7C8D7E), fontSize = 11.sp) }
    }
    Spacer(Modifier.height(18.dp))
    Box(Modifier.fillMaxWidth().height(1.dp).background(Color(0xFFE6ECE4)))
    Spacer(Modifier.height(18.dp))
}
