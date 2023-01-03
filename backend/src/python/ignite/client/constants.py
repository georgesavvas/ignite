GENERIC_ENV = {
    "PROJECTS_ROOT": "{projects_root}",
    "OCIO": "{dcc}/ocio/config-aces-cg.ocio"
}


DCC_ENVS = {
    "houdini": {
        "HSITE": "{dcc}",
        "IGNITE_DCC": "{dcc}/houdini",
        "PYTHONPATH": "{dcc}/houdini/python;{dcc}/common/python;&",
        "HOUDINI_PATH": "{dcc}/houdini;&",
        "HOUDINI_MENU_PATH": "{dcc}/houdini;&",
        "HOUDINI_OTLSCAN_PATH": "&;{dcc}/houdini/hda",
        "HOUDINI_PYTHON_PANEL_PATH": "{dcc}/houdini/python_panels;&",
        "PXR_PLUGINPATH_NAME": "{dcc}/houdini/dso/{version}/{os}/resources"
    },
    "maya": {
        "PYTHONPATH": "{dcc}/maya/python;{dcc}/common/python",
        "MAYA_SHELF_PATH": "{dcc}/maya/shelf",
        "MAYA_SCRIPT_PATH": "{dcc}/maya/scripts",
        "MAYA_PLUG_IN_PATH": "{dcc}/maya/plug-ins"
    },
    "nuke": {
        "PYTHONPATH": "{dcc}/nuke/python;{dcc}/common/python",
        "NUKE_PATH": "{dcc}/nuke;{dcc}/nuke/scripts;{dcc}/nuke/gizmos",
        "HIERO_PLUGIN_PATH": "{dcc}/hiero"
    },
    "mari": {
        "PYTHONPATH": "{dcc}/mari/python;{dcc}/common/python",
        "MARI_SCRIPT_PATH": "{dcc}/mari/scripts"
    },
    "natron": {
        "PYTHONPATH": "{dcc}/natron/python;{dcc}/common/python",
        "NATRON_PLUGIN_PATH": "{dcc}/natron/Plugins"
    },
    "blender": {
        "PYTHONPATH": "{dcc}/blender/python;{dcc}/common/python",
        "BLENDER_USER_SCRIPTS": "{dcc}/blender/scripts"
    },
    "substance_designer": {
        "PYTHONPATH": "{dcc}/substance_designer/python;{dcc}/common/python",
        "SBS_DESIGNER_PYTHON_PATH":  "{dcc}/substance_designer/plugins"
    },
    "substance_painter": {
        "PYTHONPATH": "{dcc}/substance_painter/python;{dcc}/common/python",
        "SUBSTANCE_PAINTER_PLUGINS_PATH":  "{dcc}/substance_painter/plugins"
    }
}


DCC_LOCATIONS = {
    "houdini": ""
}


OS_NAMES = {
    "Windows": "win",
    "Darwin": "darwin",
    "Linux": "linux"
}


