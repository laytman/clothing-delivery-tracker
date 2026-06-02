from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class OrderBase(BaseModel):
    order_number: str
    status: str = "created"
    delivery_address: str
    order_description: Optional[str] = None
    client_id: str
    manager_id: Optional[str] = None
    courier_id: Optional[str] = None

class OrderCreate(OrderBase):
    pass

class OrderRead(OrderBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class OrderUpdateStatus(BaseModel):
    status: str