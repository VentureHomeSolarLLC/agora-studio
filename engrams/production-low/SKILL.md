---
skill_id: production-concern-support
name: "Handle Production Concern or 'Low Output' Report"
type: consultation
triggers:
  - "production seems low"
  - "bill went up"
  - "system not producing enough"
  - "lower than expected"
  - "underperforming"
  - "production dropped"
  - "not making enough energy"
required_concepts:
  - production-low
  - solar-utility-bill
  - monitoring-by-manufacturer
related_skills:
  - system-troubleshooting-support
  - service-request-support
---

# Skill: Production Concern Support

## Goal
Help customers understand whether their perceived "low production" is actually a problem or normal variation, educate on seasonal changes vs. actual issues, and diagnose real performance problems when they exist.

## Key Insight

**80% of "low production" calls are actually:**
- Higher bills due to increased consumption (not lower production)
- Normal seasonal variation (especially winter)
- Comparing wrong timeframes (winter vs. summer)

**Only 20% are actual system issues.**

## Conversation Flow

### Step 1: Clarify the Concern

**Ask:** "Can you tell me what you're seeing that makes you think production is low?"

**Listen for:**
- **Higher bill** → Likely consumption increase, not production issue
- **App shows lower numbers** → Check if seasonal/timeframe appropriate
- **"Not producing like it used to"** → Compare year-over-year
- **Zero production** → Actual system problem
- **One panel low** → Possible panel-level issue

**Critical distinction:**
> Production (kWh generated) ≠ Bill (grid usage after solar offset)

### Step 2: Quick Triage

**Ask qualifying questions:**

1. **"Has anything changed in your home recently? New appliances, EV, more people at home, etc.?"**
   - If yes → Likely consumption increase
   - If no → Continue investigation

2. **"What time of year are you comparing to?"**
   - Winter vs. summer → Normal seasonal variation
   - Same season last year → Potentially real issue
   - Recent weeks → Weather may be factor

3. **"Are you looking at your monitoring app, or your utility bill?"**
   - Monitoring app → Check actual production data
   - Utility bill → Likely consumption vs. production confusion

### Step 3: Education (Most Common Scenario)

**If consumption increase suspected:**

> "I want to make sure we're looking at the right thing. Your solar system produces power based on sunlight. Your utility bill shows how much electricity you pulled from the grid after solar. If you've started using more electricity — even if your solar is working perfectly — your bill can go up."

**Examples to mention:**
- Electric vehicle charging
- New pool or hot tub
- Work from home (more AC/heat, computers)
- New large appliances
- Guests or new family members
- Extreme weather (very hot summer, very cold winter)

**If seasonal variation:**

> "Solar production varies significantly by season. In winter, your system might produce 40-50% less than in summer due to shorter days and lower sun angle. This is completely normal and expected. Your system was sized for annual production, not monthly."

**Show the pattern:**
- December: ~40-60% of "average" monthly
- March/September: ~80-100% of average
- June: ~120-150% of average

### Step 4: Data Check (If Education Doesn't Resolve)

**If customer still concerned after education:**

Ask for monitoring app data:

> "Can you open your monitoring app and tell me what you're seeing? Specifically:
> - What was your production today or this week?
> - What does the production curve look like on sunny days?
> - Are there any error messages or alerts?"

**Access their monitoring remotely** (if possible) to verify.

**What to look for:**
- **Smooth bell curve on sunny days?** → System working normally
- **Flat line or gaps?** → Possible issue
- **Error codes?** → Specific problem
- **One section significantly lower?** → Panel or inverter issue
- **Zero on sunny days?** → System offline

### Step 5: Determine Real vs. Perceived Issue

**Perceived Issue (No Action Needed):**
- Higher bill due to consumption increase
- Normal seasonal variation
- Comparing wrong timeframes
- Recent cloudy weather

**Response:**
> "Based on what you're describing, your system appears to be working normally. The [higher bill/lower numbers] you're seeing is actually [consumption increase/seasonal variation/weather]. This is expected and your system is performing as designed. I'd recommend monitoring for a full year before drawing conclusions, since solar production varies significantly by season."

**Offer:** Send educational materials, schedule follow-up call in 3 months

**Real Issue (Action Required):**
- Zero production on sunny days
- Sudden significant drop (not gradual)
- Error codes in monitoring app
- System offline for extended period
- One panel/string significantly underperforming

