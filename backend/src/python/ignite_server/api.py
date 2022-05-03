import os
from re import A
import yaml
import logging
import shutil
from pathlib import Path, PurePath
from ignite_server import utils
from ignite_server.constants import ANCHORS


ENV = os.environ
CONFIG = utils.get_config()
PROJECT_ANCHOR = ANCHORS["project"]
ROOT = PurePath(CONFIG["projects_root"])
KINDS = {v: k for k, v in ANCHORS.items()}
if not Path(ROOT).is_dir():
    os.makedirs(ROOT)
IGNITE_SERVER_ROOT = Path(ENV["IGNITE_SERVER_ROOT"])


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


def get_projects_root() -> str:
    return str(ROOT)


def get_projects() -> list:
    from ignite_server.entities.project import Project
    projects = Path(ROOT).iterdir()
    projects = [p for p in projects if not p.name.startswith(".")]
    projects = [Project(path=ROOT / p.name).as_dict() for p in projects if (Path(p) / PROJECT_ANCHOR).exists()]
    return projects


def get_project_names() -> list:
    projects = Path(ROOT).iterdir()
    projects = [p for p in projects if not p.name.startswith(".")]
    projects = [p.name for p in projects if (Path(p) / PROJECT_ANCHOR).exists()]
    return projects


def get_project(name):
    if not name:
        return None
    from ignite_server.entities.project import Project
    path = ROOT / name
    if not Path(ROOT).is_dir():
        return None
    return Project(path=path)


def get_context_info(path):
    if not path:
        return {}
    kinds = list(KINDS.keys())
    path = Path(path)
    if not path.exists():
        return {}
    if path.name in ("exports", "scenes") or path.is_file():
        path = path.parent
    parts = path.parts
    ancestor_kinds = {}
    ignore = len(ROOT.parts)
    for i in range(len(parts)):
        if i <= ignore:
            continue
        part_path = ROOT / PurePath(*parts[:i])
        kind = get_dir_kind(part_path, append_task=True)
        ancestor_kinds[part_path.as_posix()] = kind
    for x in path.iterdir():
        name = x.name
        if name not in kinds:
            continue
        kind = KINDS[name]
        ancestor_kinds[path.as_posix()] = kind
        project = path.as_posix().split(ROOT.as_posix(), 1)[1].lstrip("/").split("/")[0]
        data = {
            "root": ROOT.as_posix(),
            "name": name,
            "path": str(path),
            "posix": path.as_posix(),
            "parent": str(path.parent),
            "project": project.strip(),
            "dir_kind": kind,
            "ancestor_kinds": ancestor_kinds
        }
        return data
    return {}


def find(path):
    from ignite_server.entities.asset import Asset

    if not path:
        return
    path = str(path).strip()

    if utils.is_uri(path):
        if path.count("@") > 1:
            logging.error(f"URI has more than 1 '@': {path}")
            return None
        asset_uri, version = path.split("@")
        if version.isnumeric():
            path = utils.uri_to_path(path)
            return _find_from_path(path)
        else:
            if version not in ("best", "latest"):
                logging.error(f"URI version '{version}' not recognised: {path}")
                return None
            asset_path = utils.uri_to_path(asset_uri)
            asset = Asset(asset_path)
            if not asset:
                logging.error(f"Couldn't find path at {asset_path}")
                return None
            if version == "best":
                return asset.best_av
            elif version == "latest":
                return asset.latest_av
    else:
        return _find_from_path(path)


def _find_from_path(path):
    from ignite_server.entities.project import Project
    from ignite_server.entities.directory import Directory
    from ignite_server.entities.phase import Phase
    from ignite_server.entities.build import Build
    from ignite_server.entities.sequence import Sequence
    from ignite_server.entities.shot import Shot
    from ignite_server.entities.task import Task
    from ignite_server.entities.asset import Asset
    from ignite_server.entities.assetversion import AssetVersion
    from ignite_server.entities.scene import Scene

    kinds = {v: k for k, v in ANCHORS.items()}
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
        "assetversion": AssetVersion,
        "scene": Scene
    }
    path = Path(path)
    if not path.is_dir():
        path = path.parent
    if not path.is_dir():
        logging.error(f"Invalid path: {path}")
        return
    for d in path.iterdir():
        name = d.name
        if name in anchors:
            entity = entities[kinds[name]]
            break
    else:
        return
    return entity(path=path)


def get_dir_kind(path, append_task=False):
    anchors = KINDS.keys()
    for x in Path(path).iterdir():
        name = x.name
        if name not in anchors:
            continue
        kind = KINDS[name]
        if kind != "task":
            return kind
        with open(x, "r") as f:
            config = yaml.safe_load(f)
        if not config:
            return "task_generic"
        kind = "task_" + config.get("task_type", "generic")
        return kind


def get_contents(path, as_dict=False):
    path = Path(path)
    exp = path / "exports"
    if exp.is_dir():
        path = exp
    contents = []
    for x in path.iterdir():
        if not x.is_dir():
            continue
        entity = find(x)
        if not entity and x.name in ("exports", "scenes"):
            if x.name == "scenes":
                scenes = discover_scenes(x)
                contents.append(scenes)
            elif x.name == "exports":
                avs = discover_assetversions(x)
                contents.append(avs)
            continue
        contents.append(entity)
    if as_dict:
        contents = [c.as_dict() for c in contents if hasattr(c, "as_dict")]
    for d in contents:
        if not d.get("repr"):
            continue
        d["thumbnail"] = get_repr_comp(d["path"])
    return contents


