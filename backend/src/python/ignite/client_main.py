import os
import sys
from posixpath import dirname
from pprint import pprint
from pathlib import Path
import uvicorn
import logging
import asyncio
import threading

from fastapi import FastAPI, Request, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import sentry_sdk
sentry_sdk.init(
    dsn="https://9930a18d142b45af9d27e35276e3de54@o1421552.ingest.sentry.io/6767422",

    # Set traces_sample_rate to 1.0 to capture 100%
    # of transactions for performance monitoring.
    # We recommend adjusting this value in production.
    traces_sample_rate=1.0
)

from ignite.utils import get_logger
from ignite.client import utils, api
from ignite.client.utils import TASK_MANAGER, PROCESSES_MANAGER, CONFIG


LOGGER = get_logger(__name__)
ENV = os.environ

app = FastAPI()
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    TASK_MANAGER.restore_tasks()


@app.websocket("/ws/processes/{session_id}")
async def processes(websocket: WebSocket, session_id: str):
    if session_id:
        LOGGER.warning(f"Request to open socket from {session_id}")
        await PROCESSES_MANAGER.connect(websocket, session_id)
    while True:
        try:
            received = await websocket.receive_text()
            await websocket.send_json({"data": TASK_MANAGER.report()})
        except Exception as e:
            print("error:", e)
            break


def log_request(request):
    pprint(request)


def error(s):
    return {"ok": False, "error": s}


def mount_root():
    projects_root = CONFIG["root"]
    if not projects_root or not Path(projects_root).is_dir():
        LOGGER.warning(f"Projects root {projects_root} does not exist, skipping mounting...")
        return
    LOGGER.debug(f"Attempting to mount {projects_root}")
    app.mount("/files", StaticFiles(directory=projects_root), name="projects_root")


@app.get("/api/v1/ping")
async def ping():
    return {"ok": True}


@app.get("/api/v1/get_config")
async def get_config():
    data = utils.get_config()
    return {"ok": True, "data": data}


@app.post("/api/v1/set_config")
async def set_config(request: Request):
    result = await request.json()
    log_request(result)
    data = result.get("data", {})
    CONFIG, mount = utils.set_config(data)
    if mount:
        mount_root()
    return {"ok": True}


@app.post("/api/v1/launch_dcc")
async def launch_dcc(request: Request):
    result = await request.json()
    log_request(result)
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
    log_request(result)
    task = result.get("task", "")
    scene = result.get("scene", "")
    dcc = result.get("dcc", "")
    dcc_name = result.get("dcc_name", "")
    new_scene = result.get("new_scene", False)
    if new_scene and task:
        scene = utils.copy_default_scene(task, dcc)
    elif new_scene and not task:
        return {"ok": False}
    data = utils.get_launch_cmd(dcc, dcc_name, task, scene)
    return {"ok": True, "data": data}


@app.post("/api/v1/show_in_explorer")
async def show_in_explorer(request: Request):
    result = await request.json()
    log_request(result)
    filepath = result.get("filepath")
    if not filepath:
        return {"ok": False}
    ok = utils.show_in_explorer(filepath)
    return {"ok": ok}


@app.post("/api/v1/get_explorer_cmd")
async def get_explorer_cmd(request: Request):
    result = await request.json()
    log_request(result)
    filepath = result.get("filepath")
    if not filepath:
        return {"ok": False}
    data = utils.get_explorer_cmd(filepath)
    return {"ok": True, "data": data}


@app.post("/api/v1/get_env")
async def get_env(request: Request):
    result = await request.json()
    log_request(result)
    task = result.get("task", "")
    dcc = result.get("dcc", "")
    env = utils.get_env(task, dcc)
    return {"ok": True, "data": env}


@app.post("/api/v1/ingest_get_files")
async def ingest_get_files(request: Request):
    result = await request.json()
    log_request(result)
    dirs = result.get("dirs", "")
    resp = api.ingest_get_files(dirs)
    return {"ok": True, "data": resp}


@app.post("/api/v1/ingest")
async def ingest(request: Request):
    result = await request.json()
    log_request(result)
    data = result.get("data", {})
    resp = api.ingest(data)
    return {"ok": True, "data": resp}


@app.get("/api/v1/get_actions")
async def get_actions():
    data = api.get_actions()
    return {"ok": True, "data": data}


@app.get("/api/v1/discover_dcc")
async def discover_dcc():
    data = utils.discover_dcc()
    return {"ok": True, "data": data}


@app.post("/api/v1/run_action")
async def run_action(request: Request):
    result = await request.json()
    log_request(result)
    kind = result.get("kind")
    entity = result.get("entity")
    action = result.get("action")
    if not entity or not action:
        return {"ok": False}
    session_id = result.get("session_id")
    api.run_action(entity, kind, action, session_id)
    return {"ok": True}


@app.post("/api/v1/edit_task")
async def edit_task(request: Request):
    result = await request.json()
    log_request(result)
    task_id = result.get("task_id")
    edit = result.get("edit")
    api.edit_task(task_id, edit)
    return {"ok": True}


@app.post("/api/v1/get_tasks")
async def get_tasks(request: Request):
    result = await request.json()
    log_request(result)
    session_id = result.get("session_id")
    data = api.get_tasks(session_id)
    return {"ok": True, "data": data}


@app.get("/api/v1/quit")
async def rename_entity(request: Request):
    LOGGER.info("Asked to shut down, cya!")
    sys.exit()


mount_root()


if __name__ == "__main__":
    host = "localhost"
    port = 9071
    args = sys.argv
    if len(args) >= 2:
        port = int(args[1])
    IGNITE_CLIENT_ADDRESS = f"{host}:{port}"
    LOGGER.info(f"Setting IGNITE_CLIENT_ADDRESS to {IGNITE_CLIENT_ADDRESS}")
    ENV["IGNITE_CLIENT_ADDRESS"] = IGNITE_CLIENT_ADDRESS
    LOGGER.info(f"Launching server at {host}:{port}")
    uvicorn.run(
        f"{__name__}:app",
        host=host,
        port=port,
        log_level="warning",
        reload=True,
        workers=2
    )
