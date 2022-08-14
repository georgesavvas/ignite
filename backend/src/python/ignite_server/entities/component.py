import os
from pathlib import Path, PurePath
import clique
from ignite_server.constants import ANCHORS
from ignite_server import utils


CONFIG = utils.get_config()
ROOT = PurePath(CONFIG["projects_root"])


class Component():
    def __init__(self, path=None) -> None:
        self.name = ""
        self.filename = ""
        self.path = ""
        self.ext = ""
        self.static = False
        self.first_frame = 0
        self.last_frame = 0
        if path:
            self.load_from_path(path)
        
    def load_from_path(self, path):
        if type(path) == clique.collection.Collection:
            self.load_from_clique_collection(path)
        else:
            self.load_from_string(path)
    
    def load_from_string(self, s):
        path = PurePath(s)
        self.name = path.stem
        self.filename = path.name
        self.path = path.as_posix()
        self.path_nr = utils.get_nr(path)
        self.ext = path.suffix
        self.static = True
        self.first_frame = 0
        self.last_frame = 0

    def load_from_clique_collection(self, c):
        path = PurePath(c.format("{head}####{tail}"))
        indexes = list(c.indexes)
        name = path.name
        ext = c.tail
        self.name = path.stem.replace(".####", "")
        self.filename = name
        self.path = str(path)
        self.path_nr = utils.get_nr(path)
        self.ext = ext
        self.static = False
        self.first_frame = indexes[0]
        self.last_frame = indexes[-1]

    def as_dict(self):
        d = {}
        for s in ("name", "filename", "path", "ext", "static", "first_frame",
                "last_frame"):
            d[s] = getattr(self, s)
        return d
