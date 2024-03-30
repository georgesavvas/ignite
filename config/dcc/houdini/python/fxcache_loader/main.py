import os
import re
import logging
from pathlib import PurePath, Path

import ignite_houdini as ign

import hou


log = logging.getLogger(__name__)
log.setLevel(hou.getenv("IGNITE_LOGLEVEL", "DEBUG"))


PATH_TEMPLATES = {
    "cache": "{export_dir}/{name}/{version}",
    "exports": "{export_dir}/{name}/{version}",
}

CACHE_DIR_VARS = {"cache": "$CACHE", "exports": "$EXPORTS"}


def get_sequences_remainder(path):
    pattern = re.compile(r"\.(?P<frame>\d*)\.")
    sequences = {}
    remainder = []
    for item in Path(path).iterdir():
        name = item.name
        matches = list(re.finditer(pattern, name))
        if matches:
            last_match = matches[-1]
            m = last_match.groupdict()
            last_start = last_match.start()
            last_end = last_match.end()
            filename = name[:last_start]
            frame = m["frame"]
            ext = name[last_end:]
            data = {"file": item, "name": filename, "frame": frame, "ext": f".{ext}"}
            key = f"{filename}.{ext}"
            if sequences.get(key):
                sequences[key].append(data)
            else:
                sequences[key] = [data]
            continue

        data = {"file": item, "name": item.stem, "frame": "", "ext": item.suffix}
        remainder.append(data)
    keys_to_pop = []
    for name, data in sequences.items():
        if len(data) == 1:
            keys_to_pop.append(name)
    for key in keys_to_pop:
        remainder.append(sequences.pop(key)[0])
    sequences_processed = []
    names_added = set()
    for name, seq in sequences.items():
        indices = sorted([int(item["frame"]) for item in seq])
        start = indices[0]
        end = indices[-1]
        padding = len(str(end))
        s = seq[0]
        if name in names_added:
            continue
        path = s["name"] + "." + "#" * padding + s["ext"]
        sequences_processed.append(
            {
                "path": path,
                "name": s["name"],
                "start": start,
                "end": end,
                "padding": padding,
                "ext": s["ext"],
            }
        )
        names_added.add(name)
    remainder_processed = []
    for item in remainder:
        remainder_processed.append(
            {"path": item["file"].as_posix(), "ext": item["ext"]}
        )
    return sequences_processed, remainder_processed


def hda_created(kwargs):
    me = kwargs["node"]
    me.setColor(hou.Color((0.15, 0.15, 0.15)))


def hda_updated(kwargs):
    pass


def hda_loaded(kwargs):
    me = kwargs["node"]
    me.parm("reload").pressButton()


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


def cache_mode_changed(kwargs):
    version_changed(kwargs)


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


def change_version(kwargs, down=False):
    me = kwargs["node"]

    buttons_parm = me.parm("version_buttons")
    active = buttons_parm.evalAsInt()
    version_parm = me.parm("version")
    version = version_parm.evalAsString()
    buttons_parm.set(0)

    if not version:
        return

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

    if down:
        new_version = max(int(old_version) - 1, 0)
    else:
        new_version = max(int(old_version) + 1, 0)

    padded_ver = "{0:03d}".format(new_version)
    final_version = "{}{}{}".format(version[:start], padded_ver, version[end:])
    version_parm.set(final_version)
    version_changed(kwargs)


def version_down_pressed(kwargs):
    change_version(kwargs, down=True)


def version_up_pressed(kwargs):
    change_version(kwargs)


def version_latest_pressed(kwargs):
    me = kwargs["node"]

    fetch_versions(kwargs)
    version_parm = me.parm("version")
    versions = me.evalParm("version_list")
    latest_version = versions.split(",")[0]

    if versions:
        if version_parm.evalAsString() != latest_version:
            version_parm.set(latest_version)
            ign.user_print("Switched to latest version")
            version_changed(kwargs)
        else:
            ign.user_print("Already on latest version")
            version_changed(kwargs)
    else:
        version_parm.set("v001")
        ign.user_print("No versions found...")
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


