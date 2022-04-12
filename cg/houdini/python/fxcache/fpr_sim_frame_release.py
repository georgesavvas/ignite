from __future__ import absolute_import, division, unicode_literals, print_function
import os
import opencue as oc
import hou

env = os.environ

try:
    if env.get("CUE_USER"):
        finished_frame = hou.intFrame()

        my_job_id = env["CUE_JOB_ID"]
        my_job = oc.api.getJob(my_job_id)
        my_show = my_job.show()

        my_layer_id = my_job_id = env["CUE_LAYER_ID"]
        my_layer = oc.api.getLayer(my_layer_id)
        my_chunk_size = my_layer.data.chunk_size
        my_frames = my_layer.getFrames()
        my_first_frame = int(my_frames[0].frame())
        my_last_frame = int(my_frames[-1].frame())
        my_frame_range = range(my_first_frame, my_last_frame + my_chunk_size)

        # Since other layers usually depend on the sim's cleanup layer, fetch that
        # if it exists.
        my_d = my_layer.getWhatDependsOnThis()
        if my_d:
            if "cleanup." in my_d[0].dependErLayer():
                my_cleanup_name = my_d[0].dependErLayer()
            else:
                my_cleanup_name = my_layer.name()
        else:
            my_cleanup_name = my_layer.name()
        my_cleanup_layer = oc.api.findLayer(my_job.name(), my_cleanup_name)

        to_release = []
        for d in my_cleanup_layer.getWhatDependsOnThis():
            d_layer = oc.api.findLayer(d.dependErJob(), d.dependErLayer())
            if not d_layer:
                continue
            if "register." in d_layer.name() or "publish." in d_layer.name():
                continue
            chunk_size = d_layer.data.chunk_size
            frames = d_layer.getFrames()
            first_frame = int(frames[0].frame())
            last_frame = int(frames[-1].frame())
            for i in range((my_last_frame - my_first_frame) / my_chunk_size + 1):
                first_chunk_frame = my_frame_range[:: my_chunk_size - 1][i]
                chunk_range = range(
                    first_chunk_frame,
                    min(last_frame + 1, first_chunk_frame + my_chunk_size + 1),
                )
                if finished_frame in chunk_range:
                    my_chunk_range = chunk_range
                    break
            else:
                continue
            for f in frames:
                if "DEPEND" in str(f.FrameState(f.state())):
                    # print("Finished frame {}".format(finished_frame))
                    # print("Checking if {} in {}-{}".format(f.frame(), chunk_range[0], chunk_range[-1]))
                    if (
                        int(f.frame()) in chunk_range
                        and int(f.frame()) <= finished_frame
                        and "DEPEND" in str(f.FrameState(f.state()))
                    ):
                        to_release.append(f)

        if to_release:
            for frame in to_release:
                frame.markAsWaiting()
                print("Releasing frame", frame.frame(), "from", frame.layer())

    else:
        print("Not running on farm.")
except Exception as e:
    print("Sim frame release error:")
    print(e)
