from inspect import getcallargs
import os
import yaml
import logging
import re
from pathlib import Path, PurePath
from ignite_server.constants import ANCHORS


def get_config() -> dict:
    path = os.environ["IGNITE_CONFIG_PATH"]
    if not os.path.isfile(path):
        raise Exception(f"Config file not found: {path}")
    logging.info(f"Reading config from {path}...")    
    with open(path, "r") as f:
        config = yaml.safe_load(f)
    paths = ("projects_root",)
    for p in paths:
        config[p] = os.path.abspath(config[p])
    return config


CONFIG = get_config()
ROOT = PurePath(CONFIG["projects_root"])


def ensure_directory(path: Path) -> int:
    path = Path(path)
    if path.is_file():
        logging.warning(f"ensure_directory run but path was pointing to a file: {path}")
        return 1
    elif path.is_dir():
        return 1
    else:
        path.mkdir(parents=True, exist_ok=True)
        return 0


def validate_dirname(name, extra_chars=""):
    return re.match(f"^[a-zA-Z0-9_{extra_chars}]+$", name)


def create_anchor(path, name):
    ensure_directory(path)
    anchor = ANCHORS.get(name)
    if not anchor:
        raise Exception(f"Invalid anchor name: {name}")
    full_path = Path(path / anchor)
    if not full_path.exists():
        full_path.touch()
    return full_path


def get_uri(path):
    splt = PurePath(path).as_posix().split(ROOT.as_posix(), 1)[1].replace("/exports", "").split("/")[1:]
    print(splt)
    project = splt[0]
    phase = splt[1]
    context = "/".join(splt[2:-2])
    task = splt[-2]
    asset = splt[-1]
    uri = f"ign:{project}:{phase}/{context}/{task}:{asset}"
    return uri


def get_api_path(path):
    path = str(path)
    return path.replace(str(ROOT), "")
