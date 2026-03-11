import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from app.database import get_db
from app.models import DiagnosisReport, User
from app.schemas.diagnosis import (
    DiagnosisRequest,
    DiagnosisAnalyzeResponse,
    DiagnosisReportResponse,
)
from app.core.security import get_current_active_user

router = APIRouter()


@router.post("/analyze", response_model=DiagnosisAnalyzeResponse)
async def analyze(
    request: DiagnosisRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    report_id = str(uuid.uuid4())
    
    report = DiagnosisReport(
        id=report_id,
        merchant_id=request.merchant_id,
        problem_type=request.problem_type,
        time_range_start=request.time_range.start,
        time_range_end=request.time_range.end,
        summary=f"正在分析{request.problem_type}问题...",
        factors=[
            {
                "name": "流量",
                "current_value": 45000,
                "previous_value": 50000,
                "change_percent": -10,
                "contribution": 40,
                "is_main_factor": False,
            },
            {
                "name": "转化率",
                "current_value": 2.1,
                "previous_value": 2.8,
                "change_percent": -25,
                "contribution": 55,
                "is_main_factor": True,
            },
            {
                "name": "客单价",
                "current_value": 58,
                "previous_value": 60,
                "change_percent": -3.3,
                "contribution": 5,
                "is_main_factor": False,
            },
        ],
        deep_analysis=[
            {
                "dimension": "渠道分析",
                "finding": "移动端转化率下降明显",
                "reason": "移动端页面加载速度变慢",
                "evidence": "移动端转化率从3.2%下降至2.1%，PC端持平",
            }
        ],
        recommendations=[
            {
                "priority": "urgent",
                "action": "优化移动端页面加载速度",
                "expected_effect": "预计转化率提升0.5-1%",
            },
            {
                "priority": "important",
                "action": "加大新用户首单优惠力度",
                "expected_effect": "预计新用户转化率提升15%",
            },
        ],
        expected_outcome="执行以上建议后，预计GMV可回升15-20%",
    )
    
    db.add(report)
    await db.commit()
    
    return DiagnosisAnalyzeResponse(
        report_id=report_id,
        status="completed",
        estimated_time=10
    )


@router.get("/reports", response_model=list[DiagnosisReportResponse])
async def get_reports(
    merchant_id: str,
    page: int = 1,
    page_size: int = 10,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    offset = (page - 1) * page_size
    result = await db.execute(
        select(DiagnosisReport)
        .where(DiagnosisReport.merchant_id == merchant_id)
        .order_by(DiagnosisReport.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    return result.scalars().all()


@router.get("/reports/{report_id}", response_model=DiagnosisReportResponse)
async def get_report(
    report_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(DiagnosisReport).where(DiagnosisReport.id == report_id)
    )
    report = result.scalar_one_or_none()
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    return report