DCC_DISCOVERY = {
    "djv": {
        "label": "DJV",
        "exts": ["exr", "jpg", "jpeg", "png", "tif", "tiff", "tga"],
        "paths": {
            "win": [
                "C:/Program Files/DJV2/bin/djv.exe"
            ],
            "darwin": [
                "",
            ],
            "linux": [
                ""
            ]
        }
    },
    "houdinifx": {
        "label": "Houdini FX",
        "exts": ["hip", "hipnc"],
        "args": "-n",
        "paths": {
            "win": [
                "C:/Program Files/Side Effects Software/Houdini *.*.*/bin/houdini.exe"
            ],
            "darwin": [
                "/Applications/Houdini/Houdini*.*.*/Frameworks/Houdini.framework/Versions/Current/Resources/bin/houdini",
            ],
            "linux": [
                "/opt/hfs*.*.*/bin/houdini"
            ]
        }
    },
    "houdinicore": {
        "label": "Houdini Core",
        "exts": ["hip", "hipnc"],
        "args": "-n",
        "paths": {
            "win": [
                "C:/Program Files/Side Effects Software/Houdini *.*.*/bin/houdinicore.exe"
            ],
            "darwin": [
                "/Applications/Houdini/Houdini*.*.*/Frameworks/Houdini.framework/Versions/Current/Resources/bin/houdinicore"
            ],
            "linux": [
                "/opt/hfs*.*.*/bin/houdinicore"
            ]
        }
    },
    "hython": {
        "label": "Hython",
        "exts": ["hip", "hipnc"],
        "paths": {
            "win": [
                "C:/Program Files/Side Effects Software/Houdini *.*.*/bin/hython.exe"
            ],
            "darwin": [
                "/Applications/Houdini/Houdini*.*.*/Frameworks/Houdini.framework/Versions/Current/Resources/bin/hython"
            ],
            "linux": [
                "/opt/hfs*.*.*/bin/hython"
            ]
        }
    },
    "maya": {
        "label": "Maya",
        "exts": ["ma", "mb"],
        "paths": {
            "win": [
                "C:/Program Files/Autodesk/Maya*/bin/maya.exe"
            ],
            "darwin": [
                "/Applications/Autodesk/Maya*/bin/maya"
            ],
            "linux": [
                "/usr/autodesk/Maya*/bin/maya"
            ]
        }
    },
    "nuke": {
        "label": "Nuke",
        "exts": ["nk", "nuke", "nkple"],
        "paths": {
            "win": [
                "C:/Program Files/Nuke*.*/Nuke*.*.exe"
            ],
            "darwin": [
                "/Applications/Nuke*.*/Nuke*.*"
            ],
            "linux": [
                ""
            ]
        }
    },
    "nukex": {
        "label": "NukeX",
        "exts": ["nk", "nuke", "nkple"],
        "args": "--nukex",
        "paths": {
            "win": [
                "C:/Program Files/Nuke*.*/Nuke*.*.exe"
            ],
            "darwin": [
                "/Applications/Nuke*.*/Nuke*.*"
            ],
            "linux": [
                ""
            ]
        }
    },
    "nukestudio": {
        "label": "Nuke Studio",
        "exts": ["nk", "nuke", "nkple"],
        "args": "--studio",
        "paths": {
            "win": [
                "C:/Program Files/Nuke*.*/Nuke*.*.exe"
            ],
            "darwin": [
                "/Applications/Nuke*.*/Nuke*.*"
            ],
            "linux": [
                ""
            ]
        }
    },
    "blender": {
        "label": "Blender",
        "exts": ["blend"],
        "paths": {
            "win": [
                "C:/blender/*.*/blender.exe",
            ],
            "darwin": [
                "/*/blender/*.*/blender",
            ],
            "linux": [
                "/*/blender/*.*/blender"
            ]
        }
    },
    "natron": {
        "label": "Natron",
        "exts": ["nps", "npt"],
        "paths": {
            "win": [
                "C:/Program Files/Natron/bin/Natron.exe"
            ],
            "darwin": [
                "/*/Natron/bin/Natron"
            ],
            "linux": [
                "/*/Natron/bin/Natron"
            ]
        }
    },
    "photoshop": {
        "label": "Photoshop",
        "exts": ["psd"],
        "paths": {
            "win": [
                "C:/Program Files/Adobe/Adobe Photoshop */Photoshop.exe"
            ],
            "darwin": [
                "/Applications/Adobe Photoshop */Adobe Photoshop *"
            ],
            "linux": []
        }
    },
    "aftereffects": {
        "label": "After Effects",
        "exts": ["aep"],
        "paths": {
            "win": [
                "C:/Program Files/Adobe/Adobe After Effects */Adobe After Effects *"
            ],
            "darwin": [
                "/Applications/Adobe After Effects */Adobe After Effects *"
            ],
            "linux": []
        }
    },
    "premiere": {
        "label": "Premiere",
        "exts": ["prproj"],
        "paths": {
            "win": [
                "C:/Program Files/Adobe/Adobe Premiere Pro */Adobe Premiere Pro.exe"
            ],
            "darwin": [
                "/Applications/Adobe Premiere Pro */Adobe Premiere Pro *"
            ],
            "linux": []
        }
    },
    "illustrator": {
        "label": "Illustrator",
        "exts": ["ai", "eps"],
        "paths": {
            "win": [
                "C:/Program Files/Adobe/Adobe Illustrator */Adobe Illustrator *"
            ],
            "darwin": [
                "/Applications/Adobe Illustrator */Adobe Illustrator *"
            ],
            "linux": []
        }
    },
    "designer": {
        "label": "Designer",
        "exts": ["sbs", "sbsar", "sbsasm"],
        "paths": {
            "win": [
                "C:/Program Files/Allegorithmic/Substance Designer/Substance Designer.exe",
                "C:/Program Files/Adobe/Substance Designer/Substance Designer.exe"
            ],
            "darwin": [
                "/Applications/Adobe Substance 3D Designer.app/Designer"
            ],
            "linux": [
                "/opt/Adobe/Adobe_Substance_3D_Designer/Designer"
            ]
        }
    },
    "painter": {
        "label": "Painter",
        "exts": ["sbar", "sbsar", "spp"],
        "paths": {
            "win": [
                "C:/Program Files/Allegorithmic/Substance Painter/Substance Painter.exe",
                "C:/Program Files/Adobe/Substance Painter/Substance Painter.exe"
            ],
            "darwin": [
                "/Applications/Adobe Substance 3D Painter.app/Painter"
            ],
            "linux": [
                "/opt/Adobe/Adobe_Substance_3D_Painter/Painter"
            ]
        }
    },
    "vscode": {
        "label": "VS Code",
        "exts": ["py"],
        "paths": {
            "win": [
                "C:/Users/George/AppData/Local/Programs/Microsoft VS Code/Code.exe"
            ],
            "darwin": [
                "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/Code"
            ],
            "linux": []
        }
    }
}


DCC_VERSIONS = [
    {
        "name": "houdini",
        "versions": {
            "19.5": ["19.5."],
            "19.0": ["19.0."]
        }
    }
]
