import os
from pathlib import Path, PurePath
from ignite import utils
from ignite.entities.directory import Directory


CONFIG = utils.get_config()
ROOT = PurePath(CONFIG["root"])


class Asset(Directory):
    def __init__(self, path="") -> None:
        super().__init__(path, dir_kind="asset")
        self.versions = []
        self.assetversions = []
        self.latest_v = None
        self.latest_av = None
        self._fetch_versions()

    def _fetch_versions(self):
        from ignite.entities.assetversion import AssetVersion

        path = Path(self.path)
        versions = []
        for x in path.iterdir():
            name = x.name
            if not name.startswith("v"):
                continue
            v = AssetVersion(x)
            versions.append(name)
        versions = sorted(versions, reverse=True)
        assetversions = [AssetVersion(path / v) for v in versions]
        assetversions = [av for av in assetversions if av]
        self.versions = versions
        self.assetversions = assetversions
        if versions:
            self.latest_v = versions[0]
            self.latest_av = assetversions[0]

    def as_dict(self):
        d = {}
        for s in (
            "path", "dir_kind", "anchor", "project", "name", "versions", "latest_v"
        ):
            d[s] = getattr(self, s)
        if self.latest_av:
            d["latest_av"] = self.latest_av.as_dict()
            d["thumbnail"] = d["latest_av"]["thumbnail"].as_posix()
        return d
