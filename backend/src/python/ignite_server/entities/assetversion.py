import os
import clique
from pathlib import Path, PurePath
from ignite_server import utils
from ignite_server.entities.directory import Directory
from ignite_server.entities.asset import Asset

CONFIG = utils.get_config()
ROOT = PurePath(CONFIG["root"])
COMP_TYPES = {}
for name, exts in CONFIG["comp_types"].items():
    for ext in exts:
        COMP_TYPES[ext] = name


class AssetVersion(Directory):
    def __init__(self, path="") -> None:
        super().__init__(path, dir_kind="assetversion")
        self.version = self.name
        self.version_int = 0
        if self.version.startswith("v"):
            int(self.version.lstrip("v"))
        self.name = self.path.parent.name
        self.components = []
        self.asset = self.path.parent
        self.task = self.asset.parent.parent
        self.source = ""
        self.thumbnail = PurePath()
        self.preview = PurePath()
        self._fetch_components()

    def __lt__(self, other):
        return self.version_int < other.version_int

    def _fetch_components(self):
        path = Path(self.path)
        anchor = CONFIG["anchors"]["assetversion"]
        comps = []
        collections, remainder = clique.assemble([str(d.name) for d in path.iterdir()])
        # comps += [c.format("{head}####{tail}") for c in collections]
        # comps += [r for r in remainder if not r == anchor]
        for c in collections:
            filename = c.format("{head}####{tail}")
            comps.append({
                "filename": filename,
                "path": str(self.path / filename),
                "name": c.head.rstrip("."),
                "ext": c.tail
            })
        for r in remainder:
            r2 = PurePath(r)
            comps.append({
                "filename": str(r2),
                "path": str(self.path / r2.name),
                "name": r2.stem,
                "ext": r2.suffix
            })
        # for x in path.iterdir():
        #     name = x.name
        #     if name.startswith("."):
        #         continue
        #     if name == anchor:
        #         continue
        #     if x.stem == "source":
        #         self.source = x
        #         continue
        #     if x.stem == "thumbnail":
        #         self.thumbnail = x
        #         continue
        #     c = {}
        #     c["name"] = name
        #     c["path"] = x
        #     c["ext"] = x.suffix
        #     comps.append(c)
        self.components = comps

    def as_dict(self):
        d = {}
        for s in (
                "path", "dir_kind", "anchor", "project", "name", "version",
                "components", "asset", "source", "task"
            ):
            d[s] = getattr(self, s)
        d["thumbnail"] = self.thumbnail.as_posix()
        project_path = ROOT / self.project
        # d["context"] = self.asset.as_posix().replace(project_path.as_posix() + "/", "")
        d["context"] = self.task.as_posix().replace(project_path.as_posix() + "/", "")
        d["default_name"] = ""
        if self.components:
            c = self.components[0]
            d["default_name"] = c["name"]
            ext = c["ext"]
            d["default_type"] = ""
            if ext in COMP_TYPES.keys():
                d["default_type"] = COMP_TYPES[ext]
        return d
