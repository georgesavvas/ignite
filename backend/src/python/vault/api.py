from __future__ import division, unicode_literals
import os
from fnmatch import fnmatch
from string import Formatter
import parse
import re
import logging
import yaml
import glob
import shutil
import time
import json
from pathlib import Path, PurePath
from pprint import pprint

from asset_library.models.asset import Asset
from asset_library.models.render import Render
from asset_library.log_formatter import LogFormatter
from asset_library.tools import load_assetlib_config, get_assets_collection, get_logger, hex_to_rgb

LOGGER = get_logger(__name__)

LIB_CONFIG = load_assetlib_config()
LIB_PATH = LIB_CONFIG["library_path"]
LIB_TMP = LIB_CONFIG["tmp"].format(library_path=LIB_PATH)
LIB_PUBLIC = LIB_CONFIG["public"].format(library_path=LIB_PATH)
LIB_STORE = LIB_CONFIG["store"].format(library_path=LIB_PATH)
LIB_COMMON = LIB_CONFIG["common"].format(library_path=LIB_PATH)
LIB_STUDIO_COLLECTIONS = LIB_CONFIG["studio_collections_dir"].format(common=LIB_COMMON)
LIB_USER_COLLECTIONS = LIB_CONFIG["user_collections_dir"].format(common=LIB_COMMON, user="{user}")
LIB_RULE_TEMPLATES = LIB_CONFIG["rule_templates_dir"].format(common=LIB_COMMON)
LIB_FILTERS = LIB_CONFIG["filters_dir"].format(common=LIB_COMMON)


def _get_asset(*args, **kwargs):
    """Get a single existing asset.

    Args:
        name (str, optional):  The name of the asset.
        id (str, optional): The id of the asset.

    Returns:
        [asset]: An Asset object.
    """
    if not os.path.isdir(LIB_PATH):
        LOGGER.error("Invalid library path.")
        return

    _args = dict(enumerate(args))

    asset_name = kwargs.get("name") or _args.get(0)
    asset_id = kwargs.get("id") or _args.get(0)

    if asset_name:
        asset_names = os.listdir(LIB_PUBLIC)
        if asset_name in asset_names:
            asset = Asset(path=os.path.join(LIB_PUBLIC, asset_name))
            return asset

    if asset_id:
        asset_ids = os.listdir(LIB_STORE)
        if asset_id not in asset_ids:
            return
        asset = Asset(path=os.path.join(LIB_STORE, asset_id))
        return asset


def get_asset(*args, **kwargs):
    """Get a single existing asset from the database as a dict.

    Args:
        name (str, optional):  The name of the asset.
        id (str, optional): The id of the asset.

    Returns:
        [dict]: An asset represented as a dict.
    """
    collection = get_assets_collection()

    if args and (not kwargs.get("name") and not kwargs.get("id")):
        kwargs["id"] = args[0]

    result = collection.find_one(kwargs, {'_id': False})
    if not result:
        return None
    return result


def _get_assets(name, case_sensitive=False):
    """Get multiple existing assets that match the query.

    Args:
        name (str): Asset name substring match.
        case_sensitive (bool, optional): Whether to do a case sensitive search. Defaults to False.

    Yields:
        [asset]: An asset object.
    """
    if not os.path.isdir(LIB_PATH):
        LOGGER.error("Invalid library path.")
        return

    if not name:
        return

    asset_names = os.listdir(LIB_PUBLIC)
    for asset_name in asset_names:
        check_key = name if case_sensitive else name.lower()
        check_asset_name = asset_name if case_sensitive else asset_name.lower()
        if check_key in check_asset_name:
            asset = Asset(path=os.path.join(LIB_PUBLIC, asset_name))
            yield asset


def _assets_from_collection():
    asset_list = []
    for collection in collections:
        cfilter = collection.cfilter
        if cfilter:
            expr = {}
            for k, v in cfilter.items():
                if v:
                    expr[k] = {"$regex": v, "$options": "i"}
            asset_list += list(self.mongo_coll.find(expr))

        indv_asset_ids = collection.assets
        if indv_asset_ids:
            indv_assets = [a for a in self.asset_list if a["id"] in indv_asset_ids]
            asset_list += indv_assets


def format_mongo_expr(expr):
    if not expr:
        return {}
    if isinstance(expr, list):
        return [format_mongo_expr(e) for e in expr]
    elif expr.get("condition"):
        condition = "$and" if expr.get("condition", "") == "and" else "$or"
        return {condition: format_mongo_expr(expr.get("filters", []))}
    else:
        field, value = list(expr.items())[0]
        if not field:
            field = "filter_string"
        if "." in field and "ARRAY" in field:
            first, second = field.split(".ARRAY.")
            return {first: {"$elemMatch": {second: {"$regex": value, "$options": "i"}}}}
        return {field: {"$regex": value, "$options": "i"}}


