# Asset Sprites Guide

## Sprite Sheets Reference

Sprite sheets have been copied from `geometry-dash-assets` folder to `assets/sprites/` for reference:

- **GJ_GameSheet-hd.png** - Main game sprites (obstacles, portals, enemies, etc.) - HD version
- **GJ_GameSheet-hd.png** - Main game sprites - HD version
- **GJ_GameSheet02-hd.png** - Additional game sprites
- **GJ_GameSheet03-hd.png** - Shop/UI sprites (if needed)
- **GJ_GameSheet04-hd.png** - Extended sprites

## Current Rendering Approach

The game currently uses Canvas API to draw elements:
- **Portals (Ovals)**: Drawn using `ctx.ellipse()` with colored strokes and dots
- **Obstacles**: Drawn using custom functions (`drawSpike()`, `drawBlock()`, etc.)
- **Effects**: Generated via Canvas API (particles, trails, etc.)

## Asset Extraction

If you want to extract individual sprites from the sheet:

### Option 1: Manual Extraction (using image editing tools)
1. Open the sprite sheet PNG in an image editor (Photoshop, GIMP, etc.)
2. Identify the sprite location
3. Crop and save as individual PNG files in appropriate subdirectories:
   - `assets/images/obstacles/` - Obstacle sprites
   - `assets/images/portals/` - Portal sprites
   - `assets/images/effects/` - Effect sprites

### Option 2: Automated Extraction (requires metadata)
The original sprite sheets in `geometry-dash-assets` may have .plist files containing coordinate data. These can be used with tools to automatically extract sprites.

## Bug Fixes Applied

### ✅ Portal Collision Detection Fixed
- **Issue**: Green oval portal was using rectangular collision box instead of elliptical
- **Solution**: Added `intersectsEllipse()` function in `config.js` for proper oval collision detection
- **Files Modified**:
  - `js/config.js` - Added `intersectsEllipse()` function
  - `js/obstacles.js` - Updated `collidesWithPlayer()` to use ellipse collision for portals

## Next Steps

1. Test the game to verify portal collision works correctly
2. Consider using sprite sheets directly via Canvas sprite drawing if performance is needed
3. Extract individual sprites only if Canvas drawing is not sufficient

## References

- Sprite sheets source: `geometry-dash-assets` folder
- Game code: `js/assets.js` - Asset management and drawing
- Obstacles: `js/obstacles.js` - Obstacle spawning and collision
