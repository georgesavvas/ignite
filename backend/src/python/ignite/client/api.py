# Copyright 2022 George Savvas

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     https://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


from genericpath import exists
import re
import os
import glob
import tempfile
import yaml
import shutil
from fnmatch import fnmatch
from pathlib import Path, PurePath
from pprint import pprint
from string import Formatter

import parse
from ignite.server import api as server_api
from ignite.client import utils
from ignite.client.utils import PROCESS_MANAGER, is_server_local

from ignite.logger import get_logger
from ignite.utils import copy_dir_or_files

LOGGER = get_logger(__name__)
ENV = os.environ
DCC = Path(ENV["IGNITE_DCC"])
USER_CONFIG_PATH = Path(ENV["IGNITE_USER_CONFIG_PATH"])


def validate_ingest_asset(asset):
    _w = re.compile("^\w+$", re.A)
    name = asset["name"]
    if not re.match(_w, name):
        return False
    for comp in asset["comps"]:
        if not re.match(_w, comp["name"]):
            return False
        if not re.match(_w, comp["file"]):
            return False


def ingest(data):
    dry = data.get("dry", True)
    dirs = data.get("dirs")
    if not dirs:
        return {}
    file_data = ingest_get_files(dirs)
    if not file_data:
        return {}
    files = file_data["files"]
    files_posix = file_data["posix"]
    files_trimmed = file_data["trimmed"]
    rules = data.get("rules", [])
    results = [
        {
            "trimmed": f,
            "file": files[i],
            "extract_info": {},
            "replace_values": {},
            "set_values": {},
            "index": i,
            "rules": []
        }
        for i, f in enumerate(files_trimmed)
    ]
    connections = {
        "rules_files": [],
        "rules_assets": []
    }
    for result in results:
        file = result["file"]
        trimmed = result["trimmed"]
        filepath = str(file)
        directory = str(file.parent)
        filename = file.name
        for i, rule in enumerate(rules):
            file_target = filepath
            if rule["file_target_type"] == "directory":
                file_target = directory
            elif rule["file_target_type"] == "filename":
                file_target = filename
            pattern = rule["file_target"]
            if "*" not in pattern:
                pattern = f"*{pattern}*"
            if not fnmatch(file_target, pattern):
                continue

            # Extract info
            rule_value = rule["rule"]
            expr_target = trimmed
            if "/" not in rule_value:
                expr_target = filename
            result["pattern"] = rule_value
            parsed = parse.parse(rule_value, expr_target)
            if parsed:
                result["extract_info"] = parsed.named
                result["rules"].append(i)

            # Replace values
            if rule["replace_target"]:
                result["replace_values"][rule["replace_target"]] = rule["replace_value"]
                result["rules"].append(i)

            # Set values
            for field in ("task", "name", "comp"):
                if not rule.get(field):
                    continue
                result["set_values"][field] = rule[field]
                result["rules"].append(i)

            connections["rules_files"].append([i, result["index"]])

    for result in results:
        extracted_fields = result["extract_info"]
        if not extracted_fields:
            continue
        pattern = result["pattern"]
        fields = [f[1] for f in Formatter().parse(pattern) if f[1]]
        fields = [field.split(".")[0] for field in fields]
        fields = set(fields)
        processed = {}
        for field in fields:
            if field in list(extracted_fields.keys()):
                processed[field] = extracted_fields[field]
                continue
            data_filtered = {k: v for k, v in extracted_fields.items() if field in k}
            if not data_filtered:
                # Field doesn't exist in rule value
                continue
            keys = list(data_filtered.keys())
            ordered = [key for key in sorted(keys, key=lambda x: int(x.split(".")[-1]))]
            value = ""
            for i in range(len(ordered) - 1):
                current_expr = "{" + ordered[i] + "}"
                next_expr = "{" + ordered[i + 1] + "}"
                split = pattern.split(current_expr)[1].split(next_expr)[0]
                value += data_filtered[ordered[i]] + split
            value += data_filtered[ordered[-1]]
            processed[field] = value
        result["extract_info"] = processed
        pprint(result)

    def format_values(s, d):
        for k, v in d.items():
            if k not in s:
                continue
            s = s.replace("{" + k + "}", v)
        return s

    def replace_values(value, replace_data):
        for k, v in replace_data.items():
            if k not in value:
                continue
            value = value.replace(k, v)
        return value

    assets = {}
    unmatched = []
    for result in results:
        extracted_fields = result["extract_info"]
        _set_values = result["set_values"]
        _replace_values = result["replace_values"]
        if not extracted_fields and not _set_values:
            unmatched.append(str(result["file"]))
            continue

        name = _set_values.get("name", "{name}")
        name = format_values(name, extracted_fields)
        name = replace_values(name, _replace_values)
        if not assets.get(name):
            assets[name] = {
                "task": "",
                "name": name,
                "comps": [],
                "rules": result["rules"]
            }

        task = _set_values.get("task", "")
        task = format_values(task, extracted_fields)
        task = replace_values(task, _replace_values)
        assets[name]["task"] = task

        comp_name = _set_values.get("comp", "")
        comp_name = format_values(comp_name, extracted_fields)
        comp_name = replace_values(comp_name, _replace_values)
        comp = {
            "name": comp_name,
            "file": result["file"].as_posix().split("/")[-1],
            "source": result["file"].as_posix(),
            "trimmed": result["trimmed"]
        }
        assets[name]["comps"].append(comp)
        assets[name]["rules"] += result["rules"]

    assets = list(assets.values())
    for i, asset in enumerate(assets):
        rules = set(asset["rules"])
        connections["rules_assets"] += [[rule, i] for rule in rules]
        del asset["rules"]
        asset["valid"] = validate_ingest_asset(asset)

    if dry:
        data = {
            "assets": assets,
            "connections": connections
        }
        return data
    
    for asset in assets:
        print("Ingesting ", asset)
        ingest_asset(asset)


