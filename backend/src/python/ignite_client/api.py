import os
import logging
import platform
import yaml
import subprocess
import requests
import parse
import glob
from fnmatch import fnmatch
from pathlib import PurePath, Path
from pprint import pprint
from ignite_client.constants import GENERIC_ENV, DCC_ENVS, OS_NAMES


ENV = os.environ
IGNITE_DCC = Path(os.environ["IGNITE_DCC"])
CONFIG_PATH = Path(Path.home(), ".ignite")
if not CONFIG_PATH.exists():
    CONFIG_PATH.mkdir()
IGNITE_SERVER_HOST = ENV["IGNITE_SERVER_HOST"]
IGNITE_SERVER_PORT = ENV["IGNITE_SERVER_PORT"]


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
                if not rule[field]:
                    continue
                result["set_values"][field] = rule[field]
                result["rules"].append(i)

            connections["rules_files"].append([i, result["index"]])

    fields = ("task", "name", "comp")
    for result in results:
        extracted_fields = result["extract_info"]
        if not extracted_fields:
            continue
        pattern = result["pattern"]
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
        if not extracted_fields and not _set_values.get("name"):
            unmatched.append(str(result["file"]))
            continue
        name = replace_values(extracted_fields.get("name", ""), result["replace_values"])
        if _set_values.get("name"):
            name = _set_values["name"]
        if not assets.get(name):
            assets[name] = {"task": "", "name": name, "comps": [], "rules": result["rules"]}
        if _set_values.get("task"):
            assets[name]["task"] = _set_values["task"]
        comp_name = extracted_fields.get("comp", "")
        if _set_values.get("comp"):
            comp_name = _set_values["comp"]
        comp_name = replace_values(comp_name, _replace_values)
        comp = {
            "name": comp_name,
            "file": result["file"].as_posix().split("/")[-1]
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
