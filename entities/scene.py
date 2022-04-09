import os
from pathlib import Path, PurePath
from ignite import utils
from ignite.entities.directory import Directory
from ignite.entities.task import Task

CONFIG = utils.get_config()
ROOT = PurePath(CONFIG["root"])


class Scene:
    def __init__(self, path="") -> None:
        self.project_name = ""
        self.name = ""
        self.extension = ""
        self.dir_kind = "scene"
        self.dcc = ""
        self.version = ""
        self.path = path
        self.scene = PurePath()
        self.task = None
        if self.path:
            self.path = PurePath(self.path)
            self.load_from_path()

    def __repr__(self):
        return f"{self.dcc} {self.name} ({self.path})"

    def load_from_path(self):
        path = self.path
        path_str = self.path.as_posix()
        root = ROOT.as_posix()
        if not path_str.startswith(root):
            raise Exception(f"Invalid project dir: {path}")
        if not Path(path).is_dir():
            raise Exception(f"Invalid path: {path}")
        split = path_str.split(root)
        if split == 1:
            raise Exception(f"Error parsing path: {path}")
        split2 = split[1].split("/")
        project = split2[0]
        self.project = project
        self.name = path.name
        for file in Path(path).iterdir():
            if file.stem == "scene":
                self.scene = PurePath(file)
                break

        extensions = []
        ext_dcc = {}
        for dcc, exts in CONFIG["dcc_extensions"].items():
            extensions += exts
            for ext in exts:
                ext_dcc[ext] = dcc

        ext = self.scene.suffix[1:]
        self.extension = ext
        self.version = path.parent.name
        self.task = Task(path=path.parent.parent)
        self.dcc = ext_dcc.get(ext, "")
    
    def is_valid(self):
        if not self.task or not self.version or not self.task or not self.extension:
            return False
        return True

    def as_dict(self):
        d = {}
        for s in ("path", "dcc", "extension", "version", "dir_kind", "scene"):
            d[s] = getattr(self, s)
        d["task"] = self.task.as_dict()
        d["thumbnail"] = self.dcc
        return d
