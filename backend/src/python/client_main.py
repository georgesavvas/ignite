import os
import math
from posixpath import dirname
import uvicorn
import yaml
from pprint import pprint
from pathlib import PurePath
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

ENV = os.environ
IGNITE_SERVER_HOST = "127.0.0.1"
IGNITE_SERVER_PORT = "9090"
ENV["IGNITE_SERVER_HOST"] = IGNITE_SERVER_HOST
ENV["IGNITE_SERVER_PORT"] = IGNITE_SERVER_PORT

from ignite_client import utils, api


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
    config = utils.get_dcc_config()
    return {
        "ok": True,
        "data": config
    }


@app.post("/api/v1/set_dcc_config")
async def set_dcc_config(request: Request):
    result = await request.json()
    config = result.get("config", [])
    utils.set_dcc_config(config)
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


@app.post("/api/v1/show_in_explorer")
async def show_in_explorer(request: Request):
    result = await request.json()
    filepath = result.get("filepath")
    if not filepath:
        return {"ok": False}
    ok = utils.show_in_explorer(filepath)
    return {"ok": ok}


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
    pprint(data)
    resp = api.ingest(data)
    return {
        "ok": True,
        "data": resp
    }


projects_root = PurePath(utils.server_request("get_projects_root").get("data"))
print(projects_root)
app.mount("/files", StaticFiles(directory=projects_root), name="projects_root")


if __name__ == "__main__":
    uvicorn.run("client_main:app", host="127.0.0.1", port=9091, log_level="info", reload=True)
