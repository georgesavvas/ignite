import nuke
import ignite_nuke


file_menu = nuke.menu("Nuke").findItem("File")
file_menu.findItem("Save New Comp Version").setEnabled(False)
file_menu.addCommand(
    "Save As Next Version (Ignite)",
    ignite_nuke.save_next,
    index=3
)

menu = nuke.menu("Nuke").addMenu("Ignite", index=8)
menu.addCommand("Save", ignite_nuke.save)
menu.addCommand("Save Version", ignite_nuke.save_next)
menu.addCommand("Set Scene Comment", ignite_nuke.scene_comment)
menu.addCommand("Set Scene Thumbnail", ignite_nuke.scene_thumbnail)
menu.addCommand("Set Scene Preview", ignite_nuke.scene_preview)
