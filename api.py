import os
import yaml
import logging
from pathlib import Path, PurePath
from ignite import utils


CONFIG = utils.get_config()
PROJECT_ANCHOR = CONFIG["anchors"]["project"]
ROOT = PurePath(CONFIG["root"])
ANCHORS = CONFIG["anchors"]
KINDS = {v: k for k, v in ANCHORS.items()}
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
    projects = [p for p in projects if not p.name.startswith(".")]
    projects = [p.name for p in projects if (Path(p) / PROJECT_ANCHOR).exists()]
    return projects


def get_project(name):
    if not name:
        return None
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


def get_contents(path, as_dict=False):
    path = Path(path)
    contents = []
    for x in path.iterdir():
        entity = find(x)
        if not entity:
            continue
        if as_dict:
            if not hasattr(entity, "as_dir"):
                logging.warning(f"Directory entity has no as_dict method: {x}")
                continue
            contents.append(entity.as_dict())
        else:
            contents.append(entity)
    return contents


def get_dir_type(path, dir_type):
    root = ROOT.as_posix()
    anchor = CONFIG["anchors"][dir_type]
    path = Path(path)
    parent = path
    iter = 1
    while root in parent.as_posix():
        contents = [c.name for c in parent.iterdir()]
        if anchor in contents:
            return find(parent)
        iter +=1
        if iter > 20:
            raise Exception(f"Reached iteration limit when walking directory: {path}")
    return None


def get_phase(path):
    phase = get_dir_type(path, "phase")
    return phase


def get_sequence(path):
    sequence = get_dir_type(path, "sequence")
    return sequence


def get_shot(path):
    shot = get_dir_type(path, "shot")
    return shot


def get_build(path):
    build = get_dir_type(path, "build")
    return build


def get_project(path):
    project = get_dir_type(path, "project")
    return project


def get_task(path):
    task = get_dir_type(path, "task")
    return task


def discover_tasks(path, task_types=[], as_dict=False):
    from ignite.entities.task import Task

    def discover(path, l=[]):
        name = path.name
        if path.is_dir():
            d = {}
            d["name"] = name
            d["path"] = path.as_posix()
            d["dir_kind"] = ""
            d["task_type"] = ""
            d["anchor"] = None
            for x in path.iterdir():
                name = x.name
                if name in (".config", "common"):
                    continue
                if name in KINDS:
                    d["dir_kind"] = KINDS[name]
                    d["anchor"] = x
                    continue
                elif not d["dir_kind"]:
                    return []
                if d["dir_kind"] == "task" and d["anchor"]:
                    with open(d["anchor"], "r") as f:
                        config = yaml.safe_load(f)
                        config = config or {}
                        d["task_type"] = config.get("task_type")
                discover(x, l)
            if d["dir_kind"] == "task":
                if not task_types or d["task_type"] in task_types:
                    l.append(d)
        return l

    data = discover(Path(path))
    tasks = [Task(path=task["path"]) for task in data]
    if as_dict:
        tasks = [t.as_dict() for t in tasks]
    return tasks


def discover_assets(path, asset_kinds=[], as_dict=False):
    from ignite.entities.asset import Asset

    def discover(path, l=[]):
        name = path.name
        if path.is_dir():
            d = {}
            d["name"] = name
            d["path"] = path.as_posix()
            d["dir_kind"] = ""
            d["anchor"] = None
            for x in path.iterdir():
                name = x.name
                if name in (".config", "common"):
                    continue
                if name in KINDS:
                    d["dir_kind"] = KINDS[name]
                    d["anchor"] = x
                    continue
                elif not d["dir_kind"] and d["name"] not in ("exports", "scenes"):
                    return []
                if d["dir_kind"] == "asset" and d["anchor"]:
                    with open(d["anchor"], "r") as f:
                        config = yaml.safe_load(f)
                        config = config or {}
                discover(x, l)
            if d["dir_kind"] == "asset":
                if not asset_kinds or d["asset_kind"] in asset_kinds:
                    l.append(d)
        return l

    data = discover(Path(path))
    assets = [Asset(path=asset["path"]) for asset in data]
    if as_dict:
        assets = [a.as_dict() for a in assets]
    return assets


def discover_assetversions(path, asset_kinds=[], as_dict=False):
    from ignite.entities.assetversion import AssetVersion

    def discover(path, l=[]):
        name = path.name
        if path.is_dir():
            d = {}
            d["name"] = name
            d["path"] = path.as_posix()
            d["dir_kind"] = ""
            d["anchor"] = None
            for x in path.iterdir():
                name = x.name
                if name in (".config", "common"):
                    continue
                if name in KINDS:
                    d["dir_kind"] = KINDS[name]
                    d["anchor"] = x
                    continue
                elif not d["dir_kind"] and d["name"] not in ("exports", "scenes"):
                    return []
                if d["dir_kind"] == "assetversion" and d["anchor"]:
                    with open(d["anchor"], "r") as f:
                        config = yaml.safe_load(f)
                        config = config or {}
                discover(x, l)
            if d["dir_kind"] == "assetversion":
                if not asset_kinds or d["asset_kind"] in asset_kinds:
                    l.append(d)
        return l

    data = discover(Path(path))
    assetversions = [AssetVersion(path=av["path"]) for av in data]
    if as_dict:
        assetversions = [av.as_dict() for av in assetversions]
    return assetversions


def discover_scenes(path, dcc=[], latest=True, as_dict=False):
    from ignite.entities.scene import Scene

    def discover(path, l=[]):
        name = path.name
        if path.is_dir():
            d = {}
            d["name"] = name
            d["path"] = path.as_posix()
            d["dir_kind"] = ""
            d["anchor"] = None
            for x in path.iterdir():
                name = x.name
                if name in (".config", "common"):
                    continue
                if name in KINDS:
                    d["dir_kind"] = KINDS[name]
                    d["anchor"] = x
                    continue
                elif not d["dir_kind"] and name not in ("exports", "scenes"):
                    return []
                if d["dir_kind"] == "scene" and d["anchor"]:
                    with open(d["anchor"], "r") as f:
                        config = yaml.safe_load(f)
                        config = config or {}
                discover(x, l)
            if d["dir_kind"] == "scene":
                if not dcc or d["dcc"] in dcc:
                    l.append(d)
        return l

    data = discover(Path(path))
    scenes = [Scene(path=scene["path"]) for scene in data]
    if as_dict:
        scenes = [s.as_dict() for s in scenes]
    return scenes
