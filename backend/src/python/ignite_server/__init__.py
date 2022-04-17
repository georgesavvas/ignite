import os
import platform
from pathlib import Path


DIR = os.path.dirname(__file__)
ENV = os.environ

ENV["IGNITE_CONFIG_PATH"] = str(Path.home() / ".ignite/server_config.yaml")
ENV["IGNITE_SERVER_ROOT"] = DIR

dcc = Path(DIR).parent.parent.parent.parent / "dcc"
ENV["IGNITE_DCC"] = str(dcc)

ocio = dcc / "ocio/aces_1.2/config.ocio"
ENV["OCIO"] = str(ocio)

os_name = platform.system()
if os_name == "Windows":
    os_name = "win"
elif os_name == "Debian":
    os_name = "mac"
tools = Path(DIR).parent.parent.parent / "tools"
path = tools / os_name
if path.is_dir():
    s = ";".join([str(x) for x in path.iterdir() if x.is_dir()])
    ENV["PATH"] = s + ";" + str(path) + ";" + ENV.get("PATH", "")
