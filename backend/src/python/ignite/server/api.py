import os
import shutil
from pathlib import Path, PurePath

import yaml
from ignite.server import utils
from ignite.server.constants import ANCHORS
from ignite.server.utils import CONFIG
from ignite.utils import get_logger
from mongoquery import Query

LOGGER = get_logger(__name__)
ENV = os.environ
PROJECT_ANCHOR = ANCHORS["project"]
KINDS = {v: k for k, v in ANCHORS.items()}
IGNITE_SERVER_ROOT = Path(ENV["IGNITE_SERVER_ROOT"])
IGNITE_DCC = Path(ENV["IGNITE_DCC"])
USER_CONFIG_PATH = PurePath(ENV["IGNITE_USER_CONFIG_PATH"])
RULE_TEMPLATES_PATH = USER_CONFIG_PATH / "rule_templates.yaml"


def create_project(name: str):
    if not utils.validate_dirname(name): 
        return False, "invalid project name"
    if list(Path(CONFIG["root"]).glob(name)):
        return False, "already exists"
    path = CONFIG["root"] / name
    utils.create_anchor(path, "project")
    utils.create_anchor(path / "global", "group")
    utils.create_anchor(path / "build", "group")
    utils.create_anchor(path / "shots", "group")
    utils.ensure_directory(path / "common")
    project = get_project(path)
    return project != None, ""


def get_projects_root() -> str:
    return str(CONFIG["root"])


def get_vault_path() -> str:
    return str(CONFIG["vault"])


def get_projects() -> list:
    from ignite.server.entities.project import Project
    projects = Path(CONFIG["root"]).iterdir()
    projects = [p for p in projects if not p.name.startswith(".")]
    projects = [Project(path=p).as_dict() for p in projects if (Path(p) / PROJECT_ANCHOR).exists()]
    return projects


def get_project_names() -> list:
    projects = Path(CONFIG["root"]).iterdir()
    projects = [p for p in projects if not p.name.startswith(".")]
    projects = [p.name for p in projects if (Path(p) / PROJECT_ANCHOR).exists()]
    return projects


def get_project(name):
    if not name:
        return None
    from ignite.server.entities.project import Project
    path = CONFIG["root"] / name
    if not Path(CONFIG["root"]).is_dir():
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
    ignore = len(CONFIG["root"].parts)
    for i in range(len(parts)):
        if i <= ignore:
            continue
        part_path = CONFIG["root"] / PurePath(*parts[:i])
        kind = utils.get_dir_kind(part_path)
        ancestor_kinds[part_path.as_posix()] = kind
    for x in path.iterdir():
        name = x.name
        if name not in kinds:
            continue
        kind = KINDS[name]
        ancestor_kinds[path.as_posix()] = kind
        project = path.as_posix().split(
            CONFIG["root"].as_posix(), 1
        )[1].lstrip("/").split("/")[0]
        data = {
            "root": CONFIG["root"].as_posix(),
            "name": name,
            "path": str(path),
            "path_nr": utils.get_nr(path),
            "posix": path.as_posix(),
            "parent": str(path.parent),
            "parent_nr": utils.get_nr(path.parent),
            "project": project.strip(),
            "project_path": (CONFIG["root"] / project).as_posix(),
            "dir_kind": kind,
            "ancestor_kinds": ancestor_kinds
        }
        return data
    return {}


def find(path):
    from ignite.server.entities.asset import Asset

    if not path:
        return
    path = str(path).strip()

    if utils.is_uri(path):
        if not "@" in path:
            path = utils.uri_to_path(path)
            return _find_from_path(path)
        asset_uri, version = path.split("@")
        if version.isnumeric():
            path = utils.uri_to_path(path)
            return _find_from_path(path)
        else:
            if version not in ("best", "latest"):
                LOGGER.error(f"URI version '{version}' not recognised: {path}")
                return None
            asset_path = Path(utils.uri_to_path(asset_uri))
            if not asset_path or not asset_path.exists():
                return None
            asset = Asset(asset_path)
            if not asset:
                LOGGER.error(f"Couldn't find path at {asset_path}")
                return None
            if version == "best":
                return asset.best_av
            elif version == "latest":
                return asset.latest_av
    else:
        return _find_from_path(path)


def resolve(uri):
    entity = find(uri)
    if not entity:
        return None
    if entity.dir_kind == "asset":
        entity = entity.latest_av
    if entity.dir_kind == "assetversion":
        for comp in entity.components:
            if comp["ext"] in (".usd", ".usdc", ".usda", ".usdz"):
                path = PurePath(comp["path"])
                return path.as_posix()
    return None if not entity else entity.path


