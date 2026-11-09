package com.familyguard.app

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.security.KeyPairGenerator
import java.security.Signature
import java.util.Base64
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.spec.GCMParameterSpec

class AndroidCryptoPrimitivesTest {

    @Test
    fun rsa2048KeyGenerationAndSha256SignatureVerification() {
        val keyGen = KeyPairGenerator.getInstance("RSA")
        keyGen.initialize(2048)
        val keyPair = keyGen.generateKeyPair()

        val publicKey = keyPair.public
        val privateKey = keyPair.private

        // Format to PEM
        val encodedPub = Base64.getEncoder().encodeToString(publicKey.encoded)
        val pem = "-----BEGIN PUBLIC KEY-----\n" + encodedPub.chunked(64).joinToString("\n") + "\n-----END PUBLIC KEY-----\n"

        assertTrue(pem.startsWith("-----BEGIN PUBLIC KEY-----"))
        assertTrue(pem.endsWith("-----END PUBLIC KEY-----\n"))

        // Sign challenge payload: challenge_id:challenge_token
        val challengeId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
        val challengeToken = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
        val signedData = "$challengeId:$challengeToken".toByteArray(Charsets.UTF_8)

        val signer = Signature.getInstance("SHA256withRSA")
        signer.initSign(privateKey)
        signer.update(signedData)
        val signatureBytes = signer.sign()
        val signatureBase64 = Base64.getEncoder().encodeToString(signatureBytes)

        assertNotNull(signatureBase64)
        assertTrue(signatureBase64.isNotEmpty())

        // Verify with public key
        val verifier = Signature.getInstance("SHA256withRSA")
        verifier.initVerify(publicKey)
        verifier.update(signedData)
        assertTrue("Signature verification must succeed", verifier.verify(Base64.getDecoder().decode(signatureBase64)))
    }

    @Test
    fun aesGcmEncryptionDecryptionRoundTrip() {
        val keyGen = KeyGenerator.getInstance("AES")
        keyGen.init(256)
        val secretKey = keyGen.generateKey()

        val rawToken = "64charactertokenvalue1234567890abcdef1234567890abcdef1234567890"

        val encryptCipher = Cipher.getInstance("AES/GCM/NoPadding")
        encryptCipher.init(Cipher.ENCRYPT_MODE, secretKey)
        val iv = encryptCipher.iv
        val ciphertext = encryptCipher.doFinal(rawToken.toByteArray(Charsets.UTF_8))

        // Decrypt
        val decryptCipher = Cipher.getInstance("AES/GCM/NoPadding")
        decryptCipher.init(Cipher.DECRYPT_MODE, secretKey, GCMParameterSpec(128, iv))
        val decryptedBytes = decryptCipher.doFinal(ciphertext)
        val decryptedToken = String(decryptedBytes, Charsets.UTF_8)

        assertEquals(rawToken, decryptedToken)
    }
}
