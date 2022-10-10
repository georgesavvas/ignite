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


import glob
import os
import shutil
from fnmatch import fnmatch
from pathlib import Path, PurePath
from pprint import pprint
from string import Formatter

import parse
from ignite.client import utils
from ignite.client.utils import TASK_MANAGER, CONFIG, server_request

from ..utils import get_logger

LOGGER = get_logger(__name__)
ENV = os.environ
DCC = Path(ENV["IGNITE_DCC"])


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
            pattern = f"*{rule['file_target']}*"
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

    # fields = ("task", "name", "comp")
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
            assets[name] = {"task": "", "name": name, "comps": [], "rules": result["rules"]}

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
            "source": result["file"].as_posix()
        }
        assets[name]["comps"].append(comp)
        assets[name]["rules"] += result["rules"]

    assets = list(assets.values())
    for i, asset in enumerate(assets):
        rules = set(asset["rules"])
        connections["rules_assets"] += [[rule, i] for rule in rules]
        del asset["rules"]

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
    if not name or not data.get("task"):
        print("Missing comp name or task")
        return
    comps = data.get("comps")
    if not comps or not len(comps):
        print("Missing comps")
        return
    task = Path(data["task"])
    asset = task / "exports" / name
    asset_dict = None
    if asset.exists():
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
    resp = utils.server_request(
        "register_assetversion", {"path": new_version_path.as_posix()}
    )
    if not resp.get("ok"):
        print("Failed.")
        return


def get_actions():
    return utils.discover_actions()


def run_action(entity, kind, action, session_id):
    actions = utils.discover_actions().get(kind)
    if not actions:
        LOGGER.error(f"Couldn't find action {kind} {action}")
        print("Available are:")
        pprint(actions)
        return
    for _action in actions:
        if _action["label"] != action:
            continue
        TASK_MANAGER.create_task(
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


def edit_task(task_id, edit):
    if edit == "pause":
        TASK_MANAGER.pause(task_id)
    elif edit == "unpause":
        TASK_MANAGER.unpause(task_id)
    elif edit == "retry":
        TASK_MANAGER.retry(task_id)
    elif edit == "clear":
        TASK_MANAGER.clear(task_id)
    elif edit == "kill":
        TASK_MANAGER.kill(task_id)


def get_tasks(session_id):
    data = TASK_MANAGER.report(session_id)
    return data


def is_local_server_running():
    address = CONFIG["server_details"].get("address")
    if not address:
        return True
    if not address.startswith("localhost") and not address.startswith("127.0.0.1"):
        return True
    resp = server_request("ping")
    return resp != None
