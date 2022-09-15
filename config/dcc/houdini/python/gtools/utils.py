from __future__ import absolute_import, division, unicode_literals, print_function
import os
import glob
from string import digits
import random
import hou
import logging

log = logging.getLogger(__name__)
log.setLevel(hou.getenv("GTOOLS_LOGLEVEL", "INFO"))


def multiparm(node, parm_name, index):
    """ Returns a multi parm.
    """

    if not parm_name.endswith("_"):
        parm_name += "_"
    parm_name = "{}{}".format(parm_name, str(index))
    return node.parm(parm_name)


def list_diff(first, second):
    if len(first) == len(second):
        diff = []
        for i in range(0, len(first)):
            if first[i] != second[i]:
                diff.append(first[i])
        return diff
    else:
        # print("Lists provided are of different lengths.")
        return []


def user_print(message, s=2):
    """ Flashes a message on the network editor.
    """

    pane_tab = hou.ui.paneTabOfType(hou.paneTabType.NetworkEditor)
    if pane_tab.type().name() == "NetworkEditor":
        pane_tab.flashMessage(None, message, s)


def fetch_changelog(node, asset, parm="changelog"):
    """ Refreshes the changelog parm with the one on the server.
    """

    hda_def = node.type().definition()
    def_path = hda_def.libraryFilePath()
    path = def_path.split("{}_".format(asset))[0]

    if os.path.isdir(path):
        filepath01 = "{p}{a}_changelog.txt".format(p=path, a=asset)
        if os.path.isfile(filepath01):
            file01 = open(filepath01, "r")
            contents01 = "".join(file01.readlines())
            file01.close()
            node.parm(parm).set(contents01)
        else:
            pass
    else:
        node.parm(parm).revertToDefaults()


# TO DELETE
def folder_list(path, reverse=0, node=None, unique=True, dir_only=True):
    """ Returns a list of all dirs and files in a folder.
    """

    special_parms = 0
    for i in path.split("/"):
        if "*" in i or "?" in i or "[" in i:
            special_parms += 1

    search_paths = glob.glob(path)
    items = []

    log.debug("Searching for items in:\n{}".format(path))

    for search_path in search_paths:
        log.debug(search_path)
        if os.path.isdir(search_path):
            try:
                new_items = os.listdir(search_path)
                if dir_only:
                    for item in list(new_items):
                        check_path = os.path.join(search_path, item)
                        if not os.path.isdir(check_path):
                            new_items.remove(item)
                if special_parms:
                    for i in range(0, special_parms):
                        glob_list = path.split("/")
                        search_list = search_path.split("/")
                        diff = list_diff(search_list, glob_list)
                        prefix = "/".join(diff)
                        prefix += "/"
                    for i in range(0, len(new_items)):
                        new_items[i] = "{}{}".format(prefix, new_items[i])
                items += new_items
            except OSError:
                pass

    items = list(set(items))
    items = sorted(items, reverse=reverse)

    # Remove hidden files
    for item in items:
        if item.startswith("."):
            items.remove(item)

    return items
