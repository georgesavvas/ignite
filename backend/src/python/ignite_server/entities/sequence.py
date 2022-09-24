import os
from pathlib import Path, PurePath
from ignite_server import utils
from ignite_server.entities.directory import Directory


class Sequence(Directory):
    def __init__(self, path="") -> None:
        super().__init__(path, dir_kind="sequence")
