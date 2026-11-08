package com.familyguard.app

import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Test

class ServerAddressTest {
    @Test fun acceptsHttpsOrigin() {
        assertEquals("https://example.com:8443", FamilyGuardApi.validateServer(" https://example.com:8443/ "))
    }
    @Test fun rejectsUnsafeAddresses() {
        listOf("http://example.com", "https://user:pass@example.com", "https://example.com/path", "https://example.com/?token=secret", "https://example.com/#fragment").forEach {
            assertThrows(IllegalArgumentException::class.java) { FamilyGuardApi.validateServer(it) }
        }
    }
}
