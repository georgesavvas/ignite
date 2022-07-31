import os
from posixpath import dirname
import uvicorn
import logging
from pprint import pprint
from pathlib import PurePath
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

ENV = os.environ
IGNITE_SERVER_HOST = "10.101.120.31" # "127.0.0.1"
IGNITE_SERVER_PORT = "9090"
ENV["IGNITE_SERVER_HOST"] = IGNITE_SERVER_HOST
ENV["IGNITE_SERVER_PORT"] = IGNITE_SERVER_PORT

from ignite_client import utils, api


CONFIG = utils.get_config()

app = FastAPI()
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/v1/get_dcc_config")
async def get_dcc_config():
    data = utils.get_dcc_config()
    return {
        "ok": True,
        "data": data
    }


@app.post("/api/v1/set_dcc_config")
async def set_dcc_config(request: Request):
    result = await request.json()
    data = result.get("data", [])
    utils.set_dcc_config(data)
    return {"ok": True}


@app.get("/api/v1/get_server_details")
async def get_server_details():
    data = utils.get_server_details()
    return {
        "ok": True,
        "data": data
    }


@app.post("/api/v1/set_server_details")
async def set_server_details(request: Request):
    result = await request.json()
    data = result.get("data", [])
    utils.set_server_details(data)
    return {"ok": True}


@app.get("/api/v1/get_access")
async def get_access():
    data = utils.get_access()
    return {
        "ok": True,
        "data": data
    }


@app.post("/api/v1/set_access")
async def set_access(request: Request):
    result = await request.json()
    data = result.get("data", [])
    utils.set_access(data)
    return {"ok": True}


@app.post("/api/v1/launch_dcc")
async def launch_dcc(request: Request):
    result = await request.json()
    task = result.get("task", "")
    scene = result.get("scene", "")
    dcc = result.get("dcc", "")
    dcc_name = result.get("dcc_name", "")
    new_scene = result.get("new_scene", False)
    if new_scene and task:
        data = {
            "task": task,
            "dcc": dcc
        }
        resp = utils.server_request("copy_default_scene", data)
        scene = resp.get("scene", "")
    elif new_scene and not task:
        return {"ok": False}
    ok = utils.launch_dcc(dcc, dcc_name, scene)
    return {"ok": ok}


@app.post("/api/v1/get_launch_cmd")
async def get_launch_cmd(request: Request):
    result = await request.json()
    task = result.get("task", "")
    scene = result.get("scene", "")
    dcc = result.get("dcc", "")
    dcc_name = result.get("dcc_name", "")
    new_scene = result.get("new_scene", False)
    if new_scene and task:
        data = {
            "task": task,
            "dcc": dcc
        }
        resp = utils.server_request("copy_default_scene", data)
        scene = resp.get("scene", "")
    elif new_scene and not task:
        return {"ok": False}
    data = utils.get_launch_cmd(dcc, dcc_name, scene)
    return {
        "ok": True,
        "data": data
    }


@app.post("/api/v1/show_in_explorer")
async def show_in_explorer(request: Request):
    result = await request.json()
    filepath = result.get("filepath")
    if not filepath:
        return {"ok": False}
    ok = utils.show_in_explorer(filepath)
    return {"ok": ok}


@app.post("/api/v1/get_explorer_cmd")
async def get_explorer_cmd(request: Request):
    result = await request.json()
    filepath = result.get("filepath")
    if not filepath:
        return {"ok": False}
    data = utils.get_explorer_cmd(filepath)
    return {
        "ok": True,
        "data": data
    }


@app.post("/api/v1/get_env")
async def get_env(request: Request):
    result = await request.json()
    task = result.get("task", "")
    dcc = result.get("dcc", "")
    env = utils.get_env(task, dcc)
    return {
        "ok": True,
        "data": env
    }


@app.post("/api/v1/ingest_get_files")
async def ingest_get_files(request: Request):
    result = await request.json()
    dirs = result.get("dirs", "")
    resp = api.ingest_get_files(dirs)
    return {
        "ok": True,
        "data": resp
    }


@app.post("/api/v1/ingest")
async def ingest(request: Request):
    result = await request.json()
    data = result.get("data", {})
    resp = api.ingest(data)
    return {
        "ok": True,
        "data": resp
    }


@app.get("/api/v1/get_actions")
async def get_actions():
    data = api.get_actions()
    return {
        "ok": True,
        "data": data
    }


@app.post("/api/v1/run_action")
async def run_action(request: Request):
    result = await request.json()
    entity = result.get("entity")
    action = result.get("action")
    if not entity or not action:
        return {"ok": False}
    api.run_action(entity, action)
    return {"ok": True}


projects_root = CONFIG["projects_root"]
logging.debug(f"Attempting to mount {projects_root}")
app.mount("/files", StaticFiles(directory=projects_root), name="projects_root")


if __name__ == "__main__":
    uvicorn.run(f"{__name__}:app", host="127.0.0.1", port=9071, log_level="info", reload=False)
