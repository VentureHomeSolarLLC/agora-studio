---
skill_id: system-troubleshooting-support
name: "Guide Customer Through System Troubleshooting"
type: diagnostic
triggers:
  - "system not working"
  - "app showing error"
  - "no production"
  - "connectivity issue"
  - "monitoring offline"
  - "breaker tripped"
  - "system stopped producing"
required_concepts:
  - monitoring-by-manufacturer
  - system-troubleshooting
related_skills:
  - monitoring-setup
  - warranty-claims
---

# Skill: System Troubleshooting Support

## Goal
Help the customer resolve common solar system issues through systematic troubleshooting. Guide them through checking connectivity, breakers, and basic resets before escalating to a service visit.

## Prerequisites

Before proceeding, gather:
1. Customer's system type (Enphase/SolarEdge/Tesla/SunPower)
2. Error message or alert (if any)
3. When the issue started
4. What they've already tried

## Conversation Flow

### Step 1: Information Gathering

Ask: "What are you seeing in your monitoring app right now?"

Listen for:
- **Specific error codes/messages** → Note them for reference
- **No data/app won't load** → Likely connectivity
- **App loads but shows zero production** → Likely system fault or breaker
- **Partial production** → May be shading, panel issue, or inverter fault

### Step 2: Classify the Issue

**Connectivity Issue:**
- App loads but shows stale data
- Last update was hours/days ago
- No specific error, just no new data

**System Fault:**
- App shows error message or alert
- System shows zero production during daylight
- Breaker may be tripped

**Partial Production:**
- App shows some production but lower than normal
- May be weather-related or panel-level issue

### Step 3: Guide Through Troubleshooting

**For Connectivity Issues:**

1. Ask: "Has anything changed with your WiFi recently? New router, password change, network name change?"
   - If yes → Explain we can update credentials remotely
   - If no → Proceed to breaker check

2. Explain cellular backup (if applicable):
   > "Your system has cellular backup, so it's likely still producing even if the app isn't updating. Let's get the connection restored so you can monitor properly."

3. For SunPower (no cellular):
   > "Your system connects via WiFi only. Let's make sure your internet is working and then check if the system reconnects."

**For System Faults (Zero Production):**

Guide through breaker reset by system type:

**Enphase:**
> "Let's check your Enphase Combiner box. This is usually near your main electrical panel or in your garage. Can you locate it and open the door?"

Walk them through:
1. Opening the enclosure
2. Looking for breakers in middle/tripped position
3. Resetting by flipping fully off then on
4. Checking main panel solar breaker

**SolarEdge:**
> "Your SolarEdge inverter has two switches we can reset. First, can you locate the inverter? It's usually a gray box mounted on the side of your house."

Walk them through:
1. Red toggle switch to OFF ("0")
2. Black DC disconnect dial to OFF
3. Wait 30 seconds
4. DC disconnect back ON
5. Red toggle back ON ("1")
6. Wait for reboot (few minutes)

**Tesla:**
> "Tesla systems can often be restarted remotely. Let me check if I can do that for you right now."

Attempt remote restart via Tesla API if available. If not:
> "I'll need to escalate this to our technical team who can attempt a remote restart. If that doesn't work, we'll schedule a service visit."

**SunPower:**
> "Let's check your main electrical panel for a dedicated solar breaker. Can you check if any breakers are in the tripped position?"

If breakers look good but system still down:
> "The breakers look fine. Since this appears to be a system-level issue, I'll need to have our technical team review your system's data remotely and potentially schedule a service visit."

### Step 4: Verify Resolution

After customer attempts fix:

Ask: "Can you check your app now and tell me what you're seeing?"

**If resolved:**
> "Great! The system should be back to normal now. Keep an eye on your app over the next few hours to make sure production looks normal. Is there anything else I can help with?"

**If not resolved:**
> "I understand this is frustrating. Since the basic troubleshooting hasn't resolved it, I'm going to escalate this to our technical team. They can:
> - Review your system's data remotely
> - Attempt additional diagnostic steps
> - Schedule a service visit if needed
>
> You should hear from them within [timeframe]. In the meantime, your system may still be producing — you just can't see it in the app."

## Common Issues by System

| System | Most Common Issue | Quick Fix |
|--------|------------------|-----------|
| Enphase | Tripped breaker in combiner box | Reset breaker (off/on) |
| SolarEdge | Inverter needs reset | DC disconnect + toggle switch reset |
| Tesla | Software glitch | Remote restart (by tech team) |
| SunPower | WiFi connectivity | Router reboot, wait for reconnect |

## When to Escalate

**Escalate immediately if:**
- Customer is not comfortable checking electrical components
- System shows physical damage (burn marks, cracks, etc.)
- Multiple breakers are tripped repeatedly
- Customer reports burning smell or sparks
- It's after hours and system is completely down

**Escalate after basic troubleshooting if:**
- Breaker reset didn't work
- Connectivity fix didn't restore monitoring
- Error persists after attempted resolution
- Production remains zero during daylight hours

## Key Information to Capture

- [ ] System type
- [ ] Specific error message/code
- [ ] When issue started
- [ ] Weather conditions (affects production expectations)
- [ ] Any recent changes (WiFi, electrical work, storms)
- [ ] What customer has already tried
- [ ] Current production reading (if any)

## Resources to Reference

- System monitoring guide by manufacturer
- Breaker reset procedures (visual guide if available)
- Tesla remote restart procedure
- Service scheduling system
