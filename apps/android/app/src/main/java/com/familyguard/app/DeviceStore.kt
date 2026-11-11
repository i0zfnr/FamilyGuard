package com.familyguard.app

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import java.security.KeyPairGenerator
import java.security.KeyStore
import java.security.Signature
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.spec.GCMParameterSpec

class DeviceStore(context: Context) {
    private val prefs = context.getSharedPreferences("familyguard_device", Context.MODE_PRIVATE)
    private val store = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
    private val identityAlias = "familyguard_identity"
    private val secretAlias = "familyguard_secret"

    fun identity(): String {
        if (!store.containsAlias(identityAlias)) {
            val generator = KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_RSA, "AndroidKeyStore")
            generator.initialize(KeyGenParameterSpec.Builder(identityAlias, KeyProperties.PURPOSE_SIGN)
                .setKeySize(2048).setDigests(KeyProperties.DIGEST_SHA256)
                .setSignaturePaddings(KeyProperties.SIGNATURE_PADDING_RSA_PKCS1).build())
            generator.generateKeyPair()
        }
        val encoded = Base64.encodeToString(store.getCertificate(identityAlias).publicKey.encoded, Base64.NO_WRAP)
        return "-----BEGIN PUBLIC KEY-----\n" + encoded.chunked(64).joinToString("\n") + "\n-----END PUBLIC KEY-----\n"
    }

    fun sign(value: String): String {
        val key = store.getKey(identityAlias, null) as java.security.PrivateKey
        val signature = Signature.getInstance("SHA256withRSA")
        signature.initSign(key); signature.update(value.toByteArray(Charsets.UTF_8))
        return Base64.encodeToString(signature.sign(), Base64.NO_WRAP)
    }

    fun save(server: String, token: String, deviceId: String, apiKey: String? = null) {
        if (!store.containsAlias(secretAlias)) {
            val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
            generator.init(KeyGenParameterSpec.Builder(secretAlias, KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).build())
            generator.generateKey()
        }
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, store.getKey(secretAlias, null))
        val encrypted = cipher.doFinal(token.toByteArray(Charsets.UTF_8))
        check(prefs.edit().putString("server", server).putString("device_id", deviceId).putString("api_key", apiKey)
            .putString("iv", Base64.encodeToString(cipher.iv, Base64.NO_WRAP))
            .putString("token", Base64.encodeToString(encrypted, Base64.NO_WRAP)).commit())
    }

    fun credential(): Triple<String, String, String?>? {
        val server = prefs.getString("server", null) ?: return null
        val encrypted = prefs.getString("token", null) ?: return null
        val iv = prefs.getString("iv", null) ?: return null
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.DECRYPT_MODE, store.getKey(secretAlias, null), GCMParameterSpec(128, Base64.decode(iv, Base64.NO_WRAP)))
        return Triple(server, String(cipher.doFinal(Base64.decode(encrypted, Base64.NO_WRAP)), Charsets.UTF_8), prefs.getString("api_key", null))
    }

    fun clear() {
        check(prefs.edit().clear().commit())
        if (store.containsAlias(identityAlias)) store.deleteEntry(identityAlias)
        if (store.containsAlias(secretAlias)) store.deleteEntry(secretAlias)
    }
}