def sort_results(results, sort):
    if sort and results:
        keys = list(results[0].keys())
        field = sort["field"]
        reverse = sort.get("reverse", False)
        if field in keys:
            results.sort(key=lambda c: c[field], reverse=reverse)
    return results


def get_assets(*args, **kwargs):
    """Get multiple existing assets that match the query.

    Yields:
        [dict]: An asset represented as a dict.
    """
    collection = get_assets_collection()

    if args and not kwargs:
        kwargs["name"] = args[0]

    sort = {"field": "name", "reverse": False}
    if "sort" in kwargs:
        sort = kwargs.pop("sort")

    user = None
    if "user" in kwargs:
        user = kwargs.pop("user")

    collections = []
    if "collection" in kwargs:
        coll_path = kwargs.pop("collection")
        coll_scope, coll_name = coll_path.split(":")
        collections = get_nested_collections(coll_name, coll_scope, user)

    expr_filter = {}
    if "expression" in kwargs:
        expr_data = kwargs.pop("expression")
        expr_filter = format_mongo_expr(expr_data)
    
    colours = []
    if "palette" in kwargs:
        palette = kwargs.pop("palette")
        # for colour in palette:
        #     rgb = hex_to_rgb(colour["hex"])
        #     colours.append(rgb)

    # print("sort:", sort)
    # print("collections:", collections)
    # print("colours:", colours)

    results = []
    has_filter = False
    expr_base = {}
    if expr_filter:
        expr_base = expr_filter
        has_filter = True

    for k, v in kwargs.items():
        if v:
            expr_base[k] = {"$regex": v, "$options": "i"}
            has_filter = True

    if collections:
        coll_expr = {"$or": [format_mongo_expr(c["expression"]) for c in collections if c.get("expression")] or [{"id": "__"}]}
        expr = {
            "$and": [expr_base, coll_expr]
        }
        # print("Complex expression:")
        # pprint(expr)
        results += list(collection.find(expr, {'_id': False}))
    else:
        # print("Simple expression:")
        # pprint(expr_base)
        results += list(collection.find(expr_base, {'_id': False}))

    results = list({r["name"]:r for r in results}.values())
    results = sort_results(results, sort)
    return results


def get_nested_collections(path, scope=None, user=None):
    def walk_tree(path, nodes, filtered):
        for node in nodes:
            if node["path"].startswith(path):
                filtered.append(node)
            if node.get("children"):
                walk_tree(path, node["children"], filtered)

    collections = get_collections(user, scope)[scope]
    filtered = []
    walk_tree(path, collections, filtered)
    return filtered


def inject_projects_collection(collections):

    def get_project_coll(proj_name):
        return {
            "name": proj_name,
            "assets": [],
            "expression": {"project": proj_name}
        }

    collection = get_assets_collection()
    projects = collection.find().distinct("project")
    coll = {
        "name": "Projects",
        "assets": [],
        "expression": {},
        "children": [get_project_coll(proj) for proj in projects if proj]
    }

    for c in collections:
        if c["name"] == "All":
            all = c
    for i, gcoll in enumerate(all["children"]):
        if gcoll["name"].lower() == "projects":
            all["children"][i] = coll
            break
    else:
        all["children"].append(coll)
    return collections


def inject_2d_elements_collection(collections):

    def get_coll(name, path):
        return {
            "name": name,
            "assets": [],
            "expression": {"tags": path}
        }

    def get_template():
        return {"name": "", "assets": [], "expression": {}, "children": []}

    collection = get_assets_collection()
    tags = collection.find({"tags": {"$regex": "2d_assetlib", "$options": "i"}}).distinct("tags")
    tags = ",".join(tags)
    tags = tags.split(",")
    prefix = "/asset_library/2d"
    tags = [t for t in tags if t.startswith(prefix)]
    coll = {
        "name": "Elements",
        "assets": [],
        "expression": {},
        "children": []
    }
    while tags:
        tag = tags.pop()
        tag = tag.strip()
        tag = tag.replace("/asset_library/2d/elements", "").strip("/")
        tag_split = tag.split("/")[:-1]
        current = coll
        for i, d in enumerate(tag_split):
            for child in current["children"]:
                if child["name"] == d:
                    current = child
                    break
            else:
                parent = get_template()
                parent["name"] = d
                current["children"].append(parent)
                current = parent
        if not current:
            print(f"ERROR building {tag}")
            continue
        orig_path = os.path.join("/asset_library/2d/elements", *tag_split[:i + 1])
        current["expression"] = {"tags": orig_path}
    for c in collections:
        if c["name"] == "All":
            all = c

    exists = False
    for gcoll in all["children"]:
        if gcoll["name"] == "2D":
            exists = True
            for i, child2 in enumerate(gcoll.get("children", [])):
                if child2["name"] == "Elements":
                    gcoll["children"][i] = coll
                    break
            else:
                gcoll["children"] = [coll]

    if not exists:
        all["children"].append({
            "name": "2D",
            "expression": {},
            "children": [coll]
        })
    return collections


