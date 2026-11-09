package com.familyguard.app

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test

class TelemetryPayloadTest {

    @Test
    fun validPayloadBuildsCorrectJson() {
        val data = TelemetryData(
            batteryPercentage = 85,
            isCharging = true,
            storageTotal = 64000000000L,
            storageAvailable = 32000000000L,
            networkType = "wifi"
        )
        val json = data.toJson()

        assertEquals(85, json.getInt("battery_percentage"))
        assertTrue(json.getBoolean("charging"))
        assertEquals(64000000000L, json.getLong("storage_total"))
        assertEquals(32000000000L, json.getLong("storage_available"))
        assertEquals("wifi", json.getString("network_type"))
    }

    @Test
    fun allowsNullOptionalFields() {
        val data = TelemetryData(
            batteryPercentage = null,
            isCharging = null,
            storageTotal = 50000000L,
            storageAvailable = 25000000L,
            networkType = "cellular"
        )
        val json = data.toJson()

        assertFalse(json.has("battery_percentage"))
        assertFalse(json.has("charging"))
        assertEquals(50000000L, json.getLong("storage_total"))
        assertEquals("cellular", json.getString("network_type"))
    }

    @Test
    fun rejectsInvalidBatteryPercentage() {
        assertThrows(IllegalArgumentException::class.java) {
            TelemetryData(
                batteryPercentage = 101,
                isCharging = false,
                storageTotal = 1000L,
                storageAvailable = 500L,
                networkType = "wifi"
            )
        }

        assertThrows(IllegalArgumentException::class.java) {
            TelemetryData(
                batteryPercentage = -1,
                isCharging = false,
                storageTotal = 1000L,
                storageAvailable = 500L,
                networkType = "wifi"
            )
        }
    }

    @Test
    fun rejectsStorageAvailableExceedingTotal() {
        assertThrows(IllegalArgumentException::class.java) {
            TelemetryData(
                batteryPercentage = 50,
                isCharging = false,
                storageTotal = 1000L,
                storageAvailable = 2000L,
                networkType = "wifi"
            )
        }
    }

    @Test
    fun rejectsInvalidNetworkType() {
        assertThrows(IllegalArgumentException::class.java) {
            TelemetryData(
                batteryPercentage = 50,
                isCharging = false,
                storageTotal = 1000L,
                storageAvailable = 500L,
                networkType = "bluetooth"
            )
        }
    }
}
