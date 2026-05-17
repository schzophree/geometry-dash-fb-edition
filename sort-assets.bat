@echo off
setlocal

set SRC=plan.assets\Texture2D
set DST=assets\images

:: Create target directories
mkdir "%DST%\obstacles\spikes" 2>nul
mkdir "%DST%\obstacles\sawblades" 2>nul
mkdir "%DST%\obstacles\blocks" 2>nul
mkdir "%DST%\obstacles\platforms" 2>nul
mkdir "%DST%\portals" 2>nul
mkdir "%DST%\orbs" 2>nul
mkdir "%DST%\decorations\ground" 2>nul
mkdir "%DST%\decorations\clouds" 2>nul
mkdir "%DST%\decorations\chains" 2>nul
mkdir "%DST%\decorations\vines" 2>nul
mkdir "%DST%\decorations\misc" 2>nul
mkdir "%DST%\effects\explosions" 2>nul
mkdir "%DST%\effects\particles" 2>nul
mkdir "%DST%\ui\buttons" 2>nul
mkdir "%DST%\ui\panels" 2>nul
mkdir "%DST%\background\game_bg" 2>nul
mkdir "%DST%\background\ground_tiles" 2>nul
mkdir "%DST%\coins" 2>nul

:: ===== SPIKES =====
copy /Y "%SRC%\RegularSpike*.png" "%DST%\obstacles\spikes\" >nul 2>&1
copy /Y "%SRC%\OutlineSpike*.png" "%DST%\obstacles\spikes\" >nul 2>&1
copy /Y "%SRC%\FakeSpike*.png" "%DST%\obstacles\spikes\" >nul 2>&1
copy /Y "%SRC%\spike_*_glow_*.png" "%DST%\obstacles\spikes\" >nul 2>&1

:: ===== SAWBLADES =====
copy /Y "%SRC%\RegularSawblade*.png" "%DST%\obstacles\sawblades\" >nul 2>&1
copy /Y "%SRC%\OutlineSawblade*.png" "%DST%\obstacles\sawblades\" >nul 2>&1
copy /Y "%SRC%\GearSawblade*.png" "%DST%\obstacles\sawblades\" >nul 2>&1
copy /Y "%SRC%\PointedSawblade*.png" "%DST%\obstacles\sawblades\" >nul 2>&1
copy /Y "%SRC%\SpikedBulbSawblade*.png" "%DST%\obstacles\sawblades\" >nul 2>&1
copy /Y "%SRC%\GearRotator*.png" "%DST%\obstacles\sawblades\" >nul 2>&1
copy /Y "%SRC%\SwirlRotator*.png" "%DST%\obstacles\sawblades\" >nul 2>&1
copy /Y "%SRC%\CartwheelRotator*.png" "%DST%\obstacles\sawblades\" >nul 2>&1
copy /Y "%SRC%\HexagonRotator*.png" "%DST%\obstacles\sawblades\" >nul 2>&1
copy /Y "%SRC%\IlluminationRotator*.png" "%DST%\obstacles\sawblades\" >nul 2>&1
copy /Y "%SRC%\InvertedGearRotator*.png" "%DST%\obstacles\sawblades\" >nul 2>&1
copy /Y "%SRC%\FlowerheadRotator*.png" "%DST%\obstacles\sawblades\" >nul 2>&1
copy /Y "%SRC%\OrbitalRotator*.png" "%DST%\obstacles\sawblades\" >nul 2>&1
copy /Y "%SRC%\PointedRotator*.png" "%DST%\obstacles\sawblades\" >nul 2>&1
copy /Y "%SRC%\TargetLockRotator*.png" "%DST%\obstacles\sawblades\" >nul 2>&1
copy /Y "%SRC%\PendulumRotator*.png" "%DST%\obstacles\sawblades\" >nul 2>&1

