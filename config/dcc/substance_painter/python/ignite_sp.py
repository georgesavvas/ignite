from pathlib import Path
from PySide2 import QtWidgets
import substance_painter.project as spp
import substance_painter.ui as spui
import ignite


main_window = spui.get_main_window()

def save():
    spp.save()


def current_filepath():
    return spp.file_path()


def save_next():
    current = Path(current_filepath())
    version = int(current.parts[-2].lstrip("v"))
    version += 1
    next_v = str(version).zfill(3)
    filename = current.name
    new_dir = current.parent.parent / f"v{next_v}"
    new_dir.mkdir(exist_ok=False)
    new_filepath = new_dir / filename
    spp.save_as(str(new_filepath))
    anchor = new_dir / ".ign_scene.yaml"
    anchor.touch()


def scene_comment():
    save()
    path = current_filepath()
    text, ok = QtWidgets.QInputDialog().getText(
        main_window,
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
