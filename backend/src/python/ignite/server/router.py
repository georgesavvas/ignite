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


import logging
import math
import os

from fastapi import APIRouter, Request, WebSocket
from fastapi.responses import PlainTextResponse

from ignite.server import api, utils
from ignite.vault import api as vault_api
from ignite.server.socket_manager import SocketManager
from ignite.server.utils import CONFIG
from ignite.logger import get_logger
from ignite.utils import error, mount_root, log_request, process_request


LOGGER = get_logger(__name__)
ASSET_UPDATES_MANAGER = SocketManager()
ENV = os.environ


api_version = ENV["IGNITE_API_VERSION"]
router = APIRouter(
    prefix=f"/api/{api_version}"
)


@router.get("/get_projects_root")
async def get_projects_root():
    data = api.get_projects_root()
    if not data:
        return error("no_projects_root")
    return {"ok": True, "data": data}


@router.post("/set_projects_root")
async def set_projects_root(request: Request):
    result = await request.json()
    log_request(result)
    path = result.get("path")
    ok = utils.set_projects_root(path)
    if ok:
        mount_root(router, CONFIG)
    return {"ok": ok}


@router.get("/get_vault_path")
async def get_vault_path():
    data = api.get_vault_path()
    return {"ok": True, "data": data}


@router.post("/get_context_info")
async def get_context_info(request: Request):
    result = await request.json()
    log_request(result)
    path = result.get("path")
    data = api.get_context_info(path)
    if not data:
        return error("entity_not_found")
    print("Result:", data)
    return {"ok": True, "data": data}


@router.get("/get_projects")
async def get_projects():
    data = api.get_projects()
    for i, d in enumerate(data):
        d["result_id"] = i
    return {"ok": True, "data": data}


@router.get("/get_project_names")
async def get_project_names():
    data = api.get_project_names()
    return {"ok": True, "data": data}


@router.post("/get_project_tree")
async def get_project_tree(request: Request):
    result = await request.json()
    log_request(result)
    project = api.get_project(result.get("project"))
    if not project:
        return error("entity_not_found")
    data = project.get_project_tree() or {}
    return {"ok": True, "data": data}


@router.post("/create_project")
async def create_project(request: Request):
    result = await request.json()
    log_request(result)
    name = result.get("name")
    ok, msg = api.create_project(name)
    if not ok:
        return error("generic_error", msg)
    return {"ok": True}


@router.post("/find")
async def find(request: Request):
    result = await request.json()
    log_request(result)
    result = process_request(result)
    path = result.get("path", "")
    entity = api.find(path)
    data = {}
    if hasattr(entity, "as_dict"):
        data = entity.as_dict()
    if not data:
        return error("entity_not_found")
    return {"ok": True, "data": data}


@router.post("/find_multiple")
async def find_multiple(request: Request):
    result = await request.json()
    log_request(result)
    result = process_request(result)
    data = result.get(data)
    if type(data) == "list":
        entities = [api.find(path) for path in data]
        data = [
            entity.as_dict() for entity in entities if hasattr(entity, "as_dict")
        ]
    elif type(data) == "dict":
        entities = {path: api.find(path) for path in data.keys()}
        data = {
            k: entity.as_dict()
            for k, entity in entities
            if hasattr(entity, "as_dict")
        }
    return {"ok": True, "data": data}


# This is used by the C++ USD resolver, expects raw strings as response
@router.post("/resolve", response_class=PlainTextResponse)
async def resolve(request: Request):
    result = await request.json()
    log_request(result)
    uri = result.get("uri")
    data = api.resolve(uri)
    return data


@router.post("/create_dirs")
async def create_dirs(request: Request):
    result = await request.json()
    log_request(result)
    path = result.get("path")
    method = result.get("method")
    dir_kind = result.get("kind")
    dirs = result.get("dirs", [])
    created_amount = api.create_dirs(path, method, dirs)
    if not created_amount:
        return error("generic_error")
    s = "s" if created_amount > 1 else ""
    if dir_kind == "directory" and created_amount > 1:
        s = ""
        dir_kind = "directories"
    text = f"Created {created_amount} {dir_kind}{s}"
    return {"ok": True, "text": text}


@router.post("/get_contents")
async def get_contents(request: Request):
    result = await request.json()
    log_request(result)
    query = result.get("query", {})
    data = api.get_contents(
        result.get("path", ""),
        latest=query.get("latest", 0),
        sort=query.get("sort"),
        as_dict=True
    )
    data = utils.query_filter(data, query)
    limit = int(result.get("limit", 20))
    total = len(data)
    print(f"{total} results")
    pages = int(math.ceil(total/limit))
    page = result.get("page", 1)
    start = (page - 1) * limit
    end = start + limit
    to_return = data[start:end]
    for i, d in enumerate(to_return):
        d["result_id"] = i 
    return {
        "ok": True,
        "pages": {
            "total": pages,
            "current": page,
        },
        "result_amount": total,
        "data": to_return
    }


