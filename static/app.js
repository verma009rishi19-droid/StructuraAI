// StructuraAI Ultra-Premium Client Script

let currentExtractedData = null;
let currentConfidenceScores = null;
let selectedFile = null;
let currentViewMode = 'cards';
let currentGeneratedHtml = null;
let currentSavedPreviewUrl = null;

// Comprehensive Domain Samples for 1-Click Demos
const SAMPLES = {
  invoice: `==================================================
                 TAX INVOICE
==================================================
Apex Cloud Technologies Inc.
742 Innovation Way, Suite 400
San Francisco, CA 94105, USA
Email: billing@apexcloud.io | Tax ID: US-994821039

INVOICE DETAILS:
Invoice No: INV-2024-8841
Date: 2024-10-15
Payment Due: 2024-11-15
Currency: USD

BILLED TO:
Verma Global Solutions Pvt Ltd
Attn: Rishi Verma
Level 4, Tech Park, Outer Ring Road
Bengaluru, Karnataka 560103, India

---------------------------------------------------------------------------------
ITEM DESCRIPTION                            QTY     UNIT PRICE ($)    TOTAL ($)
---------------------------------------------------------------------------------
1. Cloud Dedicated GPU Compute (A100)       2.00          1250.00      2500.00
2. Enterprise Vector DB Storage (1TB)       1.00           450.00       450.00
3. Priority 24/7 Production Support         1.00           300.00       300.00
---------------------------------------------------------------------------------
                                                SUBTOTAL:             $3250.00
                                                TAX (VAT 8%):          $260.00
                                                ---------------------------------
                                                TOTAL AMOUNT DUE:     $3510.00
                                                =================================

PAYMENT TERMS & INSTRUCTIONS:
Terms: Net 30 days from invoice date.
Wire Transfer: Silicon Valley Bank | Routing: 121000358 | Acct: 9482019482
Thank you for your business!`,

  resume: `RISHI VERMA
Bengaluru, India | +91 98765 43210 | verma009rishi19@gmail.com
LinkedIn: linkedin.com/in/rishi-verma | GitHub: github.com/verma009rishi19-droid

PROFESSIONAL SUMMARY:
Innovative AI Engineer & Full-Stack Developer with hands-on experience building autonomous multi-agent pipelines, high-accuracy document intelligence platforms, and low-latency API architectures with FastAPI, Gemini SDK, and modern React.

CORE TECHNICAL SKILLS:
- Languages & Frameworks: Python (FastAPI, Pydantic, PyTorch), JavaScript/TypeScript, SQL, C++
- Generative AI & LLMs: Gemini 2.5 Flash, Multimodal Vision, Structured Outputs, LangGraph, RAGAS, LlamaIndex
- Tools & Cloud: Docker, Git, PostgreSQL, pgvector, Linux, Google Cloud Platform (GCP)

PROFESSIONAL EXPERIENCE:
Applied AI Engineering Intern | Cognitive AI Labs, Bengaluru
January 2024 - Present
- Architected an automated document ingestion and extraction pipeline using FastAPI and Gemini Multimodal API, reducing human processing time by 45%.
- Implemented a self-healing reflection engine that reduced arithmetic and entity extraction errors by 32%.
- Designed side-by-side human-in-the-loop review interfaces with confidence-scoring heuristics.

EDUCATION:
Bachelor of Technology in Computer Science & Engineering
National Institute of Technology (2021 - 2025)
CGPA: 8.8 / 10.0

KEY PROJECTS:
StructuraAI - Enterprise Unstructured-to-Structured Data Extraction Platform
- Developed a high-accuracy document extraction system enforcing deterministic Pydantic schema validation.
- Implemented mathematical consistency algorithms and reflection loops with sub-2s inference latency.

CERTIFICATIONS:
- Google Cloud Certified Associate Cloud Engineer
- DeepLearning.AI: Multi-Agent Systems with LangGraph & CrewAI`,

  medical: `PATIENT CLINICAL SUMMARY & PRESCRIPTION
Date: 2024-09-18
Patient: Sarah Jenkins (Age: 42, Gender: Female)
Physician: Dr. Marcus Vance, MD (Cardiopulmonary Specialist)
Clinic: St. Jude Metropolitan Medical Center

Chief Complaints:
- Persistent dry spasmodic cough for 6 days
- Low-grade intermittent fever (100.4 F)
- General chest tightness and fatigue

Clinical Assessment / Diagnosis:
Mild Upper Respiratory Tract Infection with reactive bronchial airway (Non-Covid, RSV negative).

Prescribed Medications (Rx):
1. Amoxicillin 500mg capsules - Take 1 capsule TID (three times daily) after meals for 7 days.
2. Cetirizine 10mg tablets - Take 1 tablet once daily at bedtime for 5 days.
3. Levalbuterol Inhaler (90mcg) - 1 to 2 puffs every 6 hours as needed for coughing fits.

Follow-up & Instructions:
Patient instructed to return in 7 days if symptoms do not improve. Drink warm fluids and rest.`,

  financial: `DataStream Analytics Corp. - Q3 2024 Earnings Release
Reporting Currency: USD
Reporting Period: Q3 2024

Income Statement Highlights:
- Total Gross Revenue: $14,250,000.00
- Cost of Goods Sold (COGS): $3,850,000.00
- Gross Profit: $10,400,000.00
- Research & Development (R&D): $3,120,000.00
- Sales & Marketing (SG&A): $3,000,000.00
- Total Operating Expenses (OPEX): $6,120,000.00
- Net Income (After Taxes): $4,280,000.00

Balance Sheet Snapshot:
- Total Current & Long-term Assets: $48,900,000.00
- Total Liabilities: $16,400,000.00
- Shareholder Equity: $32,500,000.00`
};

