from __future__ import absolute_import, division, unicode_literals, print_function
import os
import sys
import clique
import re
import logging
import fnmatch
import json

import hou

import gtools.utils as ut
import volt_shell as vs
from . import constants

from importlib import reload

reload(constants)
reload(ut)

from .constants import PATH_TEMPLATES, CUSTOM_EXPORT_TEMPLATE


log = logging.getLogger(__name__)
log.setLevel(hou.getenv("FXCACHELOADER_LOGLEVEL", "DEBUG"))


def hda_created(kwargs):
    me = kwargs["node"]
    me.setColor(hou.Color((0.15, 0.15, 0.15)))


def hda_updated(kwargs):
    pass


def hda_loaded(kwargs):
    me = kwargs["node"]
    me.parm("reload").pressButton()


def documentation_pressed(kwargs):
    import webbrowser as wb

    wb.open("http://et-vfx.etc.io/docs/cg/tools/houdini/hdas/geocache_loader/")


def submit_bug_pressed(kwargs):
    from PySide2 import QtCore
    from gtools import submit_bug_window

    reload(submit_bug_window)
    window = submit_bug_window.SubmitBug(
        hda_name="GeoCache Loader", labels=["geocache_loader,"]
    )
    window.setParent(hou.qt.mainWindow(), QtCore.Qt.Window)
    window.show()


def submit_rfe_pressed(kwargs):
    from PySide2 import QtCore
    from gtools import submit_rfe_window

    reload(submit_rfe_window)
    window = submit_rfe_window.SubmitRFE(
        hda_name="GeoCache Loader", labels=["geocache_loader", "RFE"]
    )
    window.setParent(hou.qt.mainWindow(), QtCore.Qt.Window)
    window.show()


def name_menu_used(kwargs):
    fetch_caches(kwargs)


def rebuild_path_pressed(kwargs):
    build_path(kwargs)


def populate_geo_seq_pressed(kwargs):
    fetch_geo_sequences(kwargs)
    set_geo_sequence(kwargs)


def version_menu_used(kwargs):
    fetch_versions(kwargs)


def geo_sequence_menu_used(kwargs):
    fetch_geo_sequences(kwargs)


def get_cache_name(kwargs):
    pass


def cache_name_changed(kwargs):
    me = kwargs["node"]
    parm = me.parm("cache_name")
    value = parm.eval()
    if " " in value or not value:
        parm.revertToDefaults()
        return
    fetch_versions(kwargs)
    set_version(kwargs)
    version_changed(kwargs)


def load_type_changed(kwargs):
    set_geo_sequence(kwargs)
    build_path(kwargs)


def change_version(kwargs):
    me = kwargs["node"]

    buttons_parm = me.parm("version_buttons")
    active = buttons_parm.evalAsInt()
    version_parm = me.parm("version")
    version = version_parm.evalAsString()
    buttons_parm.set(0)

    if (active == 1 or active == 2) and version:
        pattern = re.compile(r"\d+")
        numbers = list(pattern.finditer(version))
        if not numbers:
            return
        index = 0
        match = numbers[index]
        start = match.start()
        end = match.end()
        old_version = match.group(0)
        new_version = ""

        if active == 1:
            new_version = max(int(old_version) - 1, 0)
        else:
            new_version = max(int(old_version) + 1, 0)

        padded_ver = "{0:03d}".format(new_version)
        final_version = "{}{}{}".format(version[:start], padded_ver, version[end:])
        version_parm.set(final_version)
        version_changed(kwargs)


def version_latest_pressed(kwargs):
    me = kwargs["node"]

    fetch_versions(kwargs)
    version_parm = me.parm("version")
    versions = me.evalParm("version_list")
    latest_version = versions.split(",")[0]

    if versions:
        if version_parm.evalAsString() != latest_version:
            version_parm.set(latest_version)
            ut.user_print("Switched to latest version")
            version_changed(kwargs)
        else:
            ut.user_print("Already on latest version")
            version_changed(kwargs)
    else:
        version_parm.set("v001")
        ut.user_print("No versions found...")
        version_changed(kwargs)


