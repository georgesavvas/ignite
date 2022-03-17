import os
from pathlib import Path, PurePath
from ignite import utils
from ignite.entities.directory import Directory

CONFIG = utils.get_config()
ROOT = PurePath(CONFIG["root"])


class Sequence(Directory):
    def __init__(self, path="") -> None:
        super().__init__(path)
        self.dir_kind = "sequence"
    
    def create_shot(self, name):
        path = self.create_dir(name, "shot")
