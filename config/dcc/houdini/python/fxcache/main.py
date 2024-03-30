import os
import re
import numpy
import logging
from itertools import product
from string import digits
from pathlib import PurePath, Path

import ignite_houdini as ign

import hou


log = logging.getLogger(__name__)
log.setLevel(hou.getenv("IGNITE_LOGLEVEL", "DEBUG"))


CACHE_MODES = {0: "cache", 1: "exports"}
PATH_TEMPLATES = {
    "cache": "{export_dir}/{name}/{version}",
    "exports": "{export_dir}/{name}/{version}",
}
FILENAME_TEMPLATES = {
    "cache": {
        "bgeo": '`chs("cache_name")`{wedging}.`chs("frame")`.bgeo.sc',
        "abc": '`chs("cache_name")`{wedging}.abc',
        "vdb": '`chs("cache_name")`{wedging}.`chs("frame")`.vdb',
        "ass": '`chs("cache_name")`{wedging}.`chs("frame")`.ass',
        "usdc": '`chs("cache_name")`{wedging}.usdc',
        "usdc seq": '`chs("cache_name")`{wedging}.`chs("frame")`.usdc',
        "fbx": '`chs("cache_name")`{wedging}.fbx',
    },
    "exports": {
        "bgeo": 'main.`chs("frame")`.bgeo.sc',
        "abc": "main.abc",
        "vdb": 'main.`chs("frame")`.vdb',
        "ass": 'main.`chs("frame")`.ass',
        "usdc": "main.usdc",
        "usdc seq": 'main.`chs("frame")`.usdc',
        "fbx": "main.fbx",
    },
}
CACHE_DIR_VARS = {"cache": "$CACHE", "exports": "$EXPORTS"}


def update_switch(node, event_type, **kwargs):
    pass
    # switch = node.node("switch")
    # switch.cook(force=True, frame_range=(1001, 1001))


def deselect_workitem_pressed(kwargs):
    deselect_workitem(kwargs)


def rebuild_path_pressed(kwargs):
    select_rop(kwargs)
    build_path(kwargs)


def cache_main_thread_pressed(kwargs):
    local_cache(kwargs)


def hda_created(kwargs):
    me = kwargs["node"]
    me.setColor(hou.Color((0.15, 0.15, 0.15)))

    range_type_changed(kwargs)

    if is_sop(kwargs):
        create_wedge_nodes(kwargs)
        create_post_process_nodes(kwargs)
        set_loader_parms(kwargs)
        me.addEventCallback((hou.nodeEventType.AppearanceChanged,), update_switch)
    build_path(kwargs)


def hda_updated(kwargs):
    me = kwargs["node"]
    me.setColor(hou.Color((0.15, 0.15, 0.15)))

    if is_sop(kwargs):
        set_loader_parms(kwargs)
    build_path(kwargs)


def hda_loaded(kwargs):
    me = kwargs["node"]
    press_button(me, "reload")


def hda_renamed(kwargs):
    check_descriptive_name(kwargs)


def is_sop(kwargs):
    me = kwargs["node"]
    type_name = me.type().category().name()
    return type_name == "Sop"


def set_parm(node, parm_name, value):
    parm = node.parm(parm_name)
    if not parm:
        return
    parm.set(value)


def press_button(node, parm_name):
    parm = node.parm(parm_name)
    if not parm:
        return
    parm.pressButton()


def check_descriptive_name(kwargs):
    me = kwargs["node"]
    cache_name = me.evalParm("cache_name")
    node_name = me.name()
    desc_parm = me.parm("descriptive_name")

    if cache_name not in node_name:
        desc_parm.set(cache_name)
    else:
        desc_parm.set("")


def deselect_workitem(kwargs):
    me = kwargs["node"]
    me.node("topnet").setSelectedWorkItem(-1)
    update_switch(me, None)


def cache_mode_changed(kwargs):
    version_changed(kwargs)
    if is_sop(kwargs):
        build_wedge_lists(kwargs)
    build_path(kwargs)


def extension_changed(kwargs):
    select_rop(kwargs)
    build_filename(kwargs)


def load_all_wedges_changed(kwargs):
    me = kwargs["node"]
    loader = me.node("GeoLoader")
    press_button(loader, "reload")


def version_menu_used(kwargs):
    fetch_versions(kwargs)


