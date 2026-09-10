---
name: gherkin-criteria
description: Writing Given/When/Then acceptance criteria for delivery.md tasks so every task has a testable done-condition. Load when writing or reviewing the delivery checklist.
---

# Gherkin acceptance criteria

Every task in [`delivery.md`](../../../plans/rift-chat-mvp/delivery.md) carries acceptance
criteria in Given/When/Then form. They are **prose specifications**, not executable step files
— this project deliberately does not use jest-cucumber. Their job is to make "done" a fact
rather than an opinion.

## Structure

```gherkin
Scenario: <the behaviour, in the user's language>
  Given <the starting state>
  When <the single action>
  Then <the observable outcome>
  And <any further observable outcome>
```

- **Given** — state, not actions. "Given the contact has three messages", not "Given I fetch".
- **When** — exactly one action. Two `When`s means two scenarios.
- **Then** — something **observable**: what appears on screen, what the store contains, what
  request was or was not made. Never an implementation detail.

## Rules

1. **Business language, not code.** "Then the message is still visible" — not "Then
   `outbox.byContact[5].length === 1`".
2. **One behaviour per scenario.** If you need "and then", write a second scenario.
3. **Observable outcomes only.** If you cannot see it in the UI, in persisted storage, or in a
   network log, it is not an acceptance criterion.
4. **Cover the failure path.** Every feature that touches the network needs a failure scenario.
   This is where most take-homes stop, and it is where the interesting design lives.
5. **Name the negative where it matters.** For this app, "Then no request is made to refetch
   the thread" is a genuine criterion — the absence of that call is the feature.

## Worked examples

```gherkin
Scenario: A sent message survives an app restart
  Given the user has sent "hello" to Alice
  When the app is force-quit and reopened
  And the user opens the conversation with Alice
  Then "hello" is visible in the thread
  And it is marked as sent

Scenario: A failed send is kept, not discarded
  Given the device is offline
  When the user sends "hello" to Alice
  Then "hello" appears in the thread immediately
  And it is marked as failed with a retry affordance
  And it is not removed from the conversation

Scenario: Sending does not destroy earlier messages
  Given the user has previously sent three messages to Alice
  When the user sends a fourth message
  Then all four messages are visible
  And no refetch of Alice's thread is triggered

Scenario: The contact list stops at the end of the data
  Given the contacts list has loaded all 60 contacts
  When the user scrolls to the bottom
  Then no further request is made
  And no loading footer is shown
```

## Anti-patterns

| Wrong                        | Why                                     | Right                                     |
| ---------------------------- | --------------------------------------- | ----------------------------------------- |
| `Then the mutation succeeds` | Not observable to a user                | `Then the message shows a delivered tick` |
| `When I call useSendMessage` | Implementation, not behaviour           | `When the user sends a message`           |
| `Then it works correctly`    | Untestable                              | Name the specific outcome                 |
| Three `When` steps           | Three scenarios wearing a trenchcoat    | Split them                                |
| Only happy paths             | The failure path is where the design is | Add the offline and error scenarios       |

## In delivery.md

Each task gets: a checkbox, a priority tier (P0/P1/P2), its acceptance criteria, and the
verification command that proves them. A task with no way to verify it is not a task — it is
a wish.
