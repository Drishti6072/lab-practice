# LLM Pipeline Explorer

An interactive, modern educational web application designed to help students master two fundamental concepts in Large Language Models (LLMs) and Natural Language Processing (NLP):

1. **Tokenization & Subword Decomposition**: How text transforms into vocabulary IDs, and how unseen words are handled using character-level continuation tokens (`c`, `##a`, `##t`).
2. **Word & Sentence Embeddings in 3D**: How text becomes dense vectors, exploring the critical difference between surface **Spelling similarity** (character n-grams) and deep **Semantic meaning** (concept vectors) projected into an interactive 3D room using Principal Component Analysis (PCA).

---

## 🎨 Design & Aesthetic

- **Color Palette**: Royal Blue (`#2455D6`), Dark Blue (`#173B91`), Pure White (`#FFFFFF`), and soft blue tints (`#EEF3FE`, `#F4F7FE`).
- **Minimal, Professional UI**: Clean typography, rounded cards, subtle shadows, and responsive layout.
- **Interactive Visualizations**: Real-time vocabulary table generation, token chip inspector, and a 3D coordinate room with Three.js (including an automatic Canvas 2D fallback for offline environments).

---

## 🚀 How to Run the Website

You can open the website in any modern web browser directly:

### Option 1: Direct File Open
Double click `index.html` or open it directly in your browser:
```bash
open index.html
```

### Option 2: Local HTTP Server
Run any simple static file server:
```bash
python3 -m http.server 8000
```
Then visit: [http://localhost:8000](http://localhost:8000)

---

## 📚 Key Features & Modules

### Part 01 — Tokenizer
- **Step 1: Training Corpus & Vocabulary Builder**:
  - Enter custom multi-line sentences.
  - Dynamically extracts unique tokens and builds a 0-indexed vocabulary table.
  - Guarantees no duplicate IDs.
  - Recalculates dynamically whenever the corpus is modified.
- **Step 2: Interactive Vocabulary Table**:
  - Displays every unique token with its numerical ID.
  - Live search filter to find any token or ID.
  - Tracks total sentence count and vocabulary size.
- **Step 3: Sentence Encoding & Subword Decomposition**:
  - Encode any sentence, including words outside the training corpus.
  - **Unknown Word Handling**:
    - Unseen words are decomposed into character tokens.
    - WordPiece continuation prefix format: `[c, ##a, ##t]`.
    - Automatically assigns unique, collision-free token IDs.
    - Consistently reuses subword IDs across occurrences.
  - Displays:
    1. Exact original sentence.
    2. Interactive visual token chips with type badges (`Known Token` vs `Continuation (##)`).
    3. Token ID mapping table with bidirectional click highlighting.
    4. Final numerical sequence array (e.g. `[0, 1, 8, 9, 10]`) with one-click copy.

---

### Part 02 — Embedding in 3D
- **Step 1: Multi-Sentence Input**:
  - Enter custom sentences to plot in 3D space.
  - Built-in presets: "AI vs Weather Dataset" and "Dogs vs Puppies vs Stocks (Semantic Test)".
- **Step 2: Two Distinct Embedding Models**:
  - **Option A — Spelling Embedding**:
    - Uses character n-grams (2-grams, 3-grams, 4-grams) and surface tokens with TF-IDF weighting.
    - Sentences sharing character patterns ("machine learning" and "deep learning") cluster together.
    - Words with different letters ("dogs" and "puppies") land far apart.
  - **Option B — Meaning Embedding (Semantic)**:
    - Maps words into a dense concept vector space across diverse semantic domains (AI, Animals, Sentiment, Weather, Finance, etc.).
    - Sentences with similar meanings cluster together even with completely different words ("I love dogs." and "I adore puppies.").
    - Unrelated topics ("The stock market is falling.") are pushed to opposite sides of the room.
- **Step 3: Interactive 3D Room**:
  - Minimalist 3D room with pure white background and thin royal blue coordinate axes ($X, Y, Z$).
  - Full mouse orbit controls: Drag to rotate, scroll to zoom, right-click to pan.
  - Camera reset button and auto-rotate presentation mode.
  - Hover tooltips and click-to-select point highlighting.
  - **Pairwise Comparison Mode**:
    - Click any two points in 3D to draw a dashed spatial connection line.
    - Displays 3D Euclidean distance, cosine similarity percentage, and a pedagogical explanation of why the two sentences are close or far under the selected mode!
  - Interactive sentence table with a **"Focus in 3D"** camera zoom button.

---

## 🛠️ Code Structure

```
lab-b2/
├── index.html            # Semantic HTML5 layout and navigation
├── css/
│   └── style.css         # Modern Royal Blue & White theme styles
├── js/
│   ├── tokenizer.js      # Tokenizer engine, vocab builder, subword decomposition
│   ├── embeddings.js     # Spelling & semantic vector models, PCA 3D reduction
│   ├── visualizer3d.js   # Three.js 3D room, orbit controls, Canvas 2D fallback
│   └── app.js            # UI controller, event handlers, interactive state
└── README.md             # Project documentation
```
