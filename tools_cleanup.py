import platform
import subprocess
import sys
import shutil
from pathlib import Path

OS_NAME = platform.system()
NAMES = {
    "Windows": "win",
    "Darwin": "darwin",
    "Linux": "linux"
}

name = NAMES.get(OS_NAME)
if not name:
    print(f"Could not figure out platform name {OS_NAME}")
    sys.exit()

current = Path(__file__)
root = current.parent
tools = root / "tools"
for thing in tools.iterdir():
    if thing.is_file():
        continue
    if thing.name != name:
        print(f"Deleting {thing}")
        shutil.rmtree(thing)
