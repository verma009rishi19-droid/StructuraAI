import os
import json
import time
from typing import Dict, Any, Optional
from google import genai
from google.genai import types
from pydantic import BaseModel

from app.schemas import SCHEMA_MAP, InvoiceSchema, ResumeSchema, MedicalReportSchema, FinancialStatementSchema


class GeminiExtractor:
    """
    Core extraction service integrating Google Gemini 2.5 Flash
    with native Structured Output Schema enforcement.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        self.client = None
        if self.api_key and self.api_key.strip():
            self.client = genai.Client(api_key=self.api_key)

    def extract_structured_data(
        self,
        raw_text: str,
        schema_type: str,
        custom_schema: Optional[Dict[str, Any]] = None,
        image_bytes: Optional[bytes] = None,
        image_mime: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Extracts structured data conforming to the specified schema.
        Falls back to deterministic parser if API key is not configured.
        """
        schema_cls = SCHEMA_MAP.get(schema_type)
        if not schema_cls and not custom_schema:
            raise ValueError(f"Unknown schema type: {schema_type}")

        # If live Gemini Client is available and API key is set
        if self.client:
            return self._call_gemini_api(
                raw_text=raw_text,
                schema_cls=schema_cls,
                custom_schema=custom_schema,
                image_bytes=image_bytes,
                image_mime=image_mime
            )
        else:
            # Deterministic demo fallback for testing without API key
            return self._mock_fallback_extraction(raw_text, schema_type)

    def _call_gemini_api(
        self,
        raw_text: str,
        schema_cls: Optional[type[BaseModel]],
        custom_schema: Optional[Dict[str, Any]],
        image_bytes: Optional[bytes] = None,
        image_mime: Optional[str] = None
    ) -> Dict[str, Any]:
        target_schema = custom_schema if custom_schema else schema_cls.model_json_schema()

        prompt = (
            "You are an enterprise-grade document extraction model. "
            "Extract structured information from the provided document accurately. "
            "Adhere strictly to the requested JSON schema. Do not invent or hallucinate information. "
            "If a field cannot be found, use null or appropriate defaults. Ensure all numerical totals are exact."
        )

        contents = [prompt]
        if raw_text:
            contents.append(f"Document Text:\n{raw_text}")

        if image_bytes and image_mime:
            part = types.Part.from_bytes(data=image_bytes, mime_type=image_mime)
            contents.append(part)

        config = types.GenerateContentConfig(
            response_mime_type="application/json",
            response_json_schema=target_schema,
            temperature=0.0,
        )

        response = self.client.models.generate_content(
            model="gemini-2.5-flash",
            contents=contents,
            config=config,
        )

        try:
            return json.loads(response.text)
        except Exception as e:
            # Fallback parsing in case of markdown block wrappers
            clean_text = response.text.strip()
            if clean_text.startswith("```json"):
                clean_text = clean_text[7:]
            if clean_text.endswith("```"):
                clean_text = clean_text[:-3]
            return json.loads(clean_text.strip())

    def _mock_fallback_extraction(self, text: str, schema_type: str) -> Dict[str, Any]:
        """
        High-fidelity realistic fallback for instant testing when GEMINI_API_KEY is not yet added.
        Allows instant evaluation of accuracy scoring and UI demo.
        """
        if schema_type == "invoice":
            return {
                "invoice_number": "INV-2024-8841",
                "vendor_name": "Apex Cloud Technologies Inc.",
                "vendor_address": "742 Innovation Way, Suite 400, San Francisco, CA 94105",
                "customer_name": "Verma Global Solutions Pvt Ltd",
                "invoice_date": "2024-10-15",
                "due_date": "2024-11-15",
                "currency": "USD",
                "line_items": [
                    {
                        "description": "Cloud Dedicated GPU Compute (A100 Cluster)",
                        "quantity": 2.0,
                        "unit_price": 1250.00,
                        "total": 2500.00
                    },
                    {
                        "description": "Enterprise Vector Database Storage (1TB)",
                        "quantity": 1.0,
                        "unit_price": 450.00,
                        "total": 450.00
                    },
                    {
                        "description": "Priority 24/7 Support Tier",
                        "quantity": 1.0,
                        "unit_price": 300.00,
                        "total": 300.00
                    }
                ],
                "subtotal": 3250.00,
                "tax_amount": 260.00,
                "total_amount": 3510.00,
                "payment_terms": "Net 30. Wire transfer or ACH accepted."
            }
        elif schema_type == "resume":
            return {
                "full_name": "Rishi Verma",
                "email": "verma009rishi19@gmail.com",
                "phone": "+91 98765 43210",
                "location": "Bengaluru, India",
                "linkedin": "https://linkedin.com/in/rishi-verma",
                "github": "https://github.com/verma009rishi19-droid",
                "summary": "AI Engineer & Full-Stack Developer specializing in Autonomous Agents, LLM Structured Outputs, and High-Performance FastAPI Systems.",
                "skills": [
                    "Python", "FastAPI", "Gemini API", "PyTorch", "Pydantic",
                    "LangGraph", "Docker", "PostgreSQL", "Next.js", "TypeScript"
                ],
                "experience": [
                    {
                        "company": "Cognitive AI Labs",
                        "role": "Applied AI Engineering Intern",
                        "duration": "Jan 2024 - Present",
                        "location": "Bengaluru, India",
                        "highlights": [
                            "Built automated document extraction pipelines reducing ingestion latency by 45%.",
                            "Designed self-correcting validation graphs with Gemini 2.5 Flash."
                        ]
                    }
                ],
                "education": [
                    {
                        "degree": "Bachelor of Technology in Computer Science & Engineering",
                        "institution": "National Institute of Technology",
                        "graduation_year": "2025",
                        "grade": "8.8 / 10 CGPA"
                    }
                ],
                "certifications": [
                    "Google Cloud Certified: Associate Cloud Engineer",
                    "DeepLearning.AI: Multi-Agent Systems with CrewAI & LangGraph"
                ]
            }
        elif schema_type == "medical":
            return {
                "patient_name": "Sarah Jenkins",
                "patient_age": 42,
                "patient_gender": "Female",
                "doctor_name": "Dr. Marcus Vance, MD",
                "visit_date": "2024-09-18",
                "symptoms": ["Persistent dry cough", "Low-grade fever", "Fatigue for 4 days"],
                "diagnosis": "Mild Upper Respiratory Tract Infection (Non-Covid)",
                "medications": [
                    {
                        "drug_name": "Amoxicillin",
                        "dosage": "500mg",
                        "frequency": "Three times daily after meals",
                        "duration": "7 days",
                        "instructions": "Complete full course. Drink plenty of water."
                    },
                    {
                        "drug_name": "Cetirizine",
                        "dosage": "10mg",
                        "frequency": "Once daily at bedtime",
                        "duration": "5 days",
                        "instructions": "May cause drowsiness."
                    }
                ],
                "follow_up": "Return in 7 days if fever persists above 101F."
            }
        elif schema_type == "financial":
            return {
                "company_name": "DataStream Analytics Corp.",
                "reporting_period": "Q3 2024",
                "currency": "USD",
                "total_revenue": 14250000.0,
                "cost_of_goods_sold": 3850000.0,
                "gross_profit": 10400000.0,
                "operating_expenses": 6120000.0,
                "net_income": 4280000.0,
                "total_assets": 48900000.0,
                "total_liabilities": 16400000.0
            }
        else:
            return {"status": "Extracted", "text_length": len(text)}
