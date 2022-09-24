import os
import yaml
import re
from pathlib import PurePath, Path

from mongoquery import Query

from ignite.utils import get_logger


LOGGER = get_logger(__name__)
ENV = os.environ
USER_CONFIG_PATH = PurePath(ENV["IGNITE_USER_CONFIG_PATH"])
COLLECTIONS_PATH = USER_CONFIG_PATH / "collections.yaml"
FILTERS_PATH = USER_CONFIG_PATH / "filters.yaml"


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
    assets = server_api.discover

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


# def filters_match(result, filters, condition):
#     a = condition == "and"
#     for filter in filters:
#         if filter.get("condition"):
#             continue
#         k, v = filter.items()
#         if ".ARRAY." in k:
#             k1, k2 = k.split(".ARRAY.")
#             if not result.get(k1) or not hasattr(result[k1], "__iter__"):
#                 if a:
#                     return False
#                 else:
#                     continue
#             if not [r for r in result[k1] if v in r[k2]]:
#                 if a:
#                     return False
#                 else:
#                     continue
#             if not a:
#                 return True
#         if not result.get(k):
#             if a:
#                 return False
#             else:
#                 continue
#         if v not in result[k]:
#             if a:
#                 return False
#             else:
#                 continue
#         if not a:
#             return True
#     return True


# def filter_results(results, filter):
#     def is_group(f):
#         return f.get("condition") != None
#     condition = filter.get("condition")
#     filters = filter.get("filters")
#     if is_group(filter):
#         return filter_results(results, filter)
#     [filter_results(results, f) for f in filters if is_group(f)]
#     return [r for r in results if filters_match(r, filters, condition)]
#     for result in results:
        
#         if filters_match(results, filters, condition)]


def get_collections(user=None, scope=None):

    def sort_children(node):
        if not node.get("children"):
            return
        node["children"].sort(key=lambda x: x["name"])
        for child in node["children"]:
            sort_children(child)

    data = {}
    if scope in ("all", "studio"):
        data["studio"] = COLLECTIONS_PATH
    # if scope in ("all", "user") and user:
    #     data["user"] = LIB_USER_COLLECTIONS.format(user=user)

    collections_all = {}
    for name, path in data.items():
        path = Path(path)

        collections = []
        if path.exists():
            with open(path, "r") as file:
                collections = yaml.safe_load(file)

        collections = collections
        if scope in ("all", "studio"):
            collections = collections or [{"name": "All", "expression": {"id": ""}, "children": []}]
        collections.sort(key=lambda x: x["name"])
        for coll in collections:
            sort_children(coll)
        collections = prep_collections(collections)
        collections_all[name] = collections
    # print("-----", scope, collections, collections_all)

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
        LOGGER.error(f"Couldn't find collection {source_name} in {source}")
        return False

    target_coll = processed
    for target_parent in target_parents:
        target_coll = get_coll(target_coll, target_parent)
    try:
        target_index = get_coll_index(target_coll, target_name)
    except ValueError:
        LOGGER.error(f"Couldn't find collection {target_name} in {target}")
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
    path = COLLECTIONS_PATH
    # if scope == "user" and user:
    #     path = LIB_USER_COLLECTIONS.format(user=user)
    path = Path(path)
    if not path.parent.is_dir():
        path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as file:
        collections = yaml.safe_dump(data, file)
    return collections


def get_filter_templates():
    path = Path(FILTERS_PATH)
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
    path = Path(FILTERS_PATH)
    with open(path, "w") as file:
        filters = yaml.safe_dump(data, file)
    return filters


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
