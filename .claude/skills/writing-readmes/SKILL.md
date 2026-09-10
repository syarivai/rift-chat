---
name: writing-readmes
description: README standards for rift-chat, whose root README is a graded submission artifact — structure, the required AI-usage section, screenshots, and the APK. Load before writing or editing any README.
---

# Writing READMEs

The root `README.md` is **the graded document**. A reviewer opens it before any code, decides
in about thirty seconds whether this looks like professional work, and reads the rest through
that impression. Treat it as the deliverable it is.

## What the brief explicitly requires

Straight from the assessment — each of these is a scored item, not a nicety:

1. An overview of the **project structure** and the **architectural design elements** worth
   highlighting.
2. An explanation of **how AI tools aided development**.
3. **Screenshots and/or screen recordings** of the app.
4. A committed **APK**.

A README missing any of these is incomplete regardless of quality.

## Structure

```markdown
# Rift Chat
One sentence: what it is and what it is built with.

[CI badge] [platform] [APK download]

## Demo
Screenshot table (4–6) + one GIF of the send → optimistic → persist → list-updates flow.

## Quick start
Four commands, maximum. Link to the tutorial for detail.

## The interesting part
The API stores nothing. What that forced, and why the outbox is the right answer.

## Architecture
The slice diagram, the dependency direction, and where the one domain layer is — and why
there is only one.

## Technical decisions
A table linking to the four ADRs, each with a one-line summary of the outcome.

## Performance
Measured numbers, before and after. Never an adjective.

## Testing
What is covered, what is deliberately not, and why.

## How AI aided development
See below — this is a required section.

## What I would do next
Honest scope notes: what was cut, and why.
```

## The AI-usage section

This section is an opportunity most candidates waste by writing "I used AI for boilerplate."
Be specific and verifiable:

- **What the AI did that mattered**: probed the live API and found that `POST` does not persist
  — the fact the whole design turns on; ran a structured design interrogation before any code;
  wrote the ADRs and the docs tree.
- **What the human decided**: every architectural fork, and the pushback — rejecting FlashList
  as unmeasured over-engineering, rejecting fabricated placeholder messages, setting the
  layering ceiling.
- **The mechanism**: the committed `.claude/` agents and skills, and `plans/rift-chat-mvp/`,
  are the actual evidence. Point at them.
- **Honest limits**: where the AI was wrong, and what had to be corrected.

A reviewer can verify all of this against the commit history, which is exactly why it is
credible.

## Demo assets

- 4–6 PNGs in a markdown table — they render inline on GitHub and load instantly.
- One GIF, not an MP4: GitHub autoplays GIFs inline while video needs a click.
- Assets live in `docs/assets/`. Compress before committing.
- Alt text describes the screen, not "screenshot 1".

## The APK

```markdown
**[Download the APK](./release/rift-chat-v1.0.0.apk)** · SHA-256 `abc123…`
Signed with a debug keystore — a review artifact, not a distributable build.
```

Publishing the checksum lets a reviewer verify the binary matches a build they run themselves.

## Style

- **Lead with what it is.** No throat-clearing, no "In today's fast-paced world".
- **Plain language.** Expand an acronym on first use.
- **Paragraphs ≤ 5 lines**; tables for anything enumerable.
- **Show, don't claim.** "Janky frames: 8.1% → 2.3%" beats "highly performant".
- **Be honest about what was cut.** A reviewer trusts a candidate who names their trade-offs
  far more than one whose README implies everything was finished perfectly.