**Response:**
> "Based on what you're describing, there may be an issue with your system that we need to investigate. I'm going to [access your monitoring remotely/schedule a technician] to diagnose the problem."

## Common Scenarios

### Scenario 1: Higher Bill, Normal Production

**Customer says:** "My bill is higher than last month"

**Investigate:**
- Check if production is actually down
- Ask about usage changes
- Compare bill to same month last year (not last month)

**Likely resolution:**
> "I can see your solar system is producing normally — actually right on track for this time of year. The higher bill is likely due to increased electricity usage. Have you started using [AC more/new appliance/EV charging] recently?"

**Action:** Educate on consumption vs. production, no service needed

### Scenario 2: Winter Production Concerns

**Customer says:** "My system is only producing half what it did in summer"

**Response:**
> "That's completely normal and expected! In winter, your system will produce 40-60% less than summer due to shorter days and lower sun angle. Your system was designed for annual production — summer surplus helps offset winter shortfalls. Let's compare your December production to last December to confirm everything is on track."

**Action:** Educational, compare year-over-year data

### Scenario 3: Actual System Problem

**Customer says:** "My app shows zero production for the past 3 days"

**Response:**
> "That definitely isn't normal. Let me check your system remotely right now. [Pause for checking] I can see [specific issue]. We're going to need to get a technician out to address this. I'm scheduling that for you now."

**Action:** Priority service dispatch

### Scenario 4: Gradual Decline Over Years

**Customer says:** "My system seems to produce less each year"

**Response:**
> "Solar panels do degrade slightly over time — typically about 0.5% per year. Over 10 years, that means roughly 5% lower production, which is normal and expected. Let's look at your actual production data to see if you're within that normal range, or if there might be something else going on like shading from growing trees."

**Action:** Analyze production trends, check for shading issues

### Scenario 5: One Panel Low (SolarEdge/Enphase)

**Customer says:** "One of my panels is showing much lower than the others"

**Investigate:**
- Check if persistent or temporary
- Look for shading (trees, debris)
- Check for panel-level error codes

**Response:**
> "I can see that one panel is underperforming. Let me check if there's a shading issue or equipment problem. [Check data] It looks like [shading from tree/panel issue]. [Schedule trim/replace panel]"

**Action:** Address root cause (trimming, panel replacement, etc.)

## Data Points to Verify

**Always check:**
- [ ] Current production vs. expected for time of year
- [ ] Year-over-year comparison (same month)
- [ ] Error codes or alerts in monitoring
- [ ] Weather conditions (cloudy streak)
- [ ] System online/offline status
- [ ] Any recent changes (shade, equipment, usage)

**Remote monitoring access:**
- Enphase Enlighten
- SolarEdge Monitoring
- Tesla App (customer can share)
- SunPower/SunStrong portal

## When to Escalate to Technician

**Immediate dispatch:**
- Zero production on sunny days
- System offline > 48 hours
- Inverter error codes
- Safety concerns (sparks, burning smell)

**Standard dispatch:**
- Gradual decline beyond normal degradation
- Persistent panel-level underperformance
- Suspected shading issues requiring trim
- Customer wants physical inspection for peace of mind

**No dispatch (education only):**
- Higher bills from consumption increase
- Normal seasonal variation
- Weather-related temporary dips
- Comparing wrong timeframes

## Key Phrases

**Reframing the conversation:**
> "Let's make sure we're looking at the right thing. Your solar production and your utility bill are related but different..."

**Setting seasonal expectations:**
> "In December, it's completely normal for your system to produce 40-50% less than it did in June. Shorter days and lower sun angle mean less production — that's by design."

**Validating concerns while educating:**
> "I totally understand why this is concerning. Let me check your actual production data to see what's happening... [review data] ...actually your system is working perfectly. Here's what I'm seeing..."

**When there is a real problem:**
> "You're right to be concerned. I can see [specific issue] in your monitoring data. We're going to get this fixed for you."

## Follow-Up

**After education (no issue):**
- Send educational materials
- Schedule check-in call in 3 months
- Note in CRM: "Customer educated on seasonal variation, follow up [date]"

**After service dispatch:**
- Confirm appointment scheduled
- Technician resolves issue
- Verify production returns to normal
- Follow up in 30 days to confirm all good

## Resources to Reference

- Customer monitoring platforms
- Historical production data
- Weather databases
- Shading analysis tools
- Expected production calculators
- System specifications
- Degradation rate data
