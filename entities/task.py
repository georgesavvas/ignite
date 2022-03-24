import os
from pathlib import Path, PurePath
from ignite import utils
from ignite.entities.directory import Directory

CONFIG = utils.get_config()
ROOT = PurePath(CONFIG["root"])


class Task(Directory):
    def __init__(self, path="") -> None:
        self.task_type = "generic"
        super().__init__(path, dir_kind="task")

    def __repr__(self):
        return f"{self.name} ({self.task_type} {self.dir_kind})"

    def set_task_type(self, task_type):
        self.task_type = task_type
        config = {"task_type": task_type}
        self.update_config(config)

    def as_dict(self):
        d = {}
        for s in ("path", "dir_kind", "anchor", "project", "name", "task_type"):
            d[s] = getattr(self, s)
        # d["task"] = self.task.as_dict()
        return d

    def discover_scenes(self, dcc=[], latest=True, as_dict=False):
        from ignite.entities.scene import Scene

        kinds = {v: k for k, v in CONFIG["anchors"].items()}
        anchors = kinds.keys()
        extensions = []
        ext_dcc = {}
        for dcc, exts in CONFIG["dcc_extensions"].items():
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