def get_collections(user=None, scope=None):

    def sort_children(node):
        if not node.get("children"):
            return
        node["children"].sort(key=lambda x: x["name"])
        for child in node["children"]:
            sort_children(child)

    data = {}
    if scope in ("all", "studio"):
        data["studio"] = LIB_STUDIO_COLLECTIONS
    if scope in ("all", "user") and user:
        data["user"] = LIB_USER_COLLECTIONS.format(user=user)

    collections_all = {}
    for name, path in data.items():
        path = Path(path)
        if not path.exists():
            continue
        with open(path, "r") as file:
            collections = yaml.safe_load(file)

        collections = collections or []
        if scope == "studio":
            collections = collections or [{"name": "All", "expression": {"id": ""}, "children": []}]
            collections = inject_projects_collection(collections)
            collections = inject_2d_elements_collection(collections)
        collections.sort(key=lambda x: x["name"])
        for coll in collections:
            sort_children(coll)
        collections = prep_collections(collections)
        collections_all[name] = collections

    return collections_all


def create_collection(data):
    scope = data.get("scope")
    user = data.get("user")
    collections = get_collections(user, scope)[scope]
    new = {
        "name": data["name"],
        "expression": {"condition": "and", "filters": [{ "": "" }, { "": "" }]}
    }

    parents = data["path"].split("/")[1:]

    if data["path"] == "/":
        collections.append(new)
        return write_collections(collections, scope, user)

    current = None
    for coll in collections:
        if coll["name_safe"] == parents[0]:
            current = coll
    for parent in parents[1:]:
        for child in current.get("children", []):
            if child["name_safe"] == parent:
                current = child
                break
        else:
            t = {"name": parent}
            if current.get("children"):
                current["children"].append()
            else:
                current["children"] = [t]
            current = t
    if not current.get("children"):
        current["children"] = [new]
    else:
        current["children"].append(new)
    return write_collections(collections, scope, user)


def reorder_collection(data):
    source = data.get("source")
    target = data.get("target")
    offset = data.get("offset")
    scope = data.get("scope")
    user = data.get("user")

    if source == target and offset == 0:
        return False

    def get_coll_index(coll, name):
        for i, c in enumerate(coll["children"]):
            if c["name_safe"] == name:
                return i

    def get_coll(coll, name):
        for c in coll["children"]:
            if c["name_safe"] == name:
                return c

    collections = get_collections(user, scope)[scope]

    source_parents = source[1:].split("/")
    source_name = source_parents.pop(-1)

    target_parents = target[1:].split("/")
    target_name = target_parents.pop(-1)

    processed = {"children": collections}

    source_coll = processed
    for source_parent in source_parents:
        source_coll = get_coll(source_coll, source_parent)
    try:
        source_index = get_coll_index(source_coll, source_name)
    except ValueError:
        logging(f"Couldn't find collection {source_name} in {source}")
        return False

    target_coll = processed
    for target_parent in target_parents:
        target_coll = get_coll(target_coll, target_parent)
    try:
        target_index = get_coll_index(target_coll, target_name)
    except ValueError:
        logging(f"Couldn't find collection {target_name} in {target}")
        return False

    sc = source_coll
    tc = target_coll

    if offset == 0:
        coll = sc["children"][source_index]
        if not tc["children"][target_index].get("children"):
            tc["children"][target_index]["children"] = [coll]
        else:
            tc["children"][target_index]["children"].append(coll)
        sc["children"].pop(source_index)
    elif source_coll == target_coll:
        sc["children"][source_index], sc["children"][target_index] = sc["children"][target_index], sc["children"][source_index]
    else:
        tc["children"].insert(target_index + offset, sc["children"].pop(source_index))

    write_collections(processed["children"], scope, user)
    return True


