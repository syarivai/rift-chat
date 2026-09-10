---
name: docs-diataxis
description: Diátaxis placement rules plus markdown content quality and link discipline for rift-chat's docs tree. Load before creating, moving, or reviewing any documentation.
---

# Documentation — Diátaxis and content quality

The docs tree follows [Diátaxis](https://diataxis.fr/). Index:
[`docs/README.md`](../../../docs/README.md).

## Pick the quadrant by the reader's need

| Quadrant        | Reader's need | The question it answers   | Voice                                               |
| --------------- | ------------- | ------------------------- | --------------------------------------------------- |
| **Tutorial**    | Learning      | "Teach me, step by step." | Second person, guided, one path, guaranteed to work |
| **How-to**      | A task done   | "How do I do X?"          | Imperative steps, assumes competence, may branch    |
| **Reference**   | A fact        | "What exactly is X?"      | Declarative, structured, complete, no teaching      |
| **Explanation** | Understanding | "Why is it like this?"    | Discursive, gives context, alternatives, trade-offs |

**The most common error is mixing them.** A tutorial that stops to explain trade-offs loses the
learner; a reference page that teaches becomes unscannable. If a page is doing two jobs, split
it and link.

### Placement tests

- Would a reader follow this start to finish on their first day? → **tutorial**
- Does it start from a goal the reader already has? → **how-to**
- Would a reader arrive already knowing what they want to look up? → **reference**
- Does it answer "why" or compare alternatives? → **explanation**
- Is it a decision with alternatives and consequences? → **explanation/adr/**, numbered

## This repo's structure

- `tutorials/` — one page. Adding a second needs a reason.
- `how-to/` — exactly two: `add-a-feature.md` and `run-and-test.md`. Task-shaped content goes
  into those, not into new files. `run-and-test.md` deliberately covers running, testing, the
  APK build, measurement, and troubleshooting.
- `reference/` — one page per lookup domain.
- `explanation/` — one page per concept, plus numbered ADRs.

## Frontmatter

Every document, no exceptions:

```yaml
---
title: 'Page title'
description: One sentence saying what the page contains.
category: tutorial | how-to | reference | explanation
---
```

## Content quality

- **Active voice.** "The store owns the outbox", not "the outbox is owned by the store".
- **Lead with the answer.** A reader who stops after the first paragraph should have the point.
- **One `# H1` per page**, matching the frontmatter title; no skipped heading levels.
- **Paragraphs ≤ 5 lines.** Tables and lists for anything enumerable.
- **Expand an acronym once**, on first use.
- **Fenced code blocks always carry a language.**
- **Tables need a header row**, and every column must earn its width.
- **Images need alt text** describing the content, not "screenshot".
- Say the number. "60 contacts, 20 per page" beats "a small number of contacts".

## Accuracy

Documentation that lies is worse than none.

- Every command must have been run, or be verifiable by the reader.
- Every version number must match `package.json`.
- Every API shape must match [`api-contract.md`](../../../docs/reference/api-contract.md),
  which is itself verified by `api-contract-verifier` against the live API.
- When behaviour changes, the doc changes in the **same commit**.

## Links

- Relative links between docs; never absolute paths from the filesystem root.
- Link on the first meaningful mention, not every mention.
- Every page ends with a **See also** section pointing at its neighbours.
- Check that link targets exist before committing:

```bash
grep -rhoE '\]\(([^)#h][^)]*)\)' docs | tr -d '()]' | sort -u
```

A forward reference to a file that does not exist yet is acceptable **only** if it is planned
in `delivery.md`; anything else is a broken link.
