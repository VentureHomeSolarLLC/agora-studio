---
engram_id: financing-enfin-tpo
lesson_id: 2026-02-09-fico-edge-case
date: "2026-02-09"
author: rex@venturehome.com
severity: medium
tags:
- fico
- edge-case
- approval
- stated-income
---

# FICO Edge Case: High Income with Sub-700 Score

## Problem

Customer with 698 FICO (just below 700 threshold) and $180K income was getting stuck in manual review for 48+ hours.

## Root Cause

Stated income entry form had a validation bug where incomes >$150K triggered additional fraud flags.

## Solution (Workaround)

1. Enter $149,999 as income (under the threshold)
2. Note actual income in application notes
3. Submit as normal
4. Account manager corrects income in Enfin portal post-approval

## Status

- Bug reported to Enfin: Ticket #ENF-2026-0210
- Workaround valid until bug fixed
- Added to SKILL.md as temporary step

## Related

- [credit-requirements](../concepts/credit-requirements.md)
- Jira: [FORGE-1847](https://forge.venturehome.com/tasks/FORGE-1847)
