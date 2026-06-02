from supabase import create_client, Client
from dotenv import load_dotenv
import os

load_dotenv()

# Підключення до Supabase
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

def get_supabase() -> Client:
    """Функція для отримання клієнта Supabase в будь-якому місці проєкту"""
    return supabase

print("✅ Підключення до Supabase налаштовано")
