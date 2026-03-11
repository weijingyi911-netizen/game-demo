import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Integer, Numeric, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    avatar = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    merchant_users = relationship("MerchantUser", back_populates="user")


class Merchant(Base):
    __tablename__ = "merchants"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    industry = Column(String(100), nullable=True)
    platform = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    merchant_users = relationship("MerchantUser", back_populates="merchant")
    products = relationship("Product", back_populates="merchant")
    orders = relationship("Order", back_populates="merchant")
    traffic_logs = relationship("TrafficLog", back_populates="merchant")


class MerchantUser(Base):
    __tablename__ = "merchant_users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    merchant_id = Column(String(36), ForeignKey("merchants.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    role = Column(String(50), default="owner")
    created_at = Column(DateTime, default=datetime.utcnow)

    merchant = relationship("Merchant", back_populates="merchant_users")
    user = relationship("User", back_populates="merchant_users")


class Product(Base):
    __tablename__ = "products"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    merchant_id = Column(String(36), ForeignKey("merchants.id"), nullable=False)
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=True)
    price = Column(Numeric(10, 2), nullable=False)
    stock = Column(Integer, default=0)
    status = Column(String(50), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    merchant = relationship("Merchant", back_populates="products")


class Order(Base):
    __tablename__ = "orders"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    merchant_id = Column(String(36), ForeignKey("merchants.id"), nullable=False)
    order_no = Column(String(100), nullable=False, unique=True)
    customer_id = Column(String(36), nullable=True)
    product_id = Column(String(36), nullable=True)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    total_amount = Column(Numeric(12, 2), nullable=False)
    status = Column(String(50), nullable=False)
    channel = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    paid_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)

    merchant = relationship("Merchant", back_populates="orders")


class TrafficLog(Base):
    __tablename__ = "traffic_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    merchant_id = Column(String(36), ForeignKey("merchants.id"), nullable=False)
    date = Column(DateTime, nullable=False)
    source = Column(String(100), nullable=True)
    uv = Column(Integer, default=0)
    pv = Column(Integer, default=0)
    new_uv = Column(Integer, default=0)
    bounce_rate = Column(Numeric(5, 2), nullable=True)
    avg_duration = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    merchant = relationship("Merchant", back_populates="traffic_logs")


class DiagnosisReport(Base):
    __tablename__ = "diagnosis_reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    merchant_id = Column(String(36), ForeignKey("merchants.id"), nullable=False)
    problem_type = Column(String(100), nullable=False)
    time_range_start = Column(DateTime, nullable=True)
    time_range_end = Column(DateTime, nullable=True)
    summary = Column(Text, nullable=False)
    factors = Column(JSON, nullable=False)
    deep_analysis = Column(JSON, nullable=True)
    recommendations = Column(JSON, nullable=True)
    expected_outcome = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Opportunity(Base):
    __tablename__ = "opportunities"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    merchant_id = Column(String(36), ForeignKey("merchants.id"), nullable=False)
    type = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    data_evidence = Column(Text, nullable=True)
    value_score = Column(Integer, default=3)
    effort_score = Column(Integer, default=3)
    expected_roi = Column(String(100), nullable=True)
    recommended_actions = Column(JSON, nullable=True)
    status = Column(String(50), default="new")
    created_at = Column(DateTime, default=datetime.utcnow)


class Strategy(Base):
    __tablename__ = "strategies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    merchant_id = Column(String(36), ForeignKey("merchants.id"), nullable=False)
    opportunity_id = Column(String(36), nullable=True)
    type = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    target = Column(Text, nullable=True)
    steps = Column(JSON, nullable=True)
    best_time = Column(String(255), nullable=True)
    expected_effect = Column(Text, nullable=True)
    status = Column(String(50), default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    merchant_id = Column(String(36), ForeignKey("merchants.id"), nullable=False)
    title = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    messages = relationship("ChatMessage", back_populates="session")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("chat_sessions.id"), nullable=False)
    role = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("ChatSession", back_populates="messages")


class StoryProject(Base):
    __tablename__ = "story_projects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    draft = relationship("StoryDraft", back_populates="project", uselist=False)
    releases = relationship("StoryRelease", back_populates="project")
    assets = relationship("StoryAsset", back_populates="project")


class StoryDraft(Base):
    __tablename__ = "story_drafts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("story_projects.id"), nullable=False, unique=True, index=True)
    yaml = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = relationship("StoryProject", back_populates="draft")


class StoryRelease(Base):
    __tablename__ = "story_releases"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("story_projects.id"), nullable=False, index=True)
    version = Column(Integer, nullable=False)
    note = Column(Text, nullable=True)
    yaml = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("StoryProject", back_populates="releases")


class StoryAsset(Base):
    __tablename__ = "story_assets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("story_projects.id"), nullable=True, index=True)
    original_name = Column(String(500), nullable=False)
    file_name = Column(String(500), nullable=False)
    content_type = Column(String(200), nullable=True)
    size = Column(Integer, nullable=False)
    url = Column(String(1000), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("StoryProject", back_populates="assets")
