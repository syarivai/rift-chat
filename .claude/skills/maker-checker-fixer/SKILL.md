---
name: maker-checker-fixer
description: The three-role quality pattern used by rift-chat's agents — makers build, checkers report rated findings, fixers apply only HIGH-confidence ones. Load when running a quality pass or writing a new agent.
---

# Maker · checker · fixer

Quality work is split into three roles with different tools and different authority. Keeping
them separate is what makes agent review trustworthy: the agent that wrote the code is the
worst judge of it, and the agent that judges it should not be free to rewrite it on a hunch.

## The three roles

| Role | Authority | Tools | Output |
| ---- | --------- | ----- | ------ |
| **Maker** | Creates and changes code or docs | Read, Write, Edit, Bash | The change, plus green gates |
| **Checker** | Reports findings. **Never edits.** | Read, Grep, Glob, Bash, Write (report only) | A rated validation report |
| **Fixer** | Applies findings | Read, Edit, Bash | Fixes, plus a fix report |

A checker that edits a file has broken the pattern. Its value is an independent opinion; the
moment it starts fixing, it is reviewing its own work again.

## The flow

```text
maker ──► change ──► checker ──► report ──► fixer ──► fixes ──► checker (re-run)
```

The re-run matters. A fix is not verified until the checker that raised the finding passes
cleanly.

## The iron rule

> **Fixers apply only HIGH-confidence findings.**

MEDIUM findings go to a human. See
[criticality-confidence](../criticality-confidence/SKILL.md) for how findings are rated and
why acting on MEDIUM destroys trust in the pipeline.

## Agents in this repo

| Domain | Maker | Checker |
| ------ | ----- | ------- |
| Features | `rn-feature-dev` | `rn-code-checker` |
| UI | `rn-feature-dev` | `rn-ui-checker` |
| Docs | `docs-maintainer` | `docs-maintainer` (check mode) |
| Delivery plan | — | `delivery-tracker` |
| Performance | `perf-auditor` | `perf-auditor` (measures, does not tune) |
| API contract | — | `api-contract-verifier` |
| Requirements | `requirement-extractor` | — |
| README | `readme-maker` | — |
| Pre-submission | — | `qa-tester` |

This repo is small enough that fixes are applied by the maker rather than a dedicated fixer
agent — but the **authority boundary still holds**: a checker reports, and someone else acts.

## Writing a checker

1. **Enumerate before validating.** Never assume a file or surface exists — look.
2. **Run the real command** and read its output. A checker that reasons about whether tests
   would pass, instead of running them, is guessing.
3. **Rate every finding** on both axes.
4. **State the consequence**, not just the rule.
5. **Report a clean run as clean.** Manufacturing findings to appear thorough is the failure
   mode that makes people stop reading reports.

## Writing a maker

1. Take the next unchecked task from `delivery.md`; do not invent scope.
2. Test-first where there is logic to test.
3. Run `npm run check` before claiming anything.
4. Tick the checklist item in the same commit as the work.
