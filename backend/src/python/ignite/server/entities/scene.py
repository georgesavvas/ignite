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


import os
from datetime import datetime, timezone
from pathlib import Path, PurePath

import clique
from ignite.server.constants import ANCHORS, DCC_EXTENSIONS
from ignite.server.entities.directory import Directory
from ignite.server.entities.component import Component
from ignite.server.utils import CONFIG


class Scene(Directory):
    def __init__(self, path="") -> None:
        self.dict_attrs = ["path", "project", "name", "group" ,"dcc",
            "version", "dir_kind", "scene", "context", "task", "version", "vsn",
            "attributes", "comment", "thumbnail", "tags", "extension"]
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
        self.comment = ""
        self.version = ""
        self.vsn = 0
        self.path = path
        self.scene = PurePath()
        self.task = None
        if self.path:
            path = Path(path)
            self.path = PurePath(self.path)
            stat = path.stat()
            self.creation_time = datetime.fromtimestamp(
                stat.st_ctime, tz=timezone.utc
            )
            self.modification_time = datetime.fromtimestamp(
                stat.st_mtime, tz=timezone.utc
            )
            self.size = stat.st_size
            anchor = ANCHORS["scene"]
            self.anchor = path / anchor
            if not self.anchor.is_file():
                raise Exception(
                    f"Invalid scene or missing anchor: {self.anchor}"
                )
            self.load_from_path()
            self.thumbnail = self.get_thumbnail()

    def __repr__(self):
        return f"{self.dcc} {self.name} ({self.path})"

    def load_from_path(self):
        path = self.path
        path_str = self.path.as_posix()
        root = CONFIG["root"].as_posix()
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
        self.load_from_config()
    
    def is_valid(self):
        if not self.task or not self.version or not self.task or not self.extension:
            return False
        return True

    def as_dict(self):
        d = super().as_dict()
        d["exports"] = os.path.join(self.task, "exports")
        return d

    def set_comment(self, comment):
        self.comment = comment
        self.update_config({"comment": comment})

    def next_version(self):
        version = int(self.version.lstrip("v"))
        version += 1
        return str(version).zfill(3)
    
    def next_filepath(self):
        next_v = self.next_version()
        filename = self.scene.name
        return self.path / next_v / filename
    
    def get_thumbnail(self):
        exts = (".jpg", ".jpeg", ".png", ".tif", ".tiff")
        thumb = None
        path = Path(self.path)
        preview_path = path / "preview"
        if preview_path.is_dir():
            collections, remainder = clique.assemble(
                [str(d) for d in preview_path.iterdir()]
            )
            for c in collections:
                if c.head.split("/")[-1].startswith("."):
                    continue
                if ".temp." in c.head:
                    continue
                if c.tail not in exts:
                    continue
                thumb = Component(c)
                break
        if not thumb:
            for file in path.glob("thumbnail.*"):
                if file.suffix not in exts:
                    continue
                thumb = Component(file)
                break
        return thumb.as_dict() if thumb else None
