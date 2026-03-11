import asyncio
import random
import uuid
from datetime import datetime, timedelta
from decimal import Decimal

from app.database import async_session_maker
from app.models import User, Merchant, MerchantUser, Product, Order, TrafficLog
from app.core.security import get_password_hash

MERCHANT_ID = "550e8400-e29b-41d4-a716-446655440000"


async def generate_mock_data():
    async with async_session_maker() as db:
        print("Creating demo user...")
        user = User(
            id=str(uuid.uuid4()),
            email="demo@example.com",
            password_hash=get_password_hash("demo123"),
            name="Demo User",
        )
        db.add(user)

        print("Creating demo merchant...")
        merchant = Merchant(
            id=MERCHANT_ID,
            name="Demo Store",
            industry="Food & Beverage",
            platform="Taobao",
        )
        db.add(merchant)

        merchant_user = MerchantUser(
            id=str(uuid.uuid4()),
            merchant_id=MERCHANT_ID,
            user_id=user.id,
            role="owner",
        )
        db.add(merchant_user)

        print("Creating products...")
        products = []
        categories = ["Snacks", "Beverages", "Instant Food", "Condiments", "Health Food"]
        for i in range(20):
            product = Product(
                id=str(uuid.uuid4()),
                merchant_id=MERCHANT_ID,
                name=f"Product {i+1}",
                category=random.choice(categories),
                price=Decimal(random.uniform(10, 200)).quantize(Decimal("0.01")),
                stock=random.randint(0, 500),
                status="active",
            )
            products.append(product)
            db.add(product)

        print("Creating orders...")
        channels = ["Mobile App", "PC Web", "Mini Program", "Live Stream"]
        statuses = ["paid", "shipped", "delivered", "completed"]
        
        for i in range(500):
            product = random.choice(products)
            quantity = random.randint(1, 5)
            unit_price = product.price
            total_amount = unit_price * quantity
            
            days_ago = random.randint(0, 60)
            created_at = datetime.utcnow() - timedelta(days=days_ago)
            
            order = Order(
                id=str(uuid.uuid4()),
                merchant_id=MERCHANT_ID,
                order_no=f"ORD{datetime.now().strftime('%Y%m%d')}{random.randint(10000, 99999)}",
                product_id=product.id,
                quantity=quantity,
                unit_price=unit_price,
                total_amount=total_amount,
                status=random.choice(statuses),
                channel=random.choice(channels),
                created_at=created_at,
                paid_at=created_at + timedelta(minutes=random.randint(1, 30)),
            )
            db.add(order)

        print("Creating traffic logs...")
        sources = ["Search", "Recommendation", "Direct", "Social Media", "Ads"]
        
        for days_ago in range(60):
            date = datetime.utcnow() - timedelta(days=days_ago)
            date = date.replace(hour=0, minute=0, second=0, microsecond=0)
            
            for source in sources:
                traffic_log = TrafficLog(
                    id=str(uuid.uuid4()),
                    merchant_id=MERCHANT_ID,
                    date=date,
                    source=source,
                    uv=random.randint(500, 8000),
                    pv=random.randint(2000, 30000),
                    new_uv=random.randint(100, 2000),
                    bounce_rate=Decimal(random.uniform(20, 60)).quantize(Decimal("0.01")),
                    avg_duration=random.randint(60, 300),
                )
                db.add(traffic_log)

        await db.commit()
        print("Mock data created successfully!")
        print(f"User: demo@example.com / demo123")
        print(f"Merchant ID: {MERCHANT_ID}")


async def main():
    await generate_mock_data()


if __name__ == "__main__":
    asyncio.run(main())
