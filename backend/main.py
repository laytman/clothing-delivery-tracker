import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
import requests
from datetime import datetime

load_dotenv()

app = FastAPI(title="Clothing Delivery Tracker")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TEST_CHAT_ID = "CHAT_ID"

print("✅ Сервер запущено успішно")

# Моделі
class OrderUpdateStatus(BaseModel):
    status: str

# Відправка повідомлення
async def send_telegram_notification(order_number: str, status: str, address: str):
    status_messages = {
        "created": "🆕 Замовлення прийнято в роботу",
        "in_delivery": "🚚 Замовлення передано кур'єру. Кур'єр у дорозі!",
        "delivered": "✅ Замовлення успішно доставлено!",
        "cancelled": "❌ Замовлення скасовано"
    }

    message = f"""
📦 <b>Замовлення #{order_number}</b>

{status_messages.get(status, status)}
📍 Адреса: {address}
🕒 Час: {datetime.now().strftime("%H:%M")}
    """.strip()

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": TEST_CHAT_ID,
        "text": message,
        "parse_mode": "HTML"
    }
    
    try:
        requests.post(url, json=payload, timeout=10)
        print(f"📨 Повідомлення відправлено в Telegram для #{order_number}")
    except Exception as e:
        print(f"❌ Помилка Telegram: {e}")

# Ендпоінти
@app.get("/")
async def root():
    return {"message": "🚀 Сервер працює!", "status": "ok"}

@app.patch("/orders/{order_id}/status")
async def update_order_status(order_id: str, status_data: OrderUpdateStatus):
    response = supabase.table("orders").update({
        "status": status_data.status
    }).eq("id", order_id).execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Замовлення не знайдено")

    order = response.data[0]

    await send_telegram_notification(
        order["order_number"], 
        status_data.status, 
        order.get("delivery_address", "Адреса не вказана")
    )

    return {"message": "Статус оновлено", "order": order}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
