import os
import logging
import platform
import yaml
import subprocess
import requests
from pathlib import PurePath, Path
from pprint import pprint
from ignite_client.constants import GENERIC_ENV, DCC_ENVS, OS_NAMES


ENV = os.environ
IGNITE_DCC = Path(os.environ["IGNITE_DCC"])
CONFIG_PATH = Path(Path.home(), ".ignite")
if not CONFIG_PATH.exists():
    CONFIG_PATH.mkdir()
IGNITE_SERVER_HOST = ENV["IGNITE_SERVER_HOST"]
IGNITE_SERVER_PORT = ENV["IGNITE_SERVER_PORT"]


def ingest(data):
    pprint(data)


def ingest_get_files(dirs):
    def trim_filepaths(files):
        parts = files[0].lstrip("/").split("/")
        for i, part in enumerate(parts):
            for file in files:
                if f"/{part}/" not in file:
                    break
        common = "/" + "/".join(parts[:i - 1]) + "/"
        return [f.replace(common, "") for f in files]

    files = []
    for dir in dirs:
        path = Path(dir)
        if path.is_dir():
            files += list(path.glob("**/*"))
        else:
            files.append(path)
    files_posix = [f.as_posix() for f in files]
    files_trimmed = trim_filepaths(files_posix)
    files_trimmed = list(set(files_trimmed))
    return files_trimmed
