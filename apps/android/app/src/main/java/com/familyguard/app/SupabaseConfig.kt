package com.familyguard.app

internal object SupabaseConfig {
    const val URL = "https://akepkkdckpgeioigpusx.supabase.co"
    const val PUBLISHABLE_KEY = "sb_publishable_hgx4tQdH9TtH99lxDvWTBQ_96YzYOlv"
}

internal fun signInErrorMessage(status: Int, responseBody: String): String {
    val payload = runCatching { org.json.JSONObject(responseBody) }.getOrNull()
    return when (payload?.optString("error_code")) {
        "invalid_credentials" -> "Email or password is incorrect. If you just registered, confirm your email first."
        "email_not_confirmed" -> "Confirm your email from the XennGuard signup message, then sign in again."
        "over_request_rate_limit", "over_email_send_rate_limit" -> "Too many attempts. Wait a few minutes, then try again."
        else -> {
            if (status == 422) {
                "Sign-in request was rejected (HTTP 422). Check the email format and update XennGuard before trying again."
            } else {
                "Sign-in failed (HTTP $status). Check your connection and try again."
            }
        }
    }
}
