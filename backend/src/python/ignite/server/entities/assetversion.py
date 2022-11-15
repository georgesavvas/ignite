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


from pathlib import Path, PurePath

import clique
from ignite.server import utils
from ignite.server.constants import COMP_TYPES, TAG_WEIGHTS
from ignite.server.entities.asset import Asset
from ignite.server.entities.component import Component
from ignite.server.entities.directory import Directory

COMP_EXT_TYPES = {}
for name, exts in COMP_TYPES.items():
    for ext in exts:
        COMP_EXT_TYPES[ext] = name


class AssetVersion(Directory):
    def __init__(self, path) -> None:
        self.score = 0
        self.tags = set()
        super().__init__(path, dir_kind="assetversion")
        self.dict_attrs = ["components", "asset", "task", "uri", "tags",
            "version", "thumbnail", "creation_time", "modification_time",
            "versions"]
        self.nr_attrs = ["asset", "task"]
        self.asset = self.path.parent
        self.version = self.name
        self.version_int = 0
        if self.version.startswith("v"):
            self.version_int = int(self.version.lstrip("v"))
        self.versions = self._fetch_versions()
        self.is_latest = self._is_latest()
        self.name = self.path.parent.name
        self.components = []
        self.uri = utils.get_uri(self.asset, self.version_int)
        self.task = self.asset.parent.parent if "/exports/" in self.path.as_posix() else None
        self.context = self.get_context()
        self.fetch_components()
        self._get_score()
        self.tags = self.get_tags()
        self.thumbnail = self.get_thumbnail()

    def __lt__(self, other):
        return self.version_int < other.version_int

    def fetch_components(self):
        path = Path(self.path)
        comps = []
        collections, remainder = clique.assemble([str(d) for d in path.iterdir()])
        for c in collections:
            if c.head.split("/")[-1].startswith("."):
                continue
            if ".temp." in c.head:
                continue
            comp = Component(c)
            comps.append(comp.as_dict())
        for r in remainder:
            r2 = PurePath(r)
            if r2.name.split("/")[-1].startswith("."):
                continue
            if ".temp." in r2.name:
                continue
            comp = Component(r2)
            comps.append(comp.as_dict())
        self.components = comps

    def _get_score(self):
        score = 0
        for tag in self.tags:
            if tag not in TAG_WEIGHTS:
                continue
            score += TAG_WEIGHTS[tag]
        if self.is_latest:
            score += 1
        self.score = score

    def _fetch_versions(self):
        return sorted([
            d.name for d in self.asset.iterdir() if d.name.startswith("v")
        ], reverse=True)

    def _is_latest(self):
        return self.version == self.versions[0]

    def as_dict(self):
        d = super().as_dict()
        d["build"] = self.asset
        d["default_name"] = ""
        d["default_type"] = ""
        if self.components:
            c = self.components[0]
            d["default_name"] = c["name"]
            ext = c["ext"]
            d["default_type"] = ""
            if ext in COMP_EXT_TYPES.keys():
                d["default_type"] = COMP_EXT_TYPES[ext]
        attribs = ("name", "path", "dir_kind", "project")
        filter_string = "".join([str(getattr(self, a)) for a in attribs])
        filter_string += "".join(self.tags)
        filter_string += "".join([c["name"] for c in self.components])
        d["filter_string"] = filter_string
        return d

    def get_thumbnail(self):
        exts = (".jpg", ".jpeg", ".png", ".tif", ".tiff")
        candidates = []
        for comp in self.components:
            # if comp["name"] == "thumbnail":
            #     c = comp.copy()
            #     c["static"] = 1
            #     return c
            ext = comp["ext"]
            if ext not in exts:
                continue
            priority = 1
            priority -= exts.index(ext) / len(exts) * 0.1
            if comp["static"]:
                priority -= 0.5
            c = comp.copy()
            c["priority"] = priority
            candidates.append(c)
        if not candidates:
            return
        return sorted(candidates, key=lambda c: c["priority"])[0]

    def get_tags(self):
        asset = Asset(self.asset)
        tags = asset.get_tags()
        return sorted(tags.get(self.version, []))

    def set_tags(self, tags):
        asset = Asset(self.asset)
        asset.set_tags(self.version, tags)
        self.tags = sorted(tags)

    def add_tags(self, tags):
        asset = Asset(self.asset)
        self.tags = sorted(asset.add_tags(self.version, tags))

    def remove_tags(self, tags=[], all=False):
        asset = Asset(self.asset)
        self.tags = sorted(asset.remove_tags(self.version, tags=tags, all=all))
