import os
import platform
import yaml
import logging
from pathlib import Path

logging.basicConfig(level=logging.DEBUG)

DIR = os.path.dirname(__file__)
ENV = os.environ

ignite_root = Path(DIR).parent.parent.parent.parent

logging.info(f"Setting IGNITE_ROOT to {ignite_root}")
ENV["IGNITE_ROOT"] = str(ignite_root)

default_config = {
    "server_address": "0.0.0.0:9070",
    "projects_root": str(Path.home() / "projects")
}

CONFIG_PATH = ignite_root / "common/server_config.yaml"
if not CONFIG_PATH.is_file():
    CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(CONFIG_PATH, "w") as file:
        yaml.safe_dump(default_config, file)
else:
    with open(CONFIG_PATH, "r") as file:
        existing = yaml.safe_load(file) or {}
    existing_keys = list(existing.keys())
    changed = False
    for k, v in default_config.items():
        if k in existing_keys:
            continue
        existing[k] = v
        changed = True
    if changed:
        with open(CONFIG_PATH, "w") as file:
            yaml.safe_dump(existing, file)
logging.info(f"Setting IGNITE_SERVER_CONFIG_PATH to {CONFIG_PATH}")
logging.info(f"Setting IGNITE_SERVER_ROOT to {DIR}")
ENV["IGNITE_SERVER_CONFIG_PATH"] = str(CONFIG_PATH)
ENV["IGNITE_SERVER_ROOT"] = DIR

dcc = Path(DIR).parent.parent.parent.parent / "dcc"
logging.info(f"Setting IGNITE_DCC to {dcc}")
ENV["IGNITE_DCC"] = str(dcc)

ocio = dcc / "ocio/aces_1.2/config.ocio"
logging.info(f"Setting OCIO to {ocio}")
ENV["OCIO"] = str(ocio)

os_name = platform.system()
if os_name == "Windows":
    os_name = "win"
elif os_name == "Darwin":
    os_name = "mac"
else:
    os_name = "linux"
tools = Path(DIR).parent.parent.parent / "tools"
path = tools / os_name
if path.is_dir():
    s = ";".join([str(x) for x in path.iterdir() if x.is_dir()])
    ENV["PATH"] = s + ";" + str(path) + ";" + ENV.get("PATH", "")
