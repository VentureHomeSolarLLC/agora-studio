---
skill_id: service-request-support
name: "Handle Service Request or Issue Report"
type: diagnostic
triggers:
  - "report issue"
  - "service visit"
  - "something wrong"
  - "system broken"
  - "need technician"
  - "panel damaged"
  - "error message"
  - "not producing"
required_concepts:
  - report-issue-service-visit
  - system-troubleshooting
  - monitoring-by-manufacturer
related_skills:
  - system-troubleshooting-support
  - warranty-claims
---

# Skill: Service Request Support

## Goal
Help the customer report an issue, gather necessary diagnostic information, determine if remote resolution is possible, and schedule a service visit if needed.

## Prerequisites
Before proceeding, gather:
1. Customer's system type (Enphase/SolarEdge/Tesla/SunPower)
2. Nature of the issue
3. Error messages or alerts (if any)
4. When issue started
5. Any troubleshooting already attempted

## Conversation Flow

### Step 1: Issue Classification

Ask: "Can you tell me what's happening with your system?"

Listen for:

**Physical Damage:**
- "panel looks cracked"
- "something hit my panels"
- "storm damage"
→ **Escalate to technician** (photos needed)

**Performance Issues:**
- "not producing"
- "production dropped"
- "app shows zero"
→ **Attempt remote diagnosis first**

**Error Messages:**
- Specific error codes
- App alerts
- Inverter warnings
→ **Document exact message, check against known issues**

**Connectivity:**
- "app won't load"
- "no data for days"
- "can't see my system"
→ **Usually resolvable remotely**

### Step 2: Information Gathering

**Always collect:**
- [ ] System type (Enphase/SolarEdge/Tesla/SunPower)
- [ ] Specific issue description
- [ ] When it started
- [ ] Any error messages (exact text if possible)

**If physical damage suspected:**
- [ ] Ask for photos
- [ ] Safety check: Any exposed wiring? Electrical hazards?
- [ ] Storm damage: When did storm occur?

**If performance issue:**
- [ ] Check monitoring data remotely
- [ ] Compare to expected production for time of year
- [ ] Ask if they've tried basic troubleshooting

**If error message:**
- [ ] Exact error code/text
- [ ] Where it appears (app, inverter, email)
- [ ] When it first appeared

### Step 3: Remote Diagnosis Attempt

**For Connectivity Issues:**
1. Check system online status in monitoring platform
2. If offline: Guide through connectivity troubleshooting
3. If online but no data: May be communication issue, schedule tech

**For Zero Production:**
1. Check if system is online
2. If online but zero: Likely inverter or breaker issue
3. Guide through breaker reset (reference system-troubleshooting Engram)
4. If breaker reset doesn't work: Schedule priority technician

**For Physical Damage:**
1. Request photos immediately
2. Assess safety risk
3. Schedule technician for inspection
4. If storm damage: Check if insurance claim needed

**For Error Codes:**
1. Check error against known issues database
2. Some errors clear remotely
3. Others require technician
4. Document error code for service ticket

### Step 4: Determine Resolution Path

**Remote Resolution Possible:**
- Connectivity reset
- Remote inverter restart (Tesla)
- Monitoring platform fix
- Customer education/training

**Technician Visit Required:**
- Physical damage
- Hardware failure
- Electrical issues
- Inverter replacement
- Complex diagnostics needed

### Step 5: Schedule or Resolve

**If Remote Resolution:**
> "I can see the issue and I believe we can resolve this remotely. Give me just a moment to [action]."

After resolution:
> "I've [action taken]. Your system should start showing normal data within the next 30 minutes. You'll receive a follow-up email confirming the resolution. Is there anything else I can help with?"

**If Technician Visit:**
> "Based on what you've described, this will require a technician to visit your home. I'm going to schedule that for you now."

Gather for scheduling:
- [ ] Preferred days/times
- [ ] Any access restrictions (gates, pets, etc.)
- [ ] Adult availability

Set expectations:
> "A technician will arrive within [timeframe]. They'll call you [when] to confirm. You'll need to be home during the visit. The technician will diagnose the issue and repair it if possible. If parts are needed, we'll schedule a follow-up visit once they're available."

### Step 6: Create Service Ticket

**Ticket must include:**
- Customer info (name, address, system type)
- Issue description
- Error messages/codes
- Troubleshooting attempted
- Remote diagnosis results
- Photos (if applicable)
- Urgency level
- Preferred scheduling window

## Priority Levels

**Priority 1 - Same Day:**
- Zero production (complete system down)
- Safety hazard (exposed wiring, sparks)
- Post-storm damage with electrical risk

**Priority 2 - 1-2 Days:**
- Significant production loss
- Hardware error codes
- Panel damage

**Priority 3 - 3-5 Days:**
- Minor performance issues
- Non-critical errors
- Monitoring only issues

**Priority 4 - 1-2 Weeks:**
- Cosmetic issues
- Education/training requests
- Non-urgent upgrades

## Common Issues Quick Reference

| Issue | First Action | Likely Resolution |
|-------|--------------|-------------------|
| **App won't load** | Check system online status | Remote reset |
| **Zero production** | Check breaker, inverter status | Reset or technician |
| **Panel damaged** | Request photos | Technician visit |
| **Error code** | Check against database | Varies by code |
| **Storm damage** | Safety check, photos | Priority technician |
| **WiFi changed** | Guide reconnection | Remote assistance |

## Escalation Triggers

**Escalate immediately if:**
- Safety hazard identified
- Customer is frustrated/escalating
- Issue is beyond your knowledge base
- Multiple failed resolution attempts
- Warranty claim needed

**Escalation path:**
1. Technical lead (complex diagnostics)
2. Field operations (scheduling priority)
3. Warranty team (coverage questions)
4. Manager (customer satisfaction issues)

## Resources to Reference

- System monitoring platforms (Enphase, SolarEdge, Tesla, SunPower)
- Known issues database
- System troubleshooting Engram
- Warranty coverage documentation
- Technician scheduling system
- Parts inventory system

## Follow-Up Requirements

**After remote resolution:**
- Email confirmation to customer
- Note in CRM
- Schedule follow-up check in 48 hours

**After technician dispatch:**
- Confirm scheduling call made
- Send appointment confirmation email
- Flag for post-visit follow-up
- Update CRM with ticket number
