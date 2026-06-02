from fastapi import APIRouter, HTTPException, Depends
from app.schemas.order import OrderCreate, OrderRead, OrderUpdateStatus
from supabase import Client
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/orders", tags=["orders"])

# Підключення Supabase
supabase: Client = Client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

@router.post("/", response_model=OrderRead)
async def create_order(order: OrderCreate):
    """Створення нового замовлення"""
    data = order.model_dump()
    response = supabase.table("orders").insert(data).execute()
    return response.data[0]

@router.get("/")
async def get_all_orders():
    """Отримати всі замовлення"""
    response = supabase.table("orders").select("*").execute()
    return response.data

@router.patch("/{order_id}/status")
async def update_order_status(order_id: str, update: OrderUpdateStatus):
    """Зміна статусу замовлення"""
    response = supabase.table("orders").update({"status": update.status}).eq("id", order_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Замовлення не знайдено")
    return {"message": "Статус оновлено", "order": response.data[0]}