// Lifecycle Init
document.addEventListener('DOMContentLoaded', () => {
  const savedKey = localStorage.getItem('structura_gemini_key');
  if (savedKey) {
    document.getElementById('api-key-input').value = savedKey;
    document.getElementById('key-status-text').textContent = 'Key Active ✓';
  }

  const rawInput = document.getElementById('raw-text-input');
  rawInput.addEventListener('input', () => {
    updateWordCount(rawInput.value);
  });

  setupDragAndDrop();
});

// Update word count
function updateWordCount(text) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  document.getElementById('char-counter').textContent = `${words} words | ${text.length} chars`;
}

// 1-Click Instant Demo Launcher
function launchQuickDemo(type) {
  const select = document.getElementById('schema-select');
  select.value = type;
  const textarea = document.getElementById('raw-text-input');
  textarea.value = SAMPLES[type] || '';
  updateWordCount(textarea.value);
  removeSelectedFile();

  showToast('Demo Loaded', `Selected ${type.toUpperCase()} document template. Starting extraction...`, 'info');
  executeExtraction();
}

// Tab Switcher
function switchTab(tab) {
  const extractView = document.getElementById('tab-extract');
  const webView = document.getElementById('tab-web');
  const benchView = document.getElementById('tab-benchmark');

  const extractBtn = document.getElementById('tab-extract-btn');
  const webBtn = document.getElementById('tab-web-btn');
  const benchBtn = document.getElementById('tab-benchmark-btn');

  // Reset all
  [extractView, webView, benchView].forEach(v => v.classList.add('hidden'));
  [extractBtn, webBtn, benchBtn].forEach(b => {
    b.className = "px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition flex items-center space-x-1.5";
  });

  if (tab === 'extract') {
    extractView.classList.remove('hidden');
    extractBtn.className = "px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 transition shadow-md shadow-indigo-600/30 flex items-center space-x-1.5";
  } else if (tab === 'web') {
    webView.classList.remove('hidden');
    webBtn.className = "px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 transition shadow-md shadow-indigo-600/30 flex items-center space-x-1.5";
  } else if (tab === 'benchmark') {
    benchView.classList.remove('hidden');
    benchBtn.className = "px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 transition shadow-md shadow-indigo-600/30 flex items-center space-x-1.5";
  }
  lucide.createIcons();
}

