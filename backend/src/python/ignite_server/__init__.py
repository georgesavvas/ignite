import os
import platform
import yaml
from pathlib import Path


DIR = os.path.dirname(__file__)
ENV = os.environ

CONFIG_PATH = Path.home() / ".ignite/server_config.yaml"
default_projects_root = str(Path.home() / "projects")
if not CONFIG_PATH.is_file():
    config = {
        "projects_root": default_projects_root
    }
    with open(CONFIG_PATH, "w") as file:
        yaml.safe_dump(config, file)
else:
    with open(CONFIG_PATH, "r") as file:
        existing = yaml.safe_load(file) or {}
    if not existing.get("projects_root"):
        config = {
            "projects_root": default_projects_root
        }
        with open(CONFIG_PATH, "w") as file:
            yaml.safe_dump(config, file)
ENV["IGNITE_CONFIG_PATH"] = str(CONFIG_PATH)
ENV["IGNITE_SERVER_ROOT"] = DIR

dcc = Path(DIR).parent.parent.parent.parent / "dcc"
ENV["IGNITE_DCC"] = str(dcc)

ocio = dcc / "ocio/aces_1.2/config.ocio"
ENV["OCIO"] = str(ocio)

os_name = platform.system()
if os_name == "Windows":
    os_name = "win"
elif os_name == "Darwin":
    os_name = "mac"
tools = Path(DIR).parent.parent.parent / "tools"
path = tools / os_name
if path.is_dir():
    s = ";".join([str(x) for x in path.iterdir() if x.is_dir()])
    ENV["PATH"] = s + ";" + str(path) + ";" + ENV.get("PATH", "")
