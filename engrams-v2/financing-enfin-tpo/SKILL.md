---
engram_id: financing-enfin-tpo
type: skill
difficulty: intermediate
time_estimate: 15-20 minutes
prerequisites:
- Customer signed contract
- System design complete
---

# Submit Enfin TPO Application

## Step 1: Verify Customer Eligibility
- [ ] Confirm customer wants TPO (not loan/cash)
- [ ] Check state eligibility (Enfin available in: CT, NY, NJ, MA, RI)

## Step 2: Run Credit Check
- [ ] Open Enfin portal → New Application
- [ ] Enter customer SSN, DOB, address
- [ ] Review TransUnion FICO score

### Decision Matrix
| FICO Score | Action |
|------------|--------|
| 700+ | Auto-approve, proceed to Step 3 |
| 620-699 | Stated income required, see [credit-requirements](../concepts/credit-requirements.md#stated-income) |
| < 620 | Declined, escalate to [financing-mosaic-loan](../../financing-mosaic-loan/) or cash option |

## Step 3: Upload Documentation
- [ ] For 700+ FICO: No additional docs required
- [ ] For 620-699: Customer enters stated income, confirms truthfulness
- [ ] Submit application

## Step 4: Monitor Status
- [ ] Check Enfin portal daily for approval
- [ ] If declined: Contact Enfin for reason, document in CRM
- [ ] If approved: Proceed to interconnection filing

## Key Information to Capture
- [ ] FICO score
- [ ] Stated income (if applicable)
- [ ] Application ID
- [ ] Approval/decline reason

## Common Issues

**"Application stuck in review"**
- Check if stated income flag triggered manual review
- Contact Enfin account manager with Application ID
- Typical resolution: 24-48 hours

**"Customer has utility delinquencies"**
- Experian checks utility payment history
- Past due notices: OK
- 10+ missed payments in 12 months: Potential issue
- Document findings in CRM notes