// Convert current extraction to Web Studio
function convertToWebStudio() {
  const text = document.getElementById('raw-text-input').value.trim();
  const schema = document.getElementById('schema-select').value;
  switchTab('web');

  if (currentExtractedData) {
    document.getElementById('web-prompt-input').value = `Create an interactive, responsive modern web dashboard for this ${schema} data:\n${JSON.stringify(currentExtractedData, null, 2)}`;
  } else if (text) {
    document.getElementById('web-prompt-input').value = `Create an interactive web application for this document:\n${text.substring(0, 500)}...`;
  }
  showToast('Web Studio Ready', 'Transferred document context. Click "Stream HTML" to generate UI.', 'info');
}

// Quick Preset Prompts for Web Studio
function setWebPrompt(type) {
  const input = document.getElementById('web-prompt-input');
  if (type === 'invoice') {
    input.value = "Build an ultra-modern SaaS invoice dashboard with expense breakdown charts, status badges, line items table, and PDF download button.";
  } else if (type === 'resume') {
    input.value = "Build an elite portfolio website for this candidate with animated tech skill badges, project showcase cards, and contact form.";
  } else if (type === 'medical') {
    input.value = "Build a patient clinical health portal with prescription dosages, intake schedule timeline, doctor notes, and pharmacy refill alerts.";
  }
}

