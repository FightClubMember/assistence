// Lexical Diagnostic Laboratory (Layer A)
// Scans text for common orthographic deviations in English and Hindi.

import { escapeHtml } from './utils.js';

const ENGLISH_RULES = [
  {
    patterns: [/\bacomodation\b/i, /\bacommodation\b/i, /\baccomodation\b/i, /\bacomodated\b/i, /\baccomodated\b/i],
    correct: "accommodation",
    syllables: "Ac-com-mo-da-tion",
    rule: "Contains double 'c' and double 'm'. Remember the mnemonic: 'Two Cots, Two Mattresses'."
  },
  {
    patterns: [/\bbuerocracy\b/i, /\bureacracy\b/i, /\bbueracracy\b/i],
    correct: "bureaucracy",
    syllables: "Bu-reau-cra-cy",
    rule: "Root word 'bureau' combined with suffix 'cracy'. Pay attention to the vowel sequence: e-a-u."
  },
  {
    patterns: [/\bmaintainance\b/i, /\bmaintenence\b/i],
    correct: "maintenance",
    syllables: "Main-te-nance",
    rule: "Derived from 'maintain', but the middle syllable changes from 'tain' to 'te' before 'nance'."
  },
  {
    patterns: [/\bcommitee\b/i, /\bcomitee\b/i, /\bcommitte\b/i],
    correct: "committee",
    syllables: "Com-mit-tee",
    rule: "Contains double 'm', double 't', and double 'e'."
  },
  {
    patterns: [/\bocurrence\b/i, /\boccurence\b/i, /\boccurens\b/i],
    correct: "occurrence",
    syllables: "Oc-cur-rence",
    rule: "Contains double 'c' and double 'r', ending in 'ence'. Derived from 'occur'."
  },
  {
    patterns: [/\bseperate\b/i, /\bseperated\b/i],
    correct: "separate",
    syllables: "Sep-a-rate",
    rule: "Contains 'par' in the middle. Remember the phrase: 'There is a rat in separate'."
  },
  {
    patterns: [/\brecieve\b/i, /\brecieved\b/i],
    correct: "receive",
    syllables: "Re-ceive",
    rule: "Follow the standard rule: 'i' before 'e' except after 'c' when the sound is /ee/."
  },
  {
    patterns: [/\bbegining\b/i],
    correct: "beginning",
    syllables: "Be-gin-ning",
    rule: "Double the final consonant 'g' when adding 'ing' to a multi-syllable word ending in a consonant preceded by a single vowel, if the stress is on the last syllable."
  },
  {
    patterns: [/\bneccessary\b/i, /\bnecesary\b/i, /\bneccesary\b/i],
    correct: "necessary",
    syllables: "Ne-ces-sa-ry",
    rule: "Contains one 'c' and double 's'. Mnemonic: 'One Collar, Two Sleeves'."
  },
  {
    patterns: [/\bindependant\b/i],
    correct: "independent",
    syllables: "In-de-pen-dent",
    rule: "Ends with suffix 'ent', not 'ant'."
  }
];

