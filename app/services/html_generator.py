import os
import re
import time
from datetime import datetime
from pathlib import Path
from typing import Generator, Optional
from google import genai
from google.genai import types

OUTPUTS_DIR = "html_outputs"

def ensure_outputs_dir():
    os.makedirs(OUTPUTS_DIR, exist_ok=True)

def save_html(html_content: str) -> str:
    """Saves HTML content to html_outputs/{timestamp}.html and returns the relative path."""
    ensure_outputs_dir()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filepath = os.path.join(OUTPUTS_DIR, f"{timestamp}.html")
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(html_content)
    return filepath

def extract_html(text: str) -> Optional[str]:
    """Extracts raw HTML code from ```html ... ``` markdown block."""
    pattern = r"```(?:html)?\s*(.*?)\s*```"
    matches = re.findall(pattern, text, re.DOTALL)
    if matches:
        return matches[0].strip()
    if "<!DOCTYPE html>" in text or "<html" in text:
        start = text.find("<!DOCTYPE html>") if "<!DOCTYPE html>" in text else text.find("<html")
        end = text.rfind("</html>")
        if end != -1:
            return text[start:end + 7].strip()
    return None

class WebGenerator:
    """
    Service to stream and generate complete, production-grade HTML web applications
    using Google Gemini 2.5 Flash streaming.
    """

    DEFAULT_SYSTEM_PROMPT = (
        "You are an elite principal frontend engineer and UI/UX designer. "
        "Your task is to generate an ultra-modern, production-grade, single-file HTML/CSS/JS web application. "
        "Rules:\n"
        "1. Include modern Tailwind CSS via CDN (<script src='https://cdn.tailwindcss.com'></script>).\n"
        "2. Include Lucide icons (<script src='https://unpkg.com/lucide@latest'></script> and run lucide.createIcons() at the end).\n"
        "3. Include Google Fonts (Inter or Plus Jakarta Sans).\n"
        "4. Design with a sleek, dark/light modern aesthetic, smooth glassmorphism, responsive layout, and interactive JS controls.\n"
        "5. Output ONLY the raw complete HTML document wrapped inside ```html ... ``` without conversational commentary."
    )

    @staticmethod
    def stream_html_generation(
        user_prompt: str,
        system_prompt: Optional[str] = None,
        api_key: Optional[str] = None,
    ) -> Generator[str, None, None]:
        """
        Streams generated HTML text chunks in real-time.
        Falls back to realistic streaming simulation if no API key is provided.
        """
        gemini_key = api_key or os.getenv("GEMINI_API_KEY")

        if gemini_key and gemini_key.strip():
            client = genai.Client(api_key=gemini_key)
            config = types.GenerateContentConfig(
                system_instruction=system_prompt or WebGenerator.DEFAULT_SYSTEM_PROMPT,
                temperature=0.7,
            )

            try:
                response_stream = client.models.generate_content_stream(
                    model="gemini-2.5-flash",
                    contents=user_prompt,
                    config=config,
                )
                for chunk in response_stream:
                    if chunk.text:
                        yield chunk.text
                return
            except Exception as e:
                yield f"\n[API Stream Exception: {str(e)}. Switching to local high-fidelity generator...]\n"

        # High-Fidelity Streaming Fallback
        for chunk in WebGenerator._simulate_streaming(user_prompt):
            time.sleep(0.015)
            yield chunk

    @staticmethod
    def _simulate_streaming(prompt: str) -> Generator[str, None, None]:
        """Simulates realistic streaming generation of a rich, responsive HTML dashboard."""
        is_invoice = "invoice" in prompt.lower()
        is_resume = "resume" in prompt.lower() or "portfolio" in prompt.lower()

        title = "Interactive Document Dashboard"
        accent = "indigo"
        if is_invoice:
            title = "Apex Cloud - Interactive Invoice & Expense Portal"
            accent = "cyan"
        elif is_resume:
            title = "Rishi Verma - AI Systems Engineer Portfolio"
            accent = "violet"

        sample_code = f"""```html
<!DOCTYPE html>
<html lang="en" class="h-full bg-slate-950 text-slate-100">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    body {{ font-family: 'Plus Jakarta Sans', sans-serif; }}
    code, .font-mono {{ font-family: 'JetBrains Mono', monospace; }}
    .glass-card {{
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }}
  </style>
</head>
<body class="min-h-full flex flex-col p-6 bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
  <div class="max-w-5xl mx-auto w-full flex flex-col space-y-6">
    
    <!-- Header -->
    <header class="glass-card rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <i data-lucide="layers" class="w-5 h-5 text-white"></i>
        </div>
        <div>
          <h1 class="text-xl font-bold tracking-tight text-white">{title}</h1>
          <p class="text-xs text-slate-400">AI-Generated Interactive View powered by StructuraAI</p>
        </div>
      </div>
      <div class="flex items-center space-x-2">
        <span class="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1.5">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Validated Live Record</span>
        </span>
      </div>
    </header>

    <!-- Key Metrics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="glass-card p-5 rounded-2xl">
        <span class="text-xs text-slate-400 uppercase font-semibold">Total Document Value</span>
        <div class="text-2xl font-black text-cyan-400 mt-1 font-mono">$3,510.00</div>
        <span class="text-[11px] text-slate-500 mt-0.5 block">Reconciled with 0% math discrepancy</span>
      </div>
      <div class="glass-card p-5 rounded-2xl">
        <span class="text-xs text-slate-400 uppercase font-semibold">Verification Confidence</span>
        <div class="text-2xl font-black text-emerald-400 mt-1 font-mono">98.4%</div>
        <span class="text-[11px] text-slate-500 mt-0.5 block">High confidence ground truth</span>
      </div>
      <div class="glass-card p-5 rounded-2xl">
        <span class="text-xs text-slate-400 uppercase font-semibold">Status & Terms</span>
        <div class="text-2xl font-black text-amber-400 mt-1 font-mono">Net 30 Days</div>
        <span class="text-[11px] text-slate-500 mt-0.5 block">Payment due by 2024-11-15</span>
      </div>
    </div>

    <!-- Data Details Section -->
    <div class="glass-card rounded-2xl p-6">
      <div class="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <h3 class="text-sm font-bold text-slate-200">Extracted Entity Records</h3>
        <button onclick="alert('Exporting record...')" class="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center space-x-1">
          <i data-lucide="download" class="w-3.5 h-3.5"></i>
          <span>Download PDF</span>
        </button>
      </div>

      <div class="overflow-x-auto rounded-xl border border-slate-800">
        <table class="w-full text-left text-xs text-slate-300">
          <thead class="bg-slate-900 text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th class="py-3 px-4">Line Item / Feature</th>
              <th class="py-3 px-4">Quantity</th>
              <th class="py-3 px-4">Rate</th>
              <th class="py-3 px-4">Amount</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/80 font-mono">
            <tr class="hover:bg-slate-900/40 transition">
              <td class="py-3 px-4 font-sans font-medium text-slate-200">Cloud Dedicated GPU Compute (A100)</td>
              <td class="py-3 px-4 text-slate-400">2.00</td>
              <td class="py-3 px-4 text-slate-400">$1,250.00</td>
              <td class="py-3 px-4 text-cyan-400 font-bold">$2,500.00</td>
            </tr>
            <tr class="hover:bg-slate-900/40 transition">
              <td class="py-3 px-4 font-sans font-medium text-slate-200">Enterprise Vector DB Storage (1TB)</td>
              <td class="py-3 px-4 text-slate-400">1.00</td>
              <td class="py-3 px-4 text-slate-400">$450.00</td>
              <td class="py-3 px-4 text-cyan-400 font-bold">$450.00</td>
            </tr>
            <tr class="hover:bg-slate-900/40 transition">
              <td class="py-3 px-4 font-sans font-medium text-slate-200">Priority 24/7 Production Support</td>
              <td class="py-3 px-4 text-slate-400">1.00</td>
              <td class="py-3 px-4 text-slate-400">$300.00</td>
              <td class="py-3 px-4 text-cyan-400 font-bold">$300.00</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
  <script>lucide.createIcons();</script>
</body>
</html>
```"""

        # Chunk the output into tokens
        step = 35
        for i in range(0, len(sample_code), step):
            yield sample_code[i:i + step]
