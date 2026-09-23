import json
from typing import Dict, Any, List, Tuple
from app.services.validator import DataValidator
from app.schemas import FieldConfidence

class SelfHealingLoop:
    """
    Self-Healing Reflection Engine.
    When deterministic validation rules detect mathematical or semantic discrepancies,
    this module generates targeted reflection prompts to correct errors without manual intervention.
    """

    @staticmethod
    def heal_extraction(
        extractor,
        raw_text: str,
        schema_type: str,
        current_data: Dict[str, Any],
        validation_errors: List[str],
        max_rounds: int = 2
    ) -> Tuple[Dict[str, Any], bool, int, List[str], Dict[str, FieldConfidence]]:
        """
        Executes the iterative self-healing reflection cycle.
        Returns: (healed_data, validation_passed, rounds_taken, remaining_errors, confidence_map)
        """
        data = current_data
        errors = validation_errors
        rounds_taken = 0
        healing_applied = False

        if not errors:
            # Already clean, no healing needed
            passed, errs, conf = DataValidator.validate_document(schema_type, data, raw_text)
            return data, passed, 0, errs, conf

        for r in range(max_rounds):
            rounds_taken += 1
            healing_applied = True

            # If Gemini client is active
            if extractor.client:
                diagnostic_feedback = (
                    "CRITICAL CORRECTION REQUIRED: Your previous extraction failed deterministic verification rules.\n"
                    f"Errors detected:\n- " + "\n- ".join(errors) + "\n\n"
                    f"Previous Extracted JSON:\n{json.dumps(data, indent=2)}\n\n"
                    "Carefully re-inspect the document text, verify the math (quantity × price = line total, "
                    "sum of line items = subtotal, subtotal + tax = total). "
                    "Correct the discrepancies and output the corrected JSON schema."
                )

                try:
                    healed_candidate = extractor.extract_structured_data(
                        raw_text=diagnostic_feedback + "\n\nOriginal Document:\n" + raw_text,
                        schema_type=schema_type
                    )
                    data = healed_candidate
                except Exception as e:
                    errors.append(f"Healing attempt #{rounds_taken} failed: {str(e)}")
                    break
            else:
                # Deterministic reconciliation for invoice math errors
                data = SelfHealingLoop._deterministic_heal(schema_type, data)

            # Re-validate
            passed, errors, conf = DataValidator.validate_document(schema_type, data, raw_text)
            if passed:
                return data, True, rounds_taken, [], conf

        # Return final state after max rounds
        passed, errors, conf = DataValidator.validate_document(schema_type, data, raw_text)
        return data, passed, rounds_taken, errors, conf

    @staticmethod
    def _deterministic_heal(schema_type: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Algorithmic reconciliation of line items and totals when LLM is in offline/demo mode.
        """
        if schema_type == "invoice":
            items = data.get("line_items", [])
            corrected_subtotal = 0.0
            for item in items:
                qty = float(item.get("quantity") or 0.0)
                price = float(item.get("unit_price") or 0.0)
                item["total"] = round(qty * price, 2)
                corrected_subtotal += item["total"]

            data["subtotal"] = round(corrected_subtotal, 2)
            tax = float(data.get("tax_amount") or 0.0)
            data["total_amount"] = round(data["subtotal"] + tax, 2)

        return data
