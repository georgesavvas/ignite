import os
from pathlib import Path, PurePath
from ignite_server.constants import ANCHORS
from ignite_server import utils
from ignite_server.entities.directory import Directory


CONFIG = utils.get_config()
ROOT = PurePath(CONFIG["projects_root"])
PHASES = ("global", "rnd", "build", "shots")
ANCHOR = ANCHORS["phase"]


class Phase(Directory):
    def __init__(self, path="") -> None:
        super().__init__(path, dir_kind = "phase")
