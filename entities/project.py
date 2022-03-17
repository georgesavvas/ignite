import os
import re
import yaml
import time
from pathlib import Path, PurePath
from ignite import utils
from ignite.entities.directory import Directory


CONFIG = utils.get_config()
ROOT = PurePath(CONFIG["root"])
PHASE_ANCHOR = CONFIG["anchors"]["phase"]
PROJECT_CONFIG_FILE = "project.yaml"


class Project(Directory):
    def __init__(self, name="", path="") -> None:
        super().__init__(path)
        self.dir_kind = "project"
        

    def create_dir(self, name, recursive=False):
        raise NotImplemented("create_dir not allowed for projects.")

    def initialise(self) -> None:
        dirs = (".config", "common", "global", "rnd", "assets", "shots")
        for d in dirs:
            path = self.path / d
            utils.ensure_directory(path)
            if d in ("global", "rnd", "assets", "shots"):
                utils.create_anchor(path, PHASE_ANCHOR)
        config_path = self.path / ".config" / PROJECT_CONFIG_FILE
        config = {
            "status": "open",
            "short_name": "",
            "created": time.time()
        }
        with open(config_path, "w") as f:
            yaml.safe_dump(config, f)
        self.load_from_path()

    def load_from_path(self):
        path = self.path.as_posix()
        root = ROOT.as_posix()
        split = path.split(root)
        if not path.startswith(root) or re.match("^[\/]+$", split[1]):
            raise Exception(f"Invalid project path: {path}")
        self.name = split[1]
        dirs = ("config", "common", "global", "rnd", "assets", "shots")
        path = PurePath(path)
        for d in dirs:
            dir_path = path / d
            setattr(self, f"{d}_path", dir_path)

    def load_config(self):
        path = self.config_path / PROJECT_CONFIG_FILE
        with open(path, "r") as f:
            config = yaml.safe_load(f)
        config = config or {}
        self.short_name = config.get("short_name", "")
        self.status = config.get("status", "open")
        self.created = config.get("created", 0)
    
    def set_short_name(self, name):
        if not utils.validate_dirname(name): 
            raise Exception(
                f"Invalid name, only alphanumeric and underscores allowed: {name}"
            )
        self.short_name = name
    
    def update_config(self):
        config_path = self.config_path / PROJECT_CONFIG_FILE
        with open(config_path, "r") as f:
            existing = yaml.safe_load(f)
        existing = existing or {}
        config = {
            "status": self.status,
            "short_name": self.short_name
        }
        new_config = existing.update(config)
        with open(config_path, "w") as f:
            yaml.safe_dump(new_config, f)

    def get_project_tree(self):

        kinds = {v: k for k, v in CONFIG["anchors"].items()}
        anchors = kinds.keys()

        def walk_project(path, d={}, _id=[0]):
            name = path.name
            if path.is_dir():
                d["id"] = str(_id[0] or "root")
                d["name"] = name
                d["path"] = path.as_posix()
                d["kind"] = ""
                d["children"] = []
                for x in path.iterdir():
                    _id[0] += 1
                    name = x.name
                    if name in (".config", "common"):
                        continue
                    if name in anchors:
                        d["kind"] = kinds[name]
                        continue
                    elif not d["kind"]:
                        return
                    child_d = {}
                    d["children"].append(child_d)
                    walk_project(x, child_d, _id)
                d["children"] = [child for child in d["children"] if child["kind"]]
            return d

        path = Path(self.path)
        tree = walk_project(path)
        return tree
