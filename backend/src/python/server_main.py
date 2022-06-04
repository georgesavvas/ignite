import os
import math
from posixpath import dirname
import uvicorn
from pprint import pprint
from pathlib import PurePath
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from ignite_server import utils

CONFIG = utils.get_config()
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


@app.get("/api/v1/get_projects_root")
async def get_projects_root():
    data = api.get_projects_root()
    return {
        "ok": True,
        "data": data
    }


@app.post("/api/v1/get_context_info")
async def get_context_info(request: Request):
    result = await request.json()
    path = result.get("path")
    data = api.get_context_info(path)
    return {
        "ok": True,
        "data": data
    }


@app.get("/api/v1/get_projects")
async def get_projects():
    data = api.get_projects()
    for i, d in enumerate(data):
        d["result_id"] = i
    return {
        "ok": True,
        "data": data
    }


@app.get("/api/v1/get_project_names")
async def get_project_names():
    data = api.get_project_names()
    return {
        "ok": True,
        "data": data
    }


@app.post("/api/v1/get_project_tree")
async def get_project_tree(request: Request):
    result = await request.json()
    project = api.get_project(result.get("project"))
    data = project.get_project_tree() if project else {}
    return {
        "ok": True,
        "data": data
    }


@app.post("/api/v1/find")
async def find(request: Request):
    result = await request.json()
    query = result.get("query", "")
    entity = api.find(query)
    data = {}
    if hasattr(entity, "as_dict"):
        data = entity.as_dict()
    return {
        "ok": data != {},
        "data": data
    }


@app.post("/api/v1/resolve")
async def resolve(request: Request):
    result = await request.json()
    uri = result.get("uri")
    data = api.resolve(uri)
    return {
        "ok": True,
        "data": data
    }


@app.post("/api/v1/create_dirs")
async def create_dirs(request: Request):
    result = await request.json()
    path = result.get("path")
    method = result.get("method")
    dir_kind = result.get("kind")
    dirs = result.get("dirs", [])
    created_amount = api.create_dirs(path, method, dirs)
    if created_amount:
        s = "s" if created_amount > 1 else ""
        if dir_kind == "directory" and created_amount > 1:
            s = ""
            dir_kind = "directories"
        text = f"Created {created_amount} {dir_kind}{s}"
    else:
        text = f"No {dir_kind}s created."
    return {
        "ok": created_amount > 0,
        "text": text
    }


@app.post("/api/v1/get_contents")
async def get_contents(request: Request):
    result = await request.json()
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
    task = result.get("task", "")
    dcc = result.get("dcc", "")
    scene = api.copy_default_scene(task, dcc)
    return {
        "ok": scene != False,
        "scene": scene
    }


@app.post("/api/v1/register_directory")
async def register_directory(request: Request):
    result = await request.json()
    path = result.get("path", "")
    dir_kind = result.get("dir_kind", "")
    ok = api.register_directory(path, dir_kind)
    return {"ok": ok}


@app.post("/api/v1/register_task")
async def register_task(request: Request):
    result = await request.json()
    path = result.get("path", "")
    task_type = result.get("task_type", "")
    ok = api.register_task(path, task_type)
    return {"ok": ok}


@app.post("/api/v1/register_scene")
async def register_scene(request: Request):
    result = await request.json()
    path = result.get("path", "")
    ok = api.register_scene(path)
    return {"ok": ok}


@app.post("/api/v1/register_assetversion")
async def register_assetversion(request: Request):
    result = await request.json()
    path = result.get("path", "")
    ok = api.register_assetversion(path)
    return {"ok": ok}


@app.post("/api/v1/set_repr_asset")
async def set_repr_asset(request: Request):
    result = await request.json()
    target = result.get("target", "")
    repr = result.get("repr", "")
    ok = api.set_repr_asset(target, repr)
    return {"ok": ok}


@app.post("/api/v1/delete_entity")
async def delete_entity(request: Request):
    result = await request.json()
    path = result.get("path", "")
    entity = result.get("kind", "")
    ok = api.delete_entity(path, entity)
    return {"ok": ok}


@app.post("/api/v1/rename_entity")
async def rename_entity(request: Request):
    result = await request.json()
    path = result.get("path", "")
    entity = result.get("kind", "")
    new_name = result.get("name")
    if not new_name:
        return {"ok": False}
    ok = api.rename_entity(path, entity, new_name)
    reasons = {
        -1: "directory not empty"
    }
    return {
        "ok": ok > 0,
        "text": reasons.get(ok, "")
    }


if __name__ == "__main__":
    uvicorn.run("server_main:app", host="127.0.0.1", port=9090, log_level="info", reload=False)
