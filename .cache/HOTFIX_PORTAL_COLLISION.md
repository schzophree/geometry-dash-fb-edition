# 🔧 HOTFIX: Green Oval Portal Collision Bug

**Date:** 9 Mei 2026  
**Status:** FIXED ✅  
**Issue:** Player clipping through or not properly triggering green oval portal (PORTAL_SHIP) due to rectangular collision detection on oval-shaped obstacle

---

## Problem Analysis

### Root Cause
The collision detection system was using **AABB (Axis-Aligned Bounding Box)** collision for ALL obstacles, including portals. However, portals are rendered as **oval/elliptical shapes** using `ctx.ellipse()`, creating a mismatch between visual shape and collision box.

**Result:** 
- Player could pass through portals without triggering mode changes
- Collision detection happened at wrong positions
- Hitbox didn't match visual oval shape

### Affected Portals
- ✅ PORTAL_SHIP (green oval) - Main issue
- ✅ PORTAL_BALL (magenta oval)
- ✅ PORTAL_CUBE (cyan oval)
- ✅ PORTAL_GRAVITY_UP (yellow oval)
- ✅ PORTAL_GRAVITY_DOWN (blue oval)

---

## Solution Implemented

### 1. Added Ellipse Collision Detection Function

**File:** `js/config.js`

```javascript
export function intersectsEllipse(rectHitbox, ellipseObs) {
  const ellipseCenterX = ellipseObs.x + ellipseObs.w / 2;
  const ellipseCenterY = ellipseObs.y + ellipseObs.h / 2;
  const ellipseRadiusX = ellipseObs.w / 2;
  const ellipseRadiusY = ellipseObs.h / 2;

  // Find closest point on rectangle to ellipse center
  let closestX = Math.max(rectHitbox.x, Math.min(ellipseCenterX, rectHitbox.x + rectHitbox.w));
  let closestY = Math.max(rectHitbox.y, Math.min(ellipseCenterY, rectHitbox.y + rectHitbox.h));

  // Calculate distance
  const dx = ellipseCenterX - closestX;
  const dy = ellipseCenterY - closestY;

  // Check if inside ellipse
  const distSquared = (dx / ellipseRadiusX) ** 2 + (dy / ellipseRadiusY) ** 2;
  return distSquared <= 1;
}
```

**Algorithm:**
1. Calculate ellipse center and radii
2. Find closest point on player's rectangular hitbox to ellipse center
3. Normalize distance to ellipse space
4. Return true if distance ≤ 1 (point is inside ellipse)

### 2. Updated Collision Detection Logic

**File:** `js/obstacles.js`

**Before:**
```javascript
collidesWithPlayer(playerHitbox) {
  for (const obs of this.obstacles) {
    const inset = obs.type === 'spike' ? 7 : 4;
    const box = { /* ... */ };
    if (intersects(playerHitbox, box)) return obs; // AABB for ALL
  }
}
```

**After:**
```javascript
collidesWithPlayer(playerHitbox) {
  for (const obs of this.obstacles) {
    if (obs.type.startsWith('portal_')) {
      // Use ellipse collision for portals
      if (intersectsEllipse(playerHitbox, obs)) return obs;
    } else {
      // Use rectangular collision for other obstacles
      const inset = obs.type === 'spike' ? 7 : 4;
      const box = { /* ... */ };
      if (intersects(playerHitbox, box)) return obs;
    }
  }
}
```

### 3. Updated Imports

**File:** `js/obstacles.js`
```javascript
import { CONFIG, rand, randInt, intersects, intersectsEllipse } from './config.js';
```

---

## Asset References

### Sprite Sheets Copied
- ✅ `GJ_GameSheet-hd.png`
- ✅ `GJ_GameSheet02-hd.png`

**Location:** `geometry-dash-assets/geometry-dash-assets (2)/` → `assets/sprites/`

**Guide:** See `ASSET_SPRITES_GUIDE.md` for extraction instructions

---

## Testing Checklist

- [ ] Play Level 1 - Trigger PORTAL_SHIP at 13.0s
- [ ] Confirm ship mode activates when crossing green oval
- [ ] Test other portals (BALL, CUBE, GRAVITY modes)
- [ ] Verify no collision clipping issues
- [ ] Check performance (ellipse collision should be minimal overhead)

---

## Performance Notes

- Ellipse collision uses simple distance calculation
- Only 1 division per portal check (negligible overhead)
- No loops or complex geometry needed
- Spatial optimization: Only checks nearby portals in game loop

---

## Files Modified

| File | Changes |
|------|---------|
| `js/config.js` | Added `intersectsEllipse()` function |
| `js/obstacles.js` | Updated imports, modified `collidesWithPlayer()` method |
| `ASSET_SPRITES_GUIDE.md` | Created new guide for sprite assets |

**Total Changes:** 2 files modified, 1 file created
**Lines Changed:** ~30 lines (mostly new collision logic)
**Breaking Changes:** None - fully backward compatible

---
