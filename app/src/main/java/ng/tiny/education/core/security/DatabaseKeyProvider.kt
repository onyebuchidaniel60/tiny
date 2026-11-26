package ng.tiny.education.core.security

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import java.security.KeyStore
import java.security.SecureRandom
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

/**
 * Wraps a random SQLCipher passphrase with a non-exportable Android Keystore key.
 *
 * The database passphrase is never stored in plaintext. If the wrapped value
 * cannot be decrypted, the app fails closed rather than silently replacing the
 * key and orphaning the encrypted database.
 */
class DatabaseKeyProvider(private val context: Context) {
    private val preferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    fun getOrCreatePassphrase(): ByteArray {
        val stored = preferences.getString(KEY_WRAPPED_PASSPHRASE, null)
        return if (stored == null) {
            val passphrase = ByteArray(32).also { SecureRandom().nextBytes(it) }
            storePassphrase(passphrase)
            passphrase
        } else {
            unwrap(stored)
        }
    }

    private fun storePassphrase(passphrase: ByteArray) {
        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(Cipher.ENCRYPT_MODE, getOrCreateWrappingKey())
        val ciphertext = cipher.doFinal(passphrase)
        val combined = ByteArray(cipher.iv.size + ciphertext.size)
        cipher.iv.copyInto(combined, 0)
        ciphertext.copyInto(combined, cipher.iv.size)
        preferences.edit()
            .putString(KEY_WRAPPED_PASSPHRASE, Base64.encodeToString(combined, Base64.NO_WRAP))
            .apply()
    }

    private fun unwrap(stored: String): ByteArray {
        val combined = Base64.decode(stored, Base64.NO_WRAP)
        require(combined.size > IV_SIZE) { "Stored database key material is invalid." }
        val iv = combined.copyOfRange(0, IV_SIZE)
        val ciphertext = combined.copyOfRange(IV_SIZE, combined.size)
        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(Cipher.DECRYPT_MODE, getOrCreateWrappingKey(), GCMParameterSpec(128, iv))
        return cipher.doFinal(ciphertext)
    }

    private fun getOrCreateWrappingKey(): SecretKey {
        val keyStore = KeyStore.getInstance(ANDROID_KEYSTORE).apply { load(null) }
        (keyStore.getKey(KEY_ALIAS, null) as? SecretKey)?.let { return it }

        val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, ANDROID_KEYSTORE)
        generator.init(
            KeyGenParameterSpec.Builder(
                KEY_ALIAS,
                KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT,
            )
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)
                .setRandomizedEncryptionRequired(true)
                .build(),
        )
        return generator.generateKey()
    }

    private companion object {
        const val ANDROID_KEYSTORE = "AndroidKeyStore"
        const val KEY_ALIAS = "tiny.database.wrapping.key.v1"
        const val PREFS_NAME = "tiny.database.key"
        const val KEY_WRAPPED_PASSPHRASE = "wrapped_passphrase"
        const val TRANSFORMATION = "AES/GCM/NoPadding"
        const val IV_SIZE = 12
    }
}
