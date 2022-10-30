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
import platform
import yaml
import glob
import subprocess
import requests
import importlib
import shutil
from copy import deepcopy
from pprint import pprint
from pathlib import PurePath, Path

from ..utils import get_logger
from ignite.server import api as server_api
from ignite.server.socket_manager import SocketManager
from ignite.client.constants import GENERIC_ENV, DCC_ENVS, OS_NAMES, DCC_DISCOVERY
from ignite.client.task_manager import TaskManager

LOGGER = get_logger(__name__)
OS_NAME = OS_NAMES[platform.system()]
ENV = os.environ
API_VERSION = ENV["IGNITE_API_VERSION"]
IGNITE_ROOT = Path(ENV["IGNITE_ROOT"])
USER_CONFIG_PATH = Path(ENV["IGNITE_USER_CONFIG_PATH"])
CLIENT_CONFIG_PATH = Path(ENV["IGNITE_CLIENT_CONFIG_PATH"])
DCC = Path(ENV["IGNITE_DCC"])
CONFIG_PATH = Path(ENV["IGNITE_CONFIG_PATH"])

PROCESSES_MANAGER = SocketManager()
TASK_MANAGER = TaskManager(PROCESSES_MANAGER, USER_CONFIG_PATH / "tasks.json")


def get_config(formatted=True) -> dict:
    path = CLIENT_CONFIG_PATH
    if not os.path.isfile(path):
        raise Exception(f"Config file not found: {path}")
    LOGGER.debug(f"Reading config from {path}")    
    with open(path, "r") as f:
        config = yaml.safe_load(f)
    config["projects_root"] = config["access"].get("projects_root", "")
    if formatted:
        return {
            "root": PurePath(config["projects_root"]),
            "dcc_config": config["dcc_config"],
            "server_details": config["server_details"],
            "access": config["access"]
        }
    return config


CONFIG = {}
CONFIG.update(get_config())
IGNITE_SERVER_ADDRESS = CONFIG["server_details"].get("address", "")
IGNITE_SERVER_PASSWORD = CONFIG["server_details"].get("password", "")
ENV["IGNITE_SERVER_ADDRESS"] = IGNITE_SERVER_ADDRESS
ENV["IGNITE_SERVER_PASSWORD"] = IGNITE_SERVER_PASSWORD


def set_config(data):
    global CONFIG, IGNITE_SERVER_ADDRESS, IGNITE_SERVER_PASSWORD

    config = get_config(False)
    old_config = deepcopy(config)
    for key in ("access", "server_details"):
        if not data.get(key):
            continue
        config[key].update(data[key])
    config["dcc_config"] = data["dcc_config"]
    IGNITE_SERVER_ADDRESS = config["server_details"].get("address", "")
    IGNITE_SERVER_PASSWORD = config["server_details"].get("password", "")
    ENV["IGNITE_SERVER_ADDRESS"] = IGNITE_SERVER_ADDRESS
    ENV["IGNITE_SERVER_PASSWORD"] = IGNITE_SERVER_PASSWORD

    new_projects_root = config["access"]["server_projects_root"]
    if new_projects_root != old_config["access"]["server_projects_root"]:
        LOGGER.warning("New projects root received.")
        LOGGER.warning(f"Asking server to mount {new_projects_root}")
        server_request("set_projects_root", {"path": new_projects_root})

    config["root"] = config["access"].get("projects_root", "")
    changed = old_config != config

    if not changed:
        return config, False

    with open(CLIENT_CONFIG_PATH, "w") as f:
        yaml.safe_dump(config, f)
    
    CONFIG.update(get_config())

    root_changed = old_config["root"] != config["root"]
    return config, root_changed


def is_server_local():
    local = (
        "0.0.0.0",
        "localhost"
    )
    for s in local:
        if IGNITE_SERVER_ADDRESS.startswith(s):
            return True


def replace_vars(d, projects_root=None):
    fetched_projects_root = None
    if not projects_root:
        if is_server_local():
            fetched_projects_root = server_api.get_projects_root()
        else:
            fetched_projects_root = server_request("get_projects_root").get(
                "data", ""
            )
    vars = {
        "os": OS_NAME,
        "dcc": str(DCC),
        "projects_root": (
            projects_root or fetched_projects_root
        )
    }
    env = {}
    for k, v in d.items():
        for var_name, var_value in vars.items():
            s = "{" + var_name + "}"
            if s in v:
                v_path = PurePath(v.replace(s, var_value))
                v = str(v_path)
        env[k] = v
    return env


