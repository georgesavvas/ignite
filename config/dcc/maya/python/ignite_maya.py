import os
import shutil
from pathlib import Path

from PySide2 import QtWidgets
import maya.cmds as cmds
import maya.mel as mel

import ignite


ENV = os.environ


def maya_window():
    maya = QtWidgets.QApplication.instance()
    for w in maya.topLevelWidgets():
        if w.objectName() == "MayaWindow":
            return w


def init():
    create_menu()


def create_menu():
    if cmds.about(batch=True):
        return

    if cmds.menu("IgniteMenu", exists=True):
        cmds.deleteUI("IgniteMenu")

    if not cmds.menu("IgniteMenu", exists=True):
        menu = cmds.menu(
            "IgniteMenu",
            label="ignite",
            parent=mel.eval("$retvalue = $gMainWindow;"),
        )
        cmds.menuItem(
            label="Save",
            parent=menu,
            command=lambda arg: save(),
        )
        cmds.menuItem(
            label="Save As Next Version (Ignite)",
            parent=menu,
            command=lambda arg: save_next(),
        )
        cmds.menuItem(
            parent=menu,
            divider=True
        )
        cmds.menuItem(
            label="Set Scene Comment",
            parent=menu,
            command=lambda arg: scene_comment(),
        )
        cmds.menuItem(
            label="Set Scene Thumbnail",
            parent=menu,
            command=lambda arg: scene_thumbnail(),
        )
        cmds.menuItem(
            label="Set Scene Preview",
            parent=menu,
            command=lambda arg: scene_preview(),
        )


def save():
    cmds.file(save=True)


def save_next():
    current = Path(cmds.file(q=True, sn=True))
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
    path = cmds.file(q=True, sn=True)
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
        cmds.inViewMessage(msg="Done", f=True, fot=3)
        return
    cmds.inViewMessage(msg="Failed to set comment", f=True, fot=3)


def playblast(path, frange):
    frame_settings = {
        "startTime": frange[0],
        "endTime": frange[1]
    }
    if len(frange) == 3 and frange[2] > 1:
        frames = list(range(frange[0], frange[1], frange[2]))
        print(f"Playblast frames: {frames}")
        frame_settings = {
            "frame": frames
        }
    cmds.setAttr("defaultRenderGlobals.imageFormat", 8)
    cmds.playblast(
        filename=path,
        forceOverwrite=True,
        format="image",
        viewer=False,
        **frame_settings
    )


def scene_preview():
    save()
    path = Path(cmds.file(q=True, sn=True)).parent
    output_path = path / "preview/preview"
    if output_path.parent.is_dir():
        shutil.rmtree(output_path.parent)
    output_path.parent.mkdir(exist_ok=True, parents=True)
    start_frame = round(cmds.playbackOptions(q=True, minTime=True))
    end_frame = round(cmds.playbackOptions(q=True, maxTime=True))
    inc = round((end_frame - start_frame) / 25)

    playblast(output_path, [start_frame, end_frame, inc])
    print(f"Exported {start_frame}-{end_frame} to {output_path}")

    cmds.inViewMessage(msg="Done", f=True, fot=3)


def scene_thumbnail():
    save()
    path = Path(cmds.file(q=True, sn=True)).parent
    path.mkdir(exist_ok=True, parents=True)
    output_path = path / "thumbnail.jpg"

    frame = cmds.currentTime(q=True)
    playblast(str(output_path), [frame, frame])
    print(f"Exported to {output_path}")

    cmds.inViewMessage(msg="Done", f=True, fot=3)
