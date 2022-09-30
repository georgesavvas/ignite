from ignite.server.entities.directory import Directory


class Shot(Directory):
    def __init__(self, path="") -> None:
        super().__init__(path, dir_kind="shot")
