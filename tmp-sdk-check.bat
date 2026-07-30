@echo off
echo ANDROID_HOME=%ANDROID_HOME%
echo ANDROID_SDK_ROOT=%ANDROID_SDK_ROOT%
echo SEARCHING COMMON ANDROID SDK PATHS...
if exist "C:\Users\LSDs-Ryzen\AppData\Local\Android\Sdk" echo FOUND C:\Users\LSDs-Ryzen\AppData\Local\Android\Sdk
if exist "C:\Users\LSDs-Ryzen\AppData\Local\Android\sdk" echo FOUND C:\Users\LSDs-Ryzen\AppData\Local\Android\sdk
if exist "C:\Android\Sdk" echo FOUND C:\Android\Sdk
if exist "C:\Program Files\Android\Android SDK" echo FOUND C:\Program Files\Android\Android SDK
if exist "C:\Program Files (x86)\Android\android-sdk" echo FOUND C:\Program Files (x86)\Android\android-sdk
echo DONE
