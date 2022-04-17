import os
from pathlib import Path

current = Path(hou.hipFile.path())
version = int(current.parts[-2].lstrip("v"))
version += 1
next_v = str(version).zfill(3)
filename = current.name
new_dir = current.parent.parent / f"v{next_v}"
new_dir.mkdir(exist_ok=False)
new_filepath = new_dir / filename
hou.hipFile.save(str(new_filepath))
anchor = new_dir / ".ign_scene.yaml"
anchor.touch()
