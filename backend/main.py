import asyncio
import json
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ml import predict_stock

app = FastAPI(title="Prediksi Saham API")

# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictionRequest(BaseModel):
    ticker: str
    days: int

@app.websocket("/api/predict-stream")
async def predict_stream(websocket: WebSocket):
    await websocket.accept()
    try:
        # Receive init data
        data = await websocket.receive_text()
        request = json.loads(data)
        ticker = request.get("ticker")
        days = request.get("days", 7)
        epochs = request.get("epochs", 15)

        loop = asyncio.get_running_loop()

        # Callback for epoch progress
        def on_epoch_end(epoch, loss, val_loss):
            msg = json.dumps({
                "type": "progress", 
                "epoch": epoch, 
                "loss": float(loss),
                "val_loss": float(val_loss)
            })
            # Send message safely from worker thread back to main loop
            asyncio.run_coroutine_threadsafe(websocket.send_text(msg), loop)

        # Run the heavy ML blocking function in a separate thread
        try:
            result = await asyncio.to_thread(predict_stock, ticker, days, epochs, on_epoch_end)
            await websocket.send_text(json.dumps({"type": "success", "data": result}))
        except Exception as e:
            await websocket.send_text(json.dumps({"type": "error", "message": str(e)}))

    except WebSocketDisconnect:
        print(f"Client disconnected for {ticker}")
    except Exception as e:
        print(f"WebSocket error: {e}")

@app.get("/")
def read_root():
    return {"message": "Welcome to Prediksi Saham API"}
