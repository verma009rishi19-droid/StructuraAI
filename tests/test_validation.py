import unittest
from app.services.validator import DataValidator
from app.services.healer import SelfHealingLoop


class TestStructuraAIValidation(unittest.TestCase):

    def test_invoice_math_valid(self):
        valid_invoice = {
            "subtotal": 100.0,
            "tax_amount": 10.0,
            "total_amount": 110.0,
            "line_items": [
                {"description": "Item A", "quantity": 2.0, "unit_price": 50.0, "total": 100.0}
            ]
        }
        raw_text = "Item A qty: 2 price: 50 total: 100 subtotal: 100 tax: 10 total: 110"
        passed, errors, conf = DataValidator.validate_document("invoice", valid_invoice, raw_text)
        self.assertTrue(passed)
        self.assertEqual(len(errors), 0)
        self.assertGreaterEqual(conf["total_amount"].confidence_score, 0.85)

    def test_invoice_math_discrepancy_detected(self):
        invalid_invoice = {
            "subtotal": 100.0,
            "tax_amount": 10.0,
            "total_amount": 150.0, # Intentional math error (100 + 10 != 150)
            "line_items": [
                {"description": "Item A", "quantity": 2.0, "unit_price": 50.0, "total": 100.0}
            ]
        }
        passed, errors, conf = DataValidator.validate_document("invoice", invalid_invoice, "text")
        self.assertFalse(passed)
        self.assertTrue(any("Total amount mismatch" in e for e in errors))
        self.assertEqual(conf["total_amount"].status, "low")

    def test_self_healing_reconciles_math(self):
        flawed_invoice = {
            "subtotal": 50.0, # Incorrect, should be 200
            "tax_amount": 20.0,
            "total_amount": 70.0,
            "line_items": [
                {"description": "Consulting", "quantity": 2.0, "unit_price": 100.0, "total": 150.0} # math error
            ]
        }
        healed = SelfHealingLoop._deterministic_heal("invoice", flawed_invoice)
        self.assertEqual(healed["line_items"][0]["total"], 200.0)
        self.assertEqual(healed["subtotal"], 200.0)
        self.assertEqual(healed["total_amount"], 220.0)

    def test_confidence_scoring_verbatim_match(self):
        data = {
            "vendor_name": "Apex Cloud Technologies",
            "invoice_number": "INV-999"
        }
        raw_text = "Welcome to Apex Cloud Technologies. Your bill INV-999 is ready."
        _, _, conf = DataValidator.validate_document("custom", data, raw_text)
        self.assertEqual(conf["vendor_name"].status, "high")
        self.assertEqual(conf["invoice_number"].status, "high")


if __name__ == "__main__":
    unittest.main()
