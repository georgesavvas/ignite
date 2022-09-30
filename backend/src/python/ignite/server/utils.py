import datetime
import os
import re
from inspect import getcallargs
from pathlib import Path, PurePath

import parse
import yaml
from ignite.server.constants import ANCHORS
from ignite.utils import get_logger

LOGGER = get_logger(__name__)
ENV = os.environ
IGNITE_ROOT = Path(ENV["IGNITE_ROOT"])
SERVER_CONFIG_PATH = os.environ["IGNITE_SERVER_USER_CONFIG_PATH"]

KINDS = {v: k for k, v in ANCHORS.items()}
URI_TEMPLATE = parse.compile("ign:{project}:{group}:{context}:{task}:{name}@{version}")
URI_TEMPLATE_UNVERSIONED = parse.compile("ign:{project}:{group}:{context}:{task}:{name}")


def get_config(formatted=True) -> dict:
    if not os.path.isfile(SERVER_CONFIG_PATH):
        raise Exception(f"Config file not found: {SERVER_CONFIG_PATH}")
    LOGGER.info(f"Reading config from {SERVER_CONFIG_PATH}...")    
    with open(SERVER_CONFIG_PATH, "r") as f:
        config = yaml.safe_load(f)
    paths = ("projects_root",)
    for p in paths:
        config[p] = os.path.abspath(config[p])
    root = PurePath(config["projects_root"])
    if formatted:
        return {
            "root": root,
            "server_address": config.get("server_address"),
            "vault": root / config["vault_name"]
        }
    return config


CONFIG = {}
CONFIG.update(get_config())
IGNITE_SERVER_ADDRESS = CONFIG.get("server_address")
ENV["IGNITE_SERVER_ADDRESS"] = IGNITE_SERVER_ADDRESS


def ensure_path(path):
    if not Path(path).is_dir():
        try:
            os.makedirs(path, exist_ok=True)
            return True
        except Exception as e:
            LOGGER.error(e)
            return False


ensure_path(CONFIG["root"])
ensure_path(CONFIG["vault"])


def set_projects_root(path):
    global CONFIG

    path = Path(path)
    if path.as_posix() == CONFIG["root"].as_posix():
        return True
    if path.is_file():
        return False
    ok = ensure_path(path)
    if not ok:
        return False

    config = get_config(False)
    config["projects_root"] = path
    with open(SERVER_CONFIG_PATH, "w") as f:
        yaml.safe_dump(config, f)

    CONFIG["projects_root"] = path
    return True


def ensure_directory(path: Path) -> int:
    path = Path(path)
    if path.is_file():
        LOGGER.warning(f"ensure_directory run but path was pointing to a file: {path}")
        return 1
    elif path.is_dir():
        return 1
    else:
        path.mkdir(parents=True, exist_ok=True)
        return 0


def validate_dirname(name, extra_chars=""):
    return re.match(f"^[a-zA-Z0-9_{extra_chars}]+$", name)


def get_nr(path):
    if not path:
        return PurePath()
    return PurePath(path).relative_to(CONFIG["root"]).as_posix()


def create_anchor(path, name):
    ensure_directory(path)
    anchor = ANCHORS.get(name)
    if not anchor:
        raise Exception(f"Invalid anchor name: {name}")
    full_path = Path(path) / anchor
    if not full_path.exists():
        data = {"creation_time": datetime.datetime.utcnow()}
        with open(full_path, "w+") as f:
            yaml.safe_dump(data, f)
        # full_path.touch()
    return full_path


def get_uri(path, version=None):
    if not path:
        return ""
    dir_kind = get_dir_kind(path)
    splt = PurePath(path).as_posix().split(
        CONFIG["root"].as_posix(), 1
    )[1].replace("/exports", "").split("/")[1:]
    i = len(splt)
    project = splt[0]
    group = splt[1] if i > 1 else None
    context = task = name = version = None
    if dir_kind == "assetversion":
        context = "/".join(splt[2:-3])
        task = splt[-3]
        name = splt[-2]
        version = splt[-1]
    elif dir_kind == "asset":
        context = "/".join(splt[2:-2])
        task = splt[-2]
        name = splt[-1]
    elif dir_kind.startswith("task"):
        context = "/".join(splt[2:-1])
        task = splt[-1]
    else:
        context = "/".join(splt[2:])

    bits = [project, group, context, task, name, version]
    uri = "ign"
    for bit in bits:
        if bit:
            uri += f":{bit}"
    # uri = f"ign:{project}:{group}:{context}:{task}:{name}"
    if version:
        uri += f"@{version}"
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
    root = CONFIG["root"].as_posix()
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


def get_dir_kind(path):
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


def uri_to_path(uri):
    uri = str(uri)
    result = URI_TEMPLATE.parse(uri)
    if not result:
        result = URI_TEMPLATE_UNVERSIONED.parse(uri)
    if not result:
        amount = uri.count(":")
        pattern_split = "ign:{project}:{group}:{context}:{task}".split(":")
        pattern = ":".join(pattern_split[:amount + 1])
        result = parse.parse(pattern, uri)
    if not result:
        LOGGER.error(f"Failed to parse {uri}")
        return ""
    data = result.named
    if data.get("name"):
        data["task"] += "/exports"
    if data.get("version"):
        version = data.get("version")
        if version.startswith("v"):
            data["version"] = format_int_version(data["version"])
        else:
            del data["version"]
    path = CONFIG["root"]
    for step in ("project", "group", "context", "task", "name", "version"):
        if not data.get(step):
            return path
        path = path / data[step]
    return path


def query_filter(entities, query):
    filtered = []

    filter_string = query.get("filter_string", "").strip()
    if filter_string:
        for entity in entities:
            s = str(entity.values())
            if filter_string in s:
                filtered.append(entity)

    if not filter_string:
        return entities

    return filtered
