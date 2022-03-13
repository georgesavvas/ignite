import os
import uvicorn
from fastapi import FastAPI

from ignite import utils


CONFIG = utils.get_config()

app = FastAPI()

@app.get("/")
async def root():
    return {"test": "test1"}


# if __name__ == "__main__":
#     uvicorn.run("main:app", host="127.0.0.1", port=5000, log_level="info", reload=True)