def get_dir_type(path, dir_type):
    root = ROOT.as_posix()
    anchor = ANCHORS[dir_type]
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


def _get_project(path):
    project = get_dir_type(path, "project")
    return project


def get_task(path):
    task = get_dir_type(path, "task")
    return task


def discover_tasks(path, task_types=[], as_dict=False):
    from ignite_server.entities.task import Task

    def discover(path, l=[]):
        name = path.name
        if path.is_dir():
            d = {}
            d["name"] = name
            d["path"] = path
            d["dir_kind"] = ""
            d["task_type"] = ""
            d["anchor"] = None
            for x in sorted(list(path.iterdir())):
                name = x.name
                if name in (".config", "common"):
                    continue
                if name in KINDS:
                    d["dir_kind"] = KINDS[name]
                    d["anchor"] = x
                    continue
                if name.startswith("."):
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
    from ignite_server.entities.asset import Asset

    def discover(path, l=[]):
        name = path.name
        if path.is_dir():
            d = {}
            d["name"] = name
            d["path"] = str(path)
            d["dir_kind"] = ""
            d["anchor"] = None
            for x in sorted(list(path.iterdir())):
                name = x.name
                if name in (".config", "common"):
                    continue
                if name in KINDS:
                    d["dir_kind"] = KINDS[name]
                    d["anchor"] = x
                    continue
                if name.startswith("."):
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


def discover_assetversions(path, asset_kinds=[], latest=False, as_dict=False):
    from ignite_server.entities.assetversion import AssetVersion

    assetversions = []
    assets = discover_assets(path, asset_kinds=asset_kinds)
    for asset in assets:
        avs = asset.assetversions
        if not avs:
            continue
        if latest:
            assetversions.append(asset.latest_av)
            continue
        assetversions += avs
    if as_dict:
        assetversions = [av.as_dict() for av in assetversions]
    return assetversions


def discover_scenes(path, dcc=[], latest=False, as_dict=False):
    from ignite_server.entities.scene import Scene

    path = Path(path)
    def discover(path, l=[]):
        name = path.name
        if path.is_dir():
            d = {}
            d["name"] = name
            d["path"] = str(path)
            d["dir_kind"] = ""
            d["anchor"] = None
            contents = sorted(list(path.iterdir()))
            if contents and path.name == "scenes":
                contents = sorted(contents, reverse=True)
                if latest:
                    contents = [contents[0]]
            for x in contents:
                name = x.name
                if name in (".config", "common"):
                    continue
                if name in KINDS:
                    d["dir_kind"] = KINDS[name]
                    d["anchor"] = x
                    continue
                if name.startswith("."):
                    continue
                elif not d["dir_kind"] and d["name"] != "scenes":
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


def copy_default_scene(task, dcc):
    task = find(task)
    if not task or not task.dir_kind == "task":
        return
    filepath = IGNITE_SERVER_ROOT / "cg/default_scenes/default_scenes.yaml"
    if not filepath.exists():
        return
    with open(filepath, "r") as f:
        data = yaml.safe_load(f)
    if dcc not in data.keys():
        return
    src = IGNITE_SERVER_ROOT / "cg/default_scenes" / data[dcc]
    dest = task.get_next_scene()
    os.makedirs(dest)
    shutil.copy2(src, dest)
    utils.create_anchor(dest, "scene")
    return dest / PurePath(src).name


def register_directory(path, dir_kind):
    utils.create_anchor(path, dir_kind)
    return True


def register_task(path, task_type):
    utils.create_anchor(path, "task")
    task = find(path)
    if not task:
        return
    task.set_task_type(task_type)
    return True


def register_scene(path):
    utils.create_anchor(path, "scene")
    return True


def register_assetversion(path):
    utils.create_anchor(path, "assetversion")
    av = find(path)
    if not av.dir_kind == "assetversion":
        return
    comps = av.components
    return True


def set_repr_asset(target, repr):
    target_entity = find(target)
    repr_entity = find(repr)
    if not target_entity:
        return
    if not repr_entity:
        return
    if repr_entity.dir_kind == "assetversion":
        repr_entity = find(repr_entity.asset)
    target_entity.set_repr(repr_entity.uri)
    return True


def get_repr_comp(target):
    print("\n\nGETTING REPR COMP FOR", target)
    anchors = list(ANCHORS.values())
    asset_anchor = ANCHORS["asset"]
    def search(path):
        print("Searching in", path)
        for x in path.iterdir():
            if x.name == asset_anchor:
                print("Found asset", x)
                return x
            if x.name not in anchors and x.name not in ("exports", "scenes"):
                continue
            if x.name in anchors:
                anchor = KINDS[x.name]
                with open(x, "r") as f:
                    config = yaml.safe_load(f)
                their_repr = config.get("repr", "")
                if their_repr:
                    return search(Path(their_repr))

    target_entity = find(target)
    target_repr = target_entity.repr
    if utils.is_uri(target_repr):
        target_repr = utils.uri_to_path(target_repr)
    path =  Path(target_repr)
    repr_asset = search(path)
    if not repr_asset:
        return {}
    asset = find(repr_asset)
    return asset.latest_av.get_thumbnail()
