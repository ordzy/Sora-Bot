import { Message, EmbedBuilder } from 'discord.js';
import idclass from '../utils/idclass'; // adjust the path if needed

interface AutoResponse {
  wordGroups: string[][]; // Array of word combinations (3-5 words each)
  reply: string | string[];
  color?: string;
  footer?: string;
  priority?: number; // Higher priority = more specific match
  excludeWords?: string[]; // Words that if present, exclude this match
}

interface ExternalTriggerSource {
  name: string;
  url: string;
  reply: string | string[];
  footer?: string;
  priority?: number;
  color?: string;
  excludeWords?: string[]; // Words that if present, exclude this match
}

// Configuration for external trigger sources
const EXTERNAL_SOURCES: ExternalTriggerSource[] = [
  {
    name: "download_issues",
    url: "https://raw.githubusercontent.com/xibrox/sora-triggers/refs/heads/main/download-triggers.json",
    reply: [
      "If downloads aren't working, look for the ☁️ cloud symbol in the module library. Only modules with this symbol support downloads.",
      "If you're trying to download media, try holding down the episode and selecting the download option.",
    ],
    footer: "Download Issues",
    priority: 100,
    color: "Random",
    excludeWords: ["get", "install", "setup", "how", "where"] // Exclude installation-related queries
  },
  {
    name: "regional_issues",
    url: "https://raw.githubusercontent.com/xibrox/sora-triggers/refs/heads/main/regional-triggers.json",
    reply: [
      "Please note that some modules may be geo-restricted. Try a VPN or DNS like `1.1.1.1` if you're having issues in specific regions.",
      "Also check if you're using the latest version of **Sora** from the **#installation** channel, and your modules are up to date."
    ],
    footer: "Regional/Community Issues",
    priority: 90,
    color: "Random"
  },
  {
    name: "module_recommendations",
    url: "https://raw.githubusercontent.com/xibrox/sora-triggers/refs/heads/main/recommendation-triggers.json",
    reply: [
      "Working modules change often. Check the modules with the recommended badge in the module library."
    ],
    footer: "Module Recommendations",
    priority: 80,
    color: "Random"
  },
  {
    name: "general_troubleshooting",
    url: "https://raw.githubusercontent.com/xibrox/sora-triggers/refs/heads/main/general-triggers.json",
    reply: [
      `Before asking, please make sure to read the <#1304138599880593489> channel(s) — especially the *Getting Support* section.`,
      `Ensure you're using the latest version of **Sora** from <#1353008267797860402> channel(s) and that your modules are updated. You can enable auto-updates in settings.`,
      "Some modules may be geo-restricted. Try using a VPN or a DNS like `1.1.1.1` for better results."
    ],
    footer: "Module Troubleshooting",
    priority: 10,
    color: "Random"
  }
];

