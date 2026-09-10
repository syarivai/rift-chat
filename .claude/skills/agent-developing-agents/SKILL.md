---
name: agent-developing-agents
description: The standard for writing agent definition files in .claude/agents/ — frontmatter, tool scoping, model tier, structure, and how agents cite the docs. Load when creating or editing an agent.
---

# Developing agents

Agents in `.claude/agents/` are markdown files with YAML frontmatter. They must be consistent,
because they are read by both humans and models scanning for the right one.

## Frontmatter

```yaml
---
name: rn-code-checker # kebab-case, matches the filename
description: <what it does, and when to use it — this is how it gets selected>
tools: Read, Grep, Glob, Bash, Write
model: sonnet # or opus / haiku; omit to inherit
color: green # maker=blue · checker=green · fixer=orange · reporter=purple
skills:
  - state-boundaries
  - criticality-confidence
---
```

- **`description` is the selection surface.** It must say what the agent does _and_ when to
  reach for it. "Validates code" is useless; "Validates feature code against the eight rules in
  CLAUDE.md; use before committing" is selectable.
- **`tools` are scoped to the role.** A checker gets no `Edit`. Giving a checker write access to
  source is how the [maker-checker-fixer](../maker-checker-fixer/SKILL.md) boundary quietly
  breaks.
- **`model`**: `sonnet` for structured validation against a well-specified rule set; `opus` for
  open-ended design, ambiguity, or judgement; `haiku` for mechanical, high-volume passes.
- **`skills`** lists what the agent loads. Prefer listing a skill over restating its content.

## Body structure

```markdown
# <Name> Agent

**Model selection**: one line on why this tier.

## Core responsibility

One paragraph. What it owns, and what it explicitly does not.

## When to use / when not to use

## Process

Numbered, concrete, with the actual commands.

## Output format

Exact shape. For checkers, the rated finding format.

## Reference documentation

Links into docs/ — the source of truth.
```

## The cardinal rule: cite, do not restate

An agent that restates the conventions will drift from them the first time the docs change, and
then two sources disagree with no way to tell which is stale.

- **Wrong**: pasting the FlatList tuning props into the agent body.
- **Right**: "Verify the row against the `rn-performance` skill and ADR 0003" — written as
  links relative to the agent file, i.e. `../skills/rn-performance/SKILL.md` and
  `../../docs/explanation/adr/0003-list-rendering-flatlist.md`.

The docs are the source of truth. Agents are procedures over them.

## Checker specifics

- **Enumerate before validating.** Never assume a file or surface exists.
- **Run the real command and read its output.** Reasoning about whether tests would pass, in
  place of running them, is guessing.
- Rate every finding on both axes — see
  [criticality-confidence](../criticality-confidence/SKILL.md).
- State the **consequence**, not just the rule.
- A clean run reports zero findings.

## Before adding a new agent

Ask whether an existing one should be extended instead. Ten agents that are each clearly
distinct beat fifteen with overlapping remits — an ambiguous catalog means the wrong agent gets
picked, which is worse than having one fewer.
