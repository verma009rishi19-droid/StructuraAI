import io
import time
import json
import csv
from typing import Optional
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, PlainTextResponse
from pypdf import PdfReader
from PIL import Image

from app.schemas import (
    SCHEMA_MAP,
    ExtractionResponse,
    FieldConfidence,
    BenchmarkResult,
)
from app.services.extractor import GeminiExtractor
from app.services.validator import DataValidator
from app.services.healer import SelfHealingLoop
from app.services.benchmark import BenchmarkSuite

app = FastAPI(
    title="StructuraAI API",
    description="Enterprise Unstructured-to-Structured Data Extraction Platform with Accuracy Engine",
    version="1.0.0",
)

# CORS middleware for open integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "StructuraAI", "version": "1.0.0"}


@app.get("/api/schemas")
def get_available_schemas():
    """Returns all pre-built JSON schemas available for extraction."""
    return {
        key: {
            "title": cls.__doc__ or key.capitalize(),
            "schema": cls.model_json_schema()
        }
        for key, cls in SCHEMA_MAP.items()
    }


@app.post("/api/extract", response_model=ExtractionResponse)
async def extract_data(
    file: Optional[UploadFile] = File(None),
    raw_text: Optional[str] = Form(None),
    schema_type: str = Form("invoice"),
    custom_schema: Optional[str] = Form(None),
    enable_self_healing: bool = Form(True),
    api_key: Optional[str] = Form(None),
):
    """
    Extracts structured data from uploaded document (PDF, Image) or raw text.
    Validates mathematical and semantic consistency, and executes self-healing if discrepancies arise.
    """
    start_time = time.time()
    extracted_text = raw_text or ""
    image_bytes = None
    image_mime = None

    # Handle file input
    if file:
        content_bytes = await file.read()
        filename = (file.filename or "").lower()

        if filename.endswith(".pdf"):
            try:
                pdf_reader = PdfReader(io.BytesIO(content_bytes))
                pages_text = []
                for p_idx, page in enumerate(pdf_reader.pages):
                    t = page.extract_text()
                    if t:
                        pages_text.append(t)
                extracted_text = "\n\n".join(pages_text) or extracted_text
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Failed to read PDF file: {str(e)}")

        elif filename.endswith((".png", ".jpg", ".jpeg", ".webp")):
            image_bytes = content_bytes
            image_mime = file.content_type or "image/png"
            # Attempt basic OCR fallback text placeholder if no text
            if not extracted_text:
                extracted_text = f"[Scanned Image: {file.filename}]"
        elif filename.endswith(".txt"):
            extracted_text = content_bytes.decode("utf-8", errors="ignore")

    if not extracted_text and not image_bytes:
        raise HTTPException(
            status_code=400,
            detail="Please provide an input file (PDF, Image) or enter text to extract."
        )

    # Parse custom schema if provided
    parsed_custom_schema = None
    if schema_type == "custom" and custom_schema:
        try:
            parsed_custom_schema = json.loads(custom_schema)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid JSON format for custom_schema.")

    # Initialize Extractor
    extractor = GeminiExtractor(api_key=api_key)

    # 1. Extraction Phase
    try:
        data = extractor.extract_structured_data(
            raw_text=extracted_text,
            schema_type=schema_type,
            custom_schema=parsed_custom_schema,
            image_bytes=image_bytes,
            image_mime=image_mime
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")

    # 2. Accuracy & Verification Phase
    validation_passed, validation_errors, confidence_map = DataValidator.validate_document(
        schema_type=schema_type,
        data=data,
        raw_text=extracted_text
    )

    # 3. Self-Healing Phase (if errors detected and enabled)
    healing_applied = False
    healing_rounds = 0
    if not validation_passed and enable_self_healing:
        healed_data, validation_passed, healing_rounds, validation_errors, confidence_map = (
            SelfHealingLoop.heal_extraction(
                extractor=extractor,
                raw_text=extracted_text,
                schema_type=schema_type,
                current_data=data,
                validation_errors=validation_errors
            )
        )
        data = healed_data
        healing_applied = True

    duration = round(time.time() - start_time, 3)

    return ExtractionResponse(
        success=True,
        schema_type=schema_type,
        extracted_data=data,
        confidence_scores=confidence_map,
        validation_passed=validation_passed,
        validation_errors=validation_errors,
        healing_applied=healing_applied,
        healing_rounds=healing_rounds,
        processing_time_seconds=duration,
        document_summary=f"Processed {len(extracted_text.split())} words across {schema_type} schema in {duration}s."
    )


@app.get("/api/benchmark")
def run_benchmark_suite(api_key: Optional[str] = None):
    """Executes the standard placement evaluation benchmark."""
    extractor = GeminiExtractor(api_key=api_key)
    return BenchmarkSuite.run_benchmark(extractor)


@app.post("/api/export/sql")
def export_as_sql(table_name: str = "extracted_records", data: dict = Form(...)):
    """Generates clean SQL CREATE TABLE and INSERT statements."""
    columns = []
    values = []

    for k, v in data.items():
        if isinstance(v, (int, float)):
            columns.append(f"  {k} NUMERIC")
            values.append(str(v))
        elif isinstance(v, list) or isinstance(v, dict):
            columns.append(f"  {k} JSONB")
            escaped_json = json.dumps(v).replace("'", "''")
            values.append(f"'{escaped_json}'")
        else:
            columns.append(f"  {k} TEXT")
            escaped_str = str(v or '').replace("'", "''")
            values.append(f"'{escaped_str}'")

    col_names = ", ".join(data.keys())
    val_clause = ", ".join(values)

    sql = (
        f"-- StructuraAI Generated SQL DDL & DML\n"
        f"CREATE TABLE IF NOT EXISTS {table_name} (\n"
        f"  id SERIAL PRIMARY KEY,\n"
        + ",\n".join(columns) + "\n"
        f");\n\n"
        f"INSERT INTO {table_name} ({col_names})\n"
        f"VALUES ({val_clause});\n"
    )
    return PlainTextResponse(sql, media_type="text/plain")


# Serve static web frontend
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
def serve_index():
    return FileResponse("static/index.html")
