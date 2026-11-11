package com.familyguard.app

import org.json.JSONObject
import java.net.URI
import java.net.URLDecoder
import java.nio.charset.StandardCharsets
import java.util.UUID

data class PairingPayload(
    val server: String,
    val challengeId: String,
    val challengeToken: String,
    val deviceName: String? = null,
    val apiKey: String? = null
) {
    fun toQrString(): String {
        val json = JSONObject()
        json.put("server", server)
        json.put("challenge_id", challengeId)
        json.put("challenge_token", challengeToken)
        deviceName?.let { json.put("device_name", it) }
        apiKey?.let { json.put("api_key", it) }
        return json.toString()
    }
}

object PairingPayloadParser {
    private val HEX_64_REGEX = Regex("^[0-9a-fA-F]{64}$")

    fun parse(rawInput: String): PairingPayload {
        val trimmed = rawInput.trim()
        require(trimmed.isNotEmpty()) { "Pairing payload cannot be empty." }

        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
            val json = JSONObject(trimmed)
            val server = FamilyGuardApi.validateServer(json.optString("server"))
            val challengeId = json.optString("challenge_id").trim()
            val challengeToken = json.optString("challenge_token").trim()
            val deviceName = json.optString("device_name").takeIf { it.isNotBlank() }?.trim()
            val apiKey = json.optString("api_key").takeIf { it.isNotBlank() }?.trim()

            validateFields(challengeId, challengeToken)
            return PairingPayload(server, challengeId, challengeToken, deviceName, apiKey)
        }

        if (trimmed.startsWith("xennguard://") || trimmed.startsWith("https://")) {
            val uri = URI(trimmed)
            val queryParams = parseQueryParams(uri.rawQuery ?: "")
            val rawServer = queryParams["server"]
                ?: if (trimmed.startsWith("https://")) "${uri.scheme}://${uri.authority}" else null
                ?: throw IllegalArgumentException("Missing server origin in pairing link.")

            val server = FamilyGuardApi.validateServer(rawServer)
            val challengeId = queryParams["challenge_id"]
                ?: throw IllegalArgumentException("Missing challenge_id in pairing link.")
            val challengeToken = queryParams["challenge_token"]
                ?: throw IllegalArgumentException("Missing challenge_token in pairing link.")
            val deviceName = queryParams["device_name"]?.takeIf { it.isNotBlank() }
            val apiKey = queryParams["api_key"]?.takeIf { it.isNotBlank() }

            validateFields(challengeId, challengeToken)
            return PairingPayload(server, challengeId, challengeToken, deviceName, apiKey)
        }

        throw IllegalArgumentException("Unrecognized pairing payload. Must be valid JSON or xennguard:// URI.")
    }

    private fun validateFields(challengeId: String, challengeToken: String) {
        try {
            UUID.fromString(challengeId)
        } catch (_: Exception) {
            throw IllegalArgumentException("Invalid challenge ID. Must be a valid UUID.")
        }

        require(HEX_64_REGEX.matches(challengeToken)) {
            "Invalid challenge token. Must be a 64-character hexadecimal string."
        }
    }

    private fun parseQueryParams(query: String): Map<String, String> {
        if (query.isBlank()) return emptyMap()
        return query.split("&").mapNotNull { param ->
            val parts = param.split("=", limit = 2)
            if (parts.size == 2) {
                val key = URLDecoder.decode(parts[0], StandardCharsets.UTF_8.name())
                val value = URLDecoder.decode(parts[1], StandardCharsets.UTF_8.name())
                key to value
            } else null
        }.toMap()
    }
}
