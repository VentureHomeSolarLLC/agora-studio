---
engram_id: system-troubleshooting
title: "System Troubleshooting: Errors, Connectivity, and Breaker Resets"
description: "Step-by-step guide for resolving common solar system issues"
category: troubleshooting
audience:
  - customer
tags:
  - troubleshooting
  - errors
  - connectivity
  - breakers
  - support
created: "2026-02-24"
updated: "2026-02-24"
---

# System Troubleshooting: Errors, Connectivity, and Breaker Resets

If your monitoring app is showing an error, your system appears to have stopped producing, or your app has lost connection to your system, there are a few simple things you can check before contacting support. This guide walks through the most common issues by system type.

---

## Step 1: Check Your Monitoring App

The first thing to do is open your monitoring app — Enphase, mySolarEdge, Tesla, SunPower, or SunStrong depending on your system. Look for any error alerts or notifications.

**If the app shows no recent data but no error:** The issue may be connectivity rather than a system fault.

**If the app shows a clear error or alert:** Note what it says before proceeding.

---

## Step 2: Check Your WiFi or Cellular Connection

All Venture Home monitoring systems communicate either over WiFi, cellular, or both. If your system loses its connection, your monitoring app may show stale or missing data even if your system is producing normally.

### Enphase, SolarEdge, and Tesla Customers

Your system uses **both WiFi and cellular** as a backup:
- If your home WiFi is down or your router was recently changed, your system will typically fall back to cellular automatically
- If you've changed your WiFi network name or password recently, your system may need to be reconnected
- **Contact Customer Success** and we can help update your network credentials remotely

### SunPower Customers (PV Supervisor)

Your system uses **WiFi only** and does not have cellular backup:
- If your home WiFi goes down or your router is restarted, your system may temporarily lose its connection
- Once your WiFi is restored, the system should reconnect on its own within a few minutes
- If it doesn't reconnect, **contact Customer Success**

> ⚠️ **Important:** A connectivity issue does not affect your system's production — your panels are still generating power even if the app isn't updating. However, it's worth resolving so your monitoring data stays accurate.

---

## Step 3: Check Your Breakers

If your app shows an error or your system appears to have stopped producing entirely, a tripped breaker is often the cause. Here's what to check by system type:

### Enphase Systems

Enphase systems have a dedicated **Enphase Combiner** or **IQ System Controller** enclosure, typically mounted near your main electrical panel or in your garage.

1. Open the enclosure door and look for any breakers inside
2. If a breaker is in the **tripped position** (middle or "off" position rather than fully on), flip it **fully off and then back on** to reset it
3. This is one of the most common reasons individual panels stop reporting in the Enphase app
4. Also check your main electrical panel for a dedicated solar breaker and confirm it is fully in the on position

### SolarEdge Systems

SolarEdge inverters have two key switches you can reset yourself:

1. Locate the **red ON/OFF toggle switch** on the inverter — flip it to the off ("0") position
2. Turn the **black DC disconnect dial** to the off position
3. **Wait at least 30 seconds** for the system to fully power down
4. Turn the DC disconnect back on
5. Flip the red toggle switch back to the on ("1") position
6. The inverter will take a few minutes to reboot

Also check your main panel for a dedicated solar breaker and confirm it hasn't tripped.

### Tesla Systems

Tesla solar systems and Powerwalls can be **restarted remotely** by our team in many cases.

If your Tesla system is showing an error or has stopped producing, **contact Customer Success** and we can attempt a remote restart before dispatching a technician.

### SunPower Systems

Check your main electrical panel for a dedicated solar breaker and confirm it is in the on position.

If everything looks normal on the breaker side but the system is still not producing or reporting, **contact Customer Success**.

---

## Still Seeing an Issue?

If you've checked your connectivity and breakers and the system is still not producing or the error hasn't cleared, **contact Customer Success**.

When you reach out, it helps to have the following handy:
- The error message or alert shown in your app
- Which system you have (Enphase, SolarEdge, Tesla, SunPower)
- Approximately when the issue started

Our team can review your system's data remotely and determine whether a service visit is needed.

---

## Contact Customer Success

- **Phone:** 800-203-4158
- **Email:** Via the Venture Home app
- **Webchat:** Available on our website during business hours

**Have this information ready:**
- Error message or alert
- System type (Enphase/SolarEdge/Tesla/SunPower)
- When the issue started
- What you've already tried