:: ===== BLOCKS =====
copy /Y "%SRC%\BrickBlock*.png" "%DST%\obstacles\blocks\" >nul 2>&1
copy /Y "%SRC%\ChippedBlock*.png" "%DST%\obstacles\blocks\" >nul 2>&1
copy /Y "%SRC%\ChequeredBlock*.png" "%DST%\obstacles\blocks\" >nul 2>&1
copy /Y "%SRC%\CrossBlock*.png" "%DST%\obstacles\blocks\" >nul 2>&1
copy /Y "%SRC%\GridBlock*.png" "%DST%\obstacles\blocks\" >nul 2>&1
copy /Y "%SRC%\PaneBlock*.png" "%DST%\obstacles\blocks\" >nul 2>&1
copy /Y "%SRC%\PatternedBlock*.png" "%DST%\obstacles\blocks\" >nul 2>&1
copy /Y "%SRC%\RegularBlock*.png" "%DST%\obstacles\blocks\" >nul 2>&1
copy /Y "%SRC%\TileBlock*.png" "%DST%\obstacles\blocks\" >nul 2>&1
copy /Y "%SRC%\DestructibleBlock*.png" "%DST%\obstacles\blocks\" >nul 2>&1
copy /Y "%SRC%\BlackBlock\*.png" "%DST%\obstacles\blocks\" >nul 2>&1

:: ===== PLATFORMS =====
copy /Y "%SRC%\MetallicPlatform*.png" "%DST%\obstacles\platforms\" >nul 2>&1
copy /Y "%SRC%\RegularPlatform*.png" "%DST%\obstacles\platforms\" >nul 2>&1
copy /Y "%SRC%\PanePlatform*.png" "%DST%\obstacles\platforms\" >nul 2>&1
copy /Y "%SRC%\WavyPlatform*.png" "%DST%\obstacles\platforms\" >nul 2>&1

:: ===== PORTALS =====
copy /Y "%SRC%\portal_*.png" "%DST%\portals\" >nul 2>&1

:: ===== ORBS =====
copy /Y "%SRC%\ring_*.png" "%DST%\orbs\" >nul 2>&1
copy /Y "%SRC%\dashRing_*.png" "%DST%\orbs\" >nul 2>&1
copy /Y "%SRC%\dropRing_*.png" "%DST%\orbs\" >nul 2>&1
copy /Y "%SRC%\gravJumpRing_*.png" "%DST%\orbs\" >nul 2>&1
copy /Y "%SRC%\gravring_*.png" "%DST%\orbs\" >nul 2>&1

:: ===== GROUND DECOR =====
copy /Y "%SRC%\*GroundDecor*.png" "%DST%\decorations\ground\" >nul 2>&1
copy /Y "%SRC%\GrassDecor*.png" "%DST%\decorations\ground\" >nul 2>&1
copy /Y "%SRC%\StonesDecor*.png" "%DST%\decorations\ground\" >nul 2>&1
copy /Y "%SRC%\*Pit*.png" "%DST%\decorations\ground\" >nul 2>&1

:: ===== CLOUD DECOR =====
copy /Y "%SRC%\CloudDecor*.png" "%DST%\decorations\clouds\" >nul 2>&1
copy /Y "%SRC%\StylisedCloudDecor*.png" "%DST%\decorations\clouds\" >nul 2>&1

:: ===== CHAINS =====
copy /Y "%SRC%\ChainDecor*.png" "%DST%\decorations\chains\" >nul 2>&1
copy /Y "%SRC%\StylisedChain*.png" "%DST%\decorations\chains\" >nul 2>&1

:: ===== VINES =====
copy /Y "%SRC%\VineDecor*.png" "%DST%\decorations\vines\" >nul 2>&1
copy /Y "%SRC%\ReedDecor*.png" "%DST%\decorations\vines\" >nul 2>&1
copy /Y "%SRC%\FlowerDecor*.png" "%DST%\decorations\vines\" >nul 2>&1

