import os
from pathlib import Path, PurePath
from ignite_server.constants import DCC_EXTENSIONS
from ignite_server import utils
from ignite_server.entities.directory import Directory
from ignite_server.constants import ANCHORS

CONFIG = utils.get_config()
ROOT = PurePath(CONFIG["projects_root"])


class Task(Directory):
    def __init__(self, path="") -> None:
        self.task_type = "generic"
        super().__init__(path, dir_kind="task")
        self.scenes = self.path / "scenes"
        self.exports = self.path / "exports"
        self.cache = self.path / "cache"
        self.build = PurePath(utils.get_dir_type(self.path, "build")).name
        self.sequence = ""
        self.shot = ""
        if not self.build:
            self.sequence = PurePath(utils.get_dir_type(self.path, "sequence")).name
            self.shot = PurePath(utils.get_dir_type(self.path, "shot")).name
        utils.ensure_directory(self.scenes)
        utils.ensure_directory(self.exports)

    def __repr__(self):
        return f"{self.name} ({self.task_type} {self.dir_kind})"

    def set_task_type(self, task_type):
        self.task_type = task_type
        config = {"task_type": task_type}
        self.update_config(config)

    def as_dict(self):
        d = {}
        for s in ("path", "dir_kind", "anchor", "project", "name", "task_type", "repr",
        "exports", "scenes", "cache", "group", "build", "sequence", "shot"):
            d[s] = getattr(self, s)
        d["full_context"] = f"{self.group}/{self.context}"
        # d["task"] = self.task.as_dict()
        return d

    def discover_scenes(self, dcc=[], latest=True, as_dict=False):
        from ignite_server.entities.scene import Scene

        kinds = {v: k for k, v in ANCHORS.items()}
        anchors = kinds.keys()
        extensions = []
        ext_dcc = {}
        for dcc, exts in DCC_EXTENSIONS.items():
            extensions += exts
            for ext in exts:
                ext_dcc[ext] = dcc

        def fetch_scenes(path, latest=True):
            scenes = []
            versions = sorted(path.iterdir(), reverse=True)
            versions = [v for v in versions if v.name.startswith("v")]
            if latest:
                versions = versions[:1]
            for version in versions:
                for x in version.iterdir():
                    ext = x.suffix[1:]
                    if ext in extensions:
                        scene = Scene(path=x)
                        if scene.is_valid():
                            scenes.append(scene)
            return scenes

        def discover(path, l=[]):
            if path.is_dir():
                dir_kind = ""
                for x in path.iterdir():
                    name = x.name
                    if name in anchors:
                        dir_kind = kinds[name]
                        continue
                    if name == "scenes":
                        scenes = fetch_scenes(x)
                        l += scenes
                    elif dir_kind == "task":
                        discover(x, l)
            return l

        scenes = discover(Path(self.path))
        if as_dict:
            scenes = [s.as_dict() for s in scenes]
        return scenes

    def get_next_scene(self):
        existing = [d.name for d in self.scenes.iterdir()]
        if not existing:
            return self.scenes / "v001"
        latest = sorted(existing, reverse=True)[0]
        version = int(latest.lstrip("v"))
        version += 1
        next_v = "v" + str(version).zfill(3)
        return self.scenes / next_v
