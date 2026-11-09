package com.familyguard.app

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.outlined.Security
import androidx.compose.material.icons.outlined.Shield
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

// -------------------------------------------------------------------------
// XennGuard Authentic Design System Colors (Matches Web & FigCraft)
// -------------------------------------------------------------------------
object XennPalette {
    val CanvasBg = Color(0xFFF7FAF7)
    val SurfaceCard = Color(0xFFFFFFFF)
    val SurfaceSubtle = Color(0xFFEDF3EE)
    val SurfaceInput = Color(0xFFF0F5F1)
    val BorderCard = Color(0xFFD7E3D9)
    val BorderSubtle = Color(0xFFE2ECE4)
    val BorderInput = Color(0xFFCFDCD2)

    val BrandPrimary = Color(0xFF1B3626) // Deep Pine Forest Green
    val BrandPrimaryHover = Color(0xFF264D37)
    val AccentSage = Color(0xFF275C37)
    val AccentSageSubtle = Color(0xFFEAF2EB)
    val AccentSky = Color(0xFF23527C)
    val AccentSkySubtle = Color(0xFFEEF4F8)

    val TextPrimary = Color(0xFF152219)
    val TextSecondary = Color(0xFF4D6253)
    val TextMuted = Color(0xFF6C8172)
    val TextInverse = Color(0xFFFFFFFF)

    val StatusOnline = Color(0xFF1A6E40)
    val StatusOnlineBg = Color(0xFFEBF5EE)
    val StatusOnlineBorder = Color(0xFFC6E6D0)

    val StatusWarning = Color(0xFF964B09)
    val StatusWarningBg = Color(0xFFFEF7EC)
    val StatusWarningBorder = Color(0xFFF9DEB7)

    val StatusCritical = Color(0xFF991B1B)
    val StatusCriticalBg = Color(0xFFFDF2F2)
    val StatusCriticalBorder = Color(0xFFF8D0D0)

    val Obsidian = Color(0xFF0A0E0C)
}

private val XennColorScheme = lightColorScheme(
    primary = XennPalette.BrandPrimary,
    onPrimary = Color.White,
    secondary = XennPalette.AccentSage,
    onSecondary = Color.White,
    background = XennPalette.CanvasBg,
    onBackground = XennPalette.TextPrimary,
    surface = XennPalette.SurfaceCard,
    onSurface = XennPalette.TextPrimary,
    surfaceVariant = XennPalette.SurfaceSubtle,
    onSurfaceVariant = XennPalette.TextSecondary,
    outline = XennPalette.BorderCard,
    error = XennPalette.StatusCritical,
    onError = Color.White
)

@Composable
fun XennGuardTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = XennColorScheme,
        typography = Typography(
            titleLarge = androidx.compose.ui.text.TextStyle(
                fontWeight = FontWeight.Bold,
                fontSize = 22.sp,
                letterSpacing = (-0.5).sp,
                color = XennPalette.TextPrimary
            ),
            titleMedium = androidx.compose.ui.text.TextStyle(
                fontWeight = FontWeight.Bold,
                fontSize = 17.sp,
                letterSpacing = (-0.3).sp,
                color = XennPalette.TextPrimary
            ),
            bodyLarge = androidx.compose.ui.text.TextStyle(
                fontSize = 14.5.sp,
                lineHeight = 21.sp,
                color = XennPalette.TextPrimary
            ),
            bodyMedium = androidx.compose.ui.text.TextStyle(
                fontSize = 13.5.sp,
                lineHeight = 19.sp,
                color = XennPalette.TextSecondary
            ),
            labelSmall = androidx.compose.ui.text.TextStyle(
                fontWeight = FontWeight.Bold,
                fontSize = 11.sp,
                letterSpacing = 1.2.sp,
                color = XennPalette.TextMuted
            )
        ),
        content = {
            Surface(
                modifier = Modifier.fillMaxSize(),
                color = XennPalette.CanvasBg,
                content = content
            )
        }
    )
}

// -------------------------------------------------------------------------
// Brand Header Platter (Matching Web Header & Docked Sidebar)
// -------------------------------------------------------------------------
@Composable
fun XennHeader(
    subtitle: String = "YOUR LITTLE UNIVERSE",
    isProtected: Boolean = false
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .border(1.dp, XennPalette.BorderCard, RoundedCornerShape(20.dp)),
        color = Color.White,
        shadowElevation = 2.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Dove Brandmark Box
                Box(
                    modifier = Modifier
                        .size(42.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(XennPalette.BrandPrimary)
                        .border(1.dp, Color(0xFF2B4D36), RoundedCornerShape(12.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Image(
                        painter = painterResource(R.drawable.xennguard_icon),
                        contentDescription = "XennGuard Dove Emblem",
                        modifier = Modifier.fillMaxSize()
                    )
                }

                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = "xenn",
                            fontWeight = FontWeight.Bold,
                            fontSize = 20.sp,
                            letterSpacing = (-0.5).sp,
                            color = XennPalette.TextPrimary
                        )
                        Text(
                            text = ".",
                            fontWeight = FontWeight.Bold,
                            fontSize = 20.sp,
                            color = XennPalette.AccentSage
                        )
                    }
                    Text(
                        text = subtitle,
                        fontWeight = FontWeight.Bold,
                        color = XennPalette.TextMuted,
                        fontSize = 10.sp,
                        letterSpacing = 1.2.sp
                    )
                }
            }

            // Status Pill
            Surface(
                shape = CircleShape,
                color = if (isProtected) XennPalette.StatusOnlineBg else XennPalette.SurfaceSubtle,
                modifier = Modifier.border(
                    1.dp,
                    if (isProtected) XennPalette.StatusOnlineBorder else XennPalette.BorderCard,
                    CircleShape
                )
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(7.dp)
                            .clip(CircleShape)
                            .background(if (isProtected) XennPalette.StatusOnline else XennPalette.TextMuted)
                    )
                    Text(
                        text = if (isProtected) "Active" else "Setup",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (isProtected) XennPalette.StatusOnline else XennPalette.TextSecondary
                    )
                }
            }
        }
    }
}
