from inspect import getcallargs
import os
import yaml
import logging
import re
import parse
from pathlib import Path, PurePath
from huey import SqliteHuey
from ignite_server.constants import ANCHORS


ENV = os.environ
IGNITE_ROOT = Path(ENV["IGNITE_ROOT"])

URI_TEMPLATE = parse.compile("ign:{project}:{group}:{context}:{task}:{name}@{version}")
URI_TEMPLATE_UNVERSIONED = parse.compile("ign:{project}:{group}:{context}:{task}:{name}")


HUEY = SqliteHuey(filename=IGNITE_ROOT / "common/ignite.db")


def get_huey():
    return HUEY


def get_config() -> dict:
    path = os.environ["IGNITE_SERVER_CONFIG_PATH"]
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
    full_path = Path(path) / anchor
    if not full_path.exists():
        full_path.touch()
    return full_path


def get_uri(path, version=None):
    splt = PurePath(path).as_posix().split(ROOT.as_posix(), 1)[1].replace("/exports", "").split("/")[1:]
    project = splt[0]
    group = splt[1]
    context = "/".join(splt[2:-2])
    task = splt[-2]
    name = splt[-1]
    uri = f"ign:{project}:{group}:{context}:{task}:{name}"
    if version:
        uri += "@" + str(version)
    return uri


def is_uri(s):
    s = str(s)
    if not s.startswith("ign:"):
        return False
    # if not s.count(":") > 4:
    #     return False
    return True


def format_int_version(s):
    s = str(s)
    return f"v{s.zfill(3)}"


def get_dir_type(path, dir_type):
    root = ROOT.as_posix()
    anchor = ANCHORS[dir_type]
    path = Path(path)
    parent = path
    iter = 1
    while root in parent.as_posix():
        contents = [c.name for c in parent.iterdir()]
        if anchor in contents:
            return parent
        parent = parent.parent
        iter +=1
        if iter > 20:
            raise Exception(f"Reached iteration limit when walking directory: {path}")
    return ""


def uri_to_path(uri):
    uri = str(uri)
    result = URI_TEMPLATE.parse(uri)
    if not result:
        result = URI_TEMPLATE_UNVERSIONED.parse(uri)
    if not result:
        logging.error(f"Failed to parse {uri}")
        return ""
    data = result.named
    data["task"] += "/exports"
    if data.get("version"):
        version = data.get("version")
        if version.startswith("v"):
            data["version"] = format_int_version(data["version"])
        else:
            del data["version"]
    path = ROOT
    for step in ("project", "group", "context", "task", "name", "version"):
        if not data.get(step):
            return path
        path = path / data[step]
    return path


def get_api_path(path):
    path = PurePath(path).as_posix()
    return path.replace(ROOT.as_posix(), "")


def query_filter(entities, query):
    filtered = []

    filter_string = query.get("filter_string")
    if filter_string:
        for entity in entities:
            s = str(entity.get("path", ""))
            if filter_string in s:
                filtered.append(entity)

    if not filter_string:
        return entities

    return filtered

