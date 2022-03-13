import os
from pathlib import Path, PurePath
from ignite import utils, api


CONFIG = utils.get_config()
ROOT = PurePath(CONFIG["root"])


class Directory():
    def __init__(self, path="") -> None:
        self.project_name = ""
        self.name = ""
        self.dir_kind = "directory"
        if path:
            self.path = path
        if self.path:
            self.load_from_path()

    def __repr__(self):
        return f"{self.name} ({self.dir_kind})"

    def load_from_path(self):
        path = self.path.as_posix()
        root = ROOT.as_posix()
        if not path.startswith(root):
            raise Exception(f"Invalid project dir: {path}")
        if not Path(path).is_dir():
            raise Exception(f"Invalid path: {path}")
        split = path.split(root)
        if split == 1:
            raise Exception(f"Error parsing path: {path}")
        split2 = split[1].split("/")
        project = split2[0]
        self.project = project
        self.name = split2[-1]
    
    def create_dir(self, name, recursive=False):
        extra_chars = "/" if recursive else ""
        if not utils.validate_dirname(name, extra_chars=extra_chars):
            raise Exception(
                f"Only alphanumeric characters and underscores allowed: {name}"
            )
        path = self.path / name
        utils.ensure_directory(path)
        return path
    
    def children(self):
        path = Path(self.path)
        children = []
        for d in path.iterdir():
            if not d.is_dir():
                continue
            entity = api.find(d)
            if entity:
                children.append(entity)
        return children
