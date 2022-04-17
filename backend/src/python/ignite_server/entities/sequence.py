import os
from pathlib import Path, PurePath
from ignite_server import utils
from ignite_server.entities.directory import Directory

CONFIG = utils.get_config()
ROOT = PurePath(CONFIG["projects_root"])


class Sequence(Directory):
    def __init__(self, path="") -> None:
        super().__init__(path, dir_kind = "sequence")
