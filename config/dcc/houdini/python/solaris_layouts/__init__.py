import loptoolutils
import soptoolutils
import objecttoolutils
import hou
import os


ENV = os.environ
BLUE = hou.Color((0.094, 0.369, 0.69))
GREY = hou.Color((0.306, 0.306, 0.306))
BLACK = hou.Color((0, 0, 0))


def setup(kwargs, context):
    if context == "lops":
        kwargs["context"] = "lops"
        kwargs["layout_fn"] = create_lops_layout
        kwargs["loader"] = loptoolutils.genericTool(
            kwargs, kwargs["hda_name"], "StageLoader"
        )
    elif context == "sops":
        kwargs["context"] = "sops"
        kwargs["layout_fn"] = create_sops_layout
        kwargs["loader"] = soptoolutils.genericTool(
            kwargs, kwargs["hda_name"], "StageLoader"
        )
    elif context == "obj":
        kwargs["context"] = "obj"
        kwargs["layout_fn"] = create_lops_layout
        lopnet = objecttoolutils.genericTool(kwargs, "lopnet", "lopnet")
        kwargs["loader"] = lopnet.createNode(kwargs["hda_name"], "StageLoader")

    if ENV.get("BUILD"):
        create_asset_layout(kwargs)
    elif ENV.get("SHOT") == "0000":
        create_sequence_layout(kwargs)
    else:
        create_shot_layout(kwargs)


def output(parent, node_type, node_name, offset=0, colour=None):
    new_node = parent.createOutputNode(node_type, node_name)
    if node_type == "null":
        new_node.setUserData("nodeshape", "rect")
    if colour:
        new_node.setColor(colour)
    new_node.setPosition(parent.position())
    new_node.move((0, offset))
    return new_node


def create_lops_layout(kwargs):
    nodes = []

    loader = kwargs["loader"]
    nodes.append(loader)

    stage_in = output(loader, "null", "STAGE_IN", -1, GREY)
    nodes.append(stage_in)

    lb_above = output(stage_in, "null", "ANYTHING_ABOVE_WILL_BE_DISCARDED", -4, BLUE)
    nodes.append(lb_above)

    lb = output(lb_above, "layerbreak", "layer_break", -1)
    nodes.append(lb)

    lb_below = output(lb, "null", "ANYTHING_BELOW_WILL_BE_INCLUDED", -1, BLUE)
    nodes.append(lb_below)

    stage_out = output(lb_below, "null", "STAGE_OUT", -10, BLACK)
    nodes.append(stage_out)

    stage_export = output(stage_out, "StageExport", "StageExport", -1)
    nodes.append(stage_export)

    netbox = loader.parent().createNetworkBox()
    netbox.setComment("Work between STAGE_IN and STAGE_OUT")
    netbox.setSize((8, 13.7))
    netbox.setPosition(stage_out.position())
    netbox.setColor(BLUE)
    netbox.move((-1.5, 1.15))
    netbox.addNode(lb_above)
    netbox.addNode(lb)
    netbox.addNode(lb_below)
    nodes.append(netbox)

    return loader, stage_export, nodes


def create_sops_layout(kwargs):
    nodes = []

    loader = kwargs["loader"]
    nodes.append(loader)

    stage_in = output(loader, "null", "STAGE_IN", -1, GREY)
    nodes.append(stage_in)

    stage_out = output(stage_in, "null", "STAGE_OUT", -16, BLACK)
    nodes.append(stage_out)

    stage_export = output(stage_out, "StageExport", "StageExport", -1)
    nodes.append(stage_export)

    netbox = loader.parent().createNetworkBox()
    netbox.setComment("Work between STAGE_IN and STAGE_OUT")
    netbox.setSize((6, 13.7))
    netbox.setPosition(stage_out.position())
    netbox.setColor(BLUE)
    netbox.move((-1.5, 1.15))
    nodes.append(netbox)

    return loader, stage_export, nodes


def make_tasks(loader, tasks, mute=""):
    amount = len(tasks)
    loader.parm("amount").set(amount)
    tog = 1
    for i in range(amount):
        index = str(i + 1)
        name = tasks[i]
        loader.parm("task_" + index).set(name)
        if name == mute:
            tog = 0
        loader.parm("tog_" + index).set(tog)


