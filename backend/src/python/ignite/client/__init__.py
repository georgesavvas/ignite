import logging
import os
import platform
from pathlib import Path

import yaml
from platformdirs import site_config_dir, user_config_dir

logging.basicConfig(level=logging.INFO)


DIR = os.path.dirname(__file__)
ENV = os.environ

OS_NAME = platform.system()
if OS_NAME == "Windows":
    OS_NAME = "win"
elif OS_NAME == "Darwin":
    OS_NAME = "darwin"
else:
    OS_NAME = "linux"

api_v = "v1"
logging.debug(f"Setting IGNITE_API_VERSION to {api_v}")
ENV["IGNITE_API_VERSION"] = api_v

ignite_root = Path(DIR).parent.parent.parent.parent
logging.debug(f"Setting IGNITE_ROOT to {ignite_root}")
ENV["IGNITE_ROOT"] = str(ignite_root)

USER_CONFIG_PATH = Path.home() / ".ignite"
if not USER_CONFIG_PATH.exists():
    USER_CONFIG_PATH.mkdir(parents=True, exist_ok=True)
logging.debug(f"Setting IGNITE_USER_CONFIG_PATH to {USER_CONFIG_PATH}")
ENV["IGNITE_USER_CONFIG_PATH"] = str(USER_CONFIG_PATH)

def ensure_config(filepath, default={}):
    if not filepath.is_file():
        filepath.parent.mkdir(parents=True, exist_ok=True)
        with open(filepath, "w") as file:
            yaml.safe_dump(default, file)
    elif default:
        with open(filepath, "r") as file:
            existing = yaml.safe_load(file) or {}
        existing_keys = list(existing.keys())
        changed = False
        for k, v in default.items():
            if k in existing_keys:
                continue
            existing[k] = v
            changed = True
        if changed:
            with open(filepath, "w") as file:
                yaml.safe_dump(existing, file)

default_project_dir = str(Path.home() / "projects")

CLIENT_CONFIG_PATH = USER_CONFIG_PATH / "client_config.yaml"
ensure_config(CLIENT_CONFIG_PATH, {
    "dcc_config": [],
    "server_details": {
        "address": "localhost:9070",
        "password": "",
    },
    "access": {
        "projects_root": default_project_dir,
        "remote": False,
        "server_projects_root": default_project_dir
    }
})
logging.debug(f"Setting IGNITE_CLIENT_CONFIG_PATH to {CLIENT_CONFIG_PATH}")
ENV["IGNITE_CLIENT_CONFIG_PATH"] = str(CLIENT_CONFIG_PATH)

CONFIG_PATH = ignite_root / "config"
logging.debug(f"Setting IGNITE_CONFIG_PATH to {CONFIG_PATH}")
ENV["IGNITE_CONFIG_PATH"] = str(CONFIG_PATH)

dcc = CONFIG_PATH / "dcc"
logging.debug(f"Setting IGNITE_DCC to {dcc}")
ENV["IGNITE_DCC"] = str(dcc)

tools = ignite_root / "tools" / OS_NAME
logging.debug(f"Setting IGNITE_TOOLS to {tools}")
ENV["IGNITE_TOOLS"] = str(tools)

ocio = dcc / "ocio/aces_1.2/config.ocio"
logging.debug(f"Setting OCIO to {ocio}")
ENV["OCIO"] = str(ocio)

houdini_modules = str(dcc / "houdini/python")
if houdini_modules not in ENV.get("PYTHONPATH", ""):
    ENV["PYTHONPATH"] = houdini_modules + ";" + ENV.get("PYTHONPATH", "")
