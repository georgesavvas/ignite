import os
from pathlib import Path, PurePath
from ignite_server.constants import ANCHORS, DCC_EXTENSIONS
from ignite_server import utils
from ignite_server.entities.directory import Directory
from ignite_server.entities.task import Task
from ignite_server.utils import CONFIG


ROOT = PurePath(CONFIG["projects_root"])


class Scene(Directory):
    def __init__(self, path="") -> None:
        self.dict_attrs = ["path", "project", "name", "group" ,"dcc", "extension",
            "version", "dir_kind", "scene", "context", "task", "version", "vsn", "tags",
            "attributes", "creation_time", "modification_time"]
        self.nr_attrs = ["path", "task", "scene"]
        self.project = ""
        self.group = ""
        self.context = ""
        self.name = ""
        self.extension = ""
        self._repr = None
        self.tags = []
        self.dir_kind = "scene"
        self.dcc = ""
        self.version = ""
        self.vsn = 0
        self.path = path
        self.scene = PurePath()
        self.task = None
        if self.path:
            path = Path(path)
            self.path = PurePath(self.path)
            anchor = ANCHORS["scene"]
            self.anchor = path / anchor
            if not self.anchor.is_file():
                raise Exception(
                    f"Invalid scene or missing anchor: {self.anchor}"
                )
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
        split2 = split[1].lstrip("/").split("/")
        project = split2[0]
        self.project = project
        self.name = path.name
        for file in Path(path).iterdir():
            if file.stem == "scene":
                self.scene = PurePath(file)
                self.version = self.scene.parent.name
                self.vsn = int(self.version.lstrip("v"))
                break

        extensions = []
        ext_dcc = {}
        for dcc, exts in DCC_EXTENSIONS.items():
            extensions += exts
            for ext in exts:
                ext_dcc[ext] = dcc

        ext = self.scene.suffix[1:]
        self.extension = ext
        self.task = path=path.parent.parent
        self.dcc = ext_dcc.get(ext, "")
        self.context = self.get_context()
    
    def is_valid(self):
        if not self.task or not self.version or not self.task or not self.extension:
            return False
        return True

    def as_dict(self):
        d = super().as_dict()
        d["exports"] = os.path.join(self.task, "exports")
        return d

    def next_version(self):
        version = int(self.version.lstrip("v"))
        version += 1
        return str(version).zfill(3)
    
    def next_filepath(self):
        next_v = self.next_version()
        filename = self.scene.name
        return self.path / next_v / filename
