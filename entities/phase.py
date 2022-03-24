import os
from pathlib import Path, PurePath
from ignite import utils
from ignite.entities.directory import Directory


CONFIG = utils.get_config()
ROOT = PurePath(CONFIG["root"])
PHASES = ("global", "rnd", "build", "shots")
ANCHOR = CONFIG["anchors"]["phase"]


class Phase(Directory):
    def __init__(self, path="") -> None:
        super().__init__(path, dir_kind = "phase")
