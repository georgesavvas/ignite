import os

import NatronEngine
import NatronGui

import ignite


print("Hello from ignite_natron")
ENV = os.environ


def save():
    print("Save")
    NatronEngine.saveProject()


def get_filename():
    path = NatronEngine.App.getProjectParam("projectPath").getValue()
    name = NatronEngine.App.getProjectParam("projectName").getValue()
    return os.path.join(path, name)


def save_next():
    print("Save Next")
    current = get_filename()
    version = int(current.parts[-2].lstrip("v"))
    version += 1
    next_v = "v" + str(version).zfill(3)
    filename = os.path.basename(current)
    new_dir = os.path.dirname(current)
    new_dir = os.path.dirname(new_dir)
    new_dir = os.path.join(new_dir, next_v)
    os.makedirs(exist_ok=True)
    new_filepath = os.path.join(new_dir, filename)
    print("Saving at", new_filepath)
    NatronEngine.saveProjectAs(new_filepath)
    ignite.update_env_version(next_v, version)
    anchor = os.path.join(new_dir, ".ign_scene.yaml")
    if os.path.exists(anchor):
        os.utime(anchor, None)
    else:
        open(anchor, "a").close()


# def scene_comment():
#     save()
#     path = str(get_filename())
#     text, ok = QtWidgets.QInputDialog().getText(
#         maya_window(),
#         "QInputDialog().getText()",
#         "Comment",
#         QtWidgets.QLineEdit.Normal
#     )
#     if ok and text:
#         data = {
#             "path": path,
#             "comment": text
#         }
#         ignite.server_request("set_scene_comment", data)
#         print("Comment set")
#         return
#     print("Failed to set comment")


# def scene_preview():
#     save()
#     path = get_filename().parent
#     output_path = path / "preview/preview"
#     if output_path.parent.is_dir():
#         shutil.rmtree(output_path.parent)
#     output_path.parent.mkdir(exist_ok=True, parents=True)
#     start_frame = round(cmds.playbackOptions(q=True, minTime=True))
#     end_frame = round(cmds.playbackOptions(q=True, maxTime=True))
#     inc = round((end_frame - start_frame) / 25)

#     # flipbook implementation
#     print(f"Exported {start_frame}-{end_frame} to {output_path}")


# def scene_thumbnail():
#     save()
#     path = get_filename().parent
#     path.mkdir(exist_ok=True, parents=True)
#     output_path = path / "thumbnail.jpg"

#     frame = cmds.currentTime(q=True)
#     # flipbook implementation
#     print(f"Exported to {output_path}")