def ingest_get_files(dirs):
    def trim_filepaths(files):
        file0 = files[0]
        windows_path = 0
        if not file0.startswith("/"):
            windows_path = 1
        parts = files[0].lstrip("/").split("/")
        for i, part in enumerate(parts):
            part += "/"
            if not windows_path or i > 0:
                part = "/" + part
            for file in files:
                if part not in file:
                    break
        common = ""
        if not windows_path:
            common = "/"
        common += "/".join(parts[:i - 1]) + "/"
        return [f.replace(common, "") for f in files]

    files = []
    for dir in dirs.split("\n"):
        if not dir:
            continue
        if len(dir) < 4:
            continue
        # path = Path(dir)
        # if path.is_dir():
        #     files += list(path.glob("**/*"))
        # else:
        #     files.append(path)
        if not "*" in dir and not "?" in dir:
            dir = str(PurePath(dir) / "*")
        files += [Path(file) for file in glob.glob(dir)]
    files = [file for file in files if file.is_file()]
    if not files:
        return []
    files = sorted(list(set(files)))
    files_posix = [f.as_posix() for f in files]
    files_trimmed = trim_filepaths(files_posix)
    data = {
        "files": files,
        "posix": files_posix,
        "trimmed": files_trimmed
    }
    return data


def ingest_asset(data):
    name = data.get("name")
    if not validate_ingest_asset(data):
        LOGGER.warning(f"Ignoring {name}, invalid asset.")
    comps = data.get("comps")
    task = Path(data["task"])
    asset = task / "exports" / name
    asset_dict = None
    if asset.exists():
        if is_server_local():
            entity = server_api.find(asset.as_posix())
            asset_dict = entity.as_dict() if hasattr(entity, "as_dict") else {}
        else:
            asset_dict = utils.server_request(
                "find", {"path": asset.as_posix()}
            ).get("data")
        if not asset_dict:
            LOGGER.error(f"Tried to create an asset at {asset} but couldn't, possibly directory exists already.")
            return
    if asset_dict:
        print("Ingesting on top of existing asset.")
        new_version_path = Path(asset_dict["next_path"])
    else:
        asset.mkdir()
        asset_path = asset.as_posix()
        if is_server_local():
            ok = server_api.register_asset(asset_path)
            if not ok:
                print("Failed.")
                return
        else:
            resp = utils.server_request("register_asset", {"path": asset_path})
            if not resp.get("ok"):
                print("Failed.")
                return
        new_version_path = asset / "v001"
    new_version_path.mkdir(parents=True)
    for comp in comps:
        comp_path = Path(comp.get("source"))
        comp_name = comp.get("name") or comp_path.stem
        dest = new_version_path / (comp_name + comp_path.suffix)
        print(f"Copying {comp_path} to {dest}")
        shutil.copyfile(comp_path, dest)
    if is_server_local():
        ok = server_api.register_assetversion(new_version_path.as_posix())
        if not ok:
            print("Failed.")
            return
    else:
        resp = utils.server_request(
            "register_assetversion", {"path": new_version_path.as_posix()}
        )
        if not resp.get("ok"):
            print("Failed.")
            return


