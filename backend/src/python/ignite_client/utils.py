import os
import logging
import platform
import yaml
import subprocess
import requests
from pathlib import PurePath, Path
from ignite_client.constants import GENERIC_ENV, DCC_ENVS, OS_NAMES


ENV = os.environ
IGNITE_DCC = Path(os.environ["IGNITE_DCC"])
CONFIG_PATH = Path(Path.home(), ".ignite")
if not CONFIG_PATH.exists():
    CONFIG_PATH.mkdir()
IGNITE_SERVER_HOST = ENV["IGNITE_SERVER_HOST"]
IGNITE_SERVER_PORT = ENV["IGNITE_SERVER_PORT"]


def replace_vars(d):
    vars = {
        "dcc": str(IGNITE_DCC),
        "projects_root": server_request("get_projects_root").get("data", "")
    }
    env = {}
    for k, v in d.items():
        for var_name, var_value in vars.items():
            s = "{" + var_name + "}"
            if s in v:
                v = str(PurePath(v.replace(s, var_value)))
        env[k] = v
    return env


def get_generic_env():
    return replace_vars(GENERIC_ENV)


def get_task_env(path):
    task = server_request("find", {"query": path}).get("data", {})
    if not task or not task.get("dir_kind") == "task":
        return {}
    env = {
        "PROJECT": task.get("project", ""),
        "PHASE": task.get("phase", ""),
        "CONTEXT": task.get("context", ""),
        "TASK": task.get("path", ""),
        "EXPORTS": task.get("exports", ""),
        "SCENES": task.get("scenes", "")
    }
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


def get_dcc_env(dcc):
    if not dcc in DCC_ENVS.keys():
        return {}
    return replace_vars(DCC_ENVS[dcc])



def get_env(task="", dcc="", scene={}):
    env = os.environ.copy()
    env.update(get_generic_env())
    if task:
        env.update(get_task_env(task))
    if dcc:
        env.update(get_dcc_env(dcc))
    if scene:
        env.update(get_scene_env(scene))
    env = {k: str(v) for k, v in env.items()}
    return env


def get_dcc_config():
    filepath = CONFIG_PATH / "dcc_config.yaml"
    if not filepath.exists():
        return []
    with open(filepath, "r") as f:
        data = yaml.safe_load(f)
    return data or []


def set_dcc_config(config):
    filepath = CONFIG_PATH / "dcc_config.yaml"
    with open(filepath, "w") as f:
        yaml.safe_dump(config, f)
    return filepath


def discover_dcc():
    pass


def launch_dcc(dcc, dcc_name, scene):
    scene = server_request("find", {"query": scene}).get("data", {})
    if not scene:
        return
    task = scene.get("task", "")
    env = get_env(task, dcc, scene)
    scene = scene.get("scene")
    for config in get_dcc_config():
        if config["name"] == dcc_name:
            dcc_config = config
            break
    else:
        return

    os_name = OS_NAMES[platform.system()]
    os_cmd = {
        "win": [],
        "mac": ["open", "-a"],
        "linux": []
    }
    cmd = os_cmd[os_name]
    cmd += [dcc_config["path"]]
    cmd.append(scene)
    subprocess.Popen(cmd, env=env)
    return True


def show_in_explorer(filepath):
    filepath = Path(filepath)
    if not filepath.is_dir():
        if filepath.is_file() or filepath.parent.is_dir():
            filepath = filepath.parent
    if not filepath.is_dir():
        return False

    os_name = OS_NAMES[platform.system()]
    if os_name == "win":
        os.startfile(filepath)
    elif os_name == "mac":
        subprocess.Popen(["open", filepath])
    else:
        subprocess.Popen(["xdg-open", filepath])
    return True


def server_request(method, data=None):
    url = f"http://{IGNITE_SERVER_HOST}:{IGNITE_SERVER_PORT}/api/v1/{method}"
    headers = {"Content-type": "application/json"}
    if not data:
        resp = requests.get(url, headers=headers).json()
    else:
        resp = requests.post(url, json=data, headers=headers).json()
    return resp
