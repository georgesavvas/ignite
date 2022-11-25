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


from pathlib import Path, PurePath

import clique
from ignite.constants import SEQUENCE_CHARS
from ignite.utils import replace_frame_in_path, is_sequence
from ignite.logger import get_logger
from ignite.server import utils


LOGGER = get_logger(__name__)


class Component():
    def __init__(self, path=None) -> None:
        self.dict_attrs = ["name", "filename", "path", "ext", "static",
            "first_frame", "last_frame", "frames", "uri", "dir_kind"]
        self.nr_attrs = ["path"]
        self.name = ""
        self.filename = ""
        self.path = ""
        self.dir_kind = "component"
        self.ext = ""
        self.uri = ""
        self.static = False
        self.first_frame = 0
        self.last_frame = 0
        self.frames = []
        self.clique_collection = None
        if path:
            self.load_from_path(path)
        
    def load_from_path(self, path):
        if type(path) == clique.collection.Collection:
            self.load_from_clique_collection(path)
            return
        if not type(path) == "str":
            path = path.as_posix()
        if "####" in path or "*" in path:
            path = path.replace("####", "*")
            path = Path(path)
            collections, remainder = clique.assemble(
                [str(d) for d in path.parent.glob(path.name)]
            )
            if collections:
                self.clique_collection = collections[0]
                self.load_from_clique_collection(self.clique_collection)
            elif remainder:
                self.load_from_string(remainder[0])
            else:
                LOGGER.error(f"Couldn't create component from {path}")
            return
        self.load_from_string(path)
    
    def load_from_string(self, s):
        path = PurePath(s)
        self.name = path.stem
        self.filename = path.name
        self.path = path.as_posix()
        self.uri = utils.get_uri(self.path)
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
        self.path = path.as_posix()
        self.uri = utils.get_uri(self.path)
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

    def rename(self, new_name):
        path = Path(self.path)
        if not is_sequence(path):
            path = path.rename(path.with_stem(new_name))
            self.__init__(path)
            return path.stem == new_name
        path = replace_frame_in_path(self.path, "*")
        path = Path(path)
        sequence_files = list(path.parent.glob(path.name))
        if not sequence_files:
            LOGGER.error(f"Component has no files or was already deleted.")
            return
        for file in sequence_files:
            frame = file.stem.split(".")[-1]
            new_path = file.with_stem(f"{new_name}.{frame}")
            if new_path.exists():
                # TODO Reverse rename changes
                return
            file.rename(new_path)
        first = sequence_files[0]
        frame = first.stem.split(".")[-1]
        return not first.stem == f"{new_name}.{frame}"
    
    def delete(self):
        LOGGER.warning(f"Attempting to delete {self.path}")
        try:
            path = Path(self.path)
            if not is_sequence(path):
                path.unlink()
                return not path.exists()
            path = replace_frame_in_path(self.path, "*")
            path = Path(path)
            sequence_files = list(path.parent.glob(path.name))
            if not sequence_files:
                LOGGER.error(f"Component has no files or was already deleted.")
                return
            for file in sequence_files:
                file.unlink()
            return not sequence_files[0].exists()
        except Exception as e:
            LOGGER.error("Failed.")
            LOGGER.error(e)
