import os
import logging
import yaml
from pathlib import Path
from platformdirs import user_config_dir


logging.basicConfig(level=logging.DEBUG)


DIR = os.path.dirname(__file__)
ENV = os.environ

api_v = "v1"
logging.info(f"Setting IGNITE_API_VERSION to {api_v}")
ENV["IGNITE_API_VERSION"] = api_v

ignite_root = Path(DIR).parent.parent.parent.parent
logging.info(f"Setting IGNITE_ROOT to {ignite_root}")
ENV["IGNITE_ROOT"] = str(ignite_root)

# CONFIG_PATH = Path(user_config_dir("ignite"))
CONFIG_PATH = Path.home() / ".ignite"
if not CONFIG_PATH.exists():
    CONFIG_PATH.mkdir(parents=True, exist_ok=True)
logging.info(f"Setting IGNITE_CONFIG_PATH to {CONFIG_PATH}")
ENV["IGNITE_CONFIG_PATH"] = str(CONFIG_PATH)

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

CLIENT_CONFIG_PATH = CONFIG_PATH / "client_config.yaml"
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
logging.info(f"Setting IGNITE_CLIENT_CONFIG_PATH to {CLIENT_CONFIG_PATH}")
ENV["IGNITE_CLIENT_CONFIG_PATH"] = str(CLIENT_CONFIG_PATH)

common = ignite_root / "common"
logging.info(f"Setting IGNITE_COMMON to {common}")
ENV["IGNITE_COMMON"] = str(common)

dcc = ignite_root / "dcc"
logging.info(f"Setting IGNITE_DCC to {dcc}")
ENV["IGNITE_DCC"] = str(dcc)

ocio = dcc / "ocio/aces_1.2/config.ocio"
logging.info(f"Setting OCIO to {ocio}")
ENV["OCIO"] = str(ocio)

houdini_modules = str(dcc / "houdini/python")
if houdini_modules not in ENV.get("PYTHONPATH", ""):
    ENV["PYTHONPATH"] = houdini_modules + ";" + ENV.get("PYTHONPATH", "")
