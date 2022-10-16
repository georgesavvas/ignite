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


import logging
import math
import os
import sys
from pathlib import Path

import uvicorn
from fastapi import FastAPI, Request, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from fastapi.staticfiles import StaticFiles

from ignite.server import utils
from ignite.vault import api as vault_api
from ignite.server.socket_manager import SocketManager
from ignite.server.utils import CONFIG
from ignite.utils import error, get_logger, log_request, process_request

LOGGER = get_logger(__name__)
SERVER_HOST, SERVER_PORT = CONFIG["server_address"].split(":")
ENV = os.environ

ASSET_UPDATES_MANAGER = SocketManager()

from ignite.server import api

app = FastAPI()
# app.include_router(vault_router.router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def mount_root():
    if not CONFIG["root"] or not Path(CONFIG["root"]).is_dir():
        LOGGER.warning(f"Projects root {CONFIG['root']} does not exist, skipping mounting...")
        return
    LOGGER.debug(f"Attempting to mount {CONFIG['root']}")
    app.mount(
        "/files", StaticFiles(directory=CONFIG['root']), name="projects_root"
    )


@app.get("/api/v1/get_projects_root")
async def get_projects_root():
    data = api.get_projects_root()
    if not data:
        return error("no_projects_root")
    return {"ok": True, "data": data}


@app.post("/api/v1/set_projects_root")
async def set_projects_root(request: Request):
    result = await request.json()
    log_request(result)
    path = result.get("path")
    ok = utils.set_projects_root(path)
    if ok:
        mount_root()
    return {"ok": ok}


@app.get("/api/v1/get_vault_path")
async def get_vault_path():
    data = api.get_vault_path()
    return {"ok": True, "data": data}


@app.get("/api/v1/ping")
async def ping():
    return {"ok": True}


@app.post("/api/v1/get_context_info")
async def get_context_info(request: Request):
    result = await request.json()
    log_request(result)
    path = result.get("path")
    data = api.get_context_info(path)
    if not data:
        return error("entity_not_found")
    print("Result:", data)
    return {"ok": True, "data": data}


@app.get("/api/v1/get_projects")
async def get_projects():
    data = api.get_projects()
    for i, d in enumerate(data):
        d["result_id"] = i
    return {"ok": True, "data": data}


@app.get("/api/v1/get_project_names")
async def get_project_names():
    data = api.get_project_names()
    return {"ok": True, "data": data}


@app.post("/api/v1/get_project_tree")
async def get_project_tree(request: Request):
    result = await request.json()
    log_request(result)
    project = api.get_project(result.get("project"))
    if not project:
        return error("entity_not_found")
    data = project.get_project_tree() or {}
    return {"ok": True, "data": data}


@app.post("/api/v1/create_project")
async def create_project(request: Request):
    result = await request.json()
    log_request(result)
    name = result.get("name")
    ok, msg = api.create_project(name)
    if not ok:
        return error("generic_error", msg)
    return {"ok": True}


@app.post("/api/v1/find")
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


# This is used by the C++ USD resolver, expects raw strings as response
@app.post("/api/v1/resolve", response_class=PlainTextResponse)
async def resolve(request: Request):
    result = await request.json()
    log_request(result)
    uri = result.get("uri")
    data = api.resolve(uri)
    return data


@app.post("/api/v1/create_dirs")
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


@app.post("/api/v1/get_contents")
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


@app.post("/api/v1/get_tasks")
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


@app.post("/api/v1/get_assets")
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


@app.post("/api/v1/get_assetversion")
async def get_assetversion(request: Request):
    result = await request.json()
    log_request(result)
    path = result.get("path")
    data = api.get_assetversion(path)
    if not data:
        return error("entity_not_found")
    return {"ok": True, "data": data}


