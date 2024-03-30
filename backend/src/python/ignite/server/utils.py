# Copyright 2022 Georgios Savvas

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     https://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


import datetime
import os
import re
from pathlib import Path, PurePath

import parse
import yaml
from ignite.server.constants import ANCHORS
from ignite.logger import get_logger

LOGGER = get_logger(__name__)
ENV = os.environ
IGNITE_ROOT = Path(ENV["IGNITE_ROOT"])
SERVER_CONFIG_PATH = os.environ["IGNITE_SERVER_USER_CONFIG_PATH"]

KINDS = {v: k for k, v in ANCHORS.items()}
URI_TEMPLATE = parse.compile("ign:{project}:{group}:{context}:{task}:{name}@{version}")
URI_TEMPLATE_COMP = parse.compile(
    "ign:{project}:{group}:{context}:{task}:{name}@{version}#{comp}"
)
URI_TEMPLATE_UNVERSIONED = parse.compile(
    "ign:{project}:{group}:{context}:{task}:{name}"
)


def get_config(formatted=True) -> dict:
    if not os.path.isfile(SERVER_CONFIG_PATH):
        raise Exception(f"Config file not found: {SERVER_CONFIG_PATH}")
    LOGGER.info(f"Reading config from {SERVER_CONFIG_PATH}...")
    with open(SERVER_CONFIG_PATH, "r") as f:
        config = yaml.safe_load(f)
    paths = ("root",)
    for p in paths:
        config[p] = os.path.abspath(config[p])
    root = PurePath(config["root"])
    if formatted:
        return {
            "root": root,
            "server_address": config.get("server_address"),
            "vault": root / config["vault_name"],
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
    return True


ensure_path(CONFIG["root"])
ensure_path(CONFIG["vault"])


def set_projects_root(path):
    global CONFIG

    path = Path(path)
    if path.as_posix() == CONFIG["root"].as_posix():
        return True
    if path.is_file():
        LOGGER.error(f"New projects root {path} is pointing to a file...")
        return False
    ok = ensure_path(path)
    if not ok:
        LOGGER.error(f"Failed to create new projects root {path}")
        return False

    config = get_config(False)
    config["root"] = str(path)
    with open(SERVER_CONFIG_PATH, "w") as f:
        yaml.safe_dump(config, f)

    CONFIG["root"] = path
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
    return full_path


def create_delayed_anchor(path=None, name=None, anchor=None):
    if not anchor and (path and name):
        ensure_directory(path)
        anchor = Path(path) / ANCHORS.get(name)
    anchor = Path(anchor)
    if not anchor.exists():
        creation_time = anchor.parent.stat().st_ctime
        data = {"creation_time": datetime.datetime.fromtimestamp(creation_time)}
        with open(anchor, "w+") as f:
            yaml.safe_dump(data, f)


def get_uri(path, version_override=None):
    if not path:
        return ""
    path = Path(path)
    path_str = path.as_posix()
    if path.is_file() or "#" in path.name:
        entity_kind = "component"
    else:
        entity_kind = get_dir_kind(path)
    if not entity_kind:
        return ""
    splt = (
        path_str.split(CONFIG["root"].as_posix(), 1)[1]
        .replace("/exports", "")
        .split("/")
    )
    i = len(splt)
    project = splt[0]
    group = splt[1] if i > 1 else None
    context = task = name = version = comp = None
    if entity_kind == "assetversion":
        context = "/".join(splt[2:-3])
        task = splt[-3]
        name = splt[-2]
        version = splt[-1]
    elif entity_kind == "asset":
        context = "/".join(splt[2:-2])
        task = splt[-2]
        name = splt[-1]
    elif entity_kind.startswith("task"):
        context = "/".join(splt[2:-1])
        task = splt[-1]
    elif entity_kind == "scene":
        context = "/".join(splt[2:-3])
        task = splt[-3]
        name = "__scene__"
        version = splt[-1]
    elif entity_kind == "component" and splt[-2] == "preview":
        # Scene component, currently just used for previews.
        context = "/".join(splt[2:-5])
        task = splt[-5]
        name = splt[-2]
        version = splt[-3]
        comp = splt[-1]
    elif entity_kind == "component":
        context = "/".join(splt[2:-4])
        task = splt[-4]
        name = splt[-3]
        version = splt[-2]
        comp = splt[-1]
    else:
        context = "/".join(splt[2:])

    bits = [project, group, context, task, name]
    uri = "ign"
    for bit in bits:
        if bit:
            uri += f":{bit}"
    if version_override:
        if isinstance(version_override, str):
            version_override = int(version_override.replace("v", ""))
        uri += f"@{version_override}"
    elif version:
        if isinstance(version, str):
            version = int(version.replace("v", ""))
        uri += f"@{version}"
    if comp:
        uri += f"#{comp}"
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
    while root != parent.as_posix():
        contents = [c.name for c in parent.iterdir()]
        if anchor in contents:
            return parent
        parent = parent.parent
        iter += 1
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
    if "#" in uri:
        result = URI_TEMPLATE_COMP.parse(uri)
    else:
        result = URI_TEMPLATE.parse(uri)
    if not result:
        result = URI_TEMPLATE_UNVERSIONED.parse(uri)
    if not result:
        amount = uri.count(":")
        pattern_split = "ign:{project}:{group}:{context}:{task}".split(":")
        pattern = ":".join(pattern_split[: amount + 1])
        result = parse.parse(pattern, uri)
    if not result:
        LOGGER.error(f"Failed to parse {uri}")
        return ""
    data = result.named
    name = data.get("name")
    if name and name != "__scene__":
        data["task"] += "/exports"
    elif name:
        data["name"] = "scenes"
    if data.get("version"):
        version = data.get("version")
        if not version.startswith("v"):
            data["version"] = format_int_version(data["version"])
    if data.get("comp"):
        data["comp"] = data["comp"].replace("#", "")
    path = CONFIG["root"]
    parts = ["project", "group", "context", "task", "name", "version", "comp"]
    for part in parts:
        if not data.get(part):
            return path
        path = path / data[part]
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


def is_dir_of_kind(path, kind):
    path = Path(path)
    anchor = ANCHORS[kind]
    return (path / anchor).is_file()


def get_directories(path):
    # if hasattr(path, "__iter__"):
    #     return [Path(entry.path) for entry in path if entry.is_dir()]
    return [Path(entry.path) for entry in os.scandir(path) if entry.is_dir()]
