import { CombatEncounter, CardThemeType } from '../types';
import { ZinePaletteId, getZinePalette } from '../data/zinePalettes';
import { getChoreographyPresetsForCard } from './choreography';

export interface ZineActs {
  sceneSetup: string;     // 3 rich paragraphs (Act 01)
  intervention: string;   // 3 rich paragraphs (Act 02)
  aftermath: string;      // 3 rich paragraphs (Act 03)
}

export interface ZinePrompts {
  resolvedVisualStyleId: string;
  resolvedVisualStyleLabel: string;
  resolvedStoryArcId: string;
  resolvedStoryArcLabel: string;
  resolvedHeroLookId: string;
  resolvedHeroLookLabel: string;
  resolvedAtmosphereLabel: string;
  panelLabels: [string, string, string, string];
  masterStoryboard2x2Prompt: string;
  masterStoryboardUltraSafePrompt: string;
  sameChatGif1FollowupPrompt: string;
  sameChatGif2FollowupPrompt: string;
  sameChatVideoFollowupPrompt: string;
  sameChatOutroVideoPrompt: string;
  leadVideo16x9: string;
  shot01WideArchitecture: string;
  shot02AnomalyPortrait: string;
  shot03LowAngleAction: string;
  shot04TabletopGearFlatlay: string;
  gif01Act1TensionLoop: string;
  gif02Act3AftermathLoop: string;
  synthSongPrompt: string;
  storyGeneratorPrompt: string;
}

export interface ZineIssueData {
  id: string;
  issueNumber: number;
  hexSeed: string;
  title: string;
  classification: string;
  sectorTag: string;
  actPhase: string;
  location: string;
  anomalyName: string;
  characterName: string;
  characterFull: string;
  weapon: string;
  artifact: string;
  synergy: string;
  lightingMood: string;
  cameraAngle: string;
  witnessPerspective: string;
  artStyle: string;
  zinePaletteId: ZinePaletteId;
  encounter: CombatEncounter;
  acts: ZineActs;
  prompts: ZinePrompts;
  // Hydrated Runtime Media URLs (Object URLs or Data URIs)
  videoUrl?: string;
  outroVideoUrl?: string;
  galleryUrls: (string | undefined)[]; // [shot01, shot02, shot03, shot04]
  gifUrl?: string;
  gifUrl2?: string;
  audioUrl?: string;
  audioTitle?: string;
  cardImageUrl?: string;
  cardVideoUrl?: string;
}

