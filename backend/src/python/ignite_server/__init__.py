import os
import platform
import yaml
import logging
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

SERVER_CONFIG_PATH = CONFIG_PATH / "server_config.yaml"
ensure_config(SERVER_CONFIG_PATH, {
    "server_address": "0.0.0.0:9070",
    "projects_root": str(Path.home() / "projects")
})

logging.info(f"Setting IGNITE_SERVER_CONFIG_PATH to {SERVER_CONFIG_PATH}")
logging.info(f"Setting IGNITE_SERVER_ROOT to {DIR}")
ENV["IGNITE_SERVER_CONFIG_PATH"] = str(SERVER_CONFIG_PATH)
ENV["IGNITE_SERVER_ROOT"] = DIR

dcc = ignite_root / "dcc"
logging.info(f"Setting IGNITE_DCC to {dcc}")
ENV["IGNITE_DCC"] = str(dcc)

ocio = dcc / "ocio/aces_1.2/config.ocio"
logging.info(f"Setting OCIO to {ocio}")
ENV["OCIO"] = str(ocio)

os_name = platform.system()
if os_name == "Windows":
    os_name = "win"
elif os_name == "Darwin":
    os_name = "darwin"
else:
    os_name = "linux"
tools = Path(DIR).parent.parent.parent / "tools"
path = tools / os_name
if path.is_dir():
    s = ";".join([str(x) for x in path.iterdir() if x.is_dir()])
    ENV["PATH"] = s + ";" + str(path) + ";" + ENV.get("PATH", "")
