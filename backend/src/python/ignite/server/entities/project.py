# Copyright 2022 George Savvas

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     https://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


import re
import time
from pathlib import Path, PurePath

import yaml
from ignite.server import utils
from ignite.server.constants import ANCHORS
from ignite.server.entities.directory import Directory
from ignite.server.utils import CONFIG
from ignite.utils import get_logger

LOGGER = get_logger(__name__)
GROUP_ANCHOR = ANCHORS["group"]


class Project(Directory):
    def __init__(self, name="", path="") -> None:
        if not path and name:
            path = CONFIG["root"] / name
        super().__init__(path, dir_kind="project")
        self.project = self.name
        self.short_name = ""

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
            LOGGER.warning("Initialising an existing project!?")
        self.load_from_path()

    def load_from_path(self):
        path = self.path.as_posix()
        root = CONFIG["root"].as_posix()
        split = path.split(root)
        if not path.startswith(root) or re.match("^[\/]+$", split[1]):
            raise Exception(f"Invalid project path: {path}")
        self.name = split[1].lstrip("/")
        dirs = ("config", "common", "global", "rnd", "assets", "shots")
        path = PurePath(path)
        for d in dirs:
            dir_path = path / d
            setattr(self, f"{d}_path", dir_path)
        self.load_from_config()
    
    def set_short_name(self, name):
        if not utils.validate_dirname(name): 
            raise Exception(
                f"Invalid name, only alphanumeric and underscores allowed: {name}"
            )
        self.short_name = name
    
    def update_config(self, data):
        config = {
            "short_name": self.short_name
        }
        config.update(data)
        super().update_config(config)

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
                        LOGGER.debug(f"Skipping {x} - reserved name.")
                        continue
                    if name in anchors:
                        kind = kinds[name]
                        if kind in ("asset", "assetversion"):
                            LOGGER.debug(f"Skipping {x} - is asset or av.")
                            continue
                        d["dir_kind"] = kind
                        d["anchor"] = x
                        continue
                    if name.startswith("."):
                        LOGGER.debug(f"Skipping {x} - starts with period.")
                        continue
                    elif not d["dir_kind"]:
                        LOGGER.debug(f"Skipping {x} - no anchor.")
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
