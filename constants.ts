export interface StyleRule {
  id: string;
  label: string;
  description: string;
  color: string;
  regex: RegExp;
  replacement?: string;
  priority: number; // Higher priority wins overlaps
}

// These rules are heuristic-heavy by necessity.
// Fully client-side style analysis is inherently limited, and regex-based checks are a pragmatic tradeoff here.
// Improvements and additional rules are very welcome.
export const STYLE_RULES: StyleRule[] = [
  {
    id: 'passive',
    label: 'Passive Voice',
    description: 'Passive voice often makes sentences wordy and vague. Use the active voice.',
    color:
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-b-2 border-green-500',
    regex:
      /\b(am|are|is|was|were|be|been|being)\s+(\w+ed|drawn|shown|taken|thrown|eaten|written|seen|done|gone)\b/gi,
    priority: 10,
  },
  {
    id: 'weak-verb',
    label: 'Weak Verb',
    description: 'Weak verbs (be-verbs) describe state, not action. Try a stronger verb.',
    color:
      'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-b-2 border-purple-500',
    regex: /\b(is|are|was|were|be|been|being)\b/gi,
    priority: 5,
  },
  {
    id: 'adverb',
    label: 'Adverb',
    description: 'Adverbs can be a sign of weak verbs. "She ran quickly" -> "She sprinted".',
    color:
      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-b-2 border-blue-500',
    regex: /\b\w{2,}ly\b/gi,
    priority: 6,
  },
  {
    id: 'filler',
    label: 'Filler Word',
    description: 'Filler words add clutter without meaning.',
    color:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-b-2 border-yellow-500',
    regex:
      /\b(just|very|really|literally|basically|actually|virtually|totally|essentially|absolute|obviously)\b/gi,
    priority: 7,
  },
  {
    id: 'nominalization',
    label: 'Hidden Verb',
    description:
      'Often shows up as a light verb + noun phrase (e.g., "make a decision" -> "decide"). This check is a heuristic, not a dictionary.',
    color:
      'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300 border-b-2 border-pink-500',
    // Match common "light verb" + nominalization phrases instead of any standalone -tion/-ment/-ance/-ence noun.
    // This dramatically reduces false positives like "distance" or "sentence".
    regex:
      /\b(?:make|makes|made|making|take|takes|took|taking|give|gives|gave|giving|have|has|had|having|do|does|did|doing|perform|performs|performed|performing|conduct|conducts|conducted|conducting)\b(?:[ \t]+(?:an?|the))?[ \t]+(?:\w+[ \t]+){0,2}\w+(?:tion|sion|ment|ance|ence)s?\b/gi,
    priority: 4,
  },
  {
    id: 'complex',
    label: 'Complex Word',
    description: "Don't use a $10 word when a $1 word will do.",
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-b-2 border-red-500',
    regex:
      /\b(utilize|facilitate|implement|endeavor|subsequently|accordingly|commence|approximately|ascertain)\b/gi,
    priority: 6,
  },
  {
    id: 'cliche',
    label: 'Cliché',
    description: 'Clichés are tired phrases. Be original.',
    color:
      'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-b-2 border-orange-500',
    regex:
      /\b(at the end of the day|avoid like the plague|better late than never|bite the bullet|break the ice)\b/gi,
    priority: 8,
  },
];

export const INITIAL_DOC_ID = 'welcome-note';
export const INITIAL_FOLDER_ID = 'my-notes';

export const WELCOME_CONTENT = `# Welcome to write0

This is a distraction-free writing environment designed to help you focus.

## Key Features

- **Distraction-Free Writing**: The UI fades away automatically while you type.
- **Smart Pasting**: Text pasted from other sources is highlighted so you can maintain your own voice.
- **Focus Mode**: Highlight the current paragraph and dim the rest to stay focused.
- **Style Check**: Identify weasel words, adverbs, and passive voice to tighten your prose.
- **Export Options**: Download your work as Markdown, HTML, or PDF.
- **Split View**: Write and preview your formatted text side-by-side.

## Writing Tips

1. Write first, edit later.
2. Keep sentences short.
3. Use active voice.

Enjoy your writing session.
`;
