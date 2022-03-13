import os
from pathlib import Path, PurePath
from ignite import utils
from ignite.entities.asset import Asset

CONFIG = utils.get_config()
ROOT = PurePath(CONFIG["root"])


class AssetVersion(Asset):
    def __init__(self, path="") -> None:
        super().__init__(path)
        self.dir_kind = "assetversion"
