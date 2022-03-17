from inspect import getcallargs
import os
import yaml
import logging
import re
from pathlib import Path, PurePath


def get_config() -> dict:
    path = os.environ["IGNITE_CONFIG_PATH"]
    if not os.path.isfile(path):
        raise Exception(f"Config file not found: {path}")
    logging.info(f"Reading config from {path}...")    
    with open(path, "r") as f:
        config = yaml.safe_load(f)
    paths = ("root",)
    for p in paths:
        config[p] = os.path.abspath(config[p])
    return config


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
    if not name.startswith(".ign_"):
        name = ".ign_" + name
    if not name.startswith("."):
        name = "." + name
    full_path = Path(path / name)
    if not full_path.exists():
        full_path.touch()
    return full_path
