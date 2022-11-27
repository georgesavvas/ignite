import platform
import subprocess
import sys
import shutil
from pathlib import Path

OS_NAME = platform.system()
CMDS = {
    "Windows": "pyinstaller src/python/ignite/main.py --noconfirm --uac-admin --windowed --onefile --name=IgniteBackend --icon ../frontend/public/media/desktop_icon/win/icon.ico",
    "Darwin": "pyinstaller src/python/ignite/main.py --noconfirm --windowed --onefile --name=IgniteBackend --icon=../frontend/public/media/desktop_icon/mac/icon.icns",
    "Linux": "pyinstaller src/python/ignite/main.py --noconfirm --windowed --onefile --name=IgniteBackend --icon=../icon.icns"
}

cmd = CMDS.get(OS_NAME)
if not cmd:
    print(f"Could not figure out platform name {OS_NAME}")
    sys.exit()
subprocess.run(cmd.split())
current = Path(__file__)
backend_root = current.parent
source = backend_root / "dist"
target = backend_root / "../frontend"
for file in source.iterdir():
    if not file.name.startswith("IgniteBackend"):
        continue
    print(f"Copying {file} to {target}")
    shutil.copy2(file, target)
