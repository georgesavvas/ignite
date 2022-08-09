import os
import logging
import platform
import yaml
import subprocess
import requests
import importlib
from pathlib import PurePath, Path
from huey import SqliteHuey
from ignite_client.constants import GENERIC_ENV, DCC_ENVS, OS_NAMES


ENV = os.environ
API_VERSION = ENV["IGNITE_API_VERSION"]
IGNITE_ROOT = Path(ENV["IGNITE_ROOT"])
CONFIG_PATH = Path(ENV["IGNITE_CONFIG_PATH"])
CLIENT_CONFIG_PATH = Path(ENV["IGNITE_CLIENT_CONFIG_PATH"])
DCC = Path(ENV["IGNITE_DCC"])
COMMON = Path(ENV["IGNITE_COMMON"])

HUEY = SqliteHuey(filename=CONFIG_PATH / "ignite.db")


def get_config() -> dict:
    path = CLIENT_CONFIG_PATH
    if not os.path.isfile(path):
        raise Exception(f"Config file not found: {path}")
    logging.info(f"Reading config from {path}...")    
    with open(path, "r") as f:
        config = yaml.safe_load(f)
    config["projects_root"] = config["access"]["projects_root"]
    
    IGNITE_SERVER_ADDRESS = config["server_details"]["address"]
    IGNITE_SERVER_PASSWORD = config["server_details"]["password"]
    ENV["IGNITE_SERVER_ADDRESS"] = IGNITE_SERVER_ADDRESS
    ENV["IGNITE_SERVER_PASSWORD"] = IGNITE_SERVER_PASSWORD

    return config


CONFIG = get_config()
ROOT = PurePath(CONFIG["projects_root"])


def get_huey():
    return HUEY


def replace_vars(d):
    vars = {
        "dcc": str(DCC),
        "projects_root": server_request("get_projects_root").get("data", "")
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


def get_generic_env():
    env = {
        "IGNITE_SERVER_ADDRESS": IGNITE_SERVER_ADDRESS
    }
    env.update(replace_vars(GENERIC_ENV))
    return env


def get_task_env(path):
    task = server_request("find", {"query": path}).get("data", {})
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
    # env = os.environ.copy()
    env = {}
    env.update(get_generic_env())
    if task:
        env.update(get_task_env(task))
    if dcc:
        env.update(get_dcc_env(dcc))
    if scene:
        env.update(get_scene_env(scene))
    env = {k: str(v) for k, v in env.items()}
    return env


def get_server_details():
    config = get_config()
    return config["server_details"] or {}


def set_server_details(data):
    config = get_config()
    config["server_details"].update(data)
    with open(CLIENT_CONFIG_PATH, "w") as f:
        yaml.safe_dump(config, f)
    
    IGNITE_SERVER_ADDRESS = config["server_details"]["address"]
    IGNITE_SERVER_PASSWORD = config["server_details"]["password"]
    ENV["IGNITE_SERVER_ADDRESS"] = IGNITE_SERVER_ADDRESS
    ENV["IGNITE_SERVER_PASSWORD"] = IGNITE_SERVER_PASSWORD

    return config


def get_dcc_config():
    config = get_config()
    return config["dcc_config"] or []


def set_dcc_config(data):
    config = get_config()
    config["dcc_config"] = data
    with open(CLIENT_CONFIG_PATH, "w") as f:
        yaml.safe_dump(config, f)
    return config


def get_access():
    config = get_config()
    return config["access"] or {}


def set_access(data):
    config = get_config()
    config["access"].update(data)
    with open(CLIENT_CONFIG_PATH, "w") as f:
        yaml.safe_dump(config, f)
    return config


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


def get_launch_cmd(dcc, dcc_name, task, scene):
    # scene = server_request("find", {"query": scene}).get("data", {})
    # if not scene:
    #     return
    # task = scene.get("task", "")
    print("Getting env with (task, dcc, scene) -", task, "-", dcc, "-", scene)
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
    if scene:
        cmd.append(scene)
    data = {
        "cmd": cmd[0],
        "args": cmd[1:],
        "env": env
    }
    return data


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


def get_explorer_cmd(filepath):
    filepath = Path(filepath)
    if not filepath.is_dir():
        if filepath.is_file() or filepath.parent.is_dir():
            filepath = filepath.parent
    if not filepath.is_dir():
        return False

    os_name = OS_NAMES[platform.system()]
    cmds = {
        "win": ["explorer.exe", filepath],
        "mac": ["open", filepath],
        "linux": ["xdg-open", filepath]
    }
    cmd = cmds[os_name]
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
    path = COMMON / "actions"
    files = {}
    for entity in ("scenes", "assets", "assetversions", "components"):
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
                "source": file,
                "exts": module.EXTENSIONS,
                "fn": module.main #HUEY.task()(module.main)
            }
            actions[entity].append(entity_action)
    return actions