def local_cache(kwargs, background=False):

    def execute():
        if path_ready:
            hou.hipFile.save()
            save_to_disk.pressButton()
        elif hou.ui.isUIAvailable():
            m = "Unable to build filepath, please check your settings"
            hou.ui.displayMessage(m)

    me = kwargs["node"]
    mode = me.parm("mode").evalAsString()
    path_ready = build_path(kwargs)
    if not path_ready:
        return
    rop = get_rop(kwargs)

    save_to_disk = rop.parm("executebackground") if background else rop.parm("execute")

    if me.evalParm("wedge_tog"):
        if not hou.isUIAvailable():
            return
        m = "Non TOPs caching does not support wedging, please use the cache button on the left."
        hou.ui.displayMessage(m)
        return

    execute()

    if mode == "exports":
        update_preview(kwargs)

    press_button(me.node("GeoLoader"), "rebuild_path")
    press_button(me.node("GeoLoader"), "reload")
    deselect_workitem(kwargs)


def cache_pressed(kwargs):
    me = kwargs["node"]

    # action = me.evalParm("cache_publish")
    path_ready = build_path(kwargs)

    wedge = me.node("topnet/geoexport/pre_process/wedge")

    rop = me.node("topnet/geoexport/ropfetch")
    out = me.node("topnet/geoexport/OUT")

    if path_ready:
        hou.hipFile.save()
        rop.dirtyAllTasks(0)
        wedge.dirtyAllTasks(0)
        out.executeGraph(0, 0, 0, 0)

    if is_sop(kwargs):
        press_button(me.node("GeoLoader"), "rebuild_path")
        press_button(me.node("GeoLoader"), "reload")
        deselect_workitem(kwargs)


def generate_items(kwargs):
    me = kwargs["node"]
    path = "topnet/geoexport/ropfetch"
    if not is_sop(kwargs):
        path = "ropfetch"
        return
    rop = me.node(path)
    rop.cookWorkItems(generate_only=True)


def name_changed(kwargs):
    me = kwargs["node"]
    parm = me.parm("cache_name")
    name = parm.evalAsString()
    if " " in name:
        name = name.replace(" ", "_")
        parm.set(name)

    rename_self(kwargs)
    check_descriptive_name(kwargs)
    if is_sop(kwargs):
        nudge_loader_seq(kwargs)
    build_filename(kwargs)


def rename_self(kwargs):
    me = kwargs["node"]

    parm = me.parm("cache_name")
    cache_name = parm.evalAsString()
    remove_digits = str.maketrans("", "", digits)
    node_name = me.name().translate(remove_digits)

    if node_name.lower() == "geoexport":
        me.setName("geoexport_" + cache_name, unique_name=True)


def version_changed(kwargs, force_reload=False):
    me = kwargs["node"]

    version_parm = me.parm("cache_version")
    version = version_parm.evalAsString()
    version = version.replace(" ", "_").replace("/", "_").replace("\\", "_")
    if not version.startswith("v"):
        version = "".join(("v", version))
    if not version_parm.keyframes() and "`" not in version_parm.unexpandedString():
        version_parm.set(version)

    if is_sop(kwargs) or force_reload:
        reload_geo_pressed(kwargs)
        nudge_loader_seq(kwargs)


def version_down_pressed(kwargs):
    change_version(kwargs, down=True)


def version_up_pressed(kwargs):
    change_version(kwargs)


def change_version(kwargs, down=False):
    me = kwargs["node"]

    version_parm = me.parm("cache_version")
    version = version_parm.evalAsString()

    if not version:
        return

    pattern = re.compile(r"\d+")
    numbers = list(pattern.finditer(version))
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
    version_changed(kwargs, force_reload=True)


def version_latest_pressed(kwargs):
    me = kwargs["node"]
    fetch_versions(kwargs)
    version_parm = me.parm("cache_version")
    versions = me.parm("version_list").evalAsString()
    if versions:
        latest_version = versions.split(",")[0]
        if version_parm.evalAsString() != latest_version:
            version_parm.set(latest_version)
            ign.user_print("Switched to latest version")
            version_changed(kwargs, force_reload=True)
            build_path(kwargs)
        else:
            ign.user_print("Already on latest version")
            version_changed(kwargs, force_reload=True)
    else:
        version_parm.set("v001")
        ign.user_print("No versions found...")
        version_changed(kwargs, force_reload=True)


