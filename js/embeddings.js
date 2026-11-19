/**
 * LLM Pipeline Explorer - Embedding & Dimensionality Reduction Engine
 * 
 * Features:
 * 1. Option A: Spelling Embedding (Character n-gram & word surface TF-IDF vectors)
 * 2. Option B: Meaning Embedding (Dense semantic concept projection & synonym clusters)
 * 3. Principal Component Analysis (PCA) to project high-dimensional vectors to 3D room coordinates
 * 4. Pairwise similarity & euclidean distance metrics with educational explanations
 */

class EmbeddingsEngine {
  constructor() {
    this.initSemanticLexicon();
  }

  /**
   * Initializes the semantic concept space for Option B (Meaning Embedding).
   * Maps key concepts to dense semantic vectors.
   */
  initSemanticLexicon() {
    // Define 24 core semantic dimensions
    this.conceptDimensions = [
      'ai_machine_learning', // 0
      'coding_software',     // 1
      'data_science',        // 2
      'study_education',     // 3
      'animals_canines',     // 4 (dogs, puppies, hounds)
      'animals_felines',     // 5 (cats, kittens)
      'animals_general',     // 6 (pets, animals, creatures)
      'affection_sentiment', // 7 (love, adore, enjoy, like)
      'interest_fascination',// 8 (interesting, fascinating, exciting)
      'weather_sky',         // 9 (weather, rain, sunny, cloudy, storm)
      'beauty_aesthetic',    // 10 (beautiful, lovely, gorgeous)
      'finance_markets',     // 11 (stocks, market, shares, investment)
      'finance_trend_down',  // 12 (falling, crash, drop, slump)
      'finance_trend_up',    // 13 (rising, bull, gain, boom)
      'food_dining',         // 14 (pizza, food, eat, delicious)
      'sports_fitness',      // 15 (game, soccer, gym, run)
      'space_astronomy',     // 16 (space, planets, universe, stars)
      'travel_places',       // 17 (travel, flight, trip, hotel)
      'music_art',           // 18 (music, song, art, guitar)
      'health_medicine',     // 19 (health, doctor, wellness)
      'time_day',            // 20 (today, morning, day, time)
      'nature_outdoors',     // 21 (nature, tree, forest, outside)
      'sentiment_negative',  // 22 (hate, terrible, bad)
      'general_object'       // 23 (thing, system, item)
    ];

    const D = this.conceptDimensions.length;

    // Helper to create zero vector
    const zeroVec = () => new Array(D).fill(0);

    // Dictionary of word stems/words to concept dimension weights
    this.wordVectors = new Map();

    const addWord = (words, weights) => {
      const vec = zeroVec();
      for (const [dimIndex, weight] of Object.entries(weights)) {
        vec[parseInt(dimIndex, 10)] = weight;
      }
      // Normalize
      const norm = Math.hypot(...vec) || 1;
      const normalized = vec.map(v => v / norm);

      for (const w of words) {
        this.wordVectors.set(w.toLowerCase(), normalized);
      }
    };

    // 1. AI & Machine Learning
    addWord(['machine', 'machines'], { 0: 0.8, 23: 0.3 });
    addWord(['learning', 'learn', 'learns', 'learned'], { 0: 0.6, 3: 0.8 });
    addWord(['ai', 'artificial', 'intelligence'], { 0: 1.0, 1: 0.5 });
    addWord(['deep', 'neural', 'network', 'networks'], { 0: 0.95, 2: 0.5 });
    addWord(['algorithm', 'algorithms', 'model', 'models'], { 0: 0.85, 1: 0.6, 2: 0.5 });
    addWord(['data', 'dataset'], { 0: 0.5, 2: 0.9 });

    // 2. Programming & Software
    addWord(['programming', 'program', 'programs', 'coder', 'coding', 'code', 'codes'], { 1: 1.0, 0: 0.4 });
    addWord(['software', 'developer', 'computer', 'python', 'javascript'], { 1: 0.9, 0: 0.4 });

    // 3. Studying & Education
    addWord(['study', 'studying', 'studied', 'student', 'students'], { 3: 1.0, 0: 0.3 });
    addWord(['education', 'academic', 'research', 'knowledge'], { 3: 0.9, 0: 0.4 });

    // 4. Affection & Enjoyment (love, adore, enjoy, like)
    addWord(['love', 'loves', 'loved', 'loving'], { 7: 1.0 });
    addWord(['adore', 'adores', 'adored', 'adoring'], { 7: 1.0 });
    addWord(['enjoy', 'enjoys', 'enjoyed', 'enjoying'], { 7: 0.9, 8: 0.4 });
    addWord(['like', 'likes', 'liked'], { 7: 0.85 });
    addWord(['cherish', 'fond', 'prefer'], { 7: 0.9 });

    // 5. Interest & Fascination
    addWord(['fascinating', 'fascinate', 'fascinated'], { 8: 1.0, 7: 0.5 });
    addWord(['interesting', 'interest', 'interested'], { 8: 0.95, 7: 0.4 });
    addWord(['exciting', 'curious', 'intriguing', 'amazing'], { 8: 0.9, 7: 0.4 });

    // 6. Animals: Canines (Dogs & Puppies)
    addWord(['dog', 'dogs'], { 4: 1.0, 6: 0.8 });
    addWord(['puppy', 'puppies'], { 4: 1.0, 6: 0.85, 7: 0.3 });
    addWord(['hound', 'canine', 'canines', 'pup'], { 4: 0.95, 6: 0.8 });

    // 7. Animals: Felines (Cats & Kittens)
    addWord(['cat', 'cats'], { 5: 1.0, 6: 0.8 });
    addWord(['kitten', 'kittens'], { 5: 1.0, 6: 0.85, 7: 0.3 });
    addWord(['feline', 'felines'], { 5: 0.95, 6: 0.8 });

    // 8. Animals General
    addWord(['pet', 'pets'], { 6: 1.0, 4: 0.5, 5: 0.5, 7: 0.3 });
    addWord(['animal', 'animals', 'creature'], { 6: 1.0, 21: 0.4 });

    // 9. Weather & Sky
    addWord(['weather', 'climate'], { 9: 1.0, 21: 0.5 });
    addWord(['rain', 'raining', 'rainy'], { 9: 0.95, 21: 0.5 });
    addWord(['sun', 'sunny', 'sunshine'], { 9: 0.9, 10: 0.5, 21: 0.5 });
    addWord(['cloud', 'clouds', 'cloudy'], { 9: 0.9 });
    addWord(['storm', 'stormy', 'wind', 'windy'], { 9: 0.95 });
    addWord(['sky', 'skies'], { 9: 0.8, 16: 0.4 });

    // 10. Beauty & Aesthetic
    addWord(['beautiful', 'beauty', 'gorgeous', 'pretty', 'lovely'], { 10: 1.0, 7: 0.4 });
    addWord(['today'], { 20: 0.9 });

    // 11. Finance & Markets
    addWord(['stock', 'stocks'], { 11: 1.0 });
    addWord(['market', 'markets'], { 11: 0.95 });
    addWord(['shares', 'trading', 'trade', 'trader'], { 11: 0.9 });
    addWord(['finance', 'financial', 'economy', 'economic'], { 11: 0.85 });
    addWord(['investment', 'invest', 'investing'], { 11: 0.85 });
    addWord(['money', 'bank', 'funds', 'dollar'], { 11: 0.8 });

    // 12. Market Trends
    addWord(['falling', 'fall', 'falls', 'fell'], { 12: 1.0, 22: 0.4 });
    addWord(['crash', 'crashed', 'crashing', 'plunge', 'slump', 'drop'], { 12: 1.0, 22: 0.6 });
    addWord(['rising', 'rise', 'rally', 'surge', 'gain'], { 13: 1.0 });

    // 13. Food & Dining
    addWord(['food', 'eat', 'eating', 'ate'], { 14: 1.0 });
    addWord(['pizza', 'burger', 'meal', 'dinner', 'lunch', 'breakfast'], { 14: 0.95 });
    addWord(['delicious', 'tasty', 'cook', 'cooking'], { 14: 0.9, 7: 0.3 });

    // 14. Sports & Fitness
    addWord(['sport', 'sports', 'game', 'play', 'playing'], { 15: 1.0 });
    addWord(['football', 'soccer', 'basketball', 'tennis'], { 15: 0.95 });
    addWord(['gym', 'workout', 'exercise', 'run', 'running'], { 15: 0.9, 19: 0.5 });

    // 15. Space
    addWord(['space', 'universe', 'cosmos', 'galaxy'], { 16: 1.0 });
    addWord(['planet', 'planets', 'star', 'stars', 'moon', 'rocket'], { 16: 0.95 });

    // 16. Travel
    addWord(['travel', 'traveling', 'trip', 'journey'], { 17: 1.0 });
    addWord(['flight', 'plane', 'hotel', 'vacation'], { 17: 0.95 });

    // Common function words / neutral words
    this.stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'it', 'this', 'that']);
  }

  /**
   * Cleans text and splits into array of sentences.
   */
  parseInputSentences(rawText) {
    if (!rawText) return [];
    return rawText
      .split(/\r?\n/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  /**
   * Computes high-dimensional spelling representation (Option A).
   * Extracts character 2-grams, 3-grams, 4-grams and surface words.
   * Calculates TF-IDF weights.
   * 
   * @param {string[]} sentences 
   * @returns {Object} { vectors: number[][], featureNames: string[] }
   */
  generateSpellingVectors(sentences) {
    const N = sentences.length;
    const sentenceNgrams = [];
    const ngramDocFreq = new Map();

    // 1. Extract character n-grams and surface tokens
    for (const sentence of sentences) {
      const normalized = sentence.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
      const ngrams = new Set();
      const words = normalized.split(' ').filter(w => w.length > 0);

      // Add words as whole tokens
      for (const w of words) {
        ngrams.add(`W_${w}`);
      }

      // Add char n-grams (sizes 2, 3, 4)
      const padded = ` ${normalized} `;
      for (let n = 2; n <= 4; n++) {
        for (let i = 0; i <= padded.length - n; i++) {
          const gram = padded.substring(i, i + n);
          ngrams.add(`C_${gram}`);
        }
      }

      sentenceNgrams.push(ngrams);

      for (const gram of ngrams) {
        ngramDocFreq.set(gram, (ngramDocFreq.get(gram) || 0) + 1);
      }
    }

    // Filter to informative ngrams
    const featureList = Array.from(ngramDocFreq.keys()).sort();
    const D = featureList.length;
    const featureIndexMap = new Map(featureList.map((f, i) => [f, i]));

    // 2. Build TF-IDF vectors
    const vectors = [];
    for (let i = 0; i < N; i++) {
      const vec = new Array(D).fill(0);
      const ngrams = sentenceNgrams[i];

      for (const gram of ngrams) {
        const idx = featureIndexMap.get(gram);
        const df = ngramDocFreq.get(gram) || 1;
        // Sublinear TF-IDF
        const idf = Math.log(1 + (N / df));
        vec[idx] = 1.0 * idf;
      }

      // Normalize to unit sphere L2
      const norm = Math.hypot(...vec) || 1e-6;
      vectors.push(vec.map(val => val / norm));
    }

    return {
      vectors,
      featureCount: D,
      embeddingType: 'spelling',
      description: 'Character n-gram & surface term TF-IDF embedding'
    };
  }

  /**
   * Computes semantic meaning representation (Option B).
   * Projects sentence words into concept vector space.
   * Words with similar meanings (e.g. 'love' and 'adore', 'dogs' and 'puppies')
   * share dense concept dimensions.
   * 
   * @param {string[]} sentences 
   * @returns {Object} { vectors: number[][], featureNames: string[] }
   */
  generateMeaningVectors(sentences) {
    const N = sentences.length;
    const D = this.conceptDimensions.length;
    const vectors = [];

    for (const sentence of sentences) {
      const vec = new Array(D).fill(0);
      const rawWords = sentence
        .toLowerCase()
        .replace(/[^a-z0-9]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 0);

      let matchedWords = 0;

      for (let word of rawWords) {
        // Skip common stop words
        if (this.stopWords.has(word)) continue;

        let wordVec = this.wordVectors.get(word);

        // Simple morphological stemming fallback
        if (!wordVec) {
          if (word.endsWith('ing') && this.wordVectors.has(word.slice(0, -3))) {
            wordVec = this.wordVectors.get(word.slice(0, -3));
          } else if (word.endsWith('s') && this.wordVectors.has(word.slice(0, -1))) {
            wordVec = this.wordVectors.get(word.slice(0, -1));
          } else if (word.endsWith('ies') && this.wordVectors.has(word.slice(0, -3) + 'y')) {
            wordVec = this.wordVectors.get(word.slice(0, -3) + 'y');
          } else if (word.endsWith('ed') && this.wordVectors.has(word.slice(0, -2))) {
            wordVec = this.wordVectors.get(word.slice(0, -2));
          }
        }

        if (wordVec) {
          matchedWords++;
          for (let d = 0; d < D; d++) {
            vec[d] += wordVec[d];
          }
        } else {
          // Unrecognized word fallback: distribute a small deterministic pseudo-random hash
          // across dimensions so it still behaves consistently without crashing
          let hash = 0;
          for (let c = 0; c < word.length; c++) hash = (hash * 31 + word.charCodeAt(c)) | 0;
          const pseudoDim = Math.abs(hash) % D;
          vec[pseudoDim] += 0.2;
        }
      }

      // If no recognized words, give a uniform low baseline to avoid zero vector
      const norm = Math.hypot(...vec);
      if (norm < 1e-6) {
        const fallback = new Array(D).fill(1 / Math.sqrt(D));
        vectors.push(fallback);
      } else {
        vectors.push(vec.map(v => v / norm));
      }
    }

    return {
      vectors,
      featureCount: D,
      embeddingType: 'meaning',
      description: 'Dense semantic concept vector projection'
    };
  }

  /**
   * Principal Component Analysis (PCA) dimensionality reduction to 3D.
   * Computes covariance / Gram matrix and extracts top 3 eigenvectors using Power Iteration.
   * Scales coordinates into standard 3D room coordinates [-3, 3].
   * 
   * @param {number[][]} vectors High-dimensional vectors (N x D)
   * @returns {Array<{x: number, y: number, z: number}>}
   */
  reduceTo3D(vectors) {
    const N = vectors.length;
    if (N === 0) return [];
    if (N === 1) {
      return [{ x: 0, y: 0, z: 0 }];
    }
    if (N === 2) {
      // Direct placement along X axis proportional to their distance
      const cosSim = this.computeCosineSimilarity(vectors[0], vectors[1]);
      const separation = Math.sqrt(Math.max(0, 2 * (1 - cosSim))) * 2.5;
      return [
        { x: -separation / 2, y: 0, z: 0 },
        { x: separation / 2, y: 0, z: 0 }
      ];
    }

    const D = vectors[0].length;

    // 1. Center the data
    const mean = new Array(D).fill(0);
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < D; j++) {
        mean[j] += vectors[i][j];
      }
    }
    for (let j = 0; j < D; j++) {
      mean[j] /= N;
    }

    const centered = vectors.map(v => v.map((val, j) => val - mean[j]));

    // 2. Compute Gram Matrix G = X * X^T (size N x N)
    const G = Array.from({ length: N }, () => new Array(N).fill(0));
    for (let i = 0; i < N; i++) {
      for (let j = i; j < N; j++) {
        let dot = 0;
        for (let d = 0; d < D; d++) {
          dot += centered[i][d] * centered[j][d];
        }
        G[i][j] = dot;
        G[j][i] = dot;
      }
    }

    // 3. Power Iteration with Hotelling Deflation to find top 3 eigenvectors of G
    const eigenvectors = [];
    const eigenvalues = [];
    const G_current = G.map(row => [...row]);

    for (let k = 0; k < 3; k++) {
      // Initial random vector
      let b = Array.from({ length: N }, (_, idx) => Math.sin(idx + k * 1.5) + 0.1);
      let bNorm = Math.hypot(...b) || 1;
      b = b.map(val => val / bNorm);

      let lambda = 0;
      const maxIterations = 80;

      for (let iter = 0; iter < maxIterations; iter++) {
        // Multiply: nextB = G_current * b
        const nextB = new Array(N).fill(0);
        for (let r = 0; r < N; r++) {
          let sum = 0;
          for (let c = 0; c < N; c++) {
            sum += G_current[r][c] * b[c];
          }
          nextB[r] = sum;
        }

        const nextNorm = Math.hypot(...nextB);
        if (nextNorm < 1e-9) break;

        lambda = nextNorm;
        b = nextB.map(val => val / nextNorm);
      }

      eigenvectors.push(b);
      eigenvalues.push(Math.max(0, lambda));

      // Deflate: G_next = G_current - lambda * (b * b^T)
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          G_current[r][c] -= lambda * b[r] * b[c];
        }
      }
    }

    // 4. Compute 3D Coordinates: Coord_i = (e1[i] * sqrt(l1), e2[i] * sqrt(l2), e3[i] * sqrt(l3))
    const coords = [];
    const scaleFactors = eigenvalues.map(l => Math.sqrt(Math.max(0.0001, l)));

    for (let i = 0; i < N; i++) {
      coords.push({
        x: eigenvectors[0][i] * scaleFactors[0],
        y: eigenvectors[1][i] * (scaleFactors[1] || 0.1),
        z: eigenvectors[2][i] * (scaleFactors[2] || 0.1)
      });
    }

    // 5. Center and normalize coordinates nicely into the 3D room [-2.8, 2.8]
    return this.normalizeCoordinatesToRoom(coords);
  }

  /**
   * Normalizes and scales coordinates to fit harmoniously inside the 3D room.
   */
  normalizeCoordinatesToRoom(coords) {
    if (coords.length === 0) return [];
    
    // Find min and max
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    for (const c of coords) {
      if (c.x < minX) minX = c.x;
      if (c.x > maxX) maxX = c.x;
      if (c.y < minY) minY = c.y;
      if (c.y > maxY) maxY = c.y;
      if (c.z < minZ) minZ = c.z;
      if (c.z > maxZ) maxZ = c.z;
    }

    const rangeX = maxX - minX;
    const rangeY = maxY - minY;
    const rangeZ = maxZ - minZ;
    const maxRange = Math.max(rangeX, rangeY, rangeZ, 0.001);

    const targetRoomExtent = 2.8; // Coordinates will span from -2.8 to +2.8

    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;
    const midZ = (minZ + maxZ) / 2;

    const scale = (targetRoomExtent * 2) / maxRange;

    return coords.map((c, i) => {
      // Add slight jitter if points collapse onto the exact same coordinate
      const jitter = (i * 0.05) % 0.1 - 0.05;
      return {
        x: Number(((c.x - midX) * scale + (rangeX < 0.01 ? jitter : 0)).toFixed(3)),
        y: Number(((c.y - midY) * scale + (rangeY < 0.01 ? jitter : 0)).toFixed(3)),
        z: Number(((c.z - midZ) * scale + (rangeZ < 0.01 ? jitter : 0)).toFixed(3))
      };
    });
  }

  /**
   * Computes cosine similarity between two unit vectors.
   */
  computeCosineSimilarity(vecA, vecB) {
    let dot = 0;
    const len = Math.min(vecA.length, vecB.length);
    for (let i = 0; i < len; i++) {
      dot += vecA[i] * vecB[i];
    }
    // Clamp between -1 and 1
    return Math.max(-1, Math.min(1, dot));
  }

  /**
   * Computes 3D Euclidean distance between two coordinate objects.
   */
  computeEuclideanDistance(coordA, coordB) {
    const dx = coordA.x - coordB.x;
    const dy = coordA.y - coordB.y;
    const dz = coordA.z - coordB.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Generates a pedagogical comparison explanation between two sentences.
   */
  explainPairwiseSimilarity(sentA, sentB, embeddingType, cosSim, dist3D) {
    const simPercent = Math.max(0, Math.min(100, Math.round(((cosSim + 1) / 2) * 100)));
    const directSim = Math.max(0, Math.min(100, Math.round(cosSim * 100)));

    let explanation = '';

    if (embeddingType === 'spelling') {
      if (cosSim > 0.65) {
        explanation = `High spelling similarity (${directSim}%): These sentences share multiple common character sequences and word forms (e.g. roots/prefixes), causing them to cluster close together in character n-gram space.`;
      } else if (cosSim > 0.3) {
        explanation = `Moderate spelling overlap (${directSim}%): The sentences share some common letters, prefixes, or suffixes, but also feature distinct vocabulary words.`;
      } else {
        explanation = `Low spelling similarity (${directSim}%): Even if the concepts might be related, their surface letters and words differ almost entirely. In spelling mode, points with different letters are positioned far apart in 3D space.`;
      }
    } else {
      // Meaning
      if (cosSim > 0.7) {
        explanation = `High semantic similarity (${directSim}%): Although the sentences may use different wording (like "love" vs "adore", or "dogs" vs "puppies"), their underlying conceptual topics match tightly, placing them near each other in the semantic vector space!`;
      } else if (cosSim > 0.35) {
        explanation = `Moderate semantic relationship (${directSim}%): These sentences touch upon overlapping or adjacent themes (e.g. computer science and learning), maintaining a moderate distance.`;
      } else {
        explanation = `Low semantic similarity (${directSim}%): These sentences describe fundamentally different conceptual domains (e.g. pets vs financial markets), placing them on opposite sides of the 3D room.`;
      }
    }

    return {
      similarityPercent: directSim,
      euclideanDistance: Number(dist3D.toFixed(3)),
      explanation
    };
  }

  /**
   * Full pipeline: takes raw multiline text + embedding type, produces 3D points + metadata.
   */
  processSentences(rawText, embeddingType = 'spelling') {
    const sentences = this.parseInputSentences(rawText);
    if (sentences.length === 0) {
      throw new Error("Please enter at least one sentence (one per line).");
    }

    let vectorResult;
    if (embeddingType === 'spelling') {
      vectorResult = this.generateSpellingVectors(sentences);
    } else {
      vectorResult = this.generateMeaningVectors(sentences);
    }

    const coords3D = this.reduceTo3D(vectorResult.vectors);

    // Build sentence point objects
    const points = sentences.map((sentence, idx) => ({
      index: idx,
      id: idx + 1,
      sentence,
      x: coords3D[idx].x,
      y: coords3D[idx].y,
      z: coords3D[idx].z,
      highDimVector: vectorResult.vectors[idx]
    }));

    return {
      embeddingType,
      sentencesCount: sentences.length,
      featureCount: vectorResult.featureCount,
      description: vectorResult.description,
      points
    };
  }
}

// Export for browser
window.EmbeddingsEngine = EmbeddingsEngine;
