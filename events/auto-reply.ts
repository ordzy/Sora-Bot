import { Message, EmbedBuilder } from 'discord.js';

interface AutoResponse {
  trigger: string[];
  reply: string | string[];
  color?: string;
  footer?: string;
}

// Base response type uses 'baseTriggers' instead of 'trigger'
interface BaseAutoResponse extends Omit<AutoResponse, 'trigger'> {
  baseTriggers: string[];
}

/**
 * Generate all phrase variants with:
 * - optional "is ", "this ", "the " prefixes
 * - apostrophe variants ("don't" vs "dont")
 * - with and without trailing question mark
 */
function generateVariants(phrase: string): string[] {
  const variants = new Set<string>();

  // Add the original
  variants.add(phrase);

  // Remove question mark for variant
  if (phrase.endsWith("?")) {
    variants.add(phrase.slice(0, -1));
  }

  // Expand contractions
  const contractionReplacements: Record<string, string> = {
    "won't": "will not",
    "don't": "do not",
    "doesn't": "does not",
    "can't": "cannot",
    "isn't": "is not",
    "aren't": "are not",
  };

  for (const [contraction, full] of Object.entries(contractionReplacements)) {
    if (phrase.includes(contraction)) {
      variants.add(phrase.replace(contraction, full));
    }
    if (phrase.includes(contraction.replace("'", ""))) {
      variants.add(phrase.replace(contraction.replace("'", ""), full));
    }
  }

  // Add/remove "the", "this", or nothing before known starters
  const nounStarters = ["app", "module", "movie", "source", "download", "stream"];
  for (const noun of nounStarters) {
    const regex = new RegExp(`\\b(the|this) ${noun}\\b`, "gi");
    if (regex.test(phrase)) {
      // Already has "the" or "this", remove it
      variants.add(phrase.replace(regex, noun));
    } else if (phrase.includes(noun)) {
      // Add variants with "the" and "this"
      variants.add(phrase.replace(noun, `the ${noun}`));
      variants.add(phrase.replace(noun, `this ${noun}`));
    }
  }

  return Array.from(variants);
}

// Your base responses: simple triggers, replies, colors, footers
const baseResponses: BaseAutoResponse[] = [
  {
    baseTriggers: [
      "stream not found",
      "episode won't work",
      "episode won’t work",
      "episode not playing",
      "nothing is loading",
      "stuck on 0",
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
      "video won’t load",
      "video won't load",
      "source won’t load",
      "source won't load",
      "source stuck at 0",
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
      "something dead again"
    ],
    reply: [
      "Before asking, please make sure to read the **#faq** channel — especially the *Getting Support* section.",
      "Ensure you're using the latest version of **Sora** from the **#installation** channel and that your modules are updated. You can enable auto-updates in settings.",
      "Some modules may be geo-restricted. Try using a VPN or a DNS like `1.1.1.1` for better results."
    ],
    color: "#DC143C",
    footer: "Module Troubleshooting"
  },
  {
    baseTriggers: [
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
      "download issue",
      "download problem",
      "downloads not working",
      "problem with download",
      "unable to download",
      "fails to download",
      "downloads don't start",
      "downloads don't work",
      "downloads won't work",
      "download errors",
      "download glitches",
      "downloads dead",
      "downloads disabled",
      "download doesn't trigger",
      "download not triggering",
      "download button doesn't work",
      "download option doesn't work"
    ],
    reply: "If downloads aren't working, look for the ☁️ cloud symbol in the module library. Only modules with this symbol support downloads.",
    color: "#1E90FF",
    footer: "Download Issues"
  },
  {
    baseTriggers: [
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
    reply: [
      "Working modules change often. For anime, try `Hianime`, `Anicrush`, `Miruro`, or `Aniwave (clone)`.",
      "For movies or shows, try `XPrime`, `Myflixer`, or `Flickystream`. Check community feedback for the latest updates!"
    ],
    color: "#32CD32",
    footer: "Module Recommendations"
  }
];

// Expand baseTriggers into full trigger variants for each response
const responses: AutoResponse[] = baseResponses.map(({ baseTriggers, ...rest }) => ({
  ...rest,
  trigger: baseTriggers.flatMap(generateVariants),
}));

function matchTrigger(content: string, trigger: string): boolean {
  const escaped = trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`\\b${escaped}(?=\\W|$)`, 'i');
  return pattern.test(content);
}

export default function handleAutoReply(message: Message): void {
  const content = message.content.toLowerCase();

  for (const entry of responses) {
    if (entry.trigger.some(trigger => matchTrigger(content, trigger))) {
      const replyText = Array.isArray(entry.reply)
        ? entry.reply.join('\n\n')
        : entry.reply;

      const embed = new EmbedBuilder()
        .setColor(entry.color ?? "#FFA500")
        .setDescription(replyText)
        .setTimestamp();

      if (entry.footer) {
        embed.setFooter({ text: entry.footer });
      }

      message.reply({ embeds: [embed] });
      console.log(`Auto-reply triggered by: "${message.content}"`);
      break;
    }
  }
}