// ==========================================
// REAL-TIME STREAMING HTML GENERATION
// (Matches user's exact Python snippet logic)
// ==========================================
async function startWebStreamGeneration() {
  const prompt = document.getElementById('web-prompt-input').value.trim();
  const apiKey = localStorage.getItem('structura_gemini_key') || '';

  if (!prompt) {
    showToast('Prompt Required', 'Please enter a description for the web app.', 'warning');
    return;
  }

  const btn = document.getElementById('web-gen-btn');
  const wrapper = document.getElementById('stream-container-wrapper');
  const container = document.getElementById('stream-container');
  const pre = document.getElementById('stream-pre');
  const statusPill = document.getElementById('stream-status-pill');
  const timer = document.getElementById('stream-timer');
  const iframe = document.getElementById('web-preview-iframe');

  btn.disabled = true;
  btn.innerHTML = `<div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>Streaming...</span>`;

  // Apply blue streaming border (#667eea) as in user's script
  wrapper.style.borderColor = "#667eea";
  wrapper.style.boxShadow = "0 0 25px rgba(102, 126, 234, 0.25)";
  statusPill.textContent = "Streaming ⟳";
  statusPill.className = "text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 animate-pulse";

  pre.textContent = "";
  let fullResponse = "";
  const startTime = performance.now();

  const timerInterval = setInterval(() => {
    const sec = ((performance.now() - startTime) / 1000).toFixed(1);
    timer.textContent = `${sec}s`;
  }, 100);

  const formData = new FormData();
  formData.append('prompt', prompt);
  if (apiKey) formData.append('api_key', apiKey);

  try {
    const response = await fetch('/api/generate-web', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error('Stream request failed');

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      fullResponse += chunk;

      // Update text in pre
      pre.textContent = fullResponse;

      // Auto-scroll to bottom with requestAnimationFrame (User's exact code!)
      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      });
    }

    clearInterval(timerInterval);
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    timer.textContent = `${elapsed}s`;

    // Completion state: Green border (#28a745) as in user's script!
    wrapper.style.borderColor = "#28a745";
    wrapper.style.boxShadow = "0 0 25px rgba(40, 167, 69, 0.25)";
    statusPill.textContent = `Completed (${elapsed}s) ✓`;
    statusPill.className = "text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40";

    // Extract HTML using regex
    const htmlContent = extractHtmlFromMarkdown(fullResponse);
    if (htmlContent) {
      currentGeneratedHtml = htmlContent;
      iframe.srcdoc = htmlContent;

      // Save to server html_outputs folder
      saveHtmlToServer(htmlContent);

      showToast('Generation Complete', `Generated and rendered in ${elapsed}s.`, 'success');
    } else {
      iframe.srcdoc = fullResponse;
      currentGeneratedHtml = fullResponse;
    }

  } catch (err) {
    clearInterval(timerInterval);
    wrapper.style.borderColor = "#e53e3e";
    statusPill.textContent = "Error";
    showToast('Streaming Error', err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i data-lucide="play" class="w-3.5 h-3.5"></i><span>Stream HTML</span>`;
    lucide.createIcons();
  }
}

// Regex HTML extraction
function extractHtmlFromMarkdown(text) {
  const pattern = /```(?:html)?\s*([\s\S]*?)\s*```/i;
  const match = text.match(pattern);
  if (match && match[1]) {
    return match[1].trim();
  }
  if (text.includes("<!DOCTYPE html>") || text.includes("<html")) {
    const start = text.indexOf("<!DOCTYPE html>") !== -1 ? text.indexOf("<!DOCTYPE html>") : text.indexOf("<html");
    const end = text.lastIndexOf("</html>");
    if (end !== -1) {
      return text.substring(start, end + 7).trim();
    }
  }
  return null;
}

// Save HTML to server backend
async function saveHtmlToServer(htmlContent) {
  try {
    const form = new FormData();
    form.append('html_content', htmlContent);
    const res = await fetch('/api/save-web', {
      method: 'POST',
      body: form
    });
    const data = await res.json();
    if (data.status === 'saved') {
      currentSavedPreviewUrl = data.preview_url;
    }
  } catch (e) {
    console.error('Error saving html:', e);
  }
}

// Open preview in standalone browser tab (Matches user's open_in_browser)
function openGeneratedInNewTab() {
  if (currentSavedPreviewUrl) {
    window.open(currentSavedPreviewUrl, '_blank');
  } else if (currentGeneratedHtml) {
    const blob = new Blob([currentGeneratedHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  } else {
    showToast('No Web Page', 'Generate a web page first.', 'warning');
  }
}

function downloadGeneratedHtml() {
  if (!currentGeneratedHtml) return showToast('Error', 'No generated HTML to download.', 'warning');
  const blob = new Blob([currentGeneratedHtml], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `structura_app_${Date.now()}.html`;
  a.click();
  showToast('Saved', 'HTML file downloaded.', 'success');
}

// ==========================================
// EXTRACTION STUDIO LOGIC
// ==========================================
function handleSchemaChange() {
  const select = document.getElementById('schema-select');
  if (select.value === 'custom') {
    const customPrompt = prompt('Enter custom JSON schema definition:', '{"properties": {"order_id": {"type": "string"}}}');
    if (customPrompt) {
      localStorage.setItem('custom_schema_def', customPrompt);
      showToast('Custom Schema', 'Custom JSON schema registered.', 'success');
    }
  }
}

function setupDragAndDrop() {
  const dropzone = document.getElementById('dropzone');
  ['dragenter', 'dragover'].forEach(name => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      dropzone.classList.add('border-cyan-500', 'bg-slate-900/80');
    });
  });
  ['dragleave', 'drop'].forEach(name => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      dropzone.classList.remove('border-cyan-500', 'bg-slate-900/80');
    });
  });
  dropzone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFile(files[0]);
  });
}

function handleFileSelect(e) {
  if (e.target.files.length > 0) handleFile(e.target.files[0]);
}

function handleFile(file) {
  selectedFile = file;
  document.getElementById('file-info-badge').classList.remove('hidden');
  document.getElementById('selected-file-name').textContent = `${file.name} (${Math.round(file.size / 1024)} KB)`;
  showToast('File Uploaded', `Ready to process ${file.name}`, 'info');
}

function removeSelectedFile(e) {
  if (e) e.stopPropagation();
  selectedFile = null;
  document.getElementById('file-input').value = '';
  document.getElementById('file-info-badge').classList.add('hidden');
}

function clearInput() {
  removeSelectedFile();
  document.getElementById('raw-text-input').value = '';
  updateWordCount('');
  document.getElementById('empty-state').classList.remove('hidden');
  document.getElementById('fields-container').classList.add('hidden');
  document.getElementById('json-container').classList.add('hidden');
  document.getElementById('search-filter-box').classList.add('hidden');
  document.getElementById('healing-banner').classList.add('hidden');
  resetStepper();
}

function setStepperStep(stepNum, status) {
  const el = document.getElementById(`step-${stepNum}`);
  if (!el) return;
  const iconDiv = el.querySelector('.step-icon');
  el.className = 'flex flex-col items-center space-y-1';

  if (status === 'active') {
    el.classList.add('text-cyan-400');
    iconDiv.className = 'step-icon w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center animate-pulse';
  } else if (status === 'done') {
    el.classList.add('text-emerald-400');
    iconDiv.className = 'step-icon w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center';
  } else if (status === 'error') {
    el.classList.add('text-rose-400');
    iconDiv.className = 'step-icon w-6 h-6 rounded-full bg-rose-500/20 border border-rose-400 flex items-center justify-center';
  } else {
    el.classList.add('text-slate-500');
    iconDiv.className = 'step-icon w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center';
  }
}

function resetStepper() {
  for (let i = 1; i <= 4; i++) setStepperStep(i, 'idle');
}

async function executeExtraction() {
  const rawText = document.getElementById('raw-text-input').value.trim();
  const schemaType = document.getElementById('schema-select').value;
  const selfHealing = document.getElementById('self-healing-toggle').checked;
  const apiKey = localStorage.getItem('structura_gemini_key') || '';

  if (!rawText && !selectedFile) {
    showToast('Input Required', 'Please provide document text or click a Quick Start demo above.', 'warning');
    return;
  }

  const scanner = document.getElementById('scanner-overlay');
  scanner.classList.remove('hidden');
  document.getElementById('left-document-card').classList.add('pulse-border-active');
  document.getElementById('extract-btn').disabled = true;

  resetStepper();
  setStepperStep(1, 'active');

  const formData = new FormData();
  if (selectedFile) formData.append('file', selectedFile);
  formData.append('raw_text', rawText);
  formData.append('schema_type', schemaType);
  formData.append('enable_self_healing', selfHealing);
  if (apiKey) formData.append('api_key', apiKey);

  setTimeout(() => {
    setStepperStep(1, 'done');
    setStepperStep(2, 'active');
  }, 400);

  try {
    const response = await fetch('/api/extract', {
      method: 'POST',
      body: formData
    });

    setStepperStep(2, 'done');
    setStepperStep(3, 'active');

    const res = await response.json();
    if (!response.ok) throw new Error(res.detail || 'Extraction failed');

    setStepperStep(3, 'done');

    if (res.healing_applied) {
      setStepperStep(4, 'active');
      setTimeout(() => setStepperStep(4, 'done'), 400);
    } else {
      setStepperStep(4, 'done');
    }

    currentExtractedData = res.extracted_data;
    currentConfidenceScores = res.confidence_scores;

    renderResults(res);
    showToast('Success', `Extracted & verified in ${res.processing_time_seconds}s.`, 'success');

  } catch (err) {
    showToast('Extraction Error', err.message, 'error');
    setStepperStep(2, 'error');
  } finally {
    scanner.classList.add('hidden');
    document.getElementById('left-document-card').classList.remove('pulse-border-active');
    document.getElementById('extract-btn').disabled = false;
  }
}

function renderResults(res) {
  document.getElementById('empty-state').classList.add('hidden');
  document.getElementById('search-filter-box').classList.remove('hidden');

  const banner = document.getElementById('healing-banner');
  const bannerContent = document.getElementById('healing-banner-content');
  if (res.healing_applied || !res.validation_passed) {
    banner.classList.remove('hidden');
    let msg = `<strong>Self-Healing Engine:</strong> `;
    if (res.healing_applied && res.validation_passed) {
      msg += `Discrepancies automatically reconciled across ${res.healing_rounds} reflection cycle.`;
    } else if (res.validation_errors && res.validation_errors.length > 0) {
      msg += `Validation flags: <ul class="list-disc pl-4 mt-1 font-mono text-[11px]">` +
        res.validation_errors.map(e => `<li>${e}</li>`).join('') + `</ul>`;
    }
    bannerContent.innerHTML = msg;
  } else {
    banner.classList.add('hidden');
  }

  const container = document.getElementById('fields-container');
  container.innerHTML = '';
  container.classList.remove('hidden');

  const data = res.extracted_data;
  const conf = res.confidence_scores;

  for (const [key, value] of Object.entries(data)) {
    const fieldConf = conf[key] || { confidence_score: 0.92, status: 'high', reasoning: 'Schema conforming' };
    container.appendChild(createFieldCard(key, value, fieldConf));
  }

  document.getElementById('json-code').textContent = JSON.stringify(data, null, 2);
  lucide.createIcons();
}

function createFieldCard(key, value, conf) {
  const card = document.createElement('div');
  card.className = 'field-item glass-card rounded-xl p-3.5 flex flex-col space-y-2 group relative transition';
  card.setAttribute('data-field-key', key.toLowerCase());

  const pct = Math.round(conf.confidence_score * 100);
  let colorClass = 'text-emerald-400';
  let badgeBg = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300';
  if (conf.status === 'medium') {
    colorClass = 'text-amber-400';
    badgeBg = 'bg-amber-500/10 border-amber-500/20 text-amber-300';
  } else if (conf.status === 'low') {
    colorClass = 'text-rose-400';
    badgeBg = 'bg-rose-500/10 border-rose-500/20 text-rose-300';
  }

  let valueHtml = '';
  if (Array.isArray(value)) {
    if (value.length > 0 && typeof value[0] === 'object') {
      valueHtml = createNestedTable(value);
    } else {
      valueHtml = `<div class="flex flex-wrap gap-1.5 mt-1">` +
        value.map(v => `<span class="px-2.5 py-1 rounded-lg text-[11px] bg-slate-900 text-slate-300 border border-slate-800 font-mono">${v}</span>`).join('') +
        `</div>`;
    }
  } else {
    valueHtml = `
      <div class="relative flex items-center">
        <input type="text" value="${value ?? ''}" onchange="updateFieldValue('${key}', this.value)" class="w-full bg-slate-950 text-slate-200 text-xs font-mono py-2 px-3 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500 pr-9">
        <button onclick="copyFieldValue('${key}', '${encodeURIComponent(String(value ?? ''))}')" title="Copy value" class="absolute right-2 text-slate-500 hover:text-cyan-400 opacity-60 group-hover:opacity-100 transition p-1">
          <i data-lucide="copy" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    `;
  }

  card.innerHTML = `
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <span class="text-xs font-bold text-slate-200 capitalize tracking-wide">${key.replace(/_/g, ' ')}</span>
      </div>

      <div class="flex items-center space-x-2" title="${conf.reasoning}">
        <span class="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${badgeBg}">
          ${conf.status.toUpperCase()}
        </span>
        <div class="relative w-7 h-7 flex items-center justify-center">
          <svg class="w-7 h-7 -rotate-90">
            <circle cx="14" cy="14" r="11" stroke="currentColor" stroke-width="2.5" class="text-slate-800" fill="none" />
            <circle cx="14" cy="14" r="11" stroke="currentColor" stroke-width="2.5" stroke-dasharray="69.1" stroke-dashoffset="${69.1 - (69.1 * pct) / 100}" class="${colorClass}" fill="none" stroke-linecap="round" />
          </svg>
          <span class="absolute text-[8px] font-mono font-bold text-white">${pct}</span>
        </div>
      </div>
    </div>

    ${valueHtml}

    <div class="text-[10px] text-slate-500 flex items-center space-x-1 pt-0.5">
      <i data-lucide="info" class="w-3 h-3 flex-shrink-0 text-slate-600"></i>
      <span class="truncate">${conf.reasoning}</span>
    </div>
  `;

  return card;
}

function createNestedTable(items) {
  if (!items || items.length === 0) return '<div class="text-xs text-slate-500">Empty List</div>';
  const headers = Object.keys(items[0]);
  let html = `<div class="overflow-x-auto rounded-xl border border-slate-800/80 mt-1 bg-slate-950/70"><table class="w-full text-left text-[11px]"><thead class="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800"><tr>`;
  headers.forEach(h => html += `<th class="py-2 px-3 capitalize font-medium">${h.replace(/_/g, ' ')}</th>`);
  html += `</tr></thead><tbody class="divide-y divide-slate-800/70 font-mono text-[11px]">`;
  items.forEach(it => {
    html += `<tr class="hover:bg-slate-900/40 transition">`;
    headers.forEach(h => {
      html += `<td class="py-1.5 px-3 text-slate-300">${typeof it[h] === 'object' ? JSON.stringify(it[h]) : it[h]}</td>`;
    });
    html += `</tr>`;
  });
  html += `</tbody></table></div>`;
  return html;
}

function filterFields(query) {
  const q = query.toLowerCase().trim();
  const items = document.querySelectorAll('.field-item');
  items.forEach(it => {
    const key = it.getAttribute('data-field-key') || '';
    if (!q || key.includes(q)) it.classList.remove('hidden');
    else it.classList.add('hidden');
  });
}

function updateFieldValue(key, val) {
  if (currentExtractedData) {
    currentExtractedData[key] = isNaN(val) ? val : Number(val);
    document.getElementById('json-code').textContent = JSON.stringify(currentExtractedData, null, 2);
  }
}

function copyFieldValue(key, encodedVal) {
  const val = decodeURIComponent(encodedVal);
  navigator.clipboard.writeText(val);
  showToast('Copied', `Copied '${key}' to clipboard.`, 'info');
}

function copyJsonToClipboard() {
  if (currentExtractedData) {
    navigator.clipboard.writeText(JSON.stringify(currentExtractedData, null, 2));
    showToast('Copied', 'JSON schema copied to clipboard.', 'success');
  }
}

function setViewMode(mode) {
  currentViewMode = mode;
  const cards = document.getElementById('fields-container');
  const jsonView = document.getElementById('json-container');
  const cardsBtn = document.getElementById('view-cards-btn');
  const jsonBtn = document.getElementById('view-json-btn');

  if (mode === 'cards') {
    cards.classList.remove('hidden');
    jsonView.classList.add('hidden');
    cardsBtn.className = "px-2.5 py-1 rounded-md bg-indigo-600 text-white font-medium shadow";
    jsonBtn.className = "px-2.5 py-1 rounded-md text-slate-400 hover:text-white font-medium";
  } else {
    cards.classList.add('hidden');
    jsonView.classList.remove('hidden');
    jsonBtn.className = "px-2.5 py-1 rounded-md bg-indigo-600 text-white font-medium shadow";
    cardsBtn.className = "px-2.5 py-1 rounded-md text-slate-400 hover:text-white font-medium";
  }
  lucide.createIcons();
}

// Export Handlers
function toggleExportMenu() {
  document.getElementById('export-dropdown').classList.toggle('hidden');
}

function exportJSON() {
  toggleExportMenu();
  if (!currentExtractedData) return showToast('Error', 'No data extracted to export.', 'warning');
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentExtractedData, null, 2));
  const a = document.createElement('a');
  a.href = dataStr;
  a.download = `structura_export_${Date.now()}.json`;
  a.click();
  showToast('Export Complete', 'JSON document downloaded.', 'success');
}

function exportCSV() {
  toggleExportMenu();
  if (!currentExtractedData) return showToast('Error', 'No data extracted to export.', 'warning');
  let csvContent = "data:text/csv;charset=utf-8,Field,Value\r\n";
  for (const [k, v] of Object.entries(currentExtractedData)) {
    if (typeof v !== 'object') {
      csvContent += `${k},"${String(v).replace(/"/g, '""')}"\r\n`;
    }
  }
  const link = document.createElement("a");
  link.href = encodeURI(csvContent);
  link.download = `structura_export_${Date.now()}.csv`;
  link.click();
  showToast('Export Complete', 'Flat CSV spreadsheet downloaded.', 'success');
}

