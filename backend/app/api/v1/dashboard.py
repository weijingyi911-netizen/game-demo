from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta

from app.database import get_db
from app.models import Order, TrafficLog
from app.schemas.dashboard import (
    DashboardData,
    Metric,
    MetricTrend,
    Alert,
)

router = APIRouter()


@router.get("/metrics", response_model=DashboardData)
async def get_metrics(
    merchant_id: str = Query(...),
    time_range: str = Query("7d"),
    db: AsyncSession = Depends(get_db),
):
    end_date = datetime.utcnow()
    if time_range == "today":
        start_date = end_date.replace(hour=0, minute=0, second=0, microsecond=0)
        prev_start = start_date - timedelta(days=1)
        prev_end = start_date
    elif time_range == "30d":
        start_date = end_date - timedelta(days=30)
        prev_start = start_date - timedelta(days=30)
        prev_end = start_date
    else:
        start_date = end_date - timedelta(days=7)
        prev_start = start_date - timedelta(days=7)
        prev_end = start_date

    current_orders = await db.execute(
        select(Order)
        .where(Order.merchant_id == merchant_id)
        .where(Order.created_at >= start_date)
        .where(Order.created_at <= end_date)
    )
    current_orders_list = current_orders.scalars().all()

    prev_orders = await db.execute(
        select(Order)
        .where(Order.merchant_id == merchant_id)
        .where(Order.created_at >= prev_start)
        .where(Order.created_at <= prev_end)
    )
    prev_orders_list = prev_orders.scalars().all()

    current_gmv = sum(float(o.total_amount) for o in current_orders_list)
    prev_gmv = sum(float(o.total_amount) for o in prev_orders_list)

    current_traffic = await db.execute(
        select(func.sum(TrafficLog.uv))
        .where(TrafficLog.merchant_id == merchant_id)
        .where(TrafficLog.date >= start_date)
    )
    current_uv = current_traffic.scalar() or 0

    prev_traffic = await db.execute(
        select(func.sum(TrafficLog.uv))
        .where(TrafficLog.merchant_id == merchant_id)
        .where(TrafficLog.date >= prev_start)
        .where(TrafficLog.date <= prev_end)
    )
    prev_uv = prev_traffic.scalar() or 0

    current_order_count = len(current_orders_list)
    prev_order_count = len(prev_orders_list)

    current_conversion = (current_order_count / current_uv * 100) if current_uv > 0 else 0
    prev_conversion = (prev_order_count / prev_uv * 100) if prev_uv > 0 else 0

    current_avg_price = (current_gmv / current_order_count) if current_order_count > 0 else 0
    prev_avg_price = (prev_gmv / prev_order_count) if prev_order_count > 0 else 0

    def calc_trend(current: float, previous: float) -> MetricTrend:
        if previous == 0:
            change = 100 if current > 0 else 0
        else:
            change = round((current - previous) / previous * 100, 1)
        
        if change > 0:
            trend_type = "up"
        elif change < 0:
            trend_type = "down"
        else:
            trend_type = "flat"
        
        return MetricTrend(
            value=abs(change),
            type=trend_type,
            period=f"环比{'上周' if time_range == '7d' else '上期'}"
        )

    metrics = [
        Metric(
            name="gmv",
            display_name="GMV",
            value=round(current_gmv, 2),
            unit="¥",
            trend=calc_trend(current_gmv, prev_gmv),
            status="normal" if current_gmv >= prev_gmv else "warning"
        ),
        Metric(
            name="order_count",
            display_name="订单量",
            value=current_order_count,
            unit="单",
            trend=calc_trend(current_order_count, prev_order_count),
            status="normal"
        ),
        Metric(
            name="traffic",
            display_name="流量",
            value=current_uv,
            unit="UV",
            trend=calc_trend(current_uv, prev_uv),
            status="normal" if current_uv >= prev_uv else "warning"
        ),
        Metric(
            name="conversion_rate",
            display_name="转化率",
            value=round(current_conversion, 2),
            unit="%",
            trend=calc_trend(current_conversion, prev_conversion),
            status="normal"
        ),
        Metric(
            name="avg_price",
            display_name="客单价",
            value=round(current_avg_price, 2),
            unit="¥",
            trend=calc_trend(current_avg_price, prev_avg_price),
            status="normal"
        ),
    ]

    alerts = []
    if current_uv < prev_uv * 0.85:
        alerts.append(Alert(
            id="alert_001",
            type="traffic_decline",
            level="warning",
            message=f"流量较上期下降 {round((1 - current_uv/prev_uv) * 100, 1)}%",
            suggested_action="点击查看诊断分析",
            created_at=datetime.utcnow()
        ))

    return DashboardData(metrics=metrics, alerts=alerts)


@router.get("/alerts")
async def get_alerts(
    merchant_id: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    return []
