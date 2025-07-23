import { Message, EmbedBuilder } from 'discord.js';

interface AutoResponse {
  wordGroups: string[][]; // Array of word combinations (3-5 words each)
  reply: string | string[];
  color?: string;
  footer?: string;
  priority?: number; // Higher priority = more specific match
}

// Helper function to create word combinations from phrases
function createWordGroups(phrases: string[]): string[][] {
  const wordGroups: string[][] = [];
  
  for (const phrase of phrases) {
    // Clean and split the phrase into words
    const words = phrase
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .split(/\s+/)
      .filter(word => word.length > 0);
    
    // Create combinations of 3-5 words
    for (let size = 3; size <= Math.min(5, words.length); size++) {
      for (let i = 0; i <= words.length - size; i++) {
        const wordGroup = words.slice(i, i + size);
        wordGroups.push(wordGroup);
      }
    }
    
    // Also add the full phrase as words if it's shorter than 3 words
    if (words.length < 3 && words.length > 0) {
      wordGroups.push(words);
    }
  }
  
  return wordGroups;
}

// Response definitions with word groups - ordered by specificity
const responses: AutoResponse[] = [
  // Most specific: Download issues (highest priority)
  {
    wordGroups: createWordGroups([
      "download always starts",
      "download starts but never finishes",
      "download starts but doesn't finish",
      "download not starting",
      "download not working",
      "download not appearing",
      "download not showing",
      "download doesn't work",
      "download doesn't appear",
      "download doesn't show",
      "download stuck",
      "download keeps failing",
      "download fails to start",
      "download never completes",
      "download finishes instantly",
      "download gets stuck",
      "download fails midway",
      "downloads freeze",
      "downloads hang",
      "downloads broken",
      "broken download",
      "download crashed",
      "download closes immediately",
      "never shows up in finished",
      "never shows up in active",
      "download missing from finished",
      "download not in finished",
      "download not in active",
      "no active downloads",
      "nothing in finished downloads",
      "nothing in active downloads",
      "downloads invisible",
      "download doesn't get tracked",
      "not listed in downloads",
      "download not listed",
      "no indication of download",
      "why is download not working",
      "why isn't download working",
      "is download broken",
      "is download feature broken",
      "is downloading broken",
      "is download bugged",
      "download doesn't do anything",
      "what's wrong with downloads",
      "anyone else download not working",
      "download doesn't start for me",
      "how do I fix downloads",
      "can't download",
      "cant download",
      "cannot download",
      "won't download",
      "wont download",
      "download issue",
      "download problem",
      "downloads not working",
      "problem with download",
      "unable to download",
      "fails to download",
      "downloads don't start",
      "downloads don't work",
      "downloads won't work",
      "downloads wont work",
      "download errors",
      "download glitches",
      "downloads dead",
      "downloads disabled",
      "download doesn't trigger",
      "download not triggering",
      "download button doesn't work",
      "download option doesn't work",
      "i cannot download anything",
      "cannot download anything"
    ]),
    reply: "If downloads aren't working, look for the ☁️ cloud symbol in the module library. Only modules with this symbol support downloads.",
    color: "Random",
    footer: "Download Issues",
    priority: 100
  },
  
  // Specific: Regional/Geo issues (high priority)
  {
    wordGroups: createWordGroups([
      "anyone got sora working in india",
      "guys what movie modules support eng sub",
      "movie modules with eng sub",
      "is sora not working in my country",
      "does sora work in india",
      "app not working in india",
      "sora work for anyone in india",
      "does sora work for anyone in india",
      "working in india",
      "sora india",
      "modules work in india",
      "geo restricted",
      "region blocked",
      "country blocked",
      "vpn needed",
      "dns needed",
      "location issues",
      "regional problems"
    ]),
    reply: [
      "Please note that some modules may be geo-restricted. Try a VPN or DNS like `1.1.1.1` if you're having issues in specific regions.",
      "Also check if you're using the latest version of **Sora** from the **#installation** channel, and your modules are up to date."
    ],
    color: "Random",
    footer: "Regional/Community Issues",
    priority: 90
  },

  // Specific: Module recommendations (medium priority)
  {
    wordGroups: createWordGroups([
      "what are best modules",
      "best module",
      "which module works best",
      "recommend modules",
      "best module to use",
      "which modules do you recommend",
      "modules recommendations",
      "what modules should I use",
      "top modules",
      "favorite modules",
      "most reliable modules",
      "best streaming modules",
      "good modules",
      "modules that work well",
      "which module is the best",
      "which is the best module",
      "module recommendations",
      "suggested modules",
      "modules you suggest",
      "modules worth using"
    ]),
    reply: [
      "Working modules change often. Check the modules with the recommended badge in the module library."
    ],
    color: "Random",
    footer: "Module Recommendations",
    priority: 80
  },

  // General: Streaming/playback issues (lowest priority - catch-all)
  {
    wordGroups: createWordGroups([
      "stream not found",
      "episode won't work",
      "episode wont work",
      "episode not playing",
      "nothing is loading",
      "stuck on zero",
      "modules not loading",
      "modules not working",
      "modules are broken",
      "all modules broken",
      "all sources dead",
      "sources not working",
      "no module is working",
      "no modules work",
      "can't play anything",
      "cant play anything",
      "nothing works for me",
      "can't load any episode",
      "cant load any episode",
      "can't load any source",
      "cant load any source",
      "no episode is playing",
      "no source is working",
      "playback doesn't start",
      "playback doesnt start",
      "video won't load",
      "video wont load",
      "source won't load",
      "source wont load",
      "source stuck at zero",
      "black screen on playback",
      "is the app broken",
      "is sora down",
      "is the module down",
      "is something dead",
      "is anything working",
      "any working module",
      "anyone else having problems",
      "is this happening to anyone else",
      "does any movie module work",
      "does any anime module work",
      "does anything work",
      "is the sora module working",
      "this happens with every module",
      "module working for you",
      "nothing is working",
      "it's not working again",
      "its not working again",
      "can't stream anything",
      "cant stream anything",
      "something dead again",
      "modules don't work",
      "modules dont work",
      "are all modules broken",
      "module not loading",
      "stream won't start",
      "stream wont start",
      "can't play anything on any module",
      "cant play anything on any module",
      "no module works for me",
      "videos won't start",
      "videos wont start",
      "videos dont start"
    ]),

    reply: [
  `Before asking, please make sure to read the <#1304138599880593489> channel(s) — especially the *Getting Support* section.`,
  `Ensure you're using the latest version of **Sora** from <#1353008267797860402> channel(s) and that your modules are updated. You can enable auto-updates in settings.`,
      "Some modules may be geo-restricted. Try using a VPN or a DNS like `1.1.1.1` for better results."
    ],

    color: "Random",
    footer: "Module Troubleshooting",
    priority: 10
  }
];

