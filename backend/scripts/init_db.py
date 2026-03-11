import asyncio
from sqlalchemy import text
from app.database import engine, Base, async_session_maker
from app.models import User, Merchant, MerchantUser, Product, Order, TrafficLog, DiagnosisReport, Opportunity, Strategy, ChatSession, ChatMessage


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with async_session_maker() as session:
        result = await session.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))
        tables = result.fetchall()
        print(f"Created tables: {[t[0] for t in tables]}")
    
    print("Database tables created successfully!")


if __name__ == "__main__":
    asyncio.run(init_db())