// Cache for loaded triggers
const triggerCache = new Map<string, string[]>();
const cacheExpiry = new Map<string, number>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Fallback triggers (used if external sources fail)
const FALLBACK_TRIGGERS = {
  download_issues: [
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
    "cannot download anything",
    "sir no download",
    "mrs no download why",
    "why no download",
    "no download",
    "download no work",
    "download broken",
    "download not work",
    "download fail",
    "download dead",
    "download help",
    "help download",
    "fix download",
    "download fix",
    "download issue help",
    "download problem help",
    "download missing",
    "missing download",
    "lost download",
    "download lost",
    "download gone",
    "gone download",
    "download disappeared",
    "disappeared download",
    "download vanished",
    "vanished download",
    "download not there",
    "not there download",
    "download invisible",
    "invisible download",
    "download hidden",
    "hidden download",
    "no download button",
    "download button missing",
    "download button gone",
    "download button not working",
    "download button broken",
    "download icon missing",
    "download icon gone",
    "download icon not working",
    "download icon broken",
    "cant find download",
    "cannot find download",
    "can't find download",
    "find download",
    "download not found",
    "download 404",
    "download error 404",
    "download unavailable",
    "unavailable download",
    "download disabled",
    "disabled download",
    "download removed",
    "removed download",
    "download deleted",
    "deleted download",
    "download blocked",
    "blocked download",
    "download restricted",
    "restricted download",
    "download limited",
    "limited download",
    "download failed",
    "failed download",
    "download timeout",
    "timeout download",
    "download slow",
    "slow download",
    "download stuck",
    "stuck download",
    "download frozen",
    "frozen download",
    "download hanging",
    "hanging download",
    "download pending",
    "pending download",
    "download waiting",
    "waiting download",
    "download queued",
    "queued download",
    "download paused",
    "paused download",
    "download stopped",
    "stopped download",
    "download cancelled",
    "cancelled download",
    "download aborted",
    "aborted download",
    "download interrupted",
    "interrupted download",
    "download incomplete",
    "incomplete download",
    "download partial",
    "partial download",
    "download corrupted",
    "corrupted download",
    "download damaged",
    "damaged download",
    "download invalid",
    "invalid download",
    "download wrong",
    "wrong download",
    "download bad",
    "bad download",
    "download empty",
    "empty download",
    "download zero",
    "zero download",
    "download null",
    "null download",
    "download void",
    "void download",
    "download blank",
    "blank download",
    "can I download in this app?",
    "does this app have downloads?",
    "sir can I download from this app?",
    "is downloading possible?",
    "how to download shows?",
    "download feature available?",
    "can I download movies?",
    "does sora support downloads?",
    "how do I download episodes?",
    "where is download option?",
    "can I save videos offline?",
    "offline viewing possible?",
    "download capability?",
    "download functionality?",
    "app supports saving?",
    "can I download for offline?",
    "how to save episodes?",
    "download media option?",
    "can I download content?",
    "does it have download feature?",
    "sora download capability",
    "downloads supported?",
    "can I download and watch later?",
    "offline access available?",
    "download option exists?",
    "is download available?",
    "download supported in app?"
  ],
  regional_issues: [
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
  ],
  module_recommendations: [
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
  ],
  general_troubleshooting: [
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
    "videos dont start",
    // Add installation/getting app related triggers
    "how do I get this app",
    "how do I get peak app",
    "how do I get sora app",
    "where do I get this app",
    "where do I download this app",
    "how to install this app",
    "how to install peak",
    "how to install sora",
    "where to install from",
    "installation help",
    "getting the app",
    "obtaining the app",
    "acquiring the app"
  ]
};

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

// Function to fetch triggers from external source
async function fetchTriggers(url: string): Promise<string[]> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();

    // Support different JSON formats
    if (Array.isArray(data)) {
      return data.filter((item: any) => typeof item === 'string');
    } else if (data.triggers && Array.isArray(data.triggers)) {
      return data.triggers.filter((item: any) => typeof item === 'string');
    } else if (data.phrases && Array.isArray(data.phrases)) {
      return data.phrases.filter((item: any) => typeof item === 'string');
    }
    
    console.warn(`Unknown JSON format from ${url}:`, data);
    return [];
  } catch (error) {
    console.error(`Failed to fetch triggers from ${url}:`, error);
    return [];
  }
}

// Function to get triggers with caching
async function getCachedTriggers(source: ExternalTriggerSource): Promise<string[]> {
  const now = Date.now();
  const cacheKey = source.name;
  
  // Check if cache is valid
  if (triggerCache.has(cacheKey) && cacheExpiry.get(cacheKey)! > now) {
    return triggerCache.get(cacheKey)!;
  }
  
  // Fetch new triggers
  const triggers = await fetchTriggers(source.url);
  
  // Update cache
  triggerCache.set(cacheKey, triggers);
  cacheExpiry.set(cacheKey, now + CACHE_DURATION);
  
  return triggers;
}

// Function to load all responses dynamically
async function loadResponses(): Promise<AutoResponse[]> {
  const responses: AutoResponse[] = [];
  
  for (const source of EXTERNAL_SOURCES) {
    try {
      // Try to get triggers from external source
      let triggers = await getCachedTriggers(source);
      
      // Use fallback if external source failed or returned empty array
      if (triggers.length === 0) {
        console.warn(`Using fallback triggers for ${source.name}`);
        triggers = FALLBACK_TRIGGERS[source.name as keyof typeof FALLBACK_TRIGGERS] || [];
      }
      
      if (triggers.length > 0) {
        responses.push({
          wordGroups: createWordGroups(triggers),
          reply: source.reply,
          footer: source.footer,
          priority: source.priority || 50,
          color: source.color,
          excludeWords: source.excludeWords
        });
      }
    } catch (error) {
      console.error(`Failed to load triggers for ${source.name}:`, error);
      
      // Use fallback triggers
      const fallbackTriggers = FALLBACK_TRIGGERS[source.name as keyof typeof FALLBACK_TRIGGERS] || [];
      if (fallbackTriggers.length > 0) {
        responses.push({
          wordGroups: createWordGroups(fallbackTriggers),
          reply: source.reply,
          footer: source.footer,
          priority: source.priority || 50,
          color: source.color,
          excludeWords: source.excludeWords
        });
      }
    }
  }
  
  return responses;
}

