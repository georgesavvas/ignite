import os
import shutil
import requests
from pathlib import Path

import maya.OpenMaya as OpenMaya
import maya.cmds as cmds
import maya.utils
import maya.mel as mel


ENV = os.environ


def create_menu():
    if cmds.about(batch=True):
        # don't create menu in batch mode
        return

    # destroy any pre-existing shotgun menu - the one that holds the apps
    if cmds.menu("ShotgunMenu", exists=True):
        cmds.deleteUI("ShotgunMenu")

    # create a new shotgun disabled menu if one doesn't exist already.
    if not cmds.menu("ShotgunMenuDisabled", exists=True):
        sg_menu = cmds.menu(
            "ShotgunMenuDisabled",
            label=menu_name,
            # Get the mel global variable value for main window.
            # In order to get the global variable in mel.eval we have to assign it to another temporary value
            # so that it returns the result.
            parent=mel.eval("$retvalue = $gMainWindow;"),
        )
        cmds.menuItem(
            label="Sgtk is disabled.",
            parent=sg_menu,
            command=lambda arg: sgtk_disabled_message(),
        )


def ignite_request(server, method, data):
    address = ENV["IGNITE_SERVER_ADDRESS"]
    if server == "client":
        address = ENV["IGNITE_CLIENT_ADDRESS"]
    url = "http://{}/api/{}/{}".format(
        address,
        ENV["IGNITE_API_VERSION"],
        method
    )
    if data:
        resp = requests.post(url, json=data, timeout=5)
        return resp.json() if resp else {"ok": False}
    else:
        resp = requests.get(url)
        return resp.json() if resp else {"ok": False}


def server_request(method, data=None):
    return ignite_request("server", method, data)


def client_request(method, data=None):
    return ignite_request("client", method, data)


def save_next():
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


def scene_comment():
    hou.hipFile.save()
    path = hou.hipFile.path()
    choice, text = hou.ui.readInput("Comment")
    if choice >= 0:
        data = {
            "path": path,
            "comment": text
        }
        ignite.server_request("set_scene_comment", data)


def scene_preview():
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
