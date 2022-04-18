import os
from ignite_server.constants import COMP_TYPES
import clique
from pathlib import Path, PurePath
from ignite_server import utils
from ignite_server.entities.directory import Directory
from ignite_server.entities.asset import Asset
from ignite_server.constants import ANCHORS

CONFIG = utils.get_config()
ROOT = PurePath(CONFIG["projects_root"])
COMP_EXT_TYPES = {}
for name, exts in COMP_TYPES.items():
    for ext in exts:
        COMP_EXT_TYPES[ext] = name


class AssetVersion(Directory):
    def __init__(self, path="") -> None:
        super().__init__(path, dir_kind="assetversion")
        self.version = self.name
        self.version_int = 0
        if self.version.startswith("v"):
            self.version_int = int(self.version.lstrip("v"))
        self.name = self.path.parent.name
        self.components = []
        self.asset = self.path.parent
        self.uri = utils.get_uri(self.asset) + "@" + str(self.version_int)
        self.task = self.asset.parent.parent
        self.source = ""
        self.preview = PurePath()
        self._fetch_components()
        self.thumbnail = self.get_thumbnail()

    def __lt__(self, other):
        return self.version_int < other.version_int

    def _fetch_components(self):
        path = Path(self.path)
        anchor = ANCHORS["assetversion"]
        comps = []
        collections, remainder = clique.assemble([str(d.name) for d in path.iterdir()])
        for c in collections:
            filename = c.format("{head}####{tail}")
            indexes = list(c.indexes)
            comps.append({
                "filename": filename,
                "path": str(self.path / filename),
                "name": c.head.rstrip("."),
                "ext": c.tail,
                "first": indexes[0],
                "last": indexes[-1],
                "static": 0
            })
        for r in remainder:
            r2 = PurePath(r)
            if r2.name.startswith("."):
                continue
            comps.append({
                "filename": str(r2),
                "path": str(self.path / r2.name),
                "name": r2.stem,
                "ext": r2.suffix,
                "static": 1
            })
        self.components = comps

    def as_dict(self):
        d = {}
        for s in (
                "path", "dir_kind", "anchor", "project", "name", "version",
                "components", "asset", "source", "task", "uri"
            ):
            d[s] = getattr(self, s)
        d["thumbnail"] = self.thumbnail
        project_path = ROOT / self.project
        # d["context"] = self.asset.as_posix().replace(project_path.as_posix() + "/", "")
        d["context"] = self.task.as_posix().replace(project_path.as_posix() + "/", "")
        d["default_name"] = ""
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
            return {}
        return sorted(candidates, key=lambda c: c["priority"])[0]