:: ===== MISC DECORATIONS =====
copy /Y "%SRC%\RainbowDecor*.png" "%DST%\decorations\misc\" >nul 2>&1
copy /Y "%SRC%\WaveAnimatedDecor*.png" "%DST%\decorations\misc\" >nul 2>&1
copy /Y "%SRC%\CurvedLineDecor*.png" "%DST%\decorations\misc\" >nul 2>&1
copy /Y "%SRC%\SerratedBackdropDecor*.png" "%DST%\decorations\misc\" >nul 2>&1
copy /Y "%SRC%\LargePulsator*.png" "%DST%\decorations\misc\" >nul 2>&1
copy /Y "%SRC%\SmallPulsator*.png" "%DST%\decorations\misc\" >nul 2>&1
copy /Y "%SRC%\WarningSign.png" "%DST%\decorations\misc\" >nul 2>&1

:: ===== EXPLOSIONS / EFFECTS =====
copy /Y "%SRC%\explosionIcon_*.png" "%DST%\effects\explosions\" >nul 2>&1
copy /Y "%SRC%\fireball_*.png" "%DST%\effects\particles\" >nul 2>&1
copy /Y "%SRC%\waterSplash_*.png" "%DST%\effects\particles\" >nul 2>&1
copy /Y "%SRC%\waterfallAnim_*.png" "%DST%\effects\particles\" >nul 2>&1
copy /Y "%SRC%\boost_*.png" "%DST%\effects\particles\" >nul 2>&1

:: ===== UI =====
copy /Y "%SRC%\GJ_playBtn*.png" "%DST%\ui\buttons\" >nul 2>&1
copy /Y "%SRC%\GJ_replayBtn*.png" "%DST%\ui\buttons\" >nul 2>&1
copy /Y "%SRC%\GJ_menuBtn*.png" "%DST%\ui\buttons\" >nul 2>&1
copy /Y "%SRC%\GJ_optionsBtn*.png" "%DST%\ui\buttons\" >nul 2>&1
copy /Y "%SRC%\GJ_pauseBtn*.png" "%DST%\ui\buttons\" >nul 2>&1
copy /Y "%SRC%\GJ_closeBtn*.png" "%DST%\ui\buttons\" >nul 2>&1
copy /Y "%SRC%\GJ_checkpointBtn*.png" "%DST%\ui\buttons\" >nul 2>&1
copy /Y "%SRC%\GJ_practiceBtn*.png" "%DST%\ui\buttons\" >nul 2>&1
copy /Y "%SRC%\GJ_normalBtn*.png" "%DST%\ui\buttons\" >nul 2>&1
copy /Y "%SRC%\GJ_arrow_*.png" "%DST%\ui\buttons\" >nul 2>&1
copy /Y "%SRC%\GJ_newBest_001.png" "%DST%\ui\panels\" >nul 2>&1
copy /Y "%SRC%\GJ_levelComplete_001.png" "%DST%\ui\panels\" >nul 2>&1
copy /Y "%SRC%\GJ_practiceComplete_001.png" "%DST%\ui\panels\" >nul 2>&1
copy /Y "%SRC%\GJ_topBar_001.png" "%DST%\ui\panels\" >nul 2>&1
copy /Y "%SRC%\pause_001.png" "%DST%\ui\panels\" >nul 2>&1
copy /Y "%SRC%\checkpoint_01_001.png" "%DST%\ui\panels\" >nul 2>&1
copy /Y "%SRC%\checkpoint_01_glow_001.png" "%DST%\ui\panels\" >nul 2>&1

:: ===== BACKGROUNDS =====
copy /Y "%SRC%\game_bg_*.png" "%DST%\background\game_bg\" >nul 2>&1
copy /Y "%SRC%\groundSquare_*.png" "%DST%\background\ground_tiles\" >nul 2>&1

:: ===== COINS =====
copy /Y "%SRC%\secretCoin_*.png" "%DST%\coins\" >nul 2>&1
copy /Y "%SRC%\coins.png" "%DST%\coins\" >nul 2>&1

:: ===== MONSTERS (enemy-like) =====
copy /Y "%SRC%\Monster*.png" "%DST%\enemy\" >nul 2>&1

echo === ASSET SORTING COMPLETE ===
