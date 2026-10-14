
package app.dailymb.autoassist

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import org.json.JSONArray
import java.io.File

// Sideload flavour only. See README.md in this folder for the guarantees.
class DailyMbAccessibilityService : AccessibilityService() {
    companion object { const val TARGET_PACKAGE = "com.telenor.pakistan.mytelenor" }
    @Volatile var enabledByUser: Boolean = false
    private var answers: List<AutoAssistMatcher.VerifiedAnswer> = emptyList()
    private var pendingClaim = false

    override fun onServiceConnected() {
        answers = loadVerifiedAnswers()
        logStep("service connected, ${answers.size} verified answers loaded")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (!enabledByUser) return
        if (event?.packageName?.toString() != TARGET_PACKAGE) return // never act anywhere else
        val root = rootInActiveWindow ?: run { stop("no root window"); return }
        if (pendingClaim) {
            if (tapByText(root, "Claim Now")) { logStep("tapped Claim Now"); pendingClaim = false } else stop("claim not found")
            return
        }
        val allTexts = mutableListOf<String>(); collectTexts(root, allTexts)
        val question = answers.firstOrNull { a -> allTexts.any { AutoAssistMatcher.normalize(it) == AutoAssistMatcher.normalize(a.questionText) } }
            ?: run { /* not a quiz screen we recognise */ return }
        val options = collectClickableTexts(root)
        val target = AutoAssistMatcher.matchOption(question.questionText, options, answers)
            ?: run { stop("no unique verified match"); return }
        if (!tapByText(root, target)) { stop("option node not tappable"); return }
        logStep("tapped matching option for one question")
        if (!tapByText(root, "Submit")) { stop("submit not found"); return }
        logStep("tapped Submit"); pendingClaim = true
    }
    override fun onInterrupt() { stop("interrupted") }
    private fun stop(reason: String) { logStep("STOP: $reason"); pendingClaim = false }
    private fun logStep(msg: String) { // Local only, step names only, no screen or personal data.
        try { File(filesDir, "auto-assist.log").appendText(msg + "\n") } catch (_: Exception) {} }

    private fun collectTexts(node: AccessibilityNodeInfo?, out: MutableList<String>) {
        if (node == null) return
        node.text?.toString()?.takeIf { it.isNotBlank() }?.let { out.add(it) }
        for (i in 0 until node.childCount) collectTexts(node.getChild(i), out)
    }
    private fun collectClickableTexts(root: AccessibilityNodeInfo): List<String> {
        val out = mutableListOf<String>()
        fun walk(n: AccessibilityNodeInfo?) {
            if (n == null) return
            if (n.isClickable) n.text?.toString()?.takeIf { it.isNotBlank() }?.let { out.add(it) }
            for (i in 0 until n.childCount) walk(n.getChild(i))
        }
        walk(root); return out
    }
    private fun tapByText(root: AccessibilityNodeInfo, wanted: String): Boolean {
        val nodes = root.findAccessibilityNodeInfosByText(wanted) ?: return false
        for (node in nodes) {
            var cur: AccessibilityNodeInfo? = node
            while (cur != null) {
                if (cur.isClickable) return cur.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                cur = cur.parent
            }
        }
        return false
    }
    // File written by the sideload build's RN bridge from the app's own cache:
    // [{ "questionText": "...", "correctText": "...", "verified": true }]
    private fun loadVerifiedAnswers(): List<AutoAssistMatcher.VerifiedAnswer> {
        return try {
            val f = File(filesDir, "auto-assist-answers.json"); if (!f.exists()) return emptyList()
            val arr = JSONArray(f.readText()); val out = mutableListOf<AutoAssistMatcher.VerifiedAnswer>()
            for (i in 0 until arr.length()) { val o = arr.getJSONObject(i)
                out.add(AutoAssistMatcher.VerifiedAnswer(o.getString("questionText"), o.getString("correctText"), o.optBoolean("verified", false))) }
            out
        } catch (_: Exception) { emptyList() }
    }
}
