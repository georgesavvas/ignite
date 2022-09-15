from __future__ import absolute_import, division, unicode_literals, print_function
import os
import re
import numpy
import logging
from itertools import product
from datetime import datetime
from string import digits

from importlib import reload

import hou

import volt_houdini_session as vhs
import volt_shell as vs

import gtools.utils as ut
from . import constants

reload(ut)
reload(constants)

from .constants import PATH_TEMPLATES, FILENAME_TEMPLATES, CACHE_MODES


log = logging.getLogger(__name__)
log.setLevel(hou.getenv("GEOCACHE_LOGLEVEL", "DEBUG"))
log.debug("Init.")


def hda_created(kwargs):
    me = kwargs["node"]
    me.setColor(hou.Color((0.15, 0.15, 0.15)))

    set_loader_parms(kwargs)


def hda_updated(kwargs):
    me = kwargs["node"]
    me.setColor(hou.Color((0.15, 0.15, 0.15)))

    set_loader_parms(kwargs)
    build_path(kwargs)


def hda_loaded(kwargs):
    me = kwargs["node"]
    me.parm("reload").pressButton()


def documentation_pressed(kwargs):
    import webbrowser as wb

    wb.open("http://et-vfx.etc.io/docs/cg/tools/houdini/hdas/geocache/")


def submit_bug_pressed(kwargs):
    from PySide2 import QtCore
    from gtools import submit_bug_window

    reload(submit_bug_window)
    window = submit_bug_window.SubmitBug(hda_name="GeoCache", labels=["geocache,"])
    window.setParent(hou.qt.mainWindow(), QtCore.Qt.Window)
    window.show()


def submit_rfe_pressed(kwargs):
    from PySide2 import QtCore
    from gtools import submit_rfe_window

    reload(submit_rfe_window)
    window = submit_rfe_window.SubmitRFE(
        hda_name="GeoCache", labels=["geocache", "RFE"]
    )
    window.setParent(hou.qt.mainWindow(), QtCore.Qt.Window)
    window.show()


def discover_pressed(kwargs):
    me = kwargs["node"]
    parm_group = me.parmTemplateGroup()
    for i in range(0, 10):
        folder = hou.FolderParmTemplate("test_folder_" + str(i), "test_cache_" + str(i))
        folder.setFolderType(hou.folderType.Collapsible)
        folder.addParmTemplate(
            hou.ToggleParmTemplate("test_toggle_" + str(i), "v001 - 5gb")
        )
        parm_group.appendToFolder("Manage", folder)
    me.setParmTemplateGroup(parm_group)


def delete_pressed(kwargs):
    pass


def cache_mode_changed(kwargs):
    version_changed(kwargs)
    build_wedge_lists(kwargs)
    build_filename(kwargs)


def tops_finished_pressed(kwargs):
    tops_finished(kwargs)


def set_last_export(kwargs):
    me = kwargs["node"]

    mode = CACHE_MODES[me.evalParm("volt_cache_dir")]
    parm = me.parm("last_exports_version")

    if mode == "exports":
        parm.set("{}_{}".format(hou.getenv("WA"), hou.getenv("VS")))


def prep_arnie_export(kwargs):
    me = kwargs["node"]
    root = hou.node("/obj")
    geo_in = me.node("IN")
    name = "__geocache_ass_export_{}__"

    geo = root.node(name.format("geo"))
    if geo:
        geo.destroy()
    geo = root.createNode("geo", name.format("geo"))
    merge = geo.createNode("object_merge")
    merge.parm("objpath1").set(geo_in.path())
    merge.parm("xformtype").set(1)
    cam = root.node(name.format("cam"))
    if cam:
        cam.destroy()
    cam = root.createNode("cam", name.format("cam"))
    me.parm("forceobject").set(geo.name())
    me.parm("camera").set(cam.path())


def cleanup_arnie_export(kwargs):
    me = kwargs["node"]
    root = hou.node("/obj")

    name = "__geocache_ass_export_{}__"
    geo = root.node(name.format("geo"))
    geo.destroy()
    cam = root.node(name.format("cam"))
    cam.destroy()

    me.parm("forceobject").revertToDefaults()
    me.parm("camera").revertToDefaults()


