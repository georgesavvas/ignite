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
        super().__init__(path)
        self.dir_kind = "phase"
    
    def create_build(self, name):
        path = self.create_dir(name)
        utils.create_anchor(path, "build")
    
    def create_sequence(self, name):
        path = self.create_dir(name)
        utils.create_anchor(path, "sequence")
