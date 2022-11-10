import os
import logging
import shutil
from pathlib import Path

import hou

hou.hipFile.save()
path = Path(hou.hipFile.path()).parent
output_path = path / "preview/preview.$F4.jpg"
if output_path.parent.is_dir():
    shutil.rmtree(output_path.parent)
output_path.parent.mkdir(exist_ok=True, parents=True)
frange = hou.playbar.frameRange()
inc = round((frange[1] - frange[0]) / 25)

viewer = hou.ui.paneTabOfType(hou.paneTabType.SceneViewer)
viewport = viewer.selectedViewport()
settings = viewer.flipbookSettings().stash()
settings.frameRange(frange)
settings.frameIncrement(inc)
settings.useResolution(False)
settings.outputToMPlay(False)
settings.output(str(output_path))
viewer.flipbook(settings=settings)
print(f"Exported {frange} to {output_path}")

editor = hou.ui.paneTabOfType(hou.paneTabType.NetworkEditor)
editor.flashMessage(image=None, message="Done", duration=3)
