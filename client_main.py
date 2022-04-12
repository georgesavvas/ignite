import os
import math
from posixpath import dirname
import uvicorn
import yaml
from pprint import pprint
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from entities.task import Task

from ignite.client import utils


ENV = os.environ
IGNITE_ROOT = os.path.dirname(__file__)
ENV["IGNITE_ROOT"] = IGNITE_ROOT
s = os.path.join(IGNITE_ROOT, "cg", "houdini", "python")
if not s in ENV["PYTHONPATH"]:
    ENV["PYTHONPATH"] += ";" + s


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
    return {
        "ok": True
    }


@app.post("/api/v1/launch_dcc")
async def launch_dcc(request: Request):
    result = await request.json()
    task = result.get("task", "")
    scene = result.get("scene", "")
    dcc = result.get("dcc", "")
    dcc_name = result.get("dcc_name", "")
    new_scene = result.get("new_scene", False)
    if new_scene and task:
        scene = utils.copy_default_scene(task, dcc)
    elif new_scene and not task:
        return {"ok": False}
    ok = utils.launch_dcc(dcc, dcc_name, scene)
    return {
        "ok": ok
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


if __name__ == "__main__":
    uvicorn.run("client_main:app", host="127.0.0.1", port=9091, log_level="info", reload=True)
