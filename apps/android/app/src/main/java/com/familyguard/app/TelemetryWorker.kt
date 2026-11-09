package com.familyguard.app

import android.content.Context
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.TimeUnit

class TelemetryWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    companion object {
        const val UNIQUE_PERIODIC_WORK = "xennguard_telemetry_periodic"

        fun schedulePeriodic(context: Context, repeatIntervalMinutes: Long = 15) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val workRequest = PeriodicWorkRequestBuilder<TelemetryWorker>(
                repeatIntervalMinutes,
                TimeUnit.MINUTES
            )
                .setConstraints(constraints)
                .build()

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                UNIQUE_PERIODIC_WORK,
                ExistingPeriodicWorkPolicy.UPDATE,
                workRequest
            )
        }

        fun cancel(context: Context) {
            WorkManager.getInstance(context).cancelUniqueWork(UNIQUE_PERIODIC_WORK)
        }

        fun enqueueImmediate(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val workRequest = OneTimeWorkRequestBuilder<TelemetryWorker>()
                .setConstraints(constraints)
                .build()

            WorkManager.getInstance(context).enqueue(workRequest)
        }
    }

    override suspend fun doWork(): Result {
        val store = DeviceStore(applicationContext)
        val credential = runCatching { store.credential() }.getOrNull() ?: return Result.success()
        val (server, token) = credential

        return try {
            // 1. Send heartbeat
            FamilyGuardApi.post(server, "/api/v1/agent/heartbeat", JSONObject(), token)

            // 2. Collect and send telemetry
            val telemetry = TelemetryCollector.collect(applicationContext)
            FamilyGuardApi.post(server, "/api/v1/agent/telemetry", telemetry.toJson(), token)

            // 3. Update ongoing notification to keep user visibly informed (zero covert tracking)
            val timeStr = SimpleDateFormat("HH:mm", Locale.US).format(Date())
            val batteryStatus = telemetry.batteryPercentage?.let { "Battery $it%" } ?: "Status OK"
            ZeroCovertNotificationService.updateStatus(
                applicationContext,
                "Health reported at $timeStr ($batteryStatus). Zero covert tracking active."
            )

            Result.success()
        } catch (e: Exception) {
            if (runAttemptCount < 3) {
                Result.retry()
            } else {
                Result.failure()
            }
        }
    }
}
