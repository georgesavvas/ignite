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
IGNITE_ROOT = os.path.dirname(__file__)
ENV["IGNITE_SERVER_ROOT"] = IGNITE_ROOT

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


@app.get("/api/v1/get_projects")
async def get_projects():
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


@app.post("/api/v1/create_dir")
async def create_dir(request: Request):
    result = await request.json()
    path = result.get("path")
    method = result.get("method")
    dir_name = result.get("dir_name")
    if not path or not method or not dir_name:
        print("something missing")
        return {"success": False}
    entity = api.find(path)
    if method == "create_task":
        entity.create_task(dir_name, task_type=result["task_type"])
        return {"success": True}
    if not hasattr(entity, method):
        print(entity, "has no method", method)
        return {"success": False}
    getattr(entity, method)(dir_name)
    return {"ok": True}


@app.post("/api/v1/get_contents")
async def get_contents(request: Request):
    result = await request.json()
    data = api.get_contents(result.get("path", ""), as_dict=True)
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
    data = api.discover_tasks(
        result.get("path"),
        latest=result.get("latest", 0),
        as_dict=True
    )
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
    data = api.discover_assets(
        result.get("path"),
        latest=result.get("latest", 0),
        as_dict=True
    )
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
    data = api.discover_assetversions(
        result.get("path"),
        latest=result.get("latest", 0),
        as_dict=True
    )
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
    data = api.discover_scenes(
        result.get("path"),
        latest=result.get("latest", 0),
        as_dict=True
    )
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


if __name__ == "__main__":
    uvicorn.run("server_main:app", host="127.0.0.1", port=9090, log_level="info", reload=True)
