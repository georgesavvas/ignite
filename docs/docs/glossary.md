# Glossary

### Anchor
A file in a directory that tells Ignite the type of the directory within the
structure of a VFX project. This is strictly formatted as `.ign_[type].yaml`
and shouldn't be needed to be created or edited manually unless you need to
repair or change the type of a directory (ideally done through the UI though).
This file often contains useful metadata about this directory.
Examples: `.ign_task.yaml`, `.ign_asset.yaml`, `.ign_scene.yaml`

### Asset
A directory containing all the versions (AssetVersions in Ignite) of a
specific export.
For example there can be a "car" asset on the filesystem which
will merely contain the "v001", "v002" and "v003" AssetVersion directories
inside.
Marked by a file named `.ign_asset.yaml`

### AssetVersion
A directory containing exported files (Components in Ignite). This could be a
render in the form of an image sequence or a video file, geometry files such as
usd, alembic and FBX or any other type of file.
It can also contain a thumbnail image, a preview
directory containing an image sequence for dynamic thumbnails and/or a source
directory containing the source (Scene) of the export.
AssetVersions are numbered (v001, v002, v003 being 1, 2 and 3) but there
is also a "latest" and "best" AssetVersion.
Marked by a file named `.ign_assetversion.yaml`

### Attribute
Named values stored on any directory that get translated into environment
variables when launching an app through Ignite.
For example an attribute called "Start Frame" will be accessible within apps
using the "IGNITE_ATTRIB_STARTFRAME" env var.
For supported apps Ignite will also assign some attribute values to the
equivalent env vars that the app understands, such
as "Start Frame" -> "FSTART" in Houdini.

### Build
A directory that defines an asset build. Usually contains a set of tasks, with
an "Asset" task containing the final exports for the asset build.
Marked by a file named `.ign_build.yaml`

### Comment
A description added to a Scene.

### Component
A file or sequence of files within an AssetVersion.

### Context
The parent path to a directory or file relative to its Group.

### Directory
A directory that can contain any other directory.
Marked by a file named `.ign_directory.yaml`

### Exports
Coming soon!

### Group
A directory at the root of a project used to separate different parts of it such
as an asset builds section, a sequences or episodes section, an unreal project
section or a project exports section.
Marked by a file named `.ign_group.yaml`

### Project
A directory that is the root of a project. Should be inside the
projects directory.
Marked by a file named `.ign_project.yaml`

### Projects Directory
The directory that contains all of your projects. This can be changed as needed
in case you need to store projects in multiple locations.

### Scene
A directory containing the scene files for an app.
Marked by a file named `.ign_scene.yaml`

### Tag
Labels assigned to directories (usually Assets and AssetVersions) to categorise
or distinguish them from the rest. In the case of AssetVersions, special tags
"Approved" and "Deprecated" raise or lower the way AssetVersions are scored
when fetching the "latest" or "best" one.

### Task
A directory where the actual work is done. This is where scenes and exports are
created in.
Marked by a file named `.ign_task.yaml`

### URI
A string that uniquely identifies an Ignite entity (directory or file) within
a project directory.

### Vault
Ignite's asset library. Lives inside the project directory so each one has its
own unique Vault.