def set_parm(parm, value, defaults=False):
    """Sets the parm to the given value if the parm does not contain any
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
            parm = ign.multiparm(me, "multi_geo_sequence", i + 1)

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
            parm = ign.multiparm(me, "multi_geo_sequence", i + 1)
            set_parm(parm, "", defaults=True)


def get_export_dir(kwargs):
    me = kwargs["node"]
    folder = me.parm("mode").evalAsString()
    return "$CACHE" if folder == "cache" else "$EXPORTS"
    # custom = me.evalParm("custom_target")
    # if not custom:
    #     return "$CACHE" if folder == "cache" else "$EXPORTS"
    # export_vars = {"silo": hou.getenv("SILO", ""), "project": hou.getenv("PROJECT", "")}
    # for var in ("type", "asset", "sequence", "shot", "task", "wa", "wav"):
    #     export_vars[var] = me.parm("target_" + var).evalAsString()
    # phases = {"asset": "build", "sandbox": "sandbox", "shot": "sequence"}
    # export_vars["phase"] = phases[export_vars["type"]]
    # export_vars["mode"] = folder

    # path = CUSTOM_EXPORT_TEMPLATE.format(**export_vars)
    # return path


def build_path(kwargs):
    me = kwargs["node"]

    folder = me.parm("mode").evalAsString()
    name = me.evalParm("cache_name")
    version = me.evalParm("version")
    geo_seq_load = me.evalParm("load_geo_seq")
    geo_seq_amount = me.evalParm("seq_amount")

    me.parm("filepaths_amount").set(geo_seq_amount)

    path = PATH_TEMPLATES[folder]
    path = path.format(
        export_dir=get_export_dir(kwargs),
        name=name,
        version=version,
    )

    me.parm("read_path").set(path)
    success = 1
    for i in range(0, geo_seq_amount):
        if geo_seq_load == 0:
            geo_sequence = me.parm("geo_sequence").unexpandedString()
        else:
            parm = ign.multiparm(me, "multi_geo_sequence", i + 1)
            geo_sequence = parm.unexpandedString()

        print(path, geo_sequence)
        filepath = PurePath(path, geo_sequence).as_posix()

        if "Select " in filepath or "No " in filepath:
            ign.multiparm(me, "filepath", i + 1).set("")
            success = 0
        elif not geo_sequence:
            ign.multiparm(me, "filepath", i + 1).set("Please select a sequence")
        else:
            ign.multiparm(me, "filepath", i + 1).set(filepath)
    return success


def fetch_caches(kwargs):
    me = kwargs["node"]

    folder = me.parm("mode").evalAsString()

    caches = []
    path = Path(hou.expandString(CACHE_DIR_VARS[folder]))
    for dir in path.iterdir():
        name = dir.name
        if name not in caches:
            caches.append(name)

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

    version_list_parm = me.parm("version_list")

    versions = find_cache_versions(kwargs)

    if len(versions) > 0:
        version_list = ",".join(versions)
        version_list_parm.set(version_list)
    else:
        version_list_parm.set("No versions found")
    fetch_geo_sequences(kwargs)
    build_path(kwargs)


def find_cache_versions(kwargs):
    me = kwargs["node"]

    folder = me.parm("mode").evalAsString()
    name = me.evalParm("cache_name")
    search_path = Path(hou.expandString(CACHE_DIR_VARS[folder])) / name
    versions = []
    if os.path.isdir(search_path):
        versions = os.listdir(search_path)
        versions = sorted(versions, reverse=True)

    return versions


def fetch_geo_sequences(kwargs):
    me = kwargs["node"]

    folder = me.parm("mode").evalAsString()
    name = me.evalParm("cache_name")
    version = me.parm("version").evalAsString()
    geo_seq_list_parm = me.parm("geo_sequence_list")

    path = PATH_TEMPLATES[folder]
    path = path.format(
        export_dir=get_export_dir(kwargs),
        name=name,
        version=version,
    )
    path = Path(hou.expandString(path))
    geo_seq_list = ""
    if path.is_dir():
        collections, remainder = get_sequences_remainder(path)
        for item in collections:
            sequence_string = item["path"].replace(
                "#" * item["padding"], '`ch("read_frame")`'
            )
            if sequence_string not in geo_seq_list:
                geo_seq_list += sequence_string + " "
        for item in remainder:
            if (
                item["ext"] in [".bgeo.sc", ".abc", ".vdb"]
                and item["path"] not in geo_seq_list
            ):
                # shortened = item["path"].replace(
                #     path.as_posix(), CACHE_DIR_VARS[folder]
                # )
                # shortened = str(PurePath(shortened))
                geo_seq_list += item["path"].split("/")[-1] + " "
        geo_seq_list = geo_seq_list.strip()
        geo_seq_list = ",".join(sorted(geo_seq_list.split()))
        geo_seq_list_parm.set(geo_seq_list.strip())
    else:
        geo_seq_list_parm.set("No sequences found")
