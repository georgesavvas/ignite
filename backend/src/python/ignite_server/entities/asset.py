import os
from pathlib import Path, PurePath
from ignite_server import utils
from ignite_server.entities.directory import Directory


CONFIG = utils.get_config()
ROOT = PurePath(CONFIG["projects_root"])


class Asset(Directory):
    def __init__(self, path="") -> None:
        super().__init__(path, dir_kind="asset")
        self.uri = utils.get_uri(path)
        self._versions = []
        self._assetversions = []
        self._latest_v = None
        self._latest_av = None
        self._best_v = None
        self._best_av = None
        self._avs_fetched = False

    @property
    def versions(self):
        if not self._avs_fetched:
            self._fetch_versions()
        return self._versions
    
    @property
    def assetversions(self):
        if not self._avs_fetched:
            self._fetch_versions()
        return self._assetversions

    @property
    def latest_v(self):
        if not self._avs_fetched:
            self._fetch_versions()
        return self._latest_v
    
    @property
    def latest_av(self):
        if not self._avs_fetched:
            self._fetch_versions()
        return self._latest_av
    
    @property
    def best_v(self):
        if not self._best_av:
            self._get_best_version()
        return self._best_av
    
    @property
    def best_av(self):
        if not self._best_av:
            self._get_best_version()
        return self._best_av

    def _fetch_versions(self):
        from ignite_server.entities.assetversion import AssetVersion

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
        self._versions = versions
        self._assetversions = assetversions
        if versions:
            self._latest_v = versions[0]
            self._latest_av = assetversions[0]
        self._avs_fetched = True

    def _get_best_version(self):
        assetversions = self.assetversions.reverse()
        best_score = 0
        best_av = None
        for av in assetversions:
            print(av)
            score = av.score
            if score > best_score:
                best_score = score
                best_av = av
        self._best_v = best_av.version
        self._best_av = best_av

    def as_dict(self):
        d = {}
        for s in (
            "path", "dir_kind", "anchor", "project", "name", "versions", "latest_v", "uri"
        ):
            d[s] = getattr(self, s)
        if self.latest_av:
            d["latest_av"] = self.latest_av.as_dict()
            # d["thumbnail"] = d["latest_av"]["thumbnail"].as_posix()
        return d