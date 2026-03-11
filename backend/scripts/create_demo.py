import asyncio
import httpx
from datetime import datetime, timedelta
from decimal import Decimal
import random
import uuid

async def create_demo_user():
    async with httpx.AsyncClient() as client:
        url = "http://localhost:8001/api/v1/auth/register"
        data = {
            "email": "demo@example.com",
            "password": "demo123",
            "name": "Demo User"
        }
        try:
            response = await client.post(url, json=data)
            print(f"User created: {response.json()}")
        except Exception as e:
            print(f"Error creating user: {e}")

async def main():
    await create_demo_user()

if __name__ == "__main__":
    asyncio.run(main())
