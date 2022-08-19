import os
import math
import sys
import logging
from posixpath import dirname
from pathlib import Path
import uvicorn
from pprint import pprint
from pathlib import PurePath
from fastapi import FastAPI, Request
from fastapi.responses import PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from ignite_server import utils

CONFIG = utils.get_config()
SERVER_HOST, SERVER_PORT = CONFIG["server_address"].split(":")
ROOT = PurePath(CONFIG["projects_root"])
ENV = os.environ

from ignite_server import api


app = FastAPI()
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def log_request(request):
    pprint(request)


def process_request(req):
    # remap paths if needed
    client_root = req.get("client_root")
    if client_root:
        if req.get("path"):
            req["path"] = utils.remap_path(req["path"], client_root)
    return req


def error(s):
    return {"ok": False, "error": s}


def mount_root():
    if not ROOT or not Path(ROOT).is_dir():
        logging.warning(f"Projects root {ROOT} does not exist, skipping mounting...")
        return
    logging.debug(f"Attempting to mount {ROOT}")
    app.mount("/files", StaticFiles(directory=ROOT), name="projects_root")


@app.get("/api/v1/get_projects_root")
async def get_projects_root():
    data = api.get_projects_root()
    if not data:
        return error("no_projects_root")
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
    data = project.get_project_tree() if project else {}
    return {"ok": True, "data": data}


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


@app.post("/api/v1/get_tasks")
async def get_tasks(request: Request):
    result = await request.json()
    log_request(result)
    query = result.get("query", {})
    data = api.discover_tasks(
        result.get("path"),
        latest=query.get("latest", 0),
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
        latest=query.get("latest", 0),
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


@app.post("/api/v1/get_assetversions")
async def get_assetversions(request: Request):
    result = await request.json()
    log_request(result)
    query = result.get("query", {})
    data = api.discover_assetversions(
        result.get("path"),
        latest=query.get("latest", 0),
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


@app.post("/api/v1/get_scenes")
async def get_scenes(request: Request):
    result = await request.json()
    log_request(result)
    query = result.get("query", {})
    data = api.discover_scenes(
        result.get("path"),
        latest=query.get("latest", 0),
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


@app.post("/api/v1/set_repr_asset")
async def set_repr_asset(request: Request):
    result = await request.json()
    log_request(result)
    target = result.get("target", "")
    repr = result.get("repr", "")
    ok = api.set_repr_asset(target, repr)
    if not ok:
        return error("generic_error")
    return {"ok": True}


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
    code = api.rename_entity(path, entity, new_name)
    codes = {
        -1: "directory not empty"
    }
    if code < 0:
        return error(codes[code])
    return {"ok": True, "text": codes.get(code, "")}


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
    logging.info("Asked to shut down, cya!")
    sys.exit()


mount_root()


if __name__ == "__main__":
    logging.info(f"Launching server at {SERVER_HOST}:{SERVER_PORT}")
    uvicorn.run(f"{__name__}:app", host=SERVER_HOST, port=int(SERVER_PORT), log_level="info", reload=True)