def get_actions(project=None):
    return utils.discover_actions(project)


def run_action(entity, kind, action, session_id):
    actions = utils.discover_actions().get(kind)
    if not actions:
        LOGGER.error(f"Couldn't find action {kind} {action}")
        print("Available are:")
        pprint(actions)
        return
    for _action in actions.values():
        if _action["label"] != action:
            continue
        PROCESS_MANAGER.create_process(
            action=_action,
            entity=entity,
            session_id=session_id
        )
        break
    else:
        LOGGER.error(f"Couldn't find action {kind} {action}")
        print("Available are:")
        pprint(actions)
        return


def edit_process(process_id, edit):
    if edit == "pause":
        PROCESS_MANAGER.pause(process_id)
    elif edit == "unpause":
        PROCESS_MANAGER.unpause(process_id)
    elif edit == "retry":
        PROCESS_MANAGER.retry(process_id)
    elif edit == "clear":
        PROCESS_MANAGER.clear(process_id)
    elif edit == "kill":
        PROCESS_MANAGER.kill(process_id)


def get_processes(session_id):
    data = PROCESS_MANAGER.report(session_id)
    return data


def get_crates(crate_filter=[]):
    path = USER_CONFIG_PATH / "crates.yaml"
    if not path.is_file():
        return []
    with open(path, "r") as f:
        data = yaml.safe_load(f) or []
    crates = data
    if crate_filter:
        crates = list(filter(lambda c: c["id"] in crate_filter, crates))
    uris_entities = {}
    for crate in crates:
        for uri in crate.get("entities", []):
            uris_entities[uri] = ""
    if is_server_local():
        uris_entities = {k: server_api.find(k) for k in uris_entities.keys()}
        uris_entities = {
            k: entity.as_dict()
            for k, entity in uris_entities.items()
            if hasattr(entity, "as_dict")
        }
    else:
        uris_entities = utils.server_request(
            "find_multiple", {"data": data}
        ).get("data")
    for crate in crates:
        crate["entities"] = [
            uris_entities[uri] for uri in crate.get("entities", [])
        ]
    return crates


def set_crates(data):
    path = USER_CONFIG_PATH / "crates.yaml"
    with open(path, "w") as f:
        yaml.safe_dump(data, f)
    return True


def zip_entity(path, dest, session_id):
    if is_server_local():
        entity = server_api.find(path)
        entity = entity.as_dict() if hasattr(entity, "as_dict") else {}
    else:
        entity = utils.server_request("find", {"path": path}).get("data")
    if not entity:
        LOGGER.error(f"Failed to get entity with {path}")
        return
    entity["zip_dest"] = dest
    run_action(entity, "common", "zip", session_id)

def zip_crate(crate_id, dest, session_id):
    temp_dir = tempfile.gettempdir()
    crates = get_crates([crate_id])
    if not crates:
        LOGGER.error(f"Crate {crate_id} not found.")
        return
    crate = crates[0]
    entities = crate["entities"]
    if not entities:
        LOGGER.warning(f"Attempted to zip crate {crate_id} without entities.")
        return
    crate_dir = Path(temp_dir) / crate_id
    if crate_dir.exists():
        shutil.rmtree(crate_dir)
    crate_dir.mkdir(parents=True)
    for entity in entities:
        path = entity["path"]
        copy_dir_or_files(path, crate_dir)
    data = {
        "path": crate_dir.as_posix(),
        "zip_dest": dest
    }
    run_action(data, "common", "zip", session_id)