def delete_collection(data):
    scope = data.get("scope")
    user = data.get("user")
    collections = get_collections(user, scope)[scope]
    parents = data["path"].split("/")[1:]
    target = parents.pop(-1)

    if not parents:
        for i, child in enumerate(collections):
            if child["name_safe"] == target:
                collections.pop(i)
        return write_collections(collections, scope, user)

    current = None
    for coll in collections:
        if coll["name_safe"] == parents[0]:
            current = coll
    for parent in parents[1:-1]:
        for child in current.get("children", []):
            if child["name_safe"] == parent:
                current = child
                break
        else:
            print(f"Error finding collection at {parents}")
            return

    for i, child in enumerate(current["children"]):
        if child["name_safe"] == target:
            current["children"].pop(i)
    return write_collections(collections, scope, user)


def rename_collection(data):
    scope = data.get("scope")
    user = data.get("user")
    collections = get_collections(user, scope)[scope]
    parents = data["path"].split("/")[1:]

    current = None
    for coll in collections:
        if coll["name_safe"] == parents[0]:
            current = coll
    for parent in parents[1:]:
        for child in current.get("children", []):
            if child["name_safe"] == parent:
                current = child
                break
        else:
            print(f"Error finding collection at {parents}")
            return
    current["name"] = data["name"]
    return write_collections(collections, scope, user)


def edit_collection(data):
    scope = data.get("scope")
    user = data.get("user")
    collections = get_collections(user, scope)[scope]
    parents = data["path"].split("/")[1:]

    current = None
    for coll in collections:
        if coll["name_safe"] == parents[0]:
            current = coll
    for parent in parents[1:]:
        for child in current.get("children", []):
            if child["name_safe"] == parent:
                current = child
                break
        else:
            print(f"Error finding collection at {parents}")
            return
    current["expression"] = data["expression"]
    return write_collections(collections, scope, user)


def prep_collections(collections):

    def get_safe_name(s):
        return re.sub("[^0-9a-zA-Z]+", "_", s).lower()

    def create_paths(node, prepend):
        name_safe = get_safe_name(node["name"])
        node["name_safe"] = name_safe
        node["path"] = prepend + "/" + name_safe
        if not node.get("children"):
            return
        for child in node["children"]:
            create_paths(child, node["path"])

    def get_filter_strings(node, prepend):
        node["filter_strings"] = set(prepend)
        node["filter_strings"].add(node["name"].lower())
        if not node.get("children"):
            return {node["name"].lower()}
        child_strings = set()
        for child in node["children"]:
            child_strings.update(get_filter_strings(child, set(node["filter_strings"])))
        node["filter_strings"].update(child_strings)
        return set(node["filter_strings"])

    for coll in collections:
        create_paths(coll, "")
        get_filter_strings(coll, set())
    
    return collections


def write_collections(data, scope=None, user=None):
    path = LIB_STUDIO_COLLECTIONS
    if scope == "user" and user:
        path = LIB_USER_COLLECTIONS.format(user=user)
    path = Path(path)
    if not path.parent.is_dir():
        path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as file:
        collections = yaml.safe_dump(data, file)
    return collections


def get_filter_templates():
    path = Path(LIB_FILTERS)
    if not path.exists():
        return []
    with open(path, "r") as file:
        filters = yaml.safe_load(file)
    return filters or []


def add_filter_template(data, name):
    filters = get_filter_templates()
    for filter_data in filters:
        if filter_data["name"] == name:
            filter_data["data"] = data
            break
    else:
        filter_ = {
            "data": data,
            "name": name
        }
        filters.append(filter_)
    return write_filters(filters)


def remove_filter_template(name):
    filters = get_filter_templates()
    for i, rt in enumerate(filters):
        if rt["name"] == name:
            filters.pop(i)
            break
    return write_filters(filters)


def write_filters(data):
    path = Path(LIB_FILTERS)
    with open(path, "w") as file:
        filters = yaml.safe_dump(data, file)
    return filters


def get_rule_templates():
    path = Path(LIB_RULE_TEMPLATES)
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
    path = Path(LIB_RULE_TEMPLATES)
    with open(path, "w") as file:
        rule_templates = yaml.safe_dump(data, file)
    return rule_templates


def new_asset(name=""):
    """Create a new asset from scratch.

    Args:
        name (str, optional): The name of the asset. This can be defined or changed later.

    Returns:
        [asset]: The created asset object.
    """
    return Asset(name=name)


