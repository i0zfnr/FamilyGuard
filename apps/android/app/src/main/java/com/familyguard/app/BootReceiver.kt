package com.familyguard.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            val store = DeviceStore(context)
            val isPaired = runCatching { store.credential() != null }.getOrDefault(false)
            if (isPaired) {
                // Ensure ongoing visible indicator is active and background telemetry is scheduled
                ZeroCovertNotificationService.start(context)
                TelemetryWorker.schedulePeriodic(context)
            }
        }
    }
}