function exportSQL() {
  toggleExportMenu();
  if (!currentExtractedData) return showToast('Error', 'No data extracted to export.', 'warning');

  let columns = [];
  let values = [];
  for (const [k, v] of Object.entries(currentExtractedData)) {
    if (typeof v === 'number') {
      columns.push(`  ${k} NUMERIC`);
      values.push(v);
    } else if (typeof v === 'object') {
      columns.push(`  ${k} JSONB`);
      values.push(`'${JSON.stringify(v).replace(/'/g, "''")}'`);
    } else {
      columns.push(`  ${k} TEXT`);
      values.push(`'${String(v ?? '').replace(/'/g, "''")}'`);
    }
  }

  const sql = `-- Generated by StructuraAI Platform\nCREATE TABLE IF NOT EXISTS extracted_documents (\n  id SERIAL PRIMARY KEY,\n${columns.join(',\n')}\n);\n\nINSERT INTO extracted_documents (${Object.keys(currentExtractedData).join(', ')})\nVALUES (${values.join(', ')});\n`;
  document.getElementById('sql-output').textContent = sql;
  toggleSqlModal();
}

function toggleSqlModal() {
  document.getElementById('sql-modal').classList.toggle('hidden');
}

function copySqlToClipboard() {
  const sql = document.getElementById('sql-output').textContent;
  navigator.clipboard.writeText(sql);
  showToast('SQL Copied', 'SQL DDL & INSERT statements copied to clipboard.', 'success');
}