@router.post("/get_tasks")
async def get_tasks(request: Request):
    result = await request.json()
    log_request(result)
    query = result.get("query", {})
    data = api.discover_tasks(
        result.get("path"),
        sort=query.get("sort"),
        as_dict=True
    )
    data = utils.query_filter(data, query)
    limit = result.get("limit", 20)
    total = len(data)
    pages = int(math.ceil(total/limit))
    page = result.get("page", 1)
    start = (page - 1) * limit
    end = start + limit
    to_return = data[start:end]
    for i, d in enumerate(to_return):
        d["result_id"] = i 
    return {
        "ok": True,
        "pages": {
            "total": pages,
            "current": page,
        },
        "result_amount": total,
        "data": to_return
    }


@router.post("/get_assets")
async def get_assets(request: Request):
    result = await request.json()
    log_request(result)
    query = result.get("query", {})
    data = api.discover_assets(
        result.get("path"),
        # latest=query.get("latest", 0),
        sort=query.get("sort"),
        filters=query.get("filters"),
        as_dict=True
    )
    data = utils.query_filter(data, query)
    limit = result.get("limit", 20)
    total = len(data)
    pages = int(math.ceil(total/limit))
    page = result.get("page", 1)
    start = (page - 1) * limit
    end = start + limit
    to_return = data[start:end]
    for i, d in enumerate(to_return):
        d["result_id"] = i 
    return {
        "ok": True,
        "pages": {
            "total": pages,
            "current": page,
            "results": total
        },
        "result_amount": total,
        "data": to_return
    }


@router.post("/get_assetversion")
async def get_assetversion(request: Request):
    result = await request.json()
    log_request(result)
    path = result.get("path")
    data = api.get_assetversion(path)
    if not data:
        return error("entity_not_found")
    return {"ok": True, "data": data}


@router.post("/get_assetversions")
async def get_assetversions(request: Request):
    result = await request.json()
    log_request(result)
    query = result.get("query", {})
    data = api.discover_assetversions(
        result.get("path"),
        latest=query.get("latest", 0),
        sort=query.get("sort"),
        as_dict=True,
        filters=query.get("filters")
    )
    data = utils.query_filter(data, query)
    limit = result.get("limit", 20)
    total = len(data)
    pages = int(math.ceil(total/limit))
    page = result.get("page", 1)
    start = (page - 1) * limit
    end = start + limit
    to_return = data[start:end]
    for i, d in enumerate(to_return):
        d["result_id"] = i 
    return {
        "ok": True,
        "pages": {
            "total": pages,
            "current": page,
            "results": total
        },
        "result_amount": total,
        "data": to_return
    }


@router.post("/get_scenes")
async def get_scenes(request: Request):
    result = await request.json()
    log_request(result)
    query = result.get("query", {})
    data = api.discover_scenes(
        result.get("path"),
        latest=query.get("latest", 0),
        sort=query.get("sort"),
        as_dict=True
    )
    data = utils.query_filter(data, query)
    limit = result.get("limit", 20)
    total = len(data)
    pages = int(math.ceil(total/limit))
    page = result.get("page", 1)
    start = (page - 1) * limit
    end = start + limit
    to_return = data[start:end]
    for i, d in enumerate(to_return):
        d["result_id"] = i
    return {
        "ok": True,
        "pages": {
            "total": pages,
            "current": page,
            "results": total
        },
        "result_amount": total,
        "data": to_return
    }


@router.post("/copy_default_scene")
async def copy_default_scene(request: Request):
    result = await request.json()
    log_request(result)
    task = result.get("task", "")
    dcc = result.get("dcc", "")
    scene = api.copy_default_scene(task, dcc)
    if not scene:
        return error("generic_error")
    return {"ok": True, "scene": scene}


@router.post("/register_directory")
async def register_directory(request: Request):
    result = await request.json()
    log_request(result)
    result = process_request(result)
    path = result.get("path", "")
    dir_kind = result.get("dir_kind", "")
    tags = result.get("tags")
    ok = api.register_directory(path, dir_kind, tags)
    if not ok:
        return error("generic_error")
    return {"ok": ok}


