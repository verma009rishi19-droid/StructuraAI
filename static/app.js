// StructuraAI Frontend Client

let currentExtractedData = null;
let currentConfidenceScores = null;
let selectedFile = null;
let currentViewMode = 'cards'; // 'cards' or 'json'

// Samples cache
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
- DeepLearning.AI: Multi-Agent Systems with LangGraph & CrewAI`
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  const savedKey = localStorage.getItem('structura_gemini_key');
  if (savedKey) {
    document.getElementById('api-key-input').value = savedKey;
    document.getElementById('key-status-text').textContent = 'Key Active ✓';
  }

  const rawInput = document.getElementById('raw-text-input');
  rawInput.addEventListener('input', () => {
    document.getElementById('char-counter').textContent = `${rawInput.value.length} chars`;
  });

  setupDragAndDrop();
});

// Tab Switcher
function switchTab(tab) {
  const extractView = document.getElementById('tab-extract');
  const benchView = document.getElementById('tab-benchmark');
  const extractBtn = document.getElementById('tab-extract-btn');
  const benchBtn = document.getElementById('tab-benchmark-btn');

  if (tab === 'extract') {
    extractView.classList.remove('hidden');
    benchView.classList.add('hidden');
    extractBtn.className = "px-3.5 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-600 transition shadow";
    benchBtn.className = "px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition";
  } else {
    extractView.classList.add('hidden');
    benchView.classList.remove('hidden');
    benchBtn.className = "px-3.5 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-600 transition shadow";
    extractBtn.className = "px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition";
  }
  lucide.createIcons();
}

// Quick Sample Loader
function loadSampleData(type) {
  const select = document.getElementById('schema-select');
  select.value = type;
  const textarea = document.getElementById('raw-text-input');
  textarea.value = SAMPLES[type] || '';
  document.getElementById('char-counter').textContent = `${textarea.value.length} chars`;
  removeSelectedFile();
}

function handleSchemaChange() {
  const select = document.getElementById('schema-select');
  if (select.value === 'custom') {
    const customPrompt = prompt('Enter custom JSON schema definition or field list:', '{"properties": {"order_id": {"type": "string"}}}');
    if (customPrompt) {
      localStorage.setItem('custom_schema_def', customPrompt);
    }
  }
}

// File Drag & Drop
function setupDragAndDrop() {
  const dropzone = document.getElementById('dropzone');
  ['dragenter', 'dragover'].forEach(name => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      dropzone.classList.add('border-indigo-500', 'bg-slate-900/80');
    });
  });
  ['dragleave', 'drop'].forEach(name => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      dropzone.classList.remove('border-indigo-500', 'bg-slate-900/80');
    });
  });
  dropzone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  });
}

function handleFileSelect(e) {
  if (e.target.files.length > 0) {
    handleFile(e.target.files[0]);
  }
}

function handleFile(file) {
  selectedFile = file;
  document.getElementById('file-info-badge').classList.remove('hidden');
  document.getElementById('selected-file-name').textContent = `${file.name} (${Math.round(file.size / 1024)} KB)`;
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
  document.getElementById('char-counter').textContent = '0 chars';
}

// Execute Extraction
async function executeExtraction() {
  const rawText = document.getElementById('raw-text-input').value.trim();
  const schemaType = document.getElementById('schema-select').value;
  const selfHealing = document.getElementById('self-healing-toggle').checked;
  const apiKey = localStorage.getItem('structura_gemini_key') || '';

  if (!rawText && !selectedFile) {
    alert('Please enter text or upload a document first (or click Quick Load Sample).');
    return;
  }

  // UI Loading State
  document.getElementById('loading-spinner').classList.remove('hidden');
  document.getElementById('extract-btn').disabled = true;

  const formData = new FormData();
  if (selectedFile) {
    formData.append('file', selectedFile);
  }
  formData.append('raw_text', rawText);
  formData.append('schema_type', schemaType);
  formData.append('enable_self_healing', selfHealing);
  if (apiKey) {
    formData.append('api_key', apiKey);
  }

  try {
    const response = await fetch('/api/extract', {
      method: 'POST',
      body: formData
    });

    const res = await response.json();
    if (!response.ok) {
      throw new Error(res.detail || 'Extraction failed');
    }

    currentExtractedData = res.extracted_data;
    currentConfidenceScores = res.confidence_scores;

    renderResults(res);
  } catch (err) {
    alert(`Error: ${err.message}`);
  } finally {
    document.getElementById('loading-spinner').classList.add('hidden');
    document.getElementById('extract-btn').disabled = false;
  }
}

// Render Results
function renderResults(res) {
  // Update KPI Stats
  const statVal = document.getElementById('stat-validation');
  if (res.validation_passed) {
    statVal.textContent = '100% Passed';
    statVal.className = 'text-xs font-bold text-emerald-400 mt-0.5';
  } else {
    statVal.textContent = 'Errors Detected';
    statVal.className = 'text-xs font-bold text-rose-400 mt-0.5';
  }

  const statHeal = document.getElementById('stat-healing');
  if (res.healing_applied) {
    statHeal.textContent = `Applied (${res.healing_rounds} Round${res.healing_rounds > 1 ? 's' : ''})`;
    statHeal.className = 'text-xs font-bold text-amber-400 mt-0.5';
  } else {
    statHeal.textContent = 'Not Needed';
    statHeal.className = 'text-xs font-bold text-slate-400 mt-0.5';
  }

  document.getElementById('stat-latency').textContent = `${res.processing_time_seconds}s`;

  // Healing alert banner
  const banner = document.getElementById('healing-banner');
  const bannerContent = document.getElementById('healing-banner-content');
  if (res.healing_applied || !res.validation_passed) {
    banner.classList.remove('hidden');
    let msg = `<strong>Self-Healing Engine:</strong> `;
    if (res.healing_applied && res.validation_passed) {
      msg += `Mathematical discrepancies were automatically resolved and verified across ${res.healing_rounds} reflection cycle.`;
    } else if (res.validation_errors && res.validation_errors.length > 0) {
      msg += `Remaining validation flags: <ul class="list-disc pl-4 mt-1">` +
        res.validation_errors.map(e => `<li>${e}</li>`).join('') + `</ul>`;
    }
    bannerContent.innerHTML = msg;
  } else {
    banner.classList.add('hidden');
  }

  // Populate Fields View
  const container = document.getElementById('fields-container');
  container.innerHTML = '';

  const data = res.extracted_data;
  const conf = res.confidence_scores;

  for (const [key, value] of Object.entries(data)) {
    const fieldConf = conf[key] || { confidence_score: 0.90, status: 'high', reasoning: 'Schema conforming' };
    container.appendChild(createFieldCard(key, value, fieldConf));
  }

  // Populate JSON View
  document.getElementById('json-code').textContent = JSON.stringify(data, null, 2);

  lucide.createIcons();
}

function createFieldCard(key, value, conf) {
  const card = document.createElement('div');
  card.className = 'bg-slate-900/90 rounded-xl p-3 border border-slate-800 flex flex-col space-y-2';

  // Badge color
  let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  if (conf.status === 'medium') badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  if (conf.status === 'low') badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30';

  const scorePct = Math.round(conf.confidence_score * 100);

  let valueHtml = '';
  if (Array.isArray(value)) {
    if (value.length > 0 && typeof value[0] === 'object') {
      // Table view for nested objects like line_items
      valueHtml = createNestedTable(value);
    } else {
      // Tags view for string arrays like skills
      valueHtml = `<div class="flex flex-wrap gap-1.5 mt-1">` +
        value.map(v => `<span class="px-2 py-0.5 rounded-md text-[11px] bg-slate-800 text-slate-300 border border-slate-700 font-mono">${v}</span>`).join('') +
        `</div>`;
    }
  } else {
    valueHtml = `<input type="text" value="${value ?? ''}" onchange="updateFieldValue('${key}', this.value)" class="w-full bg-slate-950 text-slate-200 text-xs font-mono p-2 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500">`;
  }

  card.innerHTML = `
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <span class="text-xs font-semibold text-slate-300 capitalize">${key.replace(/_/g, ' ')}</span>
      </div>
      <div class="flex items-center space-x-1.5" title="${conf.reasoning}">
        <span class="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold border ${badgeColor}">
          ${scorePct}% ${conf.status.toUpperCase()}
        </span>
      </div>
    </div>
    ${valueHtml}
    <div class="text-[10px] text-slate-500 flex items-center space-x-1">
      <i data-lucide="info" class="w-3 h-3 flex-shrink-0"></i>
      <span class="truncate">${conf.reasoning}</span>
    </div>
  `;

  return card;
}

function createNestedTable(items) {
  if (!items || items.length === 0) return '<div class="text-xs text-slate-500">None</div>';
  const headers = Object.keys(items[0]);
  let html = `<div class="overflow-x-auto rounded-lg border border-slate-800 mt-1"><table class="w-full text-left text-[11px]"><thead class="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800"><tr>`;
  headers.forEach(h => html += `<th class="py-1.5 px-2 capitalize">${h.replace(/_/g, ' ')}</th>`);
  html += `</tr></thead><tbody class="divide-y divide-slate-800/80 font-mono">`;
  items.forEach(it => {
    html += `<tr>`;
    headers.forEach(h => {
      html += `<td class="py-1 px-2 text-slate-300">${typeof it[h] === 'object' ? JSON.stringify(it[h]) : it[h]}</td>`;
    });
    html += `</tr>`;
  });
  html += `</tbody></table></div>`;
  return html;
}

function updateFieldValue(key, val) {
  if (currentExtractedData) {
    currentExtractedData[key] = isNaN(val) ? val : Number(val);
    document.getElementById('json-code').textContent = JSON.stringify(currentExtractedData, null, 2);
  }
}

// View Mode
function setViewMode(mode) {
  currentViewMode = mode;
  const cards = document.getElementById('fields-container');
  const jsonView = document.getElementById('json-container');
  const cardsBtn = document.getElementById('view-cards-btn');
  const jsonBtn = document.getElementById('view-json-btn');

  if (mode === 'cards') {
    cards.classList.remove('hidden');
    jsonView.classList.add('hidden');
    cardsBtn.className = "px-2.5 py-1 rounded-md bg-indigo-600 text-white font-medium";
    jsonBtn.className = "px-2.5 py-1 rounded-md text-slate-400 hover:text-white font-medium";
  } else {
    cards.classList.add('hidden');
    jsonView.classList.remove('hidden');
    jsonBtn.className = "px-2.5 py-1 rounded-md bg-indigo-600 text-white font-medium";
    cardsBtn.className = "px-2.5 py-1 rounded-md text-slate-400 hover:text-white font-medium";
  }
}

// Export Menu
function toggleExportMenu() {
  document.getElementById('export-dropdown').classList.toggle('hidden');
}

function exportJSON() {
  toggleExportMenu();
  if (!currentExtractedData) return alert('No data to export.');
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentExtractedData, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `structura_export_${Date.now()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function exportCSV() {
  toggleExportMenu();
  if (!currentExtractedData) return alert('No data to export.');
  let csvContent = "data:text/csv;charset=utf-8,";
  
  // Flatten primitive fields
  const rows = [];
  rows.push(["Field", "Value"]);
  for (const [k, v] of Object.entries(currentExtractedData)) {
    if (typeof v !== 'object') {
      rows.push([k, `"${String(v).replace(/"/g, '""')}"`]);
    }
  }
  rows.forEach(r => csvContent += r.join(",") + "\r\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `structura_export_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

async function exportSQL() {
  toggleExportMenu();
  if (!currentExtractedData) return alert('No data to export.');

  const form = new FormData();
  form.append('table_name', 'extracted_documents');
  form.append('data', JSON.stringify(currentExtractedData));

  // Generate client-side SQL fallback
  let columns = [];
  let values = [];
  for (const [k, v] of Object.entries(currentExtractedData)) {
    if (typeof v === 'number') {
      columns.append ? null : columns.push(`  ${k} NUMERIC`);
      values.push(v);
    } else if (typeof v === 'object') {
      columns.push(`  ${k} JSONB`);
      values.push(`'${JSON.stringify(v).replace(/'/g, "''")}'`);
    } else {
      columns.push(`  ${k} TEXT`);
      values.push(`'${String(v ?? '').replace(/'/g, "''")}'`);
    }
  }

  const sql = `-- Generated by StructuraAI\nCREATE TABLE IF NOT EXISTS extracted_documents (\n  id SERIAL PRIMARY KEY,\n${columns.join(',\n')}\n);\n\nINSERT INTO extracted_documents (${Object.keys(currentExtractedData).join(', ')})\nVALUES (${values.join(', ')});\n`;

  document.getElementById('sql-output').textContent = sql;
  toggleSqlModal();
}

function toggleSqlModal() {
  document.getElementById('sql-modal').classList.toggle('hidden');
}

function copySqlToClipboard() {
  const sql = document.getElementById('sql-output').textContent;
  navigator.clipboard.writeText(sql);
  alert('SQL copied to clipboard!');
}

// API Key Modal
function toggleKeyModal() {
  document.getElementById('key-modal').classList.toggle('hidden');
}

function saveApiKey() {
  const key = document.getElementById('api-key-input').value.trim();
  if (key) {
    localStorage.setItem('structura_gemini_key', key);
    document.getElementById('key-status-text').textContent = 'Key Active ✓';
  } else {
    localStorage.removeItem('structura_gemini_key');
    document.getElementById('key-status-text').textContent = 'Gemini Key';
  }
  toggleKeyModal();
}

// Benchmark Suite Runner
async function runLiveBenchmark() {
  const btn = document.getElementById('run-bench-btn');
  btn.disabled = true;
  btn.innerHTML = `<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>Running...</span>`;

  const tbody = document.getElementById('benchmark-table-body');
  tbody.innerHTML = `<tr><td colspan="8" class="py-6 text-center text-slate-400">Executing benchmark suite across 4 domain documents...</td></tr>`;

  try {
    const apiKey = localStorage.getItem('structura_gemini_key') || '';
    const response = await fetch(`/api/benchmark?api_key=${encodeURIComponent(apiKey)}`);
    const data = await response.json();

    // Update KPI summary cards
    document.getElementById('bench-avg-f1').textContent = data.summary.average_field_f1_score;
    document.getElementById('bench-avg-em').textContent = data.summary.average_exact_match_rate;
    document.getElementById('bench-avg-latency').textContent = `${data.summary.average_latency_seconds}s`;

    // Populate rows
    tbody.innerHTML = '';
    data.detailed_results.forEach(r => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-900/60 transition';
      tr.innerHTML = `
        <td class="py-3 px-4 text-slate-400">${r.test_id}</td>
        <td class="py-3 px-4 font-semibold text-slate-200">${r.document_type}</td>
        <td class="py-3 px-4 text-slate-400">${r.expected_fields}</td>
        <td class="py-3 px-4 text-emerald-400">${r.matched_fields}</td>
        <td class="py-3 px-4 text-indigo-400 font-bold">${r.exact_match_rate}%</td>
        <td class="py-3 px-4 text-emerald-400 font-bold">${r.field_f1_score}%</td>
        <td class="py-3 px-4 text-amber-400">${r.latency_seconds}s</td>
        <td class="py-3 px-4"><span class="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-sans font-semibold">${r.status}</span></td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    alert(`Benchmark failed: ${err.message}`);
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i data-lucide="play" class="w-4 h-4"></i><span>Run Benchmark Suite</span>`;
    lucide.createIcons();
  }
}
