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


import os
from pprint import pprint
from pathlib import Path

from fastapi import APIRouter, Request, WebSocket
from fastapi.staticfiles import StaticFiles

from ignite.utils import get_logger
from ignite.client import utils, api
from ignite.client.utils import TASK_MANAGER, PROCESSES_MANAGER, CONFIG


LOGGER = get_logger(__name__)
ENV = os.environ


router = APIRouter(
    prefix="/api/v1"
)

@router.on_event("startup")
async def startup_event():
    TASK_MANAGER.start()
    TASK_MANAGER.restore_tasks()


@router.websocket("/ws/processes/{session_id}")
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
    router.mount("/files", StaticFiles(directory=projects_root), name="projects_root")


@router.get("/ping")
async def ping():
    return {"ok": True}


@router.get("/get_config")
async def get_config():
    data = utils.get_config()
    return {"ok": True, "data": data}


@router.post("/set_config")
async def set_config(request: Request):
    result = await request.json()
    log_request(result)
    data = result.get("data", {})
    CONFIG, mount = utils.set_config(data)
    if mount:
        mount_root()
    return {"ok": True}


@router.post("/launch_dcc")
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


@router.post("/get_launch_cmd")
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


@router.post("/show_in_explorer")
async def show_in_explorer(request: Request):
    result = await request.json()
    log_request(result)
    filepath = result.get("filepath")
    if not filepath:
        return {"ok": False}
    ok = utils.show_in_explorer(filepath)
    return {"ok": ok}


@router.post("/get_explorer_cmd")
async def get_explorer_cmd(request: Request):
    result = await request.json()
    log_request(result)
    filepath = result.get("filepath")
    if not filepath:
        return {"ok": False}
    data = utils.get_explorer_cmd(filepath)
    return {"ok": True, "data": data}


@router.post("/get_env")
async def get_env(request: Request):
    result = await request.json()
    log_request(result)
    task = result.get("task", "")
    dcc = result.get("dcc", "")
    env = utils.get_env(task, dcc)
    return {"ok": True, "data": env}


@router.post("/ingest_get_files")
async def ingest_get_files(request: Request):
    result = await request.json()
    log_request(result)
    dirs = result.get("dirs", "")
    resp = api.ingest_get_files(dirs)
    return {"ok": True, "data": resp}


@router.post("/ingest")
async def ingest(request: Request):
    result = await request.json()
    log_request(result)
    data = result.get("data", {})
    resp = api.ingest(data)
    return {"ok": True, "data": resp}


@router.get("/get_actions")
async def get_actions():
    data = api.get_actions()
    return {"ok": True, "data": data}


@router.get("/discover_dcc")
async def discover_dcc():
    data = utils.discover_dcc()
    return {"ok": True, "data": data}


@router.post("/run_action")
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


@router.post("/edit_task")
async def edit_task(request: Request):
    result = await request.json()
    log_request(result)
    task_id = result.get("task_id")
    edit = result.get("edit")
    api.edit_task(task_id, edit)
    return {"ok": True}


@router.post("/get_tasks")
async def get_tasks(request: Request):
    result = await request.json()
    log_request(result)
    session_id = result.get("session_id")
    data = api.get_tasks(session_id)
    return {"ok": True, "data": data}


@router.get("/is_local_server_running")
async def is_local_server_running():
    data = api.is_local_server_running()
    return {"ok": data}


@router.get("/quit")
async def force_quit(request: Request):
    LOGGER.info("Asked to quit, cya!")
    os._exit(0)