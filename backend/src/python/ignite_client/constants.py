GENERIC_ENV = {
    "PROJECTS_ROOT": "{projects_root}",
    "OCIO": "{dcc}/ocio/aces_1.2/config.ocio"
}


DCC_ENVS = {
    "houdini": {
        "IGNITE_DCC": "{dcc}/houdini",
        "PYTHONPATH": "{dcc}/houdini/python;&",
        "HOUDINI_PATH": "{dcc}/houdini;&",
        "HOUDINI_MENU_PATH": "{dcc}/houdini;&",
        "HOUDINI_OTLSCAN_PATH": "&;{dcc}/houdini/otls",
        "PXR_PLUGINPATH_NAME": "{dcc}/houdini/dso/19.5/{os}/resources"
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
    "houdinifx": {
        "label": "Houdini FX",
        "exts": ["hip", "hipnc"],
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