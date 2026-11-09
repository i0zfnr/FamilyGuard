package com.familyguard.app

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.BatteryManager
import android.os.Environment
import android.os.StatFs
import org.json.JSONObject

data class TelemetryData(
    val batteryPercentage: Int?,
    val isCharging: Boolean?,
    val storageTotal: Long?,
    val storageAvailable: Long?,
    val networkType: String?
) {
    init {
        batteryPercentage?.let { require(it in 0..100) { "Battery percentage must be between 0 and 100." } }
        if (storageTotal != null && storageAvailable != null) {
            require(storageAvailable <= storageTotal) { "Available storage cannot exceed total storage." }
            require(storageTotal >= 0) { "Storage total must be non-negative." }
            require(storageAvailable >= 0) { "Storage available must be non-negative." }
        }
        networkType?.let {
            require(it in listOf("wifi", "cellular", "ethernet", "none", "other")) {
                "Invalid network type: $it"
            }
        }
    }

    fun toJson(): JSONObject {
        val json = JSONObject()
        batteryPercentage?.let { json.put("battery_percentage", it) }
        isCharging?.let { json.put("charging", it) }
        storageTotal?.let { json.put("storage_total", it) }
        storageAvailable?.let { json.put("storage_available", it) }
        networkType?.let { json.put("network_type", it) }
        return json
    }
}

object TelemetryCollector {
    fun collect(context: Context): TelemetryData {
        val batteryInfo = readBattery(context)
        val storageInfo = readStorage()
        val networkType = readNetworkType(context)

        return TelemetryData(
            batteryPercentage = batteryInfo.first,
            isCharging = batteryInfo.second,
            storageTotal = storageInfo.first,
            storageAvailable = storageInfo.second,
            networkType = networkType
        )
    }

    fun readBattery(context: Context): Pair<Int?, Boolean?> {
        return try {
            val batteryFilter = IntentFilter(Intent.ACTION_BATTERY_CHANGED)
            val batteryStatus: Intent? = context.registerReceiver(null, batteryFilter)
            val level = batteryStatus?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
            val scale = batteryStatus?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
            val status = batteryStatus?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1

            val percentage = if (level >= 0 && scale > 0) {
                ((level.toFloat() / scale.toFloat()) * 100).toInt().coerceIn(0, 100)
            } else {
                val bm = context.getSystemService(Context.BATTERY_SERVICE) as? BatteryManager
                bm?.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)?.takeIf { it in 0..100 }
            }

            val isCharging = when (status) {
                BatteryManager.BATTERY_STATUS_CHARGING, BatteryManager.BATTERY_STATUS_FULL -> true
                BatteryManager.BATTERY_STATUS_DISCHARGING, BatteryManager.BATTERY_STATUS_NOT_CHARGING -> false
                else -> {
                    val plugged = batteryStatus?.getIntExtra(BatteryManager.EXTRA_PLUGGED, -1) ?: -1
                    if (plugged > 0) true else null
                }
            }
            Pair(percentage, isCharging)
        } catch (_: Exception) {
            Pair(null, null)
        }
    }

    fun readStorage(): Pair<Long?, Long?> {
        return try {
            val stat = StatFs(Environment.getDataDirectory().path)
            val total = stat.totalBytes
            val available = stat.availableBytes
            Pair(total, available)
        } catch (_: Exception) {
            Pair(null, null)
        }
    }

    fun readNetworkType(context: Context): String {
        return try {
            val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
                ?: return "none"
            val activeNetwork = cm.activeNetwork ?: return "none"
            val capabilities = cm.getNetworkCapabilities(activeNetwork) ?: return "none"

            when {
                capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> "wifi"
                capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> "cellular"
                capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) -> "ethernet"
                else -> "other"
            }
        } catch (_: Exception) {
            "other"
        }
    }
}
