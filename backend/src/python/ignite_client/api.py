import os
import logging
import platform
import yaml
import subprocess
import requests
import parse
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
        print("No dirs.")
        return []
    file_data = ingest_get_files(dirs)
    files = file_data["files"]
    files_posix = file_data["posix"]
    files_trimmed = file_data["trimmed"]
    rules = data.get("rules", [])
    results = [
        {
            "trimmed": files_trimmed[i],
            "file": files[i],
            "extract_info": {},
            "replace_values": {},
            "set_values": {}
        }
        for i, f in enumerate(files_trimmed)
    ]
    for result in results:
        file = result["file"]
        trimmed = result["trimmed"]
        filepath = str(file)
        directory = str(file.parent)
        filename = file.name
        for rule in rules:
            file_target = filepath
            if rule["file_target_type"] == "directory":
                file_target = directory
            elif rule["file_target_type"] == "filename":
                file_target = filename
            pattern = f"*{rule['file_target']}*"
            if not fnmatch(file_target, pattern):
                continue
            rule_type = rule["rule_type"]
            if rule_type == "extract_info":
                rule_value = rule["rule_value"]
                rule_target = trimmed
                if rule["rule_target"] == "directory":
                    expr_target = trimmed.rstrip(filename)
                elif rule["rule_target"] == "filename":
                    expr_target = filename
                result["pattern"] = rule_value
                parsed = parse.parse(rule_value, expr_target)
                if not parsed:
                    continue
                result["extract_info"] = parsed.named
            elif rule_type == "replace_value":
                result["replace_values"][rule["rule_target"]] = rule["rule_value"]
            elif rule_type == "set_value":
                result["set_value"][rule["rule_target"]] = rule["rule_value"]

    fields = ("name", "comp")
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
            assets[name] = {"name": name, "comps": []}
        comp_name = extracted_fields.get("comp", "")
        comp_name = replace_values(comp_name, _replace_values)
        comp = {
            "name": comp_name,
            "file": result["file"].as_posix().split("/")[-1]
        }
        assets[name]["comps"].append(comp)

    assets = [assets[k] for k in list(assets.keys())]
    if dry:
        return assets


def ingest_get_files(dirs):
    def trim_filepaths(files):
        parts = files[0].lstrip("/").split("/")
        for i, part in enumerate(parts):
            for file in files:
                if f"/{part}/" not in file:
                    break
        common = "/" + "/".join(parts[:i - 1]) + "/"
        return [f.replace(common, "") for f in files]

    files = []
    for dir in dirs.split("\n"):
        if not dir:
            continue
        if len(dir) < 4:
            continue
        path = Path(dir)
        if path.is_dir():
            files += list(path.glob("**/*"))
        else:
            files.append(path)
    if not files:
        return []
    files_posix = [f.as_posix() for f in files]
    files_trimmed = trim_filepaths(files_posix)
    files_trimmed = list(set(files_trimmed))
    data = {
        "files": files,
        "posix": files_posix,
        "trimmed": files_trimmed
    }
    return data
