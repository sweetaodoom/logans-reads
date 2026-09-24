/* Logan's Reads — content data (v1) */
/* Phoneme speech text: tuned spellings for speechSynthesis so kids hear
   sounds (not letter names), with minimal schwa on consonants. */

const PHONEMES = {
  a: "ah",  b: "buh", c: "kuh", d: "duh", e: "eh",
  f: "fff", g: "guh", h: "huh", i: "ih",  j: "juh",
  k: "kuh", l: "lll", m: "mmm", n: "nnn", o: "aw",
  p: "puh", r: "rrr", s: "sss", t: "tuh", u: "uh", w: "wuh",
};

/* Level 1 — letter sounds. Order: most useful first. */
const SOUNDS = [
  { ch: "s", emoji: "🐍", word: "snake" },
  { ch: "a", emoji: "🍎", word: "apple" },
  { ch: "t", emoji: "🐯", word: "tiger" },
  { ch: "p", emoji: "🐷", word: "pig" },
  { ch: "i", emoji: "🧊", word: "igloo" },
  { ch: "n", emoji: "👃", word: "nose" },
  { ch: "m", emoji: "🐭", word: "mouse" },
  { ch: "d", emoji: "🦆", word: "duck" },
  { ch: "g", emoji: "🐐", word: "goat" },
  { ch: "o", emoji: "🐙", word: "octopus" },
  { ch: "c", emoji: "🍪", word: "cookie" },
  { ch: "k", emoji: "🪁", word: "kite" },
  { ch: "e", emoji: "🐘", word: "elephant" },
  { ch: "u", emoji: "☂️", word: "umbrella" },
  { ch: "r", emoji: "🌈", word: "rainbow" },
  { ch: "h", emoji: "🏠", word: "house" },
  { ch: "b", emoji: "🐻", word: "bear" },
  { ch: "f", emoji: "🐟", word: "fish" },
  { ch: "l", emoji: "🦁", word: "lion" },
  { ch: "j", emoji: "🪼", word: "jellyfish" },
  { ch: "w", emoji: "🍉", word: "watermelon" },
];

/* Level 2 — CVC word families. `w` = word, `e` = emoji picture. */
const FAMILIES = [
  { name: "-at", words: [["cat","🐱"],["hat","🎩"],["mat","🧺"],["sat","🛋️"],["bat","🦇"],["rat","🐀"]] },
  { name: "-an", words: [["man","👨"],["fan","🌀"],["can","🥫"],["pan","🍳"]] },
  { name: "-ap", words: [["map","🗺️"],["cap","🧢"],["tap","🚰"],["nap","😴"]] },
  { name: "-in", words: [["pin","📌"],["fin","🐠"],["win","🏆"]] },
  { name: "-it", words: [["sit","🪑"],["hit","⚾"],["fit","🧩"]] },
  { name: "-ig", words: [["pig","🐷"],["dig","⛏️"],["big","🐘"]] },
  { name: "-og", words: [["dog","🐶"],["log","🪵"],["fog","🌫️"]] },
  { name: "-op", words: [["hop","🐇"],["top","🌀"],["mop","🧹"]] },
  { name: "-un", words: [["sun","☀️"],["run","🏃"],["fun","🎉"]] },
  { name: "-et", words: [["pet","🐾"],["net","🥅"],["jet","✈️"]] },
];

/* Sight words for sentences/stories. */
const SIGHT = ["a","the","is","can","on","in","it","and","see","me","my","we"];

/* Level: sentences (decodable + a couple with Logan's name/interests). */
const SENTENCES = [
  { text: "The cat can run.", emoji: "🐱" },
  { text: "The dog is big.", emoji: "🐶" },
  { text: "A pig can sit.", emoji: "🐷" },
  { text: "The cat is on the mat.", emoji: "🧺" },
  { text: "Logan has 3 fish.", emoji: "🐟" },
  { text: "A fish can swim.", emoji: "🐠" },
  { text: "We see the sun.", emoji: "☀️" },
  { text: "Sam has a red cap.", emoji: "🧢" },
];

/* Level: mini stories. One decodable sentence per page. */
const STORIES = [
  {
    id: "sam-cat",
    title: "Sam and the Cat",
    emoji: "🐱",
    pages: [
      { text: "Sam has a cat.", emoji: "👦" },
      { text: "The cat is on a mat.", emoji: "🧺" },
      { text: "Sam can pat the cat.", emoji: "🐱" },
      { text: "The cat can nap.", emoji: "😴" },
    ],
    question: {
      text: "Where is the cat?",
      choices: [["On a mat", "🧺", true], ["In a hat", "🎩", false]],
    },
  },
  {
    id: "sea-fun",
    title: "Sea Fun",
    emoji: "🌊",
    pages: [
      { text: "Logan has 3 fish.", emoji: "🐟" },
      { text: "The fish can swim.", emoji: "🐠" },
      { text: "A crab digs in the sand.", emoji: "🦀" },
      { text: "The crab is fun.", emoji: "🎉" },
    ],
    question: {
      text: "Who digs in the sand?",
      choices: [["The crab", "🦀", true], ["The fish", "🐟", false]],
    },
  },
];

/* Unlock thresholds (stars). */
const UNLOCKS = { sounds: 0, blend: 6, picture: 14, stories: 24 };

/* Emoji lookup for any blend word (used by picture game). */
const WORD_EMOJI = {};
FAMILIES.forEach(f => f.words.forEach(([w, e]) => { WORD_EMOJI[w] = e; }));

if (typeof module !== "undefined") module.exports = { PHONEMES, SOUNDS, FAMILIES, SIGHT, SENTENCES, STORIES, UNLOCKS, WORD_EMOJI };
/* shared global for the app script (robust across script eval contexts) */
if (typeof window !== "undefined") window.LRData = { PHONEMES, SOUNDS, FAMILIES, SIGHT, SENTENCES, STORIES, UNLOCKS, WORD_EMOJI };
