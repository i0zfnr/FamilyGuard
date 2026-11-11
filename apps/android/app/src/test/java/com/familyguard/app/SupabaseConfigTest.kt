package com.familyguard.app

import org.junit.Assert.assertEquals
import org.junit.Test

class SupabaseConfigTest {
    @Test
    fun invalidCredentialsExplainsConfirmationWithoutRevealingAccountState() {
        assertEquals(
            "Email or password is incorrect. If you just registered, confirm your email first.",
            signInErrorMessage(400, """{"error_code":"invalid_credentials","msg":"Invalid login credentials"}"""),
        )
    }

    @Test
    fun unconfirmedAccountPointsToEmailConfirmation() {
        assertEquals(
            "Confirm your email from the XennGuard signup message, then sign in again.",
            signInErrorMessage(400, """{"error_code":"email_not_confirmed"}"""),
        )
    }

    @Test
    fun validationFailureShowsActionableServiceMessage() {
        assertEquals(
            "Sign-in request was rejected (HTTP 422). Check the email format and update XennGuard before trying again.",
            signInErrorMessage(422, """{"msg":"Invalid request body."}"""),
        )
    }
}