def cache_locally_pressed(kwargs):
    me = kwargs["node"]

    path_ready = build_path(kwargs)

    check_tops(kwargs)
    write_meta(kwargs, mode=0)
    read_meta(kwargs)
    wedges = get_wedges(kwargs)

    mode = CACHE_MODES[me.evalParm("volt_cache_dir")]
    extension = me.parm("extension").evalAsString()
    parm = me.parm("cache_local_publish")
    if parm:
        action = parm.evalAsString()
    else:
        action = "untracked"

    rop = me.node("ropnet/geo")
    if extension == "abc":
        rop = me.node("ropnet/alembic1")
    elif extension == "ass":
        prep_arnie_export(kwargs)
        rop = me.node("ropnet/arnold1")
    elif extension == "usd":
        rop = me.node("ropnet/usd1")
    elif extension == "fbx":
        rop = me.node("ropnet/filmboxfbx1")
    save_to_disk = rop.parm("execute")
    if me.evalParm("cache_local_background"):
        if mode == "cache" or action == "untracked":
            save_to_disk = rop.parm("executebackground")

    def execute():
        if path_ready:
            set_last_export(kwargs)
            hou.hipFile.save()
            save_to_disk.pressButton()
        else:
            m = "Unable to build filepath, please check your settings"
            hou.ui.displayMessage(m)

    if wedges:
        for i in range(0, len(wedges)):
            var_names = wedges[i].keys()
            for name in var_names:
                hou.putenv(name.upper(), wedges[i][name])
                hou.hscript("varchange {}".format(name.upper()))
            execute()
    else:
        execute()

    me.node("geo_cache_loader").parm("rebuild_path").pressButton()
    me.node("geo_cache_loader").parm("reload").pressButton()

    if mode == "exports":
        filename = me.evalParm("write_path_preview")
        export_path = "/".join(filename.split("/")[0:-1])
        if action == "register":
            vs.workarea.register(export_path)
        elif action == "publish":
            vs.workarea.publish(export_path)
        vhs.application.save_scene()
        update_preview(kwargs)

    if extension == "ass":
        cleanup_arnie_export(kwargs)


def extension_changed(kwargs):
    build_filename(kwargs)


def load_all_wedges_changed(kwargs):
    me = kwargs["node"]
    loader = me.node("geo_cache_loader")

    loader.parm("reload").pressButton()


def version_menu_used(kwargs):
    fetch_versions(kwargs)


def cache_on_farm_pressed(kwargs):
    me = kwargs["node"]

    path_ready = build_path(kwargs)

    check_tops(kwargs)
    write_meta(kwargs, mode=1)
    read_meta(kwargs)

    extension = me.parm("extension").evalAsString()
    if extension == "ass":
        prep_arnie_export(kwargs)

    cue_submit = me.node("ropnet/cue_submit")
    save_and_submit = cue_submit.parm("save_and_submit")

    if path_ready:
        set_last_export(kwargs)
        save_and_submit.pressButton()
    else:
        m = "Unable to build filepath, please check your settings"
        hou.ui.displayMessage(m)

    me.node("geo_cache_loader").parm("rebuild_path").pressButton()
    me.node("geo_cache_loader").parm("reload").pressButton()

    if extension == "ass":
        cleanup_arnie_export(kwargs)
        hou.hipFile.save()


def cache_in_tops_pressed(kwargs):
    me = kwargs["node"]

    path_ready = build_path(kwargs)

    write_meta(kwargs, mode=2)
    read_meta(kwargs)
    wedge = me.node("topnet/wedge")

    rop = me.node("topnet/ropgeometry")
    out = me.node("topnet/OUT")
    save_work = me.parm("tops_save_work").evalAsInt()

    if path_ready:
        set_last_export(kwargs)
        if save_work:
            hou.hipFile.save()
        else:
            hou.hipFile.save()
        rop.dirtyAllTasks(0)
        wedge.dirtyAllTasks(0)
        out.executeGraph(0, 0, 0, 0)
        ut.user_print("Firing up TOPS...")
        me.setComment("TOPS cooking...")
        me.setGenericFlag(hou.nodeFlag.DisplayComment, 1)
    else:
        m = "Unable to build filepath, please check your settings"
        hou.ui.displayMessage(m)

    me.node("geo_cache_loader").parm("rebuild_path").pressButton()
    me.node("geo_cache_loader").parm("reload").pressButton()


