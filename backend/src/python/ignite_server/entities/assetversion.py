import os
from ignite_server.constants import COMP_TYPES
import clique
from pathlib import Path, PurePath
from ignite_server import utils
from ignite_server.entities.directory import Directory
from ignite_server.entities.asset import Asset
from ignite_server.entities.component import Component
from ignite_server.constants import TAG_WEIGHTS

CONFIG = utils.get_config()
ROOT = PurePath(CONFIG["projects_root"])
COMP_EXT_TYPES = {}
for name, exts in COMP_TYPES.items():
    for ext in exts:
        COMP_EXT_TYPES[ext] = name


class AssetVersion(Directory):
    def __init__(self, path) -> None:
        self.score = 0
        self.tags = set()
        super().__init__(path, dir_kind="assetversion")
        self.dict_attrs = ["path", "dir_kind", "anchor", "project", "name", "version",
            "components", "asset", "task", "uri", "tags", "context",
            "thumbnail"]
        self.nr_attrs = ["path", "asset", "task"]
        self.version = self.name
        self.version_int = 0
        if self.version.startswith("v"):
            self.version_int = int(self.version.lstrip("v"))
        self.is_latest = self._is_latest()
        self.name = self.path.parent.name
        self.components = []
        self.asset = self.path.parent
        self.uri = utils.get_uri(self.asset, self.version_int)
        self.task = self.asset.parent.parent
        self.context = self.get_context()
        self.fetch_components()
        self._get_score()
        
        self.thumbnail = self.get_thumbnail()

    def __lt__(self, other):
        return self.version_int < other.version_int

    def fetch_components(self):
        path = Path(self.path)
        comps = []
        collections, remainder = clique.assemble([str(d) for d in path.iterdir()])
        for c in collections:
            comp = Component(c)
            comps.append(comp.as_dict())
        for r in remainder:
            r2 = PurePath(r)
            if r2.name.split("/")[-1].startswith("."):
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

    def _is_latest(self):
        versions = sorted(list(self.path.iterdir()))
        return self.version == versions[-1]

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
        asset = Asset(self.path)
        tags = asset.get_tags()
        return tags.get(self.version, ())

    def set_tags(self, tags):
        asset = Asset(self.path)
        asset.set_tags(self.version, tags)
    
    def add_tags(self, tags):
        asset = Asset(self.path)
        asset.add_tags(self.version, tags)
    
    def remove_tags(self, tags=[], all=False):
        asset = Asset(self.path)
        asset.remove_tags(self.version, tags=tags, all=all)