def range_type_changed(kwargs):
    me = kwargs["node"]
    static = me.parm("range_type").evalAsString() == "static"
    frame_parm_name = "read_frame" if is_sop(kwargs) else "frame"
    frame_parm = me.parm(frame_parm_name)

    if static:
        frame_parm.set(me.parm("write_frame"))
    else:
        frame_parm.revertToDefaults()

    update_preview(kwargs)


def write_frame_changed(kwargs):
    update_preview(kwargs)


def custom_target_changed(kwargs):
    if is_sop(kwargs):
        return
    build_filename(kwargs)


def get_export_dir(kwargs):
    me = kwargs["node"]
    mode = me.parm("mode").evalAsString()
    return CACHE_DIR_VARS[mode]


def build_path(kwargs):
    me = kwargs["node"]

    write_path_parm = me.parm("write_path")

    mode = me.parm("mode").evalAsString()

    path_template = PATH_TEMPLATES[mode]
    path = path_template.format(
        export_dir=get_export_dir(kwargs),
        name='`chs("cache_name")`',
        version='`chs("cache_version")`',
    )

    success = 0
    if "Select " in path or "No " in path:
        write_path_parm.set("Unable to build filepath")
    else:
        write_path_parm.set(path)
        success = 1

    update_preview(kwargs)

    return success


def build_filename(kwargs):
    me = kwargs["node"]

    name = me.evalParm("cache_name")
    extension = me.parm("extension").evalAsString()
    version = me.evalParm("cache_version")

    wedging = ""
    if is_sop(kwargs):
        wedging = format_wedges(kwargs)
    filename_parm = me.parm("filename")
    if filename_parm.unexpandedString() == '`chs("../../filename")`':
        update_preview(kwargs)
        return

    mode = me.parm("mode").evalAsString()
    filename_template = FILENAME_TEMPLATES[mode][extension]
    filename = filename_template.format(
        name=name, version=version, wedging=wedging, extension=extension
    )
    filename_parm.set(filename)
    update_preview(kwargs)


def update_preview(kwargs):
    me = kwargs["node"]

    path = me.evalParm("write_path")

    filename = me.evalParm("filename")

    cache = hou.getenv("CACHE")
    exports = hou.getenv("EXPORTS")

    path_short = path
    if path_short.startswith(cache):
        path_short = path_short.replace(cache, "$CACHE")
    elif path_short.startswith(exports):
        path_short = path_short.replace(exports, "$EXPORTS")

    me.parm("write_path_preview").set(str(PurePath(path_short, filename)))
    generate_items(kwargs)


def filename_changed(kwargs):
    update_preview(kwargs)


def fetch_versions(kwargs):
    me = kwargs["node"]

    mode = CACHE_MODES[me.evalParm("mode")]
    if mode == "cache":
        name = me.evalParm("cache_name")
        path_template = PATH_TEMPLATES[mode].split("{version}")[0]
        path = path_template.format(export_dir=get_export_dir(kwargs), name=name)
        path = Path(hou.expandString(path))
        versions = []
        if path.is_dir():
            versions = list(path.iterdir())
            versions = sorted(versions, reverse=True)
            version_list = ",".join(versions)
            me.parm("version_list").set(version_list)
            build_path(kwargs)
        else:
            me.parm("version_list").set("")
            ign.user_print("No versions found...")


def reload_geo_pressed(kwargs):
    me = kwargs["node"]
    if is_sop(kwargs):
        loader = me.node("GeoLoader")
    else:
        loader = me.node("../../GeoLoader")

    press_button(loader, "reload")
    nudge_loader_seq(kwargs)


def nudge_loader_seq(kwargs):
    me = kwargs["node"]
    if is_sop(kwargs):
        loader = me.node("GeoLoader")
    else:
        loader = me.node("../../GeoLoader")
    if "`" not in loader.parm("geo_sequence").unexpandedString():
        loader.parm("geo_sequence").set('`chs("../filename")`', follow_parm_reference=0)


# SOP ONLY
def wedging_changed(kwargs):
    build_wedge_lists(kwargs)
    build_filename(kwargs)