def select_nodes(nodes):
    if not nodes:
        return
    first_node = nodes.pop(0)
    first_node.setSelected(1, clear_all_selected=True, show_asset_if_selected=True)
    for node in nodes:
        node.setSelected(1)


def insert_sop_create(nodes):
    parent = next = netbox = None
    for node in nodes:
        name = node.name()
        if "ANYTHING_BELOW" in name:
            parent = node
        elif "STAGE_OUT" in name:
            next = node
        elif "__netbox" in name:
            netbox = node

    sop_create = output(parent, "sopcreate", "sopcreate", -2)
    sop_create.parm("enable_pathattr").set(1)
    next.setInput(0, sop_create)

    box = sop_create.node("sopnet/create").createNode("box")
    t0 = output(box, "xform", "transform", -1)
    t1 = output(box, "xform", "transform", -1)
    t2 = output(box, "xform", "transform", -1)
    t0.move((-4, 0))
    t2.move((4, 0))
    name0 = output(t0, "name", "model_part1", -1)
    name1 = output(t1, "name", "model_part2", -1)
    name2 = output(t2, "name", "model_part3", -1)
    for n in (name0, name1, name2):
        n.parm("name1").set("$OS")
        n.setColor(BLUE)
    solaris_prep = output(name1, "SolarisPrep", "SolarisPrep", -1)
    solaris_prep.insertInput(0, name0)
    solaris_prep.setNextInput(name2)
    solaris_prep.setColor(BLACK)

    netbox.addNode(sop_create)

    return sop_create


def create_asset_layout(kwargs):
    fn = kwargs["layout_fn"]
    loader, stage_export, nodes = fn(kwargs)
    loader.setName("load_asset_stage", True)
    loader.parm("type").set("asset")
    task = ENV.get("TASK", "")

    if task == "model":
        sop_create = insert_sop_create(nodes)
        nodes.append(sop_create)

    make_tasks(loader, ("model", "fx", "look"), task)
    if task == "look":
        stage_export.parm("ext").set("usda")
    else:
        stage_export.parm("ext").set("usdc")
    wa = ENV.get("WA")
    if wa != "main":
        stage_export.parm("name").set("${WA}_${TASK}")
    select_nodes(nodes)


def create_sequence_layout(kwargs):
    fn = kwargs["layout_fn"]
    loader, stage_export, nodes = fn(kwargs)
    loader.setName("load_sequence_stage")
    loader.parm("type").set("sequence")
    task = ENV.get("TASK", "")

    if task == "layout":
        sop_create = insert_sop_create(nodes)
        nodes.append(sop_create)

    make_tasks(loader, ("layout", "fx", "light"), task)
    if task == "light":
        stage_export.parm("ext").set("usda")
    else:
        stage_export.parm("ext").set("usdc")

    wa = ENV.get("WA")
    name = "${SEQUENCE}_${TASK}" if wa == "main" else "${WA}_${TASK}"
    stage_export.parm("name").set(name)
    select_nodes(nodes)


def create_shot_layout(kwargs):
    fn = kwargs["layout_fn"]
    loader, stage_export, nodes = fn(kwargs)
    loader.setName("load_shot_stage", True)

    seq_loader = loader.createInputNode(0, "StageLoader", "load_sequence_stage")
    seq_loader.setPosition(loader.position())
    seq_loader.move((0, 1))
    seq_loader.parm("type").set("sequence")
    nodes.append(seq_loader)
    make_tasks(seq_loader, ("layout", "fx", "light"))

    loader.parm("type").set("shot")
    task = ENV.get("TASK", "")
    make_tasks(loader, ("matchmove", "layout", "animate", "fx", "light"), task)
    if task == "light":
        stage_export.parm("ext").set("usda")
    else:
        stage_export.parm("ext").set("usdc")

    wa = ENV.get("WA")
    name = "${SHOT}_${TASK}" if wa == "main" else "${WA}_${TASK}"
    stage_export.parm("name").set(name)

    select_nodes(nodes)
