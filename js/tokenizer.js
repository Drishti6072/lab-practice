/**
 * LLM Pipeline Explorer - Tokenizer Engine
 * 
 * Implements:
 * 1. Training text parsing & vocabulary building with unique 0-indexed IDs.
 * 2. Clean word token extraction (with optional punctuation support).
 * 3. Sentence encoding with known token lookup.
 * 4. Subword / character-level decomposition for unknown words using WordPiece-style continuation tokens ('c', '##a', '##t').
 * 5. Deterministic, consistent, collision-free token ID assignment.
 */

class TokenizerEngine {
  constructor(options = {}) {
    this.options = Object.assign({
      includePunctuation: false,
      caseSensitive: true
    }, options);

    this.vocabulary = new Map(); // token -> id
    this.reverseVocab = new Map(); // id -> token
    this.subwordVocab = new Map(); // subwordToken -> id
    this.reverseSubwordVocab = new Map(); // id -> subwordToken
    this.trainingSentences = [];
    this.nextAvailableId = 0;
  }

  /**
   * Cleans and splits raw multiline text into non-empty sentence strings.
   * @param {string} rawText 
   * @returns {string[]}
   */
  parseSentences(rawText) {
    if (!rawText || typeof rawText !== 'string') return [];
    return rawText
      .split(/\r?\n/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  /**
   * Tokenizes a single sentence into word tokens.
   * Strips sentence boundary punctuation by default so words like "learning."
   * become clean "learning" tokens.
   * 
   * @param {string} sentence 
   * @returns {string[]}
   */
  splitIntoTokens(sentence) {
    if (!sentence) return [];
    let text = sentence.trim();
    if (!this.options.caseSensitive) {
      text = text.toLowerCase();
    }

    if (this.options.includePunctuation) {
      // Split words and punctuation separately
      const matches = text.match(/[a-zA-Z0-9]+|[^\s\w]/g);
      return matches ? matches.map(t => t.trim()).filter(t => t.length > 0) : [];
    } else {
      // Extract alphanumeric words only (ignoring periods, commas, etc.)
      const matches = text.match(/[a-zA-Z0-9]+/g);
      return matches ? matches.map(t => t.trim()).filter(t => t.length > 0) : [];
    }
  }

  /**
   * Builds the training vocabulary from multiple training sentences.
   * Assigns unique IDs starting from 0.
   * 
   * @param {string} rawText 
   * @returns {Object} { sentencesCount, vocabSize, vocabularyList }
   */
  buildVocabulary(rawText) {
    this.vocabulary.clear();
    this.reverseVocab.clear();
    this.subwordVocab.clear();
    this.reverseSubwordVocab.clear();
    this.nextAvailableId = 0;

    this.trainingSentences = this.parseSentences(rawText);
    
    if (this.trainingSentences.length === 0) {
      throw new Error("Please enter at least one training sentence to build the vocabulary.");
    }

    const seenTokens = new Set();
    const orderedTokens = [];

    for (const sentence of this.trainingSentences) {
      const tokens = this.splitIntoTokens(sentence);
      for (const token of tokens) {
        if (!seenTokens.has(token)) {
          seenTokens.add(token);
          orderedTokens.push(token);
        }
      }
    }

    if (orderedTokens.length === 0) {
      throw new Error("No valid tokens found in the training sentences.");
    }

    // Assign unique IDs starting from 0
    orderedTokens.forEach((token, index) => {
      this.vocabulary.set(token, index);
      this.reverseVocab.set(index, token);
    });

    this.nextAvailableId = orderedTokens.length;

    return {
      sentencesCount: this.trainingSentences.length,
      vocabSize: this.vocabulary.size,
      vocabularyList: Array.from(this.vocabulary.entries()).map(([token, id]) => ({
        token,
        id
      }))
    };
  }

  /**
   * Checks if vocabulary has been built.
   * @returns {boolean}
   */
  isVocabReady() {
    return this.vocabulary.size > 0;
  }

  /**
   * Encodes a test sentence using the built vocabulary.
   * If a word is unknown, it decomposes into character-level tokens:
   * First character: 'c'
   * Subsequent characters: '##a', '##t'
   * Reuses subword IDs consistently and guarantees no conflicts with vocab IDs.
   * 
   * @param {string} sentence 
   * @returns {Object} encoding result
   */
  encodeSentence(sentence) {
    if (!this.isVocabReady()) {
      throw new Error("Vocabulary is empty! Please click 'Build Vocabulary' in Step 1 first.");
    }

    if (!sentence || sentence.trim().length === 0) {
      throw new Error("Please enter a sentence to tokenize and encode.");
    }

    const inputTokens = this.splitIntoTokens(sentence.trim());
    if (inputTokens.length === 0) {
      throw new Error("No tokens could be extracted from the input sentence.");
    }

    const tokenDetails = [];
    const encodedSequence = [];
    const unknownWords = [];

    for (const token of inputTokens) {
      if (this.vocabulary.has(token)) {
        // Known vocabulary token
        const id = this.vocabulary.get(token);
        encodedSequence.push(id);
        tokenDetails.push({
          token,
          id,
          type: 'known',
          typeLabel: 'Known Token',
          sourceWord: token,
          isSubword: false
        });
      } else {
        // Unknown token -> Character-level subword decomposition
        unknownWords.push(token);
        const chars = Array.from(token);
        
        chars.forEach((char, charIdx) => {
          // First character has no prefix; subsequent characters receive '##' prefix
          const subwordToken = charIdx === 0 ? char : `##${char}`;
          let id;

          if (this.subwordVocab.has(subwordToken)) {
            // Consistent reuse of previously assigned subword ID
            id = this.subwordVocab.get(subwordToken);
          } else {
            // New subword token: assign a new ID that never conflicts with existing vocab
            id = this.nextAvailableId++;
            this.subwordVocab.set(subwordToken, id);
            this.reverseSubwordVocab.set(id, subwordToken);
          }

          encodedSequence.push(id);
          tokenDetails.push({
            token: subwordToken,
            id,
            type: charIdx === 0 ? 'unknown-root' : 'unknown-continuation',
            typeLabel: charIdx === 0 ? 'Unknown Root' : 'Continuation (##)',
            sourceWord: token,
            isSubword: true,
            charIndex: charIdx
          });
        });
      }
    }

    return {
      originalSentence: sentence.trim(),
      tokens: tokenDetails,
      encodedSequence,
      unknownWords: Array.from(new Set(unknownWords)),
      hasUnknownTokens: unknownWords.length > 0
    };
  }

  /**
   * Returns current vocabulary entries as an array.
   */
  getVocabularyList() {
    return Array.from(this.vocabulary.entries()).map(([token, id]) => ({
      token,
      id
    }));
  }

  /**
   * Returns all dynamic subword tokens registered so far.
   */
  getSubwordList() {
    return Array.from(this.subwordVocab.entries()).map(([token, id]) => ({
      token,
      id
    }));
  }
}

// Export for browser
window.TokenizerEngine = TokenizerEngine;