def _find_from_path(path):
    from ignite.server.entities.asset import Asset
    from ignite.server.entities.assetversion import AssetVersion
    from ignite.server.entities.build import Build
    from ignite.server.entities.directory import Directory
    from ignite.server.entities.group import Group
    from ignite.server.entities.project import Project
    from ignite.server.entities.scene import Scene
    from ignite.server.entities.sequence import Sequence
    from ignite.server.entities.shot import Shot
    from ignite.server.entities.task import Task

    kinds = {v: k for k, v in ANCHORS.items()}
    anchors = kinds.keys()
    entities = {
        "project": Project,
        "group": Group,
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
    if path.is_file():
        path = path.parent
    if not path.is_dir():
        LOGGER.error(f"Invalid path: {path}")
        return
    for d in path.iterdir():
        name = d.name
        if name in anchors:
            entity = entities[kinds[name]]
            break
    else:
        return
    obj = None
    try:
        obj = entity(path=path)
    except Exception as e:
        LOGGER.error(e)
    return obj


def create_dirs(path, method, dirs):
    created = 0
    entity = find(path)
    if not entity:
        print(f"Couldn't find entity at {path}")
        return created
    for d in dirs:
        dir_name = d.get("dir_name")
        if not dir_name:
            continue
        if method == "create_task":
            entity.create_task(dir_name, task_type=d["dir_type"])
            created += 1
            continue
        if not hasattr(entity, method):
            print(entity, "has no method", method)
            continue
        getattr(entity, method)(dir_name)
        created += 1
    return created


def sort_results(results, sort):
    if sort and results:
        keys = list(results[0].keys())
        field = sort["field"]
        reverse = sort.get("reverse", False)
        if field in keys:
            results.sort(key=lambda c: c[field], reverse=reverse)
    return results


def format_filter(expr):
    if not expr:
        return {}
    if isinstance(expr, list):
        return [format_filter(e) for e in expr]
    elif expr.get("condition"):
        condition = "$and" if expr.get("condition", "") == "and" else "$or"
        return {condition: format_filter(expr.get("filters", []))}
    else:
        field, value = list(expr.items())[0]
        if not value:
            return {}
        if not field:
            field = "filter_string"
        if ".ARRAY." in field:
            first, second = field.split(".ARRAY.")
            if second:
                return {first: {"$elemMatch": {second: {"$regex": value}}}}
            else:
                return {first: {"$elemMatch": {"$regex": value}}}
        return {field: {"$regex": value}}


def get_contents(path, latest=False, sort=None, as_dict=False):
    path = Path(path)
    contents = []
    if not path.is_dir():
        return contents
    for x in path.iterdir():
        if not x.is_dir():
            continue
        if x.name in ("exports", "scenes"):
            if x.name == "scenes":
                scenes = discover_scenes(x, latest=latest)
                contents += scenes
            elif x.name == "exports":
                avs = discover_assetversions(x, latest=latest)
                contents += avs
            continue
        entity = find(x)
        contents.append(entity)
    if as_dict:
        contents = [c.as_dict() for c in contents if hasattr(c, "as_dict")]
        for d in contents:
            if not d.get("repr"):
                continue
            d["thumbnail"] = get_repr_comp(d["path"])
        contents = sort_results(contents, sort)
    return contents


def get_group(path):
    group = find(utils.get_dir_type(path, "group"))
    return group


def get_sequence(path):
    sequence = find(utils.get_dir_type(path, "sequence"))
    return sequence


def get_shot(path):
    shot = find(utils.get_dir_type(path, "shot"))
    return shot


def get_build(path):
    build = find(utils.get_dir_type(path, "build"))
    return build


def _get_project(path):
    project = find(utils.get_dir_type(path, "project"))
    return project


def get_task(path):
    task = find(utils.get_dir_type(path, "task"))
    return task


def discover_tasks(path, task_types=[], sort=None, as_dict=False):
    from ignite.server.entities.task import Task

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
        tasks = sort_results(tasks, sort)
    return tasks


def discover_assets(path, asset_kinds=[], sort=None, as_dict=False, filters={}, single=False):
    from ignite.server.entities.asset import Asset

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
                    kind = KINDS[name]
                    d["dir_kind"] = kind
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
                if single and l:
                    return l
                discover(x, l)
            if d["dir_kind"] == "asset":
                if not asset_kinds or d["asset_kind"] in asset_kinds:
                    l.append(d)
                    if single:
                        return

        return l

    def promote_av_attribs(assets):
        attribs = ("tags", "components")
        for asset in assets:
            if not asset.get("latest_av"):
                continue
            for attrib in attribs:
                asset[attrib] = asset["latest_av"][attrib]
            del asset["latest_av"]
        return assets

    data = discover(Path(path))
    assets = [Asset(path=asset["path"]) for asset in data]
    if as_dict:
        assets = [a.as_dict() for a in assets]
        if filters:
            from pprint import pprint
            assets = promote_av_attribs(assets)
        if filters.get("collection"):
            query = Query(format_filter(filters["collection"]))
            filtered = list(filter(query.match, assets))
            assets = filtered
            print("AFTER COLLECTION FILTER", len(assets))
        if filters.get("search"):
            expr = format_filter(filters["search"])
            query = Query(expr)
            filtered = list(filter(query.match, assets))
            assets = filtered
        assets = sort_results(assets, sort)
    return assets


def discover_assetversions(path, asset_kinds=[], latest=False, sort=None, filters=[], as_dict=False):
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
        assetversions = sort_results(assetversions, sort)
    return assetversions


def discover_scenes(path, dcc=[], latest=False, sort=None, as_dict=False):
    from ignite.server.entities.scene import Scene

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
        scenes = sort_results(scenes, sort)
    return scenes


def get_assetversion(path):
    entity = find(path)
    if not entity:
        return
    return entity.as_dict()


def copy_default_scene(task, dcc):
    task = find(task)
    if not task or not task.dir_kind == "task":
        LOGGER.error(f"Invalid task {task}")
        return
    filepath = IGNITE_DCC / "default_scenes/default_scenes.yaml"
    if not filepath.exists():
        LOGGER.error(f"Default scenes config {filepath} does not exist.")
        return
    with open(filepath, "r") as f:
        data = yaml.safe_load(f)
    if dcc not in data.keys():
        LOGGER.error(f"Default scenes config is empty {filepath}")
        return
    src = IGNITE_DCC / "default_scenes" / data[dcc]
    dest = task.get_next_scene()
    os.makedirs(dest)
    LOGGER.info(f"Copying default scene {src} to {dest}")
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
        LOGGER.error(f"Failed to register task at {path}")
        return
    task.set_task_type(task_type)
    return True


def register_scene(path):
    utils.create_anchor(path, "scene")
    return True


def register_asset(path):
    utils.create_anchor(path, "asset")
    av = find(path)
    if not av or not av.dir_kind == "asset":
        LOGGER.error(f"Failed to register asset at {path}")
        return
    return True


def register_assetversion(path):
    asset_path = PurePath(path).parent
    asset = find(asset_path)
    if not asset:
        LOGGER.warning(f"Asset anchor was missing (but created) when registering assetversion {path}")
        utils.create_anchor(asset_path, "asset")
    utils.create_anchor(path, "assetversion")
    av = find(path)
    if not av or not av.dir_kind == "assetversion":
        LOGGER.error(f"Failed to register assetversion at {path}")
        return
    return True


def set_repr(target, repr):
    target_entity = find(target)
    repr_entity = find(repr)
    if not target_entity:
        return
    if not repr_entity:
        target_entity.set_repr("")
        return True
    if repr_entity.dir_kind == "assetversion":
        repr_entity = find(repr_entity.asset)
    target_entity.set_repr(repr_entity.uri)
    return True


def set_repr_for_project(repr):
    repr_entity = find(repr)
    if not repr_entity:
        return False, None
    target_entity = find(CONFIG["root"] / repr_entity.project)
    if repr_entity.dir_kind == "assetversion":
        repr_entity = find(repr_entity.asset)
    target_entity.set_repr(repr_entity.uri)
    return True, target_entity.name


def set_repr_for_parent(repr):
    repr_entity = find(repr)
    if not repr_entity:
        return False, None
    target_entity = find(repr_entity.get_parent())
    if repr_entity.dir_kind == "assetversion":
        repr_entity = find(repr_entity.asset)
    target_entity.set_repr(repr_entity.uri)
    return True, target_entity.name


def get_repr(target):
    assets = discover_assets(target, single=True)
    if not assets:
        return ""
    asset = assets[0]
    return asset.uri


def get_repr_comp(target):
    anchors = list(ANCHORS.values())
    asset_anchor = ANCHORS["asset"]
    def search(path):
        for x in path.iterdir():
            if x.name == asset_anchor:
                return x
            if x.name not in anchors and x.name not in ("exports", "scenes"):
                continue
            if x.name in anchors:
                anchor = KINDS[x.name]
                with open(x, "r") as f:
                    config = yaml.safe_load(f) or {}
                their_repr = config.get("repr", "")
                if their_repr:
                    their_repr_path = Path(utils.uri_to_path(their_repr))
                    return search(their_repr_path)

    target_entity = find(target)
    if not target_entity:
        return {}
    if target_entity.dir_kind == "assetversion":
        return target_entity.get_thumbnail()
    if target_entity.dir_kind == "asset":
        best_av = target_entity.best_av
        if not best_av:
            return {}
        return best_av.get_thumbnail()
    target_repr = target_entity.repr
    path =  Path(utils.uri_to_path(target_repr))
    if not path.is_dir():
        LOGGER.error(f"Couldn't resolve {path}")
        return {}
    if path == target_entity.path:
        LOGGER.error(f"Infinite loop while fetching repr comp of {target_entity.path} - {target_entity.repr}")
        return {}
    repr_asset = search(path)
    if not repr_asset:
        return {}
    asset = find(repr_asset)
    if not asset:
        return {}
    best_av = asset.best_av
    if not best_av:
        return {}
    return best_av.get_thumbnail()


def delete_entity(path, entity_type):
    entity = find(path)
    if entity.dir_kind != entity_type:
        print(
            "Attempted to delete", entity.dir_kind,
            "but the entity was supposed to be", entity_type
        )
        return False
    if not hasattr(entity, "delete"):
        return False
    ok = entity.delete()
    return ok


def rename_entity(path, entity_type, new_name):
    entity = find(path)
    if entity.dir_kind != entity_type:
        print(
            "Attempted to rename", entity.dir_kind,
            "but the entity was supposed to be", entity_type
        )
        return False, "wrong entity type"
    # contents = get_contents(path)
    # if contents and entity_type != "project":
    #     return False, f"{entity_type} not empty"
    path = Path(path)
    path.rename(path.parent / new_name)
    return True, ""


def add_tags(path, tags):
    tags_processed = [tag.strip() for tag in tags.split(",")]
    entity = find(path)
    entity.add_tags(tags_processed)
    return True


def remove_tags(path, tags, all=False):
    tags_processed = [tag.strip() for tag in tags.split(",")]
    entity = find(path)
    entity.remove_tags(tags_processed, all=all)
    return True


def set_attributes(path, attributes):
    attributes_processed = {}
    for attrib in attributes:
        name = attrib.get("name")
        override = attrib.get("override")
        if not name or not override:
            continue
        attributes_processed[name] = override
    entity = find(path)
    entity.set_attributes(attributes_processed)
    return True


def get_rule_templates():
    path = Path(RULE_TEMPLATES_PATH)
    if not path.exists():
        return []
    with open(path, "r") as file:
        rule_templates = yaml.safe_load(file)
    return rule_templates or []


def add_rule_template(data, name):
    rule_templates = get_rule_templates()
    template = {
        "data": data,
        "name": name
    }
    rule_templates.append(template)
    return write_rule_templates(rule_templates)


def remove_rule_template(name):
    rule_templates = get_rule_templates()
    for i, rt in enumerate(rule_templates):
        if rt["name"] == name:
            rule_templates.pop(i)
            break
    return write_rule_templates(rule_templates)


def write_rule_templates(data):
    path = Path(RULE_TEMPLATES_PATH)
    with open(path, "w") as file:
        rule_templates = yaml.safe_dump(data, file)
    return rule_templates


def get_vault_asset_names():
    vault = CONFIG["vault"]
    asset_names = [a.name for a in vault.iterdir()]
    return asset_names


def vault_import(source, name):
    entity = find(source)
    if not entity:
        LOGGER.error(f"Source entity {source} was not found")
        return
    if entity.dir_kind != "assetversion":
        LOGGER.error(f"Source entity {source} is not an assetversion")
        return
    vault = CONFIG["vault"]
    vault_entity_path = vault / name
    vault_entity = find(vault_entity_path)
    if not vault_entity:
        register_asset(vault_entity_path)
        vault_entity = find(vault_entity_path)
    if vault_entity.dir_kind != "asset":
        LOGGER.error(f"Target entity {vault_entity_path} kind is {vault_entity.dir_kind}, expected asset")
        return
    dest = vault_entity.next_path
    shutil.copytree(source, dest)
    return True


def vault_export(source, task_path, name):
    source = Path(source)
    source_entity = find(source)
    if not source_entity:
        LOGGER.error(f"Source entity {source} was not found")
        return
    if source_entity.dir_kind != "assetversion":
        LOGGER.error(f"Source entity {source} is not an assetversion")
        return
    task = find(task_path)
    asset_path = task.exports / name
    if not asset_path.is_dir():
        register_asset(asset_path)
    dest = task.get_next_export(name)
    dest_asset = dest.parent
    if not dest_asset.is_dir() or not (dest_asset / ANCHORS["asset"]).is_file():
        source_asset_anchor = source.parent / ANCHORS["asset"]
        if source_asset_anchor.is_file():
            shutil.copy2(source_asset_anchor, dest_asset)
    shutil.copytree(source, dest)
    return True
