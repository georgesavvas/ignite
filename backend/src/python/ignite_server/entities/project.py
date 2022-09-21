import os
import re
import yaml
import time
import logging
from pathlib import Path, PurePath
from ignite_server import utils
from ignite_server.entities.directory import Directory
from ignite_server.constants import ANCHORS
from ignite_server.utils import CONFIG


ROOT = PurePath(CONFIG["projects_root"])
GROUP_ANCHOR = ANCHORS["group"]


class Project(Directory):
    def __init__(self, name="", path="") -> None:
        if not path and name:
            path = ROOT / name
        super().__init__(path, dir_kind="project")
        self.project = self.name

    def create_dir(self, name, recursive=False):
        raise NotImplemented("create_dir not allowed for projects.")

    def initialise(self) -> None:
        dirs = (".config", "common", "global", "rnd", "assets", "shots")
        for d in dirs:
            path = self.path / d
            utils.ensure_directory(path)
            if d in ("global", "rnd", "assets", "shots"):
                utils.create_anchor(path, GROUP_ANCHOR)
        if not Path(self.anchor).exists():
            config = {
                "status": "open",
                "short_name": "",
                "created": time.time()
            }
            with open(self.anchor, "w") as f:
                yaml.safe_dump(config, f)
        else:
            logging.warning("Initialising an existing project!?")
        self.load_from_path()

    def load_from_path(self):
        path = self.path.as_posix()
        root = ROOT.as_posix()
        split = path.split(root)
        if not path.startswith(root) or re.match("^[\/]+$", split[1]):
            raise Exception(f"Invalid project path: {path}")
        self.name = split[1].lstrip("/")
        dirs = ("config", "common", "global", "rnd", "assets", "shots")
        path = PurePath(path)
        for d in dirs:
            dir_path = path / d
            setattr(self, f"{d}_path", dir_path)
    
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
        kinds = {v: k for k, v in ANCHORS.items()}
        anchors = kinds.keys()

        def walk_project(path, d={}, _id=[0]):
            name = path.name
            if path.is_dir():
                d["id"] = str(_id[0] or "root")
                d["name"] = name
                d["path"] = str(path)
                d["dir_kind"] = ""
                d["task_type"] = ""
                d["children"] = []
                d["anchor"] = None
                for x in sorted(list(path.iterdir())):
                    name = x.name
                    _id[0] += 1
                    if name in (".config", "common"):
                        continue
                    if name in anchors:
                        d["dir_kind"] = kinds[name]
                        d["anchor"] = x
                        continue
                    if name.startswith("."):
                        continue
                    elif not d["dir_kind"]:
                        return
                    if d["dir_kind"] == "task" and d["anchor"]:
                        with open(d["anchor"], "r") as f:
                            config = yaml.safe_load(f)
                            config = config or {}
                            d["task_type"] = config.get("task_type")
                    child_d = {}
                    d["children"].append(child_d)
                    walk_project(x, child_d, _id)
                del d["anchor"]
                d["children"] = [child for child in d["children"] if child and child["dir_kind"]]
                d["icon"] = d["dir_kind"]
                if d["task_type"]:
                    d["icon"] = d["icon"] + "_" + d["task_type"]
            return d

        def get_filter_strings(node, prepend):
            node["filter_strings"] = set(prepend)
            node["filter_strings"].add(node["name"])
            if not node.get("children"):
                return {node["name"]}
            child_strings = set()
            for child in node["children"]:
                child_strings.update(get_filter_strings(child, set(node["filter_strings"])))
            node["filter_strings"].update(child_strings)
            return set(node["filter_strings"])

        path = Path(self.path)
        tree = walk_project(path)
        get_filter_strings(tree, set())
        return tree
