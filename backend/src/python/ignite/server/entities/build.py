import os
from pathlib import Path, PurePath
from ignite.server import utils
from ignite.server.entities.directory import Directory
from ignite.server.utils import CONFIG


class Build(Directory):
    def __init__(self, path="") -> None:
        super().__init__(path, dir_kind="build")
