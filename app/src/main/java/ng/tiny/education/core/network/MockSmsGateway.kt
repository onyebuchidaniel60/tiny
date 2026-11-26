package ng.tiny.education.core.network

import java.util.UUID

data class SmsMessage(
    val toE164: String,
    val body: String,
    val locale: String,
    val idempotencyKey: String,
)

data class SmsResult(
    val providerMessageId: String,
    val status: SmsDeliveryStatus,
    val segments: Int,
)

enum class SmsDeliveryStatus { ACCEPTED, QUEUED, FAILED, UNKNOWN }

interface SmsGateway {
    suspend fun send(message: SmsMessage): SmsResult
}

/**
 * Deterministic local adapter. It never contacts a provider and never spends
 * money. The "accepted" result is a mock acceptance, not delivery.
 */
class MockSmsGateway : SmsGateway {
    override suspend fun send(message: SmsMessage): SmsResult {
        require(message.toE164.startsWith("+234")) { "Mock adapter only accepts synthetic Nigerian test numbers." }
        require(message.body.isNotBlank()) { "Message body cannot be empty." }
        return SmsResult(
            providerMessageId = "mock-${UUID.randomUUID()}",
            status = SmsDeliveryStatus.QUEUED,
            segments = ng.tiny.education.core.domain.SmsSegments.estimate(message.body),
        )
    }
}
