from __future__ import absolute_import, division, unicode_literals, print_function
from fxcache import main

from importlib import reload


reload(main)


# This code is only used internally in the HDA's python module.


def hda_created(kwargs):
    main.hda_created(kwargs)


def hda_updated(kwargs):
    main.hda_updated(kwargs)


def hda_loaded(kwargs):
    main.hda_loaded(kwargs)


def hda_renamed(kwargs):
    main.hda_renamed(kwargs)


def documentation_pressed(kwargs):
    main.documentation_pressed(kwargs)


def submit_bug_pressed(kwargs):
    main.submit_bug_pressed(kwargs)


def reload_py_pressed(kwargs):
    reload(main)


def submit_rfe_pressed(kwargs):
    main.submit_rfe_pressed(kwargs)


def refresh_icon_strips_pressed(kwargs):
    main.refresh_icon_strips(kwargs)


def custom_target_changed(kwargs):
    main.custom_target_changed(kwargs)


def deselect_workitem_pressed(kwargs):
    main.deselect_workitem(kwargs)


def rebuild_path_pressed(kwargs):
    main.select_rop(kwargs)
    main.build_path(kwargs)


def version_menu_used(kwargs):
    main.version_menu_used(kwargs)


def cache_mode_changed(kwargs):
    main.cache_mode_changed(kwargs)


def load_all_wedges_changed(kwargs):
    main.load_all_wedges_changed(kwargs)


def extension_changed(kwargs):
    main.extension_changed(kwargs)


def main_thread_pressed(kwargs):
    main.local_cache(kwargs)


def background_thread_pressed(kwargs):
    main.local_cache(kwargs, background=True)


def cache_pressed(kwargs):
    main.cache_pressed(kwargs)


def submit_as_job_pressed(kwargs):
    main.submit_as_job_pressed(kwargs)


def tops_finished_pressed(kwargs):
    main.tops_finished_pressed(kwargs)


def name_changed(kwargs):
    main.name_changed(kwargs)


def version_changed(kwargs):
    main.version_changed(kwargs)


def version_buttons_pressed(kwargs):
    main.version_buttons_pressed(kwargs)


def version_latest_pressed(kwargs):
    main.version_latest_pressed(kwargs)


def reload_geo_pressed(kwargs):
    main.reload_geo_pressed(kwargs)


def range_type_changed(kwargs):
    main.range_type_changed(kwargs)


def write_frame_changed(kwargs):
    main.write_frame_changed(kwargs)


def wedging_changed(kwargs):
    main.wedging_changed(kwargs)


def filename_changed(kwargs):
    main.filename_changed(kwargs)
