import os
import shutil
from pathlib import Path

import hou

import ignite


def save_next():
    current = Path(hou.hipFile.path())
    try:
        version = int(current.parts[-2].lstrip("v"))
    except Exception as e:
        hou.ui.displayMessage("Could not detect version in filepath...")
        return
    version += 1
    next_v = f"v{str(version).zfill(3)}"
    filename = current.name
    new_dir = current.parent.parent / next_v
    new_dir.mkdir(exist_ok=False)
    new_filepath = new_dir / filename
    hou.hipFile.save(str(new_filepath))
    ignite.update_env_version(next_v, version)
    anchor = new_dir / ".ign_scene.yaml"
    anchor.touch()


def scene_comment():
    hou.hipFile.save()
    path = hou.hipFile.path()
    choice, text = hou.ui.readInput("Comment")
    editor = hou.ui.paneTabOfType(hou.paneTabType.NetworkEditor)
    if choice >= 0:
        data = {"path": path, "comment": text}
        ignite.server_request("set_scene_comment", data)
        editor.flashMessage(image=None, message="Done", duration=3)
    else:
        editor.flashMessage(image=None, message="Failed to set comment", duration=3)


def scene_preview():
    hou.hipFile.save()
    path = Path(hou.hipFile.path()).parent
    output_path = path / "preview/preview.$F4.jpg"
    if output_path.parent.is_dir():
        shutil.rmtree(output_path.parent)
    output_path.parent.mkdir(exist_ok=True, parents=True)
    frange = hou.playbar.playbackRange()
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


def scene_thumbnail():
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
