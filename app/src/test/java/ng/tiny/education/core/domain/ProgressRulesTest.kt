package ng.tiny.education.core.domain

import ng.tiny.education.core.model.ProgressIndicator
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ProgressRulesTest {
    @Test fun validatesLengths() {
        val ok = ProgressRules.validate(ProgressDraft(ProgressIndicator.DEVELOPING, "Short note", null))
        assertTrue(ok.valid)
        val tooLong = ProgressRules.validate(ProgressDraft(ProgressIndicator.DEVELOPING, "a".repeat(301), null))
        assertFalse(tooLong.valid)
    }

    @Test fun notAssessedRejectsNegativeJudgment() {
        val result = ProgressRules.validate(
            ProgressDraft(ProgressIndicator.NOT_ASSESSED, "Needs to improve", null),
        )
        assertFalse(result.valid)
    }

    @Test fun digestEligibilityRequiresApprovalAndExcludesNotAssessed() {
        assertTrue(ProgressRules.eligibleForDigest(ProgressIndicator.DOING_WELL, true))
        assertFalse(ProgressRules.eligibleForDigest(ProgressIndicator.DOING_WELL, false))
        assertFalse(ProgressRules.eligibleForDigest(ProgressIndicator.NOT_ASSESSED, true))
    }
}
