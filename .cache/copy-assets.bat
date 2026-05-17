@echo off
echo === Menyalin Assets dari plan.assets ke lokasi yang benar ===

REM SFX
mkdir "assets\audio\sfx" 2>nul
xcopy "plan.assets\assets\audio\sfx\*" "assets\audio\sfx\" /Y /E
echo [OK] SFX copied

REM BGM - pindahkan musik dari music/ ke assets/audio/bgm/
mkdir "assets\audio\bgm" 2>nul
copy "music\level1.mp3" "assets\audio\bgm\level1.mp3" /Y
copy "music\level2.mp3" "assets\audio\bgm\level2.mp3" /Y
copy "music\boss.mp3" "assets\audio\bgm\boss.mp3" /Y
echo [OK] BGM moved

REM UI loading assets
xcopy "plan.assets\assets\ui\*" "assets\ui\" /Y /E
echo [OK] UI assets copied

REM Overlay meme images
xcopy "plan.assets\assets\images\overlays\*" "assets\images\overlays\" /Y /E
echo [OK] Overlay memes copied

REM Obstacle sprites
xcopy "plan.assets\assets\images\obstacles\*" "assets\images\obstacles\" /Y /E
echo [OK] Obstacle sprites copied

REM Player sprites
xcopy "plan.assets\assets\images\player\*" "assets\images\player\" /Y /E /S
echo [OK] Player sprites copied

REM Icon sprites
xcopy "plan.assets\assets\images\icons\*" "assets\images\icons\" /Y /E
echo [OK] Icon sprites copied

REM Boss sprite
xcopy "plan.assets\assets\images\boss\*" "assets\images\boss\" /Y /E
echo [OK] Boss sprite copied

echo.
echo === Semua assets sudah di-copy! ===
pause
