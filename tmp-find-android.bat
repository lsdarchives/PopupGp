@echo off
echo SEARCHING FOR platform-tools...
for /d /r "C:\Users\LSDs-Ryzen\AppData\Local" %%D in (platform-tools) do echo FOUND %%D
for /d /r "C:\Program Files" %%D in (platform-tools) do echo FOUND %%D
for /d /r "C:\Program Files (x86)" %%D in (platform-tools) do echo FOUND %%D
echo SEARCH COMPLETE
