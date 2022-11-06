import os
import shutil
from pathlib import Path

import NatronEngine
import NatronGui

import ignite


print("Hello from ignite_natron")
ENV = os.environ


def create_menu():
    NatronGui.PyGuiApplication.addMenuCommand("Ignite/Save", "save")
    NatronGui.PyGuiApplication.addMenuCommand(
        "Ignite/Save Next Version (Ignite)",
        "save_next"
    )
    # NatronGui.PyGuiApplication.addMenuCommand(
    #     "Ignite/Set Scene Comment",
    #     "scene_comment"
    # )
    # NatronGui.PyGuiApplication.addMenuCommand(
    #     "Ignite/Set Scene Thumbnail",
    #     "scene_thumbnail"
    # )
    # NatronGui.PyGuiApplication.addMenuCommand(
    #     "Ignite/Set Scene Preview",
    #     "scene_preview"
    # )


def save():
    NatronEngine.saveProject()


def get_filename():
    path = NatronEngine.App.getProjectParam("projectPath")
    name = NatronEngine.App.getProjectParam("projectName")
    return Path(path) / name


def save_next():
    current = get_filename()
    version = int(current.parts[-2].lstrip("v"))
    version += 1
    next_v = str(version).zfill(3)
    filename = current.name
    new_dir = current.parent.parent / f"v{next_v}"
    new_dir.mkdir(exist_ok=False)
    new_filepath = new_dir / filename
    cmds.file(rename=str(new_filepath))
    cmds.file(save=True, type="mayaBinary")
    anchor = new_dir / ".ign_scene.yaml"
    anchor.touch()


def scene_comment():
    save()
    path = str(get_filename())
    text, ok = QtWidgets.QInputDialog().getText(
        maya_window(),
        "QInputDialog().getText()",
        "Comment",
        QtWidgets.QLineEdit.Normal
    )
    if ok and text:
        data = {
            "path": path,
            "comment": text
        }
        ignite.server_request("set_scene_comment", data)
        print("Comment set")
        return
    print("Failed to set comment")


def scene_preview():
    save()
    path = get_filename().parent
    output_path = path / "preview/preview"
    if output_path.parent.is_dir():
        shutil.rmtree(output_path.parent)
    output_path.parent.mkdir(exist_ok=True, parents=True)
    start_frame = round(cmds.playbackOptions(q=True, minTime=True))
    end_frame = round(cmds.playbackOptions(q=True, maxTime=True))
    inc = round((end_frame - start_frame) / 25)

    # flipbook implementation
    print(f"Exported {start_frame}-{end_frame} to {output_path}")


def scene_thumbnail():
    save()
    path = get_filename().parent
    path.mkdir(exist_ok=True, parents=True)
    output_path = path / "thumbnail.jpg"

    frame = cmds.currentTime(q=True)
    # flipbook implementation
    print(f"Exported to {output_path}")
