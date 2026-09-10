---
name: criticality-confidence
description: The criticality × confidence classification every checker agent uses to rate findings, and the rule that only HIGH-confidence findings may be fixed. Load when producing or acting on a validation report.
---

# Criticality × confidence

Every finding a checker agent reports carries **two independent ratings**. Criticality says how
much it matters. Confidence says how sure you are it is real. Conflating them is what makes
review agents untrustworthy — a confident guess about a trivial issue gets treated like a
verified defect.

## Criticality — how much it matters

| Level        | Meaning                                                   | Examples in this repo                                                                             |
| ------------ | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **CRITICAL** | Data loss, a security hole, or a broken build             | `invalidateQueries` on a thread key; a secret in source; `npm run check` fails                    |
| **HIGH**     | A real defect users would hit                             | Infinite query never terminates; failed send silently disappears; a string missing from `ms`/`id` |
| **MEDIUM**   | Correct but wrong by convention; will cause defects later | Inline arrow prop on a list row; raw hex instead of a token; inline query-key literal             |
| **LOW**      | Style, naming, polish                                     | Wording, file placement, a redundant comment                                                      |

## Confidence — how sure you are

| Level              | Meaning                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| **HIGH**           | Verified. You read the code, or ran the command and read its output. You can name the exact failure.   |
| **MEDIUM**         | Consistent with the evidence, not confirmed. Needs a human or another run to settle.                   |
| **FALSE_POSITIVE** | Investigated and found not to be a problem. Report it as such — it stops the next agent re-raising it. |

**Confidence is earned by verification, not by conviction.** "This looks wrong" is MEDIUM. "I
ran the test and it fails with X" is HIGH.

## The iron rule

> **Only HIGH-confidence findings may be fixed.**

MEDIUM findings are reported for a human to judge. A fixer that acts on a hunch rewrites
working code and destroys trust in the whole pipeline — which is the single most common way
review automation fails.

## Priority

|                    | CRITICAL                 | HIGH        | MEDIUM      | LOW                 |
| ------------------ | ------------------------ | ----------- | ----------- | ------------------- |
| **HIGH conf.**     | P0 — fix now             | P1 — fix    | P2 — fix    | P3 — fix if trivial |
| **MEDIUM conf.**   | P1 — escalate to a human | P2 — report | P3 — report | P4 — note           |
| **FALSE_POSITIVE** | —                        | —           | —           | record and move on  |

## Report format

```text
[RULE] CRITICAL|HIGH|MEDIUM|LOW | <file>:<line> | <what is wrong and what it causes> | confidence: HIGH|MEDIUM|FALSE_POSITIVE
```

Every finding states the **consequence**, not just the rule. "Inline arrow prop on ContactRow —
defeats memo, re-renders all 60 rows on any parent update" is actionable. "Violates convention"
is not.

## Reporting honestly

- A clean run reports zero findings. Never manufacture findings to look thorough.
- If you could not verify something, say so and rate it MEDIUM. Do not upgrade to HIGH to make
  the report feel decisive.
- If a check could not run, report that the check did not run. A skipped step reported as a
  pass is worse than a failure.