@router.post("/register_task")
async def register_task(request: Request):
    result = await request.json()
    log_request(result)
    result = process_request(result)
    path = result.get("path", "")
    task_type = result.get("task_type", "")
    tags = result.get("tags")
    ok = api.register_task(path, task_type, tags)
    if not ok:
        return error("generic_error")
    return {"ok": ok}


@router.post("/register_scene")
async def register_scene(request: Request):
    result = await request.json()
    log_request(result)
    result = process_request(result)
    path = result.get("path", "")
    ok = api.register_scene(path)
    if not ok:
        return error("generic_error")
    return {"ok": ok}


@router.post("/register_asset")
async def register_asset(request: Request):
    result = await request.json()
    log_request(result)
    result = process_request(result)
    path = result.get("path", "")
    tags = result.get("tags")
    ok = api.register_asset(path, tags)
    if not ok:
        return error("generic_error")
    return {"ok": ok}


@router.post("/set_repr")
async def set_repr(request: Request):
    result = await request.json()
    log_request(result)
    target = result.get("target", "")
    repr = result.get("repr", "")
    ok = api.set_repr(target, repr)
    if not ok:
        return error("generic_error")
    return {"ok": ok}


@router.post("/set_repr_for_project")
async def set_repr_for_project(request: Request):
    result = await request.json()
    log_request(result)
    repr = result.get("repr", "")
    ok, target = api.set_repr_for_project(repr)
    return {"ok": ok, "data": target}


@router.post("/set_repr_for_parent")
async def set_repr_for_parent(request: Request):
    result = await request.json()
    log_request(result)
    repr = result.get("repr", "")
    ok, target = api.set_repr_for_parent(repr)
    return {"ok": ok, "data": target}


@router.post("/register_assetversion")
async def register_assetversion(request: Request):
    result = await request.json()
    log_request(result)
    result = process_request(result)
    path = result.get("path", "")
    tags = result.get("tags")
    ok = api.register_assetversion(path, tags)
    if not ok:
        return error("generic_error")
    return {"ok": ok}


@router.post("/delete_entity")
async def delete_entity(request: Request):
    result = await request.json()
    log_request(result)
    path = result.get("path", "")
    entity = result.get("kind", "")
    ok = api.delete_entity(path, entity)
    if not ok:
        return error("generic_error")
    return {"ok": ok}


@router.post("/rename_entity")
async def rename_entity(request: Request):
    result = await request.json()
    log_request(result)
    path = result.get("path", "")
    entity = result.get("kind", "")
    new_name = result.get("name")
    if not new_name:
        return error("invalid_data")
    ok, msg = api.rename_entity(path, entity, new_name)
    if not ok:
        return error("invalid_data", msg)
    return {"ok": ok}


@router.post("/add_tags")
async def add_tags(request: Request):
    result = await request.json()
    log_request(result)
    path = result.get("path", "")
    tags = result.get("tags", [])
    if not path or not tags:
        return error("invalid_data")
    ok = api.add_tags(path, tags)
    if not ok:
        return error("generic_error")
    return {"ok": ok}


@router.post("/remove_tags")
async def remove_tags(request: Request):
    result = await request.json()
    log_request(result)
    path = result.get("path", "")
    tags = result.get("tags", [])
    all = result.get("all")
    if not path or not (tags or all):
        return error("invalid_data")
    ok = api.remove_tags(path, tags=tags, all=all)
    if not ok:
        return error("generic_error")
    return {"ok": ok}


@router.post("/set_attributes")
async def set_attributes(request: Request):
    result = await request.json()
    log_request(result)
    path = result.get("path", "")
    attributes = result.get("attributes", [])
    if not path or not attributes:
        return error("invalid_data")
    ok = api.set_attributes(path, attributes)
    if not ok:
        return error("generic_error")
    return {"ok": ok}


@router.websocket("/ws/asset_updates/{session_id}")
async def asset_updates(websocket: WebSocket, session_id: str):
    if session_id:
        await ASSET_UPDATES_MANAGER.connect(websocket, session_id)
    while True:
        try:
            received = await websocket.receive_json()
            LOGGER.info(f"Websocket asset_updates received {received}")
        except Exception as e:
            print("error:", e)
            break


@router.get("/get_filter_templates")
async def get_filters():
    data = vault_api.get_filter_templates()
    return {
        "ok": True,
        "data": data
    }


@router.post("/add_filter_template")
async def add_filter(request: Request):
    result = await request.json()
    log_request(result)
    name = result.get("name")
    data = result.get("data", {})
    if not name or not data:
        return {"ok": False}
    data = vault_api.add_filter_template(data, name)
    return {
        "ok": True,
        "data": data
    }