def name_changed(kwargs):
    me = kwargs["node"]

    parm = me.parm("cache_name")
    name = parm.evalAsString()
    if " " in name:
        name = name.replace(" ", "_")
        parm.set(name)

    rename_self(kwargs)
    check_tops(kwargs)
    nudge_loader_seq(kwargs)
    build_filename(kwargs)
    read_meta(kwargs)


def hda_renamed(kwargs):
    me = kwargs["node"]
    cache_name = me.evalParm("cache_name")
    node_name = me.name()
    desc_parm = me.parm("descriptive_name")

    if cache_name not in node_name:
        desc_parm.set(cache_name)
    else:
        desc_parm.set("")


def rename_self(kwargs):
    me = kwargs["node"]

    parm = me.parm("cache_name")
    cache_name = parm.evalAsString()
    node_name = me.name().rstrip(digits)

    if node_name == "GeoCache":
        me.setName("geocache_" + cache_name, unique_name=True)


def version_changed(kwargs):
    me = kwargs["node"]

    version_parm = me.parm("cache_version")
    version = version_parm.evalAsString()
    prefix = me.parm("prefix_version").evalAsInt()
    version = version.replace(" ", "_").replace("/", "_").replace("\\", "_")
    if prefix:
        if not version.startswith("v"):
            version = "".join(("v", version))
    if not version_parm.keyframes() and "`" not in version_parm.unexpandedString():
        version_parm.set(version)
    pattern = re.compile(r"\d+")
    if len(list(pattern.finditer(version))) > 1:
        me.parm("tog_subversion").set(1)
    else:
        me.parm("tog_subversion").set(0)

    check_tops(kwargs)
    reload_geo_pressed(kwargs)
    nudge_loader_seq(kwargs)
    read_meta(kwargs)


def version_buttons_pressed(kwargs):
    change_version(kwargs, "version_buttons")


def subversion_buttons_pressed(kwargs):
    change_version(kwargs, "subversion_buttons")


def change_version(kwargs, buttons_parm_name):
    me = kwargs["node"]

    buttons_parm = me.parm(buttons_parm_name)
    active = buttons_parm.evalAsInt()
    version_parm = me.parm("cache_version")
    version = version_parm.evalAsString()
    buttons_parm.set(0)

    if (active == 1 or active == 2) and version:
        pattern = re.compile(r"\d+")
        index = 0
        if "subversion" in buttons_parm_name:
            index = -1
        match = list(pattern.finditer(version))[index]
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
    version_parm = me.parm("cache_version")
    versions = me.parm("version_list").evalAsString()
    if versions:
        latest_version = versions.split(" ")[0]
        if version_parm.evalAsString() != latest_version:
            version_parm.set(latest_version)
            ut.user_print("Switched to latest version")
            version_changed(kwargs)
            build_path(kwargs)
            read_meta(kwargs)
        else:
            ut.user_print("Already on latest version")
            version_changed(kwargs)
    else:
        version_parm.set("v001")
        ut.user_print("No versions found...")
        version_changed(kwargs)


def reload_geo_pressed(kwargs):
    me = kwargs["node"]
    me.node("geo_cache_loader").parm("reload").pressButton()
    check_tops(kwargs)
    nudge_loader_seq(kwargs)
    read_meta(kwargs)


def static_changed(kwargs):
    me = kwargs["node"]
    static = me.parm("write_static").evalAsInt()
    read_frame_parm = me.parm("read_frame")

    if static:
        read_frame_parm.set(me.parm("write_frame"))
    else:
        read_frame_parm.revertToDefaults()


def wedging_changed(kwargs):
    build_wedge_lists(kwargs)
    build_filename(kwargs)


