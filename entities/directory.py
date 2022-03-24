import os
import yaml
import logging
from pathlib import Path, PurePath
from ignite import utils, api


CONFIG = utils.get_config()
ROOT = PurePath(CONFIG["root"])
ANCHORS = CONFIG["anchors"]


class Directory():
    def __init__(self, path="", dir_kind="directory") -> None:
        self.project = ""
        self.name = ""
        self.dir_kind = dir_kind
        if path:
            path = Path(path)
            self.path = path
            anchor = ANCHORS[dir_kind]
            self.anchor = path / anchor
            if not self.anchor.is_file():
                raise Exception(f"Invalid directory kind or missing {anchor} anchor.")
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
        split2 = split[1].lstrip("/").split("/")
        project = split2[0]
        self.project = project
        self.name = split2[-1]
        self.load_from_config()
    
    def load_from_config(self):
        with open(self.anchor, "r") as f:
            config = yaml.safe_load(f) or {}
        for k, v in config.items():
            setattr(self, k, v)

    def as_dict(self):
        d = {}
        for s in ("path", "dir_kind", "anchor", "project", "name"):
            d[s] = getattr(self, s)
        # d["task"] = self.task.as_dict()
        return d

    def create_dir(self, name, anchor="directory", recursive=False):
        extra_chars = "/" if recursive else ""
        if not utils.validate_dirname(name, extra_chars=extra_chars):
            raise Exception(
                f"Only alphanumeric characters and underscores allowed: {name}"
            )
        path = self.path / name
        utils.ensure_directory(path)
        utils.create_anchor(path, anchor)
        return path
    
    def create_task(self, name, task_type="generic"):
        from ignite.entities.task import Task

        path = self.create_dir(name, "task")
        task = Task(path=path)
        if not task:
            logging.error(f"Task creation failed: {path}")
            return
        task.set_task_type(task_type)
    
    def create_shot(self, name):
        self.create_dir(name, "shot")

    def create_build(self, name):
        path = self.create_dir(name, "build")
    
    def create_sequence(self, name):
        path = self.create_dir(name, "sequence")

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

    def update_config(self, data):
        with open(self.anchor, "w+") as f:
            config = yaml.safe_load(f) or {}
            config.update(data)
            yaml.safe_dump(config, f)
        return config
