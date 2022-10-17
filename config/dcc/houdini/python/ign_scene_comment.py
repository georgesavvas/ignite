import ignite
from importlib import reload
reload(ignite)


hou.hipFile.save()
path = hou.hipFile.path()
choice, text = hou.ui.readInput("Comment")
if choice >= 0:
    data = {
        "path": path,
        "comment": text
    }
    ignite.server_request("set_scene_comment", data)