def get_wedges(kwargs):
    """ Return a list of dictionaries of wedging info. Each dictionary has
    all the variable names and their list of values for the current iteration.
    """

    me = kwargs["node"]
    wedging_tog = me.evalParm("wedge_tog")
    amount = me.evalParm("wedging_vars")
    amount *= wedging_tog

    if amount:
        var_names = []
        var_values = []
        for i in range(0, amount):
            var_names.append(ut.multiparm(me, "wedge_var", i + 1).eval())
            var_values.append(ut.multiparm(me, "wedging_final_single", i + 1).eval())

        var_lists = []
        wedges = []
        for values in var_values:
            var_lists.append(values.split())
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
    amount = me.evalParm("wedging_vars")
    amount *= wedging_tog

    if amount >= 1:
        var_names = []
        for i in range(0, amount):
            var_name = ut.multiparm(me, "wedge_var", i + 1).evalAsString()
            var_names.append(var_name)
        temp = "{}`${}`"
        formatted = [temp.format(var.lower(), var.upper()) for var in var_names]
        s = "_".join(formatted)
        s = "_" + s
    else:
        s = ""

    return s


def build_path(kwargs):
    me = kwargs["node"]

    check_tops(kwargs)
    write_path_parm = me.parm("write_path")

    name = me.evalParm("cache_name")
    version = me.evalParm("cache_version")

    mode = CACHE_MODES[me.evalParm("volt_cache_dir")]

    if mode == "exports":
        asset_config = vs.get_asset_config("fxcache")
        mode = "exports_{}".format(asset_config.get("schema", "1.0"))
    path_template = PATH_TEMPLATES[mode]
    path = path_template.format(
        wa=hou.getenv("WA"), vs="$VS", name=name, version=version
    )

    success = 0
    if "Select " in path or "No " in path or "//" in path:
        write_path_parm.set("Unable to build filepath")
    else:
        write_path_parm.set(path)
        success = 1

    # build_filename(kwargs)
    update_preview(kwargs)

    return success


def build_filename(kwargs):
    me = kwargs["node"]

    check_tops(kwargs)
    name = me.evalParm("cache_name")
    extension = me.parm("extension").evalAsString()
    version = me.evalParm("cache_version")
    wedging = format_wedges(kwargs)
    filename_parm = me.parm("filename")

    mode = CACHE_MODES[me.evalParm("volt_cache_dir")]

    filename_template = FILENAME_TEMPLATES[mode][extension]
    filename = filename_template.format(
        name=name, version=version, wedging=wedging, extension=extension
    )

    filename_parm.lock(0)
    filename_parm.set(filename)
    if mode == "exports":
        filename_parm.lock(1)

    update_preview(kwargs)


def update_preview(kwargs):
    me = kwargs["node"]

    scene_name = hou.getenv("SCENENAME")
    wa = hou.getenv("WA")
    path = (
        me.parm("write_path")
        .unexpandedString()
        .replace("$SCENENAME", scene_name)
        .replace("$WA", wa)
    )

    if me.evalParm("write_static"):
        filename = me.evalParm("filename")
    else:
        unexpanded = me.parm("filename").unexpandedString()
        frame_value = me.parm("frame").evalAsString()
        cache_name = me.evalParm("cache_name")
        unexpanded = unexpanded.replace("`chs(\"frame\")`", frame_value)
        unexpanded = unexpanded.replace("`chs(\"cache_name\")`", cache_name)
        expanded = hou.text.expandString(unexpanded)
        filename = expanded

    cache = hou.getenv("CACHE")
    exports = hou.getenv("EXPORTS")

    path_short = path.replace(cache, "$CACHE").replace(exports, "$EXPORTS")

    me.parm("write_path_preview").set(os.path.join(path_short, filename))


def filename_changed(kwargs):
    update_preview(kwargs)


def nudge_loader_seq(kwargs):
    me = kwargs["node"]
    loader = me.node("geo_cache_loader")
    if "`" not in loader.parm("geo_sequence").unexpandedString():
        loader.parm("geo_sequence").set(
            "`chs(\"../filename\")`", follow_parm_reference=0
        )


def check_tops(kwargs):
    me = kwargs["node"]
    rop = me.node("topnet/ropgeometry")
    status = str(rop.getCookState(0))
    if "Cooking" not in status:
        me.setComment("")
        me.setGenericFlag(hou.nodeFlag.DisplayComment, 0)
    me.node("geo_cache_loader").parm("rebuild_path").pressButton()


