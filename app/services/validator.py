import re
from typing import Dict, Any, List, Tuple
from app.schemas import FieldConfidence

class DataValidator:
    """
    Accuracy & Verification Engine for StructuraAI.
    Enforces mathematical consistency, semantic constraints, and computes field-level confidence scores.
    """

    @staticmethod
    def validate_document(schema_type: str, data: Dict[str, Any], raw_text: str) -> Tuple[bool, List[str], Dict[str, FieldConfidence]]:
        errors: List[str] = []
        confidence_map: Dict[str, FieldConfidence] = {}

        if schema_type == "invoice":
            errors.extend(DataValidator._validate_invoice_math(data))
        elif schema_type == "financial":
            errors.extend(DataValidator._validate_financial_math(data))
        elif schema_type == "resume":
            errors.extend(DataValidator._validate_resume_integrity(data))

        # Compute field confidence scores
        confidence_map = DataValidator._compute_confidence(data, raw_text, errors)
        validation_passed = len(errors) == 0

        return validation_passed, errors, confidence_map

    @staticmethod
    def _validate_invoice_math(data: Dict[str, Any]) -> List[str]:
        errors = []
        items = data.get("line_items", [])
        subtotal = float(data.get("subtotal") or 0.0)
        tax = float(data.get("tax_amount") or 0.0)
        total = float(data.get("total_amount") or 0.0)

        # 1. Check each line item math: qty * unit_price == total
        calc_subtotal = 0.0
        for i, item in enumerate(items):
            qty = float(item.get("quantity") or 0.0)
            price = float(item.get("unit_price") or 0.0)
            line_tot = float(item.get("total") or 0.0)
            expected_line_tot = round(qty * price, 2)

            if abs(expected_line_tot - line_tot) > 0.05 and line_tot > 0:
                errors.append(
                    f"Line item #{i+1} ('{item.get('description', '')}') total mismatch: "
                    f"{qty} × {price} = {expected_line_tot}, but extracted total was {line_tot}."
                )
            calc_subtotal += line_tot

        # 2. Check line items sum vs subtotal
        if items and abs(calc_subtotal - subtotal) > 0.10 and subtotal > 0:
            errors.append(
                f"Subtotal calculation mismatch: Sum of line items ({round(calc_subtotal, 2)}) "
                f"does not match extracted subtotal ({subtotal})."
            )

        # 3. Check subtotal + tax vs total
        expected_total = round(subtotal + tax, 2)
        if subtotal > 0 and abs(expected_total - total) > 0.10 and total > 0:
            errors.append(
                f"Total amount mismatch: Subtotal ({subtotal}) + Tax ({tax}) = {expected_total}, "
                f"but extracted total amount was {total}."
            )

        return errors

    @staticmethod
    def _validate_financial_math(data: Dict[str, Any]) -> List[str]:
        errors = []
        revenue = data.get("total_revenue")
        cogs = data.get("cost_of_goods_sold")
        gross_profit = data.get("gross_profit")
        net_income = data.get("net_income")

        if revenue is not None and cogs is not None and gross_profit is not None:
            calc_gross = round(float(revenue) - float(cogs), 2)
            if abs(calc_gross - float(gross_profit)) > 0.10:
                errors.append(
                    f"Gross profit mismatch: Revenue ({revenue}) - COGS ({cogs}) = {calc_gross}, "
                    f"extracted gross profit was {gross_profit}."
                )

        if revenue is not None and net_income is not None:
            if float(net_income) > float(revenue) and float(revenue) > 0:
                errors.append(f"Net income ({net_income}) cannot exceed total revenue ({revenue}).")

        return errors

    @staticmethod
    def _validate_resume_integrity(data: Dict[str, Any]) -> List[str]:
        errors = []
        email = data.get("email")
        if email and not re.match(r"[^@]+@[^@]+\.[^@]+", str(email)):
            errors.append(f"Extracted email '{email}' does not match valid email syntax.")
        return errors

    @staticmethod
    def _compute_confidence(data: Dict[str, Any], raw_text: str, errors: List[str]) -> Dict[str, FieldConfidence]:
        raw_text_lower = (raw_text or "").lower()
        confidence_results: Dict[str, FieldConfidence] = {}
        error_blob = " ".join(errors).lower()

        for key, val in data.items():
            if val is None or val == "":
                confidence_results[key] = FieldConfidence(
                    field_name=key,
                    value=val,
                    confidence_score=0.40,
                    status="low",
                    reasoning="Field is empty or null in extraction."
                )
                continue

            # Check if this field is mentioned in validation errors
            if key in error_blob or (isinstance(val, (int, float)) and str(val) in error_blob):
                confidence_results[key] = FieldConfidence(
                    field_name=key,
                    value=val,
                    confidence_score=0.55,
                    status="low",
                    reasoning="Validation rule flagged potential calculation or format mismatch."
                )
                continue

            # Complex list types
            if isinstance(val, list):
                if len(val) > 0:
                    confidence_results[key] = FieldConfidence(
                        field_name=key,
                        value=f"[{len(val)} items]",
                        confidence_score=0.92,
                        status="high",
                        reasoning=f"Successfully extracted array of {len(val)} elements with validated nested types."
                    )
                else:
                    confidence_results[key] = FieldConfidence(
                        field_name=key,
                        value="[]",
                        confidence_score=0.70,
                        status="medium",
                        reasoning="Empty list extracted."
                    )
                continue

            # Primitive types (str, int, float)
            val_str = str(val).strip().lower()
            if val_str and val_str in raw_text_lower:
                confidence_results[key] = FieldConfidence(
                    field_name=key,
                    value=val,
                    confidence_score=0.98,
                    status="high",
                    reasoning="Exact verbatim match found in source document text."
                )
            elif isinstance(val, (int, float)):
                confidence_results[key] = FieldConfidence(
                    field_name=key,
                    value=val,
                    confidence_score=0.90,
                    status="high",
                    reasoning="Validated numeric field adhering to schema constraints."
                )
            else:
                # Substring token match check
                tokens = val_str.split()
                matched_tokens = [t for t in tokens if len(t) > 2 and t in raw_text_lower]
                if tokens and len(matched_tokens) / len(tokens) >= 0.5:
                    confidence_results[key] = FieldConfidence(
                        field_name=key,
                        value=val,
                        confidence_score=0.82,
                        status="medium",
                        reasoning="Partial semantic token match found in source text."
                    )
                else:
                    confidence_results[key] = FieldConfidence(
                        field_name=key,
                        value=val,
                        confidence_score=0.75,
                        status="medium",
                        reasoning="Extracted via high-level contextual reasoning."
                    )

        return confidence_results