const HINDI_RULES = [
  {
    patterns: [/आशिर्वाद/],
    correct: "आशीर्वाद",
    explanation: "रेफ (र्) का उच्चारण 'शी' के बाद होता है, इसलिए यह आगामी वर्ण 'वा' के ऊपर लगाया जाएगा (शीर्वाद), न कि 'शी' पर।",
    shortVsLong: "ई (दीर्घ स्वर) - आ-शी-र्-वा-द"
  },
  {
    patterns: [/कविइत्री/, /कवयत्री/, /कवीत्री/],
    correct: "कवयित्री",
    explanation: "'कवि' का स्त्रीलिंग रूप 'कवयित्री' होता है। इसमें 'य' पर छोटी इ (ि) और 'त्र' पर बड़ी ई (ी) की मात्रा आती है।",
    shortVsLong: "इ (लघु स्वर) 'यि' पर तथा ई (दीर्घ स्वर) 'त्री' पर।"
  },
  {
    patterns: [/उज्वल/, /उज्जवल/],
    correct: "उज्ज्वल",
    explanation: "उत् + ज्वल के संधि नियम से 'त्' का 'ज्' हो जाता है। इसमें दो बार आधा 'ज' आता है और फिर 'व' आता है (उ + ज् + ज् + व + ल)।",
    shortVsLong: "ज् (अर्ध-व्यंजन) संयोजन।"
  },
  {
    patterns: [/श्रीमति\b/],
    correct: "श्रीमती",
    explanation: "स्त्रीलिंग सूचक शब्द जो 'मती' या 'वती' पर समाप्त होते हैं, उनमें हमेशा दीर्घ ई (ी) की मात्रा लगती है।",
    shortVsLong: "ई (दीर्घ स्वर) - श्रीमती (धीमी और गहरी ध्वनि)"
  },
  {
    patterns: [/\bकवी\b/],
    correct: "कवि",
    explanation: "'कवि' शब्द का उच्चारण लघु इ (ि) के साथ समाप्त होता है। इसे कवी लिखना अशुद्ध है।",
    shortVsLong: "इ (लघु स्वर) - कवि (तेज़ उच्चारण)"
  },
  {
    patterns: [/\bदीन\b/, /\bदिन\b/],
    isSemanticCheck: true,
    correct: "दिन / दीन (अर्थ-भेद)",
    explanation: "दिन और दीन में मात्रा का भेद अर्थ बदल देता है। 'दिन' का अर्थ है 'वार' (Day) और 'दीन' का अर्थ है 'ग़रीब' (Poor)।",
    shortVsLong: "दिन (लघु इ = Day) vs दीन (दीर्घ ई = Poor)।"
  }
];

/**
 * Scan input text for spelling errors.
 * Returns formatted repair blocks or empty string if clear.
 */
export function scanText(text) {
  if (!text) return "";
  
  let englishRepairs = [];
  let hindiRepairs = [];

  // English Scan
  for (const item of ENGLISH_RULES) {
    for (const pattern of item.patterns) {
      if (pattern.test(text)) {
        englishRepairs.push({
          word: item.correct,
          syllables: item.syllables,
          rule: item.rule
        });
        break; // Match found for this word
      }
    }
  }

  // Hindi Scan
  for (const item of HINDI_RULES) {
    for (const pattern of item.patterns) {
      if (pattern.test(text)) {
        hindiRepairs.push({
          word: item.correct,
          explanation: item.explanation,
          shortVsLong: item.shortVsLong,
          isSemantic: item.isSemanticCheck
        });
        break; // Match found for this word
      }
    }
  }

  let repairOutput = "";

  if (englishRepairs.length > 0) {
    repairOutput += "\n\n<b>[LEXICAL REPAIR: ENGLISH]</b>\n";
    for (const rep of englishRepairs) {
      repairOutput += `⚠️ <b>Detected Deviation:</b> Correct spelling is <b>${escapeHtml(rep.word)}</b>\n`;
      repairOutput += `• <b>Syllable Chunking:</b> <code>${escapeHtml(rep.syllables)}</code>\n`;
      repairOutput += `• <b>Linguistic Rule:</b> ${escapeHtml(rep.rule)}\n\n`;
    }
  }

  if (hindiRepairs.length > 0) {
    repairOutput += "\n\n<b>[वर्तनी सुधार: HINDI]</b>\n";
    for (const rep of hindiRepairs) {
      if (rep.isSemantic) {
        repairOutput += `ℹ️ <b>शब्द अर्थ भेद चेतावनी:</b> <b>${escapeHtml(rep.word)}</b>\n`;
        repairOutput += `• <b>उच्चारण भेद:</b> ${escapeHtml(rep.shortVsLong)}\n`;
        repairOutput += `• <b>विवरण:</b> ${escapeHtml(rep.explanation)}\n\n`;
      } else {
        repairOutput += `⚠️ <b>अशुद्ध वर्तनी संसूचन:</b> शुद्ध रूप <b>${escapeHtml(rep.word)}</b> है।\n`;
        repairOutput += `• <b>मात्रा भेद विवरण:</b> ${escapeHtml(rep.explanation)}\n`;
        repairOutput += `• <b>ध्वनि नियम:</b> ${escapeHtml(rep.shortVsLong)}\n`;
        repairOutput += `📝 <b>अभ्यास के लिए ३ बार लिखें:</b>\n`;
        repairOutput += `1. <code>${escapeHtml(rep.word)}</code>\n`;
        repairOutput += `2. <code>${escapeHtml(rep.word)}</code>\n`;
        repairOutput += `3. <code>${escapeHtml(rep.word)}</code>\n\n`;
      }
    }
  }

  return repairOutput;
}
