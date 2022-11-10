import os

import substance_painter.ui
import substance_painter.project
from PySide2 import QtWidgets

import ignite_sp


plugin_widgets = []

def start_plugin():
    menu = QtWidgets.QMenu("Ignite")

    save = menu.addAction("Save")
    save.triggered.connect(ignite_sp.save)

    save = menu.addAction("Save As Next Version (Ignite)")
    save.triggered.connect(ignite_sp.save_next)

    save = menu.addAction("Set Scene Comment")
    save.triggered.connect(ignite_sp.scene_comment)

    substance_painter.ui.add_menu(menu)
    plugin_widgets.append(menu)


def close_plugin():
	for widget in plugin_widgets:
		substance_painter.ui.delete_ui_element(widget)

	plugin_widgets.clear()


if __name__ == "__main__":
	start_plugin()