def reload_geo_pressed(kwargs):
    fetch_geo_sequences(kwargs)
    set_geo_sequence(kwargs)
    build_path(kwargs)


def custom_target_changed(kwargs):
    fetch_geo_sequences(kwargs)
    set_geo_sequence(kwargs)
    build_path(kwargs)


def geo_sequence_changed(kwargs):
    parm = kwargs["parm"]
    value = parm.eval()
    if " " in value or not value:
        parm.revertToDefaults()
        return
    build_path(kwargs)


def refresh_icon_strips(kwargs):
    change_version(kwargs)


def version_changed(kwargs):
    me = kwargs["node"]
    parm = me.parm("version")
    value = parm.eval()
    if " " in value or not value:
        parm.revertToDefaults()
        return
    fetch_geo_sequences(kwargs)
    set_geo_sequence(kwargs)
    build_path(kwargs)
    read_meta(kwargs)


def set_parm(parm, value, defaults=False):
    """ Sets the parm to the given value if the parm does not contain any
    special character or set of characters that would indicate the user is
    using an expression and would not want the parm to be altered automatically.
    """

    chars = ("$", "`", "ch(", "chf(", "chs(")
    current_value = (
        parm.unexpandedString()
        .replace('`ch("read_frame")`', "")
        .replace('chs("frame")', "")
    )

    for char in chars:
        if char in current_value:
            break
    else:
        if not defaults:
            parm.set(value)
        else:
            parm.revertToDefaults()


def set_version(kwargs):
    me = kwargs["node"]

    version_parm = me.parm("version")
    version_list = me.evalParm("version_list")

    current_version = version_parm.unexpandedString()

    if not version_list:
        set_parm(version_parm, "Select version")

    if current_version not in version_list or not current_version:
        set_parm(version_parm, version_list.split(",")[0])


def set_geo_sequence(kwargs):
    me = kwargs["node"]

    auto_load = me.evalParm("auto_load_seq")
    geo_seq_parm = me.parm("geo_sequence")
    geo_seq_list = me.parm("geo_sequence_list").unexpandedString()
    load_type = me.evalParm("load_geo_seq")

    current_seq = geo_seq_parm.unexpandedString()
    geo_sequences = geo_seq_list.split(",")
    if geo_sequences and geo_sequences[0] == "No sequences found":
        geo_sequences = []
    amount = len(geo_sequences)
    if not load_type:
        amount = min(amount, 1)

    change_single = current_seq not in geo_seq_list or not current_seq

    if not geo_sequences:
        set_parm(geo_seq_parm, "Select sequence")
        me.parm("seq_amount").set(1)

        parm = me.parm("multi_geo_sequence_1")
        set_parm(parm, "Select sequence")

    elif auto_load:
        if change_single:
            # print("Setting", geo_seq_parm.name(), "to", geo_sequences[0])
            set_parm(geo_seq_parm, geo_sequences[0])

        me.parm("seq_amount").set(amount)
        for i in range(0, amount):
            parm = ut.multiparm(me, "multi_geo_sequence", i + 1)

            # If the loading type is on "multi", only load the first
            # sequence and leave the rest for the user to populate.
            if i and load_type != 2:
                set_parm(parm, "", defaults=True)
            else:
                # print("Setting", parm.name(), "to", geo_sequences[i])
                set_parm(parm, geo_sequences[i])
    else:
        if change_single:
            set_parm(geo_seq_parm, "", defaults=True)

        me.parm("seq_amount").set(amount)
        for i in range(0, amount):
            parm = ut.multiparm(me, "multi_geo_sequence", i + 1)
            set_parm(parm, "", defaults=True)


def get_export_dir(kwargs):
    me = kwargs["node"]
    name = me.evalParm("cache_name")
    folder = "cache"
    if "/" in name:
        folder = name.split("/")[0]
        name = name.split("/")[1]
    custom = me.evalParm("custom_target")
    if not custom:
        return "$CACHE" if folder == "cache" else "$EXPORTS"
    export_vars = {
        "silo": hou.getenv("SILO", ""),
        "project": hou.getenv("PROJECT", "")
    }
    for var in ("type", "asset", "sequence", "shot", "task", "wa", "wav"):
        export_vars[var] = me.parm("target_" + var).evalAsString()
    phases = {
        "asset": "build",
        "sandbox": "sandbox",
        "shot": "sequence"
    }
    export_vars["phase"] = phases[export_vars["type"]]
    export_vars["mode"] = folder

    path = CUSTOM_EXPORT_TEMPLATE.format(**export_vars)
    return path


