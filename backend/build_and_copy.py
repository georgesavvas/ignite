import platform
import subprocess
import sys
import shutil
from pathlib import Path

OS_NAME = platform.system()
CMDS = {
    "Windows": "pyinstaller --hidden-import=timeago.locales.en src/python/ignite/main.py --noconfirm --uac-admin --windowed --onefile --name=IgniteBackend --icon ../frontend/public/media/desktop_icon/win/icon.ico",
    "Darwin": "pyinstaller --hidden-import=timeago.locales.en src/python/ignite/main.py --noconfirm --windowed --onefile --codesign-identity 'Developer ID Application: Georgios Savvas (AJ25U37XWA)' --osx-entitlements-file ./entitlements.plist --deep --name=IgniteBackend --icon=../frontend/public/media/desktop_icon/mac/icon.icns",
    "Linux": "pyinstaller --hidden-import=timeago.locales.en src/python/ignite/main.py --noconfirm --windowed --onefile --name=IgniteBackend --icon=../icon.icns"
}

cmd = CMDS.get(OS_NAME)
if not cmd:
    print(f"Could not figure out platform name {OS_NAME}")
    sys.exit()
print(f"cmd: {cmd}")
subprocess.run(cmd.split())
current = Path(__file__)
backend_root = current.parent
source = backend_root / "dist"
target = backend_root / "../frontend"
for file in source.iterdir():
    if not file.name.startswith("IgniteBackend"):
        continue
    if not file.is_file():
        continue
    print(f"Copying {file} to {target}")
    shutil.copy2(file, target)
