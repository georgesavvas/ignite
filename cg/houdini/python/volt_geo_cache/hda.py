from __future__ import absolute_import, division, unicode_literals, print_function
from volt_geo_cache import main

from importlib import reload


# This code is only used internally in the HDA's python module.


def hda_created(kwargs):
    main.hda_created(kwargs)


def hda_updated(kwargs):
    main.hda_updated(kwargs)


def hda_loaded(kwargs):
    main.hda_loaded(kwargs)


def hda_renamed(kwargs):
    try:
        main.hda_renamed(kwargs)
    except:
        return


def documentation_pressed(kwargs):
    main.documentation_pressed(kwargs)


def submit_bug_pressed(kwargs):
    main.submit_bug_pressed(kwargs)


def reload_py_pressed(kwargs):
    reload(main)


def submit_rfe_pressed(kwargs):
    main.submit_rfe_pressed(kwargs)


def discover_pressed(kwargs):
    main.discover_pressed(kwargs)


def delete_pressed(kwargs):
    main.delete_pressed(kwargs)


def refresh_icon_strips_pressed(kwargs):
    main.refresh_icon_strips(kwargs)


def version_menu_used(kwargs):
    main.version_menu_used(kwargs)


def cache_mode_changed(kwargs):
    main.cache_mode_changed(kwargs)


def load_all_wedges_changed(kwargs):
    main.load_all_wedges_changed(kwargs)


def extension_changed(kwargs):
    main.extension_changed(kwargs)


def cache_locally_pressed(kwargs):
    main.cache_locally_pressed(kwargs)


def cache_on_farm_pressed(kwargs):
    main.cache_on_farm_pressed(kwargs)


def cache_in_tops_pressed(kwargs):
    main.cache_in_tops_pressed(kwargs)


def tops_finished_pressed(kwargs):
    main.tops_finished_pressed(kwargs)


def name_changed(kwargs):
    main.name_changed(kwargs)


def version_changed(kwargs):
    main.version_changed(kwargs)


def version_buttons_pressed(kwargs):
    main.version_buttons_pressed(kwargs)


def subversion_buttons_pressed(kwargs):
    main.subversion_buttons_pressed(kwargs)


def version_latest_pressed(kwargs):
    main.version_latest_pressed(kwargs)


def reload_geo_pressed(kwargs):
    main.reload_geo_pressed(kwargs)


def static_changed(kwargs):
    main.static_changed(kwargs)


def wedging_changed(kwargs):
    main.wedging_changed(kwargs)


def filename_changed(kwargs):
    main.filename_changed(kwargs)
