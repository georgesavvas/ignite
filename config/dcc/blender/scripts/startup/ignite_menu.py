import bpy

import ignite_blender
from importlib import reload
reload(ignite_blender)


class OBJECT_OT_save(bpy.types.Operator):
    bl_idname = "ign.save"
    bl_label = "Save"
    bl_options = {"REGISTER"}
    bl_description = "Save scene"
    
    def execute(self, context):
        ignite_blender.save()
        return {"FINISHED"}


class OBJECT_OT_save_next(bpy.types.Operator):
    bl_idname = "ign.save_next"
    bl_label = "Save Next Version (Ignite)"
    bl_options = {"REGISTER"}
    bl_description = "Save scene as next version"
    
    def execute(self, context):
        ignite_blender.save_next()
        return {"FINISHED"}


class OBJECT_OT_scene_comment(bpy.types.Operator):
    bl_idname = "ign.scene_comment"
    bl_label = "Set Scene Comment"
    bl_options = {"REGISTER"}
    bl_description = "Set the scene comment"
    
    def execute(self, context):
        # ignite_blender.scene_comment()
        return {"FINISHED"}


class TOPBAR_MT_custom_menu(bpy.types.Menu):
    bl_label = "Ignite"

    def draw(self, context):
        layout = self.layout
        layout.operator("ign.save")
        layout.operator("ign.save_next")
        # layout.operator("ign.scene_comment")

    def menu_draw(self, context):
        self.layout.menu("TOPBAR_MT_custom_menu")


classes = (
    OBJECT_OT_save,
    OBJECT_OT_save_next,
    TOPBAR_MT_custom_menu
)


def register():
    for c in classes:
        bpy.utils.register_class(c)
    bpy.types.TOPBAR_MT_editor_menus.append(TOPBAR_MT_custom_menu.menu_draw)


def unregister():
    bpy.types.TOPBAR_MT_editor_menus.remove(TOPBAR_MT_custom_menu.menu_draw)
    for c in classes:
        bpy.utils.unregister_class(c)


if __name__ == "__main__":
    register()
