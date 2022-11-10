import ignite
from importlib import reload
reload(ignite)


hou.hipFile.save()
path = hou.hipFile.path()
choice, text = hou.ui.readInput("Comment")
editor = hou.ui.paneTabOfType(hou.paneTabType.NetworkEditor)
if choice >= 0:
    data = {
        "path": path,
        "comment": text
    }
    ignite.server_request("set_scene_comment", data)
    editor.flashMessage(image=None, message="Done", duration=3)
else:
    editor.flashMessage(image=None, message="Failed to set comment", duration=3)
