from ignite.server.entities.directory import Directory


class Sequence(Directory):
    def __init__(self, path="") -> None:
        super().__init__(path, dir_kind="sequence")
