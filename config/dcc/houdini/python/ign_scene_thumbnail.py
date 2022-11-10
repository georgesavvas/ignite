import os
import logging
from pathlib import Path

hou.hipFile.save()
path = Path(hou.hipFile.path()).parent
output_path = path / "thumbnail.jpg"
output_path.parent.mkdir(exist_ok=True, parents=True)

viewer = hou.ui.paneTabOfType(hou.paneTabType.SceneViewer)
viewport = viewer.selectedViewport()
settings = viewer.flipbookSettings().stash()
frame = hou.frame()
settings.frameRange((frame, frame))
settings.useResolution(False)
settings.outputToMPlay(False)
settings.output(str(output_path))
viewer.flipbook(settings=settings)
print(f"Exported to {output_path}")

editor = hou.ui.paneTabOfType(hou.paneTabType.NetworkEditor)
editor.flashMessage(image=None, message="Done", duration=3)
