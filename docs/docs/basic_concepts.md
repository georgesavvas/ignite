---
title: Basic Concepts
sidebar_position: 2
---

# Basic Concepts

## Introduction
Ignite works directly with the file system when it comes to project structure.
There is no database in between which allows you to make manual changes.
There are a few restrictions though so it is recommended you work through the UI
as much as you can.

Each directory can be one of the following types:
- [Directory](glossary.md#directory)
- [Project](glossary.md#project)
- [Group](glossary.md#group)
- [Build](glossary.md#build)
- [Task](glossary.md#task)
- [Asset](glossary.md#asset)
- [Assetversion](glossary.md#assetversion)
- [Shot](glossary.md#shot)

## Overview
The recommended structure is that each project is sectioned into at least a
couple of *Groups*.
One of them should be used for asset builds and the other one for shots.
Ultimately you will be creating scenes and exporting assets within *Tasks*, but
it is advisable you nest these into further *Directories* for organisational
purposes.

### Asset Builds
Each asset build should be in its own *Build* directory and should contain
the following *Tasks*:

- For a single artist setup you can do all the work within a single "Asset"
*Task*.

- For multiple artists or a department-like setup you can create multiple
*Tasks* like "Model", "Surface" and "FX".
Each one of these will have their own exports and a final "Asset" *Task* can be used to composite everything together and export the final asset build.

If you wish to categorise your asset builds, for example “vehicles” “buildings”
“characters” etc, you should use the generic *Directory* type directories inside
your asset builds *Group* (same for any further sub-categories) and create your *Builds* within them.

### Shots
Shot *Tasks* should live inside *Shot* directories, with the shot nesting
depending on your output expectations. You should use the generic *Directory*
type directories for anything in-between *Groups* and *Shots*. Here’s a few
examples of how you can structure your shots:
Shots
E01
0010
0020
0030
E02
0010
0020
0030
Shots
S01
E01
0010
0020
0030
Shots
SEQ02
0010
0020
0030
SEQ01
0010
0020
0030