def build_path(kwargs):
    me = kwargs["node"]

    name = me.evalParm("cache_name")
    folder = "cache"
    if "/" in name:
        folder = name.split("/")[0]
        name = name.split("/")[1]
    version = me.evalParm("version")
    geo_seq_load = me.evalParm("load_geo_seq")
    geo_seq_amount = me.evalParm("seq_amount")

    me.parm("filepaths_amount").set(geo_seq_amount)

    if folder == "exports":
        asset_config = vs.get_asset_config("fxcache")
        folder = "{}_{}".format(folder, asset_config.get("schema", "1.0"))
    path = PATH_TEMPLATES[folder]
    path = path.format(
        export_dir=get_export_dir(kwargs),
        wa=hou.getenv("WA"),
        vs=hou.getenv("VS"),
        name=name,
        version=version
    )

    me.parm("read_path").set(path)
    read_meta(kwargs)
    success = 1
    for i in range(0, geo_seq_amount):
        if geo_seq_load == 0:
            geo_sequence = me.parm("geo_sequence").unexpandedString()
        else:
            parm = ut.multiparm(me, "multi_geo_sequence", i + 1)
            geo_sequence = parm.unexpandedString()

        filepath = os.path.join(path, geo_sequence)

        if "Select " in filepath or "No " in filepath:
            ut.multiparm(me, "filepath", i + 1).set("")
            success = 0
        elif not geo_sequence:
            ut.multiparm(me, "filepath", i + 1).set("Please select a sequence")
        else:
            ut.multiparm(me, "filepath", i + 1).set(filepath)
    return success


def read_exports_list():
    def format_cache(cache):
        name = cache.get("name", "")
        split = name.split(".")
        split.pop(0)
        name_clean = ".".join(split)
        if ends_with_version:
            name_clean_split = name_clean.split("_")
            name_clean = "_".join(name_clean_split[:-1])
        cache["name"] = name
        return cache

    asset_config = vs.get_asset_config("fxcache")
    ends_with_version = asset_config.get("folder", "").endswith("v{version}")
    wd = hou.getenv("WD", "Nope").rstrip("/")
    wa = "/".join(wd.split("/")[:-1])
    file = os.path.join(wa, "exports_list.json")
    if not os.path.isfile(file):
        return []
    with open(file, "r") as f:
        data = json.load(f)
    if not data:
        return []

    fxcaches = [d for d in data.get("data", {}).values() if d.get("type") == "fxcache"]
    formatted = [format_cache(c) for c in fxcaches]

    return formatted


def fetch_caches(kwargs):
    me = kwargs["node"]

    wd = hou.getenv("WD", "Nope")

    caches = []
    path = os.path.join(wd, "cache", "fxcache")
    cache_caches = []
    if os.path.isdir(path):
        cache_caches = os.listdir(path)
    for name in cache_caches:
        cache = "{}/{}".format("cache", name)
        if cache not in caches:
            caches.append(cache)

    export_caches = read_exports_list()
    for cache_data in export_caches:
        name = cache_data.get("name")
        cache = "{}/{}".format("exports", name)
        if cache not in caches:
            caches.append(cache)

    cache_list = ",".join(caches)
    cache_name_parm = me.parm("cache_name")
    if not cache_list:
        cache_list = "No caches found"
    else:
        if (
            cache_name_parm.evalAsString() not in cache_list
            or not cache_name_parm.evalAsString()
        ):
            cache_name_parm.revertToDefaults()
    me.parm("cache_list").set(cache_list)
    build_path(kwargs)


