# Copyright 2022 George Savvas

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     https://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


import os
from pathlib import PurePath, Path
import pprint

from fastapi.staticfiles import StaticFiles
from ignite.logger import get_logger

ENV = os.environ
CONFIG_PATH = Path(ENV["IGNITE_CONFIG_PATH"])
USER_CONFIG_PATH = Path(ENV["IGNITE_USER_CONFIG_PATH"])
LOGGER = get_logger(__name__)


def log_request(request):
    LOGGER.debug(f"Request data:\n{pprint.pformat(request)}")


def process_request(req):
    # remap paths if needed
    # client_root = req.get("client_root")
    # if client_root:
    #     if req.get("path"):
    #         req["path"] = remap_path(req["path"], client_root)
    return req


def error(s, msg=""):
    LOGGER.error(s)
    return {"ok": False, "error": msg or s}


def build_path(path, server_root):
    path = PurePath(path)
    root = server_root.as_posix()
    if path.as_posix().startswith(root):
        return path
    else:
        return server_root / path


def remap_path(path, server_root, client_root):
    path = PurePath(path)
    client_root = PurePath(client_root)
    if server_root == client_root:
        return str(path)
    rel = path.relative_to(client_root)
    return server_root / rel


def bytes_to_human_readable(size, suffix="B"):
    for unit in ["", "K", "M", "G", "T", "P"]:
        if abs(size) < 1024.0:
            return f"{size:3.1f} {unit}{suffix}"
        size /= 1024.0
    return f"{size:.1f}Yi{suffix}"


def mount_root(app, config):
    projects_root = config["root"]
    if not projects_root or not Path(projects_root).is_dir():
        LOGGER.warning(f"Projects root {projects_root} does not exist, skipping mounting...")
        return
    LOGGER.debug(f"Attempting to mount {projects_root}")
    app.mount(
        "/files", StaticFiles(directory=projects_root), name="projects_root"
    )
    LOGGER.debug("Mounted on /files")


def symlink_points_to(symlink, path):
    return path == symlink.resolve()


def get_config_paths(suffix, project_path=None, base=True, user=True):
    paths = []
    if base:
        paths.append(CONFIG_PATH / suffix)
    if user:
        paths.append(USER_CONFIG_PATH / suffix)
    if project_path:
        paths.append(project_path / ".config" / suffix)
    return paths
