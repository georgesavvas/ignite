cd %0\..\..\..\.. && ^
pyinstaller src/python/ignite/main.py --noconfirm --onefile --name=IgniteBackend --icon ../frontend/public/media/desktop_icon/win/icon.ico
copy dist\Ignite*.exe ..\frontend /Y
