/**
 * LLM Pipeline Explorer - Main Application Controller
 * Handles user interactions, data binding, UI state, and connects
 * TokenizerEngine, EmbeddingsEngine, and Visualizer3D.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Engines
  const tokenizer = new window.TokenizerEngine();
  const embeddings = new window.EmbeddingsEngine();
  let visualizer = null;

  // State
  let currentEmbeddingType = 'spelling'; // 'spelling' | 'meaning'
  let currentEmbeddingResult = null;

  // DOM Elements - Navigation
  const navTabs = document.querySelectorAll('.nav-tab');
  const sectionPart1 = document.getElementById('part-tokenizer');
  const sectionPart2 = document.getElementById('part-embeddings');

  // DOM Elements - Part 01 Tokenizer
  const trainInput = document.getElementById('train-sentences-input');
  const btnBuildVocab = document.getElementById('btn-build-vocab');
  const btnLoadVocabPreset = document.getElementById('btn-load-vocab-preset');
  const btnClearVocabInput = document.getElementById('btn-clear-vocab-input');
  
  const vocabStatsContainer = document.getElementById('vocab-stats-container');
  const statSentencesCount = document.getElementById('stat-sentences-count');
  const statVocabCount = document.getElementById('stat-vocab-count');
  const vocabTableBody = document.getElementById('vocab-table-body');
  const vocabSearchInput = document.getElementById('vocab-search-input');
  const vocabEmptyState = document.getElementById('vocab-empty-state');
  const vocabTableWrapper = document.getElementById('vocab-table-wrapper');

  const encodeInput = document.getElementById('encode-sentence-input');
  const btnEncode = document.getElementById('btn-encode-sentence');
  const encodePresetChips = document.querySelectorAll('.encode-preset-chip');
  const encodeResultsWrapper = document.getElementById('encode-results-wrapper');
  const encodeEmptyState = document.getElementById('encode-empty-state');

  const displayOriginalSentence = document.getElementById('display-original-sentence');
  const tokenBoxesContainer = document.getElementById('token-boxes-container');
  const tokenMappingTableBody = document.getElementById('token-mapping-table-body');
  const encodedSequenceDisplay = document.getElementById('encoded-sequence-display');
  const btnCopySequence = document.getElementById('btn-copy-sequence');
  const subwordAlertBox = document.getElementById('subword-alert-box');
  const subwordAlertText = document.getElementById('subword-alert-text');

  // DOM Elements - Part 02 Embeddings
  const embedInput = document.getElementById('embed-sentences-input');
  const btnGenerateEmbeddings = document.getElementById('btn-generate-embeddings');
  const btnPresetAiWeather = document.getElementById('preset-ai-weather');
  const btnPresetSemanticTest = document.getElementById('preset-semantic-test');
  const btnClearEmbedInput = document.getElementById('btn-clear-embed-input');

  const cardSpelling = document.getElementById('card-embed-spelling');
  const cardMeaning = document.getElementById('card-embed-meaning');

  const visualizerContainer = document.getElementById('visualizer-3d-container');
  const btnResetCamera = document.getElementById('btn-reset-camera');
  const btnToggleAutoRotate = document.getElementById('btn-toggle-auto-rotate');

  const badgeCurrentEmbedding = document.getElementById('badge-current-embedding');
  const statPlottedCount = document.getElementById('stat-plotted-count');
  const selectedPointDetails = document.getElementById('selected-point-details');
  const pairwiseComparisonCard = document.getElementById('pairwise-comparison-card');
  const embedSentencesTableBody = document.getElementById('embed-sentences-table-body');

  // Inline Alert Helpers
  const showNotification = (message, type = 'error') => {
    // Look for existing toast or create one
    let toast = document.getElementById('app-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-toast';
      toast.className = 'app-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = `app-toast show ${type}`;
    clearTimeout(toast.timeoutId);
    toast.timeoutId = setTimeout(() => {
      toast.className = 'app-toast';
    }, 3800);
  };

  // ==========================================
  // 1. NAVIGATION
  // ==========================================
  navTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const target = tab.getAttribute('data-target');

      navTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      if (target === 'part-tokenizer') {
        sectionPart1.classList.add('active');
        sectionPart2.classList.remove('active');
        sectionPart1.scrollIntoView({ behavior: 'smooth' });
      } else {
        sectionPart2.classList.add('active');
        sectionPart1.classList.remove('active');
        sectionPart2.scrollIntoView({ behavior: 'smooth' });
        // Trigger resize so 3D canvas updates its dimensions
        if (visualizer) {
          setTimeout(() => visualizer.onResize(), 100);
        }
      }
    });
  });

  // ==========================================
  // 2. PART 01: TOKENIZER LOGIC
  // ==========================================

  // Preset training sentences
  const defaultTrainingText = 
`I love machine learning.
Machine learning is interesting.
I love programming.`;

  btnLoadVocabPreset.addEventListener('click', () => {
    trainInput.value = defaultTrainingText;
    buildVocabulary();
  });

  btnClearVocabInput.addEventListener('click', () => {
    trainInput.value = '';
    trainInput.focus();
  });

  btnBuildVocab.addEventListener('click', () => {
    buildVocabulary();
  });

  function buildVocabulary() {
    const rawText = trainInput.value.trim();
    if (!rawText) {
      showNotification("Please enter some training sentences first.", "error");
      trainInput.focus();
      return;
    }

    try {
      const result = tokenizer.buildVocabulary(rawText);
      
      // Update UI Stats
      statSentencesCount.textContent = result.sentencesCount;
      statVocabCount.textContent = result.vocabSize;
      vocabStatsContainer.style.display = 'flex';
      vocabEmptyState.style.display = 'none';
      vocabTableWrapper.style.display = 'block';

      // Render Vocabulary Table
      renderVocabTable(result.vocabularyList);

      showNotification(`Vocabulary built successfully with ${result.vocabSize} unique tokens!`, "success");

      // If there is already an encoded sentence, re-encode it with the new vocabulary
      if (encodeInput.value.trim().length > 0) {
        encodeSentence();
      }
    } catch (err) {
      showNotification(err.message, "error");
    }
  }

  function renderVocabTable(vocabList, filter = '') {
    vocabTableBody.innerHTML = '';
    const query = filter.toLowerCase().trim();

    const filtered = query 
      ? vocabList.filter(item => item.token.toLowerCase().includes(query) || item.id.toString() === query)
      : vocabList;

    if (filtered.length === 0) {
      vocabTableBody.innerHTML = `<tr><td colspan="2" class="table-empty-notice">No tokens match "${filter}"</td></tr>`;
      return;
    }

    filtered.forEach(item => {
      const tr = document.createElement('tr');
      tr.className = 'vocab-row';
      tr.dataset.tokenId = item.id;
      tr.dataset.token = item.token;

      tr.innerHTML = `
        <td class="token-cell">
          <span class="token-pill">${escapeHTML(item.token)}</span>
        </td>
        <td class="id-cell">
          <span class="id-badge">${item.id}</span>
        </td>
      `;

      tr.addEventListener('click', () => {
        // Quick copy or focus
        encodeInput.value = (encodeInput.value + ' ' + item.token).trim();
        showNotification(`Added "${item.token}" to encode input!`, "success");
      });

      vocabTableBody.appendChild(tr);
    });
  }

  // Vocab search filter
  vocabSearchInput.addEventListener('input', (e) => {
    const filter = e.target.value;
    const list = tokenizer.getVocabularyList();
    renderVocabTable(list, filter);
  });

  // Step 3: Sentence Encoding
  encodePresetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      encodeInput.value = chip.getAttribute('data-sentence');
      encodeSentence();
    });
  });

  btnEncode.addEventListener('click', () => {
    encodeSentence();
  });

  encodeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      encodeSentence();
    }
  });

  function encodeSentence() {
    if (!tokenizer.isVocabReady()) {
      showNotification("Please build the vocabulary first by clicking 'Build Vocabulary' in Step 1.", "error");
      trainInput.focus();
      return;
    }

    const textToEncode = encodeInput.value.trim();
    if (!textToEncode) {
      showNotification("Please enter a sentence to tokenize and encode.", "error");
      encodeInput.focus();
      return;
    }

    try {
      const result = tokenizer.encodeSentence(textToEncode);

      // Show Results Wrapper
      encodeEmptyState.style.display = 'none';
      encodeResultsWrapper.style.display = 'block';

      // 1. Original Sentence
      displayOriginalSentence.textContent = result.originalSentence;

      // 2. Tokenized Output visual chips: [ I ] [ love ] [ c ] [ ##a ] [ ##t ]
      tokenBoxesContainer.innerHTML = '';
      result.tokens.forEach((item, idx) => {
        const box = document.createElement('div');
        box.className = `token-chip ${item.isSubword ? 'subword' : 'known'}`;
        box.dataset.index = idx;
        box.dataset.tokenId = item.id;
        box.innerHTML = `
          <span class="chip-label">${escapeHTML(item.token)}</span>
          <span class="chip-id">ID: ${item.id}</span>
        `;

        box.addEventListener('click', () => {
          highlightCorrespondingRow(idx);
        });

        tokenBoxesContainer.appendChild(box);
      });

      // 3. Token ID Mapping Table
      tokenMappingTableBody.innerHTML = '';
      result.tokens.forEach((item, idx) => {
        const tr = document.createElement('tr');
        tr.className = 'mapping-row';
        tr.dataset.index = idx;
        tr.dataset.tokenId = item.id;

        const badgeClass = item.isSubword ? 'subword-tag' : 'known-tag';
        const typeText = item.isSubword 
          ? (item.token.startsWith('##') ? 'Subword Continuation (##)' : 'Subword Root')
          : 'Known Vocabulary Token';

        tr.innerHTML = `
          <td class="token-col">
            <span class="token-pill ${item.isSubword ? 'subword' : ''}">${escapeHTML(item.token)}</span>
          </td>
          <td class="id-col">
            <span class="id-badge">${item.id}</span>
          </td>
          <td class="type-col">
            <span class="status-tag ${badgeClass}">${typeText}</span>
          </td>
        `;

        tr.addEventListener('mouseenter', () => {
          highlightTokenChip(idx);
        });
        tr.addEventListener('mouseleave', () => {
          unhighlightTokenChips();
        });

        tokenMappingTableBody.appendChild(tr);
      });

      // 4. Final Encoded Sequence: [0, 1, 2, 3, 4]
      const sequenceString = `[${result.encodedSequence.join(', ')}]`;
      encodedSequenceDisplay.textContent = sequenceString;

      // 5. Unknown Word Callout
      if (result.hasUnknownTokens) {
        subwordAlertBox.style.display = 'flex';
        const unknownList = result.unknownWords.map(w => `"${w}"`).join(', ');
        subwordAlertText.innerHTML = `
          <strong>Subword Decomposition Activated:</strong> The word(s) ${unknownList} were not in the training vocabulary. 
          As per LLM subword tokenization rules (e.g. WordPiece), unknown words are decomposed into character tokens 
          with continuation prefixes (<code>##</code>) and assigned consistent, non-conflicting IDs.
        `;
      } else {
        subwordAlertBox.style.display = 'none';
      }

      // Smooth scroll to results
      encodeResultsWrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    } catch (err) {
      showNotification(err.message, "error");
    }
  }

  function highlightCorrespondingRow(tokenIndex) {
    const rows = tokenMappingTableBody.querySelectorAll('.mapping-row');
    rows.forEach(r => {
      if (parseInt(r.dataset.index, 10) === tokenIndex) {
        r.classList.add('highlighted');
        r.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        r.classList.remove('highlighted');
      }
    });

    const chips = tokenBoxesContainer.querySelectorAll('.token-chip');
    chips.forEach(c => {
      c.classList.toggle('active', parseInt(c.dataset.index, 10) === tokenIndex);
    });
  }

  function highlightTokenChip(tokenIndex) {
    const chips = tokenBoxesContainer.querySelectorAll('.token-chip');
    chips.forEach(c => {
      if (parseInt(c.dataset.index, 10) === tokenIndex) {
        c.classList.add('active');
      } else {
        c.classList.remove('active');
      }
    });
  }

  function unhighlightTokenChips() {
    const chips = tokenBoxesContainer.querySelectorAll('.token-chip');
    chips.forEach(c => c.classList.remove('active'));
  }

  // Copy sequence to clipboard
  btnCopySequence.addEventListener('click', () => {
    const seq = encodedSequenceDisplay.textContent;
    if (!seq) return;
    navigator.clipboard.writeText(seq).then(() => {
      btnCopySequence.textContent = "Copied!";
      setTimeout(() => {
        btnCopySequence.textContent = "Copy Sequence";
      }, 1800);
    }).catch(() => {
      showNotification("Could not copy to clipboard", "error");
    });
  });

  // ==========================================
  // 3. PART 02: EMBEDDING IN 3D LOGIC
  // ==========================================

  // Preset sentence sets
  const presetAiWeather = 
`I love machine learning.
I enjoy studying AI.
The weather is beautiful today.
I like programming.
Deep learning is fascinating.`;

  const presetSemanticTestCase = 
`I love dogs.
I adore puppies.
The stock market is falling.
I like programming.
The weather is beautiful today.`;

  btnPresetAiWeather.addEventListener('click', () => {
    embedInput.value = presetAiWeather;
    generateEmbeddings();
  });

  btnPresetSemanticTest.addEventListener('click', () => {
    embedInput.value = presetSemanticTestCase;
    generateEmbeddings();
  });

  btnClearEmbedInput.addEventListener('click', () => {
    embedInput.value = '';
    embedInput.focus();
  });

  // Embedding Type Selector Cards
  cardSpelling.addEventListener('click', () => {
    setEmbeddingType('spelling');
  });

  cardMeaning.addEventListener('click', () => {
    setEmbeddingType('meaning');
  });

  function setEmbeddingType(type) {
    currentEmbeddingType = type;
    if (type === 'spelling') {
      cardSpelling.classList.add('selected');
      cardMeaning.classList.remove('selected');
      badgeCurrentEmbedding.textContent = "Option A: Spelling Embedding";
    } else {
      cardMeaning.classList.add('selected');
      cardSpelling.classList.remove('selected');
      badgeCurrentEmbedding.textContent = "Option B: Meaning Embedding (Semantic)";
    }

    // If points already exist, regenerate with new mode
    if (embedInput.value.trim().length > 0 && currentEmbeddingResult) {
      generateEmbeddings();
    }
  }

  // Initialize Visualizer 3D
  visualizer = new window.Visualizer3D(visualizerContainer, {
    onPointClick: (selectedPoints, latestPoint) => {
      handlePointSelection(selectedPoints, latestPoint);
    },
    onPointHover: (hoveredPoint) => {
      handlePointHover(hoveredPoint);
    }
  });

  btnResetCamera.addEventListener('click', () => {
    if (visualizer) visualizer.resetCamera();
  });

  btnToggleAutoRotate.addEventListener('click', () => {
    if (visualizer) {
      const isRotating = visualizer.toggleAutoRotate();
      btnToggleAutoRotate.classList.toggle('active', isRotating);
      btnToggleAutoRotate.textContent = isRotating ? "Pause Rotation" : "Auto-Rotate";
    }
  });

  btnGenerateEmbeddings.addEventListener('click', () => {
    generateEmbeddings();
  });

  function generateEmbeddings() {
    const rawText = embedInput.value.trim();
    if (!rawText) {
      showNotification("Please enter at least one sentence (one per line).", "error");
      embedInput.focus();
      return;
    }

    try {
      const result = embeddings.processSentences(rawText, currentEmbeddingType);
      currentEmbeddingResult = result;

      // Update 3D scene
      visualizer.setPoints(result.points);

      // Update UI Stats
      statPlottedCount.textContent = result.sentencesCount;
      badgeCurrentEmbedding.textContent = result.embeddingType === 'spelling' 
        ? "Option A: Spelling Embedding" 
        : "Option B: Meaning Embedding (Semantic)";

      // Reset selection details
      selectedPointDetails.innerHTML = `
        <div class="empty-selection-hint">
          <p>Click on any point in the 3D room to inspect its coordinates and sentence.</p>
          <p class="sub-hint">Tip: Click two points to compare their 3D distance and similarity!</p>
        </div>
      `;
      pairwiseComparisonCard.style.display = 'none';

      // Render sentence directory table
      renderEmbedSentencesTable(result.points);

      showNotification(`Generated 3D embeddings for ${result.sentencesCount} sentences using ${result.embeddingType.toUpperCase()} mode!`, "success");

    } catch (err) {
      showNotification(err.message, "error");
    }
  }

  function renderEmbedSentencesTable(points) {
    embedSentencesTableBody.innerHTML = '';

    points.forEach(pt => {
      const tr = document.createElement('tr');
      tr.className = 'embed-sentence-row';
      tr.dataset.pointId = pt.id;

      tr.innerHTML = `
        <td class="pt-id-col">
          <span class="pt-circle">${pt.id}</span>
        </td>
        <td class="sentence-text-col">
          <span class="sentence-string">"${escapeHTML(pt.sentence)}"</span>
        </td>
        <td class="coord-col">
          <span class="coord-badge">X: ${pt.x}</span>
          <span class="coord-badge">Y: ${pt.y}</span>
          <span class="coord-badge">Z: ${pt.z}</span>
        </td>
        <td class="action-col">
          <button class="btn-focus-pt" title="Focus view on this point">Focus in 3D</button>
        </td>
      `;

      tr.querySelector('.btn-focus-pt').addEventListener('click', (e) => {
        e.stopPropagation();
        visualizer.focusOnPoint(pt.id);
        visualizer.selectPointById(pt.id);
      });

      tr.addEventListener('click', () => {
        visualizer.selectPointById(pt.id);
      });

      embedSentencesTableBody.appendChild(tr);
    });
  }

  function handlePointSelection(selectedPoints, latestPoint) {
    // Highlight matching table rows
    const rows = embedSentencesTableBody.querySelectorAll('.embed-sentence-row');
    const selectedIds = new Set(selectedPoints.map(p => p.id));

    rows.forEach(r => {
      const id = parseInt(r.dataset.pointId, 10);
      r.classList.toggle('selected', selectedIds.has(id));
    });

    if (selectedPoints.length === 0) {
      selectedPointDetails.innerHTML = `
        <div class="empty-selection-hint">
          <p>Click on any point in the 3D room to inspect its coordinates and sentence.</p>
          <p class="sub-hint">Tip: Click two points to compare their 3D distance and similarity!</p>
        </div>
      `;
      pairwiseComparisonCard.style.display = 'none';
      return;
    }

    if (selectedPoints.length === 1) {
      // Single Point Inspected
      const p = selectedPoints[0];
      selectedPointDetails.innerHTML = `
        <div class="single-point-card">
          <div class="point-badge-header">
            <span class="pt-tag">Point ${p.id}</span>
            <span class="coord-tag">(${p.x}, ${p.y}, ${p.z})</span>
          </div>
          <p class="selected-sentence-text">"${escapeHTML(p.sentence)}"</p>
          <div class="selection-help-text">Click a second point in 3D to compare their similarity and distance!</div>
        </div>
      `;
      pairwiseComparisonCard.style.display = 'none';
      return;
    }

    if (selectedPoints.length === 2) {
      // Pairwise Comparison Mode!
      const p1 = selectedPoints[0];
      const p2 = selectedPoints[1];

      // Compute pairwise metrics
      const cosSim = embeddings.computeCosineSimilarity(p1.highDimVector, p2.highDimVector);
      const dist3D = embeddings.computeEuclideanDistance(p1, p2);
      const comparison = embeddings.explainPairwiseSimilarity(p1.sentence, p2.sentence, currentEmbeddingType, cosSim, dist3D);

      selectedPointDetails.innerHTML = `
        <div class="points-pair-preview">
          <div class="pair-bubble"><strong>Point ${p1.id}:</strong> "${escapeHTML(p1.sentence)}"</div>
          <div class="pair-bubble"><strong>Point ${p2.id}:</strong> "${escapeHTML(p2.sentence)}"</div>
        </div>
      `;

      pairwiseComparisonCard.style.display = 'block';
      pairwiseComparisonCard.innerHTML = `
        <div class="comparison-header">
          <h4>Pairwise Sentence Comparison (${currentEmbeddingType.toUpperCase()} MODE)</h4>
          <span class="mode-indicator">${currentEmbeddingType === 'spelling' ? 'Character Overlap' : 'Semantic Similarity'}</span>
        </div>
        
        <div class="comparison-metrics-grid">
          <div class="metric-card">
            <span class="metric-label">3D Vector Distance</span>
            <span class="metric-value">${comparison.euclideanDistance} units</span>
            <span class="metric-desc">Spatial distance in the 3D room</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">Vector Similarity</span>
            <span class="metric-value">${comparison.similarityPercent}%</span>
            <div class="similarity-bar-track">
              <div class="similarity-bar-fill" style="width: ${comparison.similarityPercent}%"></div>
            </div>
          </div>
        </div>

        <div class="comparison-explanation-box">
          <div class="explanation-icon">💡</div>
          <div class="explanation-content">
            <strong>Why this occurs in ${currentEmbeddingType} mode:</strong>
            <p>${comparison.explanation}</p>
          </div>
        </div>
      `;

      pairwiseComparisonCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function handlePointHover(hoveredPoint) {
    const rows = embedSentencesTableBody.querySelectorAll('.embed-sentence-row');
    rows.forEach(r => {
      const id = parseInt(r.dataset.pointId, 10);
      r.classList.toggle('hovered', hoveredPoint && hoveredPoint.id === id);
    });
  }

  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ==========================================
  // INITIAL RUN
  // ==========================================
  // Populate defaults and run initial build so students arrive at a ready-to-explore page!
  trainInput.value = defaultTrainingText;
  buildVocabulary();

  encodeInput.value = "I love cat";
  encodeSentence();

  embedInput.value = presetAiWeather;
  generateEmbeddings();
});
