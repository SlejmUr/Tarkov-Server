mkdir Build

copy "Server.exe" "Build/Server.exe"
xcopy "core" "Build/core/" /s/i/y
xcopy "db" "Build/db/" /s/i/y
xcopy "res" "Build/res/" /s/i/y
xcopy "src" "Build/src/" /s/i/y
xcopy "user" "Build/user/" /s/i/y

::x
del "Build/user/cache/" /s/q
del "Build/user/certs/" /s/q
del "Build/user/logs/" /s/q
rmdir "Build/user/profiles/" /s/q
mkdir "Build/user/profiles/" /q
rmdir "Build/user/mods" /s/q

del "Build/user/config/gameplay.json" /q
del "Build/user/config/server.json" /q

pause