def tops_finished(kwargs):
    me = kwargs["node"]
    ut.user_print("TOPS finished.")
    me.setComment("TOPS finished.")
    me.setGenericFlag(hou.nodeFlag.DisplayComment, 1)
    nudge_loader_seq(kwargs)
    me.node("geo_cache_loader").parm("reload").pressButton()


def refresh_icon_strips(kwargs):
    version_buttons_pressed(kwargs)
    subversion_buttons_pressed(kwargs)


def fetch_versions(kwargs):
    me = kwargs["node"]

    mode = CACHE_MODES[me.evalParm("volt_cache_dir")]
    if mode == "cache":
        name = me.evalParm("cache_name")
        path_template = PATH_TEMPLATES[mode].split("{version}")[0]
        path = path_template.format(name=name)
        path = hou.expandString(path)
        if os.path.isdir(path):
            versions = ut.folder_list(path, reverse=True)
            version_list = " ".join(versions)
            me.parm("version_list").set(version_list)
            build_path(kwargs)
        else:
            me.parm("version_list").set("")
            ut.user_print("No versions found...")


def write_meta(kwargs, mode=0):
    me = kwargs["node"]
    build_path(kwargs)

    meta_filepath = hou.hipFile.path()
    meta_version = hou.applicationVersionString()
    meta_time = datetime.now().strftime('%H:%M:%S %d-%m-%Y')
    meta_geo_cache = me.type().name()
    meta_user = hou.userName()
    meta_cache_name = me.parm("cache_name").evalAsString()
    meta_cache_version = me.parm("cache_version").evalAsString()
    meta_cache_mode = ["Local", "Farm", "TOPS"]

    meta01 = me.parm("meta01").evalAsString()
    meta02_list = [
        "Filepath: ",
        meta_filepath,
        "\n",
        "Houdini version: ",
        meta_version,
        "\n",
        "Time: ",
        meta_time,
        "\n",
        "Node info: ",
        meta_geo_cache,
        "\n",
        "Username: ",
        meta_user,
        "\n",
        "Cache mode: ",
        meta_cache_mode[mode],
        "\n",
        "Cache name: ",
        meta_cache_name,
        "\n",
        "Cache version: ",
        meta_cache_version,
    ]
    meta02 = "".join(meta02_list)

    path = me.parm("write_path").evalAsString()
    if not os.path.isdir(path):
        os.makedirs(path)
    filepath01 = "".join((path, "meta01.txt"))
    filepath02 = "".join((path, "meta02.txt"))
    file01 = open(filepath01, "w")
    file02 = open(filepath02, "w")
    file01.write(meta01)
    file02.write(meta02)
    file01.close()
    file02.close()


def read_meta(kwargs):
    me = kwargs["node"]
    build_path(kwargs)

    path = me.parm("write_path").evalAsString()
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


