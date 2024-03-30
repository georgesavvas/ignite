import os
import shutil
import numbers
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


class IgnExportDialogue(QtWidgets.QDialog):
    def __init__(self, title, fn):
        super().__init__(parent=maya_window())
        self.setWindowTitle(title)
        self.fn = fn

        # Name, version, filetype fields
        name_field = QtWidgets.QLineEdit()
        name_field.setPlaceholderText("Asset Name")
        self.name_field = name_field

        version_field = QtWidgets.QLineEdit()
        version_field.setPlaceholderText("Version")
        version_field.setText(ENV.get("VS", ""))
        self.version_field = version_field

        filetypes = {
            ".mb": "mayaBinary",
            ".ma": "mayaAscii",
            ".obj": "OBJ",
            ".abc": "alembic",
            ".usd": "USD Export",
            ".usdc": "USD Export",
            ".usda": "USD Export",
        }
        filetype_combo = QtWidgets.QComboBox()
        filetype_combo.addItems(filetypes)
        self.filetype_combo = filetype_combo

        row1_frame = QtWidgets.QFrame()
        self.row1_frame = row1_frame
        row1_layout = QtWidgets.QHBoxLayout()
        row1_layout.addWidget(name_field, 2)
        row1_layout.addWidget(version_field, 1)
        row1_layout.addWidget(filetype_combo, 1)
        row1_frame.setLayout(row1_layout)
        self.row1_layout = row1_layout

        # Range fields
        rangex_field = QtWidgets.QLineEdit()
        rangex_field.setPlaceholderText("First frame")
        self.rangex_field = rangex_field
        rangey_field = QtWidgets.QLineEdit()
        rangey_field.setPlaceholderText("Last frame")
        self.rangey_field = rangey_field

        row2_frame = QtWidgets.QFrame()
        self.row2_frame = row2_frame
        row2_layout = QtWidgets.QHBoxLayout()
        row2_layout.addWidget(rangex_field, 1)
        row2_layout.addWidget(rangey_field, 1)
        row2_frame.setLayout(row2_layout)
        self.row2_layout = row2_layout

        # Export, cancel buttons
        export_button = QtWidgets.QPushButton("Export")
        export_button.clicked.connect(self.onExportClicked)
        self.export_button = export_button

        cancel_button = QtWidgets.QPushButton("Cancel")
        cancel_button.clicked.connect(self.onCancelClicked)
        self.cancel_button = cancel_button

        buttons_frame = QtWidgets.QFrame()
        self.buttons_frame = buttons_frame
        buttons_layout = QtWidgets.QHBoxLayout()
        buttons_layout.addWidget(cancel_button)
        buttons_layout.addWidget(export_button)
        buttons_frame.setLayout(buttons_layout)
        self.buttons_layout = buttons_layout

        # Dialogue layout
        layout = QtWidgets.QVBoxLayout()
        layout.addWidget(row1_frame)
        layout.addWidget(row2_frame)
        layout.addStretch(1)
        layout.addWidget(buttons_frame)
        self.layout = layout
        self.setLayout(layout)

    def onExportClicked(self):
        name = self.name_field.text()
        version = self.version_field.text()
        path = Path(ENV["EXPORTS"]) / name / version
        self.fn(path)
        self.close()

    def onCancelClicked(self):
        self.close()


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
        cmds.menuItem(parent=menu, divider=True)
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
        cmds.menuItem(parent=menu, divider=True)
        cmds.menuItem(
            label="Export All",
            parent=menu,
            command=lambda arg: export_all(),
        )
        cmds.menuItem(
            label="Export Selection",
            parent=menu,
            command=lambda arg: export_selection(),
        )


def save():
    cmds.file(save=True)


def save_next():
    current = Path(cmds.file(q=True, sn=True))
    version = int(current.parts[-2].lstrip("v"))
    version += 1
    next_v = f"v{str(version).zfill(3)}"
    filename = current.name
    new_dir = current.parent.parent / next_v
    new_dir.mkdir(exist_ok=False)
    new_filepath = new_dir / filename
    cmds.file(rename=str(new_filepath))
    cmds.file(save=True, type="mayaBinary")
    ignite.update_env_version(next_v, version)
    anchor = new_dir / ".ign_scene.yaml"
    anchor.touch()


