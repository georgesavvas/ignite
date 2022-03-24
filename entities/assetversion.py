import os
from pathlib import Path, PurePath
from ignite import utils
from ignite.entities.directory import Directory
from ignite.entities.asset import Asset

CONFIG = utils.get_config()
ROOT = PurePath(CONFIG["root"])


class AssetVersion(Directory):
    def __init__(self, path="") -> None:
        super().__init__(path, dir_kind="assetversion")
        self.version = self.name
        self.name = self.path.parent.name
        self.components = []
        self.asset = self.path.parent
        self.source = ""
        self._fetch_components()

    def _fetch_components(self):
        path = Path(self.path)
        anchor = CONFIG["anchors"]["assetversion"]
        comps = []
        for x in path.iterdir():
            name = x.name
            if name.startswith("."):
                continue
            if name == anchor:
                continue
            if x.stem == "source":
                self.source = x
                continue
            c = {}
            c["name"] = name
            c["path"] = x
            comps.append(c)
        self.components = comps

    def as_dict(self):
        d = {}
        for s in (
                "path", "dir_kind", "anchor", "project", "name", "version",
                "components", "asset", "source"
            ):
            d[s] = getattr(self, s)
        return d