const BRAND_FREE_REPLACEMENTS: Array<[RegExp, string]> = [
  // Living comic artists, publishers, celebrities & copyrighted IPs (top image-policy blockers!)
  [/\bTodd\s+McFarlane(?:\s+style)?(?:\s+90s)?\b/gi, 'dramatic 1990s bold-ink'],
  [/\bJim\s+Lee(?:\s+style)?(?:\s+90s)?\b/gi, 'dynamic 1990s crosshatched'],
  [/\bBruce\s+Timm(?:\s+style)?(?:\s+90s)?\b/gi, 'sleek 1990s angular'],
  [/\b90s\s+Dark\s+Horse\b|\bDark\s+Horse(?:\s+90s)?\b/gi, '1990s indie'],
  [/\bGhost\s+in\s+the\s+Shell\s*\/?\s*Evangelion\b/gi, '1990s sci-fi cel-animation'],
  [/\bGhost\s+in\s+the\s+Shell\b/gi, '1990s sci-fi cel-animation'],
  [/\bEvangelion\b/gi, 'retro mecha cel-animation'],
  [/\bCastlevania(?:-adjacent)?\b/gi, 'gothic 1990s'],
  [/\bCyberpunk\b/gi, 'retro-neon tech'],
  [/\bBrandon\s+['"]?Dragon-Kick['"]?\s+Lee\b/gi, 'Ronan Vance'],
  [/\bBrandon\s+Lee\b/gi, 'Ronan Vance'],
  [/\bMaya\s+Lin\b/gi, 'Mina Sato'],
  [/\bMiyamoto\b/gi, 'Takahashi'],

  // Retail, tech, toy & food trademarks
  [/\bKB\s*Toys\b|\bK&B\b/gi, 'retro mall toy depot'],
  [/\bBlockbuster\b/gi, 'midnight video rental outlet'],
  [/\bChuck\s*E\.?\s*Cheese(?:'s)?\b|\bChuck's(?:\s+Animatronic\s+Pizza)?\b/gi, 'animatronic pizza arcade'],
  [/\bLA\s+Gear\b/gi, 'neon light-up high-top'],
  [/\bWalkman\b/gi, 'portable cassette player'],
  [/\bDiscman\b/gi, 'portable anti-skip CD player'],
  [/\bTalk-?Boy\b|\bSoundBoy\b/gi, 'portable voice-recorder cassette player'],
  [/\bGame\s*Boy\b/gi, 'translucent 8-bit handheld console'],
  [/\bNintendo\s*64\b|\bN64\b/gi, 'atomic-purple 64-bit console'],
  [/\bSuper\s*Soaker\b/gi, 'pressurized neon water sprayer'],
  [/\bPolaroid\b/gi, 'instant-film camera'],
  [/\bTrapper\s*Keeper\b/gi, 'velcro geometric 3-ring binder'],
  [/\bRollerblade(?:s)?\b/gi, 'neon inline skates'],
  [/\bMaglite\b/gi, 'heavy anodized aluminum flashlight'],
  [/\bSlush\s*Pupp(?:ie|y)\b/gi, 'neon slushie dispenser'],
  [/\bDiscovery\s+(?:Play-?)?Zone\b/gi, 'tubular indoor foam-pit arcade'],
  [/\bAOL\b/gi, '56k dial-up trial disc'],
  [/\bSuncoast\b/gi, 'mall cinema tape boutique'],
  [/\bScholastic\b/gi, 'retro community book-fair'],
  [/\bPOG(?:s)?\b/gi, 'holographic milk-cap slammer'],
  [/\bBop-?It\b/gi, 'plastic rhythm-command toy'],
  [/\bSkip-?It\b/gi, 'counter-weighted ankle-spinner toy'],
  [/\bRainforest\s+Cafe\b/gi, 'indoor tropical themed diner'],
  [/\bSears\b/gi, 'retro department store'],
  [/\bCasio(?:\s+Illuminator)?\b/gi, 'retro digital wristwatch'],
  [/\bWindows\s+Defrag\b/gi, '1990s desktop disk-grid'],
  [/\bWindows\b/gi, '1990s desktop OS'],
  [/\bDOS\s+Prompt\b|\bDOS\b/g, 'command-line monitor'],
  [/\bSilly\s+Putty\b/gi, 'bouncing modeling putty'],
  [/\bSilly\s+String\b/gi, 'neon foam streamer'],
  [/\bSlime\s+Gak\b|\bGak\b/gi, 'neon translucent slime putty'],
  [/\bPop-?Rocks?\b/gi, 'crackling fizz candy'],
  [/\bHypercolor\b/gi, 'heat-reactive neon'],
  [/\bMuzak\b/gi, 'mall elevator synth'],
  [/\bGeneral\s+Cinema\b/gi, 'suburban multiplex cinema'],
  [/\bDayglo\b/gi, 'neon-bright'],
  [/\bMaster\s+(?:Pad)?lock\b/gi, 'heavy brass padlock'],
  [/\bSega\b/gi, '16-bit arcade'],
  [/\bVHS\b/gi, 'analog video cassette'],
  [/\bCyberNet\b/gi, 'retro net'],
  [/\bU-Lock\b/gi, 'steel bike lock'],
  [/\bGeiger\b/gi, 'analog frequency'],
];

const VISUAL_POLICY_SAFE_REPLACEMENTS: Array<[RegExp, string]> = [
  // Minor / school / youth safety guard (prevents false-positive blocks in action/sci-fi scenes)
  [/\bmiddle\s+school(?:\s+scout)?\b/gi, 'retro neighborhood scout'],
  [/\belementary\s+school\b/gi, 'retro community hall'],
  [/\bhigh\s+school(?:ers)?\b/gi, 'retro suburban'],
  [/\bchildren(?:'s)?\b/gi, 'retro colorful'],
  [/\bchild\b/gi, 'adult explorer'],
  [/\byouth\b/gi, 'retro aluminum'],
  [/\bsleepover\b/gi, 'late-night'],
  [/\bplayground\b/gi, 'suburban park'],
  [/\bvarsity\s+cheerleader\b|\bcheerleader\b/gi, 'retro varsity team captain'],
  [/\bschoolyard\b/gi, 'suburban courtyard'],
  [/\bplay-?place\b/gi, 'retro neon dome'],
  [/\bball\s*-?\s*pit\b/gi, 'colorful plastic-sphere pit'],
  [/\b(?:mall\s+)?photo\s+booth\b/gi, 'retro mall arcade portrait kiosk'],
  [/\bstrip\s+mall\b/gi, 'suburban shopping plaza'],
  [/\bfluorescent\s+strip\s+lights?\b/gi, 'overhead fluorescent tube lights'],
  [/\bspandex\b/gi, 'retro athletic trackwear'],
  [/\bkids?\b/gi, 'retro arcade fans'],
  [/\bteen(?:ager|s)?\b/gi, 'adult'],
  [/\byoung\s+(woman|man)\b/gi, 'adult $1'],

  // Weapons, violence, gore, horror & dark terminology -> playful PG 1990s sci-fi comic equivalents
  [/\bmalevolent\b/gi, 'mischievous cosmic'],
  [/\bmenacing\b/gi, 'dramatic oversized'],
  [/\bterrifying\b/gi, 'imposing retro sci-fi'],
  [/\bhorror\b/gi, 'sci-fi mystery'],
  [/\bviolent(?:ly)?\b/gi, 'energetic'],
  [/\bweapons?\b/gi, 'retro containment gadget'],
  [/\bstun\s+gun\b/gi, 'retro spark-coil gadget'],
  [/\bbrass\s+knuckles\b/gi, 'heavy brass arcade-token gauntlets'],
  [/\bserrated\s+(?:linoleum\s+)?carpet\s+knife\b|\bknives\b|\bknife\b/gi, 'heavy-duty retro utility scraper'],
  [/\brazor\s+squeegee\b|\brazor(?:-sharp)?\b/gi, 'chrome-edged'],
  [/\bguillotine\b/gi, 'spring-loaded mechanical clamp'],
  [/\blaser\s+pistol\b|\bpistol\b|\bgun\b/gi, 'plastic retro sci-fi light-projector toy'],
  [/\bdagger\b/gi, 'glowing toy wand'],
  [/\bbullet\s+hell\b|\bbullets?\b/gi, 'neon arcade particle cascade'],
  [/\btime-?bomb\b|\bbombs?\b/gi, 'countdown glitch capsule'],
  [/\bcrowbar\b/gi, 'taped steel pry-tool'],
  [/\brebar\s+spike\b|\bspike\b/gi, 'wrapped metal antenna rod'],
  [/\blife-?steal\b/gi, 'energy siphon'],
  [/\bdeath\s+curse\b|\brewinding?-or-die\b|\brewind-or-die\b|\bdeath\b|\bdie\b|\bkill(?:er|ing|s)?\b/gi, 'glitch-reset'],
  [/\bdoom\b/gi, 'cosmic static'],
  [/\barch-?demon\b|\bdemon\b|\bdaemon\b|\barch-?fiend\b|\bhellhound\b|\bnecromancer\b|\bincubus\b|\babomination\b/gi, 'retro sci-fi hologram creature'],
  [/\bvampire\s+fangs?\b|\bvampire\b/gi, 'glowing neon novelty teeth'],
  [/\bpoltergeist\b|\brevenant\b|\bbanshee\b|\bspecter\b|\bspectre\b|\bghost\b/gi, 'neon holographic phantom'],
  [/\bcursed\b|\bpossessed\b|\bhaunted\b/gi, 'glitch-charged'],
  [/\bstatic-bleeding\b|\bbleeding\b|\bblood\b/gi, 'glowing neon static'],
  [/\bcorpse(?:-god)?\b/gi, 'crystalline relic monolith'],
  [/\bsevered(?:\s+synthetic)?\s+torso\b|\bsevered\b/gi, 'detached retro chassis'],
  [/\bembryo\b/gi, 'glowing miniature alien figurine'],
  [/\bthroat\b/gi, 'collar'],
  [/\bstrangler\b|\bmangler\b|\bdevourer\b|\bscorcher\b|\breaper\b|\bslayer\b|\binterrogator\b/gi, 'tangling anomaly'],
  [/\bretina(?:l)?\s+burn\b|\bretina(?:l)?\b/gi, 'neon prism flash'],
  [/\bacid(?:ic)?\b/gi, 'bubbling neon fizz'],
  [/\btoxic\b/gi, 'electric-lime'],
  [/\bradioactive\b/gi, 'neon-glowing'],
  [/\bvenom\b|\bpoisoned\b/gi, 'luminescent fizz'],
  [/\bcrime\s+scenes?\b/gi, 'mystery clue scenes'],
  [/\blethal\b/gi, 'high-voltage'],
  [/\bskeleton\b|\bskulls?\b|\bcoffin\b|\bgravestone(?:\s+hologram)?\b/gi, 'glowing prism hologram'],
  [/\bripping\s+through\b|\btearing\b/gi, 'emerging dramatically through'],
  [/\bblasting\b|\bblast\b/gi, 'projecting a dazzling beam'],
  [/\bexplosions?\b|\bexplosive\b/gi, 'radiant burst of sparks'],
  [/\bbattle\b|\bcombat\b/gi, 'sci-fi comic action'],
  [/\bcrushing\b|\bsmashes\b|\bslams?\b/gi, 'surges past'],
  [/\bgross-out\b/gi, 'quirky 1990s'],
  [/\bslap-?shot\b|\benforcer\b/gi, 'retro rink goalie'],
  [/\bgritty\b|\bdread\b/gi, 'atmospheric retro'],
  [/\briot-grrrl\b/gi, 'indie garage-rock'],
  [/\bfury\b|\bmanglers?\b/gi, 'cosmic flair'],
  [/\bblack\s+market\b/gi, 'retro collector'],
  [/\bvigilante\b/gi, 'neighborhood patrol'],
  [/\bsickly\b/gi, 'neon'],
  [/\bparasite\b|\bleech\b/gi, 'signal gremlin'],
  [/\bpredator(?:y)?\b/gi, 'imposing'],
  [/\bfangs?\b/gi, 'jagged crystals'],
  [/\bclaws?\b/gi, 'mechanical grippers'],
  [/\bchoked\b/gi, 'tangled'],
  [/\bstingers?\b/gi, 'energy beams'],
  [/\bweaponized\b/gi, 'retro-rigged'],
  [/\bmeat\s+tenderizer\b/gi, 'vintage aluminum kitchen'],
  [/\bjagged\s+edge\b/gi, 'scuffed metal edge'],
  [/\bsharpened\b/gi, 'oversized'],
  [/\bt-?ball\s+bat\b|\bbaseball\s+bat\b/gi, 'retro aluminum sports bat'],
  [/\bflail\b/gi, 'spinner'],
  [/\bshuriken\b/gi, 'spinning disc'],
  [/\bdressing\s+room\b/gi, 'retail mirror alcove'],
  [/\bsecurity\s+guard\b/gi, 'night-shift patrol'],
  [/\bgarbage\s+collector\b/gi, 'retro sticker'],
  [/\bfleshen\b/gi, 'crystalline'],
  [/\bboil(?:ing)?\s+mercury\b/gi, 'shimmering liquid chrome'],
  [/\basbestos-lined\b/gi, 'insulated metallic'],
  [/\bcontraband\b/gi, 'vintage'],
  [/\bdeserter\b/gi, 'rogue'],
  [/\bfugitive\b/gi, 'roaming'],
  [/\bfiring\b/gi, 'flashing'],
  [/\bshoot(?:s|ing)?\b/gi, 'zipping'],
  [/\bdead\b/gi, 'quiet empty'],
  [/\bdying\b/gi, 'fading'],
  [/\bmenace\b/gi, 'cosmic energy'],
  [/\bbreach\b/gi, 'dimensional rift'],
  [/\bblade\b/gi, 'glowing energy rod'],
  [/\bspear\b/gi, 'long aluminum pole'],
  [/\bscream(?:ing|er|s)?\b/gi, 'buzzing'],
  [/\bterror\b|\bfear\b|\bpanic\b/gi, 'mystery'],
  [/\bbug\s+zapper\b/gi, 'glowing ultraviolet garden lantern'],
  [/\bhalloween\s+masks?\b/gi, 'colorful carnival novelty masks'],
  [/\bclown\s+mouth\b/gi, 'painted carnival archway'],
  [/\banti-theft\b/gi, 'clear plastic'],
  [/\bfighting\s+game\b/gi, 'retro arcade action'],
  [/\bwrestling\s+gym\b/gi, 'retro suburban athletic gym'],
  [/\bwrestling\s+coach\b/gi, 'retro athletic coach'],
  [/\bsmoking\s+iron\b/gi, 'warm soldering tool'],

  // Vibrancy guardrail: prevent muted/pastel/monochrome/sepia tokens from washing out generated art
  [/\bred-monochrome\b/gi, 'blazing crimson-red'],
  [/\bmonochrome\b/gi, 'vibrant full-color'],
  [/\bpastel\b/gi, 'vivid electric-neon'],
  [/\bcotton-candy\b/gi, 'blazing hot-magenta and electric-cyan spun-sugar'],
  [/\bsepia\b/gi, 'blazing golden-amber'],
];

export function sanitizeBrandFree(text: string): string {
  let out = text || '';
  for (const [pattern, replacement] of BRAND_FREE_REPLACEMENTS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

export function sanitizeVisualPromptText(text: string): string {
  let out = sanitizeBrandFree(text || '');
  for (const [pattern, replacement] of VISUAL_POLICY_SAFE_REPLACEMENTS) {
    out = out.replace(pattern, replacement);
  }
  return out
    .replace(/\b(empty|uninhabited|quiet|normal|weightless|dimly lit|peaceful|unlit|ordinary quiet)\s+(a|an|the)\s+/gi, '$1 ')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .trim();
}

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function pickSeeded<T>(arr: T[], seed: number, offset: number = 0): T {
  return arr[Math.abs(seed + offset * 31) % arr.length];
}

function toGoosebumpsFeeling(rawAffliction: string): string {
  const lower = (rawAffliction || '').toLowerCase();
  if (lower.includes('nostalgia') || lower.includes('homesick')) {
    return 'a creepy daydreamy feeling like every clock in town had rolled straight back to 1995';
  }
  if (lower.includes('chronolog')) {
    return 'a dizzy chill, like time itself had just hiccuped backward ten seconds';
  }
  if (lower.includes('sugar')) {
    return 'heavy, wobbly knees—like eating three whole bags of sour candy right before a race';
  }
  if (lower.includes('static') || lower.includes('magnetic') || lower.includes('velcro')) {
    return 'a prickly buzz that made every single hair on their arms stand straight up';
  }
  if (lower.includes('mall') || lower.includes('muzak')) {
    return 'a spooky foggy feeling, like cheesy mall elevator music was echoing right inside their head';
  }
  if (lower.includes('dial-up') || lower.includes('stereo')) {
    return 'a weird ringing in their ears that sounded just like an angry modem screeching in the dark';
  }
  if (lower.includes('slime') || lower.includes('plastic')) {
    return 'a strange tingle in their fingertips, like the whole room was turning to rubber';
  }
  if (lower.includes('stereogram') || lower.includes('blacklight')) {
    return 'a blinking double-vision chill that made every shadow look like it was waving hello';
  }
  if (lower.includes('hypercolor') || lower.includes('fever')) {
    return 'a sudden weird wave of goosebumps—freezing cold one second and super warm the next';
  }
  if (lower.includes('pop-rock')) {
    return 'a funny fizzy crackle in the air, like a thousand packs of popping candy going off at once';
  }
  if (lower.includes('thumb') || lower.includes('pet')) {
    return 'a twitchy, jumpy feeling like they had just lost their last life on the final boss';
  }
  return 'a cold shiver straight down their spine—the kind that tells you to turn around right now';
}

function toGoosebumpsWeirdSign(rawDistortion: string): string {
  const firstSentence =
    (rawDistortion || 'The ceiling lights flickered on and off in a spooky rhythm.')
      .split(/(?<=[.!?])\s+/)[0]
      ?.trim() || 'The ceiling lights flickered on and off in a spooky rhythm.';
  const cleaned = firstSentence
    .replace(/\binfinite geometric voids\b/gi, 'weird glowing checkerboard tunnels')
    .replace(/\bdimensional frequencies\b/gi, 'a creepy, buzzing tune')
    .replace(/\bblack-hole antimatter\b/gi, 'glowing purple galaxy')
    .replace(/\bfour-dimensional space\b/gi, 'thin air like giant black streamers')
    .replace(/\bpurple nebulae\b/gi, 'swirling purple clouds')
    .replace(/\bliving barcode tendrils\b/gi, 'wiggly black-and-white stripes')
    .replace(/\bthe spacetime continuum\b/gi, 'the room like a glowing zipper')
    .replace(/\bpolished obsidian\b/gi, 'jet-black glowing')
    .replace(/\banother dimension\b/gi, 'some spooky other world')
    .replace(/\bcosmic starfield\b/gi, 'bright starry night sky')
    .replace(/\beerie reverse\b/gi, 'creepy backwards whispers')
    .replace(/\bsynchronized rhythm\b/gi, 'slow, creepy unison')
    .replace(/\ban event horizon reflecting distant nebulae\b/gi, 'a swirling starry mirror under their shoes')
    .replace(/\bcomplex microtonal choral harmonies\b/gi, 'a spooky off-key ghost song')
    .replace(/\bpurple night void\b/gi, 'glowing purple sky')
    .replace(/\bunreadable astrological coordinates\b/gi, 'weird secret star symbols')
    .replace(/\bhyper-dense gravitational mercury\b/gi, 'bouncy silver droplets that floated sideways')
    .replace(/\bagainst gravity toward a singular localized point\b/gi, 'straight up into the air all by themselves')
    .replace(/\bfluorescent\b/gi, 'buzzing overhead')
    .replace(/\bkinetic\b/gi, 'wild')
    .replace(/\bresonance\b/gi, 'buzz')
    .replace(/\bdimensional\b/gi, 'spooky')
    .replace(/\bwarp\b/g, 'warped')
    .replace(/\bpeel\b/g, 'peeled')
    .replace(/\bhum\b/g, 'hummed')
    .replace(/\bspews\b/g, 'spewed')
    .replace(/\bunravel\b/g, 'unraveled')
    .replace(/\bemits\b/g, 'let out')
    .replace(/\breveal\b/g, 'opened up to show')
    .replace(/\bslice\b/g, 'sliced')
    .replace(/\bspit\b/g, 'spat')
    .replace(/\bascends\b/g, 'shot up')
    .replace(/\bbroadcast\b/g, 'played back')
    .replace(/\bbegin\b/g, 'began')
    .replace(/\bcreates\b/g, 'turned into')
    .replace(/\brings\b/g, 'rang')
    .replace(/\bclimb\b/g, 'climbed')
    .replace(/\bprint\b/g, 'printed')
    .replace(/\bdrop\b/g, 'dropped')
    .replace(/\bspray\b/g, 'sprayed')
    .replace(/\broll\b/g, 'rolled')
    .trim();
  return /[.!?]$/.test(cleaned) ? cleaned : `${cleaned}.`;
}

function toGoosebumpsTrickName(rawSynergy: string): string {
  return (rawSynergy || 'Rainbow Spark Blast')
    .replace(/\bLife-Steal\b/gi, 'Energy Zap')
    .replace(/\bTime Dilation\b/gi, 'Slow-Motion Freeze')
    .replace(/\bKinetic Overdrive\b/gi, 'Turbo Bounce')
    .replace(/\bKinetic Shockwave\b/gi, 'Mega Boom')
    .replace(/\bPhosphor Glow Blindness\b/gi, 'Super Flash Dazzle')
    .replace(/\bAudio-Pitch Frequency Shatter\b/gi, 'Ear-Popping Mega Screech')
    .replace(/\bInvulnerability Blink\b/gi, 'Ghost-Mode Blink')
    .replace(/\bRetina Burn\b/gi, 'Laser Disco Flash')
    .replace(/\bTachyon Sever\b/gi, 'Zap-Snap')
    .replace(/\bSector Overwrite\b/gi, 'Glitch Scramble')
    .replace(/\bKinetic Entrapment\b/gi, 'Super Sticky Trap')
    .replace(/\bDeath Curse Rebound\b/gi, 'Spooky Boomerang Bounce')
    .replace(/\bDegauss Magnetic Burst\b/gi, 'Giant Rainbow Magnet Pop')
    .replace(/\bSub-Atomic Fissure\b/gi, 'Fizz-Pop Boom')
    .replace(/\bHallucinogenic Haze\b/gi, 'Rainbow Fog Cloud')
    .replace(/\bStatic Discharge Hyper-Armor\b/gi, 'Mega Static Bubble')
    .replace(/\bThermal Ink Heat Bleed\b/gi, 'Sizzling Color Splash')
    .replace(/\bVibration Resonance\b/gi, 'Super Rumble Shake')
    .replace(/\bOptical Camouflage\b/gi, 'Invisible Trick')
    .replace(/\bTracking Glitch Phase Shift\b/gi, 'Fast-Forward Jump')
    .replace(/\bDensity Compression\b/gi, 'Heavy Slammer Bonk')
    .replace(/\bAcidic Pressurization\b/gi, 'Mega Fizzy Splash')
    .replace(/\bElastic Absorption\b/gi, 'Bouncy Slime Catch')
    .replace(/\bTremor Wave\b/gi, 'Bass-Drop Quake')
    .replace(/\bMagnetic Shielding\b/gi, 'Super Bounce Shield')
    .replace(/\bBullet Hell\b/gi, 'Token Hailstorm')
    .replace(/\bAcid Spit Backlash\b/gi, 'Fizz-Splash Boom');
}

function toStoryPlacePhrase(rawLocation: string): string {
  const clean = (rawLocation || 'the old novelty shop').trim();
  if (/^(the|a|an)\s+/i.test(clean)) return clean;
  if (/^(K&B|Chuck's|Suncoast|Rainforest|Scholastic|Discovery|Sizzling|Starlight|24-hour|1-Hour)/i.test(clean)) {
    return clean;
  }
  return `the ${clean.charAt(0).toLowerCase() + clean.slice(1)}`;
}

function toStoryShortPlace(placePhrase: string): string {
  const trimmed = placePhrase
    .replace(/\s+(smelling of|filled with|stacked with|covered in|lined with|draped in|choked with|coated in|surrounded by|illuminated by|dusted with|vibrating at|humming with|where|with|under|during|at \d).*$/i, '')
    .trim();
  return trimmed.length >= 8 ? trimmed : placePhrase;
}

export function splitNamedBadGuy(rawAnomaly: string): {
  shortName: string;
  title: string;
  fullIntro: string;
} {
  const clean = (rawAnomaly || 'Barnaby Wink — The Living Ventriloquist Dummy in a Velvet Suit').trim();
  const sepIdx = clean.indexOf(' — ');
  if (sepIdx > 0) {
    const shortName = clean.slice(0, sepIdx).trim();
    const title = clean.slice(sepIdx + 3).trim();
    const lowerThe = title.startsWith('The ') ? `the ${title.slice(4)}` : title;
    return {
      shortName,
      title,
      fullIntro: `${shortName}, ${lowerThe}`,
    };
  }
  return { shortName: clean, title: clean, fullIntro: clean };
}

export function buildLongForm3ActChronicle(
  encounter: CombatEncounter,
  anomalyOverride?: string,
  variantOffset: number = 0
): ZineActs {
  const rawLocation = encounter.location || 'K&B Novelty Depot clearance aisle at 8:59 PM';
  const locationFull = toStoryPlacePhrase(rawLocation);
  const location = toStoryShortPlace(locationFull);
  const rawAnomaly =
    anomalyOverride ||
    encounter.anomaly_name ||
    encounter.entity_name ||
    'Barnaby Wink — The Living Ventriloquist Dummy in a Velvet Suit';
  const { shortName: anomaly, fullIntro: anomalyIntro } = splitNamedBadGuy(rawAnomaly);
  const weapon = encounter.protagonist_loadout?.improvised_weapon || 'old store flashlight';
  const artifact = encounter.protagonist_loadout?.nostalgia_artifact || 'glowing 90s pocket toy';
  const funTrick = toGoosebumpsTrickName(
    encounter.protagonist_loadout?.weird_synergy_effect || 'Rainbow Spark Pop'
  );
  const funSign = toGoosebumpsWeirdSign(encounter.cosmic_distortion || '');
  const funFeeling = toGoosebumpsFeeling(encounter.status_affliction || '').replace(/\btheir\b/g, 'your');

  const seed =
    hashString(`${encounter.entity_name}|${rawLocation}|${weapon}|${artifact}`) +
    variantOffset * 97;

  const act1Openers = [
    `Everybody in town knew you were NEVER supposed to peek through the windows of ${locationFull} after closing time. The second the last store key turned in the lock, the empty place turned dead silent—except for the creepy buzzing of a half-broken ceiling light. Blink. Buzz. Blink. Inside, the air smelled like stale popcorn, cold plastic, and a thunderstorm that hadn't hit yet.`,
    `At 9:01 PM sharp, ${locationFull} was supposed to be completely empty. Every cash register was shut. Every broom was leaned neatly in the closet. Even the old soda machine in the corner had stopped humming. Outside, streetlights stretched twisted shadows across the waxed floor—and then the front deadbolt slid shut all by itself with a heavy *CLUNK*.`,
    `It started as a totally normal Tuesday night at ${locationFull}... right up until the wall clock ticked straight past midnight and stopped dead. Not a single footstep. Not a single car in the parking lot. Yet down the darkest back aisle, a single neon sign began buzzing louder and louder until it sounded like a swarm of angry bees.`,
    `If you ever press your nose up against the glass at ${locationFull} late at night, do yourself a favor: walk away fast. Because the moment the streetlights flicker on, the temperature inside drops twenty degrees in two seconds flat. Frost creeps along the window corners, and somewhere behind the back curtain, something heavy drags across the floor. *SCRAAAPE.*`,
    `The whole neighborhood swore ${locationFull} came alive after sunset. Most grown-ups laughed it off as a silly kid rumor—nobody ever stayed late enough to check. Tonight, though, a strange purple glow began leaking right out from underneath the back storage door, making every plastic package on the shelves rattle softly on its own.`,
    `Rain tapped against the roof of ${locationFull} like bony fingers asking to be let inside. Inside the locked, empty room, nobody stood behind the counter. Nobody walked the aisles. So why were the ceiling lights blinking on and off in a slow, spooky rhythm—like something hidden in the dark was practicing a secret code?`,
    `First rule of the 1990s: never leave weird retro junk sitting around ${locationFull} past closing time. Tonight, the empty air tasted fizzy—like opening a warm can of lemon-lime soda—and the shiny floor tiles began humming softly right beneath the deserted display racks.`,
    `Long after the last customer went home and the parking lot cleared out, ${locationFull} stayed weirdly wide awake. A cold draft rolled down the empty corridor even though every single window was bolted shut. Somewhere near the back wall, a quiet giggle echoed off the ceiling tiles.`,
  ];

  const act1Middles = [
    `First came the spooky chill—the kind that would give anyone ${funFeeling}. Then the whole empty place started going completely haywire. ${funSign} Sitting all alone on a cluttered counter, the ${artifact} suddenly blinked on by itself and began beeping faster and faster!`,
    `Across the deserted aisles, things got super weird in a hurry. ${funSign} Right beside a forgotten ${weapon} on the back shelf, the ${artifact} started rattling like a trapped beetle. If anyone had been standing inside, they would have felt ${funFeeling}.`,
    `Tick. Tick. *CLICK.* A row of empty display racks swayed backward with zero wind to push them. ${funSign} Over on the front counter, the ${artifact} and the ${weapon} began glowing bright neon orange—as if warning the whole empty room that something big was waking up!`,
    `Without a single human anywhere in sight, the spooky signs spread from wall to wall. ${funSign} The empty air felt heavy enough to trigger ${funFeeling}. Even the forgotten ${artifact} sitting by the register flipped itself right-side-up and gave a frantic *BEEP-BEEP-BEEP!*`,
    `Something was definitely loose inside ${location} tonight. ${funSign} Shelves creaked. Price tags fluttered off their hooks like startled moths. Next to a dusty ${weapon}, the ${artifact} hummed so loudly it danced three inches across the counter all by itself.`,
    `One by one, the empty rows of ${location} began tilting into weird spooky angles. ${funSign} Any passerby peeking through the glass would have felt ${funFeeling}. Down by the back aisle, the lights turned bright electric green—and the shadow on the far wall didn't match a single shelf in the room.`,
    `Weird sparks danced across the empty counters of ${location} like tiny glowing fireflies. ${funSign} Sitting right near the middle aisle, the ${artifact} clicked on with a loud *WHIRRR*, throwing crazy rainbow patterns straight across the ceiling.`,
    `Nobody was inside to hear it, yet the whole empty room groaned like an old haunted house waking up from a hundred-year nap. ${funSign} Up on the top rack, the ${weapon} rattled against the ${artifact} with a sharp *CLANK!*—right before every lamp in ${location} blinked pitch-black.`,
  ];

  const act1Closers = [
    `Pitch dark. Dead quiet. Then—*THUMP. THUMP. THUMP.* Something massive stomped straight out into the center aisle! When the emergency lights blinked back on in spooky red, there it stood—glowing, grinning, and towering almost to the rafters: ${anomalyIntro}! And tonight, ${location} belonged entirely to ${anomaly}.`,
    `*CREEEAK.* The gigantic shadow stretched across the back wall... taller... wider... and then peeled completely off the wall! Out of a swirling cloud of glowing neon fog stepped ${anomalyIntro}, rattling every single shelf in ${location}. No humans. No rules. Showtime!`,
    `A loud *ZAP!* shook the ceiling tiles, and a bright whirlpool of rainbow sparks spun open right in the middle of ${location}. Rising straight out of the glowing mist like a runaway midnight movie monster was ${anomalyIntro}—bright eyes flashing, wild energy crackling, and ready to turn the whole place upside down!`,
    `Right inside the glossy front window glass, a gigantic spooky reflection appeared—even though the aisle looked empty! One second later—*POP!*—${anomalyIntro} stepped right through the shimmer into full view, letting out a wild echoing rattle that shook loose half the ceiling tiles!`,
    `Suddenly, every buzzing sound cut out completely. Total, creepy silence. Then—*BOOM!*—two display racks slid sideways and ${anomalyIntro} burst straight into the open, crackling with wild neon sparks! Whatever had kept ${anomaly} sleeping all day had finally snapped wide open!`,
    `A mischievous echoing laugh bounced off every corner of ${location} at once. Up from the scuffed floor tiles swirled a glittering neon tornado—and out popped ${anomalyIntro}, bigger and wilder than anything in a horror comic! Every arcade screen and store lamp flashed wildly to welcome its new boss.`,
    `Wait a second. That gigantic glowing shape creeping past the front counter wasn't a store display—it was MOVING! Stretching all the way up toward the skylights, ${anomalyIntro} shook off a shower of glowing sparks and grinned wide across empty ${location}.`,
    `One last flicker of the overhead lights, and *FZZZT!*—the air smelled like burnt popcorn and electric sparks. Looming straight out of the darkest corner of ${location} was ${anomalyIntro}, glowing brighter than ten pinball machines on multiball at once!`,
  ];

  const act2Openers = [
    `${anomaly} wasted ZERO seconds! With a bone-rattling creak, the towering monster stalked straight down the dark main aisle of ${location}, dragging a wall of pitch-black shadow behind it as stacks of 90s boxes rattled and crashed off the shelves!`,
    `Every hair-raising sound hit at once! ${anomaly} crept across the back wall like a giant spider, its unblinking glowing eyes locked dead ahead while glass cases cracked with icy frost. *CRACK! SCRAAAPE! THUMP!*`,
    `With a freezing *WHOOSH!*, ${anomaly} sent a shuddering wave of blazing neon shadow rolling right across the waxed floor of ${location}. Stools lifted crookedly into mid-air, old store signs twisted backward, and the towering monster loomed right in the heart of the dark!`,
    `${anomaly} stretched taller and wider until its crooked silhouette scraped the ceiling tiles! Stalking silently down ${location}, the monstrous intruder turned the locked empty building into a pitch-black midnight trap—overhead bulbs blinking red and violet in jagged bursts!`,
    `First a shelf shuddered. Then the whole dark aisle tilted! Looming hunched and unblinking at the center of ${location}, ${anomaly} coiled its eerie energy through every corner until forgotten toys, cassette tapes, and brass coins floated upward in a silent creepy ring!`,
    `Nobody was inside to hear the glass tremble—and ${anomaly} knew it! With a wet, crackling *SCRRRAPE!*, the monster hunched over the deserted front counter, its wide frozen grin reflecting in every dark mirror and buzzing neon tube across ${location}!`,
    `Right down the dead-silent center of ${location}, ${anomaly} grew bigger with every flickering second! Long twisted shadows stretched off the walls like reaching fingers, retro displays snapped on by themselves, and the monster's glowing stare pierced straight through the dark!`,
    `*THOOM!* The whole floor shook under heavy unseen footsteps! ${anomaly} glided from one shadowed end of ${location} to the other, turning the locked building freezing cold as a blazing storm of eerie neon sparks ripped down the empty aisles!`,
  ];

  const act2Middles = [
    `Right in the middle of the creeping chaos, the forgotten ${artifact} and the ${weapon} rattled violently across the counter and slammed together—*CLICK-BZZZT!* Instantly, a blinding surge of ${funTrick} ripped across the dark room straight into ${anomaly}'s towering silhouette!`,
    `Even the old 1990s relics on the shelves couldn't escape the monster's pull! The trembling ${artifact} slid straight into the ${weapon}—*WHIRRR-CRACK!*—unleashing a blistering wave of ${funTrick} that made ${anomaly} snap its head around with blazing unblinking eyes!`,
    `Every plug, dial, and breaker inside ${location} overloaded at the exact same heartbeat! The ${artifact} sparked wildly into the ${weapon}, firing off a scorching shockwave of ${funTrick} that lit up the monster's eerie grin against the dark walls!`,
    `Caught inside ${anomaly}'s freezing midnight draft, the ${artifact} and the ${weapon} clattered together in mid-air—*KA-ZING!* Suddenly, a blinding storm of ${funTrick} tore across ${location}, throwing gigantic distorted monster shadows across the ceiling!`,
    `At the peak of the midnight prowling, ${anomaly} loomed straight over the buzzing ${artifact} and the ${weapon} on the counter. *BEEP-BEEP-ZAP!* Out roared a sizzling super-wave of ${funTrick}, wrapping around the monster like crackling neon chains!`,
    `Higher and darker swelled the monster's shadow—until the overloaded ${artifact} snapped against the ${weapon}! *ZAP-CRACK!* Together they unleashed ${funTrick} in a scorching blaze of light that rattled every locked windowpane in ${location}!`,
    `The whole building groaned like an old attic right before a storm! Whirling through the pitch-black aisles, the ${artifact} and ${weapon} triggered ${funTrick}—lighting up every eerie crease and glowing eye of ${anomaly} in blinding neon flashes!`,
    `Just when ${anomaly} stretched all the way to the dark rafters, every neon sign in ${location} surged alongside the buzzing ${artifact} and ${weapon}. *BOOOOM!* A blazing cyclone of ${funTrick} flooded every shadowed corner from floor to ceiling!`,
  ];

  const act2Closers = [
    `The lights blew out all at once! Caught right inside the blinding storm of ${funTrick}, ${anomaly} let out a low, echoing rattle that shook the front glass, folded backward into its own towering shadow—and vanished straight into the pitch-black floorboards!`,
    `Just as the first cold streak of dawn touched the locked blinds, ${anomaly}'s blazing eyes narrowed into glowing slits. With a creepy drawn-out *HISSSS-CLICK*, the monster peeled straight into the dark wall—and disappeared without leaving a single open door!`,
    `Twisting slowly inside a blinding vortex of ${funTrick}, ${anomaly} stared straight out toward the front window for one bone-chilling second. Then—*SNAP!*—every bulb died, and when the emergency lights clicked back on, the aisle stood empty!`,
    `Wrapped tight in crackling rings of ${funTrick}, ${anomaly} flickered like a haunted channel-3 static screen, leaned eerily close to the storefront glass—and *BLINK!*—dissolved into a freezing burst of glittering dark sparks!`,
    `For two breathless, dead-silent seconds, ${location} burned brighter than midnight lightning. Then—*CRACK!*—every hovering box, coin, and retro prop dropped straight to the floor in the dark, and ${anomaly} sank back into the shadows!`,
    `One last chilling, echoing whisper scraped across the ceiling tiles before ${anomaly} collapsed inward with a hollow *THUMP!* Instantly, the freezing wind died, the rattling shelves went still, and the locked room fell completely silent.`,
    `A blinding flash of violet and crimson tore from wall to wall across ${location}—and then total darkness! When the neon glare faded a heartbeat later, ${anomaly} was nowhere in sight, leaving only frosty hand-like marks fading off the cold glass.`,
    `With a sharp *FZZZT-CRACK!*, ${anomaly}'s towering silhouette splintered into dozens of glowing sparks that darted straight down into the dark floor vents. Every shaking rack froze in place. The creepy hum cut dead.`,
  ];

  const act3Openers = [
    `All at once, ${location} looked completely ordinary again. The regular ceiling lights clicked steadily on, the spooky chill vanished, and the early-morning sunlight began warming the front glass. Outside, a delivery truck rumbled past—totally clueless about the wild monster party that had just rocked the building.`,
    `Silence. Real, normal, totally-not-haunted morning silence! Down the street, sprinklers hissed onto suburban lawns and birds chirped like nothing weird had happened ten feet away. Inside ${location}, every crooked shadow had snapped neatly back into place.`,
    `Just like waking up from a wild dream, the whole room settled back to everyday 1990s normal. The air inside ${location} smelled ordinary again—just floor wax, dusty cardboard, and warm old electronics. Not a single monster in sight!`,
    `Whew—by sunrise, the crazy buzzing was totally gone, the neon signs stopped blinking, and even the soda machine in the corner kicked back on with a cheerful rumble. Nobody opening the shop today would ever guess what went down past midnight.`,
    `One second it looked like a glowing monster funhouse; the next second, ${location} was just a plain, quiet neighborhood hangout again. Cool morning air slipped beneath the doorframe across spotless, peaceful tiles.`,
    `The eerie neon glow faded away until only cozy daylight poured through the storefront windows. Every aisle sat straight. Every counter looked tidy—well, almost.`,
    `All traces of the midnight storm vanished before the first alarm clocks started ringing down the block. Overhead, the regular lights hummed smoothly across quiet ${location}, keeping its big spooky secret locked tight.`,
    `For a whole quiet hour before opening time, nothing moved a muscle inside ${location}. Just dust motes floating lazily in warm sunbeams and the steady tick of an ordinary wall clock.`,
  ];

  const act3Middles = [
    `Over on the counter, the ${artifact} and the ${weapon} sat side by side, still faintly warm and dusted with tiny rainbow sparkles. A couple shiny brass arcade tokens sat nearby—weird little clues from a wild night nobody saw.`,
    `Almost everything in ${location} looked completely untouched—except for a tiny dusting of glowing glitter along the top shelves and two displays sitting just half an inch crooked. Good luck to the morning shift figuring THAT one out!`,
    `The beat-up ${weapon} and the quiet ${artifact} looked like plain old 1990s junk again, though a thin curl of ozone shimmer still hovered above the tabletop where ${anomaly} had peaked.`,
    `Down the center aisle, the floor tiles gleamed spotless—except for one goofy, faintly glowing footprint shape right near the register that faded away the second the sun hit it.`,
    `Every hanging banner hung straight again, and the forgotten ${artifact} sat silent beside the ${weapon}. Still, a couple tiny glowing sparks clung stubbornly to the counter edge like leftover magic.`,
    `Anyone walking past ${location} this morning would think it was the most boring building on the whole block—unless they looked closely at the tiny rainbow prism light dancing off the back counter.`,
    `The shelves stood straight, the glass looked crystal clear, and the ${artifact} wasn't beeping anymore. It was as if ${anomaly} had never even stepped out of the shadows.`,
    `Only three minutes had actually ticked past on the wall clock all night long! Somehow, an entire midnight monster takeover had squeezed itself right between two quiet ticks of the second hand.`,
  ];

  const act3Closers = [
    `Wait a second—what was that shiny rectangle lying right on the cold floor where ${anomaly} had vanished? Resting face-up on the tiles was a brand-new, ice-cold holographic trading card showing ${anomaly} staring straight out of the foil! The locked room stayed dead silent... until the monster's painted eyes slowly blinked—and turned to look right at you.`,
    `Right on the front counter sat something that definitely wasn't there yesterday: a gleaming rainbow foil trading card showing ${anomaly} pressed right up against the inside of the frame! Everything inside ${location} looked completely over—right up until the shiny card tapped once... twice... three times from the INSIDE of the foil.`,
    `Tucked beside a cold brass token near the locked door lay a crisp holographic trading card glowing faintly in the shadows! On the front, ${anomaly} grinned wide from the shiny cardstock. High above the quiet doorway, the switched-off neon sign suddenly flickered blood-red and spelled: DON'T TURN AROUND.`,
    `Right by the entrance sat a freshly minted holographic trading card with ${anomaly} looming inside the foil! The whole empty building stayed silent for five long seconds... and then, wait a second—wasn't ${anomaly} standing FARTHER BACK on that card a minute ago?!`,
    `Sitting neatly in the exact center of the counter was a glowing Series 2 holographic trading card of ${anomaly}! The midnight haunt was over. Totally over. At least... until the room turned ice-cold again and the picture on the card slowly grew empty—because ${anomaly} wasn't inside it anymore.`,
    `Right on the doorstep lay a shimmering rainbow trading card, freezing cold to the touch with ${anomaly} staring out from the foil. Behind it, the empty glass window of ${location} fogged up all by itself from the inside—and two huge unblinking eyes appeared right behind the glass.`,
    `Lying right where the monster had sunk into the dark was a gleaming holographic card, humming quietly on the silent counter. Everything was still inside ${location}—until the shiny foil card slid two inches toward the door all by itself with a chilling *SCRAAAPE*.`,
    `A sudden glint caught the morning sun on the floor of ${location}: a brand-new holographic trading card of ${anomaly}, sparkling with rainbow foil and freezing cold! As the sunlight stretched across the counter, the tiny shadow cast by the card kept growing... taller... and taller... until it covered the whole wall.`,
  ];

  return {
    sceneSetup: [
      pickSeeded(act1Openers, seed, 1),
      pickSeeded(act1Middles, seed, 2),
      pickSeeded(act1Closers, seed, 3),
    ].join('\n\n'),
    intervention: [
      pickSeeded(act2Openers, seed, 4),
      pickSeeded(act2Middles, seed, 5),
      pickSeeded(act2Closers, seed, 6),
    ].join('\n\n'),
    aftermath: [
      pickSeeded(act3Openers, seed, 7),
      pickSeeded(act3Middles, seed, 8),
      pickSeeded(act3Closers, seed, 9),
    ].join('\n\n'),
  };
}

export interface StoryboardHeroLook {
  id: string;
  emoji: string;
  shortLabel: string;
  mode: 'pure-world';
  colorFamily: string;
  fullDescription: string;
  stagingCue: string;
}

// 10 WILDLY DISTINCT BAD-GUY-ONLY SCARY MONSTER VIBES / STAGING MOODS (ZERO HUMAN HEROES!)
export const STORYBOARD_MONSTER_MOODS: StoryboardHeroLook[] = [
  {
    id: 'colossal-giant',
    emoji: '🌋',
    shortLabel: 'Colossal Ceiling-Scraping Titan',
    mode: 'pure-world',
    colorFamily: 'colossal',
    fullDescription:
      'uninhabited pitch-dark 1990s location with no human figures anywhere; the sole star is the looming hunched monster at colossal ceiling-scraping indoor scale, pressing its twisted silhouette against rafters and dwarfing tiny shelves and arcade cabinets below',
    stagingCue: 'oppressive ceiling-scraping monstrous scale looming hunched out of deep shadows over tiny retro fixtures',
  },
  {
    id: 'mischievous-trickster',
    emoji: '👁️',
    shortLabel: 'Uncanny Unblinking Stalker',
    mode: 'pure-world',
    colorFamily: 'trickster',
    fullDescription:
      'uninhabited shadowy 1990s location with no human figures anywhere; the sole star is the deeply uncanny monster creeping uncomfortably close toward the camera with a sharply tilted head, rigid wide fixed grin, and wide unblinking glowing eyes locked straight onto the lens',
    stagingCue: 'creepy head-tilted close-up stalking presence with wide unblinking glowing eyes and rigid eerie grin',
  },
  {
    id: 'shadow-lurker',
    emoji: '🌒',
    shortLabel: 'Pitch-Black Shadow Lurker',
    mode: 'pure-world',
    colorFamily: 'shadow',
    fullDescription:
      'uninhabited pitch-black 1990s location with no human figures anywhere; the sole star is the sinister backlit monster emerging halfway out of impenetrable ink-black shadows with blazing hollow eyes and elongated spindly limbs cutting across blazing colored rim-light',
    stagingCue: 'chilling backlit silhouette creeping half-hidden out of pitch-black shadows with blazing unblinking eyes',
  },
  {
    id: 'neon-disco-overdrive',
    emoji: '🪩',
    shortLabel: 'Hypnotic Strobe Ambush',
    mode: 'pure-world',
    colorFamily: 'disco',
    fullDescription:
      'uninhabited midnight 1990s location with no human figures anywhere; the sole star is the towering monster caught in jarring crimson, ultraviolet, and electric-cyan strobe flashes that cast wild fractured monster shadows across every glossy wall',
    stagingCue: 'jarring high-contrast crimson and ultraviolet strobe bursts illuminating a towering eerie monster silhouette',
  },
  {
    id: 'haunted-frost-fog',
    emoji: '❄️',
    shortLabel: 'Freezing Midnight Frost Fiend',
    mode: 'pure-world',
    colorFamily: 'frost',
    fullDescription:
      'uninhabited freezing midnight 1990s location with no human figures anywhere; the sole star is the chilling monster encrusted in needle-like sapphire ice crystals creeping across cracked dark glass with frigid glowing eyes and stark frozen reflections',
    stagingCue: 'creeping glacial frost cracks, blazing sapphire eyes, and spine-chilling frozen dark glass reflections',
  },
  {
    id: 'poltergeist-vortex',
    emoji: '🌀',
    shortLabel: 'Levitating Poltergeist Storm',
    mode: 'pure-world',
    colorFamily: 'vortex',
    fullDescription:
      'uninhabited midnight 1990s location with no human figures anywhere; the sole star is the monster levitating unnaturally rigid in mid-air at the eye of a roaring gravity-defying cyclone of spinning retro objects, overturned racks, and crackling arcs',
    stagingCue: 'unnatural rigid levitation amid a roaring swirling cyclone of suspended vintage furniture and snapping sparks',
  },
  {
    id: 'scale-growth-surge',
    emoji: '🕷️',
    shortLabel: 'Crawling Ceiling-Climber',
    mode: 'pure-world',
    colorFamily: 'growth',
    fullDescription:
      'uninhabited dark 1990s location with no human figures anywhere; the sole star is the uncanny monster clinging unnaturally upside-down across dark rafters, vents, and ceiling beams with impossibly long spindly limbs reaching straight down toward the floor',
    stagingCue: 'unnatural spider-like ceiling-clinging posture peering straight upside-down from the shadowed rafters',
  },
  {
    id: 'bioluminescent-relic',
    emoji: '✨',
    shortLabel: 'Abyssal Deep-Dark Glow',
    mode: 'pure-world',
    colorFamily: 'bioluminescent',
    fullDescription:
      'uninhabited pitch-black 1990s location with no human figures anywhere; total darkness broken only by the monster’s eerie blazing bioluminescent markings, hollow staring eyes, and hypnotic pulsing light revealing its towering uncanny form',
    stagingCue: 'impenetrable deep-dark abyss lit solely by the monster’s eerie glowing eyes and blazing bioluminescent markings',
  },
  {
    id: 'museum-diorama-spook',
    emoji: '🏛️',
    shortLabel: 'Cracked Display-Case Awakening',
    mode: 'pure-world',
    colorFamily: 'diorama',
    fullDescription:
      'uninhabited locked midnight 1990s location with no human figures anywhere; the sole star is an uncanny exhibit monster twisting its stiff neck and stepping halfway out of a cracked glass spotlight showcase into the dark surrounding hall',
    stagingCue: 'eerie lifeless-statue-come-alive awakening stepping half-out of a cracked velvet spotlight showcase',
  },
  {
    id: 'cartoon-reality-bender',
    emoji: '🌀',
    shortLabel: 'Warped Hallway Illusionist',
    mode: 'pure-world',
    colorFamily: 'surreal',
    fullDescription:
      'uninhabited claustrophobic 1990s corridor with no human figures anywhere; the sole star is the towering monster bending hallway walls, doorways, and checkered floor tiles into dizzying impossible funhouse angles while looming impossibly tall at the far end',
    stagingCue: 'claustrophobic warped hallway perspective stretching toward a looming impossible monster at the vanishing point',
  },
];

// Exported alias for backwards compatibility
export const STORYBOARD_HERO_LOOKS = STORYBOARD_MONSTER_MOODS;

export function buildConsistentHeroVisualLock(_charClean: string): {
  genderNoun: 'female' | 'male';
  pronounSubj: 'she' | 'he';
  pronounPoss: 'her' | 'his';
  shortRole: string;
  lockedSheet: string;
} {
  return {
    genderNoun: 'male',
    pronounSubj: 'he',
    pronounPoss: 'his',
    shortRole: 'Uninhabited 1990s Bad Guy Showcase',
    lockedSheet: STORYBOARD_MONSTER_MOODS[0].fullDescription,
  };
}

const HARMLESS_RETRO_PROP_PATTERN =
  /\b(flashlight|remote|cassette|camera|watch|chronograph|console|handheld|yo-yo|headphones|binder|folder|walkie|lunchbox|phone|boombox|pager|antenna|aerial|clock|8-ball|lantern|prism|compass|scanner|viewer|radio|keytar|visor|mouse|floppy|disk|disc|receipt|card|badge|album|vinyl|sticker|book|putty|lamp|monitor|tv|crt|recorder|player|sequencer|gadget|tuner|beacon)\b/i;

const SHARP_OR_BLUNT_TOOL_PATTERN =
  /\b(shears|scissors|knife|knives|blade|razor|bat|hammer|wrench|crowbar|chain|lock|padlock|poker|mallet|knuckles|gun|pistol|dagger|spike|rebar|shovel|rake|iron|club|hockey|cue|trowel|pipe|stapler|guillotine|flail|whip|stake|axe|scythe|spear|stick|rod|bar|mace|pick|probe|tongs|nozzle|skillet|griddle|plunger|dumbbell|crutch|horseshoe|pencil|straw|spray|aerosol|canister|dart|bow|rope|squeezer|knocker|tripod|spine|handle|ladle|lid|squeegee|pin|fang|claw|stinger|sword|weapon|rusty|broken|sharp|serrated|jagged|heavy steel|forged|metal)\b/i;

function toVisualSafeRetroGadget(rawProp: string, fallbackIndex: number = 0): string {
  const cleaned = sanitizeVisualPromptText(rawProp);
  const safeGadgets = [
    'a glowing translucent cyan 1990s handheld prism scanner',
    'a vintage chrome 1990s pocket frequency tuner with neon dials',
    'a glowing magenta 1990s retro starlight beacon lantern',
    'a retro translucent purple 1990s cosmic wave-compass',
    'a vintage 1990s neon pocket cassette emitter',
    'a shimmering 1990s holographic light-projector gadget',
  ];
  if (!cleaned || SHARP_OR_BLUNT_TOOL_PATTERN.test(cleaned) || !HARMLESS_RETRO_PROP_PATTERN.test(cleaned)) {
    const seed = hashString(cleaned || 'retro-gadget');
    return pickSeeded(safeGadgets, seed, fallbackIndex);
  }
  const lower = cleaned.toLowerCase();
  return /^a[n]?\s+/i.test(lower) ? lower : `a retro ${lower}`;
}

function toVisualSafeLocationDetail(rawLocation: string): string {
  const cleaned = sanitizeVisualPromptText(rawLocation || 'retro 1990s suburban arcade plaza');
  const lowerFirst = cleaned.charAt(0).toLowerCase() + cleaned.slice(1);
  return /^(a|an|the)\s+/i.test(lowerFirst) ? lowerFirst : `a 1990s ${lowerFirst}`;
}

function toVisualSafeCreatureDescription(
  rawAnomaly: string,
  morphologyId: string
): string {
  const cleanedName = sanitizeVisualPromptText(rawAnomaly || 'cosmic crystal guardian');
  const lower = cleanedName.toLowerCase();
  const seed = hashString(lower || 'cosmic-creature');
  const glowPalette = pickSeeded(
    [
      'blazing electric-cyan and scorching hot-magenta neon highlights',
      'hyper-saturated ultraviolet-purple and radiant turquoise prism glow',
      'blazing molten-gold and vivid emerald-teal jewel-toned accents',
      'radiant electric-lime and blazing cherry-crimson glowing contours',
      'intense blazing tangerine-orange and deep electric-cobalt luminous trim',
      'dazzling ruby-crimson, blazing violet, and gleaming liquid-chrome highlights',
    ],
    seed,
    4
  );

  // 14 wildly distinct SCARY creature-feature monster silhouettes (eerie, uncanny, spine-chilling & 100% Flow policy-safe!)
  if (/(flamingo|owl|moth|peacock|crane|raven|dragon|drake|unicorn)/i.test(lower)) {
    return `"${cleanedName}", an eerie towering nocturnal winged monster with massive ragged sweeping wings, hunched shadowy frame, glaring unblinking hypnotic eyes, crooked spindly limbs, rich tactile textures matching its theme, and ${glowPalette}`;
  }
  if (/(octopus|jellyfish|kraken|anglerfish|crab|frog|toad|whale|shark|turtle)/i.test(lower)) {
    return `"${cleanedName}", a spine-chilling towering abyssal deep-sea monster with writhing dark glistening tendrils, dozens of glowing suction rings, wide cavernous glowing lantern-jaws, unblinking abyssal eyes, and ${glowPalette}`;
  }
  if (/(yeti|snow-cone|snowglobe|frost|blizzard|cotton-candy|cloud|fog-machine|djinn|storm-cloud|lightning|stag)/i.test(lower)) {
    return `"${cleanedName}", a towering eerie midnight elemental colossus forged from towering glacial crystal spires, churning dark storm-clouds, hollow blazing eyes peering out of its looming hunched silhouette, and ${glowPalette}`;
  }
  if (/(moss|sprout|flytrap|cactus|geode|gargoyle|concrete|asphalt|scarecrow|jack-o|pretzel)/i.test(lower)) {
    return `"${cleanedName}", a creepy towering gnarled nocturnal monolith woven from writhing creeping vines, cracked weathered gargoyle stone, hollow blazing lantern-eyes, crooked reaching limbs, and ${glowPalette}`;
  }
  if (/(dummy|marionette|puppet|clown|jester|plush|troll|mannequin|sock-monkey|carousel|santa|genie|sphinx|teacup|porcelain)/i.test(lower)) {
    return `"${cleanedName}", a deeply uncanny towering vintage-carnival monster crafted from cracked glossy porcelain, frayed dark velvet, stiff hinged wooden jaw stretched into an eerie fixed grin, hollow unblinking glass eyes staring straight at the viewer, and ${glowPalette}`;
  }
  if (/(origami|paper|book|catalog|ticket|binder|bookmark|halftone|painting|velvet)/i.test(lower)) {
    return `"${cleanedName}", an eerie towering living-paper phantom unfolding from crooked dark origami creases, towering rustling shadowed pages, dozens of staring inked eyes peering from its folds, and ${glowPalette}`;
  }
  if (/(spider|beetle|mantis|centipede|scarab|firefly|bug)/i.test(lower)) {
    return `"${cleanedName}", an unsettling towering chitinous arachnid colossus with clusters of glittering multifaceted glowing eyes, impossibly long spindly articulated metallic legs spanning wall to wall, twitching antennae, and ${glowPalette}`;
  }
  if (/(lava-lamp|wax|slime|ooze|slushie|soda|gum|candy|pizza|popcorn|nacho|gumball|root-beer|soft-serve|gel|gak|syrup|cream|pie)/i.test(lower)) {
    return `"${cleanedName}", a creepy oozing towering molten-wax and dark bubbling-jelly monster dripping thick viscous strands from the ceiling with a wide half-melted uncanny grinning face, glaring suspended glowing eyes, and ${glowPalette}`;
  }
  if (/(ribbon|cord|serpent|boa|slinky|spring-coil|hose|noodle|hydra|tentacle|wire|tape)/i.test(lower)) {
    return `"${cleanedName}", a massive coiling nocturnal serpentine monster woven from writhing tangled dark cables, snapping glowing neon coils, elongated crooked silhouette, piercing unblinking serpentine eyes, and ${glowPalette}`;
  }
  if (/(fox|cat|raccoon|lion|lizard|hound|minotaur|dust bunny|gremlin)/i.test(lower)) {
    return `"${cleanedName}", a lanky hunched nocturnal creature-feature monster with impossibly long spindly arms, bristling shadowed retro fur or scaled hide, wide eerie rigid grin, piercing unblinking glowing eyes staring out of pitch-black darkness, and ${glowPalette}`;
  }
  if (/(mirror|disco-ball|kaleidoscope|chandelier|neon-sign|glass-tube|prism)/i.test(lower)) {
    return `"${cleanedName}", a haunting towering fractured-mirror and buzzing bent-neon entity whose cracked reflective facets multiply dozens of staring unblinking glowing eyes across every wall with ${glowPalette}`;
  }
  if (/(robot|animatronic|automaton|vending|claw|jukebox|rewinder|drone|pinsetter|toaster|dryer|pinball|cuckoo-clock|blender|lawnmower)/i.test(lower) || morphologyId === 'mechanical_automaton') {
    return `"${cleanedName}", an eerie malfunctioning towering 1990s animatronic monster with exposed sparking wires, twitching crooked mechanical jaw, glaring mismatched glowing bulb-eyes, heavy hulking shadowed metal frame looming out of the dark, and ${glowPalette}`;
  }
  if (/(modem|crt|tv|video|floppy|cd|cable|pixel|hologram|phone|stereogram|glitch|microchip|keyboard|console|pet)/i.test(lower) || morphologyId === 'cyber_signal') {
    return `"${cleanedName}", an unsettling towering glitch-signal monster built from flickering stacked vintage television screens displaying huge unblinking staring eyes, writhing cables, crackling static arcs, and ${glowPalette}`;
  }
  if (/(ghost|phantom|poltergeist|specter|revenant|banshee|shadow|wizard|organ pipe|parade)/i.test(lower) || morphologyId === 'spectral_phantom') {
    return `"${cleanedName}", a towering billowing hooded midnight apparition with impossibly tall crooked shadowed silhouette, hollow blazing pinprick eyes peering out of a deep pitch-black cowl, swirling cosmic trails, and ${glowPalette}`;
  }
  if (morphologyId === 'slime_ooze') {
    return `"${cleanedName}", an eerie oozing towering dark translucent jelly-and-crystal monster dripping viscous strands with glaring unblinking eyes suspended inside its bulk and ${glowPalette}`;
  }
  if (morphologyId === 'serpent_constricter') {
    return `"${cleanedName}", a massive coiling nocturnal ribbon-and-cable monster winding ominously across dark walls and ceilings with glaring unblinking eyes and ${glowPalette}`;
  }
  if (morphologyId === 'swarm_cluster') {
    return `"${cleanedName}", a chilling towering hive-swarm of levitating vintage collectibles forming a looming hollow-eyed silhouette with ${glowPalette}`;
  }
  return `"${cleanedName}", an eerie towering 1990s creature-feature monster with lanky hunched shadowed silhouette, wide uncanny rigid grin, unblinking glowing eyes, intricate retro textures, and ${glowPalette}`;
}

export interface StoryboardVisualStyle {
  id: string;
  emoji: string;
  shortLabel: string;
  gridIntro: string;
  medium: string;
  colors: string;
  energyFx: string;
  videoType: string;
}

export const STORYBOARD_VISUAL_STYLES: StoryboardVisualStyle[] = [
  {
    id: '35mm-cinema',
    emoji: '🎬',
    shortLabel: '35mm 90s Live-Action Film',
    gridIntro: 'A photorealistic 16:9 four-panel 2x2 35mm movie film-still contact sheet',
    medium:
      'photorealistic 1990s live-action 35mm anamorphic cinema photography featuring real physical sets, tactile practical puppet and animatronic creature effects, rich theatrical cinema color grading, deep velvety dark shadows, authentic film grain, shallow cinematic depth of field, and zero cartoon or illustration look',
    colors: 'deep velvety midnight shadows, blazing electric neon magenta and emerald signage, radiant molten amber tungsten highlights, and richly saturated cinema color depth',
    energyFx: 'blazing practical optical light rays, vivid prism flare streaks, and intense saturated anamorphic lens flares',
    videoType: 'vibrant live-action 35mm anamorphic 1990s sci-fi movie clip with rich theatrical lighting, deep contrast, and authentic film grain',
  },
  {
    id: 'claymation-miniature',
    emoji: '🧱',
    shortLabel: 'Stop-Motion Claymation',
    gridIntro: 'A tactile 16:9 four-panel 2x2 stop-motion claymation diorama contact sheet',
    medium:
      'handcrafted 1990s stop-motion claymation photography with richly pigmented sculpted modeling-clay figures showing authentic fingerprint textures, intricate colorful handmade miniature cardboard-and-wire sets, bold theatrical miniature LED spotlights, deep shadows, and crisp macro tilt-shift focus',
    colors: 'vivid cherry-crimson clay, blazing electric cobalt, radiant marigold gold, neon emerald plastic, and deep dramatic studio shadows',
    energyFx: 'vivid hand-sculpted glowing neon-resin sparks and blazing practical fiber-optic light trails',
    videoType: 'vibrant handcrafted 12fps stop-motion claymation miniature film clip with richly pigmented handmade set textures',
  },
  {
    id: '90s-flash-photo',
    emoji: '📷',
    shortLabel: '1990s 35mm Flash Photo',
    gridIntro: 'An authentic 16:9 four-panel 2x2 candid 35mm snapshot collage',
    medium:
      'candid 1990s 35mm direct-flash live-action color photography of real physical sets, authentic glossy suburban linoleum and colorful plastic textures, punchy on-camera flash highlights, deep ink-dark background shadows, rich saturated analog color-film dyes, and pure photographic realism (not drawn or animated)',
    colors: 'punchy high-contrast direct-flash highlights, deep pitch-black shadows, blazing electric cyan, hot neon pink, and ultra-saturated primary colors',
    energyFx: 'blazing vivid flash reflections, electric prismatic optical light leaks, and intense glowing color bloom',
    videoType: 'vibrant handheld 1990s live-action documentary film clip with punchy high-contrast lighting and bold analog color',
  },
  {
    id: 'oil-impasto',
    emoji: '🎨',
    shortLabel: 'Heavy Impasto Oil Painting',
    gridIntro: 'A classical 16:9 four-panel 2x2 fine-art oil-on-canvas sequence',
    medium:
      'rich classical impasto oil painting on coarsely woven linen canvas with thick bold sculpted impasto brushstrokes, dramatic gallery chiaroscuro contrast, luminous layered jewel-toned oil glazes, and deeply pigmented painterly realism (no cartoon outlines)',
    colors: 'deep ultramarine cobalt, blazing scarlet vermilion, radiant molten gold, vivid emerald turquoise, and rich velvety dark shadows',
    energyFx: 'blazing thick oil-painted sweeps of radiant golden, hot-magenta, and electric-cyan light',
    videoType: 'vibrant living oil-on-canvas animated painting clip with richly pigmented swirling impasto brushwork in motion',
  },
  {
    id: 'retro-97-cgi',
    emoji: '🕹️',
    shortLabel: '1997 Pre-Rendered 3D CGI',
    gridIntro: 'A hyper-vibrant 16:9 four-panel 2x2 late-1990s pre-rendered 3D CGI showcase',
    medium:
      'authentic 1997 ray-traced 3D computer graphics render with ultra-glossy specular chrome reflections, bold molded early-CGI geometry, blazing jewel-toned glossy plastic shaders, intense volumetric spotlight cones, deep high-contrast shadows, and crisp retro 3D modeling',
    colors: 'mirror chrome silver, blazing electric cobalt, neon hot-magenta, glowing electric-lime, and deep iridescent violet plasma',
    energyFx: 'blazing ray-traced volumetric light beams, vivid glowing 3D geometric prism orbs, and scorching digital lens flares',
    videoType: 'hyper-vibrant 1997 pre-rendered 3D CGI cutscene clip with gleaming ray-traced reflections and bold saturated glow',
  },
  {
    id: 'risograph-zine',
    emoji: '📰',
    shortLabel: 'Neon Risograph Print',
    gridIntro: 'A vibrant 16:9 four-panel 2x2 fluorescent risograph printmaking sheet',
    medium:
      'bold 1990s underground fluorescent risograph ink printmaking featuring heavy high-density halftone dot screens, blazing neon ink overprints, punchy graphic color layering, crisp tactile ink grain, and deep jet-black shadow contrast',
    colors: 'blazing fluorescent hot-pink, electric cobalt-cyan, scorching canary-yellow, vivid emerald-teal, and dense jet-black overprint',
    energyFx: 'bold electric halftone ink starbursts, blazing stippled neon aura rings, and vibrant high-contrast print bursts',
    videoType: 'vibrant animated fluorescent risograph print clip with pulsing high-contrast halftone ink layers',
  },
  {
    id: 'analog-camcorder',
    emoji: '📺',
    shortLabel: '1990s Neon Camcorder',
    gridIntro: 'A vivid 16:9 four-panel 2x2 late-night 1990s camcorder freeze-frame sheet',
    medium:
      'authentic late-night 1990s handheld analog video-tape footage of real physical locations and practical monster effects with bold high-chroma video color saturation, deep glossy midnight shadows, vivid neon color bleed around bright lights, crisp glowing phosphor intensity, and grounded documentary realism',
    colors: 'electric neon cyan, blazing hot-magenta highlight bloom, vivid arcade amber, and deep rich midnight shadows',
    energyFx: 'intense glowing analog light-bleed, dazzling neon phosphor flares, and shimmering electric chroma tracking streaks',
    videoType: 'vibrant late-night 1990s handheld analog camcorder live-action clip with rich neon chroma glow and natural camera motion',
  },
  {
    id: 'watercolor-storybook',
    emoji: '🖌️',
    shortLabel: 'Vivid Jewel Watercolor',
    gridIntro: 'A richly saturated 16:9 four-panel 2x2 liquid-watercolor and ink sequence',
    medium:
      'bold deeply saturated liquid-watercolor and vibrant ink illustration on heavy textured cotton paper featuring intensely pigmented jewel-toned washes, dramatic deep indigo darks, blazing radiant color bleeds, rich splatter highlights, and crisp dark fountain-pen linework',
    colors: 'deep royal cobalt, blazing scarlet-tangerine, radiant hot-magenta, vivid emerald turquoise, and glowing molten gold pigment',
    energyFx: 'blazing jewel-toned liquid-watercolor starbursts of electric turquoise, hot magenta, and molten gold washes',
    videoType: 'vibrant hand-painted liquid-watercolor motion clip with intensely saturated jewel pigments blooming on textured paper',
  },
  {
    id: 'airbrush-paperback',
    emoji: '🌌',
    shortLabel: '90s Sci-Fi Airbrush Cover',
    gridIntro: 'A dramatic 16:9 four-panel 2x2 retro sci-fi airbrush cover-art sequence',
    medium:
      'hyper-detailed 1990s traditional acrylic airbrush cover-art painting on smooth illustration board with blazing ultra-saturated atmospheric gradients, gleaming mirror-chrome specular reflections, crisp painted realism, deep velvety cosmic blacks, and radiant starburst highlights (no flat cartoon lines)',
    colors: 'deep blazing ultraviolet amethyst, mirror liquid-chrome, scorching sunset crimson-orange, hot magenta, and electric starlight cyan',
    energyFx: 'blazing airbrushed neon aurora ribbons, gleaming chrome specular starbursts, and hyper-vivid glowing cosmic sparks',
    videoType: 'hyper-vibrant painted retro sci-fi airbrush motion clip with gleaming chrome light shifts and blazing neon nebula glow',
  },
  {
    id: 'woodblock-linocut',
    emoji: '🪵',
    shortLabel: 'Vivid Color Woodblock',
    gridIntro: 'A striking 16:9 four-panel 2x2 hand-carved color woodblock relief print sheet',
    medium:
      'bold handcrafted multi-color woodblock and linocut relief printmaking featuring crisp deeply carved gouge lines, dramatic pitch-black ink blocks, blazing richly saturated relief-ink colors, and crisp artisanal printmaking contrast',
    colors: 'deep jet-black ink, blazing crimson vermilion, electric turquoise, radiant metallic gold, and deep midnight indigo',
    energyFx: 'blazing hand-carved woodcut sunburst rays and gleaming printed electric-gold and crimson wave patterns',
    videoType: 'bold high-contrast animated color woodblock relief print clip with blazing crimson, turquoise, and gold carved ink patterns',
  },
  {
    id: 'mixed-media-collage',
    emoji: '💎',
    shortLabel: 'Neon Foil Mixed-Media',
    gridIntro: 'A vivid editorial 16:9 four-panel 2x2 surrealist mixed-media foil collage sheet',
    medium:
      'dynamic 1990s editorial mixed-media photomontage blending hyper-saturated glossy full-color 35mm photographs, bold vibrant magazine clippings, blazing iridescent metallic foil cutouts, crisp drop shadows, and expressive pitch-black ink brushwork',
    colors: 'hyper-saturated glossy crimson and cobalt photography electrified by blazing holographic prism foil, hot magenta, electric yellow, and vivid emerald',
    energyFx: 'blazing cut-out holographic metallic foil rays, dazzling prism shards, and vibrant photographic neon light streaks',
    videoType: 'vibrant kinetic stop-motion mixed-media full-color photo and holographic foil collage clip with blazing neon light streaks',
  },
  {
    id: 'indie-graphic-novel',
    emoji: '🖍️',
    shortLabel: '1990s Indie Graphic Novel',
    gridIntro: 'A bold 16:9 four-panel 2x2 1990s indie graphic novel storyboard grid',
    medium:
      'bold hand-inked 1990s underground indie graphic novel artwork with heavy pitch-black brush-ink shadows, expressive dry-brush crosshatching, and hyper-saturated opaque gouache comic coloring',
    colors: 'blazing electric cyan, scorching hot magenta, vivid molten-gold, deep pitch-black inks, and intense neon rim light',
    energyFx: 'crackling hand-inked electric energy arcs and blazing hyper-saturated neon gouache light flares',
    videoType: 'bold high-contrast hand-inked 1990s indie graphic novel animated clip with vivid saturated comic colors and crisp linework',
  },
  {
    id: 'papercut-shadowbox',
    emoji: '✂️',
    shortLabel: 'Jewel Papercut Shadowbox',
    gridIntro: 'A handcrafted 16:9 four-panel 2x2 layered jewel-toned papercut shadowbox diorama sheet',
    medium:
      'handcrafted multi-layered 3D cut-paper shadowbox diorama made from richly colored jewel-toned cardstock layers, dramatic glowing backlit color gels, crisp deep shadow-box depth, and vivid miniature theater-stage lighting',
    colors: 'deep royal indigo cardstock, blazing scarlet red, electric turquoise, glowing marigold gold, and vivid neon-orange backlit highlights',
    energyFx: 'blazing backlit jewel-toned paper-cut sunburst layers and gleaming iridescent prism light beams',
    videoType: 'vibrant tactile stop-motion layered jewel-toned papercut shadowbox theater clip with dramatic glowing depth lighting',
  },
  {
    id: 'faded-70s-instant',
    emoji: '🎞️',
    shortLabel: 'Vibrant 90s Slide-Film Photo',
    gridIntro: 'A hyper-vibrant 16:9 four-panel 2x2 1990s color slide-film photograph contact sheet',
    medium:
      'authentic ultra-saturated 1990s color reversal slide-film analog photography featuring real-world tactile locations and physical sets, crisp bold deep shadows, intensely vivid primary colors, glowing emerald-and-crimson film dyes, rich optical contrast, and pure photographic realism (not illustrated)',
    colors: 'blazing ruby crimson, ultra-deep cobalt blue, radiant electric emerald, vivid golden sunlight, and glossy pitch-black shadows',
    energyFx: 'intense vivid optical rainbow prism flares and blazing saturated analog light streaks',
    videoType: 'ultra-saturated 1990s color slide-film live-action cinema clip with crisp bold contrast and blazing vivid natural colors',
  },
  {
    id: 'stained-glass-mosaic',
    emoji: '🪟',
    shortLabel: 'Illuminated Stained Glass',
    gridIntro: 'A blazing luminous 16:9 four-panel 2x2 handcrafted stained-glass mosaic panel sheet',
    medium:
      'handcrafted leaded stained-glass art panels blazing from behind with intensely saturated cathedral jewel-glass panes, bold jet-black soldered lead outlines, gleaming faceted glass textures, and dazzling prism caustics',
    colors: 'blazing ruby crimson, electric sapphire cobalt, radiant molten amber-gold, hyper-vivid emerald green, and scorching ultraviolet violet',
    energyFx: 'dazzling backlit jewel-glass starbursts and blazing refracted rainbow glass-prism rays',
    videoType: 'blazing luminous animated stained-glass mosaic clip with hyper-vivid jewel colors and dancing sunlit glass caustics',
  },
  {
    id: 'pixel-16bit-diorama',
    emoji: '👾',
    shortLabel: '16-Bit Pixel-Art Diorama',
    gridIntro: 'A crisp hyper-vibrant 16:9 four-panel 2x2 retro 16-bit pixel-art scene showcase',
    medium:
      'crisp handcrafted 1990s 16-bit arcade pixel-art illustration featuring distinct chunky square pixels, hyper-saturated jewel-toned pixel shading, dramatic dark-indigo contrast, carefully hand-pixeled retro architecture, and vibrant arcade-era color craftsmanship',
    colors: 'deep blazing royal indigo, electric arcade cyan, scorching hot magenta, vivid emerald, and bright golden pixel highlights',
    energyFx: 'blazing 16-bit glowing light sprites, electric pixel-wave rings, and dazzling arcade rainbow star flashes',
    videoType: 'hyper-vibrant crisp 16-bit arcade pixel-art animated cutscene clip with parallax scrolling layers and blazing neon pixel sparks',
  },
];

const STORYBOARD_ART_PALETTES = STORYBOARD_VISUAL_STYLES;

interface StoryboardAtmosphere {
  label: string;
  desc: string;
}

const STORYBOARD_ATMOSPHERES: StoryboardAtmosphere[] = [
  {
    label: 'Golden-Hour Molten Sun',
    desc: 'blazing molten-gold and deep crimson late-afternoon sunbeams cutting sharply across glossy retro fixtures and deep dramatic shadows',
  },
  {
    label: 'Vivid Cobalt High Noon',
    desc: 'crisp high-contrast vivid sunlight pouring from a deep electric-cobalt sky onto bold primary-colored vintage surfaces',
  },
  {
    label: 'Electric Arctic Aurora',
    desc: 'deep midnight-sapphire winter snowstorm illuminated by blazing neon-emerald and hot-magenta northern-lights aurora ribbons and vivid amber indoor lamps',
  },
  {
    label: 'Blazing Crimson & Violet Dawn',
    desc: 'dramatic high-contrast blazing scarlet, tangerine, and deep royal-violet sunrise light gleaming brightly off crisp wet streets and glossy glass',
  },
  {
    label: 'Emerald & Violet Storm',
    desc: 'dramatic electric-emerald and deep indigo thunderhead night lit by blazing high-voltage violet lightning flashes',
  },
  {
    label: 'Starry Hyper-Cobalt Midnight',
    desc: 'crisp starry deep-cobalt midnight sky ablaze with vibrant glowing cyan and magenta cosmic aurora ribbons shimmering overhead',
  },
  {
    label: 'Blazing Neon Desert Sunset',
    desc: 'intense blazing crimson-orange, electric magenta, and deep ultraviolet desert sunset casting crisp bold dramatic geometric shadows',
  },
  {
    label: 'Rain-Slicked Electric Neon Night',
    desc: 'glossy rain-drenched midnight air with scorching neon pink, cyan, and gold signage reflecting sharply across wet obsidian pavement and glass',
  },
  {
    label: 'Blazing Scarlet Autumn Dusk',
    desc: 'rich high-contrast autumn twilight ablaze with fiery scarlet maple leaves, deep indigo shadows, and glowing amber-gold interior spotlights',
  },
  {
    label: 'High-Voltage Ultraviolet Blacklight',
    desc: 'scorching electric ultraviolet blacklight glow making fluorescent lime, hot-pink, cyan, and gold trims radiate with blazing neon brilliance against deep black shadows',
  },
];

const STORYBOARD_CAMERA_GRAMMARS: string[] = [
  'symmetrical centered architectural diorama framing with clean vanishing lines',
  'bold dramatic low worm-eye camera angles tilting sharply upward to emphasize scale',
  'intimate candid handheld documentary close-ups and lively over-the-shoulder perspectives',
  'elevated bird-eye and angled overhead diorama viewpoints looking down across the entire scene',
  'steep dynamic diagonal compositions brimming with sweeping motion and depth',
  'expressive backlit chiaroscuro framing seen through glowing doorways, mirrors, and glass partitions',
];

export interface StoryboardArcMeta {
  id: string;
  emoji: string;
  shortLabel: string;
}

export const STORYBOARD_STORY_ARCS: StoryboardArcMeta[] = [
  { id: 'field-guide', emoji: '📖', shortLabel: 'Monster Field-Guide Spread' },
  { id: 'late-night-news', emoji: '📺', shortLabel: 'Late-Night News Sighting' },
  { id: 'secret-lair', emoji: '🏠', shortLabel: 'Secret Lair & Routine' },
  { id: 'cross-town-tour', emoji: '🚗', shortLabel: 'Cross-Town 4-Stop Rampage' },
  { id: 'evolution-stages', emoji: '🥚', shortLabel: 'Tiny-to-Colossal Evolution' },
  { id: 'reflections-only', emoji: '🪞', shortLabel: 'Reflections & Shadows Only' },
  { id: 'toy-commercial', emoji: '📦', shortLabel: '90s Toy-Box & Model Town' },
  { id: 'four-seasons-day', emoji: '🌦️', shortLabel: '4 Seasons / 4 Palettes' },
  { id: 'cutaway-dollhouse', emoji: '🔍', shortLabel: 'Dollhouse Cutaway & Scale' },
  { id: 'found-camera-roll', emoji: '📷', shortLabel: 'Found 35mm Camera Roll' },
  { id: 'midnight-carnival', emoji: '🎪', shortLabel: 'Haunted Midnight Carnival' },
  { id: 'dream-postcards', emoji: '🌌', shortLabel: '4 Surreal Dreamworld Realms' },
];

interface StoryboardPlan {
  paletteIdx: number;
  arcIdx: number;
  atmoIdx: number;
  compIdx: number;
  heroLookIdx: number;
  gif1Idx: number;
  gif2Idx: number;
}

const VARIETY_STORAGE_KEY = '199x_zine_badguy_variety_v5';
const storyboardPlanCache = new Map<string, StoryboardPlan>();

function loadPersistedStoryboardHistory(): StoryboardPlan[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(VARIETY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is StoryboardPlan =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.paletteIdx === 'number' &&
        typeof item.arcIdx === 'number' &&
        typeof item.atmoIdx === 'number' &&
        typeof item.compIdx === 'number' &&
        typeof item.heroLookIdx === 'number'
    );
  } catch {
    return [];
  }
}

const recentStoryboardPlans: StoryboardPlan[] = loadPersistedStoryboardHistory();

function savePersistedStoryboardHistory(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(
      VARIETY_STORAGE_KEY,
      JSON.stringify(recentStoryboardPlans.slice(-14))
    );
  } catch {
    // ignore storage quota errors
  }
}

function pickRandomFreshIndex(length: number, avoid: number[]): number {
  const candidates: number[] = [];
  for (let i = 0; i < length; i++) {
    if (!avoid.includes(i)) candidates.push(i);
  }
  const pool = candidates.length > 0 ? candidates : Array.from({ length }, (_, i) => i);
  return pool[Math.floor(Math.random() * pool.length)];
}

function pickFreshMonsterMoodIndex(recent: StoryboardPlan[]): number {
  const avoidIdx = recent.slice(-8).map((p) => p.heroLookIdx);
  return pickRandomFreshIndex(STORYBOARD_MONSTER_MOODS.length, avoidIdx);
}

function getNonRepeatingStoryboardPlan(signature: string): StoryboardPlan {
  const cached = storyboardPlanCache.get(signature);
  if (cached) return cached;

  const plan: StoryboardPlan = {
    paletteIdx: pickRandomFreshIndex(
      STORYBOARD_ART_PALETTES.length,
      recentStoryboardPlans.slice(-12).map((p) => p.paletteIdx)
    ),
    arcIdx: pickRandomFreshIndex(
      STORYBOARD_STORY_ARCS.length,
      recentStoryboardPlans.slice(-10).map((p) => p.arcIdx)
    ),
    atmoIdx: pickRandomFreshIndex(
      STORYBOARD_ATMOSPHERES.length,
      recentStoryboardPlans.slice(-7).map((p) => p.atmoIdx)
    ),
    compIdx: pickRandomFreshIndex(
      STORYBOARD_CAMERA_GRAMMARS.length,
      recentStoryboardPlans.slice(-4).map((p) => p.compIdx)
    ),
    heroLookIdx: pickFreshMonsterMoodIndex(recentStoryboardPlans),
    gif1Idx: pickRandomFreshIndex(
      8,
      recentStoryboardPlans.slice(-6).map((p) => p.gif1Idx)
    ),
    gif2Idx: pickRandomFreshIndex(
      8,
      recentStoryboardPlans.slice(-6).map((p) => p.gif2Idx)
    ),
  };

  storyboardPlanCache.set(signature, plan);
  if (storyboardPlanCache.size > 60) {
    const firstKey = storyboardPlanCache.keys().next().value;
    if (firstKey) storyboardPlanCache.delete(firstKey);
  }
  recentStoryboardPlans.push(plan);
  if (recentStoryboardPlans.length > 14) recentStoryboardPlans.shift();
  savePersistedStoryboardHistory();
  return plan;
}

export function compile199xZinePrompts(
  encounter: CombatEncounter,
  acts?: ZineActs,
  anomalyOverride?: string,
  visualStyleIdOverride?: string,
  storyArcIdOverride?: string,
  heroLookIdOverride?: string
): ZinePrompts {
  const rawLocation = encounter.location || 'retro suburban mall atrium at twilight';
  const rawAnomaly =
    anomalyOverride ||
    encounter.anomaly_name ||
    encounter.entity_name ||
    'The Giant Lava-Lamp Wax Jellyfish';
  const rawWeapon = encounter.protagonist_loadout?.improvised_weapon || 'retro pocket frequency tuner';
  const rawArtifact = encounter.protagonist_loadout?.nostalgia_artifact || 'retro handheld scanner';
  const synergy = sanitizeVisualPromptText(
    encounter.protagonist_loadout?.weird_synergy_effect || 'rainbow prism burst'
  );

  // Preserve unique sanitized location & creature specifics while ensuring Flow / Nano Banana policy safety
  const locationVisual = toVisualSafeLocationDetail(rawLocation);
  const safeGadget1 = toVisualSafeRetroGadget(rawArtifact, 1);
  const safeGadget2 = toVisualSafeRetroGadget(rawWeapon, 2);
  const location = sanitizeVisualPromptText(rawLocation);
  const anomaly = sanitizeVisualPromptText(rawAnomaly);
  const distortion = sanitizeVisualPromptText(
    (encounter.cosmic_distortion || 'Fluorescent lights hum at dimensional frequencies.')
      .split(/(?<=[.!?])\s+/)[0]
      .trim()
  );

  void acts;

  const { morphology, environment, presets } = getChoreographyPresetsForCard(
    rawAnomaly,
    rawLocation,
    'bad_guy',
    safeGadget2,
    safeGadget1,
    ''
  );
  const leadPreset = presets[0];

  const safeCreature = toVisualSafeCreatureDescription(rawAnomaly, morphology.id);
  const lightingClean = sanitizeVisualPromptText(environment.lightingCue);
  const leadAudioClean = sanitizeVisualPromptText(leadPreset.audio);

  const planSignature = `${rawLocation}|${rawAnomaly}|${rawWeapon}|${rawArtifact}|${encounter.visual_style || ''}|${encounter.card_theme || ''}`;
  const plan = getNonRepeatingStoryboardPlan(planSignature);
  const overrideStyle = visualStyleIdOverride
    ? STORYBOARD_VISUAL_STYLES.find((s) => s.id === visualStyleIdOverride)
    : undefined;
  const palette = overrideStyle || STORYBOARD_ART_PALETTES[plan.paletteIdx % STORYBOARD_ART_PALETTES.length];
  const atmosphereObj = STORYBOARD_ATMOSPHERES[plan.atmoIdx % STORYBOARD_ATMOSPHERES.length];
  const atmosphere = atmosphereObj.desc;
  const cameraGrammar = STORYBOARD_CAMERA_GRAMMARS[plan.compIdx % STORYBOARD_CAMERA_GRAMMARS.length];

  const resolvedArcIdx = storyArcIdOverride
    ? Math.max(0, STORYBOARD_STORY_ARCS.findIndex((a) => a.id === storyArcIdOverride))
    : plan.arcIdx % STORYBOARD_STORY_ARCS.length;
  const activeArcMeta = STORYBOARD_STORY_ARCS[resolvedArcIdx];

  const overrideMood = heroLookIdOverride
    ? STORYBOARD_MONSTER_MOODS.find((h) => h.id === heroLookIdOverride)
    : undefined;
  const monsterMood =
    overrideMood || STORYBOARD_MONSTER_MOODS[plan.heroLookIdx % STORYBOARD_MONSTER_MOODS.length];

  const vibrancyLock =
    'hyper-vibrant deeply saturated colors, rich punchy contrast, deep velvety dark shadows, luminous jewel-toned and electric neon pigment intensity';

  const flowArtStyle = `${palette.medium}, color palette of ${palette.colors}, ${vibrancyLock}, ${cameraGrammar}, borderless edge-to-edge full-bleed visuals, and blank surfaces with no words or lettering`;

  // 12 RE-IMAGINED 4-PANEL ZINE FORMATS — every quadrant uses a COMPLETELY DIFFERENT camera distance, setting, lighting mood & subject!
  interface StoryArcScript {
    labels: [string, string, string, string];
    p1: string;
    p2: string;
    p3: string;
    p4: string;
    videoBeat1: string;
    videoBeat2: string;
    outroBeat1: string;
    outroBeat2: string;
    outroBeat3: string;
  }

  const storyArcScripts: Record<string, StoryArcScript> = {
    'field-guide': {
      labels: [
        '🔬 PANEL 01 // EXTREME MACRO STARE',
        '📖 PANEL 02 // SPECIMEN NIGHT PLATE',
        '🐾 PANEL 03 // EERIE CLUE EVIDENCE',
        '🔭 PANEL 04 // ROOFTOP SILHOUETTE',
      ],
      p1: `Extreme macro close-up filling the entire frame with no room background: unsettling tight study of the monster's wide unblinking glowing eyes, eerie rigid grin, cracked or glistening scales, feathers, wax, or sparking chrome glinting with ${palette.energyFx}.`,
      p2: `Stark midnight archival specimen plate: full-body portrait of the towering hunched monster standing rigid and unblinking against a pitch-black and deep midnight-indigo museum velvet backdrop under dramatic overhead gallery spotlighting (no room, no clutter) exposing every spindly limb and uncanny detail.`,
      p3: `Overhead tabletop evidence photograph: crisp straight-down flat-lay on dark scarred wood showing chilling physical clues left behind—glowing electric-cyan footprints, melted brass arcade tokens, strange dripping wax or dark iridescent scales, and humming ${safeGadget1}.`,
      p4: `Far-away telephoto neighborhood sighting: ominous high-contrast midnight view from across an empty 1990s suburban street lined with parked station wagons and buzzing streetlamps, spotting the monster's gigantic hunched silhouette staring straight down from atop the roof of ${locationVisual}.`,
      videoBeat1: `starting from a chilling extreme macro close-up of the monster's unblinking glowing eye snapping wide open, the camera pulls smoothly backward across a pitch-dark suburban rooftop`,
      videoBeat2: `the towering hunched monster unfurls to full sinister silhouette atop the glowing roof sign amid ${palette.energyFx} staring down over silent neighborhood lights`,
      outroBeat1: `high above the empty street, the looming silhouette twists its head sharply toward the lens before sinking backward into blazing dark clouds`,
      outroBeat2: `down on a rain-slicked wooden park bench below, three gleaming blank rainbow holographic trading cards appear beside glowing unnatural footprints`,
      outroBeat3: `cold starry midnight air hangs silently over the empty street as a distant streetlamp flickers out`,
    },
    'late-night-news': {
      labels: [
        '🚗 PANEL 01 // PARKING LOT HEADLIGHTS',
        '📹 PANEL 02 // CEILING SECURITY-CAM',
        '🪟 PANEL 03 // FACE PRESSED ON GLASS',
        '🚧 PANEL 04 // MORNING-AFTER SHADOW',
      ],
      p1: `Low road-level headlight view: glossy rain-wet empty 1990s parking lot outside ${locationVisual} lit by twin blazing car headlights and scorching electric-cyan and crimson neon reflections—only a massive distorted monster shadow creeps halfway across the storefront glass.`,
      p2: `High ceiling-corner security-camera angle: eerie tilted fish-eye overhead view looking down from a dark corner ceiling mount catching the towering hunched monster frozen mid-stalk, head craned straight up staring directly into the security lens.`,
      p3: `Startling extreme close-up through rainy glass: the monster's giant uncanny wide-grinning face and blazing unblinking eyes pressed right up against a rain-streaked storefront window staring straight into the camera in blinding flashes of ${palette.energyFx}.`,
      p4: `Crisp high-contrast sunlit morning street shot: bold cobalt-blue morning exterior sidewalk outside ${locationVisual} with tipped blazing-orange traffic cones, snapped yellow tape, and a single sparkling rainbow holographic souvenir card casting an impossibly long twisted monster shadow across the concrete.`,
      videoBeat1: `seen through rain-streaked storefront glass in dramatic crimson flashes, the monster slams its eerie wide-grinning face right up against the window making dark reflections shudder`,
      videoBeat2: `the hunched monster glides unnaturally fast down the flickering neon aisles in a blinding storm of ${palette.energyFx} as ceiling lights spark out one by one`,
      outroBeat1: `the stormy midnight glare snaps abruptly into crisp cobalt-blue morning light revealing an eerily silent storefront`,
      outroBeat2: `out on the empty sidewalk beside a tipped orange cone, three gleaming blank rainbow holographic trading cards sit casting a strange long monster shadow`,
      outroBeat3: `an empty sunlit suburban street sits eerily silent as the storefront glass fogs briefly from the inside`,
    },
    'secret-lair': {
      labels: [
        '🏚️ PANEL 01 // SHADOWED ATTIC LAIR',
        '🍿 PANEL 02 // MACRO SPINDLY REACH',
        '🪟 PANEL 03 // STALKING THROUGH BLINDS',
        '🌙 PANEL 04 // WATER-TOWER WATCHER',
      ],
      p1: `Claustrophobic cluttered secret underground lair: hidden crawlspace or shadowed jewel-lit attic nest packed floor-to-ceiling with the monster's stolen 1990s hoard—blazing lava lamps, tangled mounds of cassettes, glowing neon signs, and eerie cracked trophies casting long crooked shadows.`,
      p2: `Unsettling tight macro close-up: just the monster's long spindly articulated appendages, grippers, or writhing tendrils gripping glowing ${safeGadget1} and slowly unwinding shiny cassette ribbons across a dark scarred workbench.`,
      p3: `Chilling rear over-the-shoulder attic window perspective: looking from inside a pitch-dark attic past the monster's hunched glowing silhouette prying apart wooden Venetian blinds to peer silently down onto tiny sleeping suburban houses far below.`,
      p4: `Ominous wide moonlit silhouette: the towering monster crouched atop a giant suburban water tower silhouetted against an enormous blazing molten-crimson harvest moon and deep-indigo clouds ripped by ${palette.energyFx}.`,
      videoBeat1: `inside a shadowed jewel-lit attic hoard blazing with eerie lava lamps and piled cassettes, the monster's long spindly limbs unfold slowly out of the dark`,
      videoBeat2: `bursting silently up through a rattling roof hatch, the hunched monster stalks across moonlit rooftops trailing blazing ribbons of ${palette.energyFx}`,
      outroBeat1: `crouched high atop the town water tower against a blazing red-gold moon, the monster turns its glowing unblinking eyes toward town before dissolving into dark sparks`,
      outroBeat2: `back inside the quiet attic workbench, three gleaming blank rainbow holographic cards rest beside a crimson lava lamp bubbling ominously`,
      outroBeat3: `cold cobalt moonlight pours across the attic floor as the blinds slowly tilt shut on their own`,
    },
    'cross-town-tour': {
      labels: [
        '🏪 PANEL 01 // MIDNIGHT BREAKOUT',
        '🫧 PANEL 02 // CAR-WASH AMBUSH',
        '🏡 PANEL 03 // CUL-DE-SAC STALKER',
        '🎬 PANEL 04 // DRIVE-IN SCREEN GIANT',
      ],
      p1: `Dramatic midnight interior breakout: inside ${locationVisual} under ${atmosphere}, the towering hunched monster looms straight through shattered swinging glass doors in a scorching burst of electric sparks.`,
      p2: `Eerie 24-hour automated car-wash tunnel at midnight: completely different location—the towering monster emerging unblinking straight out from between giant spinning electric-magenta and cyan foam rollers amid blazing crimson wash lights and cascading dark suds.`,
      p3: `Spine-chilling suburban cul-de-sac at midnight: wide outdoor street view—the colossal lanky monster looming silently between tiny darkened two-story houses, leaning over a white picket fence while streetlamps flicker under a deep cobalt sky.`,
      p4: `Ominous starlit outdoor drive-in movie theater: breathtaking wide midnight vista of an empty field of vintage speaker posts as the monstrous giant silhouette looms in front of an enormous blazing drive-in cinema screen under deep starry skies and ${palette.energyFx}.`,
      videoBeat1: `stalking straight out of a blazing crimson-and-cyan car-wash tunnel, the looming monster strides silently across a dark suburban cul-de-sac making streetlamps blink out`,
      videoBeat2: `towering before a colossal blazing outdoor drive-in cinema screen, the monster unleashes a bone-chilling storm of ${palette.energyFx} across the dark indigo sky`,
      outroBeat1: `the blazing drive-in cinema screen flickers wildly as the monster's massive silhouette steps straight into the glaring projector beam and vanishes`,
      outroBeat2: `three gleaming blank rainbow holographic cards settle onto a rusted vintage drive-in speaker post in dark starlit grass`,
      outroBeat3: `eerie midnight silence falls beneath the cobalt sky while the blank cinema screen flickers once with two faint glowing eyes`,
    },
    'evolution-stages': {
      labels: [
        '🥚 PANEL 01 // CRACKED TABLETOP HATCH',
        '🥣 PANEL 02 // COUNTERTOP CREEP',
        '🏢 PANEL 03 // FULL MONSTER AWAKENING',
        '🌆 PANEL 04 // SKYLINE HORIZON TITAN',
      ],
      p1: `Creepy extreme macro tabletop hatching: dimly lit dark-wood table with a single cracked glowing neon soda can or split turquoise retro plastic shell—two intense unblinking crimson-gold eyes staring straight out from inside the dark crack.`,
      p2: `Unsettling countertop growth: taut close-up of a dog-sized gnarled version of the monster hunched amidst overturned retro cereal boxes and scattered cassettes on a stark red-and-black checkered counter, glaring straight at the lens.`,
      p3: `Full room-filling monstrous reveal: dramatic low-angle interior inside ${locationVisual} where the fully grown ceiling-scraping monster hunches forward filling every corner in blazing ${palette.energyFx}.`,
      p4: `Apocalyptic hilltop town-skyline vista: wide cinematic blazing crimson-and-violet dusk view from a dark hilltop overlook looking down at tiny twinkling suburban rooftops as the colossal cloud-high monster looms ominously above the fiery horizon.`,
      videoBeat1: `starting small with glowing eyes peering out of a split retro container on a dark counter, the monster uncoils rapidly and shoots upward into colossal ceiling-scraping scale`,
      videoBeat2: `towering straight past the roofline into scorching crimson-and-violet storm clouds, the colossal monster tears open the horizon with ${palette.energyFx}`,
      outroBeat1: `high above the tiny silent town skyline, the colossal glowing silhouette melts backward into deep-violet storm clouds`,
      outroBeat2: `back on the dark wooden tabletop, three gleaming blank rainbow holographic trading cards sit beside the split retro container`,
      outroBeat3: `crimson dusk rays fade across the empty counter as a tiny scratch echoes inside the dark room`,
    },
    'reflections-only': {
      labels: [
        '🚗 PANEL 01 // REARVIEW MIRROR STARE',
        '🧱 PANEL 02 // 30-FOOT ALLEY SHADOW',
        '💧 PANEL 03 // RAIN-PUDDLE LOOMING',
        '👾 PANEL 04 // FACE-TO-FACE SHOCK',
      ],
      p1: `Chilling station-wagon rearview mirror perspective: atmospheric interior shot of a dark empty 1990s car dashboard glowing with eerie emerald-and-red dials at midnight—inside the small rectangular rearview mirror glass, the monster's glaring unblinking eyes and wide grin press right behind the rear glass.`,
      p2: `Monstrous 30-foot brick-wall shadow: blazing amber streetlamp and electric-cyan alley neon illuminating an empty deep-crimson brick wall—the monster itself is off-screen, yet its towering crooked 30-foot shadow stretches upward across the bricks and fire escape.`,
      p3: `Spine-tingling straight-down rain-puddle reflection: looking directly down at a glossy jet-black rain puddle on wet neon-lit asphalt—looming upside-down inside the rippling water is the giant hunched monster hanging right above the camera.`,
      p4: `Sudden full-color face-to-face shock reveal: breathtaking hyper-vibrant extreme close-up filling the entire frame with the monster lunging forward in hyper-crisp uncanny detail surrounded by blazing ${palette.energyFx}.`,
      videoBeat1: `a glossy jet-black rain puddle on neon asphalt shudders wildly, revealing the monster's towering reflection before the camera tilts sharply upward into the dark alley`,
      videoBeat2: `the monster looms right into frame bathed in blazing swirling ${palette.energyFx} multiplying its staring eyes across every dark windowpane`,
      outroBeat1: `the monster's chilling silhouette folds abruptly into glaring mirror-light that snaps straight upward into the starry midnight sky`,
      outroBeat2: `the rain puddle settles into glassy black stillness beside three gleaming blank rainbow holographic cards on dark wet pavement`,
      outroBeat3: `blazing amber streetlamps buzz down the deserted alley as the puddle ripples one last time`,
    },
    'toy-commercial': {
      labels: [
        '🏪 PANEL 01 // CRACKED DISPLAY DOME',
        '🚂 PANEL 02 // MODEL-TRAIN RAMPAGE',
        '🎒 PANEL 03 // EERIE RELIC FLAT-LAY',
        '⚡ PANEL 04 // LIFE-SIZED BREAKOUT',
      ],
      p1: `Eerie vintage collectible display case: dramatic spotlighted cracked glass dome on a pitch-black velvet shelf showcasing an uncanny palm-sized sculpted figurine version of the monster whose tiny eyes have suddenly snapped open glowing blazing red.`,
      p2: `Unsettling tilt-shift model-train diorama: moody macro photo of a handcrafted miniature wooden model-train town at night with dark emerald pine trees, bright crimson bridges, and tiny streetlamps as the towering monster looms hunched over the derailed miniature train tracks.`,
      p3: `Stark high-contrast relic flat-lay: dramatic overhead studio photo against a deep obsidian and electric-magenta backdrop arranging the monster's eerie retro relics—${safeGadget1}, glowing viscous ooze trails, fractured plastic gears, and tarnished gold tokens.`,
      p4: `Life-sized chilling dramatic breakout: wide cinematic midnight scene inside real ${locationVisual} where the full-sized ceiling-scraping monster has broken completely free amid scorching ${palette.energyFx}.`,
      videoBeat1: `inside a dark model-train tabletop town lit by tiny glowing streetlamps, the miniature monster figurine jerks its head sharply toward the lens and towers over the miniature tracks`,
      videoBeat2: `exploding instantaneously into full ceiling-scraping scale inside ${locationVisual}, the monster unleashes scorching ribbons of ${palette.energyFx}`,
      outroBeat1: `the blazing storm collapses inward as the looming silhouette shrinks into swirling crimson sparks snapping back toward a cracked glass display case`,
      outroBeat2: `three gleaming blank rainbow holographic trading cards land beside the silent model-train station`,
      outroBeat3: `a lone hobby-shop spotlight illuminates the cracked empty glass display dome—the figurine is gone`,
    },
    'four-seasons-day': {
      labels: [
        '🌅 PANEL 01 // SCORCHING DESERT DAWN',
        '🏊 PANEL 02 // MIDNIGHT-SUN POOL STALK',
        '🍁 PANEL 03 // CRIMSON AUTUMN CYCLONE',
        '❄️ PANEL 04 // ARCTIC BLIZZARD FIEND',
      ],
      p1: `Scorching crimson and tangerine desert sunrise: wide empty roadside diner parking lot with blazing red-orange sunbeams stretching enormous pitch-black shadows as the lanky hunched monster rises ominously beside the rusted diner sign.`,
      p2: `Unsettling vivid turquoise swimming pool: stark high-contrast sunlight glinting across intensely saturated electric-cyan water at a completely empty 1990s community pool as the towering monster emerges dripping straight out of the deep end.`,
      p3: `Ominous royal-violet and molten-gold autumn dusk: swirling cyclone of fiery crimson maple leaves tearing down a deserted small-town street past darkened storefronts as the shadowy monster stalks forward through the storm.`,
      p4: `Chilling arctic cobalt snowstorm midnight: deep freezing sapphire-blue blizzard outside ${locationVisual} with whipping frost shards, glistening icicles, and blazing ${palette.energyFx} illuminating the monster's glaring eyes through the snow.`,
      videoBeat1: `rising dripping out of a vivid electric-turquoise pool straight into a raging crimson-and-gold autumn leaf storm, the looming monster tears effortlessly through the seasons`,
      videoBeat2: `freezing sapphire frost explodes outward into a raging midnight snowstorm lit by scorching aurora ribbons of ${palette.energyFx}`,
      outroBeat1: `the raging four-season storm collapses abruptly into a stark deep-cobalt dawn sky streaked with vivid lightning colors`,
      outroBeat2: `three sparkling blank rainbow holographic cards lie frozen on a stone step beside a single blackened crimson leaf and sharp ice crystal`,
      outroBeat3: `crisp eerie morning stillness settles over the deserted block`,
    },
    'cutaway-dollhouse': {
      labels: [
        '🏠 PANEL 01 // DARK DOLLHOUSE CUTAWAY',
        '🌬️ PANEL 02 // INSIDE SILVER AIR-VENT',
        '🐜 PANEL 03 // FLOOR-LEVEL GIANT LOOM',
        '🔮 PANEL 04 // TRAPPED IN SNOWGLOBE',
      ],
      p1: `Eerie architectural dollhouse cutaway: entire dark retro two-story building sliced cleanly open from the front showing four shadowy jewel-lit rooms at once—while the giant hunched monster squeezes crookedly inside one blazing red-lit room, its long limbs reaching toward the room next door.`,
      p2: `Claustrophobic inside-the-air-vent perspective: gleaming metallic chrome tunnel framing looking straight down a cramped heating duct lit by pulsing red-cyan reflections toward the monster's two huge unblinking glowing eyes and uncanny grin creeping right behind the far slotted vent grate.`,
      p3: `Extreme floor-level ant-scale suspense view: camera resting completely flat on stark black-and-white glossy checkerboard tiles looking straight upward past skyscraper-tall table legs and towering undersides of the gigantic hunched monster looming straight down amid ${palette.energyFx}.`,
      p4: `Chilling macro glass snowglobe still-life: sharp high-contrast close-up on a dark wooden shelf showing a vintage glass snowglobe glowing from within—inside, the miniature eerie monster presses both hands flat against the curved glass staring unblinking straight out at the camera.`,
      videoBeat1: `creeping silently down a gleaming silver air-vent tunnel toward two huge blazing eyes, the camera bursts out into a dizzying ant-scale floor view directly beneath the looming monster`,
      videoBeat2: `surrounded by scorching ${palette.energyFx}, the shadowed rooms twist impossibly inward like an eerie folding dollhouse`,
      outroBeat1: `all the blazing neon energy spirals rapidly down into a vintage glass snowglobe rattling on a dark wooden shelf`,
      outroBeat2: `three crisp blank rainbow holographic trading cards fan out beside the glowing snowglobe base`,
      outroBeat3: `vivid iridescent flakes drift inside the glass dome as two tiny glowing eyes snap open against the glass`,
    },
    'found-camera-roll': {
      labels: [
        '👣 PANEL 01 // CROSSWALK FOOTPRINTS',
        '⚡ PANEL 02 // FLASH CAUGHT LUNGING',
        '💫 PANEL 03 // FRANTIC LIGHT-TRAIL BLUR',
        '☕ PANEL 04 // DINER BOOTH RELICS',
      ],
      p1: `Crooked candid street-corner snapshot: unsettling tilted view of a deserted rain-slicked neon suburban crosswalk at midnight where unnatural glowing electric-cyan footprints lead straight across dark pavement into ${locationVisual}.`,
      p2: `Jarring direct-flash ambush close-up: stark sudden burst of harsh frontal camera flash against pitch-black shadows catching the towering wide-eyed monster mid-lunge frozen right in front of the lens surrounded by suspended flying retro debris.`,
      p3: `Frantic long-exposure neon light-trails: hypnotic high-contrast streaks of scorching cyan, hot magenta, and crimson light slashing wildly down a dark glossy retro bowling lane or corridor as the monster blurs straight toward the camera with ${palette.energyFx}.`,
      p4: `Eerie quiet sunlit diner table still-life: crisp morning sunlight across a vivid crimson-and-white checkered booth table showing a tangled cassette tape, scattered tokens, a half-spilled cherry milkshake, and three blank shimmering rainbow holographic foil cards gleaming beside dark unnatural scuff marks.`,
      videoBeat1: `a stark burst of camera flash illuminates the looming monster frozen right in front of the lens before it lunges into slashing long-exposure neon light trails`,
      videoBeat2: `blazing streaks of ${palette.energyFx} whip wildly down the dark glossy corridor against deep ink-black shadows`,
      outroBeat1: `the scorching neon light trails cut abruptly to quiet golden morning sunshine slicing across empty diner blinds`,
      outroBeat2: `three gleaming blank rainbow holographic cards lie silently on a crimson checkered tabletop beside an unspooled vintage cassette`,
      outroBeat3: `sunbeams gleam across the deserted booth as a dark shadow briefly crosses the window outside`,
    },
    'midnight-carnival': {
      labels: [
        '🎡 PANEL 01 // ABANDONED FERRIS WHEEL',
        '🪞 PANEL 02 // FUNHOUSE HALL OF EYES',
        '🚗 PANEL 03 // SPARKING BUMPER ARENA',
        '🎪 PANEL 04 // PRIZE-BOOTH DOLL AWAKES',
      ],
      p1: `Eerie abandoned Ferris wheel at midnight: sweeping low-angle dark vista of a towering vintage neon Ferris wheel blazing with crimson, electric-cyan, and gold bulbs creaking slowly against a deep indigo sky—the hunched monster leans straight out of the top swinging gondola staring downward.`,
      p2: `Dizzying funhouse hall of mirrors: claustrophobic crimson-and-gold striped corridor of curved wavy carnival mirrors multiplying the towering monster into five twisted, elongated, staring reflections leaning out from every glass panel.`,
      p3: `Overhead sparking bumper-car arena: dramatic bird's-eye view looking down onto a gleaming metallic bumper-car floor as empty candy-red, electric-turquoise, and yellow bumper cars collide wildly in showers of scorching sparks and ${palette.energyFx} beneath the towering monster.`,
      p4: `Chilling sunrise midway prize booth: bold crimson-and-gold dawn light falling across an empty red-and-white striped carnival booth stacked with silent plush prizes—on the top shelf beside three gleaming foil cards sits a miniature uncanny version of the monster whose glaring eyes have snapped wide open.`,
      videoBeat1: `high atop a creaking neon carnival Ferris wheel blazing in the dark, the looming monster drops straight down into a sparking deserted bumper-car arena`,
      videoBeat2: `driverless candy-red and turquoise bumper cars whip in a chaotic cyclone of blazing sparks and ${palette.energyFx} across the dark midway`,
      outroBeat1: `the carnival bulbs pop off one by one as stark crimson-and-gold morning light cuts across the silent midway`,
      outroBeat2: `on the top shelf of a striped prize booth, three blank shimmering rainbow holographic trading cards sit beside a small uncanny keepsake figure`,
      outroBeat3: `morning wind rattles the striped carnival pennants as the tiny figure's glowing eyes blink once`,
    },
    'dream-postcards': {
      labels: [
        '🏁 PANEL 01 // DARK CHECKERED DESERT',
        '☁️ PANEL 02 // STATIC SKY-TV ABYSS',
        '🐠 PANEL 03 // ABYSSAL ARCADE REEF',
        '💎 PANEL 04 // CRYSTAL MIRROR CAVERN',
      ],
      p1: `Ominous hyper-vibrant checkerboard desert valley: eerie surreal 1990s dream horizon of blazing dark-violet sand dunes, glossy obsidian-and-emerald checkerboard mesas, and two giant eclipsing cobalt-and-crimson ringed moons where the colossal monster towers over the wasteland.`,
      p2: `Haunting floating cloud-island abyss: breathtaking dark twilight sky of towering storm-lit cloud islands studded with flickering mossy vintage CRT televisions pouring glowing waterfalls of static starlight as the shadowy monster looms across the sky.`,
      p3: `Submerged abyssal neon coral arcade: deep dark-cobalt and blazing electric-turquoise underwater reef packed with barnacle-encrusted glowing arcade cabinets, glowing translucent neon jellyfish, and the massive looming monster gliding silently out of the deep trench.`,
      p4: `Symmetrical kaleidoscope crystal cavern: vast cathedral-like dark cavern of towering faceted deep-amethyst, blazing emerald, crimson, and molten-gold quartz crystals fracturing the monster's staring eyes into endless blazing reflections of ${palette.energyFx}.`,
      videoBeat1: `looming across storm-lit floating television islands before plunging straight into a deep glowing turquoise underwater arcade trench`,
      videoBeat2: `the monster glides through a vast crystal cavern shattering its unblinking silhouette into dozens of blazing prism beams of ${palette.energyFx}`,
      outroBeat1: `the gleaming dreamworld facets snap sharply inward like a closing kaleidoscope into one blazing molten-crimson star`,
      outroBeat2: `three gleaming blank rainbow holographic trading cards settle onto a dark glowing amethyst ledge`,
      outroBeat3: `vivid jewel-toned ripples freeze silently across the deep royal-violet starry horizon`,
    },
  };

  const arc = storyArcScripts[activeArcMeta.id] || storyArcScripts['field-guide'];

  // 8 DISTINCT CUTAWAY GIF #1 & #2 SCENES
  const gif1Cutaways = [
    `a glowing vintage 1990s CRT monitor beside ${safeGadget1} on a dark counter as electric-cyan and magenta radar waveforms ripple across the glass screen and ${palette.energyFx} shimmer along the chrome edges`,
    `an extreme macro view of ${safeGadget1}'s jewel-toned translucent plastic casing and glowing neon analog indicator dials pulsing in vivid rhythm while colorful reflections sweep across the glossy counter`,
    `a row of blazing vintage 1990s neon wall lamps and brightly colored hanging plastic tags inside ${locationVisual} swaying and shimmering in slow-motion anti-gravity ripples`,
    `a glossy jet-black puddle or waxed floor reflection inside ${locationVisual} rippling outward in concentric blazing neon rings beneath vivid flickering retro fixtures`,
    `a row of vintage analog gauges, colorful cassette reels, and bright ruby-and-emerald indicator bulbs inside ${locationVisual} spinning rapidly and glowing in hypnotic alternating rhythms`,
    `a gleaming chrome skylight ceiling fan inside ${locationVisual} spinning backward against a deep indigo skylight as blazing iridescent prism sparks drift upward past vivid retro banners`,
    `a row of backlit vending-machine glass buttons and glowing coin slots inside ${locationVisual} flashing in vibrant musical wave patterns with blazing ${palette.energyFx}`,
    `a spinning jewel-colored translucent vinyl record or glowing cassette deck reel on a countertop inside ${locationVisual} radiating concentric blazing rings of ${palette.energyFx}`,
  ];

  const gif2Cutaways = [
    `looking straight up at the glowing ceiling lights of ${locationVisual} as a blazing royal-violet skylight portal closes overhead, drifting vivid sparkling stardust downward against deep shadows`,
    `a crisp close-up of three gleaming blank rainbow holographic trading cards flashing vividly in a radiant halo of jewel-toned light atop a dark glossy retro counter`,
    `an atmospheric low pan across glittering jewel-toned stardust and vivid ribbons of molten-amber and electric-cyan light swirling past retro fixtures inside ${locationVisual}`,
    `a crisp window view looking out from ${locationVisual} as blazing emerald and hot-magenta cosmic aurora ribbons glide across a deep cobalt starry sky`,
    `a blazing outdoor neon sign humming vividly outside ${locationVisual} as rich electric colors reflect sharply across rain-slicked obsidian pavement`,
    `a vintage analog desk clock inside ${locationVisual} ticking crisply forward again as gleaming sapphire frost crystals and golden sparkles shimmer across its chrome rim`,
    `a row of jewel-toned glass marbles and gleaming gold arcade tokens rolling across high-contrast glossy checkerboard tiles inside ${locationVisual}`,
    `a rich high-contrast tabletop still-life of a glowing glass snowglobe and three blank shimmering rainbow foil cards gleaming vividly by a bright window`,
  ];

  const castHeaderLine = `Monster staging: ${monsterMood.fullDescription}, emphasizing ${monsterMood.stagingCue}.`;
  const freshStoryLead = `Brand-new standalone spine-chilling 1990s midnight creature-feature monster showcase featuring an uninhabited dark location with no human characters anywhere, an eerie uncanny all-new monster design with unblinking glowing eyes and ominous presence, and an all-new artistic medium completely unrelated to any earlier images.`;

  // 1-4 Individual Shot Prompts (100% Bad-Guy-Only, synced to Visual Medium, Story Arc & Monster Vibe!)
  const shot01WideArchitecture = sanitizeVisualPromptText(
    `${freshStoryLead} A 16:9 widescreen scene rendered in ${flowArtStyle}. ${castHeaderLine} Featured monster: ${safeCreature}. ${arc.p1}`
  );
  const shot02AnomalyPortrait = sanitizeVisualPromptText(
    `A 16:9 widescreen scene rendered in ${flowArtStyle}. ${castHeaderLine} Featured monster: ${safeCreature}. ${arc.p2}`
  );
  const shot03LowAngleAction = sanitizeVisualPromptText(
    `A 16:9 widescreen action frame rendered in ${flowArtStyle}. ${castHeaderLine} Featured monster: ${safeCreature}. ${arc.p3}`
  );
  const shot04TabletopGearFlatlay = sanitizeVisualPromptText(
    `A 16:9 widescreen closing frame rendered in ${flowArtStyle}. Uninhabited 1990s closing scene with no human figures anywhere. ${arc.p4}`
  );

  // 5-6 Standalone GIF Prompts
  const gif01Act1TensionLoop = sanitizeVisualPromptText(
    `A 4-second seamless 16:9 looping ${palette.videoType} at 24fps in ${flowArtStyle} with no human figures. Close-up cutaway scene: ${gif1Cutaways[plan.gif1Idx % gif1Cutaways.length]} in a smooth continuous loop.`
  );
  const gif02Act3AftermathLoop = sanitizeVisualPromptText(
    `A 4-second seamless 16:9 looping ${palette.videoType} at 24fps in ${flowArtStyle} with no human figures. Atmospheric closing cutaway: ${gif2Cutaways[plan.gif2Idx % gif2Cutaways.length]} in a calm continuous loop.`
  );

  // 7. Lead 16:9 Monster Cinema Video Prompt
  const leadVideo16x9 = sanitizeVisualPromptText(
    `A 4-second 16:9 ${palette.videoType} at 24fps in ${flowArtStyle}. Inside empty ${locationVisual} under ${lightingClean} with no human figures anywhere, showcasing ${safeCreature} (${monsterMood.stagingCue}): ${arc.videoBeat1}; then ${arc.videoBeat2} as the scene hits a dramatic grounded finish. Audio: ${leadAudioClean}`
  );

  // 8. Story-Synced 3-Act Synth Soundtrack Prompt
  const synthSongPrompt = sanitizeVisualPromptText(
    `1990s suburban spooky monster story soundtrack (118 BPM, 45-60s instrumental) structured to follow the 3-Act Zine story in "${location}": [0:00-0:15 Act I After Closing] mysterious analog cassette synth drone, buzzing fluorescent hum, and creeping bass pulse; [0:15-0:42 Act II Monster Mayhem] punchy FM synthwave bassline, gated 16-bit snare drums, and electric guitar power chords erupting for "${synergy}"; [0:42-0:60 Act III Twist Ending] warm, nostalgic midnight synth pads and shimmering bell arpeggios fading into spooky quiet resolution. Strictly instrumental, no vocals.`
  );

  // 9. External 3-Act Long-Form Story Prompt (100% Bad-Guy-Only 1990s Goosebumps paperback style!)
  const storyGeneratorPrompt = `Write a genuinely creepy, spine-tingling, fast-paced 1990s Goosebumps-style MONSTER-ONLY paperback story (~750 words total) broken into 3 Acts with EXACTLY 3 punchy paragraphs per Act (labeled "ACT 01", "ACT 02", and "ACT 03"):
- Star Bad Guy Monster: ${anomaly} (100% Bad Guy focus — DO NOT include any human hero or Good Guy vs. Bad Guy battle!)
- Spooky After-Hours Setting: ${location}
- Haunted 90s Relics Sitting in the Shop: ${rawArtifact} & ${rawWeapon} (Wild Burst: ${synergy})
- Weird Spooky Sign: ${distortion}
STYLE RULES: Keep the vocabulary super fun, simple, and easy to read (like the creepiest classic 1990s spooky paperback — NO heavy technical jargon, NO big textbook sci-fi words, and NO human hero!). Make the monster truly eerie and scary after closing time when nobody is around! Use short suspenseful sentences, chilling sound effects, flickering shadows, unblinking glowing eyes, a scary cliffhanger when the monster wakes up in Act 01, eerie midnight stalking and overload mayhem in Act 02, and a classic spine-chilling Goosebumps twist ending in Act 03 where a freezing holographic trading card left behind does something creepy!`;

  // 0A. MASTER 1-PROMPT 2x2 SEQUENTIAL SHEET (16 Visual Mediums x 12 Wildly Different 4-Panel Formats x 10 Monster Vibes!)
  const masterStoryboard2x2Prompt = sanitizeVisualPromptText(
`${freshStoryLead} Each of the four panels shows a completely different camera distance, framing, lighting temperature, and environment so no two quadrants ever repeat the same room or angle.

${palette.gridIntro}, created strictly in ${flowArtStyle}, divided cleanly into two equal columns and two equal rows.

Featured monster: ${safeCreature}. ${castHeaderLine}

Top-left panel: ${arc.p1}
Top-right panel: ${arc.p2}
Bottom-left panel: ${arc.p3}
Bottom-right panel: ${arc.p4}`
  );

  // 0A-SAFE. ULTRA-SAFE MINIMAL BACKUP (keeps chosen visual medium, monster vibe, zero humans & distinct format!)
  const backupArcMeta = STORYBOARD_STORY_ARCS[(resolvedArcIdx + 3) % STORYBOARD_STORY_ARCS.length];
  const backupArc = storyArcScripts[backupArcMeta.id] || arc;
  const masterStoryboardUltraSafePrompt = sanitizeVisualPromptText(
`${freshStoryLead} Each of the four panels shows a completely different camera distance, framing, and environment.

${palette.gridIntro}, created strictly in ${flowArtStyle}.

${castHeaderLine} Eerie towering retro creature: a mysterious hunched luminous crystal-and-shadow midnight entity with huge unblinking glowing eyes looming out of swirling starlight.

Top-left panel: ${backupArc.p1.replaceAll(locationVisual, 'a vibrant darkened 1990s retro neon plaza')}
Top-right panel: ${backupArc.p2.replaceAll(locationVisual, 'the shadowy uninhabited retro hall')}
Bottom-left panel: ${backupArc.p3.replaceAll(locationVisual, 'the glowing uninhabited retro hall')}
Bottom-right panel: ${backupArc.p4.replaceAll(locationVisual, 'the eerie quiet uninhabited retro plaza')}`
  );

  // 0B. SAME-CHAT GIF #1 FOLLOW-UP (MATCHES EXACT VISUAL MEDIUM!)
  const sameChatGif1FollowupPrompt = sanitizeVisualPromptText(
    `In the exact same ${palette.medium}, ${palette.colors}, and hyper-vibrant deeply saturated high-contrast look as the four-panel image above (with no human figures anywhere), create a 4-second seamless 16:9 looping ${palette.videoType} showing a brand-new eerie close-up cutaway scene: ${gif1Cutaways[plan.gif1Idx % gif1Cutaways.length]} in a smooth continuous loop.`
  );

  // 0C. SAME-CHAT GIF #2 FOLLOW-UP (MATCHES EXACT VISUAL MEDIUM!)
  const sameChatGif2FollowupPrompt = sanitizeVisualPromptText(
    `In the exact same ${palette.medium}, ${palette.colors}, and hyper-vibrant deeply saturated high-contrast look as the four-panel image above (with no human figures anywhere), create a 4-second seamless 16:9 looping ${palette.videoType} showing a brand-new atmospheric cutaway scene: ${gif2Cutaways[plan.gif2Idx % gif2Cutaways.length]} in a calm continuous loop.`
  );

  // 0D. SAME-CHAT LEAD VIDEO #1 (8-SECOND ACT II MONSTER MAYHEM MATCHING THIS EXACT FORMAT, VIBE & VISUAL MEDIUM!)
  const sameChatVideoFollowupPrompt = sanitizeVisualPromptText(
    `In the exact same ${palette.medium}, ${palette.colors} lighting, hyper-vibrant saturated colors, rich deep contrast, and eerie monster design from the four-panel sheet above (with no human characters anywhere, keeping ${monsterMood.stagingCue}), create an 8-second 16:9 ${palette.videoType} with no dialogue. First three seconds: ${arc.videoBeat1}. Middle three seconds: ${arc.videoBeat2}. Final two seconds: the towering monster freezes staring straight into the lens in a chilling grounded finish. Audio: tense 1990s dark synthwave swells, eerie metallic creaks, crackling energy arcs, and deep midnight hum.`
  );

  // 0E. SAME-CHAT FINALE VIDEO #2 (8-SECOND ACT III ENDING MATCHING THIS EXACT FORMAT & VISUAL MEDIUM!)
  const sameChatOutroVideoPrompt = sanitizeVisualPromptText(
    `In the exact same ${palette.medium}, ${palette.colors} lighting, hyper-vibrant saturated colors, and rich deep contrast from the four-panel sheet above (with no human characters anywhere), create an 8-second 16:9 closing finale ${palette.videoType} with no dialogue. First three seconds: ${arc.outroBeat1}. Middle three seconds: ${arc.outroBeat2}. Final two seconds: ${arc.outroBeat3}. Audio: eerie crystalline chimes, low suspenseful synth drone, and a subtle spine-tingling final echo fading out.`
  );

  return {
    resolvedVisualStyleId: palette.id,
    resolvedVisualStyleLabel: `${palette.emoji} ${palette.shortLabel}`,
    resolvedStoryArcId: activeArcMeta.id,
    resolvedStoryArcLabel: `${activeArcMeta.emoji} ${activeArcMeta.shortLabel}`,
    resolvedHeroLookId: monsterMood.id,
    resolvedHeroLookLabel: `${monsterMood.emoji} ${monsterMood.shortLabel}`,
    resolvedAtmosphereLabel: atmosphereObj.label,
    panelLabels: arc.labels,
    masterStoryboard2x2Prompt,
    masterStoryboardUltraSafePrompt,
    sameChatGif1FollowupPrompt,
    sameChatGif2FollowupPrompt,
    sameChatVideoFollowupPrompt,
    sameChatOutroVideoPrompt,
    leadVideo16x9,
    shot01WideArchitecture,
    shot02AnomalyPortrait,
    shot03LowAngleAction,
    shot04TabletopGearFlatlay,
    gif01Act1TensionLoop,
    gif02Act3AftermathLoop,
    synthSongPrompt,
    storyGeneratorPrompt,
  };
}

export function buildZineIssueFromEncounter(
  encounter: CombatEncounter,
  issueNumber: number = 1,
  existingMedia?: Partial<
    Pick<
      ZineIssueData,
      | 'videoUrl'
      | 'outroVideoUrl'
      | 'galleryUrls'
      | 'gifUrl'
      | 'gifUrl2'
      | 'audioUrl'
      | 'audioTitle'
      | 'cardImageUrl'
      | 'cardVideoUrl'
      | 'acts'
    >
  > & {
    visualStyleIdOverride?: string;
    storyArcIdOverride?: string;
    heroLookIdOverride?: string;
  }
): ZineIssueData {
  const loc = encounter.location || 'K&B Novelty Depot clearance aisle at 8:59 PM';
  const anomalyName =
    encounter.anomaly_name ||
    encounter.entity_name ||
    'The Giant Lava-Lamp Wax Jellyfish';
  const weapon =
    encounter.protagonist_loadout?.improvised_weapon || 'Retro Store Flashlight';
  const artifact =
    encounter.protagonist_loadout?.nostalgia_artifact || '199X Pocket Relic';
  const synergy =
    encounter.protagonist_loadout?.weird_synergy_effect || 'Rainbow Spark Pop';

  const { morphology, environment, presets } = getChoreographyPresetsForCard(
    anomalyName,
    loc,
    'bad_guy',
    weapon,
    artifact,
    ''
  );

  const seedNum = hashString(`${anomalyName}|${loc}|${issueNumber}`);
  const hexSeed = `0x9X_${seedNum.toString(16).toUpperCase().slice(0, 6)}`;
  const pal = getZinePalette(encounter.card_theme);

  const acts = existingMedia?.acts || buildLongForm3ActChronicle(encounter, anomalyName);
  const prompts = compile199xZinePrompts(
    encounter,
    acts,
    anomalyName,
    existingMedia?.visualStyleIdOverride,
    existingMedia?.storyArcIdOverride,
    existingMedia?.heroLookIdOverride
  );

  return {
    id: `zine-${seedNum}-${issueNumber}`,
    issueNumber: encounter.card_number || issueNumber,
    hexSeed,
    title: anomalyName,
    classification: encounter.critical_smash
      ? 'OMEGA BAD GUY SPECIAL'
      : '199X BAD GUY EDITION',
    sectorTag: encounter.theme_set_badge || environment.badge.toUpperCase(),
    actPhase: `${morphology.badge} • ${encounter.status_affliction || 'AFTER HOURS'}`,
    location: loc,
    anomalyName,
    characterName: anomalyName,
    characterFull: anomalyName,
    weapon,
    artifact,
    synergy,
    lightingMood: environment.lightingCue,
    cameraAngle: presets[0]?.camera || 'Dynamic Low-Angle 24fps Tracking Shot',
    witnessPerspective: 'After-Hours Empty Sighting',
    artStyle:
      encounter.visual_style ||
      '1990s indie graphic novel ink-and-watercolor illustration',
    zinePaletteId: pal.finishId,
    encounter,
    acts,
    prompts,
    videoUrl: existingMedia?.videoUrl,
    outroVideoUrl: existingMedia?.outroVideoUrl,
    galleryUrls: existingMedia?.galleryUrls || [undefined, undefined, undefined, undefined],
    gifUrl: existingMedia?.gifUrl,
    gifUrl2: existingMedia?.gifUrl2,
    audioUrl: existingMedia?.audioUrl,
    audioTitle:
      existingMedia?.audioTitle ||
      `199X ${encounter.theme_set_badge || 'Suburban'} Synthwave Tape`,
    cardImageUrl: existingMedia?.cardImageUrl,
    cardVideoUrl: existingMedia?.cardVideoUrl,
  };
}

/**
 * Parses a pasted 3-Act story text into sceneSetup, intervention, and aftermath.
 */
export function parsePasted3ActStory(rawText: string): ZineActs | null {
  const cleaned = rawText.trim();
  if (!cleaned || cleaned.length < 60) return null;

  // Try splitting by ACT 01 / ACT 1 / <scene_setup> markers first
  const act2Match = cleaned.match(
    /(?:^|\n)\s*(?:#+\s*)?(?:\*\*)?(?:ACT\s*0?2|ACT\s+II|<intervention>)(?:[^\n]*)\n/i
  );
  const act3Match = cleaned.match(
    /(?:^|\n)\s*(?:#+\s*)?(?:\*\*)?(?:ACT\s*0?3|ACT\s+III|<aftermath>)(?:[^\n]*)\n/i
  );

  if (act2Match?.index !== undefined && act3Match?.index !== undefined && act3Match.index > act2Match.index) {
    const rawAct1 = cleaned
      .slice(0, act2Match.index)
      .replace(/^\s*(?:#+\s*)?(?:\*\*)?(?:ACT\s*0?1|ACT\s+I|<scene_setup>)(?:[^\n]*)\n/i, '')
      .trim();
    const rawAct2 = cleaned
      .slice(act2Match.index + act2Match[0].length, act3Match.index)
      .trim();
    const rawAct3 = cleaned
      .slice(act3Match.index + act3Match[0].length)
      .trim();
    if (rawAct1 && rawAct2 && rawAct3) {
      return {
        sceneSetup: rawAct1,
        intervention: rawAct2,
        aftermath: rawAct3,
      };
    }
  }

  // Fallback: split paragraphs evenly across 3 acts
  const paragraphs = cleaned
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length >= 3) {
    const third = Math.ceil(paragraphs.length / 3);
    return {
      sceneSetup: paragraphs.slice(0, third).join('\n\n'),
      intervention: paragraphs.slice(third, third * 2).join('\n\n'),
      aftermath: paragraphs.slice(third * 2).join('\n\n'),
    };
  }

  return {
    sceneSetup: cleaned,
    intervention: cleaned,
    aftermath: cleaned,
  };
}
