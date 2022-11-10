import tempfile
import tkinter as tk
from pathlib import Path

from PIL import ImageGrab, ImageTk, Image

hc = hou.qt.mainWindow().geometry()
#file = tempfile.TemporaryFile()
#screenshot = ImageGrab.grab()
#screenshot.save(file, "PNG")

root = tk.Tk()
root.geometry(f"{hc.width()}x{hc.height()}+{hc.x()}+{hc.y()}")

def close(event):
    root.destroy()

root.bind('<Escape>', close)

#root.resizable(False, False)
#root.attributes('-fullscreen', True)
root.lift()
#root.attributes("-topmost", True)
root.after(1, lambda: root.focus_force())

frame = tk.Frame(root)
frame.pack(fill=tk.BOTH, expand=True)
frame.pack_propagate(False)

#img = ImageTk.PhotoImage(Image.open(file))
#bg = tk.Label(frame, image=img)
#bg.pack(side="bottom", fill="both")

canvas = tk.Canvas(frame, highlightthickness=0, background="#000")
canvas.pack(fill='both', expand=True)
canvas.create_image(0, 0, anchor=tk.NW)
box = canvas.create_rectangle(10, 10, 150, 150, width=3, outline="#ddd")

center_frame = tk.Frame(frame)
center_frame.place(relx=0.5, rely=0.5, anchor=tk.CENTER)
label = tk.Label(center_frame, text="Click and drag to select an area\nPress ESC to cancel", font="Arial 24 bold", bg="black", fg="#ddd")
#center_frame.lift()
#label = canvas.create_text(0, 0, text="Click and drag to select an area\nPress ESC to cancel", font="Arial 24 bold", fill="#ddd")

box_origin = [0, 0]

def showLabel():
    center_frame.place(relx=0.5, rely=0.5, anchor=tk.CENTER)

def hideLabel():
    center_frame.place(relx=0, rely=0, anchor=tk.SE)

def pressed(e):
    global box_origin
    hideLabel()
    box_origin = [e.x, e.y]
    canvas.coords(box, e.x, e.y, e.x, e.y)
    print(f"From {e.x} {e.y}")

def released(e):
    showLabel()
    print(f"To {e.x} {e.y}")

def drag(e):
    global box_origin
    canvas.coords(box, box_origin[0], box_origin[1], e.x, e.y)
    
root.bind("<Button-1>", pressed)
root.bind("<ButtonRelease-1>", released)
root.bind("<B1-Motion>", drag)

root.wm_attributes('-transparentcolor','#000')
root.mainloop()
#file.close()
