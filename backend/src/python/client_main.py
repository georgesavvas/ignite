import os
import sys
from posixpath import dirname
from pprint import pprint
from pathlib import Path
import uvicorn
import logging
from fastapi import FastAPI, Request, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from ignite_server.socket_manager import SocketManager
from ignite_client.task_manager import TaskManager
from ignite_client import utils, api


ENV = os.environ
CONFIG = utils.get_config()

PROCESSES_MANAGER = SocketManager()
TASK_MANAGER = TaskManager()


app = FastAPI()
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.websocket("/ws/processes/{session_id}")
async def processes(websocket: WebSocket, session_id: str):
    if session_id:
        await PROCESSES_MANAGER.connect(websocket, session_id)
    while True:
        try:
            received = await websocket.receive_text()
            websocket.send_json({"data": TASK_MANAGER.amount()})
        except Exception as e:
            print("error:", e)
            break


def log_request(request):
    pprint(request)


def error(s):
    return {"ok": False, "error": s}


def mount_root():
    projects_root = CONFIG["projects_root"]
    if not projects_root or not Path(projects_root).is_dir():
        logging.warning(f"Projects root {projects_root} does not exist, skipping mounting...")
        return
    logging.debug(f"Attempting to mount {projects_root}")
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
    api.run_action(entity, kind, action)
    return {"ok": True}


@app.get("/api/v1/quit")
async def rename_entity(request: Request):
    logging.info("Asked to shut down, cya!")
    sys.exit()


mount_root()


if __name__ == "__main__":
    host = "localhost"
    port = 9071
    args = sys.argv
    if len(args) >= 2:
        port = int(args[1])
    IGNITE_CLIENT_ADDRESS = f"{host}:{port}"
    logging.info(f"Setting IGNITE_CLIENT_ADDRESS to {IGNITE_CLIENT_ADDRESS}")
    ENV["IGNITE_CLIENT_ADDRESS"] = IGNITE_CLIENT_ADDRESS
    logging.info(f"Launching server at {host}:{port}")
    uvicorn.run(
        f"{__name__}:app",
        host=host,
        port=port,
        log_level="info",
        reload=True,
        workers=2
    )