def get_wedges(kwargs):
    """Return a list of dictionaries of wedging info. Each dictionary has
    all the variable names and their list of values for the current iteration.
    """

    me = kwargs["node"]
    # sync = me.evalParm("sync_wedges")
    # if sync:
    #     source = me.parm("sync_wedges_node").evalAsNode()
    #     if source.type() == me.type():
    #         me = source
    wedging_tog = me.evalParm("wedge_tog")
    amount = me.evalParm("wedge_count")
    amount *= wedging_tog

    if amount:
        var_names = []
        var_values = []
        for i in range(0, amount):
            var_names.append(ign.multiparm(me, "wedge_var", i + 1).eval())
            var_values.append(ign.multiparm(me, "wedging_final_single", i + 1).eval())

        var_lists = []
        wedges = []
        for values in var_values:
            var_lists.append(values.split(","))
        for subset in product(*var_lists):
            wedge_dict = {}
            for i in range(0, len(subset)):
                wedge_dict[var_names[i]] = subset[i]
            wedges.append(wedge_dict)
    else:
        wedges = None
    return wedges


def format_wedges(kwargs):
    me = kwargs["node"]
    wedging_tog = me.evalParm("wedge_tog")
    if not wedging_tog:
        return ""
    # sync = me.evalParm("sync_wedges")
    # if sync:
    #     source = me.parm("sync_wedges_node").evalAsNode()
    #     if source.type() == me.type():
    #         me = source
    amount = me.evalParm("wedge_count")

    if amount >= 1:
        var_names = []
        for i in range(0, amount):
            var_name = ign.multiparm(me, "wedge_var", i + 1).evalAsString()
            var_names.append(var_name)
        temp = "{}`@{}`"
        formatted = [temp.format(var.lower(), var) for var in var_names]
        s = "_".join(formatted)
        s = "_" + s
    else:
        s = ""

    return s


