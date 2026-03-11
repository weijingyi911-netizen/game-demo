from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from uuid import UUID


class TimeRange(BaseModel):
    start: datetime
    end: datetime


class AnalysisFactor(BaseModel):
    name: str
    current_value: float
    previous_value: float
    change_percent: float
    contribution: float
    is_main_factor: bool


class DeepAnalysis(BaseModel):
    dimension: str
    finding: str
    reason: str
    evidence: str


class Recommendation(BaseModel):
    priority: str
    action: str
    expected_effect: str


class DiagnosisReportBase(BaseModel):
    problem_type: str
    summary: str
    factors: List[AnalysisFactor]
    deep_analysis: List[DeepAnalysis]
    recommendations: List[Recommendation]
    expected_outcome: str


class DiagnosisReportCreate(DiagnosisReportBase):
    merchant_id: UUID
    time_range: TimeRange


class DiagnosisReportResponse(DiagnosisReportBase):
    id: UUID
    merchant_id: UUID
    time_range_start: Optional[datetime]
    time_range_end: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class DiagnosisRequest(BaseModel):
    merchant_id: str
    problem_type: str
    time_range: TimeRange
    additional_context: Optional[str] = None


class DiagnosisAnalyzeResponse(BaseModel):
    report_id: str
    status: str
    estimated_time: int = 10
