# Copyright 2022 Georgios Savvas

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
import shutil
from datetime import datetime, timezone
from pathlib import Path

import timeago
import yaml
from ignite.server import api, utils
from ignite.server.constants import ANCHORS
from ignite.server.utils import CONFIG, is_dir_of_kind
from ignite.utils import bytes_to_human_readable, get_logger, is_read_only


LOGGER = get_logger(__name__)


class Directory():
    def __init__(self, path="", dir_kind="directory") -> None:
        self.dict_attrs = ["repr", "attributes", "uri"]
        self.nr_attrs = ["path"]
        self.project = ""
        self.group = ""
        self.uri = ""
        self.name = ""
        self.tags = []
        self._attributes = []
        self.dir_kind = dir_kind
        self.context = ""
        self._repr = None
        self.protected = False
        self.path = ""
        if path:
            path = Path(path)
            self.path = path
            if path.is_dir():
                stat = path.stat()
                self.creation_time = datetime.fromtimestamp(
                    stat.st_ctime, tz=timezone.utc
                )
                self.modification_time = datetime.fromtimestamp(
                    stat.st_mtime, tz=timezone.utc
                )
                self.size = 0 #stat.st_size
            anchor = ANCHORS[dir_kind]
            self.anchor = path / anchor
            self.check_anchor()

        if self.path:
            self.load_from_path()

    def check_anchor(self):
        if not self.anchor.is_file():
            if self.__class__.__name__ not in ("Asset", "AssetVersion"):
                raise Exception(
                    f"Invalid directory kind or missing anchor: {self.anchor}"
                )
            else:
                LOGGER.warning(f"Assuming {self.path} is a {self.dir_kind}")
                LOGGER.info(f"Creating anchor {self.anchor}")
                utils.create_delayed_anchor(anchor=self.anchor)

    def __repr__(self):
        return f"{self.name} ({self.dir_kind})"

    def load_from_path(self):
        path = self.path.as_posix()
        root = CONFIG["root"].as_posix()
        if not path.startswith(root):
            raise Exception(f"Invalid project dir: {path}")
        if not Path(path).is_dir():
            raise Exception(f"Invalid path: {path}")
        split = path.split(root)
        if len(split) == 1:
            raise Exception(f"Error parsing path: {path}")
        split2 = split[1].lstrip("/").split("/")
        project = split2[0]
        self.project = project
        self.group = ""
        if is_dir_of_kind(CONFIG["root"] / project / split2[1], "group"):
            self.group = split2[1]
        self.name = split2[-1]
        self.uri = utils.get_uri(path)
        self.protected = is_read_only(self.anchor)
        self.context = self.get_context()
        self.load_from_config()

    def get_context(self):
        if self.dir_kind == "group":
            return ""
        static_path = CONFIG["root"] / self.project
        if self.group:
            static_path /= self.group
        if hasattr(self, "task"):
            context = self.task
        else:
            context = self.path.parent
        return context.relative_to(static_path).as_posix() if context else ""

    def load_from_config(self):
        with open(self.anchor, "r") as f:
            config = yaml.safe_load(f) or {}
        for k, v in config.items():
            setattr(self, k, v)

    def get_parent(self):
        if self.dir_kind == "assetversion":
            return self.task
        else:
            return self.path.parent

    def as_dict(self):
        default = ["path", "protected", "dir_kind", "anchor", "project", "tags",
            "name", "context", "group"]
        default_nr = ["path"]
        d = {}
        for s in default:
            value = getattr(self, s)
            d[s] = value
            if s in default_nr or s in self.nr_attrs:
                d[f"{s}_nr"] = utils.get_nr(value)
        attrs = dir(self)
        for s in self.dict_attrs:
            if not s in attrs:
                continue
            value = getattr(self, s)
            d[s] = value
            if s in self.nr_attrs:
                d[f"{s}_nr"] = utils.get_nr(value)
        d["size"] = bytes_to_human_readable(self.size)
        try:
            d["creation_time"] = timeago.format(
                self.creation_time,
                datetime.now(tz=self.creation_time.tzinfo)
            )
            d["modification_time"] = timeago.format(
                self.modification_time,
                datetime.now(tz=self.modification_time.tzinfo)
            )
            d["creation_ts"] = self.creation_time.timestamp()
            d["modification_ts"] = self.modification_time.timestamp()
        except Exception as e:
            LOGGER.error(e)
            d["creation_time"] = "data error"
            d["modification_time"] = "data error"
            d["creation_ts"] = 0
            d["modification_ts"] = 0
        d["icon"] = self.dir_kind
        if hasattr(self, "task_type"):
            d["icon"] += "_" + self.task_type
        if self.repr:
            d["thumbnail"] = api.get_repr_comp(self.repr)
        return d

    def create_dir(self, name, anchor="directory", recursive=False):
        extra_chars = "/" if recursive else ""
        if not utils.validate_dirname(name, extra_chars=extra_chars):
            raise Exception(
                f"Only alphanumeric characters and underscores allowed: {name}"
            )
        path = self.path / name
        utils.ensure_directory(path)
        utils.create_anchor(path, anchor)
        return path
    
    def create_task(self, name, task_type="generic"):
        from ignite.server.entities.task import Task

        path = self.create_dir(name, "task")
        task = Task(path=path)
        if not task:
            LOGGER.error(f"Task creation failed: {path}")
            return
        task.set_task_type(task_type)
    
    def create_shot(self, name):
        self.create_dir(name, "shot")

    def create_build(self, name):
        path = self.create_dir(name, "build")
    
    def create_sequence(self, name):
        path = self.create_dir(name, "sequence")

    def children(self):
        path = Path(self.path)
        children = []
        for d in path.iterdir():
            if not d.is_dir():
                continue
            entity = api.find(d)
            if entity:
                children.append(entity)
        return children

    def update_config(self, data):
        data["modification_time"] = datetime.now(tz=timezone.utc)
        with open(self.anchor, "w+") as f:
            config = yaml.safe_load(f) or {}
            if not config.get("creation_time"):
                if config == data:
                    LOGGER.debug("Asset config identical - not writing.")
                    return config
                config["creation_time"] = data["modification_time"]
            config.update(data)
            yaml.safe_dump(config, f)
        if hasattr(self, "post_write"):
            self.post_write()
        return config

    def set_repr(self, uri):
        if not utils.is_uri(uri):
            uri = utils.get_uri(uri)
        self.repr = uri
        self.update_config({"repr": uri})

    @property
    def repr(self):
        return self._repr
        # if not self._repr:
        #     r = api.get_repr(self.path)
        #     return r
        # return self._repr

    @repr.setter
    def repr(self, value):
        self._repr = value

    def rename(self, new_name):
        path = Path(self.path)
        path.rename(path.parent / new_name)
        self.__init__(path, self.dir_kind)
        return path.name == new_name

    def delete(self):
        LOGGER.warning(f"About to delete {self.path}")
        try:
            shutil.rmtree(self.path)
        except Exception as e:
            LOGGER.error("Failed.")
            LOGGER.error(e)
            return False
        LOGGER.warning("Success.")
        return not self.path.exists()

    def get_tags(self):
        return self.tags
        # with open(self.anchor, "r") as f:
        #     config = yaml.safe_load(f) or {}
        # return config.get("tags", [])

    def set_tags(self, tags):
        self.update_config({"tags": tags})
        return tags
    
    def add_tags(self, tags):
        existing = self.get_tags()
        existing += tags
        existing = list(set(existing))
        self.update_config({"tags": existing})
        return existing
    
    def remove_tags(self, tags=[], all=False):
        existing = self.get_tags()
        if all:
            existing = []
        for tag in tags:
            if tag not in existing:
                continue
            existing.remove(tag)
        existing = list(set(existing))
        self.update_config({"tags": existing})
        return existing

    def set_protected(self, protected):
        ok = True
        mode = 0o444 if protected else 0o777
        for file in self.path.iterdir():
            LOGGER.info(f"Changing {file} mode to {mode}")
            try:
                file.chmod(mode)
            except Exception as e:
                LOGGER.error(e)
                ok = False
                break
        if ok:
            LOGGER.info(f"Changing {self.path} mode to {mode}")
            try:
                self.path.chmod(mode)
            except Exception as e:
                LOGGER.error(e)
                ok = False
        if ok:
            can_access = os.access(self.anchor, os.W_OK)
            LOGGER.debug(f"Anchor access: {can_access}")
            if can_access != protected:
                return True
        # Something went wrong, revert changes
        LOGGER.warning("Reverting permission changes...")
        mode = 0o444 if not protected else 0o777
        LOGGER.info(f"Changing {self.path} mode to {mode}")
        self.path.chmod(mode)
        for file in self.path.iterdir():
            LOGGER.info(f"Changing {file} mode to {mode}")
            try:
                file.chmod(mode)
            except Exception as e:
                LOGGER.error(e)


    @property
    def attributes(self):
        root = CONFIG["root"].as_posix()
        parent = Path(self.path.parent)
        iter = 1
        parent_attrib_list = []
        while root != parent.as_posix():
            if iter > 20:
                raise Exception(f"Reached iteration limit when walking directory: {self.path}")
            contents = next(parent.glob(".ign_*.yaml"), None)
            if not contents:
                parent = parent.parent
                iter +=1
                continue
            with open(contents, "r") as f:
                config = yaml.safe_load(f) or {}
            dir_attribs = config.get("attributes")
            if dir_attribs:
                parent_attrib_list.append(dir_attribs)
            parent = parent.parent
            iter +=1
        parent_attrib_list.reverse()
        parent_attribs = {}
        for attribs in parent_attrib_list:
            parent_attribs.update(attribs)

        with open(self.anchor, "r") as f:
            config = yaml.safe_load(f) or {}
        current_attribs = config.get("attributes", {})

        attributes = dict(parent_attribs)
        attributes.update(current_attribs)

        attributes_formatted = []
        for k, v in attributes.items():
            attributes_formatted.append({
                "name": k,
                "inherited": parent_attribs.get(k, ""),
                "override": current_attribs.get(k, "")
            })

        return attributes_formatted

    @attributes.setter
    def attributes(self, value):
        self._attributes = value

    def set_attributes(self, attributes):
        self.update_config({"attributes": attributes})
        return True