// Function to check if all words in a word group are present in the message
function checkWordGroupMatch(messageWords: string[], wordGroup: string[]): boolean {
  return wordGroup.every(word => 
    messageWords.some(messageWord => {
      // Exact match
      if (messageWord === word) return true;
      
      // Handle common variations and contractions
      const variations: Record<string, string[]> = {
        'work': ['working', 'works', 'worked'],
        'working': ['work', 'works', 'worked'],
        'works': ['work', 'working', 'worked'],
        'worked': ['work', 'working', 'works'],
        'download': ['downloading', 'downloads', 'downloaded'],
        'downloading': ['download', 'downloads', 'downloaded'],
        'downloads': ['download', 'downloading', 'downloaded'],
        'downloaded': ['download', 'downloading', 'downloads'],
        'module': ['modules', 'mod', 'mods'],
        'modules': ['module', 'mod', 'mods'],
        'mod': ['module', 'modules', 'mods'],
        'mods': ['module', 'modules', 'mod'],
        'no': ['not', 'dont', "don't", 'doesnt', "doesn't", 'wont', "won't", 'cant', "can't", 'cannot', 'aint', "ain't"],
        'not': ['no', 'dont', "don't", 'doesnt', "doesn't", 'aint', "ain't"],
        'dont': ['not', 'no', "don't", 'doesnt', "doesn't", 'aint', "ain't"],
        "don't": ['not', 'no', 'dont', 'doesnt', "doesn't", 'aint', "ain't"],
        'doesnt': ['not', 'no', 'dont', "don't", "doesn't", 'aint', "ain't"],
        "doesn't": ['not', 'no', 'dont', "don't", 'doesnt', 'aint', "ain't"],
        'cant': ["can't", 'cannot', 'no', 'not'],
        "can't": ['cant', 'cannot', 'no', 'not'],
        'cannot': ['cant', "can't", 'no', 'not'],
        'wont': ["won't", 'will not', 'no', 'not'],
        "won't": ['wont', 'will not', 'no', 'not'],
        'aint': ["ain't", 'not', 'no', 'dont', "don't"],
        "ain't": ['aint', 'not', 'no', 'dont', "don't"],
        'why': ['how', 'what', 'where', 'when'],
        'how': ['why', 'what', 'where'],
        'what': ['why', 'how', 'where'],
        'where': ['why', 'how', 'what'],
        'when': ['why', 'how', 'what'],
        'broken': ['broke', 'dead', 'fail', 'failed', 'error', 'issue', 'problem', 'bugged', 'glitch'],
        'broke': ['broken', 'dead', 'fail', 'failed', 'error', 'issue', 'problem'],
        'dead': ['broken', 'broke', 'fail', 'failed', 'down', 'offline'],
        'fail': ['failed', 'broken', 'broke', 'dead', 'error'],
        'failed': ['fail', 'broken', 'broke', 'dead', 'error'],
        'error': ['broken', 'fail', 'failed', 'issue', 'problem', 'glitch'],
        'issue': ['problem', 'error', 'broken', 'trouble'],
        'problem': ['issue', 'error', 'broken', 'trouble'],
        'trouble': ['problem', 'issue', 'error', 'broken'],
        'bugged': ['broken', 'glitch', 'error', 'bug'],
        'glitch': ['broken', 'bugged', 'error', 'bug'],
        'bug': ['bugged', 'glitch', 'error', 'broken'],
        'help': ['fix', 'repair', 'solve', 'assist'],
        'fix': ['help', 'repair', 'solve'],
        'repair': ['fix', 'help', 'solve'],
        'solve': ['fix', 'help', 'repair'],
        'assist': ['help', 'support'],
        'support': ['help', 'assist'],
        'sir': ['bro', 'dude', 'mate', 'friend', 'guys', 'anyone'],
        'mrs': ['bro', 'dude', 'mate', 'friend', 'guys', 'anyone'],
        'bro': ['sir', 'dude', 'mate', 'friend', 'guys'],
        'dude': ['sir', 'bro', 'mate', 'friend', 'guys'],
        'mate': ['sir', 'bro', 'dude', 'friend', 'guys'],
        'friend': ['sir', 'bro', 'dude', 'mate', 'guys'],
        'guys': ['sir', 'bro', 'dude', 'mate', 'friend', 'anyone'],
        'anyone': ['guys', 'sir', 'someone', 'anybody'],
        'someone': ['anyone', 'somebody', 'anybody'],
        'somebody': ['someone', 'anyone', 'anybody'],
        'anybody': ['anyone', 'someone', 'somebody'],
        'app': ['application', 'program', 'software', 'sora'],
        'application': ['app', 'program', 'software'],
        'program': ['app', 'application', 'software'],
        'software': ['app', 'application', 'program'],
        'sora': ['app', 'application', 'program'],
        'stream': ['streaming', 'streamed', 'play', 'playing', 'watch', 'watching'],
        'streaming': ['stream', 'streamed', 'play', 'playing'],
        'streamed': ['stream', 'streaming', 'played'],
        'play': ['playing', 'played', 'stream', 'streaming', 'watch'],
        'playing': ['play', 'played', 'streaming', 'watching'],
        'played': ['play', 'playing', 'streamed'],
        'watch': ['watching', 'watched', 'play', 'stream'],
        'watching': ['watch', 'watched', 'playing', 'streaming'],
        'watched': ['watch', 'watching', 'played'],
        'video': ['videos', 'movie', 'movies', 'show', 'shows', 'episode', 'episodes'],
        'videos': ['video', 'movies', 'shows', 'episodes'],
        'movie': ['movies', 'video', 'film', 'films'],
        'movies': ['movie', 'videos', 'films'],
        'film': ['films', 'movie', 'movies'],
        'films': ['film', 'movie', 'movies'],
        'show': ['shows', 'series', 'program', 'programs'],
        'shows': ['show', 'series', 'programs'],
        'series': ['show', 'shows', 'season', 'seasons'],
        'season': ['seasons', 'series'],
        'seasons': ['season', 'series'],
        'episode': ['episodes', 'ep', 'eps'],
        'episodes': ['episode', 'eps'],
        'ep': ['episode', 'episodes', 'eps'],
        'eps': ['episode', 'episodes', 'ep'],
        'load': ['loading', 'loaded', 'start', 'starting'],
        'loading': ['load', 'loaded', 'starting'],
        'loaded': ['load', 'loading', 'started'],
        'start': ['starting', 'started', 'begin', 'load'],
        'starting': ['start', 'started', 'beginning', 'loading'],
        'started': ['start', 'starting', 'began', 'loaded'],
        'begin': ['beginning', 'began', 'start'],
        'beginning': ['begin', 'began', 'starting'],
        'began': ['begin', 'beginning', 'started'],
        'missing': ['gone', 'disappeared', 'vanished', 'lost', 'invisible', 'hidden'],
        'gone': ['missing', 'disappeared', 'vanished', 'lost'],
        'disappeared': ['missing', 'gone', 'vanished', 'lost'],
        'vanished': ['missing', 'gone', 'disappeared', 'lost'],
        'lost': ['missing', 'gone', 'disappeared', 'vanished'],
        'invisible': ['missing', 'hidden', 'gone'],
        'hidden': ['missing', 'invisible', 'gone'],
        'stuck': ['frozen', 'hanging', 'stopped', 'paused'],
        'frozen': ['stuck', 'hanging', 'stopped'],
        'hanging': ['stuck', 'frozen', 'stopped'],
        'stopped': ['stuck', 'frozen', 'paused'],
        'paused': ['stopped', 'stuck', 'waiting'],
        'waiting': ['paused', 'pending', 'queued'],
        'pending': ['waiting', 'queued', 'stuck'],
        'queued': ['waiting', 'pending', 'stuck'],
        'slow': ['sluggish', 'lagging', 'delayed'],
        'sluggish': ['slow', 'lagging'],
        'lagging': ['slow', 'sluggish', 'delayed'],
        'delayed': ['slow', 'lagging'],
        'timeout': ['timed out', 'expired', 'failed'],
        'expired': ['timeout', 'timed out'],
        'cancelled': ['canceled', 'aborted', 'stopped'],
        'canceled': ['cancelled', 'aborted', 'stopped'],
        'aborted': ['cancelled', 'canceled', 'stopped'],
        'interrupted': ['stopped', 'cancelled', 'aborted'],
        'incomplete': ['partial', 'unfinished', 'broken'],
        'partial': ['incomplete', 'unfinished'],
        'unfinished': ['incomplete', 'partial'],
        'corrupted': ['damaged', 'broken', 'invalid'],
        'damaged': ['corrupted', 'broken', 'invalid'],
        'invalid': ['corrupted', 'damaged', 'wrong', 'bad'],
        'wrong': ['invalid', 'bad', 'incorrect'],
        'bad': ['wrong', 'invalid', 'broken', 'corrupted'],
        'incorrect': ['wrong', 'invalid', 'bad'],
        'empty': ['blank', 'void', 'null', 'zero'],
        'blank': ['empty', 'void', 'null'],
        'void': ['empty', 'blank', 'null'],
        'null': ['empty', 'blank', 'void', 'zero'],
        'zero': ['null', 'empty', 'nothing'],
        'nothing': ['zero', 'empty', 'none'],
        'none': ['nothing', 'zero', 'empty'],
        'unavailable': ['disabled', 'blocked', 'restricted', 'removed'],
        'disabled': ['unavailable', 'blocked', 'removed'],
        'blocked': ['unavailable', 'disabled', 'restricted'],
        'restricted': ['unavailable', 'blocked', 'limited'],
        'limited': ['restricted', 'blocked'],
        'removed': ['unavailable', 'disabled', 'deleted'],
        'deleted': ['removed', 'gone', 'missing'],
        // Remove the problematic "get" -> "download" variation for installation queries
        'install': ['setup', 'configure', 'obtain', 'acquire'],
        'setup': ['install', 'configure'],
        'configure': ['install', 'setup'],
        'obtain': ['acquire', 'install'],
        'acquire': ['obtain', 'install'],
        'peak': ['sora', 'app', 'application'],
        'this': ['the', 'that', 'sora', 'peak'],
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

// Function to check if message contains excluded words
function hasExcludedWords(messageWords: string[], excludeWords?: string[]): boolean {
  if (!excludeWords || excludeWords.length === 0) return false;
  
  return excludeWords.some(excludeWord => 
    messageWords.includes(excludeWord.toLowerCase())
  );
}

// Function to manually refresh triggers cache
export function refreshTriggersCache(): void {
  triggerCache.clear();
  cacheExpiry.clear();
  console.log('Triggers cache cleared');
}

// Main handler function
export default async function handleAutoReply(message: Message): Promise<void> {
  const messageWords = extractWords(message.content);

  if (message.channelId !== idclass.channelSupport()) return;


    if (message.member?.roles?.cache.some((role) => idclass.roleMods2().includes(role.id))) return;

  // Skip if message is too short
  if (messageWords.length < 2) return;

  try {
    // Load responses (uses cache if available)
    const responses = await loadResponses();
    
    let bestMatch: AutoResponse | null = null;
    let bestScore = 0;

    // Find the best matching response based on score
    for (const response of responses) {
      // Skip if message contains excluded words for this response
      if (hasExcludedWords(messageWords, response.excludeWords)) {
        continue;
      }

      for (const wordGroup of response.wordGroups) {
        const score = calculateMatchScore(messageWords, wordGroup, response.priority || 50);
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = response;
        }
      }
    }

    // Only reply if we have a good match (minimum score threshold)
    const minimumScore = 40;
    
    if (bestMatch && bestScore >= minimumScore) {
      const replyText = Array.isArray(bestMatch.reply)
        ? bestMatch.reply.join('\n\n')
        : bestMatch.reply;

      const embed = new EmbedBuilder()
        .setColor(bestMatch.color as any || "Random")
        .setDescription(replyText)
        .setTimestamp();

      if (bestMatch.footer) {
        embed.setFooter({ text: bestMatch.footer });
      }

      await message.reply({ embeds: [embed] });
    }
  } catch (error) {
    console.error('Error in handleAutoReply:', error);
  }
}