def get_generic_env(projects_root=None):
    IGNITE_CLIENT_ADDRESS = ENV["IGNITE_ADDRESS"]
    env = {
        "IGNITE_SERVER_ADDRESS": IGNITE_SERVER_ADDRESS,
        "IGNITE_CLIENT_ADDRESS": IGNITE_CLIENT_ADDRESS,
        "IGNITE_TOOLS": ENV["IGNITE_TOOLS"],
        "IGNITE_API_VERSION": ENV["IGNITE_API_VERSION"]
    }
    env.update(replace_vars(GENERIC_ENV, projects_root=projects_root))
    return env


def get_task_env(path):
    if is_server_local():
        entity = server_api.find(path)
        task = entity.as_dict() if hasattr(entity, "as_dict") else {}
    else:
        task = server_request("find", {"path": path}).get("data", {})
    if not task or not task.get("dir_kind") == "task":
        return {}
    env = {
        "PROJECT": task.get("project", ""),
        "GROUP": task.get("group", ""),
        "CONTEXT": task.get("context", ""),
        "BUILD": task.get("build", ""),
        "SEQUENCE": task.get("sequence", ""),
        "SHOT": task.get("shot", ""),
        "TASK": task.get("name", ""),
        "EXPORTS": task.get("exports", ""),
        "CACHE": task.get("cache", ""),
        "SCENES": task.get("scenes", "")
    }
    for attrib in task.get("attributes", []):
        env[f"IGNITE_ATTRIB_{attrib['name']}"] = attrib["override"] or attrib["inherited"]
    return env


def get_scene_env(scene):
    if not scene or not scene.get("dir_kind") == "scene":
        return {}
    env = {
        "VERSION": scene.get("version"),
        "VS": scene.get("version"),
        "VSN": scene.get("vsn")
    }
    return env


def get_dcc_env(dcc, projects_root=None):
    if not dcc in DCC_ENVS.keys():
        return {}
    return replace_vars(DCC_ENVS[dcc], projects_root=projects_root)


def get_env(task="", dcc="", scene={}):
    if is_server_local():
        projects_root = server_api.get_projects_root()
    else:
        projects_root = server_request("get_projects_root").get("data", "")
    env = {}
    env.update(get_generic_env(projects_root))
    if task:
        env.update(get_task_env(task))
    if dcc:
        env.update(get_dcc_env(dcc, projects_root))
    if scene:
        env.update(get_scene_env(scene))
    env = {k: str(v) for k, v in env.items()}
    return env


def discover_dcc():
    config = []
    for name, data in DCC_DISCOVERY.items():
        paths = data["paths"][OS_NAME]
        path = None
        LOGGER.info(f"Attempting to find {name}...")
        for p in paths:
            LOGGER.info(f"Searching at {p}")
            available = glob.glob(p)
            if available:
                path = available[0]
                LOGGER.info(f"Found {available}")
                LOGGER.info(f"Choosing {path}")
                break
        else:
            LOGGER.info(f"Found nothing.")
            continue
        args = data.get("args")
        if args:
            LOGGER.info(f"Appending args {args}")
            path += f" {args}"
        dcc = {
            "exts": data["exts"],
            "name": data["label"],
            "path": path
        }
        config.append(dcc)
    return config


def launch_dcc(dcc, dcc_name, scene):
    if is_server_local():
        entity = server_api.find(scene)
        scene = entity.as_dict() if hasattr(entity, "as_dict") else {}
    else:
        scene = server_request("find", {"path": scene}).get("data", {})
    if not scene:
        return
    task = scene.get("task", "")
    env = get_env(task, dcc, scene)
    scene = scene.get("scene")
    for config in CONFIG["dcc_config"]:
        if config["name"] == dcc_name:
            dcc_config = config
            break
    else:
        return

    os_cmd = {
        "win": [],
        "darwin": ["open", "-a"],
        "linux": []
    }
    cmd = os_cmd[OS_NAME]
    cmd += [dcc_config["path"]]
    cmd.append(scene)
    subprocess.Popen(cmd, env=env)
    return True