def build_wedge_lists(kwargs):
    me = kwargs["node"]
    precision = me.parm("wedge_float_precision").evalAsInt()
    precision = float("1".ljust(precision + 1, "0"))
    wedging_tog = me.evalParm("wedge_tog")
    amount = me.evalParm("wedging_vars")
    values_multi_parm = me.parm("wedging_final_multi")
    final_values_amount = 1

    amount *= wedging_tog
    if amount >= 1:

        var_names = []
        var_values = []
        var_values_comma = []

        # Get cue_foreach node from the ropnet and set the amount parm.
        foreach = me.node("ropnet/cue_foreach")
        foreach.parm("foreach").set(amount)

        # Get the wedge and scheduler nodes from the topnet.
        # Set the variables amount on the scheduler node.
        # Set the variables amount on the wedge node, as well as the final
        # amount of wedges.
        wedge = me.node("topnet/wedge")
        scheduler = me.node("topnet/localscheduler")
        wedge.parm("wedgecount").set(final_values_amount)
        wedge.parm("wedgeattributes").set(amount)
        scheduler.parm("local_envmulti").set(amount)

        for i in range(0, amount):
            index = i + 1

            # For each variable...

            # Get the variable name and type, as well as if solo is enabled.
            solo = ut.multiparm(me, "solo", index).evalAsInt()
            var_type = ut.multiparm(me, "wedging_type", index).evalAsInt()
            var_name = ut.multiparm(me, "wedge_var", index).evalAsString()

            if var_name:
                var_names.insert(i, var_name)

                # Set the variable name on the cue_foreach node.
                foreach.parm("variable{}".format(index)).set(var_names[i].upper())

                # Set the variable name on the wedge node and on the scheduler.
                # This will create a global variable even when using TOPS, as
                # opposed to being restricted to the @var_name syntax.
                # Also set the value of the global var on the scheduler.
                wedge.parm("name{}".format(index)).set(var_names[i])
                scheduler.parm("local_envname{}".format(index)).set(var_names[i])
                envvalue = "`@{}`".format(var_names[i])
                scheduler.parm("local_envvalue{}".format(index)).set(envvalue)

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
                        value = ut.multiparm(me, "solo_int", index).evalAsInt()
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
                            var_values[i][:-1]
                            if len(var_values) > 1
                            else var_values[i][:-1]
                        )
                        var_values_comma[i] = (
                            var_values_comma[i][:-1]
                            if len(var_values_comma) > 1
                            else var_values_comma[i][:-1]
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
                    samples = ut.multiparm(
                        me, "wedging_float_samples", index
                    ).evalAsInt()

                    if solo:
                        samples = 1
                        var_values.insert(
                            i, str(ut.multiparm(me, "solo_float", index).evalAsFloat())
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
                            var_values[i][:-1]
                            if len(var_values) > 1
                            else var_values[i][:-1]
                        )
                        var_values_comma[i] = (
                            var_values_comma[i][:-1]
                            if len(var_values_comma) > 1
                            else var_values_comma[i][:-1]
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
                    samples = len(values.split(" "))
                    if solo:
                        samples = 1
                        var_values.insert(
                            i, ut.multiparm(me, "solo_str", index).evalAsString()
                        )
                        var_values_comma.insert(i, var_values[i])
                    else:
                        var_values.insert(i, values.replace(",", "_"))
                        var_values_comma.insert(i, values.replace(" ", ","))

                    # topnet
                    wedge.parm("type{}".format(index)).set(4)
                    wedge.parm("values{}".format(index)).set(samples)

                    var_value_list = var_values[i].split(" ")
                    for i2 in range(0, samples):
                        var_value = var_value_list[i2]
                        wedge.parm("strvalue{}_{}".format(index, i2 + 1)).set(var_value)

                # Set up a temporary env var for the user to be able to
                # preview his scene, as well as not have all the nodes
                # seemingly error out.
                hou.putenv(var_names[i].upper(), var_values[i].split()[0])
                hou.hscript("varchange {}".format(var_names[i].upper()))

                me.parm("wedging_final_single_{}".format(index)).set(var_values[i])

                # ropnet
                foreach.parm("words{}".format(index)).set(var_values_comma[i])

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
                var_lists.append(values_string.split())
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
        # Get cue_foreach node from the ropnet and set the amount parm.
        foreach = me.node("ropnet/cue_foreach")
        foreach.parm("foreach").set(0)

        # Get the wedge and scheduler nodes from the topnet.
        # Set the variables amount on the scheduler node.
        # Set the variables amount on the wedge node, as well as the final
        # amount of wedges.
        wedge = me.node("topnet/wedge")
        scheduler = me.node("topnet/localscheduler")
        wedge.parm("wedgecount").set(0)
        wedge.parm("wedgeattributes").set(0)
        scheduler.parm("local_envmulti").set(0)


def set_loader_parms(kwargs):
    me = kwargs["node"]

    loader = me.node("geo_cache_loader")

    parms = {
        "expert": 1,
        "cache_name": '`chs("../volt_cache_dir")`/`chs("../cache_name")`',
        "version": '`ifs(ch("../volt_cache_dir"), chs("../last_exports_version"), chs("../cache_version"))`',
        "geo_sequence": '`chs("../filename")`',
    }

    expr_parms = {
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
