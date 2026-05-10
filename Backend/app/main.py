from fastapi import FastAPI

app = FastAPI(title="NexoCloud API")

@app.get("/")
def read_root():
    return {"message": "Welcome to NexoCloud API"}
