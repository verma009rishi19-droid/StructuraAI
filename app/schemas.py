from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# ==========================================
# Pre-built Domain Schemas
# ==========================================

class InvoiceItem(BaseModel):
    description: str = Field(..., description="Description of the item or service")
    quantity: float = Field(..., description="Quantity purchased")
    unit_price: float = Field(..., description="Unit price per item")
    total: float = Field(..., description="Total price for this line item")


class InvoiceSchema(BaseModel):
    invoice_number: str = Field(..., description="Unique invoice identifier or number")
    vendor_name: str = Field(..., description="Name of the seller/vendor company")
    vendor_address: Optional[str] = Field(None, description="Physical address or contact info of the vendor")
    customer_name: str = Field(..., description="Name of the billed customer or client")
    invoice_date: str = Field(..., description="Date invoice was issued (YYYY-MM-DD or as written)")
    due_date: Optional[str] = Field(None, description="Due date for payment")
    currency: str = Field("USD", description="Currency symbol or 3-letter code (e.g. USD, EUR, INR)")
    line_items: List[InvoiceItem] = Field(default_factory=list, description="List of items/services invoiced")
    subtotal: float = Field(..., description="Sum of line items before taxes")
    tax_amount: float = Field(0.0, description="Total tax or VAT charged")
    total_amount: float = Field(..., description="Final invoice total including taxes and discounts")
    payment_terms: Optional[str] = Field(None, description="Payment terms or notes (e.g. Net 30, Due upon receipt)")


class ResumeExperience(BaseModel):
    company: str = Field(..., description="Company or organization name")
    role: str = Field(..., description="Job title or position held")
    duration: Optional[str] = Field(None, description="Time period (e.g. Jun 2022 - Present)")
    location: Optional[str] = Field(None, description="City/Country or Remote")
    highlights: List[str] = Field(default_factory=list, description="Key responsibilities and achievements")


class ResumeEducation(BaseModel):
    degree: str = Field(..., description="Degree or program (e.g. B.Tech in Computer Science)")
    institution: str = Field(..., description="College, university, or school name")
    graduation_year: Optional[str] = Field(None, description="Year of completion or expected graduation")
    grade: Optional[str] = Field(None, description="GPA or percentage if mentioned")


class ResumeSchema(BaseModel):
    full_name: str = Field(..., description="Candidate's full legal name")
    email: Optional[str] = Field(None, description="Primary email address")
    phone: Optional[str] = Field(None, description="Primary contact phone number")
    location: Optional[str] = Field(None, description="Current city/state/country")
    linkedin: Optional[str] = Field(None, description="LinkedIn profile URL or handle")
    github: Optional[str] = Field(None, description="GitHub profile URL or handle")
    summary: Optional[str] = Field(None, description="Professional summary or bio")
    skills: List[str] = Field(default_factory=list, description="Technical and soft skills")
    experience: List[ResumeExperience] = Field(default_factory=list, description="Work history")
    education: List[ResumeEducation] = Field(default_factory=list, description="Educational qualifications")
    certifications: List[str] = Field(default_factory=list, description="Licenses and certifications")


class PrescriptionMedication(BaseModel):
    drug_name: str = Field(..., description="Name of the prescribed medicine")
    dosage: Optional[str] = Field(None, description="Dosage (e.g. 500mg, 10ml)")
    frequency: Optional[str] = Field(None, description="Frequency (e.g. twice daily after meals)")
    duration: Optional[str] = Field(None, description="Duration (e.g. 5 days, 1 month)")
    instructions: Optional[str] = Field(None, description="Special dietary or usage instructions")


class MedicalReportSchema(BaseModel):
    patient_name: str = Field(..., description="Full name of the patient")
    patient_age: Optional[int] = Field(None, description="Age in years")
    patient_gender: Optional[str] = Field(None, description="Gender (Male, Female, Other)")
    doctor_name: Optional[str] = Field(None, description="Consulting physician's name")
    visit_date: Optional[str] = Field(None, description="Date of clinical consultation")
    symptoms: List[str] = Field(default_factory=list, description="Chief complaints or symptoms")
    diagnosis: Optional[str] = Field(None, description="Medical diagnosis or assessment")
    medications: List[PrescriptionMedication] = Field(default_factory=list, description="Prescribed medications")
    follow_up: Optional[str] = Field(None, description="Recommended follow-up period or date")


class FinancialStatementSchema(BaseModel):
    company_name: str = Field(..., description="Name of the reporting entity")
    reporting_period: str = Field(..., description="Fiscal quarter or year (e.g. Q3 2024, FY 2023)")
    currency: str = Field("USD", description="Currency reported")
    total_revenue: float = Field(..., description="Top-line gross revenue or sales")
    cost_of_goods_sold: Optional[float] = Field(None, description="Direct cost of producing goods/services")
    gross_profit: Optional[float] = Field(None, description="Gross profit (Revenue - COGS)")
    operating_expenses: Optional[float] = Field(None, description="Total OPEX (R&D, SG&A)")
    net_income: float = Field(..., description="Bottom-line net profit/loss after taxes")
    total_assets: Optional[float] = Field(None, description="Balance sheet total assets")
    total_liabilities: Optional[float] = Field(None, description="Balance sheet total liabilities")


# ==========================================
# Schema Registry & Dynamic Mapping
# ==========================================

SCHEMA_MAP = {
    "invoice": InvoiceSchema,
    "resume": ResumeSchema,
    "medical": MedicalReportSchema,
    "financial": FinancialStatementSchema,
}


# ==========================================
# API Request & Response Wrappers
# ==========================================

class FieldConfidence(BaseModel):
    field_name: str
    value: Any
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    status: str = Field(..., description="'high' (>=0.85), 'medium' (0.60-0.84), or 'low' (<0.60)")
    reasoning: str


class ExtractionResponse(BaseModel):
    success: bool
    schema_type: str
    extracted_data: Dict[str, Any]
    confidence_scores: Dict[str, FieldConfidence]
    validation_passed: bool
    validation_errors: List[str] = Field(default_factory=list)
    healing_applied: bool = False
    healing_rounds: int = 0
    processing_time_seconds: float = 0.0
    document_summary: Optional[str] = None


class BenchmarkResult(BaseModel):
    test_id: str
    document_type: str
    expected_fields: int
    matched_fields: int
    exact_match_rate: float
    field_f1_score: float
    latency_seconds: float
    status: str