def get_component_info(comp_path):
    parent = Path(comp_path).parent
    info_path = parent / "__info"
    print(info_path.exists())
    if not info_path.is_file():
        return
    return info_path.read_text()


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
            path = Path(dir)
            if path.is_file():
                files.append(path)
                continue
            else:
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
    asset_entity = None
    if asset.exists():
        asset_entity = utils.server_request(
            "find", {"query": asset.as_posix()}
        ).get("data")
        if not asset_entity:
            logging.error(f"Tried to create an asset at {asset} but couldn't, possibly directory exists already.")
            return
    if asset_entity:
        print("Ingesting on top of existing asset.")
        new_version_path = asset_entity.next_path()
    else:
        asset.mkdir()
        asset_path = asset.as_posix()
        resp = utils.server_request("register_asset", {"path": asset_path})
        if not resp.get("ok"):
            print("Failed.")
            return
        new_version_path = asset / "v001"
    new_version_path.mkdir()
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


def delete_asset(asset_id):
    asset = Asset(asset_id)
    if not asset:
        return False
    asset.delete()


def handle_websocket_action(websocket, action, data, close):
    import concurrent.futures
    import asyncio

    def progress_callback(msg):
        asyncio.run(websocket.send_json(msg))

    progress_callback({"status": "connecting", "progress": 100})
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        future_to_assets = {
            executor.submit(publish_asset, asset, progress_callback): asset for asset in data
        }
    finished, _ = concurrent.futures.wait(list(future_to_assets.keys()))
    for future in finished:
        future.result()
    close()


def publish_asset(data, progress_callback=None):

    def process_value(value, preffix):
        return value.replace(preffix, "").lower()

    def report_progress(status, progress, msg=""):
        if not progress_callback:
            return
        time.sleep(1)
        progress_callback({
            "status": status,
            "progress": progress,
            "msg": msg
        })

    def process_asset_details(asset, data):
        name_matches = data["name"] == asset.get_name()
        description_matches = data.get("description", "") == asset.get_description()
        tags_match = data.get("tags", "") == asset.get_tags()
        if not name_matches:
            asset.set_name(data["name"])
        if not description_matches:
            asset.set_description(data["description"])
        if not tags_match:
            asset.set_tags(data["tags"])

    def process_components(asset, data):
        report_progress("components", 0)
        comps_match = data["components"] == asset.get_components()
        if not comps_match:
            clean_comps = []
            for comp in data["components"]:
                clean_comps.append({"name": comp["name"], "file": comp["file"]})
            asset.set_components(clean_comps)
    
    def process_previews(asset, data):
        
        report_progress("previews", 0, "Checking previous previews")
        for index, preview in reversed(list(enumerate(data["media"]["renders"]))):
            # if preview.get("newIndex"):
            #     asset.swap_renders()
            if preview.get("delete"):
                asset.remove_media(index, cache=False)

        if data.get("new_previews"):
            previews = data["new_previews"]
            amount = len(previews)
            report_progress("previews", 0, "Adding new previews")
            for index, preview in enumerate(previews):
                render = Render(asset)
                render.set_type(preview["type"])
                preview_keys = list(preview.keys())
                preffix = "option__"
                if "geo_comp" in preview_keys:
                    value = preview["geo_comp"]
                    if value.startswith(preffix):
                        value = process_value(value, preffix)
                        render.modify_config({"geo_path": value})
                    else:
                        render.set_geo_comp(preview["geo_comp"])
                if "shd_comp" in preview_keys:
                    value = preview["shd_comp"]
                    if value.startswith(preffix):
                        value = process_value(value, preffix)
                        render.modify_config({"shd_path": value})
                    else:
                        render.set_shd_comp(preview["shd_comp"])
                if "hdri_comp" in preview_keys:
                    render.set_hdri_comp(preview["hdri_comp"])
                progress_start = 100 / amount * index
                progress_end = 100 / amount * (index + 1)
                print("SUBMITING RENDER", render)
                render.launch(
                    progress_fn=lambda progress: report_progress(
                        "previews", progress[1], progress[0]
                    ),
                    progress_range=(progress_start, progress_end)
                )

    report_progress("asset_details", 0)
    asset_id = data.get("id")
    if asset_id:
        asset = Asset(asset_id)
    else:
        asset = Asset(name=data["name"])
    asset.create()
    
    process_asset_details(asset, data)
    process_components(asset, data)
    process_previews(asset, data)

    asset.create(
        publish=True,
        progress_fn=lambda progress: report_progress(
            "publishing", progress[1], progress[0]
        ),
        progress_range=(0, 100)
    )

    report_progress("finished", 100)