def build_wedge_lists(kwargs):
    if not is_sop(kwargs):
        return
    me = kwargs["node"]
    precision = me.parm("wedge_float_precision").evalAsInt()
    precision = float("1".ljust(precision + 1, "0"))
    wedging_tog = me.evalParm("wedge_tog")
    amount = me.evalParm("wedge_count")
    values_multi_parm = me.parm("wedging_final_multi")
    final_values_amount = 1

    wedge = me.node("topnet/geoexport/pre_process/wedge")

    amount *= wedging_tog
    if amount >= 1:

        var_names = []
        var_values = []
        var_values_comma = []

        # Set the variables amount on the scheduler node.
        # Set the variables amount on the wedge node, as well as the final
        # amount of wedges.
        wedge.parm("wedgecount").set(final_values_amount)
        wedge.parm("wedgeattributes").set(amount)

        for i in range(0, amount):
            index = i + 1

            # For each variable...

            # Get the variable name and type, as well as if solo is enabled.
            solo = ign.multiparm(me, "solo", index).evalAsInt()
            var_type = ign.multiparm(me, "wedging_type", index).evalAsInt()
            var_name = ign.multiparm(me, "wedge_var", index).evalAsString()

            if var_name:
                var_names.insert(i, var_name)

                wedge.parm("name{}".format(index)).set(var_names[i])

                # If integer...
                if var_type == 0:

                    # Get start/end ranges of needed values as well as number
                    # of samples.
                    parm = me.parmTuple("wedging_int_range_{}".format(index))
                    start = parm.eval()[0]
                    parm = me.parmTuple("wedging_int_range_{}".format(index))
                    end = parm.eval()[1]
                    parm = me.parm("wedging_int_samples_{}".format(index))
                    samples = parm.evalAsInt()

                    if solo:
                        samples = 1
                        value = ign.multiparm(me, "solo_int", index).evalAsInt()
                        var_values.insert(i, str(value))
                        var_values_comma.insert(i, var_values[i])
                    else:
                        if samples <= 1:
                            var_values.insert(i, str(start))
                            var_values_comma.insert(i, var_values[i])
                        else:
                            values = numpy.linspace(start, end, samples)
                            var_values.insert(i, "")
                            var_values_comma.insert(i, "")
                            for value in values:
                                var_values[i] += str(int(value)) + " "
                                var_values_comma[i] += str(int(value)) + ","

                        var_values[i] = (
                            var_values[i][:-1] if len(var_values) > 1 else var_values[i]
                        )
                        var_values_comma[i] = (
                            var_values_comma[i][:-1]
                            if len(var_values_comma) > 1
                            else var_values_comma[i]
                        )

                    # Set the variable type on the wedge (topnet) node to
                    # integer, the wedge type to "value list" and also set the
                    # actual value list.
                    wedge.parm("type{}".format(index)).set(2)
                    wedge.parm("wedgetype{}".format(index)).set(2)
                    wedge.parm("values{}".format(index)).set(samples)

                    var_value_list = var_values[i].split()
                    for i2 in range(0, samples):
                        var_value = var_value_list[i2]
                        wedge.parm("intvalue{}_{}".format(index, i2 + 1)).set(
                            int(var_value)
                        )

                elif var_type == 1:
                    start = me.parmTuple("wedging_float_range_{}".format(index)).eval()[
                        0
                    ]
                    end = me.parmTuple("wedging_float_range_{}".format(index)).eval()[1]
                    samples = ign.multiparm(
                        me, "wedging_float_samples", index
                    ).evalAsInt()

                    if solo:
                        samples = 1
                        var_values.insert(
                            i, str(ign.multiparm(me, "solo_float", index).evalAsFloat())
                        )
                        var_values_comma.insert(i, var_values[i])
                    else:
                        if samples <= 1:
                            var_values.insert(i, str(start))
                            var_values_comma.insert(i, var_values[i])
                        else:
                            values = numpy.linspace(start, end, samples)
                            var_values.insert(i, "")
                            var_values_comma.insert(i, "")
                            for value in values:
                                var_values[i] += (
                                    str(int(value * precision) / precision) + " "
                                )
                                var_values_comma[i] += (
                                    str(int(value * precision) / precision) + ","
                                )

                        var_values[i] = (
                            var_values[i][:-1] if len(var_values) > 1 else var_values[i]
                        )
                        var_values_comma[i] = (
                            var_values_comma[i][:-1]
                            if len(var_values_comma) > 1
                            else var_values_comma[i]
                        )

                    # topnet
                    wedge.parm("type{}".format(index)).set(0)
                    wedge.parm("wedgetype{}".format(index)).set(2)
                    wedge.parm("values{}".format(index)).set(samples)

                    var_value_list = var_values[i].split(" ")
                    for i2 in range(0, samples):
                        var_value = var_value_list[i2]
                        wedge.parm("floatvalue{}_{}".format(index, i2 + 1)).set(
                            float(var_value)
                        )

                else:
                    values = me.parm(
                        "wedging_string_list_{}".format(index)
                    ).evalAsString()
                    samples = len(values.split(","))
                    if solo:
                        samples = 1
                        var_values.insert(
                            i, ign.multiparm(me, "solo_str", index).evalAsString()
                        )
                        var_values_comma.insert(i, var_values[i])
                    else:
                        var_values.insert(i, values)
                        var_values_comma.insert(i, values)

                    # topnet
                    wedge.parm("type{}".format(index)).set(4)
                    wedge.parm("values{}".format(index)).set(samples)

                    var_value_list = var_values[i].split(",")
                    for i2 in range(0, samples):
                        var_value = var_value_list[i2]
                        wedge.parm("strvalue{}_{}".format(index, i2 + 1)).set(var_value)

                # Set up a temporary env var for the user to be able to
                # preview his scene, as well as not have all the nodes
                # seemingly error out.
                hou.putenv(var_names[i].upper(), var_values[i].split(",")[0])
                hou.hscript("varchange {}".format(var_names[i].upper()))

                me.parm("wedging_final_single_{}".format(index)).set(var_values[i])

                final_values_amount *= samples

            else:
                m = "Wedges not set up, please remove any empty variables."
                values_multi_parm.set(m)
                break

        else:

            # topnet
            wedge.parm("wedgecount").set(final_values_amount)

            var_lists = []
            wedge_print = ""
            for values_string in var_values:
                var_lists.append(values_string.split(","))
            if len(set(var_names)) < len(var_names):
                wedge_print = "***Possible variable name conflict***\n\n"
            wedge_print = "{}Total iterations: {}\n".format(
                wedge_print, final_values_amount
            )
            for subset in product(*var_lists):
                for i in range(0, len(subset)):
                    wedge_print = "".join(
                        (wedge_print, var_names[i], ": ", subset[i], ", ")
                    )
                wedge_print = wedge_print[:-2]
                wedge_print = "".join((wedge_print, "\n"))
            values_multi_parm.set(str(wedge_print))

    else:
        # Set the variables amount on the scheduler node.
        # Set the variables amount on the wedge node, as well as the final
        # amount of wedges.
        wedge.parm("wedgecount").set(0)
        wedge.parm("wedgeattributes").set(0)


