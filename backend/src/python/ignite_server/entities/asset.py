import os
import yaml
from pathlib import Path, PurePath
from ignite_server import utils
from ignite_server.entities.directory import Directory
from ignite_server.utils import CONFIG


ROOT = PurePath(CONFIG["projects_root"])


class Asset(Directory):
    def __init__(self, path="") -> None:
        super().__init__(path, dir_kind="asset")
        self.dict_attrs = ["path", "dir_kind", "anchor", "project", "name", "versions",
            "latest_v", "uri", "context", "next_path", "creation_time", "modification_time"]
        self.nr_attrs = ["path"]
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
        assetversions = sorted(self.assetversions, reverse=True)
        if not assetversions:
            return
        best_score = -1
        best_av = None
        for av in assetversions:
            score = av.score
            if score > best_score:
                best_score = score
                best_av = av
        self._best_v = best_av.version
        self._best_av = best_av

    @property
    def next_version(self):
        if self.latest_v:
            version = int(self.latest_v.lstrip("v"))
            version += 1
            return "v" + str(version).zfill(3)
        else:
            return "v001"
    
    @property
    def next_path(self):
        next_v = self.next_version
        return self.path / next_v

    def as_dict(self):
        d = super().as_dict()
        if self.latest_av:
            d["latest_av"] = self.latest_av.as_dict()
        return d
    
    def get_tags(self):
        with open(self.anchor, "r") as f:
            config = yaml.safe_load(f) or {}
        return config.get("tags", {})

    def set_tags(self, version, tags):
        asset_tags = self.get_tags()
        asset_tags[version] = tags
        self.update_config({"tags": asset_tags})
        return asset_tags[version]
    
    def add_tags(self, version, tags):
        asset_tags = self.get_tags()
        existing = asset_tags.get(version, [])
        existing += tags
        asset_tags[version] = list(set(existing))
        self.update_config({"tags": asset_tags})
        return asset_tags[version]
    
    def remove_tags(self, version, tags=[], all=False):
        asset_tags = self.get_tags()
        existing = asset_tags.get(version, [])
        if all:
            existing = []
        for tag in tags:
            if tag not in existing:
                continue
            existing.remove(tag)
        asset_tags[version] = list(set(existing))
        self.update_config({"tags": asset_tags})
        return asset_tags[version]
