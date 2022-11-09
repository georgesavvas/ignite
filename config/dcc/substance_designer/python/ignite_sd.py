import sd


def save():
    nuke.scriptSave()


def current_filepath():
    return nuke.root().name()


def save_next():
    current = Path(current_filepath())
    version = int(current.parts[-2].lstrip("v"))
    version += 1
    next_v = str(version).zfill(3)
    filename = current.name
    new_dir = current.parent.parent / f"v{next_v}"
    new_dir.mkdir(exist_ok=False)
    new_filepath = new_dir / filename
    nuke.scriptSaveAs(filename=str(new_filepath))
    anchor = new_dir / ".ign_scene.yaml"
    anchor.touch()


def scene_comment():
    save()
    path = current_filepath()
    text, nuke.getInput("Comment")
    if text:
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
    path = Path(current_filepath()).parent
    output_path = path / "preview/preview"
    if output_path.parent.is_dir():
        shutil.rmtree(output_path.parent)
    output_path.parent.mkdir(exist_ok=True, parents=True)
    root = nuke.root()
    start_frame = round(root.firstFrame())
    end_frame = round(root.lastFrame())
    inc = round((end_frame - start_frame) / 25)

    # flipbook implementation
    print(f"Exported {start_frame}-{end_frame} to {output_path}")


def scene_thumbnail():
    save()
    path = Path(current_filepath()).parent
    path.mkdir(exist_ok=True, parents=True)
    output_path = path / "thumbnail.jpg"

    frame = nuke.root().frame
    # flipbook implementation
    print(f"Exported to {output_path}")
