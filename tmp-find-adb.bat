@echo off
echo SEARCHING FOR adb.exe
dir /b /s "C:\adb.exe" 2>nul
dir /b /s "C:\Users\LSDs-Ryzen\AppData\Local\Android\Sdk\platform-tools\adb.exe" 2>nul
dir /b /s "C:\Users\LSDs-Ryzen\AppData\Local\Android\sdk\platform-tools\adb.exe" 2>nul
dir /b /s "C:\Program Files\Android\Sdk\platform-tools\adb.exe" 2>nul
dir /b /s "C:\Program Files (x86)\Android\android-sdk\platform-tools\adb.exe" 2>nul
dir /b /s "C:\Program Files\Android\platform-tools\adb.exe" 2>nul
dir /b /s "C:\Program Files (x86)\Android\platform-tools\adb.exe" 2>nul
echo SEARCH COMPLETE
