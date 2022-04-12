from __future__ import absolute_import, division, unicode_literals, print_function

import sys
import os

required = ("/software/rez/packages/egg/python_gitlab/1.5.1/python",)
for path in required:
    if path not in sys.path:
        sys.path.insert(0, path)

import hou
import time
import fnmatch
import yaml
import glob
import traceback
import gitlab

from datetime import datetime
from PySide2.QtCore import Qt
from PySide2.QtWidgets import QWidget, QVBoxLayout, QLabel, QLineEdit, QTextEdit
from PySide2.QtWidgets import QHBoxLayout, QPushButton

TOKEN = "k_-DxiJJGUohsmebyrqw"
GL = gitlab.Gitlab("http://gitlab.etc.com", private_token=TOKEN)
PROJECT = GL.projects.get("george/studio_tools")


class SubmitBug(QWidget):
    def __init__(self, hda_name="HDA", labels=[], parent=None):
        super(SubmitBug, self).__init__(parent)

        houdini_window = hou.qt.mainWindow()
        size = houdini_window.size()
        mysizex = 1280 / 2
        mysizey = 720 / 2
        posx = size.width() / 2 - mysizex / 2
        posy = size.height() / 2 - mysizey / 2

        self.setWindowTitle(hda_name + " - Bug Submission")
        self.setGeometry(posx, posy, mysizex, mysizey)
        self.setMinimumSize(mysizex, mysizey)
        self.setMouseTracking(1)

        master_layout = QVBoxLayout()

        text = QLabel(
            "Please include enough details to be able to reproduce the issue."
        )
        text.setWordWrap(True)

        title_field = QLineEdit()
        title_field.setPlaceholderText("Summary")
        description_field = QTextEdit()
        description_field.setPlaceholderText("Description")

        button_layout = QHBoxLayout()
        button_layout.setAlignment(Qt.AlignHCenter)
        submit_button = QPushButton("Submit")
        submit_button.clicked.connect(self.submit_form)
        submit_button.setMinimumHeight(40)
        submit_button.setMaximumHeight(40)
        submit_button.setMinimumWidth(100)
        submit_button.setMaximumWidth(100)
        button_layout.addWidget(submit_button)

        master_layout.addWidget(text)
        master_layout.addWidget(title_field)
        master_layout.addWidget(description_field)
        master_layout.addLayout(button_layout)

        self.setLayout(master_layout)
        self.title = title_field
        self.description = description_field
        self.labels = labels

    def submit_form(self):
        title = self.title.text()
        description = self.description.toPlainText()

        if not title:
            self.title.setPlaceholderText("Summary is required.")
            return

        description += "\n\n\n\n"
        description += "User: " + hou.getenv("USER")
        description += "\n\n"
        description += "Date: " + datetime.now().strftime("%d/%m/%Y %H:%M:%S")
        description += "\n\n"
        description += "Houdini Version: " + hou.applicationVersionString()
        description += "\n\n"
        description += "Scene: " + hou.hipFile.path()

        PROJECT.issues.create(
            {"title": title, "description": description, "labels": ["bug"]}
        )

        hou.ui.displayMessage("Bug submitted successfully, thank you!")
        self.close()

    def closeEvent(self, event):
        self.setParent(None)
