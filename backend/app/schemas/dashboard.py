from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class MetricTrend(BaseModel):
    value: float
    type: str
    period: str


class Metric(BaseModel):
    name: str
    display_name: str
    value: float
    unit: str
    trend: MetricTrend
    status: str = "normal"


class Alert(BaseModel):
    id: str
    type: str
    level: str
    message: str
    suggested_action: str
    created_at: datetime


class TrendDataPoint(BaseModel):
    date: str
    value: float


class TrendData(BaseModel):
    name: str
    data: List[TrendDataPoint]


class DashboardData(BaseModel):
    metrics: List[Metric]
    alerts: List[Alert]
    trends: Optional[List[TrendData]] = None
