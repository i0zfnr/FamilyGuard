package com.familyguard.app

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test

class PairingPayloadParserTest {

    private val validUuid = "f47ac10b-58cc-4372-a567-0e02b2c3d479"
    private val validToken = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

    @Test
    fun parsesValidJsonPayload() {
        val json = """
            {
                "server": "https://guard.example.com",
                "challenge_id": "$validUuid",
                "challenge_token": "$validToken",
                "device_name": "Pixel 8 Pro",
                "api_key": "sb_publishable_test"
            }
        """.trimIndent()

        val parsed = PairingPayloadParser.parse(json)
        assertEquals("https://guard.example.com", parsed.server)
        assertEquals(validUuid, parsed.challengeId)
        assertEquals(validToken, parsed.challengeToken)
        assertEquals("Pixel 8 Pro", parsed.deviceName)
        assertEquals("sb_publishable_test", parsed.apiKey)
    }

    @Test
    fun parsesValidUriPayload() {
        val uri = "xennguard://enroll?server=https%3A%2F%2Fguard.example.com&challenge_id=$validUuid&challenge_token=$validToken&device_name=Grandpa+Phone"

        val parsed = PairingPayloadParser.parse(uri)
        assertEquals("https://guard.example.com", parsed.server)
        assertEquals(validUuid, parsed.challengeId)
        assertEquals(validToken, parsed.challengeToken)
        assertEquals("Grandpa Phone", parsed.deviceName)
    }

    @Test
    fun parsesHttpsUriPayload() {
        val uri = "https://guard.example.com/enroll?challenge_id=$validUuid&challenge_token=$validToken"

        val parsed = PairingPayloadParser.parse(uri)
        assertEquals("https://guard.example.com", parsed.server)
        assertEquals(validUuid, parsed.challengeId)
        assertEquals(validToken, parsed.challengeToken)
        assertNull(parsed.deviceName)
    }

    @Test
    fun rejectsInvalidUuid() {
        val json = """
            {
                "server": "https://guard.example.com",
                "challenge_id": "not-a-uuid",
                "challenge_token": "$validToken"
            }
        """.trimIndent()

        assertThrows(IllegalArgumentException::class.java) {
            PairingPayloadParser.parse(json)
        }
    }

    @Test
    fun rejectsInvalidTokenLength() {
        val json = """
            {
                "server": "https://guard.example.com",
                "challenge_id": "$validUuid",
                "challenge_token": "too-short"
            }
        """.trimIndent()

        assertThrows(IllegalArgumentException::class.java) {
            PairingPayloadParser.parse(json)
        }
    }

    @Test
    fun rejectsUnsafeServerProtocol() {
        val json = """
            {
                "server": "http://insecure.example.com",
                "challenge_id": "$validUuid",
                "challenge_token": "$validToken"
            }
        """.trimIndent()

        assertThrows(IllegalArgumentException::class.java) {
            PairingPayloadParser.parse(json)
        }
    }

    @Test
    fun toQrStringProducesValidJson() {
        val payload = PairingPayload(
            server = "https://guard.example.com",
            challengeId = validUuid,
            challengeToken = validToken,
            deviceName = "Tablet",
            apiKey = "sb_publishable_test"
        )
        val qr = payload.toQrString()
        assertTrue(qr.contains(validUuid))
        assertTrue(qr.contains(validToken))
        assertTrue(qr.contains("https://guard.example.com"))

        val reParsed = PairingPayloadParser.parse(qr)
        assertEquals(payload.server, reParsed.server)
        assertEquals(payload.challengeId, reParsed.challengeId)
        assertEquals(payload.challengeToken, reParsed.challengeToken)
        assertEquals(payload.deviceName, reParsed.deviceName)
        assertEquals(payload.apiKey, reParsed.apiKey)
    }
}
