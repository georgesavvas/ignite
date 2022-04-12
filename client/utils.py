import os
import logging
import yaml
import subprocess
import shutil
from pathlib import PurePath, Path
from client_main import IGNITE_ROOT
import ignite.api as ign
from ignite.utils import create_anchor
from ignite.client.constants import GENERIC_ENV, DCC_ENVS


IGNITE_ROOT = Path(os.environ["IGNITE_ROOT"])
CONFIG_PATH = Path(Path.home(), ".ignite")
if not CONFIG_PATH.exists():
    CONFIG_PATH.mkdir()


def replace_root(d):
    env = {}
    for k, v in d.items():
        if "{root}" in v:
            v = str(PurePath(v.format(root=IGNITE_ROOT)))
        env[k] = v
    return env



def get_generic_env():
    return replace_root(GENERIC_ENV)


def get_task_env(path):
    task = ign.find(path)
    if not task or not task.dir_kind == "task":
        return {}
    env = {
        "PROJECT": task.project,
        "PHASE": task.phase,
        "CONTEXT": task.context,
        "TASK": task.path,
        "EXPORTS": task.exports,
        "SCENES": task.scenes
    }
    return env


def get_scene_env(scene):
    if not scene or not scene.dir_kind == "scene":
        return {}
    env = {
        "VERSION": scene.version,
        "VS": scene.version,
        "VSN": scene.vsn
    }
    return env


def get_dcc_env(dcc):
    if not dcc in DCC_ENVS.keys():
        return {}
    return replace_root(DCC_ENVS[dcc])



def get_env(task="", dcc="", scene=""):
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


def copy_default_scene(task, dcc):
    task = ign.find(task)
    if not task or not task.dir_kind == "task":
        return
    filepath = IGNITE_ROOT / "cg/default_scenes/default_scenes.yaml"
    if not filepath.exists():
        return
    with open(filepath, "r") as f:
        data = yaml.safe_load(f)
    if dcc not in data.keys():
        print(dcc, data)
        return
    src = IGNITE_ROOT / "cg/default_scenes" / data[dcc]
    dest = task.get_next_scene()
    os.makedirs(dest)
    shutil.copy2(src, dest)
    create_anchor(dest, "scene")
    return dest / PurePath(src).name


def discover_dcc():
    pass


def launch_dcc(dcc, dcc_name, scene):
    scene = ign.find(scene)
    if not scene:
        return
    task = scene.task
    env = get_env(task, dcc, scene)
    scene = scene.scene
    for config in get_dcc_config():
        if config["name"] == dcc_name:
            dcc_config = config
            break
    else:
        return
    cmd = [dcc_config["path"]]
    cmd.append(scene)
    subprocess.Popen(cmd, env=env)
    return True
