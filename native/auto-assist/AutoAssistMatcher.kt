
package app.dailymb.autoassist

// Pure text matching. No Android imports, so it is unit-testable.
object AutoAssistMatcher {
    fun normalize(s: String): String = s.lowercase()
        .replace(Regex("[^\\p{L}\\p{N}\\s]"), " ")
        .replace(Regex("\\s+"), " ").trim()

    data class VerifiedAnswer(val questionText: String, val correctText: String, val verified: Boolean)

    /** Returns the correct option text to tap, or null to STOP. */
    fun matchOption(screenQuestion: String, screenOptions: List<String>, answers: List<VerifiedAnswer>): String? {
        val q = normalize(screenQuestion)
        val answer = answers.firstOrNull { normalize(it.questionText) == q } ?: return null
        if (!answer.verified) return null // never act on uncertain answers
        val target = normalize(answer.correctText)
        val matches = screenOptions.filter { normalize(it) == target }
        return if (matches.size == 1) matches[0] else null // ambiguous or missing -> stop
    }
}