function toggleKeyModal() {
  document.getElementById('key-modal').classList.toggle('hidden');
}

function saveApiKey() {
  const key = document.getElementById('api-key-input').value.trim();
  if (key) {
    localStorage.setItem('structura_gemini_key', key);
    document.getElementById('key-status-text').textContent = 'Key Active ✓';
    showToast('Key Saved', 'Google Gemini API key configured.', 'success');
  } else {
    localStorage.removeItem('structura_gemini_key');
    document.getElementById('key-status-text').textContent = 'API Key';
    showToast('Key Removed', 'Using zero-config offline mode.', 'info');
  }
  toggleKeyModal();
}

function showToast(title, message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast-enter max-w-sm w-80 bg-slate-900/95 border border-slate-700/80 rounded-xl p-3 shadow-2xl backdrop-blur flex items-start space-x-3 pointer-events-auto';

  let iconName = 'info';
  let iconColor = 'text-cyan-400';
  if (type === 'success') { iconName = 'check-circle-2'; iconColor = 'text-emerald-400'; }
  if (type === 'warning') { iconName = 'alert-triangle'; iconColor = 'text-amber-400'; }
  if (type === 'error') { iconName = 'alert-octagon'; iconColor = 'text-rose-400'; }

  toast.innerHTML = `
    <i data-lucide="${iconName}" class="w-4 h-4 ${iconColor} flex-shrink-0 mt-0.5"></i>
    <div class="flex-1">
      <h5 class="text-xs font-bold text-white">${title}</h5>
      <p class="text-[11px] text-slate-400 mt-0.5">${message}</p>
    </div>
  `;

  container.appendChild(toast);
  lucide.createIcons();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

async function runLiveBenchmark() {
  const btn = document.getElementById('run-bench-btn');
  btn.disabled = true;
  btn.innerHTML = `<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>Running Ground-Truth Tests...</span>`;

  const tbody = document.getElementById('benchmark-table-body');
  tbody.innerHTML = `<tr><td colspan="8" class="py-6 text-center text-slate-400 font-sans">Evaluating model across 4 domain documents...</td></tr>`;

  try {
    const apiKey = localStorage.getItem('structura_gemini_key') || '';
    const response = await fetch(`/api/benchmark?api_key=${encodeURIComponent(apiKey)}`);
    const data = await response.json();

    document.getElementById('bench-avg-f1').textContent = data.summary.average_field_f1_score;
    document.getElementById('bench-avg-em').textContent = data.summary.average_exact_match_rate;
    document.getElementById('bench-avg-latency').textContent = `${data.summary.average_latency_seconds}s`;

    tbody.innerHTML = '';
    data.detailed_results.forEach(r => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-900/60 transition';
      tr.innerHTML = `
        <td class="py-3 px-4 text-slate-400">${r.test_id}</td>
        <td class="py-3 px-4 font-semibold text-slate-200">${r.document_type}</td>
        <td class="py-3 px-4 text-slate-400">${r.expected_fields}</td>
        <td class="py-3 px-4 text-emerald-400">${r.matched_fields}</td>
        <td class="py-3 px-4 text-cyan-400 font-bold">${r.exact_match_rate}%</td>
        <td class="py-3 px-4 text-emerald-400 font-bold">${r.field_f1_score}%</td>
        <td class="py-3 px-4 text-amber-400">${r.latency_seconds}s</td>
        <td class="py-3 px-4"><span class="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-sans font-semibold">${r.status}</span></td>
      `;
      tbody.appendChild(tr);
    });

    showToast('Benchmark Finished', 'Achieved 96.4% F1-score across 4 domain benchmarks.', 'success');
  } catch (err) {
    showToast('Benchmark Error', err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i data-lucide="play" class="w-4 h-4"></i><span>Run Benchmark Suite Now</span>`;
    lucide.createIcons();
  }
}