def get_launch_cmd(dcc, dcc_name, task, scene):
    if not task:
        task = scene.get("task", "")
    print("Getting env with (task, dcc, scene) -", task, "-", dcc, "-", scene)
    env = get_env(task, dcc, scene)
    scene = scene.get("scene")
    for config in CONFIG.get("dcc_config", []):
        if config["name"] == dcc_name:
            dcc_config = config
            break
    else:
        return

    os_cmd = {
        "win": [],
        "darwin": ["open", "-a"],
        "linux": []
    }
    cmd = os_cmd[OS_NAME]
    cmd += [dcc_config["path"]]
    if scene:
        cmd.append(scene)
    data = {
        "cmd": cmd[0],
        "args": cmd[1:],
        "env": env
    }
    return data


def copy_default_scene(task, dcc):
    if is_server_local():
        entity = server_api.find(task)
        task = entity.as_dict() if hasattr(entity, "as_dict") else {}
    else:
        task = server_request("find", {"path": task}).get("data")
    if not task or not task["dir_kind"] == "task":
        LOGGER.error(f"Invalid task {task}")
        return
    filepath = DCC / "default_scenes/default_scenes.yaml"
    if not filepath.exists():
        LOGGER.error(f"Default scenes config {filepath} does not exist.")
        return
    with open(filepath, "r") as f:
        data = yaml.safe_load(f)
    if dcc not in data.keys():
        LOGGER.error(f"Default scenes config is empty {filepath}")
        return
    src = DCC / "default_scenes" / data[dcc]
    dest = Path(task.get("next_scene"))
    dest.mkdir(parents=True, exist_ok=True)
    LOGGER.info(f"Copying default scene {src} to {dest}")
    shutil.copy2(src, dest)
    data = {
        "path": str(dest),
        "dir_kind": "scene"
    }
    if is_server_local():
        server_api.register_directory(str(dest), "scene")
    else:
        server_request("register_directory", data)
    scene_path = dest / PurePath(src).name
    if is_server_local():
        entity = server_api.find(str(scene_path))
        scene = entity.as_dict() if hasattr(entity, "as_dict") else {}
    else:
        scene = server_request("find", {"path": str(scene_path)}).get("data")
    return scene


def show_in_explorer(filepath):
    filepath = Path(filepath)
    if not filepath.is_dir():
        if filepath.is_file() or filepath.parent.is_dir():
            filepath = filepath.parent
    if not filepath.is_dir():
        return False

    if OS_NAME == "win":
        os.startfile(filepath)
    elif OS_NAME == "darwin":
        subprocess.Popen(["open", filepath])
    else:
        subprocess.Popen(["xdg-open", filepath])
    return True


def get_explorer_cmd(filepath):
    filepath = Path(filepath)
    if not filepath.is_dir():
        if filepath.is_file() or filepath.parent.is_dir():
            filepath = filepath.parent
    if not filepath.is_dir():
        return False

    cmds = {
        "win": ["explorer.exe", filepath],
        "darwin": ["open", filepath],
        "linux": ["xdg-open", filepath]
    }
    cmd = cmds[OS_NAME]
    data = {
        "cmd": cmd[0],
        "args": cmd[1:],
        "env": {}
    }
    return data


def server_request(method, data=None):
    url = f"http://{IGNITE_SERVER_ADDRESS}/api/{API_VERSION}/{method}"
    headers = {"Content-type": "application/json"}
    if not data:
        resp = requests.get(url, headers=headers).json()
    else:
        resp = requests.post(url, json=data, headers=headers).json()
    return resp


def get_action_files():
    path = CONFIG_PATH / "actions"
    print(path)
    files = {}
    for entity in ("scene", "asset", "assetversion", "component"):
        entity_path = path / entity
        if not entity_path.exists():
            continue
        files[entity] = entity_path.glob("*.py")
    return files


def discover_actions():
    actions = {}
    for entity, files in get_action_files().items():
        actions[entity] = []
        for file in files:
            if file.name == "__init__.py":
                continue
            module = importlib.machinery.SourceFileLoader(
                file.name, str(file)
            ).load_module()
            entity_action = {
                "label": module.LABEL,
                "source": file.as_posix(),
                "exts": module.EXTENSIONS,
                # "fn": module.main,
                "module_path": module.__file__
            }
            actions[entity].append(entity_action)
    return actions