@app.post("/api/v1/get_assetversions")
async def get_assetversions(request: Request):
    result = await request.json()
    log_request(result)
    query = result.get("query", {})
    data = api.discover_assetversions(
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


@app.post("/api/v1/get_scenes")
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


@app.post("/api/v1/copy_default_scene")
async def copy_default_scene(request: Request):
    result = await request.json()
    log_request(result)
    task = result.get("task", "")
    dcc = result.get("dcc", "")
    scene = api.copy_default_scene(task, dcc)
    if not scene:
        return error("generic_error")
    return {"ok": True, "scene": scene}


@app.post("/api/v1/register_directory")
async def register_directory(request: Request):
    result = await request.json()
    log_request(result)
    result = process_request(result)
    path = result.get("path", "")
    dir_kind = result.get("dir_kind", "")
    ok = api.register_directory(path, dir_kind)
    if not ok:
        return error("generic_error")
    return {"ok": True}


@app.post("/api/v1/register_task")
async def register_task(request: Request):
    result = await request.json()
    log_request(result)
    result = process_request(result)
    path = result.get("path", "")
    task_type = result.get("task_type", "")
    ok = api.register_task(path, task_type)
    if not ok:
        return error("generic_error")
    return {"ok": True}


@app.post("/api/v1/register_scene")
async def register_scene(request: Request):
    result = await request.json()
    log_request(result)
    result = process_request(result)
    path = result.get("path", "")
    ok = api.register_scene(path)
    if not ok:
        return error("generic_error")
    return {"ok": True}


@app.post("/api/v1/register_asset")
async def register_asset(request: Request):
    result = await request.json()
    log_request(result)
    result = process_request(result)
    path = result.get("path", "")
    ok = api.register_asset(path)
    if not ok:
        return error("generic_error")
    return {"ok": True}


@app.post("/api/v1/set_repr")
async def set_repr(request: Request):
    result = await request.json()
    log_request(result)
    target = result.get("target", "")
    repr = result.get("repr", "")
    ok = api.set_repr(target, repr)
    if not ok:
        return error("generic_error")
    return {"ok": True}


@app.post("/api/v1/set_repr_for_project")
async def set_repr_for_project(request: Request):
    result = await request.json()
    log_request(result)
    repr = result.get("repr", "")
    ok, target = api.set_repr_for_project(repr)
    return {"ok": ok, "data": target}


@app.post("/api/v1/set_repr_for_parent")
async def set_repr_for_parent(request: Request):
    result = await request.json()
    log_request(result)
    repr = result.get("repr", "")
    ok, target = api.set_repr_for_parent(repr)
    return {"ok": ok, "data": target}


@app.post("/api/v1/register_assetversion")
async def register_assetversion(request: Request):
    result = await request.json()
    log_request(result)
    result = process_request(result)
    path = result.get("path", "")
    ok = api.register_assetversion(path)
    if not ok:
        return error("generic_error")
    return {"ok": True}


@app.post("/api/v1/delete_entity")
async def delete_entity(request: Request):
    result = await request.json()
    log_request(result)
    path = result.get("path", "")
    entity = result.get("kind", "")
    ok = api.delete_entity(path, entity)
    if not ok:
        return error("generic_error")
    return {"ok": True}


@app.post("/api/v1/rename_entity")
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
    return {"ok": True}


@app.post("/api/v1/add_tags")
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
    return {"ok": True}


@app.post("/api/v1/remove_tags")
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
    return {"ok": True}


@app.post("/api/v1/set_attributes")
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
    return {"ok": True}


@app.get("/api/v1/quit")
async def rename_entity(request: Request):
    LOGGER.info("Asked to shut down, cya!")
    sys.exit()


@app.websocket("/ws/asset_updates/{session_id}")
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


@app.get("/api/v1/get_filter_templates")
async def get_filters():
    data = vault_api.get_filter_templates()
    return {
        "ok": True,
        "data": data
    }


@app.post("/api/v1/add_filter_template")
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


@app.post("/api/v1/remove_filter_template")
async def remove_filter(request: Request):
    result = await request.json()
    log_request(result)
    data = result.get("data", {})
    data = vault_api.remove_filter_template(data)
    return {
        "ok": True,
        "data": data
    }


@app.post("/api/v1/rename_collection")
async def rename_collection(request: Request):
    result = await request.json()
    log_request(result)
    data = result.get("data", {})
    data = vault_api.rename_collection(data)
    return {
        "ok": True,
        "data": data
    }


@app.post("/api/v1/edit_collection")
async def edit_collection(request: Request):
    result = await request.json()
    log_request(result)
    data = result.get("data", {})
    data = vault_api.edit_collection(data)
    return {
        "ok": True,
        "data": data
    }


@app.post("/api/v1/write_collections")
async def write_collections(request: Request):
    result = await request.json()
    log_request(result)
    data = result.get("data", {})
    data = vault_api.write_collections(data)
    return {
        "ok": True,
        "data": data
    }


@app.get("/api/v1/get_rule_templates")
async def get_rule_templates():
    data = vault_api.get_rule_templates()
    return {
        "ok": True,
        "data": data
    }


@app.post("/api/v1/add_rule_template")
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


@app.post("/api/v1/remove_rule_template")
async def remove_rule_template(request: Request):
    result = await request.json()
    log_request(result)
    data = result.get("data", {})
    data = vault_api.remove_rule_template(data)
    return {
        "ok": True,
        "data": data
    }


@app.post("/api/v1/get_collections")
async def get_collections(request: Request):
    result = await request.json()
    log_request(result)
    user = result.get("user")
    data = vault_api.get_collections(user, "all")
    return {
        "ok": True,
        "data": data
    }


@app.post("/api/v1/create_collection")
async def create_collection(request: Request):
    result = await request.json()
    log_request(result)
    data = result.get("data", {})
    data = vault_api.create_collection(data)
    return {
        "ok": True,
        "data": data
    }


@app.post("/api/v1/delete_collection")
async def delete_collection(request: Request):
    result = await request.json()
    log_request(result)
    data = result.get("data", {})
    data = vault_api.delete_collection(data)
    return {
        "ok": True,
        "data": data
    }


@app.post("/api/v1/reorder_collection")
async def reorder_collection(request: Request):
    result = await request.json()
    log_request(result)
    data = result.get("data")
    ok = vault_api.reorder_collection(data)
    return {"ok": ok}


@app.get("/api/v1/get_rule_templates")
async def get_rule_templates():
    data = api.get_rule_templates()
    return {
        "ok": True,
        "data": data
    }


@app.post("/api/v1/add_rule_template")
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


@app.post("/api/v1/remove_rule_template")
async def remove_rule_template(request: Request):
    result = await request.json()
    log_request(result)
    data = result.get("data", {})
    data = api.remove_rule_template(data)
    return {
        "ok": True,
        "data": data
    }


@app.get("/api/v1/get_vault_asset_names")
async def get_vault_asset_names():
    data = api.get_vault_asset_names()
    return {
        "ok": True,
        "data": data
    }


@app.post("/api/v1/vault_import")
async def vault_import(request: Request):
    result = await request.json()
    log_request(result)
    path = result.get("path")
    name = result.get("name")
    if not path or not name:
        return error("invalid_data")
    ok = api.vault_import(path, name)
    return {"ok": ok}


@app.post("/api/v1/vault_export")
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


mount_root()


if __name__ == "__main__":
    LOGGER.info(f"Launching server at {SERVER_HOST}:{SERVER_PORT}")
    uvicorn.run(
        f"{__name__}:app",
        host=SERVER_HOST,
        port=int(SERVER_PORT),
        log_level="warning",
        workers=1
    )