@router.post("/remove_filter_template")
async def remove_filter(request: Request):
    result = await request.json()
    log_request(result)
    data = result.get("data", {})
    data = vault_api.remove_filter_template(data)
    return {
        "ok": True,
        "data": data
    }


@router.post("/rename_collection")
async def rename_collection(request: Request):
    result = await request.json()
    log_request(result)
    data = result.get("data", {})
    data = vault_api.rename_collection(data)
    return {
        "ok": True,
        "data": data
    }


@router.post("/edit_collection")
async def edit_collection(request: Request):
    result = await request.json()
    log_request(result)
    data = result.get("data", {})
    data = vault_api.edit_collection(data)
    return {
        "ok": True,
        "data": data
    }


@router.post("/write_collections")
async def write_collections(request: Request):
    result = await request.json()
    log_request(result)
    data = result.get("data", {})
    data = vault_api.write_collections(data)
    return {
        "ok": True,
        "data": data
    }


@router.get("/get_filter_templates")
async def get_filter_templates():
    data = vault_api.get_filter_templates()
    return {
        "ok": True,
        "data": data
    }


@router.post("/add_rule_template")
async def add_rule_template(request: Request):
    result = await request.json()
    log_request(result)
    name = result.get("name")
    data = result.get("data")
    if not name or not data:
        LOGGER.error(f"name {name} data {data}")
        return {"ok": False}
    data = vault_api.add_rule_template(data, name)
    return {
        "ok": True,
        "data": data
    }


@router.post("/remove_rule_template")
async def remove_rule_template(request: Request):
    result = await request.json()
    log_request(result)
    data = result.get("data", {})
    data = vault_api.remove_rule_template(data)
    return {
        "ok": True,
        "data": data
    }


@router.post("/get_collections")
async def get_collections(request: Request):
    result = await request.json()
    log_request(result)
    user = result.get("user")
    data = vault_api.get_collections(user, "all")
    return {
        "ok": True,
        "data": data
    }


@router.post("/create_collection")
async def create_collection(request: Request):
    result = await request.json()
    log_request(result)
    data = result.get("data", {})
    data = vault_api.create_collection(data)
    return {
        "ok": True,
        "data": data
    }


@router.post("/delete_collection")
async def delete_collection(request: Request):
    result = await request.json()
    log_request(result)
    data = result.get("data", {})
    data = vault_api.delete_collection(data)
    return {
        "ok": True,
        "data": data
    }


@router.post("/reorder_collection")
async def reorder_collection(request: Request):
    result = await request.json()
    log_request(result)
    data = result.get("data")
    ok = vault_api.reorder_collection(data)
    return {"ok": ok}


@router.get("/get_rule_templates")
async def get_rule_templates():
    data = api.get_rule_templates()
    return {
        "ok": True,
        "data": data
    }


@router.post("/add_rule_template")
async def add_rule_template(request: Request):
    result = await request.json()
    log_request(result)
    name = result.get("name")
    data = result.get("data")
    if not name or not data:
        logging.error(f"name {name} data {data}")
        return {"ok": False}
    data = api.add_rule_template(data, name)
    return {
        "ok": True,
        "data": data
    }


@router.post("/remove_rule_template")
async def remove_rule_template(request: Request):
    result = await request.json()
    log_request(result)
    data = result.get("data", {})
    data = api.remove_rule_template(data)
    return {
        "ok": True,
        "data": data
    }


@router.get("/get_vault_asset_names")
async def get_vault_asset_names():
    data = api.get_vault_asset_names()
    return {
        "ok": True,
        "data": data
    }


@router.post("/vault_import")
async def vault_import(request: Request):
    result = await request.json()
    log_request(result)
    path = result.get("path")
    name = result.get("name")
    if not path or not name:
        return error("invalid_data")
    ok = api.vault_import(path, name)
    return {"ok": ok}


@router.post("/vault_export")
async def vault_export(request: Request):
    result = await request.json()
    log_request(result)
    path = result.get("path")
    task = result.get("task")
    name = result.get("name")
    if not path or not task or not name:
        return error("invalid_data")
    ok = api.vault_export(path, task, name)
    return {"ok": ok}


@router.post("/set_scene_comment")
async def set_scene_comment(request: Request):
    result = await request.json()
    log_request(result)
    path = result.get("path")
    comment = result.get("comment")
    ok = api.set_scene_comment(path, comment)
    return {"ok": ok}


@router.post("/set_directory_protected")
async def set_directory_protected(request: Request):
    result = await request.json()
    log_request(result)
    path = result.get("path")
    protected = result.get("protected")
    ok = api.set_directory_protected(path, protected)
    return {"ok": ok}
