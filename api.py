import os
import re
from pathlib import Path, PurePath
from ignite import utils


CONFIG = utils.get_config()
ROOT = PurePath(CONFIG["root"])
if not Path(ROOT).is_dir():
    os.makedirs(ROOT)


def create_project(name: str):
    if not utils.validate_dirname(name): 
        raise Exception(
            f"Invalid project name, only alphanumeric and underscores allowed: {name}"
        )
    if list(Path(ROOT).glob(name)):
        raise Exception(f"Project already exists: {name}")
    path = ROOT / name
    utils.ensure_directory(path)
    project = get_project(path)
    return project


def get_project_names() -> list:
    projects = Path(ROOT).iterdir()
    projects = [p for p in projects if not p.startswith(".")]
    return projects


def get_project(name):
    from ignite.entities.project import Project
    path = ROOT / name
    if not Path(ROOT).is_dir():
        return None
    return Project(path=path)


def find(path):
    from ignite.entities.project import Project
    from ignite.entities.directory import Directory
    from ignite.entities.phase import Phase
    from ignite.entities.build import Build
    from ignite.entities.sequence import Sequence
    from ignite.entities.shot import Shot
    from ignite.entities.task import Task
    from ignite.entities.asset import Asset
    from ignite.entities.assetversion import AssetVersion

    config = utils.get_config()
    kinds = {v: k for k, v in config["anchors"].items()}
    anchors = kinds.keys()
    entities = {
        "project": Project,
        "phase": Phase,
        "directory": Directory,
        "build": Build,
        "sequence": Sequence,
        "shot": Shot,
        "task": Task,
        "asset": Asset,
        "assetversion": AssetVersion
    }
    path = Path(path)
    for d in path.iterdir():
        name = d.name
        if name in anchors:
            entity = entities[kinds[name]]
            break
    else:
        return None
    return entity(path=path)
