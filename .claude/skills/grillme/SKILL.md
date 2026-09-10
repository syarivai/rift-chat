---
name: grillme
description: Interview the user relentlessly about a plan or design, presenting choices one at a time until shared understanding is reached. Resolves every branch of the decision tree before implementation begins. Use when the user wants to stress-test a plan, get grilled on a design, or says "grill me".
---

# Grill Me

Stress-test plans and designs through relentless, structured questioning **before**
implementation begins. A decision made under questioning is worth more than three made by
default.

## When to activate

- The user says "grill me", "challenge my plan", "stress-test this", "interrogate my design",
  or any close variant.
- A new plan is being written and design decisions remain open.
- A design review is requested before committing to implementation.

## Process

Walk down every branch of the decision tree, resolving dependencies one at a time, until
shared understanding is reached.

**Rules:**

1. **Explore before asking.** Read the repo, the docs, and — where the question is about an
   external system — probe it. Never ask what a file read or a `curl` can answer. In this
   repo that means [`docs/reference/api-contract.md`](../../../docs/reference/api-contract.md)
   and the [ADRs](../../../docs/explanation/adr/README.md) are ground truth; the user is the
   tiebreaker for genuinely open decisions, not the lookup table for facts.
2. **Ask questions one at a time.** Tightly coupled decisions may be batched in a single
   prompt; unrelated ones may not.
3. **Present 2–4 concrete, mutually exclusive options.** Every option states its trade-off in
   at least one sentence. Open-ended questions with no options are forbidden.
4. **Mark exactly one option `(Recommended)`** and put it first, with the reasoning for the
   recommendation in its description.
5. **Order by dependency.** Ask the decision that cascades furthest first. A question whose
   answer is invalidated by a later answer was asked out of order.
6. **Push back when the user is wrong, and concede when they are right.** If the user rejects
   a recommendation with a sound argument, say so plainly, drop it, and record the reasoning.
   Agreeing performatively wastes the exercise.
7. **Name the real risk.** If the accumulated scope will not fit the schedule, say it in the
   moment rather than discovering it on the last day.

## Question format

Use the `AskUserQuestion` tool. One decision per question, 2–4 options, recommended option
first and labelled.

```text
AskUserQuestion(questions: [{
  question: "<the decision, with the constraint that makes it hard>?",
  header:   "<≤12 chars>",
  options: [
    { label: "<recommended> (Recommended)", description: "<why this wins, and what it costs>" },
    { label: "<alternative>",               description: "<what it buys, what it costs>" },
    { label: "<alternative>",               description: "<what it buys, what it costs>" },
    { label: "Let's chat about this",       description: "Discuss before committing" },
  ]
}])
```

## Questions worth asking in this repo

- Does this change touch server state or client state? (If the answer is "both", that is
  usually a design smell — see [state-boundaries](../state-boundaries/SKILL.md).)
- What happens to this feature when the request fails? When the device is offline?
- What does it cost in the three locales and both themes?
- Which delivery tier is it — P0, P1, or P2 — and what gets cut if it overruns?
- Is there a measurement that would prove this, rather than an argument that suggests it?

## After the grilling

1. Write the decision log to disk before summarising — do not rely on conversation memory.
2. Summarise every decision and its rationale.
3. State the risks that remain open.
4. Confirm shared understanding explicitly and wait for approval before implementing.
