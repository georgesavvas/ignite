import os
import logging
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
from huey import SqliteHuey
from ignite_client.constants import GENERIC_ENV, DCC_ENVS, OS_NAMES, DCC_DISCOVERY


ENV = os.environ
API_VERSION = ENV["IGNITE_API_VERSION"]
IGNITE_ROOT = Path(ENV["IGNITE_ROOT"])
CONFIG_PATH = Path(ENV["IGNITE_CONFIG_PATH"])
CLIENT_CONFIG_PATH = Path(ENV["IGNITE_CLIENT_CONFIG_PATH"])
DCC = Path(ENV["IGNITE_DCC"])
COMMON = Path(ENV["IGNITE_COMMON"])

HUEY = SqliteHuey(filename=CONFIG_PATH / "ignite.db")


OS_NAME = OS_NAMES[platform.system()]


def get_config() -> dict:
    path = CLIENT_CONFIG_PATH
    if not os.path.isfile(path):
        raise Exception(f"Config file not found: {path}")
    logging.info(f"Reading config from {path}...")    
    with open(path, "r") as f:
        config = yaml.safe_load(f)
    config["projects_root"] = config["access"]["projects_root"]
    return config


CONFIG = get_config()
IGNITE_SERVER_ADDRESS = CONFIG["server_details"]["address"]
IGNITE_SERVER_PASSWORD = CONFIG["server_details"]["password"]
ENV["IGNITE_SERVER_ADDRESS"] = IGNITE_SERVER_ADDRESS
ENV["IGNITE_SERVER_PASSWORD"] = IGNITE_SERVER_PASSWORD
ROOT = PurePath(CONFIG["projects_root"])


def set_config(data):
    config = get_config()
    old_config = deepcopy(config)
    config.update(data)
    config["projects_root"] = config["access"]["projects_root"]
    server_root = server_request("get_projects_root")["data"]
    config["access"]["server_projects_root"] = server_root
    changed = old_config != config

    global CONFIG, ROOT, IGNITE_SERVER_ADDRESS, IGNITE_SERVER_PASSWORD
    CONFIG = config
    IGNITE_SERVER_ADDRESS = config["server_details"]["address"]
    IGNITE_SERVER_PASSWORD = config["server_details"]["password"]
    ENV["IGNITE_SERVER_ADDRESS"] = IGNITE_SERVER_ADDRESS
    ENV["IGNITE_SERVER_PASSWORD"] = IGNITE_SERVER_PASSWORD
    ROOT = PurePath(config["projects_root"])

    if not changed:
        return config, False

    with open(CLIENT_CONFIG_PATH, "w") as f:
        yaml.safe_dump(config, f)

    root_changed = old_config["projects_root"] != config["projects_root"]
    return config, root_changed


def get_huey():
    return HUEY


def replace_vars(d):
    vars = {
        "os": OS_NAME,
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
    IGNITE_CLIENT_ADDRESS = ENV["IGNITE_CLIENT_ADDRESS"]
    env = {
        "IGNITE_SERVER_ADDRESS": IGNITE_SERVER_ADDRESS,
        "IGNITE_CLIENT_ADDRESS": IGNITE_CLIENT_ADDRESS,
        "IGNITE_TOOLS": ENV["IGNITE_TOOLS"],
        "IGNITE_API_VERSION": ENV["IGNITE_API_VERSION"]
    }
    env.update(replace_vars(GENERIC_ENV))
    return env


def get_task_env(path):
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


def discover_dcc():
    config = []
    for name, data in DCC_DISCOVERY.items():
        paths = data["paths"][OS_NAME]
        path = None
        logging.info(f"Attempting to find {name}...")
        for p in paths:
            logging.info(f"Searching at {p}")
            available = glob.glob(p)
            if available:
                path = available[0]
                logging.info(f"Found {available}")
                logging.info(f"Choosing {path}")
                break
        else:
            logging.info(f"Found nothing.")
            continue
        args = data.get("args")
        if args:
            logging.info(f"Appending args {args}")
            path += f" {args}"
        dcc = {
            "exts": data["exts"],
            "name": data["label"],
            "path": path
        }
        config.append(dcc)
    return config


def launch_dcc(dcc, dcc_name, scene):
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
    # scene = server_request("find", {"query": scene}).get("data", {})
    # if not scene:
    #     return
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
    task = server_request("find", {"path": task}).get("data")
    if not task or not task["dir_kind"] == "task":
        logging.error(f"Invalid task {task}")
        return
    filepath = DCC / "default_scenes/default_scenes.yaml"
    if not filepath.exists():
        logging.error(f"Default scenes config {filepath} does not exist.")
        return
    with open(filepath, "r") as f:
        data = yaml.safe_load(f)
    if dcc not in data.keys():
        logging.error(f"Default scenes config is empty {filepath}")
        return
    src = DCC / "default_scenes" / data[dcc]
    dest = Path(task.get("next_scene"))
    dest.mkdir(parents=True, exist_ok=True)
    logging.info(f"Copying default scene {src} to {dest}")
    shutil.copy2(src, dest)
    data = {
        "client_root": str(ROOT),
        "path": str(dest),
        "dir_kind": "scene"
    }
    server_request("register_directory", data)
    scene_path = dest / PurePath(src).name
    data = {
        "client_root": str(ROOT),
        "path": str(scene_path)
    }
    scene = server_request("find", data).get("data")
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
    path = COMMON / "actions"
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
            task = HUEY.task()(module.main)
            entity_action = {
                "label": module.LABEL,
                "source": file,
                "exts": module.EXTENSIONS,
                "fn": task# module.main
            }
            HUEY.unregister_post_execute(module.main)
            actions[entity].append(entity_action)
    return actions
