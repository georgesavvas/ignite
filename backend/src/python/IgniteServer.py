import pystray
import PIL.Image


image = PIL.Image.open("ignite_logo.png")

def on_clicked(icon, item):
    print("It worked!")

def exit(icon, item):
    icon.stop()

icon = pystray.Icon("Ignite", image, menu=pystray.Menu(
    pystray.MenuItem("Settings", on_clicked),
    pystray.MenuItem("Exit", exit)
))

icon.run()