def set_loader_parms(kwargs):
    me = kwargs["node"]

    loader = me.node("GeoLoader")
    if not loader:
        return

    parms = {
        "cache_name": '`chs("../cache_name")`',
        "version": '`chs("../cache_version")`',
    }

    expr_parms = {
        "mode": 'ch("../mode")',
        "load_geo_seq": 'if(ch("../wedge_load_all"),2,0)',
        "clamp_pre": 'if(ch("../read_clamp"), ch("../clamp_pre"), 1)',
        "clamp_post": 'if(ch("../read_clamp"), ch("../clamp_post"), 1)',
        "read_clamp": 'ch("../read_clamp")',
        "read_frame": 'if(ch("../write_static"), ch("../write_frame"), ch("../read_frame"))',
        "read_clamp_rangex": 'ch("../read_clamp_rangex")',
        "read_clamp_rangey": 'ch("../read_clamp_rangey")',
    }

    for parm, value in parms.items():
        loader.parm(parm).deleteAllKeyframes()
        loader.parm(parm).revertToDefaults()
        loader.parm(parm).set(value, follow_parm_reference=False)

    for parm, value in expr_parms.items():
        loader.parm(parm).deleteAllKeyframes()
        loader.parm(parm).revertToDefaults()
        loader.parm(parm).setExpression(value)


def get_geoexport(kwargs):
    me = kwargs["node"]
    if is_sop(kwargs):
        geoexport = me.node("topnet/geoexport")
    else:
        geoexport = me
    return geoexport


def get_rop(kwargs):
    geoexport = get_geoexport(kwargs)
    fformat = geoexport.parm("extension").evalAsString()
    rops = {
        "bgeo": "ropnet/geometry",
        "abc": "ropnet/alembic",
        "vdb": "ropnet/geometry",
        "usdc": "ropnet/usd",
        "usdc seq": "ropnet/usd",
        "fbx": "ropnet/filmboxfbx",
        "ass": "ropnet/arnold",
    }
    rop = geoexport.node(rops[fformat])
    return rop


def select_rop(kwargs):
    me = kwargs["node"]
    rop = get_rop(kwargs)
    me.parm("roppath").set(me.relativePathTo(rop))


def create_wedge_nodes(kwargs):
    if not is_sop(kwargs):
        return
    me = kwargs["node"]
    subnet = me.node("topnet/geoexport/pre_process")
    for child in subnet.children():
        if child.type().name() == "wedge":
            return
    first_input = subnet.item("1")
    pos = first_input.position()
    switch = subnet.createNode("switch", "switch")
    value = 'ch("../../../../mode")==0&&ch("../../../../wedge_tog")&&ch("../../../../extension")==0'
    switch.parm("input").setExpression(value)
    wait = subnet.createNode("waitforall", "waitforall")
    wait.setNextInput(first_input)
    script = subnet.createNode("pythonscript", "setup_wedge_node")
    code = """import hou
from fxcache import main

kwargs = {}
kwargs["node"] = hou.node("../../../..")

main.build_wedge_lists(kwargs)"""
    script.parm("script").set(code)
    script.setNextInput(wait)
    wedge = subnet.createNode("wedge", "wedge")
    wedge.parm("pdg_workitemgeneration").set(1)
    wedge.parm("exportenvironment").set(1)
    wedge.setNextInput(script)
    switch.setNextInput(first_input)
    switch.setNextInput(wedge)
    switch.setGenericFlag(hou.nodeFlag.Display, 1)
    switch.setPosition(pos)
    switch.move((0, -4))
    wait.setPosition(pos)
    wait.move((2, -2))
    script.setPosition(pos)
    script.move((2, -4))
    wedge.setPosition(pos)
    wedge.move((2, -6))


def create_post_process_nodes(kwargs):
    if not is_sop(kwargs):
        return
    me = kwargs["node"]
    subnet = me.node("topnet/geoexport/post_process")
    for child in subnet.children():
        if child.type().name() == "waitforall":
            return
    first_input = subnet.item("1")
    pos = first_input.position()
    wait = subnet.createNode("waitforall", "waitforall")
    script = subnet.createNode("pythonscript", "pythonscript")
    script.parm("script").set(
        "\n".join(
            (
                "me = self.topNode()",
                'loader = me.parent().parent().parent().parent().node("GeoLoader")',
                'loader.parm("reload").pressButton()',
            )
        )
    )
    wait.setNextInput(first_input)
    script.setNextInput(wait)
    script.setGenericFlag(hou.nodeFlag.Display, 1)
    wait.setPosition(pos)
    wait.move((0, -2))
    script.setPosition(pos)
    script.move((0, -4))
