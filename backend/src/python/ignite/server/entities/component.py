# Copyright 2022 George Savvas

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     https://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


from pathlib import PurePath

import clique
from ignite.server import utils


class Component():
    def __init__(self, path=None) -> None:
        self.dict_attrs = ["name", "filename", "path", "ext", "static", "first_frame",
            "last_frame", "frames"]
        self.nr_attrs = ["path"]
        self.name = ""
        self.filename = ""
        self.path = ""
        self.ext = ""
        self.static = False
        self.first_frame = 0
        self.last_frame = 0
        self.frames = []
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
        self.frames = []

    def load_from_clique_collection(self, c):
        path = PurePath(c.format("{head}####{tail}"))
        indexes = list(c.indexes)
        indexes = [str(i).zfill(4) for i in indexes]
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
        self.frames = indexes

    def as_dict(self):
        d = {}
        for s in self.dict_attrs:
            value = getattr(self, s)
            d[s] = value
            if s in self.nr_attrs:
                d[f"{s}_nr"] = utils.get_nr(value)
        return d