// Function to check if all words in a word group are present in the message
function checkWordGroupMatch(messageWords: string[], wordGroup: string[]): boolean {
  return wordGroup.every(word => 
    messageWords.some(messageWord => {
      // Exact match
      if (messageWord === word) return true;
      
      // Handle common variations and contractions
      const variations: Record<string, string[]> = {
        'work': ['working', 'works'],
        'working': ['work', 'works'],
        'works': ['work', 'working'],
        'download': ['downloading', 'downloads'],
        'downloading': ['download', 'downloads'],
        'downloads': ['download', 'downloading'],
        'module': ['modules'],
        'modules': ['module'],
        'no': ['not', 'dont', "don't", 'doesnt', "doesn't"],
        'not': ['no', 'dont', "don't", 'doesnt', "doesn't"],
        'dont': ['not', 'no', "don't", 'doesnt', "doesn't"],
        "don't": ['not', 'no', 'dont', 'doesnt', "doesn't"],
        'doesnt': ['not', 'no', 'dont', "don't", "doesn't"],
        "doesn't": ['not', 'no', 'dont', "don't", 'doesnt'],
        'cant': ["can't", 'cannot'],
        "can't": ['cant', 'cannot'],
        'cannot': ['cant', "can't"],
        'wont': ["won't", 'will not'],
        "won't": ['wont', 'will not']
      };
      
      // Check variations
      if (variations[word]?.includes(messageWord) || variations[messageWord]?.includes(word)) {
        return true;
      }
      
      // Allow partial matching for longer words (4+ characters)
      if (word.length >= 4 && messageWord.length >= 4) {
        return messageWord.includes(word) || word.includes(messageWord);
      }
      
      return false;
    })
  );
}

// Function to calculate match score based on word group size and specificity
function calculateMatchScore(messageWords: string[], wordGroup: string[], priority: number): number {
  if (!checkWordGroupMatch(messageWords, wordGroup)) {
    return 0;
  }
  
  // Score based on:
  // 1. Priority (specificity of the response)
  // 2. Word group length (longer = more specific)
  // 3. Exact word matches vs partial matches
  let score = priority * 10;
  score += wordGroup.length * 5;
  
  // Bonus for exact matches
  const exactMatches = wordGroup.filter(word =>
    messageWords.includes(word)
  ).length;
  score += exactMatches * 2;
  
  return score;
}

// Function to normalize and extract words from message
function extractWords(content: string): string[] {
  return content
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 0);
}

export default function handleAutoReply(message: Message): void {
  const messageWords = extractWords(message.content);
  
  // Skip if message is too short
  if (messageWords.length < 2) return;

  let bestMatch: AutoResponse | null = null;
  let bestScore = 0;

  // Find the best matching response based on score
  for (const response of responses) {
    for (const wordGroup of response.wordGroups) {
      const score = calculateMatchScore(messageWords, wordGroup, response.priority || 50);
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = response;
      }
    }
  }

  // Only reply if we have a good match (minimum score threshold)
  const minimumScore = 40; // Lowered threshold for legitimate short phrases
  
  if (bestMatch && bestScore >= minimumScore) {
    const replyText = Array.isArray(bestMatch.reply)
      ? bestMatch.reply.join('\n\n')
      : bestMatch.reply;

    const embed = new EmbedBuilder()
      .setColor("Random")
      .setDescription(replyText)
      .setTimestamp();

    if (bestMatch.footer) {
      embed.setFooter({ text: bestMatch.footer });
    }

    message.reply({ embeds: [embed] });
  }
}