def fetch_versions(kwargs):
    me = kwargs["node"]

    name = me.evalParm("cache_name")
    folder = "cache"
    if "/" in name:
        folder = name.split("/")[0]
        name = name.split("/")[1]

    version_list_parm = me.parm("version_list")

    if folder == "cache":
        versions = find_cache_versions(kwargs)
    else:
        versions = find_exports_versions(kwargs)

    if len(versions) > 0:
        version_list = ",".join(versions)
        version_list_parm.set(version_list)
    else:
        version_list_parm.set("No versions found")
    fetch_geo_sequences(kwargs)
    build_path(kwargs)
    read_meta(kwargs)


def find_cache_versions(kwargs):
    me = kwargs["node"]

    wd = hou.getenv("WD", "Nope")
    name = me.evalParm("cache_name").split("/")[-1]

    search_path = os.path.join(wd, "cache/fxcache", name)
    versions = []
    if os.path.isdir(search_path):
        versions = os.listdir(search_path)
        versions = sorted(versions, reverse=True)

    return versions


def find_exports_versions(kwargs):
    me = kwargs["node"]

    name = me.evalParm("cache_name").split("/")[-1]
    export_caches = read_exports_list()

    filtered = [c for c in export_caches if c.get("name") == name]
    versions = [str(c.get("version", "")) for c in filtered]
    versions = sorted(list(set(versions)), reverse=True)
    versions = ["v" + v.zfill(3) for v in versions]

    return versions


def fetch_geo_sequences(kwargs):
    me = kwargs["node"]

    name = me.evalParm("cache_name")
    folder = "cache"
    if "/" in name:
        folder = name.split("/")[0]
        name = name.split("/")[1]
    version = me.parm("version").evalAsString()
    geo_seq_list_parm = me.parm("geo_sequence_list")

    if folder == "exports":
        asset_config = vs.get_asset_config("fxcache")
        folder = "{}_{}".format(folder, asset_config.get("schema", "1.0"))
    path = PATH_TEMPLATES[folder]
    path = path.format(
        export_dir=get_export_dir(kwargs),
        wa=hou.getenv("WA"),
        vs=hou.getenv("VS"),
        name=name,
        version=version
    )
    path = hou.expandString(path)
    geo_seq_list = ""
    if os.path.isdir(path):
        collections, remainder = clique.assemble(
            sorted(os.listdir(path)), patterns=[clique.PATTERNS['frames']]
        )
        for item in collections:
            sequence_string = item.format("{head}{padding}{tail}")
            sequence_string2 = "{}".format(sequence_string)
            for section in sequence_string2.split("."):
                if "%" in section:
                    padding = ""
                    try:
                        padding = str(int(re.findall(r"\d+", section)[0]))
                    except IndexError:
                        pass
                    padding = "`ch(\"read_frame\")`"
                    sequence_string = sequence_string.replace(section, padding)
            if sequence_string not in geo_seq_list:
                geo_seq_list += sequence_string + " "
        for item in remainder:
            sequence_string = item.format("{head}{padding}{tail}")
            if (
                ".bgeo" in sequence_string
                or sequence_string.endswith(".abc")
                or sequence_string.endswith(".vdb")
            ):
                if sequence_string not in geo_seq_list:
                    geo_seq_list += sequence_string + " "
        geo_seq_list = geo_seq_list.strip()
        geo_seq_list = ",".join(sorted(geo_seq_list.split()))
        geo_seq_list_parm.set(geo_seq_list.strip())
    else:
        geo_seq_list_parm.set("No sequences found")


def read_meta(kwargs):
    me = kwargs["node"]

    path = me.evalParm("read_path")
    filepath01 = "".join((path, "meta01.txt"))
    filepath02 = "".join((path, "meta02.txt"))
    if os.path.isfile(filepath01) and os.path.isfile(filepath02):
        file01 = open(filepath01, "r")
        file02 = open(filepath02, "r")
        contents01 = "".join(file01.readlines())
        contents02 = "".join(file02.readlines())
        file01.close()
        file02.close()

        me.parm("meta01").set(contents01)
        me.parm("meta02").set(contents02)
    else:
        me.parm("meta01").revertToDefaults()
        me.parm("meta02").revertToDefaults()
