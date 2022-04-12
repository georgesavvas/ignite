from __future__ import absolute_import, division, unicode_literals, print_function
from volt_geo_cache_loader import main

from importlib import reload


# This code is only used internally in the HDA's python module.


def expert_changed(kwargs):
    main.expert_changed(kwargs)


def hda_created(kwargs):
    main.hda_created(kwargs)


def hda_updated(kwargs):
    main.hda_updated(kwargs)


def hda_loaded(kwargs):
    main.hda_loaded(kwargs)


def documentation_pressed(kwargs):
    main.documentation_pressed(kwargs)


def submit_bug_pressed(kwargs):
    main.submit_bug_pressed(kwargs)


def submit_rfe_pressed(kwargs):
    main.submit_rfe_pressed(kwargs)


def reload_py_pressed(kwargs):
    reload(main)


def rebuild_path_pressed(kwargs):
    main.rebuild_path_pressed(kwargs)


def populate_geo_seq_pressed(kwargs):
    main.populate_geo_seq_pressed(kwargs)


def name_changed(kwargs):
    main.name_changed(kwargs)


def name_menu_used(kwargs):
    main.name_menu_used(kwargs)


def version_menu_used(kwargs):
    main.version_menu_used(kwargs)


def geo_sequence_menu_used(kwargs):
    main.geo_sequence_menu_used(kwargs)


def load_type_changed(kwargs):
    main.load_type_changed(kwargs)


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


def geo_sequence_changed(kwargs):
    main.geo_sequence_changed(kwargs)