def scene_comment():
    save()
    path = cmds.file(q=True, sn=True)
    text, ok = QtWidgets.QInputDialog().getText(
        maya_window(), "QInputDialog().getText()", "Comment", QtWidgets.QLineEdit.Normal
    )
    if ok and text:
        data = {"path": path, "comment": text}
        ignite.server_request("set_scene_comment", data)
        cmds.inViewMessage(msg="Done", f=True, fot=3)
        return
    cmds.inViewMessage(msg="Failed to set comment", f=True, fot=3)


def playblast(path, frange):
    frame_settings = {"startTime": frange[0], "endTime": frange[1]}
    if len(frange) == 3 and frange[2] > 1:
        frames = list(range(frange[0], frange[1], frange[2]))
        print(f"Playblast frames: {frames}")
        frame_settings = {"frame": frames}
    cmds.setAttr("defaultRenderGlobals.imageFormat", 8)
    cmds.playblast(
        filename=path,
        forceOverwrite=True,
        format="image",
        viewer=False,
        **frame_settings,
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


def export(path, **flags):
    print("Export was called with the following flags", flags)
    cmds.file(path, **flags)


def export_maya(path, range=None, ext="mayaBinary", all=True):
    flags = {
        "force": True,
        "options": "v=0",
        "type": ext,
        "preserveReferences": True,
        "exportSelected": not all,
        "exportAll": all,
    }
    export(path, **flags)


def export_usd(path, range=None, ext="usd", all=True):
    start = end = cmds.currentTime(q=True)
    if isinstance(range, numbers.Number):
        start = end = range
    elif type(range) in [tuple, list]:
        start = range[0]
        end = range[1]
    options = [
        "exportUVs=1",
        "exportDisplayColor=0",
        "exportColorSets=1",
        "exportComponentTags=1",
        "defaultMeshScheme=catmullClark",
        "animation=0",
        "eulerFilter=0",
        "staticSingleSample=0",
        f"startTime={start}",
        f"endTime={end}",
        "frameStride=1",
        "frameSample=0.0",
        f"defaultUSDFormat={ext}",
        "parentScope=",
        "shadingMode=useRegistry",
        "convertMaterialsTo=[UsdPreviewSurface]",
        "exportInstances=1",
        "exportVisibility=1",
        "mergeTransformAndShape=1",
        "stripNamespaces=0",
    ]
    flags = {
        "force": True,
        "options": ";".join(options),
        "type": "USD Export",
        "preserveReferences": True,
        "shader": True,
        "channels": True,
        "constraints": True,
        "expressions": True,
        "exportAll": all,
        "exportSelected": not all,
    }
    export(path, **flags)


def export_alembic(
    path,
    range=None,
    uvs=True,
    color_sets=True,
    face_sets=True,
    visibility=True,
    uv_sets=True,
    worldspace=True,
    all=True,
    root=None,
):
    # TODO set map1 as current uvset, step, custom attributes, strip namespaces,
    # eulerFilter
    if not all and not root:
        selection = cmds.ls(sl=True, long=True)
        if not selection:
            cmds.inViewMessage(msg="Nothing selected", f=True, fot=3)
            return
        root = selection[0]
    frame = cmds.currentTime(q=True)
    range = f"{frame} {frame}"
    if isinstance(range, numbers.Number):
        range = f"{frame} {frame}"
    elif type(range) in [tuple, list]:
        range = f"{range[0]} {range[1]}"
    args = ""
    args += f"-frameRange {range} " if range else ""
    args += "-uvWrite " if uvs else ""
    args += "-writeColorSets " if color_sets else ""
    args += "-writeFaceSets " if face_sets else ""
    args += "-writeVisibility " if visibility else ""
    args += "-worldSpace " if worldspace else ""
    args += "-writeUVSets " if uv_sets else ""
    args += f"-root |{root} " if root else ""
    args += f"-dataFormat ogawa -file {path}"
    cmds.AbcExport(j=args)


def pre_export(name, version):
    save()


def post_export():
    save_next()


def export_all():
    def fn(path, filetype):
        export(path, filetype, all=True)

    d = IgnExportDialogue("Ignite Export All", fn=fn)
    d.show()


def export_selection():
    def fn(path, filetype):
        export(path, filetype, all=False)

    d = IgnExportDialogue("Ignite Export Selection", fn=fn)
    d.show()


if __name__ == "__main__":
    d = IgnExportDialogue(
        "Ignite Export All", fn=lambda path, filetype: print(path, filetype)
    )
    d.show()
