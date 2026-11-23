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

function toStoryHeroShortName(charShort: string): string {
  const clean = (charShort || 'Sam').trim();
  if (/^(The|Coach|Officer|Professor|Dr\.|Sgt\.|Detective|Big)\b/i.test(clean)) {
    const words = clean.replace(/'[^']+'/g, '').replace(/\s+/g, ' ').trim().split(' ');
    return words.slice(0, 2).join(' ') || clean;
  }
  const first = clean.split(/[\s']+/)[0];
  return first || clean;
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

export function buildLongForm3ActChronicle(
  encounter: CombatEncounter,
  anomalyOverride?: string,
  variantOffset: number = 0
): ZineActs {
  const rawLocation = encounter.location || 'K&B Novelty Depot clearance aisle at 8:59 PM';
  const locationFull = toStoryPlacePhrase(rawLocation);
  const location = toStoryShortPlace(locationFull);
  const charFull = encounter.featured_character || "Dex 'Neon-Drift' Kowalski";
  const charIntro = charFull.split('(')[0].trim() || 'Sam';
  const charShort = toStoryHeroShortName(charIntro);
  const anomaly =
    anomalyOverride ||
    encounter.anomaly_name ||
    (encounter.card_type === 'bad_guy'
      ? encounter.entity_name
      : 'The Neon Shadow Monster');
  const weapon = encounter.protagonist_loadout?.improvised_weapon || 'duct-taped flashlight';
  const artifact = encounter.protagonist_loadout?.nostalgia_artifact || 'glowing 90s pocket toy';
  const funTrick = toGoosebumpsTrickName(
    encounter.protagonist_loadout?.weird_synergy_effect || 'Rainbow Spark Pop'
  );
  const funSign = toGoosebumpsWeirdSign(encounter.cosmic_distortion || '');
  const funFeeling = toGoosebumpsFeeling(encounter.status_affliction || '');

  const seed =
    hashString(`${encounter.entity_name}|${rawLocation}|${weapon}|${artifact}`) +
    variantOffset * 97;

  const act1Openers = [
    `Everybody in town knew you were NEVER supposed to hang around ${locationFull} after dark. Naturally, that was the exact time ${charIntro} pushed the door open. The place was dead quiet—except for the creepy buzzing of a half-broken ceiling light. Blink. Buzz. Blink. The air smelled like stale popcorn, cold plastic, and a thunderstorm that hadn't hit yet.`,
    `"Five minutes. In and out," ${charIntro} muttered, peering inside ${locationFull}. It was way too quiet. Even the old soda machine in the corner had stopped humming. Outside, the streetlights threw long, twisted shadows across the floor, and a cold draft brushed right past ${charShort}'s sneakers. Wait... weren't all the windows locked?`,
    `It started as a totally normal Tuesday night—right up until ${charIntro} stepped into ${locationFull} and the door clicked shut by itself. Not a gentle click. A heavy, final *CLUNK*. ${charShort} jiggled the handle twice. Locked tight. Across the empty room, a single neon sign buzzed louder and louder until it sounded like a swarm of angry bees.`,
    `If you ever hear strange tapping noises coming from ${locationFull} right before closing time, do yourself a favor: run the other way. ${charIntro} did NOT run the other way. Instead, ${charShort} tiptoed right past the empty front counter, listening to the squeak of their own sneakers echo way too loudly in the dark.`,
    `The whole neighborhood swore ${locationFull} was haunted—or at least seriously weird after sunset. Still, ${charIntro} figured it was just a silly rumor... until the temperature suddenly dropped twenty degrees in two seconds. Their breath puffed out in a chilly white cloud. Somewhere down the back aisle, something heavy dragged across the floor. *SCRAAAPE.*`,
    `At one minute to closing, ${locationFull} was supposed to be completely empty. Every shelf sat still. Every sign was switched off. So why was a weird purple glow leaking out from behind the back curtain? ${charIntro} took one slow step closer, stomach doing a nervous flip-flop.`,
    `First rule of surviving the 1990s: never follow a mysterious glowing noise into ${locationFull} by yourself. ${charIntro} broke that rule in about three seconds flat. The air inside tasted fizzy, like opening a warm can of lemon-lime soda, and every plastic wrapper on the shelves was rattling softly on its own.`,
    `Rain tapped against the roof of ${locationFull} like bony fingers asking to come inside. ${charIntro} wiped water off their jacket and peered down the dim, stretching aisle. Nobody was at the register. Nobody was in the back. Yet someone—or SOMETHING—had definitely left the lights flickering on and off like a spooky Morse code message.`,
  ];

  const act1Middles = [
    `${charShort} gripped the ${weapon} in one hand and checked the ${artifact} clipped to their belt. Suddenly, they got ${funFeeling}. Then something even weirder happened. ${funSign} "Okay," ${charShort} whispered, swallowing hard. "Definitely not normal. Time to leave."`,
    `Pulling out the ${artifact}, ${charShort} held it up like a lucky charm and kept the ${weapon} ready. Right away, ${charShort} was hit by ${funFeeling}. Across the room, things were going haywire—${funSign.charAt(0).toLowerCase() + funSign.slice(1)} "Please be a prank," ${charShort} said out loud. Nobody laughed back.`,
    `${charShort} took a deep breath and squeezed the ${weapon} tighter. The ${artifact} started glowing bright and warm in their other hand. Out of nowhere came ${funFeeling}. Even crazier: ${funSign.charAt(0).toLowerCase() + funSign.slice(1)} Goosebumps popped up all over ${charShort}'s arms.`,
    `"Hello? Anybody working tonight?" ${charShort} called out. Their voice bounced back sounding weirdly stretched and hollow. Clutched tight in their hands were the ${artifact} and the ${weapon}. Almost instantly, ${charShort} felt ${funFeeling}. Worse yet, ${funSign.charAt(0).toLowerCase() + funSign.slice(1)}`,
    `Every instinct screamed to turn around, grab a slushie, and go watch cartoons instead. Still, ${charShort} crept forward with the ${artifact} held high and the ${weapon} tucked under one arm. That's when ${funFeeling} washed over them. Right before their eyes, ${funSign.charAt(0).toLowerCase() + funSign.slice(1)}`,
    `Something was seriously wrong here. ${charShort} tapped the ${artifact} twice—it beeped back like crazy—and raised the ${weapon}. A split second later came ${funFeeling}. ${charShort} blinked hard, hoping they were imagining things, because ${funSign.charAt(0).toLowerCase() + funSign.slice(1)}`,
    `${charShort} froze beside a wobbly display rack, clutching the ${weapon} and squinting at the buzzing ${artifact}. Instantly, they felt ${funFeeling}. Up and down the aisle, ${funSign.charAt(0).toLowerCase() + funSign.slice(1)} "Okay, yep, this is officially way above my allowance," ${charShort} gulped.`,
    `Taking two tiny steps back, ${charShort} bumped into a display shelf—*CRASH!*—and nearly jumped out of their sneakers. Holding up the ${artifact} and the ${weapon}, they suddenly felt ${funFeeling}. All around them, ${funSign.charAt(0).toLowerCase() + funSign.slice(1)}`,
  ];

  const act1Closers = [
    `Then every single light went out at once. Pitch black. *THUMP. THUMP. THUMP.* Something massive was stomping straight down the aisle! When the emergency lights blinked back on in spooky red, ${charShort} gasped. Towering right in front of them—glowing, grinning, and way bigger than any human—was ${anomaly}. And it was looking straight at ${charShort}!`,
    `*CREEEAK.* The shadow on the back wall stretched taller... and taller... and then peeled right off the wall! ${charShort} tried to run, but their sneakers skidded on the waxed floor. Out of the swirling neon fog stepped ${anomaly}, rattling every shelf in ${location}. There was no escape—and no grown-up coming to save the day.`,
    `A loud *ZAP!* shook the ceiling tiles, and a bright swirl of sparks burst open right in the middle of ${location}. ${charShort} ducked behind a counter and peeked over the edge. Bad idea. Rising out of the glowing mist like a giant nightmare come to life was ${anomaly}—and it had just spotted ${charShort}'s hiding spot!`,
    `That's when ${charShort} noticed the creepy reflection in the glass. Something huge was standing RIGHT behind them. Slowly, ${charShort} turned around. Heart hammering like a drum, they stared straight up at ${anomaly}. It let out a wild, echoing rattle that shook loose half the ceiling tiles. "Uh... nice monster?" ${charShort} squeaked.`,
    `Suddenly, the buzzing stopped. Total, spooky silence. Then—*BOOM!*—a shelf flew sideways and ${anomaly} burst straight into the open, crackling with wild neon sparks! ${charShort} stumbled back a step, gripping the ${weapon} with sweaty palms. Whatever this crazy thing was, it definitely wasn't friendly!`,
    `A cold laugh echoed from every corner of ${location} at once. Before ${charShort} could even blink, a whirlpool of rainbow static spun up from the floor—and out popped ${anomaly}, towering almost to the ceiling! Its glowing eyes locked right onto ${charShort}. Uh-oh. Game on.`,
    `Wait a second. The giant shadow stretching across the tiles wasn't ${charShort}'s. It had way too many glowing edges—and it was MOVING! Spinning around, ${charShort} came face-to-face with ${anomaly} looming over the aisle like a runaway movie monster. Running wasn't going to cut it anymore.`,
    `One last flicker of the overhead lights, and *POP!*—the air smelled like burnt toast and electric sparks. Stepping right out of the shadows of ${location} was ${anomaly}, glowing brighter than a whole row of arcade machines. ${charShort} gulped, raised the ${artifact}, and whispered, "Here goes nothing!"`,
  ];

  const act2Openers = [
    `${anomaly} lunged first! ${charShort} yelped and dove sideways just as a wild wave of glowing sparks knocked a whole stack of boxes flying through the air. Sliding across the slick tiles on their sneakers like stealing second base, ${charShort} barely dodged behind a counter. "Hey! Watch the hair!" ${charShort} yelled.`,
    `No warning. No countdown. ${anomaly} came charging straight down the aisle of ${location} like a runaway freight train! ${charShort} scrambled over a tilted shelf, ducked under a spinning neon blast, and swung the ${weapon} just in time to bat a flying ball of glowing fuzz right into the ceiling. *SPLAT!*`,
    `"WHOA—LOOK OUT!" ${charShort} leaped straight over an overturned cart as ${anomaly} swept across the room, rattling everything that wasn't bolted down. Loose coins, wrappers, and plastic trinkets started spinning through the air like a crazy indoor tornado. ${charShort} ducked, rolled, and popped up behind a pillar, panting hard.`,
    `The whole room went totally bonkers! ${anomaly} bounced off the back wall and zoomed straight at ${charShort} in a blaze of neon light. ${charShort} jumped left, slipped on a stray arcade token, and somehow slid RIGHT underneath the monster's giant swipe! Pure luck—and maybe a tiny bit of panic.`,
    `With a loud *WHOOSH!*, ${anomaly} sent a glowing wave rolling across the floor of ${location}. ${charShort} hopped onto a sturdy counter like the floor was made of hot lava, wobbling wildly while trying not to drop the ${artifact}. Below them, the monster circled like a glowing shark waiting for dinner!`,
    `${anomaly} wasn't playing around! It slammed into a row of shelves—*KABOOM!*—sending colorful 90s junk raining down everywhere. ${charShort} held the ${weapon} up like a shield, zigzagging through the cluttered aisles while the giant glowing monster chased right on their heels.`,
    `Heart pounding a mile a minute, ${charShort} sprinted around the corner of ${location}—straight into a dead end! Behind them, ${anomaly} floated closer, glowing brighter and louder with every second. ${charShort} looked at the monster, looked at the ${artifact}, and looked at the ${weapon}. Think fast!`,
    `"Okay, okay, BAD monster! SIT! STAY!" ${charShort} shouted, leaping over a puddle of glowing static as ${anomaly} zoomed past by an inch. Obviously, ${anomaly} did NOT sit. It spun around for another pass, making every light in ${location} flash like a disco party gone wrong.`,
  ];

  const act2Middles = [
    `Wait a second—what if these two things worked TOGETHER?! With zero time to spare, ${charShort} jammed the ${artifact} right onto the ${weapon} and flipped every switch at once. *CLICK-BZZZT!* Instantly, bright rainbow sparks burst out, firing up ${funTrick}! "Whoa—it's actually working!" ${charShort} grinned.`,
    `A totally crazy idea popped into ${charShort}'s head. Remembering a weird trick from a Saturday morning cartoon, ${charShort} slapped the ${artifact} straight against the ${weapon} and gave it one good whack. *WHIRRR-DING!* Suddenly, ${funTrick} roared to life in a dazzling wave of electric color that made ${anomaly} skid to a shocked stop!`,
    `"Please work, please work, please work!" ${charShort} muttered, mashing the buttons on the ${artifact} while wedging it tight against the ${weapon}. For one scary second, nothing happened. Then—*KA-ZING!*—a bright blast of ${funTrick} lit up the entire room like a giant fireworks finale!`,
    `No way was ${charShort} getting flattened tonight! Thinking fast, they clicked the ${artifact} onto the side of the ${weapon}, cranked it all the way past the red line, and aimed straight ahead. Out burst a wild, sizzling wave of ${funTrick}, pushing back the creepy glow and knocking ${anomaly} totally off balance!`,
    `Just when things looked hopeless, the ${artifact} gave a loud *BEEP-BEEP!* right next to the ${weapon}. Sparks jumped between them! ${charShort} grinned wide, held them tight together, and yelled, "Eat this!" A huge colorful ripple of ${funTrick} blasted straight down the aisle of ${location}!`,
    `${charShort} twisted the dial on the ${artifact} as far as it would go and tapped it straight against the ${weapon}. *ZAP-POP!* The two gadgets lit up like a Christmas tree on turbo mode, unleashing ${funTrick}! Even ${anomaly} froze in mid-air looking seriously surprised!`,
    `Cornered with nowhere left to run, ${charShort} crossed their fingers and smashed the ${artifact} right into the handle of the ${weapon}. *BOOOOM!* Not a scary boom—an awesome neon rainbow boom! ${funTrick} erupted across ${location}, spinning all the weird floating junk right back in ${anomaly}'s face!`,
    `"Time for Plan B!" ${charShort} shouted—even though they had just made up Plan B half a second ago. Locking the ${artifact} onto the ${weapon}, they unleashed a full-blast wave of ${funTrick}! Brilliant streaks of neon light zipped around the room like a pinball machine hitting super jackpot!`,
  ];

  const act2Closers = [
    `Direct hit! ${anomaly} wobbled like a giant glowing bowl of Jell-O, spun around three fast times, and let out a goofy *BWOOOOP!* sound. With one huge, harmless *POP!* of rainbow confetti sparks, the monster shrank smaller and smaller—until it vanished completely into thin air!`,
    `Caught right in the middle of ${funTrick}, ${anomaly} couldn't hang on any longer! Its glowing outline fizzled, popped, and unraveled like a giant spool of bright neon ribbon spiraling straight toward the ceiling. One final sparkling *WHOOSH!*—and poof! Gone!`,
    `${charShort} leaned in and gave the ${weapon} one last big push! The bright wave swept straight over ${anomaly}, lifting it off the floor in a swirl of dazzling starlight. With a silly whistling sound like a deflating balloon, the monster zipped upward into a tiny glowing dot and disappeared!`,
    `"BULLSEYE!" ${charShort} cheered as ${funTrick} wrapped right around ${anomaly} like a giant glowing hula-hoop. The monster jittered, flickered like an old TV losing channel 3, and—*BLINK!*—vanished in a shower of warm twinkling sparkles that drifted gently down across ${location}.`,
    `The blast hit ${anomaly} dead-center! For two breathless seconds, the whole room glowed bright enough to see from space. Then—*SNAP!*—every crazy floating object dropped softly back where it belonged, and ${anomaly} melted away into a harmless puff of glittering mist.`,
    `Spinning faster and faster like a glowing top, ${anomaly} let out one last surprised rattle before folding inward with a crisp *POP!* Just like that, the neon storm vanished, the wind stopped howling, and the crazy lights inside ${location} blinked softly back to normal.`,
    `One giant flash of purple and gold filled ${location} from wall to wall. ${charShort} shielded their eyes and waited. When they peeked through their fingers... nothing! ${anomaly} was totally gone, leaving only tiny shimmering sparks floating lazily toward the ceiling like sleepy fireflies.`,
    `With a dramatic *FZZZT-POP!*, ${anomaly} burst into a hundred harmless glowing soap bubbles that floated upward and blinked out one by one. Every rattling shelf settled down. The weird hum cut off completely. ${charShort} blinked in the sudden quiet. "Did I... did I actually just win?"`,
  ];

  const act3Openers = [
    `All at once, ${location} felt completely normal again. The regular ceiling lights clicked steadily back on, the creepy chill vanished, and the front door gave a friendly little *CLICK* as it unlocked by itself. ${charShort} slumped back against a counter and let out the biggest sigh of their entire life.`,
    `Silence. Real, normal, totally-not-haunted silence! Outside, a car drove past with its radio playing an upbeat 90s hit, like nothing crazy had just happened ten feet away. ${charShort} let out a shaky laugh and wiped their forehead. "Okay. Nobody is EVER going to believe a single word of this."`,
    `Just like waking up from a wild dream, every crooked shadow snapped straight back into place. The air in ${location} smelled ordinary again—just dust, carpet, and warm old electronics. ${charShort} stood up slowly, checked both hands, and grinned. Still in one piece!`,
    `Whew! The crazy buzzing was gone, the lights stopped blinking, and even the soda machine in the corner kicked back on with a cheerful rumble. ${charShort} collapsed onto a nearby stool, catching their breath while giggling nervously. "Next time, I'm definitely staying home to play video games."`,
    `One second it looked like the end of the world; the next second, ${location} was just a plain old quiet 1990s hangout again. Soft evening air drifted in through the doorway. ${charShort} dusted off their sleeves and stared around the peaceful room in total disbelief.`,
    `The weird glow faded away until only the cozy night-lights remained. Not a single monster in sight! ${charShort} poked an empty display box carefully with one sneaker—just in case—and smiled when it didn't bite back. Coast clear!`,
    `All the goosebumps on ${charShort}'s arms finally went away. Overhead, the regular lights hummed smoothly, and the whole room felt warm and safe again. ${charShort} leaned on the ${weapon} and shook their head with a grin. Best Tuesday night ever—and also the absolute worst!`,
    `For a full ten seconds, ${charShort} didn't move a muscle, listening hard for any more creepy footsteps. Nothing. Just a distant cricket outside and the quiet hum of ${location}. Letting out a huge relieved laugh, ${charShort} finally lowered their guard.`,
  ];

  const act3Middles = [
    `${charShort} unhooked the warm, slightly smoking ${artifact} from the ${weapon} and blew on it like a hot slice of pizza. Somehow, held together with pure 90s luck, both pieces of gear still worked! A couple shiny arcade tokens rolled past their sneakers—weird little souvenirs from a wild night.`,
    `Tucking the ${artifact} safely back into their pocket and slinging the ${weapon} over one shoulder, ${charShort} brushed glowing glitter dust off their jacket. The morning crew was definitely going to wonder why half the shelves looked slightly crooked, though!`,
    `Looking down at the beat-up ${weapon} and the humming ${artifact}, ${charShort} couldn't help smiling. They looked totally ordinary again—just regular neighborhood junk that had somehow saved the whole block from ${anomaly}. Not bad at all.`,
    `${charShort} did one quick lap around ${location} just to be 100% sure no sneaky glowing puddles were hiding behind the counters. Everything was spotless—well, except for a funny scorched smiley shape left right on the floor tiles.`,
    `Carefully packing away the ${artifact} and the ${weapon}, ${charShort} shook their head at the tiny sparkles still clinging to their shoelaces. Good luck explaining THOSE to anyone tomorrow morning!`,
    `With the ${weapon} tucked under one arm and the ${artifact} safe in their backpack, ${charShort} headed toward the exit. Every step felt lighter now—like finishing the scariest roller coaster in the park and realizing you survived.`,
    `${charShort} gave the trusty ${artifact} a grateful pat and wiped a smudge of glowing neon dust off the ${weapon}. Everything in ${location} sat peacefully in place, as if ${anomaly} had never even been there.`,
    `Checking their watch, ${charShort} blinked—only three minutes had passed! How could a whole monster showdown take three minutes?! Shaking their head, they grabbed the ${weapon} and ${artifact} and pushed open the exit door.`,
  ];

  const act3Closers = [
    `Wait a second—what was that shiny thing lying right where ${anomaly} had popped? ${charShort} bent down and picked up a brand-new, super-glossy holographic trading card, still warm to the touch. It had a picture of ${anomaly} right on the front! ${charShort} slid it into their pocket and walked out under the streetlights... totally missing the tiny moment when the monster on the card winked.`,
    `Right on the front counter sat something that definitely wasn't there before: a gleaming rainbow foil trading card showing ${anomaly} frozen mid-leap! "Whoa... cool!" ${charShort} grinned, slipping the card into their pocket before heading home. Only when they reached the sidewalk did the card let out one tiny, muffled giggle from inside their jacket.`,
    `Before stepping outside, ${charShort} spotted a bright holographic trading card tucked neatly beside a shiny brass token. They picked it up, admired the shimmering picture of ${anomaly}, and laughed. "Nice trophy!" They hurried home through the cool night—never noticing that back inside ${location}, the neon sign blinked twice and spelled: SEE YOU NEXT ISSUE.`,
    `Something sparkly caught ${charShort}'s eye by the door. Resting face-up on the floor was a crisp new holographic trading card with ${anomaly} grinning right off the foil! ${charShort} pocketed it and jogged down the sidewalk, feeling unstoppable. Half a block later, they pulled the card back out for one more look—and froze. Wait... wasn't the monster facing LEFT a second ago?!`,
    `Sitting neatly right on the counter was a freshly glowing Series 2 holographic trading card! ${charShort} scooped it up with a grin, tucked it beside the ${artifact}, and stepped out into the quiet night air. Everything was finally over. Totally over. At least... until their pocket began to buzz with a soft, familiar little *BZZZT*.`,
    `Right at the doorstep lay a shimmering rainbow trading card, glowing faintly like a night-light. ${charShort} picked it up, smiled at the wild picture of ${anomaly} trapped inside the foil, and headed home whistling a tune. Behind them, the empty glass window of ${location} steamed up with one tiny drawn smiley face... and then went dark.`,
    `Just before locking up, ${charShort} found a gleaming holographic card resting right where the monster had vanished. "Awesome," ${charShort} whispered, sliding it into a protective sleeve and heading out into the starry 1990s night. Inside their backpack, the card gave one tiny playful tap... tap... tap.`,
    `A sudden glint on the floor made ${charShort} stop in their tracks. Lying there was a brand-new holographic trading card, sparkling with rainbow foil and still faintly warm! ${charShort} slipped it into their jacket pocket and strolled happily down the quiet street—totally unaware that their own shadow behind them had just sprouted two tiny glowing antennae.`,
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
  mode: 'human' | 'drone' | 'pure-world';
  gender: 'female' | 'male' | 'none';
  ageBracket: '20s' | '30s' | '40s' | '50s' | '60s' | 'none';
  colorFamily: string;
  pronounSubj: 'she' | 'he' | 'it';
  pronounPoss: 'her' | 'his' | 'its';
  pronounObj: 'her' | 'him' | 'it';
  fullDescription: string;
  shortAnchor: string;
}

export const STORYBOARD_HERO_LOOKS: StoryboardHeroLook[] = [
  {
    id: 'canary-raincoat-sleuth',
    emoji: '🌧️',
    shortLabel: 'Canary Raincoat Sleuth (54F)',
    mode: 'human',
    gender: 'female',
    ageBracket: '50s',
    colorFamily: 'yellow',
    pronounSubj: 'she',
    pronounPoss: 'her',
    pronounObj: 'her',
    fullDescription:
      'a 54-year-old woman with silver-streaked wavy hair in a messy bun and round tortoiseshell glasses, wearing a bright canary-yellow hooded rain slicker, charcoal knit scarf, and tall rubber rain boots',
    shortAnchor: 'the silver-haired woman in the bright canary-yellow rain slicker',
  },
  {
    id: 'cherry-jumpsuit-mechanic',
    emoji: '🔧',
    shortLabel: 'Cherry Jumpsuit Mechanic (48M)',
    mode: 'human',
    gender: 'male',
    ageBracket: '40s',
    colorFamily: 'red',
    pronounSubj: 'he',
    pronounPoss: 'his',
    pronounObj: 'him',
    fullDescription:
      'a stout 48-year-old bearded man with curly salt-and-pepper hair under a dark knit beanie, wearing a cherry-red heavy canvas mechanic jumpsuit with rolled sleeves and scuffed tan work boots',
    shortAnchor: 'the bearded man in the cherry-red mechanic jumpsuit and knit beanie',
  },
  {
    id: 'mustard-trench-detective',
    emoji: '🕵️',
    shortLabel: 'Mustard Trench Detective (62M)',
    mode: 'human',
    gender: 'male',
    ageBracket: '60s',
    colorFamily: 'mustard',
    pronounSubj: 'he',
    pronounPoss: 'his',
    pronounObj: 'him',
    fullDescription:
      'a tall 62-year-old gray-haired veteran with a neatly trimmed mustache and classic wide-brim felt fedora, wearing a long sweeping mustard-tan trench coat with upturned collar, wool trousers, and leather oxfords',
    shortAnchor: 'the gray-haired detective in the long mustard trench coat and fedora',
  },
  {
    id: 'white-labcoat-scientist',
    emoji: '🔬',
    shortLabel: 'White Lab-Coat Scientist (36F)',
    mode: 'human',
    gender: 'female',
    ageBracket: '30s',
    colorFamily: 'white',
    pronounSubj: 'she',
    pronounPoss: 'her',
    pronounObj: 'her',
    fullDescription:
      'a 36-year-old woman with long braided dark hair and retro clear-frame spectacles, wearing a crisp knee-length white vintage laboratory coat over an emerald turtleneck and pleated brown corduroy slacks',
    shortAnchor: 'the braided scientist in the crisp white laboratory coat',
  },
  {
    id: 'plum-overalls-artist',
    emoji: '🎧',
    shortLabel: 'Plum Overalls Artist (29F)',
    mode: 'human',
    gender: 'female',
    ageBracket: '20s',
    colorFamily: 'purple',
    pronounSubj: 'she',
    pronounPoss: 'her',
    pronounObj: 'her',
    fullDescription:
      'a 29-year-old woman with a short asymmetric violet-tinted bob and vintage round headphones draped around her neck, wearing faded plum corduroy overalls over a striped marigold long-sleeve shirt and chunky white sneakers',
    shortAnchor: 'the violet-bobbed artist in plum corduroy overalls and headphones',
  },
  {
    id: 'tangerine-puffer-courier',
    emoji: '🕶️',
    shortLabel: 'Tangerine Puffer Courier (31M)',
    mode: 'human',
    gender: 'male',
    ageBracket: '30s',
    colorFamily: 'orange',
    pronounSubj: 'he',
    pronounPoss: 'his',
    pronounObj: 'him',
    fullDescription:
      'a wiry 31-year-old man with thick dark curly hair and mirrored wraparound sunglasses, wearing a bright sunset-orange quilted puffer vest over a black mock-neck sweater and baggy olive cargo pants',
    shortAnchor: 'the curly-haired courier in the bright sunset-orange puffer vest',
  },
  {
    id: 'emerald-varsity-captain',
    emoji: '🧥',
    shortLabel: 'Emerald Varsity Captain (27F)',
    mode: 'human',
    gender: 'female',
    ageBracket: '20s',
    colorFamily: 'green',
    pronounSubj: 'she',
    pronounPoss: 'her',
    pronounObj: 'her',
    fullDescription:
      'a tall 27-year-old athletic woman with fiery ginger curly hair tied in a high scrunchie ponytail, wearing an oversized emerald-green and cream vintage letterman jacket, pleated plaid midi skirt, and retro high-tops',
    shortAnchor: 'the ginger-haired woman in the emerald-and-cream varsity jacket',
  },
  {
    id: 'cream-fisherman-watcher',
    emoji: '⚓',
    shortLabel: 'Cream Knit Watcher (59M)',
    mode: 'human',
    gender: 'male',
    ageBracket: '50s',
    colorFamily: 'cream',
    pronounSubj: 'he',
    pronounPoss: 'his',
    pronounObj: 'him',
    fullDescription:
      'a weathered 59-year-old coastal veteran with a bushy white beard and maroon wool watch cap, wearing a thick cable-knit cream fisherman sweater, dark canvas trousers, and laced leather boots',
    shortAnchor: 'the white-bearded man in the thick cream fisherman sweater and maroon cap',
  },
  {
    id: 'burgundy-velvet-dj',
    emoji: '💿',
    shortLabel: 'Burgundy Velvet DJ (33F)',
    mode: 'human',
    gender: 'female',
    ageBracket: '30s',
    colorFamily: 'burgundy',
    pronounSubj: 'she',
    pronounPoss: 'her',
    pronounObj: 'her',
    fullDescription:
      'a 33-year-old woman with long dark wavy hair and large gold hoop earrings, wearing a rich burgundy velvet 1990s blazer over a bright turquoise patterned shirt and wide-leg black trousers',
    shortAnchor: 'the woman in the rich burgundy velvet blazer and gold hoop earrings',
  },
  {
    id: 'silver-parka-futurist',
    emoji: '🛸',
    shortLabel: 'Silver Space-Parka Explorer (26M)',
    mode: 'human',
    gender: 'male',
    ageBracket: '20s',
    colorFamily: 'silver',
    pronounSubj: 'he',
    pronounPoss: 'his',
    pronounObj: 'him',
    fullDescription:
      'a 26-year-old man with bleached platinum spiky hair and amber-tinted retro visor glasses, wearing a shiny metallic-silver puffy winter parka, black nylon track pants, and bright neon-trimmed sneakers',
    shortAnchor: 'the platinum-haired explorer in the shiny silver puffy parka',
  },
  {
    id: 'teal-bowling-tech',
    emoji: '🎳',
    shortLabel: 'Teal Bowling-Shirt Tech (44M)',
    mode: 'human',
    gender: 'male',
    ageBracket: '40s',
    colorFamily: 'teal',
    pronounSubj: 'he',
    pronounPoss: 'his',
    pronounObj: 'him',
    fullDescription:
      'a 44-year-old balding man with round wire-rim glasses and a cheerful mustache, wearing a vintage teal-and-cream paneled retro bowling shirt, khaki pleated chinos, and leather loafers',
    shortAnchor: 'the mustachioed technician in the teal-and-cream retro bowling shirt',
  },
  {
    id: 'plaid-bucket-explorer',
    emoji: '🏕️',
    shortLabel: 'Buffalo-Plaid Explorer (42F)',
    mode: 'human',
    gender: 'female',
    ageBracket: '40s',
    colorFamily: 'plaid',
    pronounSubj: 'she',
    pronounPoss: 'her',
    pronounObj: 'her',
    fullDescription:
      'a 42-year-old woman with long auburn braids under a tan canvas bucket hat, wearing a chunky red-and-black buffalo-plaid wool overshirt over brown utility overalls and laced hiking boots',
    shortAnchor: 'the woman in the tan bucket hat and red-and-black buffalo-plaid overshirt',
  },
  {
    id: 'hotpink-tracksuit-sprinter',
    emoji: '⚡',
    shortLabel: 'Hot-Pink Tracksuit Sprinter (30F)',
    mode: 'human',
    gender: 'female',
    ageBracket: '30s',
    colorFamily: 'magenta',
    pronounSubj: 'she',
    pronounPoss: 'her',
    pronounObj: 'her',
    fullDescription:
      'a 30-year-old woman with short natural curly hair and a neon sweatband, wearing a vibrant hot-pink and turquoise geometric 1990s nylon tracksuit and crisp white retro trainers',
    shortAnchor: 'the athletic woman in the bright hot-pink and turquoise tracksuit',
  },
  {
    id: 'olive-field-archivist',
    emoji: '🗂️',
    shortLabel: 'Olive Field-Parka Archivist (51M)',
    mode: 'human',
    gender: 'male',
    ageBracket: '50s',
    colorFamily: 'olive',
    pronounSubj: 'he',
    pronounPoss: 'his',
    pronounObj: 'him',
    fullDescription:
      'a 51-year-old man with silver-rimmed rectangular glasses and neatly parted dark hair, wearing a multi-pocket olive-drab field parka over a burnt-orange knit vest and dark brown corduroys',
    shortAnchor: 'the bespectacled archivist in the olive field parka and burnt-orange vest',
  },
  {
    id: 'saffron-poncho-cyclist',
    emoji: '🚲',
    shortLabel: 'Saffron Poncho Cyclist (25F)',
    mode: 'human',
    gender: 'female',
    ageBracket: '20s',
    colorFamily: 'amber',
    pronounSubj: 'she',
    pronounPoss: 'her',
    pronounObj: 'her',
    fullDescription:
      'a 25-year-old woman with twin dark braids tucked under a vintage turquoise cycling cap, wearing a flowing saffron-gold weatherproof poncho over dark cycling shorts and striped leg warmers',
    shortAnchor: 'the cyclist in the flowing saffron-gold poncho and turquoise cap',
  },
  {
    id: 'diner-apron-cook',
    emoji: '🍳',
    shortLabel: 'Diner Apron Cook (56M)',
    mode: 'human',
    gender: 'male',
    ageBracket: '50s',
    colorFamily: 'apron',
    pronounSubj: 'he',
    pronounPoss: 'his',
    pronounObj: 'him',
    fullDescription:
      'a broad-shouldered 56-year-old man with a graying crew cut and classic white paper diner cap, wearing a crisp white striped kitchen apron over a rolled-sleeve charcoal chambray shirt and dark slacks',
    shortAnchor: 'the diner cook in the white paper cap and crisp striped kitchen apron',
  },
  {
    id: 'crimson-wrap-martial',
    emoji: '🥋',
    shortLabel: 'Crimson Sash Martial Artist (35F)',
    mode: 'human',
    gender: 'female',
    ageBracket: '30s',
    colorFamily: 'crimson',
    pronounSubj: 'she',
    pronounPoss: 'her',
    pronounObj: 'her',
    fullDescription:
      'a 35-year-old woman with a sleek high jet-black topknot, wearing a deep crimson-and-indigo quilted martial-arts wrap jacket tied with a wide cloth sash, loose charcoal cotton trousers, and canvas slip-ons',
    shortAnchor: 'the topknotted martial artist in the deep crimson quilted wrap jacket',
  },
  {
    id: 'suspenders-projectionist',
    emoji: '🎞️',
    shortLabel: 'Red-Suspenders Projectionist (39M)',
    mode: 'human',
    gender: 'male',
    ageBracket: '30s',
    colorFamily: 'checkered',
    pronounSubj: 'he',
    pronounPoss: 'his',
    pronounObj: 'him',
    fullDescription:
      'a lanky 39-year-old man with tousled chestnut curls and thick horn-rimmed glasses, wearing a crisp cream button-down shirt with bright red suspenders, black-and-white houndstooth trousers, and leather boots',
    shortAnchor: 'the lanky projectionist in bright red suspenders and houndstooth trousers',
  },
  {
    id: 'coral-cardigan-librarian',
    emoji: '📚',
    shortLabel: 'Coral Cardigan Librarian (64F)',
    mode: 'human',
    gender: 'female',
    ageBracket: '60s',
    colorFamily: 'coral',
    pronounSubj: 'she',
    pronounPoss: 'her',
    pronounObj: 'her',
    fullDescription:
      'a 64-year-old grandmotherly woman with a fluffy white bob haircut and beaded eyeglass chain, wearing a cozy coral-pink patterned knit cardigan over a floral vintage blouse and long navy pleated skirt',
    shortAnchor: 'the white-haired woman in the cozy coral-pink cardigan and pleated skirt',
  },
  {
    id: 'hivis-night-custodian',
    emoji: '🦺',
    shortLabel: 'Neon-Vest Night Custodian (47M)',
    mode: 'human',
    gender: 'male',
    ageBracket: '40s',
    colorFamily: 'neon-lime',
    pronounSubj: 'he',
    pronounPoss: 'his',
    pronounObj: 'him',
    fullDescription:
      'a 47-year-old man with a close-cropped beard and vintage corduroy cap, wearing a bright neon-lime reflective safety vest over a charcoal sweatshirt, dark utility trousers, and heavy work boots',
    shortAnchor: 'the bearded custodian in the bright neon-lime reflective safety vest',
  },
  {
    id: 'tweed-bowtie-professor',
    emoji: '🎓',
    shortLabel: 'Tweed Bow-Tie Professor (66M)',
    mode: 'human',
    gender: 'male',
    ageBracket: '60s',
    colorFamily: 'tweed',
    pronounSubj: 'he',
    pronounPoss: 'his',
    pronounObj: 'him',
    fullDescription:
      'an eccentric 66-year-old professor with wild tufts of white hair and a crooked polka-dot bow tie, wearing a patched brown tweed blazer over a warm mustard waistcoat and pleated wool trousers',
    shortAnchor: 'the white-haired professor in the brown tweed blazer and bow tie',
  },
  {
    id: 'mint-goggles-tinkerer',
    emoji: '🥽',
    shortLabel: 'Mint Smock & Goggles Tinkerer (31F)',
    mode: 'human',
    gender: 'female',
    ageBracket: '30s',
    colorFamily: 'mint',
    pronounSubj: 'she',
    pronounPoss: 'her',
    pronounObj: 'her',
    fullDescription:
      'a 31-year-old woman with copper-red curly hair and vintage brass magnifying goggles perched on her forehead, wearing a mint-green vintage utility smock, canvas tool apron, and cuffed brown boots',
    shortAnchor: 'the copper-haired tinkerer in the mint utility smock and brass goggles',
  },
  {
    id: 'retro-hover-drone',
    emoji: '🤖',
    shortLabel: 'Mini Retro CRT Hover-Drone (No Human)',
    mode: 'drone',
    gender: 'none',
    ageBracket: 'none',
    colorFamily: 'drone-purple',
    pronounSubj: 'it',
    pronounPoss: 'its',
    pronounObj: 'it',
    fullDescription:
      'no human characters at all; instead, the sole protagonist is a charming floating translucent-purple 1990s mini CRT-cube companion drone with glowing amber pixel eyes, chrome bunny-ear antennas, and tiny mechanical gripper arms',
    shortAnchor: 'the tiny floating translucent-purple CRT-cube drone',
  },
  {
    id: 'pure-world-no-human',
    emoji: '🌌',
    shortLabel: 'Pure World & Creature Only (No Human)',
    mode: 'pure-world',
    gender: 'none',
    ageBracket: 'none',
    colorFamily: 'no-human',
    pronounSubj: 'it',
    pronounPoss: 'its',
    pronounObj: 'it',
    fullDescription:
      'completely uninhabited atmospheric scenes with no human figures anywhere, focusing purely on the surreal 1990s retro architecture, self-activated glowing vintage gadgets, and the towering cosmic creature transforming the empty space',
    shortAnchor: 'the uninhabited retro room with no human figures',
  },
];

export function buildConsistentHeroVisualLock(charClean: string): {
  genderNoun: 'female' | 'male';
  pronounSubj: 'she' | 'he';
  pronounPoss: 'her' | 'his';
  shortRole: string;
  lockedSheet: string;
} {
  const match = charClean.match(/^([^(]+?)(?:\s*\((.+)\))?$/);
  const shortName = (match?.[1] || charClean).trim();
  const traitRaw = sanitizeVisualPromptText(
    (
      match?.[2] || '1990s suburban recon explorer in authentic nineties attire'
    ).trim()
  );
  const seed = hashString(shortName.toLowerCase());
  const humanLooks = STORYBOARD_HERO_LOOKS.filter((h) => h.mode === 'human');
  const chosen = pickSeeded(humanLooks, seed, 2);
  const genderNoun: 'female' | 'male' = chosen.gender === 'female' ? 'female' : 'male';
  return {
    genderNoun,
    pronounSubj: genderNoun === 'female' ? 'she' : 'he',
    pronounPoss: genderNoun === 'female' ? 'her' : 'his',
    shortRole: traitRaw,
    lockedSheet: chosen.fullDescription,
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
      'luminous cyan and hot-magenta neon highlights',
      'shimmering ultraviolet-purple and electric-aqua prism glow',
      'glowing amber-gold and neon-teal starlight accents',
      'iridescent lime-green and coral-pink glowing contours',
      'warm molten-orange and cobalt-blue luminous trim',
      'pearlescent moonlight silver and ruby-crimson glow',
    ],
    seed,
    4
  );

  // 14 wildly distinct creature silhouettes (checked by specific name FIRST so non-robot monsters never default to robots!)
  if (/(flamingo|owl|moth|peacock|crane|raven|dragon|drake|unicorn)/i.test(lower)) {
    return `"${cleanedName}", a dramatic towering winged creature with sweeping ornate wings, expressive glowing eyes, rich tactile textures matching its theme, and ${glowPalette}`;
  }
  if (/(octopus|jellyfish|kraken|anglerfish|crab|frog|toad|whale|shark|turtle)/i.test(lower)) {
    return `"${cleanedName}", an imaginative towering aquatic-themed storybook creature with glistening translucent fins, tentacles, or patterned shell details and ${glowPalette}`;
  }
  if (/(yeti|snow-cone|snowglobe|frost|blizzard|cotton-candy|cloud|fog-machine|djinn|storm-cloud|lightning|stag)/i.test(lower)) {
    return `"${cleanedName}", a towering swirling elemental creature sculpted from sparkling frost crystals, billowing glowing mist clouds, or luminous vapor with ${glowPalette}`;
  }
  if (/(moss|sprout|flytrap|cactus|geode|gargoyle|concrete|asphalt|scarecrow|jack-o|pretzel)/i.test(lower)) {
    return `"${cleanedName}", a towering tactile organic-and-stone storybook creature crafted from glowing mossy vines, glittering crystal rock facets, carved stone, or patchwork autumn textures with ${glowPalette}`;
  }
  if (/(dummy|marionette|puppet|clown|jester|plush|troll|mannequin|sock-monkey|carousel|santa|genie|sphinx|teacup|porcelain)/i.test(lower)) {
    return `"${cleanedName}", a theatrical towering vintage-carnival storybook creature made of glossy painted wood, stitched velvet, porcelain, or gleaming brass trim with ${glowPalette}`;
  }
  if (/(origami|paper|book|catalog|ticket|binder|bookmark|halftone|painting|velvet)/i.test(lower)) {
    return `"${cleanedName}", a fantastical towering living-paper and artwork creature made of unfolding origami creases, swirling fluttering pages, foil cutouts, and ${glowPalette}`;
  }
  if (/(spider|beetle|mantis|centipede|scarab|firefly|bug)/i.test(lower)) {
    return `"${cleanedName}", a striking towering jewel-shelled creature with glittering faceted glass eyes, articulated chrome-and-enamel legs, iridescent wings, and ${glowPalette}`;
  }
  if (/(lava-lamp|wax|slime|ooze|slushie|soda|gum|candy|pizza|popcorn|nacho|gumball|root-beer|soft-serve|gel|gak|syrup|cream|pie)/i.test(lower)) {
    return `"${cleanedName}", a whimsical towering bubbling-wax, translucent jelly, frosted swirl, or candy-glass retro creature glowing from within with ${glowPalette}`;
  }
  if (/(ribbon|cord|serpent|boa|slinky|spring-coil|hose|noodle|hydra|tentacle|wire|tape)/i.test(lower)) {
    return `"${cleanedName}", a sweeping looping serpentine creature woven from colorful coiling ribbons, flexible glowing tubes, neon springs, and ${glowPalette}`;
  }
  if (/(fox|cat|raccoon|lion|lizard|hound|minotaur|dust bunny|gremlin)/i.test(lower)) {
    return `"${cleanedName}", a mischievous oversized nocturnal storybook creature with gleaming expressive eyes, fluffy or sculpted retro textures, and ${glowPalette}`;
  }
  if (/(mirror|disco-ball|kaleidoscope|chandelier|neon-sign|glass-tube|prism)/i.test(lower)) {
    return `"${cleanedName}", a dazzling towering mirrored-prism and bent-neon-glass creature refracting rainbow starbursts across every wall with ${glowPalette}`;
  }
  if (/(robot|animatronic|automaton|vending|claw|jukebox|rewinder|drone|pinsetter|toaster|dryer|pinball|cuckoo-clock|blender|lawnmower)/i.test(lower) || morphologyId === 'mechanical_automaton') {
    return `"${cleanedName}", an imaginative towering 1990s retro hardware automaton built from chunky vintage dials, polished chrome trim, glowing indicator bulbs, and ${glowPalette}`;
  }
  if (/(modem|crt|tv|video|floppy|cd|cable|pixel|hologram|phone|stereogram|glitch|microchip|keyboard|console|pet)/i.test(lower) || morphologyId === 'cyber_signal') {
    return `"${cleanedName}", a quirky glowing 1990s holographic signal creature made of floating vintage monitors, shimmering pixel waves, tangled cords, and ${glowPalette}`;
  }
  if (/(ghost|phantom|poltergeist|specter|revenant|banshee|shadow|wizard|organ pipe|parade)/i.test(lower) || morphologyId === 'spectral_phantom') {
    return `"${cleanedName}", a dramatic billowing luminous apparition draped in translucent swirling nebula mist, glowing stardust trails, and ${glowPalette}`;
  }
  if (morphologyId === 'slime_ooze') {
    return `"${cleanedName}", a whimsical towering translucent jelly-and-crystal creature swirling with fizzy glowing bubbles and ${glowPalette}`;
  }
  if (morphologyId === 'serpent_constricter') {
    return `"${cleanedName}", a sweeping coiling ribbon-and-coil creature weaving gracefully through the air with ${glowPalette}`;
  }
  if (morphologyId === 'swarm_cluster') {
    return `"${cleanedName}", a fantastical orbiting swarm of glowing vintage collectibles swirling around a bright core with ${glowPalette}`;
  }
  return `"${cleanedName}", a towering imaginative 1990s storybook creature sculpted from glowing translucent prisms, tactile retro textures, and ${glowPalette}`;
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
      'photorealistic 1990s live-action 35mm anamorphic cinema photography featuring real human actors, tactile practical puppet and animatronic sci-fi creature effects, authentic physical film grain, shallow cinematic depth of field, and zero cartoon or illustration look',
    colors: 'warm tungsten highlights, misty emerald shadows, and wet neon halation glow',
    energyFx: 'practical optical light rays, glowing volumetric prism haze, and warm anamorphic lens flares',
    videoType: 'live-action 35mm anamorphic 1990s sci-fi movie clip with real-world lighting and film grain',
  },
  {
    id: 'claymation-miniature',
    emoji: '🧱',
    shortLabel: 'Stop-Motion Claymation',
    gridIntro: 'A tactile 16:9 four-panel 2x2 stop-motion claymation diorama contact sheet',
    medium:
      'handcrafted 1990s stop-motion claymation photography with sculpted modeling-clay characters showing subtle fingerprint textures, intricate handmade miniature cardboard-and-wire sets, practical miniature LED lights, and macro tilt-shift lens blur',
    colors: 'rich studio spotlight amber, cozy crimson velvet, turquoise plastic, and glowing miniature neon',
    energyFx: 'hand-sculpted translucent glowing resin sparks and tiny practical fiber-optic light trails',
    videoType: 'handcrafted 12fps stop-motion claymation miniature film clip with tangible handmade set textures',
  },
  {
    id: '90s-flash-photo',
    emoji: '📷',
    shortLabel: '1990s 35mm Flash Photo',
    gridIntro: 'An authentic 16:9 four-panel 2x2 candid 35mm snapshot collage',
    medium:
      'candid 1990s disposable-camera 35mm direct-flash live-action photography with real people, realistic suburban linoleum and plastic textures, crisp on-camera flash glare, authentic analog film color shifts, and completely photographic realism (not drawn or animated)',
    colors: 'raw direct-flash whites, nostalgic green-tinted shadows, and saturated fluorescent color pops',
    energyFx: 'bright overexposed flash reflections, prismatic optical light leaks, and glowing lens bloom',
    videoType: 'raw handheld 1990s live-action documentary film clip with candid natural motion',
  },
  {
    id: 'oil-impasto',
    emoji: '🎨',
    shortLabel: 'Heavy Impasto Oil Painting',
    gridIntro: 'A classical 16:9 four-panel 2x2 fine-art oil-on-canvas sequence',
    medium:
      'rich classical impasto oil painting on coarsely woven linen canvas with thick visible palette-knife brushstrokes, dramatic gallery chiaroscuro lighting, layered luminous oil glazes, and rich painterly realism (no cartoon outlines)',
    colors: 'burnished ochre gold, deep Prussian indigo, glowing cerulean, and molten vermilion highlights',
    energyFx: 'luminous thick oil-painted sweeps of radiant golden and cyan light',
    videoType: 'living oil-on-canvas animated painting clip with swirling impasto brushwork in motion',
  },
  {
    id: 'retro-97-cgi',
    emoji: '🕹️',
    shortLabel: '1997 Pre-Rendered 3D CGI',
    gridIntro: 'A nostalgic 16:9 four-panel 2x2 late-1990s pre-rendered 3D CGI showcase',
    medium:
      'authentic 1997 ray-traced 3D computer graphics render with glossy specular chrome reflections, smooth early-CGI molded geometry, gleaming translucent plastic shaders, dramatic volumetric spotlight cones, and crisp retro 3D modeling',
    colors: 'mirror chrome silver, glowing cobalt blue, neon teal, and iridescent purple plasma',
    energyFx: 'glossy ray-traced volumetric light beams, floating 3D geometric prism orbs, and bright digital lens flares',
    videoType: 'nostalgic 1997 pre-rendered 3D CGI cutscene clip with shiny ray-traced reflections and smooth camera glide',
  },
  {
    id: 'risograph-zine',
    emoji: '📰',
    shortLabel: 'Risograph Indie Print',
    gridIntro: 'A tactile 16:9 four-panel 2x2 indie risograph printmaking sheet',
    medium:
      'authentic 1990s underground risograph soy-ink printmaking on fibrous off-white recycled stock featuring coarse tactile halftone dot screens, bold organic ink grain, subtle two-plate color misregistration, and raw screenprint texture',
    colors: 'fluorescent coral-pink, deep teal ink, acid-marigold yellow, and rich charcoal overprint',
    energyFx: 'bold textured halftone ink bursts, stippled neon aura rings, and gritty print speckles',
    videoType: 'tactile animated risograph print clip with shifting paper grain and halftone ink layers',
  },
  {
    id: 'analog-camcorder',
    emoji: '📺',
    shortLabel: '1990s Analog Camcorder',
    gridIntro: 'A candid 16:9 four-panel 2x2 1990s home-video camcorder freeze-frame sheet',
    medium:
      'authentic lo-fi 1990s handheld home-video tape footage of real live-action people and physical locations with soft analog magnetic-tape texture, subtle chromatic color fringe around bright lights, warm indoor video bloom, and grounded documentary realism',
    colors: 'warm fluorescent cream, soft cyan-magenta highlight bloom, and slightly faded analog tape shadows',
    energyFx: 'glowing analog tape light-bleed, dazzling phosphor glare, and shimmering video tracking ripples',
    videoType: 'authentic 1990s handheld analog camcorder live-action clip with gentle natural camera shake and warm tape bloom',
  },
  {
    id: 'watercolor-storybook',
    emoji: '🖌️',
    shortLabel: 'Delicate Watercolor Paper',
    gridIntro: 'A painterly 16:9 four-panel 2x2 fine-art watercolor sequence',
    medium:
      'expressive wet-on-wet fine-art watercolor washes on heavy textured cold-press cotton paper featuring delicate translucent pigment bleeds, airy sunlit paper highlights, organic water blooms, and whisper-fine fountain pen accents',
    colors: 'soft sunset peach, cerulean sky wash, lavender mist, and luminous warm gold pigment',
    energyFx: 'delicate glowing watercolor blooms of iridescent turquoise and golden light washes',
    videoType: 'fluid hand-painted watercolor motion clip with organic blooming pigments on textured cotton paper',
  },
  {
    id: 'airbrush-paperback',
    emoji: '🌌',
    shortLabel: '90s Sci-Fi Airbrush Cover',
    gridIntro: 'A dramatic 16:9 four-panel 2x2 retro sci-fi airbrush cover-art sequence',
    medium:
      'hyper-detailed 1990s traditional acrylic airbrush painting on smooth illustration board with seamless velvety atmospheric gradients, gleaming liquid-chrome specular reflections, crisp painted realism, and luminous starburst highlights (no flat cartoon lines)',
    colors: 'deep cosmic amethyst, polished liquid chrome, blazing sunset orange, and electric starlight cyan',
    energyFx: 'airbrushed aurora light ribbons, gleaming chrome specular glints, and soft neon stardust clouds',
    videoType: 'lush painted retro sci-fi airbrush motion clip with gleaming chrome light shifts and drifting nebula glow',
  },
  {
    id: 'woodblock-linocut',
    emoji: '🪵',
    shortLabel: 'Carved Woodblock Print',
    gridIntro: 'A striking 16:9 four-panel 2x2 hand-carved woodblock relief print sheet',
    medium:
      'bold handcrafted woodblock and linocut relief printmaking pressed onto warm fibrous handmade mulberry paper with crisp carved gouge marks, dramatic high-contrast ink shapes, and rich artisanal printmaking texture',
    colors: 'deep velvety charcoal black, luminous burnt vermilion, antique gold leaf, and Prussian slate blue',
    energyFx: 'radiating hand-carved woodcut light rays and shimmering printed gold-ink wave patterns',
    videoType: 'bold animated woodblock relief print clip with shifting hand-carved ink textures and dramatic shadows',
  },
  {
    id: 'mixed-media-collage',
    emoji: '💎',
    shortLabel: 'Mixed-Media Foil Collage',
    gridIntro: 'An editorial 16:9 four-panel 2x2 surrealist mixed-media collage sheet',
    medium:
      'artful 1990s editorial mixed-media photomontage blending real clipped 35mm photographs, torn textured magazine stock, iridescent metallic foil cutouts, subtle paper drop shadows, and expressive dark charcoal brushwork',
    colors: 'high-contrast monochrome photo tones accented by holographic prism foil, hot magenta, and electric gold',
    energyFx: 'cut-out shimmering metallic foil rays, prismatic paper-prism shards, and glowing photographic light leaks',
    videoType: 'kinetic stop-motion mixed-media paper-and-photo collage clip with fluttering foil light streaks',
  },
  {
    id: 'indie-graphic-novel',
    emoji: '🖍️',
    shortLabel: '1990s Indie Graphic Novel',
    gridIntro: 'A bold 16:9 four-panel 2x2 1990s indie graphic novel storyboard grid',
    medium:
      'gritty hand-inked 1990s underground indie graphic novel artwork with heavy brush-ink shadows, expressive dry-brush crosshatching, and rich opaque gouache color washes',
    colors: 'electric cyan, vibrant magenta, deep ink blacks, and warm sodium-amber rim light',
    energyFx: 'crackling hand-inked energy arcs and vivid neon gouache light flares',
    videoType: 'bold hand-inked 1990s indie graphic novel animated clip with expressive brushwork and crisp linework',
  },
  {
    id: 'papercut-shadowbox',
    emoji: '✂️',
    shortLabel: 'Papercut Layered Shadowbox',
    gridIntro: 'A handcrafted 16:9 four-panel 2x2 layered 3D papercut shadowbox diorama sheet',
    medium:
      'handcrafted multi-layered 3D cut-paper shadowbox diorama made from crisp stacked colored cardstock layers, warm backlit paper glow, delicate physical scissor-cut depth shadows, and miniature theater-stage lighting',
    colors: 'warm backlit cream paper, deep midnight teal cardstock, tangerine orange, and luminous turquoise',
    energyFx: 'backlit glowing paper-cut sunburst layers and delicate glittering translucent vellum rays',
    videoType: 'tactile stop-motion layered papercut shadowbox theater clip with sliding depth-of-field cardstock',
  },
  {
    id: 'faded-70s-instant',
    emoji: '🎞️',
    shortLabel: 'Faded Vintage Instant-Film',
    gridIntro: 'A nostalgic 16:9 four-panel 2x2 vintage instant-film photograph contact sheet',
    medium:
      'authentic faded 1970s and 1980s vintage instant-film analog photography featuring real-world people and lived-in locations, creamy yellowed highlights, soft dreamy optical lens vignette, muted pastel teal-and-ochre chemical film tints, and pure photographic realism (not illustrated)',
    colors: 'creamy warm sepia ivory, faded pastel turquoise, muted rust-orange, and gentle golden lens flare',
    energyFx: 'dreamy overexposed analog chemical light leaks and soft rainbow prism lens halos',
    videoType: 'vintage faded instant-film live-action home-movie clip with soft organic grain and sunlit chemical glow',
  },
  {
    id: 'stained-glass-mosaic',
    emoji: '🪟',
    shortLabel: 'Illuminated Stained Glass',
    gridIntro: 'A luminous 16:9 four-panel 2x2 handcrafted stained-glass mosaic panel sheet',
    medium:
      'handcrafted leaded stained-glass art panels glowing from behind with jewel-toned cathedral glass panes, dark soldered lead outlines, shimmering translucent glass bubbles, and radiant prism caustics',
    colors: 'backlit ruby crimson, sapphire cobalt, sunlit amber gold, emerald green, and radiant opal white',
    energyFx: 'dazzling backlit mosaic starbursts and refracted rainbow glass-prism rays',
    videoType: 'luminous animated stained-glass mosaic clip with shifting sunlit glass caustics and glowing jewel colors',
  },
  {
    id: 'pixel-16bit-diorama',
    emoji: '👾',
    shortLabel: '16-Bit Pixel-Art Diorama',
    gridIntro: 'A crisp 16:9 four-panel 2x2 retro 16-bit pixel-art scene showcase',
    medium:
      'crisp handcrafted 1990s 16-bit retro console pixel-art illustration featuring distinct chunky square pixels, lush dithered twilight gradients, carefully hand-pixeled retro architecture, and rich arcade-era pixel craftsmanship',
    colors: 'vibrant royal indigo, glowing arcade cyan, coral sunset pink, and warm pixel-gold highlights',
    energyFx: 'sparkling 16-bit dithered light sprites, glowing pixel-wave rings, and bright arcade star flashes',
    videoType: 'crisp 16-bit retro pixel-art animated cutscene clip with parallax scrolling layers and glowing pixel sparks',
  },
];

const STORYBOARD_ART_PALETTES = STORYBOARD_VISUAL_STYLES;

interface StoryboardAtmosphere {
  label: string;
  desc: string;
}

const STORYBOARD_ATMOSPHERES: StoryboardAtmosphere[] = [
  {
    label: 'Golden Afternoon Sun',
    desc: 'warm golden-hour late-afternoon sunlight slanting dramatically through dust motes and retro fixtures',
  },
  {
    label: 'Crisp Bright Midday',
    desc: 'bright clear midday sunbeams pouring through tall storefront glass onto colorful vintage surfaces',
  },
  {
    label: 'Winter Blizzard Blue',
    desc: 'icy winter blizzard twilight with drifting frost crystals, pale sapphire snowfall outside, and warm amber indoor lamps',
  },
  {
    label: 'Misty Pink Dawn',
    desc: 'quiet pastel rose-and-silver early morning dawn fog drifting across damp quiet streets and storefronts',
  },
  {
    label: 'Emerald Storm Twilight',
    desc: 'dramatic stormy emerald-and-indigo thunderhead twilight with glowing distant cloud-lightning illumination',
  },
  {
    label: 'Starry Cosmic Midnight',
    desc: 'clear starry deep-cobalt night sky with swirling aurora-like cosmic ribbons shimmering overhead',
  },
  {
    label: 'Desert Peach Sunset',
    desc: 'hazy burnt-peach and magenta desert sunset glow casting long dramatic geometric shadows',
  },
  {
    label: 'Rain-Slicked Neon Night',
    desc: 'misty post-rain midnight air with vivid neon signage gleaming across damp glass and wet pavement',
  },
  {
    label: 'Autumn Sepia Glow',
    desc: 'cozy late-autumn amber dusk with swirling fallen leaves outside and warm tungsten interior glow',
  },
  {
    label: 'Ultraviolet Blacklight',
    desc: 'electric ultraviolet blacklight glow making fluorescent retro trims, signs, and cosmic prisms radiate vividly',
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
  { id: 'chase-trap', emoji: '🏃', shortLabel: 'High-Speed Chase & Trap' },
  { id: 'zero-g-chaos', emoji: '🪐', shortLabel: 'Zero-Gravity Floating Chaos' },
  { id: 'portal-hop', emoji: '🌀', shortLabel: 'Dimension Portal Hop' },
  { id: 'harmonic-truce', emoji: '🎵', shortLabel: 'Harmonic Taming & Truce' },
  { id: 'machine-overload', emoji: '⚡', shortLabel: 'Ticking-Clock Switch Flip' },
  { id: 'noir-mystery', emoji: '🔍', shortLabel: 'Noir Clues & Standoff' },
  { id: 'mirror-decoy', emoji: '🪞', shortLabel: 'Mirror-World Mirage Trick' },
  { id: 'rooftop-skyline', emoji: '🌙', shortLabel: 'Rooftop Skyline Leap' },
  { id: 'flashlight-recon', emoji: '🔦', shortLabel: 'Darkness Flashlight Recon' },
  { id: 'scale-flip', emoji: '🔬', shortLabel: 'Giant / Miniature Scale Flip' },
  { id: 'season-warp', emoji: '🌦️', shortLabel: 'Indoor Seasons Time-Warp' },
  { id: 'classic-showdown', emoji: '🃏', shortLabel: 'Classic Clash & Holo Relic' },
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

const VARIETY_STORAGE_KEY = '199x_zine_visual_variety_v2';
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

function pickFreshHeroLookIndex(recent: StoryboardPlan[]): number {
  const avoidIdx = recent.slice(-12).map((p) => p.heroLookIdx);
  const avoidColors = new Set(
    recent
      .slice(-6)
      .map((p) => STORYBOARD_HERO_LOOKS[p.heroLookIdx]?.colorFamily)
      .filter(Boolean)
  );
  const lastLook = recent.length > 0 ? STORYBOARD_HERO_LOOKS[recent[recent.length - 1].heroLookIdx] : undefined;
  const secondLastLook =
    recent.length > 1 ? STORYBOARD_HERO_LOOKS[recent[recent.length - 2].heroLookIdx] : undefined;

  // Tier 1: unseen in last 12 + new color family (last 6) + different gender & age bracket from last roll
  let candidates = STORYBOARD_HERO_LOOKS.map((_, i) => i).filter((i) => {
    if (avoidIdx.includes(i)) return false;
    const look = STORYBOARD_HERO_LOOKS[i];
    if (avoidColors.has(look.colorFamily)) return false;
    if (lastLook) {
      if (look.mode !== 'human' && lastLook.mode !== 'human') return false;
      if (look.gender !== 'none' && look.gender === lastLook.gender) return false;
      if (look.ageBracket !== 'none' && look.ageBracket === lastLook.ageBracket) return false;
    }
    if (secondLastLook && look.ageBracket !== 'none' && look.ageBracket === secondLastLook.ageBracket) {
      return false;
    }
    return true;
  });

  // Tier 2 fallback: unseen in last 10 + new color family + different gender from last roll
  if (candidates.length === 0) {
    candidates = STORYBOARD_HERO_LOOKS.map((_, i) => i).filter((i) => {
      if (recent.slice(-10).some((p) => p.heroLookIdx === i)) return false;
      const look = STORYBOARD_HERO_LOOKS[i];
      if (avoidColors.has(look.colorFamily)) return false;
      if (lastLook && look.gender !== 'none' && look.gender === lastLook.gender) return false;
      return true;
    });
  }

  // Tier 3 fallback: unseen in last 8
  if (candidates.length === 0) {
    candidates = STORYBOARD_HERO_LOOKS.map((_, i) => i).filter(
      (i) => !recent.slice(-8).some((p) => p.heroLookIdx === i)
    );
  }

  if (candidates.length === 0) {
    candidates = STORYBOARD_HERO_LOOKS.map((_, i) => i);
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
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
    heroLookIdx: pickFreshHeroLookIndex(recentStoryboardPlans),
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
    (encounter.card_type === 'bad_guy'
      ? encounter.entity_name
      : 'Sentient Neon Rift Anomaly');
  const rawChar = encounter.featured_character || "Dex 'Neon-Drift' Kowalski";
  const charClean = sanitizeVisualPromptText(rawChar);
  const rawWeapon = encounter.protagonist_loadout?.improvised_weapon || 'retro pocket frequency tuner';
  const rawArtifact = encounter.protagonist_loadout?.nostalgia_artifact || 'retro handheld scanner';
  const synergy = sanitizeVisualPromptText(
    encounter.protagonist_loadout?.weird_synergy_effect || 'rainbow prism resonance'
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
    rawChar
  );
  const leadPreset = presets[0];

  const safeCreature = toVisualSafeCreatureDescription(rawAnomaly, morphology.id);
  const lightingClean = sanitizeVisualPromptText(environment.lightingCue);
  const leadAudioClean = sanitizeVisualPromptText(leadPreset.audio);

  const planSignature = `${rawLocation}|${rawAnomaly}|${rawChar}|${rawWeapon}|${rawArtifact}|${encounter.visual_style || ''}|${encounter.card_theme || ''}`;
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

  const overrideHeroLook = heroLookIdOverride
    ? STORYBOARD_HERO_LOOKS.find((h) => h.id === heroLookIdOverride)
    : undefined;
  const heroLook =
    overrideHeroLook || STORYBOARD_HERO_LOOKS[plan.heroLookIdx % STORYBOARD_HERO_LOOKS.length];

  const isPureWorld = heroLook.mode === 'pure-world';
  const protag = heroLook.shortAnchor;
  const pPoss = heroLook.pronounPoss;
  const pObj = heroLook.pronounObj;

  const flowArtStyle = `${palette.medium}, color palette of ${palette.colors}, ${cameraGrammar}, borderless edge-to-edge full-bleed visuals, and blank surfaces with no words or lettering`;

  // 12 COMPLETELY DIFFERENT 4-SCENE NARRATIVE ARCS — each explicitly naming the new protagonist look (or Pure World with zero humans!)
  interface StoryArcScript {
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

  const storyArcScripts: Record<string, StoryArcScript> = isPureWorld
    ? {
        'chase-trap': {
          p1: `Empty high-energy interior of ${locationVisual} under ${atmosphere} with no human characters: vintage chairs, display racks, and retro boxes rattle as the towering cosmic creature bursts through the back aisles leaving swirling trails of ${palette.energyFx}.`,
          p2: `Close-up stillness inside empty ${locationVisual} with no people: ${safeGadget1} sits humming and blinking rapidly on a cluttered retro counter while the cosmic creature's gigantic glowing shadow sweeps across the far wall.`,
          p3: `Spontaneous environmental chain-reaction inside uninhabited ${locationVisual}: overhead vintage cables and hanging neon fixtures swing down in a dazzling domino web, tangling the surprised cosmic creature in glowing ribbons of ${palette.energyFx}.`,
          p4: `Serene quiet exterior of ${locationVisual} with no people: tiny glowing starlight motes drift peacefully upward from the empty entrance steps under the calm sky.`,
          videoBeat1: `inside empty ${locationVisual} with no human figures, retro displays rattle wildly as the cosmic creature surges down the aisle knocking vintage props into mid-air`,
          videoBeat2: `hanging neon cables and ${safeGadget1} snap into resonance, wrapping the startled cosmic creature in brilliant harmonic ribbons of ${palette.energyFx}`,
          outroBeat1: `the tangled cosmic creature lets out a musical chime and gently dissolves into rising ribbons of starlight across empty ${locationVisual}`,
          outroBeat2: `three shimmering blank holographic cards flutter gently down onto the quiet front doorstep`,
          outroBeat3: `the empty retro storefront glows softly in peaceful stillness as the cards catch the evening light`,
        },
        'zero-g-chaos': {
          p1: `Astonishing uninhabited zero-gravity anomaly inside ${locationVisual} bathed in ${atmosphere} with no people: stools, arcade tokens, retro boxes, and neon fixtures drift silently off the floor into mid-air.`,
          p2: `Surreal weightless centerpiece inside empty ${locationVisual}: the towering cosmic creature hovers upside-down amid orbiting vintage televisions, glowing cassettes, and floating furniture.`,
          p3: `Spontaneous gravity core reset inside ${locationVisual} with no humans: ${safeGadget1} floats right into the swirling vortex core and pulses outward in expanding golden rings of ${palette.energyFx}.`,
          p4: `Soft grounded aftermath inside empty ${locationVisual}: fallen popcorn, retro props, and scattered tokens rest peacefully on the floor beside a single shimmering prism on a tilted shelf.`,
          videoBeat1: `inside weightless uninhabited ${locationVisual}, tables, cassettes, and retro boxes orbit slowly in mid-air around the hovering cosmic creature`,
          videoBeat2: `glowing ${safeGadget1} drifts directly into the vortex core, unleashing concentric golden rings of ${palette.energyFx} as normal gravity gently returns`,
          outroBeat1: `floating retro objects drift softly back onto the floor as the glowing cosmic creature unwinds upward into pastel mist`,
          outroBeat2: `three gleaming blank holographic cards settle smoothly onto an overturned vintage crate`,
          outroBeat3: `quiet sunlight or neon shimmer washes across the empty, settled room`,
        },
        'portal-hop': {
          p1: `Surreal uninhabited doorway inside ${locationVisual} under ${atmosphere} with no humans: an ordinary back-room door stands wide open into a luminous neon-horizon cosmic dimension of floating geometric islands.`,
          p2: `Threshold pull inside empty ${locationVisual}: vintage posters, tokens, and swirling starlight dust drift sideways through the glowing open doorway into the starlit void.`,
          p3: `Dreamlike alternate pocket dimension with no people: a breathtaking floating starfield mirror-version of ${locationVisual} where the gigantic cosmic creature spirals around hovering checkered platforms amid ${palette.energyFx}.`,
          p4: `Quiet return to normal inside empty ${locationVisual}: the glowing doorway clicks shut into an ordinary wood-and-glass door as faint sparkles fade along the threshold.`,
          videoBeat1: `inside the surreal uninhabited starfield mirror-version of ${locationVisual}, hovering geometric platforms drift slowly around the spiraling cosmic creature`,
          videoBeat2: `${safeGadget1} hovering at the center pulses with a brilliant ring of ${palette.energyFx}, folding the dimensional doorway smoothly back toward home`,
          outroBeat1: `the swirling starfield doorway folds inward in iridescent waves leaving ordinary empty ${locationVisual} behind`,
          outroBeat2: `three gleaming blank holographic cards materialize neatly on the quiet wooden threshold`,
          outroBeat3: `the empty hallway rests in calm golden silence as the cards shimmer softly`,
        },
        'harmonic-truce': {
          p1: `Playful chaotic malfunction inside empty ${locationVisual} under ${atmosphere} with no people: the oversized cosmic creature bounces clumsily through the background making neon signs spin and vintage displays flicker.`,
          p2: `Gentle musical resonance with no humans: close-up of ${safeGadget1} sitting on a counter emitting soft concentric glowing sound-wave rings while the curious cosmic creature leans down listening with tilted head.`,
          p3: `Synchronized cosmic crescendo inside uninhabited ${locationVisual}: breathtaking wide painterly vista of the towering cosmic creature bathed in swirling aurora ribbons of ${palette.energyFx} as crooked shelves straighten harmoniously.`,
          p4: `Heartwarming quiet farewell with no people: the cosmic creature shrinks into a tiny warm glowing starlight orb floating peacefully upward toward the open skylights.`,
          videoBeat1: `inside empty ${locationVisual}, ${safeGadget1} hums on a retro counter sending gentle concentric rings of warm light toward the restless cosmic creature`,
          videoBeat2: `the creature's chaotic static softens into glowing harmony inside a breathtaking swirling aurora of ${palette.energyFx}`,
          outroBeat1: `the peaceful cosmic creature shrinks into a warm glowing starlight firefly drifting upward through the skylight`,
          outroBeat2: `soft sparkles drift onto the polished counter and settle into three shimmering blank holographic trading cards`,
          outroBeat3: `empty ${locationVisual} glows peacefully beneath the quiet sky`,
        },
        'machine-overload': {
          p1: `Urgent machinery hum inside uninhabited ${locationVisual} under ${atmosphere} with no humans: angled close-up of blinking amber and crimson vintage console gauges, humming transformers, and buzzing overhead fixtures.`,
          p2: `Looming silhouette behind frosted glass with no people: the giant cosmic creature presses right up against an illuminated retro partition window beside a wall of glowing toggle switches and coiled cables.`,
          p3: `Automatic breaker surge inside empty ${locationVisual}: a massive industrial switch lever flips downward in a bright spark of static, flooding the entire room with a sweeping harmonic wave of ${palette.energyFx}.`,
          p4: `Warm calm power restored in empty ${locationVisual}: cozy golden lights hum steadily back on across spotless silent counters and quiet control consoles.`,
          videoBeat1: `inside empty ${locationVisual}, glowing console gauges race into the amber zone while the giant cosmic creature looms behind a frosted glass partition`,
          videoBeat2: `the main vintage breaker snaps downward on its own, unleashing a sweeping harmonic wave of ${palette.energyFx} across every fixture`,
          outroBeat1: `the harmonic surge calms the machinery as the cosmic creature dissolves smoothly into peaceful glowing static`,
          outroBeat2: `warm golden room lights flicker steadily back on while three blank shimmering holographic cards slide cleanly out of the console slot`,
          outroBeat3: `the quiet empty control room settles into warm analog peace`,
        },
        'noir-mystery': {
          p1: `Mysterious clue trail inside uninhabited ${locationVisual} under ${atmosphere} with no humans: moody low-angle view of glowing iridescent footprints and softly humming melted arcade tokens leading down an empty shadowed aisle.`,
          p2: `Silent architectural standoff with no people: dramatic symmetrical wide corridor shot of the towering cosmic creature standing motionless at the far misty end of empty ${locationVisual}.`,
          p3: `Surreal tilted reality bend inside uninhabited ${locationVisual}: walls and checkered floors curve upward around the hovering cosmic creature while ${safeGadget1} projects a bright geometric wave of ${palette.energyFx}.`,
          p4: `Quiet empty exterior at dawn with no humans: misty peaceful facade of ${locationVisual} facing an empty suburban parking lot as pale morning light breaks.`,
          videoBeat1: `down the long empty misty corridor of ${locationVisual}, walls and tiles tilt surreally around the silent towering cosmic creature`,
          videoBeat2: `${safeGadget1} pulses in phase alignment, sending a crisp geometric wave of ${palette.energyFx} snapping the crooked room back to true reality`,
          outroBeat1: `the warped empty corridor straightens with a soft chime as the cosmic creature fades gently into morning mist`,
          outroBeat2: `three gleaming blank holographic cards rest quietly on the damp front doorstep`,
          outroBeat3: `pale morning light glides smoothly across the peaceful empty storefront`,
        },
        'mirror-decoy': {
          p1: `Uncanny mirror reveal inside empty ${locationVisual} under ${atmosphere} with no humans: looking across a glossy storefront mirror — the real room looks empty, yet the towering cosmic creature is visible ONLY inside the reflection.`,
          p2: `Hall of holographic mirages with no people: dazzling wide view of uninhabited ${locationVisual} filled with three translucent shimmering holographic echoes of the cosmic creature refracting rainbow light across every wall.`,
          p3: `Prismatic mirror rebound inside empty ${locationVisual}: glowing beams bounce between glossy vintage mirrors and ${safeGadget1}, spinning into a breathtaking kaleidoscope ring of ${palette.energyFx}.`,
          p4: `Peaceful sunlit stillness with no humans: serene wide interior shot of clear light streaming through spotless dust-free glass across quiet ${locationVisual}, with one tiny rainbow glass prism gleaming on a windowsill.`,
          videoBeat1: `inside uninhabited ${locationVisual}, shimmering holographic mirages of the cosmic creature orbit across glossy vintage mirrors`,
          videoBeat2: `refracted prism waves rebound between mirrored glass into a spinning kaleidoscope ring of ${palette.energyFx}`,
          outroBeat1: `all the shimmering mirages chime and fold harmoniously back into a single bright prism spark that vanishes upward`,
          outroBeat2: `the mirrors clear completely as three blank holographic rainbow cards materialize along the sunlit ledge`,
          outroBeat3: `spotless empty ${locationVisual} glows peacefully in quiet stillness`,
        },
        'rooftop-skyline': {
          p1: `Looking up from the empty street outside ${locationVisual} under ${atmosphere} with no humans: dramatic low-angle view gazing up at the glowing neon roof sign as swirling aurora clouds gather overhead.`,
          p2: `High-altitude overhead view with no people: dramatic vista looking down past the glowing rooftop neon awning of ${locationVisual} as the massive cosmic creature emerges into the mist-filled empty plaza below.`,
          p3: `Skyward aurora pillar with no humans: a towering spiraling beacon of ${palette.energyFx} erupts straight from ${locationVisual} up into the starry sky, lifting the cosmic creature's swirling light clouds skyward.`,
          p4: `Peaceful empty suburban skyline with no people: serene rooftop parapet overlooking twinkling quiet suburban neighborhood lights beneath a clear calm sky.`,
          videoBeat1: `high above empty ${locationVisual}, swirling aurora mist curls around the neon roof sign as the giant cosmic creature rises into the plaza below`,
          videoBeat2: `a towering harmonious pillar of ${palette.energyFx} sweeps straight upward from the rooftop into the night sky`,
          outroBeat1: `the soaring aurora beacon blooms silently above the roofline like gentle starlight fireworks before fading clear`,
          outroBeat2: `soft glowing sparkles settle onto the empty rooftop parapet, forming three gleaming blank holographic trading cards`,
          outroBeat3: `the quiet neighborhood lights twinkle peacefully across the calm horizon`,
        },
        'flashlight-recon': {
          p1: `Atmospheric late-night exterior of empty ${locationVisual} under ${atmosphere} with no humans: warm amber streetlamps and colorful neon reflections across quiet damp pavement.`,
          p2: `Dramatic spotlight cutting the dark inside empty ${locationVisual} with no people: a single shaft of bright window light cuts through swirling fog to suddenly reveal the cosmic creature's glowing eyes and giant silhouette.`,
          p3: `Swirling aisle energy inside uninhabited ${locationVisual}: loose vintage flyers and sparks lift skyward in a sweeping halo of ${palette.energyFx} rippling past rows of retro displays.`,
          p4: `Warm still close-up with no humans: three glowing blank rainbow holographic cards resting beside a warm vintage lantern on a quiet polished counter.`,
          videoBeat1: `inside dimly lit uninhabited ${locationVisual}, a sharp shaft of glowing light cuts through drifting mist revealing the giant cosmic creature`,
          videoBeat2: `a bright sweeping halo of ${palette.energyFx} ripples down the narrow aisle, calming the creature in mid-motion`,
          outroBeat1: `the glowing fog clears gently as the cosmic creature dissolves upward into shimmering dust motes`,
          outroBeat2: `a fanned trio of gleaming blank rainbow holographic cards rests softly on the polished retro counter`,
          outroBeat3: `quiet vintage fixtures hum peacefully in the empty settled room`,
        },
        'scale-flip': {
          p1: `Miniature overhead diorama view of uninhabited ${locationVisual} under ${atmosphere} with no people: crisp bird's-eye dollhouse perspective looking down across the entire layout as one corner begins glowing intensely.`,
          p2: `Extreme ant-scale macro floor perspective inside empty ${locationVisual} with no humans: looking sharply upward past towering table legs and giant retro arcade tokens at the colossal cosmic creature rising like a skyscraper.`,
          p3: `Architectural side-profile cutaway of uninhabited ${locationVisual}: showing glowing rafters, ceiling ducts, and lower aisles simultaneously as ${safeGadget1} releases a shimmering cascade of ${palette.energyFx} from above.`,
          p4: `Crisp macro still-life close-up with no people: a single vintage glass snowglobe resting on a counter containing a tiny peaceful glowing miniature reflection of ${locationVisual}.`,
          videoBeat1: `from an extreme ant-scale floor viewpoint inside empty ${locationVisual}, towering retro fixtures frame the skyscraper-sized cosmic creature surging overhead`,
          videoBeat2: `from the rafters above, a shimmering prism cascade of ${palette.energyFx} drifts smoothly down, shrinking the distortion into calm equilibrium`,
          outroBeat1: `the colossal cosmic creature folds gently down into a tiny warm spark floating into a glass curio jar`,
          outroBeat2: `three crisp blank holographic trading cards lean neatly beside the glowing miniature glass dome`,
          outroBeat3: `the macro camera glides slowly back across the peaceful settled tabletop`,
        },
        'season-warp': {
          p1: `Sudden indoor winter snowstorm inside empty ${locationVisual} under ${atmosphere} with no humans: glowing frost crystals, hanging icicles, and gentle snowflakes swirl across the neon retro shelves as the cosmic creature appears.`,
          p2: `Instant lush tropical bloom inside uninhabited ${locationVisual} with no people: giant luminescent emerald ferns, glowing vines, and warm golden pollen sprout wildly around vintage displays and the towering cosmic creature.`,
          p3: `Dramatic indoor autumn-leaf cyclone inside empty ${locationVisual}: thousands of glowing amber maple leaves and vintage flyers spiral into a radiant vortex of ${palette.energyFx} circling the cosmic creature.`,
          p4: `Fresh sunlit spring morning inside peaceful empty ${locationVisual} with no people: sparkling morning dew drops glisten across spotless retro counters beneath a soft indoor rainbow arc.`,
          videoBeat1: `inside empty ${locationVisual}, indoor snow flurries transform seamlessly into blooming glowing tropical vines around the towering cosmic creature`,
          videoBeat2: `a swirling indoor cyclone of golden autumn leaves and ${palette.energyFx} sweeps the room clean into fresh sunlit spring clarity`,
          outroBeat1: `the seasonal whirlwind melts peacefully into warm golden sunbeams and drifting flower petals`,
          outroBeat2: `three gleaming blank holographic cards rest dry and sparkling on a dew-kissed counter beneath a rainbow prism`,
          outroBeat3: `quiet spring light fills empty ${locationVisual} in serene harmony`,
        },
        'classic-showdown': {
          p1: `Wide exterior threshold view outside empty ${locationVisual} under ${atmosphere} with no humans: swinging entrance doors drift slightly ajar as iridescent shimmer spills out onto the quiet pavement.`,
          p2: `Dramatic solo reveal deep inside uninhabited ${locationVisual}: tight atmospheric portrait of the towering cosmic creature rising out of swirling mist amid ${palette.energyFx}.`,
          p3: `Widescreen resonance discharge inside empty ${locationVisual} with no people: ${safeGadget1} and ${safeGadget2} perched on a central console project a blazing arc of ${palette.energyFx} directly toward the glowing cosmic creature.`,
          p4: `Clean 90-degree top-down overhead flat-lay still life on scuffed retro tiles inside empty ${locationVisual} showing cooled ${safeGadget1}, ${safeGadget2}, gleaming brass tokens, and three blank shimmering rainbow holographic foil trading cards.`,
          videoBeat1: `inside empty ${locationVisual}, vintage ${safeGadget1} and ${safeGadget2} power up automatically on a counter facing the advancing cosmic creature`,
          videoBeat2: `a blazing linear wave of ${palette.energyFx} streams cleanly across the room, gently calming the glowing creature`,
          outroBeat1: `the cosmic creature shimmers and dissolves upward into ribbons of holographic light as empty ${locationVisual} snaps back to normal`,
          outroBeat2: `those shimmering light ribbons condense onto the scuffed tiles into three gleaming blank rainbow holographic trading cards`,
          outroBeat3: `quiet room lights flicker steadily back on over the sparkling cards on the floor`,
        },
      }
    : {
        'chase-trap': {
          p1: `Sudden mid-chase sprint inside ${locationVisual} under ${atmosphere}: ${protag} races urgently toward the camera glancing over ${pPoss} shoulder while the towering cosmic creature bursts through background displays in a trail of ${palette.energyFx}.`,
          p2: `Tense hide-and-seek suspense inside ${locationVisual}: tight close-up of ${protag} crouched silently behind a cluttered retro counter holding ${safeGadget1} close while the cosmic creature's gigantic glowing shadow sweeps directly across the wall overhead.`,
          p3: `Clever environmental trap springing inside ${locationVisual}: wide dynamic angle as ${protag} pulls a heavy hanging cable or topples a glowing retro display rig, triggering a dazzling domino chain reaction that tangles the surprised cosmic creature in swirling ribbons of ${palette.energyFx} (no laser beams).`,
          p4: `Relieved victorious breath-catcher outside ${locationVisual}: calm shot of ${protag} resting by the front curb steps catching ${pPoss} breath while tiny glowing stars drift peacefully upward from the building behind.`,
          videoBeat1: `${protag} races around a cluttered retro counter in ${locationVisual} while the cosmic creature surges close behind knocking floating props aside`,
          videoBeat2: `${protag} pulls a heavy overhead fixture cord, triggering a brilliant domino trap of glowing cables and ${palette.energyFx} that wraps cleanly around the startled creature`,
          outroBeat1: `the tangled cosmic creature lets out a resonant musical chime and gently dissolves into floating ribbons of starlight as ${locationVisual} settles down`,
          outroBeat2: `three shimmering blank holographic cards flutter gently down like falling leaves onto the curb beside the front steps`,
          outroBeat3: `${protag} rests by the steps in happy relief, collecting the glowing cards under the quiet sky`,
        },
        'zero-g-chaos': {
          p1: `Astonishing zero-gravity anomaly inside ${locationVisual} bathed in ${atmosphere}: chairs, stools, arcade tokens, retro boxes, and neon fixtures float effortlessly off the floor while ${protag} grips a bolted counter in wide-eyed wonder.`,
          p2: `Weightless leap through floating debris inside ${locationVisual}: dynamic tilted mid-air view of ${protag} pushing off a floating display shelf, weaving gracefully between drifting retro objects toward the cosmic creature hovering upside-down at the center of the room.`,
          p3: `High-stakes gravity core anchor inside ${locationVisual}: tight kinetic close-up as ${protag} floats right up to the swirling vortex center and latches ${safeGadget1} onto the glowing nexus, sending expanding golden rings of ${palette.energyFx} snapping outward across the ceiling and walls.`,
          p4: `Soft grounded landing inside ${locationVisual}: cozy low-angle scene after gravity gently returns, showing ${protag} amidst harmlessly scattered retro props and fallen tokens while a single glowing prism shimmers softly on a tilted shelf.`,
          videoBeat1: `inside weightless ${locationVisual}, tables and retro boxes drift slowly in mid-air as ${protag} pushes off a floating shelf toward the hovering cosmic creature`,
          videoBeat2: `${protag} clips ${safeGadget1} right into the swirling floating vortex core, erupting in concentric golden rings of ${palette.energyFx} as normal gravity gently pulls everything downward`,
          outroBeat1: `floating retro objects drift softly back onto the floor as the glowing cosmic creature unwinds upward into harmless pastel mist`,
          outroBeat2: `three gleaming blank holographic cards settle smoothly onto an overturned crate beside ${protag}`,
          outroBeat3: `${protag} scoops up the shimmering cards and takes in the calm settled room`,
        },
        'portal-hop': {
          p1: `Surreal doorway discovery inside ${locationVisual} under ${atmosphere}: framing ${protag} standing before an ordinary back-room doorway that glows wildly open into an impossible neon-horizon cosmic dimension filled with floating geometric islands.`,
          p2: `Stepping across worlds: dramatic side-angle view right on the glowing threshold as ${protag} moves halfway through the luminous portal archway while sideways gravity pulls retro posters and glowing dust into the starlit void.`,
          p3: `Showdown inside the alternate cosmic pocket: breathtaking wide surreal vista of a dreamlike floating starfield mirror-version of ${locationVisual}, where ${protag} vaults across hovering checkered platforms outmaneuvering the gigantic glowing cosmic creature amid ${palette.energyFx}.`,
          p4: `Returning safely to reality: cheerful candid floor-level frame of ${protag} landing cleanly back inside ordinary quiet ${locationVisual} in relief as the glowing doorway clicks shut into a normal everyday door.`,
          videoBeat1: `inside the surreal starfield mirror-version of ${locationVisual}, ${protag} leaps effortlessly across hovering geometric platforms while the gigantic cosmic creature spirals around`,
          videoBeat2: `${protag} activates ${safeGadget1} and ${safeGadget2} on the central platform, weaving a brilliant luminous ring of ${palette.energyFx} that folds the portal smoothly back toward home`,
          outroBeat1: `the swirling starfield doorway folds inward in brilliant iridescent waves as ${protag} crosses cleanly back into normal ${locationVisual}`,
          outroBeat2: `as the doorway returns to ordinary wood and glass, three gleaming blank holographic cards appear resting on the threshold`,
          outroBeat3: `${protag} collects the glowing cards happily inside the quiet settled hallway`,
        },
        'harmonic-truce': {
          p1: `Playful chaotic malfunction inside ${locationVisual} under ${atmosphere}: the oversized cosmic creature is bouncing clumsily through the background making neon signs spin and vintage displays flicker while ${protag} peers around a side aisle.`,
          p2: `Gentle musical calibration: warm tight close-up of ${protag} carefully adjusting glowing analog dials on ${safeGadget1}, sending soft glowing sound-wave rings drifting through the air as the curious cosmic creature leans down listening with tilted head.`,
          p3: `Synchronized cosmic crescendo: breathtaking wide painterly vista of ${protag} and the towering cosmic creature standing peacefully side-by-side at the center of ${locationVisual} bathed in swirling aurora ribbons of ${palette.energyFx} as warped shelves straighten harmoniously.`,
          p4: `Heartwarming farewell: intimate close-up of the shrunk cosmic creature as a tiny warm glowing starlight orb hovering gently right beside ${protag} before drifting peacefully upward toward the skylights.`,
          videoBeat1: `${protag} calmly adjusts the glowing dials on ${safeGadget1} inside ${locationVisual}, sending soft rhythmic rings of warm light floating gently toward the restless cosmic creature`,
          videoBeat2: `the creature's chaotic static softens into glowing harmony as ${protag} and the creature stand together inside a breathtaking swirling aurora of ${palette.energyFx}`,
          outroBeat1: `the peaceful cosmic creature shrinks into a warm glowing starlight firefly that circles ${protag} playfully once before floating up through the skylight`,
          outroBeat2: `soft sparkles drift down and settle into three warm shimmering blank holographic trading cards`,
          outroBeat3: `${protag} watches warmly toward the open skylight as ${locationVisual} glows peacefully`,
        },
        'machine-overload': {
          p1: `Urgent warning signs inside ${locationVisual} under ${atmosphere}: dramatic angled close-up of blinking amber and crimson console gauges, humming transformers, and buzzing overhead fixtures while ${protag} rushes toward the back control wall.`,
          p2: `Looming presence behind glass: suspenseful layered frame with ${protag} working urgently at a messy retro control panel of glowing toggle switches and coiled cables in the foreground while the giant cosmic creature presses right up against a frosted glass window directly behind ${pObj}.`,
          p3: `Last-second breaker flip: kinetic low-angle freeze-frame of ${protag} reaching dramatically to pull a massive industrial switch lever on the wall just as the cosmic creature surges forward, flooding the entire room in a blinding harmonic wave of ${palette.energyFx}.`,
          p4: `Warm power restored: peaceful wide shot of cozy golden lights humming steadily back on across quiet ${locationVisual} as ${protag} leans comfortably beside the calm control console.`,
          videoBeat1: `while the giant cosmic creature looms behind a glowing glass partition in ${locationVisual}, ${protag} rushes across the floor dodging sparks toward the main vintage power lever`,
          videoBeat2: `${protag} pulls the massive breaker lever down, unleashing a sweeping harmonic pulse of ${palette.energyFx} across every fixture in the room`,
          outroBeat1: `the harmonic surge calms the overloaded machinery as the cosmic creature dissolves smoothly into peaceful glowing static`,
          outroBeat2: `warm golden room lights flicker steadily back on while three blank shimmering holographic cards slide cleanly out of the console slot`,
          outroBeat3: `${protag} gathers the gleaming cards and switches off the humming console in relief`,
        },
        'noir-mystery': {
          p1: `Mysterious clue discovery inside ${locationVisual} under ${atmosphere}: moody low-angle view of ${protag} inspecting glowing iridescent footprints and softly humming melted arcade tokens leading deep into the shadowed aisles.`,
          p2: `Silent widescreen first contact: dramatic symmetrical architectural wide shot showing BOTH ${protag} on the far near side and the towering cosmic creature standing silently at the opposite end of the long misty corridor of ${locationVisual}.`,
          p3: `Surreal tilted reality bend: dizzying dramatic angle inside ${locationVisual} as walls and checkered floors curve upward around them while ${protag} moves along a banked aisle launching a bright arc of ${palette.energyFx} from ${safeGadget1} toward the creature's glowing core.`,
          p4: `Quiet dawn walk-away: poetic wide exterior frame of ${protag} strolling across a misty empty suburban lot at cool pale dawn, glancing back once at the peaceful normal facade of ${locationVisual}.`,
          videoBeat1: `across the long misty corridor of ${locationVisual}, walls and tiles tilt surreally as ${protag} navigates along a banked display rack toward the towering cosmic creature`,
          videoBeat2: `${protag} snaps ${safeGadget1} into phase alignment, sending a crisp geometric wave of ${palette.energyFx} snapping the crooked room cleanly back to ninety-degree reality`,
          outroBeat1: `the warped corridor straightens with a soft chime as the cosmic creature fades gently into drifting morning mist`,
          outroBeat2: `a gleaming trio of blank holographic cards rests quietly on the damp doorstep outside as pale light breaks`,
          outroBeat3: `${protag} collects the cards and heads peacefully across the quiet morning lot`,
        },
        'mirror-decoy': {
          p1: `Uncanny mirror reveal inside ${locationVisual} under ${atmosphere}: medium side view of ${protag} gazing into a glossy storefront window or polished chrome mirror — the real room behind looks completely empty, yet the towering cosmic creature is visible ONLY inside the reflection.`,
          p2: `Hall of holographic mirages: dazzling wide interior view of ${locationVisual} filled with three translucent shimmering holographic decoys of the cosmic creature refracting rainbow light across every wall as ${protag} navigates calmly between them.`,
          p3: `Mirror-bounce counterplay: kinetic low-angle action shot as ${protag} angles gleaming reflective ${safeGadget1} sharply, bouncing the cosmic creature's own blinding prism wave straight back into a spinning kaleidoscope ring of ${palette.energyFx}.`,
          p4: `Peaceful sunlit stillness: serene wide interior shot of clear light streaming through spotless dust-free glass across quiet ${locationVisual} beside ${protag}, with one tiny shimmering rainbow glass prism catching light on a windowsill.`,
          videoBeat1: `surrounded by shimmering holographic mirages inside ${locationVisual}, ${protag} pivots swiftly angling gleaming reflective ${safeGadget1} as the real cosmic creature surges forward`,
          videoBeat2: `the creature's prism wave strikes the reflective surface and rebounds into a breathtaking spinning kaleidoscope ring of ${palette.energyFx}`,
          outroBeat1: `all the shimmering mirages chime and fold harmoniously back into a single bright prism spark that rises and vanishes`,
          outroBeat2: `the mirror surfaces clear completely as three blank holographic rainbow cards materialize neatly along the sunlit ledge`,
          outroBeat3: `${protag} collects the cards calmly and heads toward the bright exit`,
        },
        'rooftop-skyline': {
          p1: `Looking up from the street outside ${locationVisual} under ${atmosphere}: dramatic low-angle outdoor establishing view gazing past ${protag} up at the glowing neon roof sign as swirling aurora clouds gather above the building.`,
          p2: `High-altitude vantage point: thrilling overhead perspective of ${protag} perched atop the glowing neon awning or balcony overlook of ${locationVisual}, surveying the massive cosmic creature emerging into the mist-filled plaza below.`,
          p3: `Skyward diversion leap: breathtaking dynamic mid-air shot capturing ${protag} launching off the high marquee ledge while channeling ${safeGadget1} and ${safeGadget2} to sweep the cosmic creature's swirling energy straight upward into the starry sky like a giant beacon of ${palette.energyFx}.`,
          p4: `Peaceful suburban skyline exhale: serene wide closing view of ${protag} resting peacefully beside a rooftop parapet overlooking twinkling quiet suburban neighborhood lights under the clear sky.`,
          videoBeat1: `from atop the glowing neon marquee of ${locationVisual}, ${protag} drops dynamically downward through swirling mist toward the towering cosmic creature in the plaza below`,
          videoBeat2: `${protag} sweeps ${safeGadget1} skyward, channeling the creature's swirling energy straight up into the sky in a towering pillar of ${palette.energyFx}`,
          outroBeat1: `the soaring aurora beacon blooms peacefully high above the roofline like silent starlight fireworks before fading clear`,
          outroBeat2: `soft glowing sparkles rain gently onto the rooftop parapet, forming three gleaming blank holographic trading cards`,
          outroBeat3: `${protag} collects the cards safely and looks out peacefully over the glowing neighborhood horizon`,
        },
        'flashlight-recon': {
          p1: `Atmospheric late-night arrival outside ${locationVisual} under ${atmosphere}: wide moody street view with glowing reflections as ${protag} approaches the shadowy vintage building carrying ${safeGadget1}.`,
          p2: `Flashlight beam cutting the dark: dramatic high-contrast chiaroscuro interior shot deep inside unlit ${locationVisual}, where a single bright cone of light projected by ${protag} cuts through swirling fog to suddenly reveal the cosmic creature's glowing eyes and giant silhouette.`,
          p3: `Close-quarters counter vault: kinetic tight-angle action frame inside the narrow aisle as the cosmic creature sweeps forward sending floating papers skyward while ${protag} vaults agilely over a retro counter in a swirling wake of ${palette.energyFx}.`,
          p4: `Quiet recovery & heading home: warm medium close-up of ${protag} holding three gleaming blank rainbow holographic cards while stepping peacefully back out into the calm humming night.`,
          videoBeat1: `deep inside dimly lit ${locationVisual}, a bright flashlight beam from ${protag} sweeps across fog to reveal the giant cosmic creature surging down the narrow aisle`,
          videoBeat2: `${protag} vaults smoothly over a counter in one fluid motion, triggering a bright sweeping halo of ${palette.energyFx} from ${safeGadget1} that calms the creature mid-stride`,
          outroBeat1: `the glowing fog clears gently as the cosmic creature dissolves upward into soft shimmering dust motes inside quiet ${locationVisual}`,
          outroBeat2: `a fanned trio of gleaming blank rainbow holographic cards rests softly on the polished counter beside ${protag}`,
          outroBeat3: `${protag} gathers the glowing cards and exits peacefully into the calm evening air`,
        },
        'scale-flip': {
          p1: `Miniature overhead diorama view of ${locationVisual} under ${atmosphere}: crisp bird's-eye dollhouse perspective looking straight down across the entire layout where tiny ${protag} investigates a brightly glowing corner.`,
          p2: `Extreme ant-scale macro floor perspective inside ${locationVisual}: looking sharply upward past towering table legs and oversized floor tiles from beside ${protag} toward the colossal skyscraper-sized cosmic creature looming overhead.`,
          p3: `Architectural side-profile cutaway view of ${locationVisual}: showing rafters, upper walkways, and main aisles at once as ${protag} moves high along an overhead catwalk releasing a shimmering cascade of ${palette.energyFx} from ${safeGadget1} straight down over the cosmic creature.`,
          p4: `Crisp macro still-life close-up: ${protag} admiring a single vintage glass snowglobe on a shelf containing a tiny peaceful glowing miniature reflection of ${locationVisual}.`,
          videoBeat1: `from a dramatic ant-scale floor viewpoint inside ${locationVisual}, towering shelves frame ${protag} gazing up at the colossal cosmic creature surging overhead`,
          videoBeat2: `from an elevated walkway above, ${protag} triggers a shimmering prism cascade of ${palette.energyFx} from ${safeGadget1}, gently shrinking the distortion back to calm scale`,
          outroBeat1: `the colossal cosmic creature folds down into a tiny warm spark floating safely into a glass curio jar`,
          outroBeat2: `three crisp blank holographic trading cards appear leaning neatly beside the glowing miniature glass jar`,
          outroBeat3: `${protag} smiles at the peaceful miniature glow and collects the shimmering cards`,
        },
        'season-warp': {
          p1: `Sudden indoor winter snowstorm inside ${locationVisual} under ${atmosphere}: glowing frost crystals, icicles, and swirling snowflakes suddenly coat the retro neon shelves as ${protag} braces against the chilly gust while the cosmic creature manifests.`,
          p2: `Instant lush tropical bloom inside ${locationVisual}: giant luminescent emerald ferns, glowing vines, and warm golden pollen sprout wildly around vintage displays as ${protag} climbs across overgrown counters toward the towering cosmic creature.`,
          p3: `Dramatic indoor autumn-leaf cyclone inside ${locationVisual}: thousands of glowing amber leaves and vintage paper flyers spiral into a radiant vortex of ${palette.energyFx} circling the cosmic creature while ${protag} anchors the storm using ${safeGadget1}.`,
          p4: `Fresh sunlit spring morning inside peaceful ${locationVisual}: sparkling dew drops glisten on spotless retro counters beneath a soft indoor rainbow arc as ${protag} pauses warmly beside the sunlit window.`,
          videoBeat1: `inside ${locationVisual}, indoor snow flurries transform instantly into blooming glowing tropical vines around ${protag} and the towering cosmic creature`,
          videoBeat2: `${protag} lifts ${safeGadget1} into a swirling indoor cyclone of golden autumn leaves and ${palette.energyFx}, clearing the storm into bright spring clarity`,
          outroBeat1: `the seasonal whirlwind melts peacefully into warm golden sunbeams and drifting flower petals`,
          outroBeat2: `three gleaming blank holographic cards settle dry and sparkling on a sunlit counter beside ${protag}`,
          outroBeat3: `${protag} enjoys the fresh quiet morning light filling ${locationVisual}`,
        },
        'classic-showdown': {
          p1: `Wide exterior threshold arrival outside ${locationVisual} under ${atmosphere}: ${protag} pushes open the glowing entrance doors holding ${safeGadget1} and ${safeGadget2} as strange shimmer spills onto the pavement.`,
          p2: `Dramatic solo reveal deep inside ${locationVisual}: tight atmospheric close-up of the towering cosmic creature rising out of swirling mist amid ${palette.energyFx}.`,
          p3: `Widescreen full-body showdown inside ${locationVisual}: dynamic low-angle view with ${protag} braced on the left projecting a blazing beam of ${palette.energyFx} from ${safeGadget1} and ${safeGadget2} straight across toward the advancing cosmic creature on the right.`,
          p4: `Clean 90-degree top-down overhead flat-lay still life on scuffed retro tiles inside ${locationVisual} showing cooled ${safeGadget1}, ${safeGadget2}, gleaming brass arcade tokens, and three blank shimmering rainbow holographic foil trading cards.`,
          videoBeat1: `the camera glides past ${protag} bracing on the left of ${locationVisual} linking ${safeGadget1} and ${safeGadget2} while the cosmic creature advances on the right`,
          videoBeat2: `a blazing linear beam of ${palette.energyFx} streams across the room, gently pushing the glowing creature back into calm stillness`,
          outroBeat1: `the cosmic creature shimmers and dissolves upward into ribbons of glowing holographic light as ${locationVisual} snaps back to normal`,
          outroBeat2: `those shimmering light ribbons condense onto the scuffed floor beside ${protag} into three gleaming blank rainbow holographic trading cards`,
          outroBeat3: `${protag} gathers the sparkling cards and glides calmly out through the glowing exit doors into the quiet air`,
        },
      };

  const arc = storyArcScripts[activeArcMeta.id] || storyArcScripts['chase-trap'];

  // 8 DISTINCT CUTAWAY GIF #1 & #2 SCENES
  const gif1Cutaways = [
    `a glowing vintage 1990s CRT monitor beside ${safeGadget1} on a shelf as colorful radar waveforms ripple across the glass screen and ${palette.energyFx} shimmer along the chrome edges`,
    `an extreme macro view of ${safeGadget1}'s translucent plastic casing and analog indicator dials lighting up in rhythmic pulses while colorful reflections sweep across the polished counter`,
    `a row of vintage 1990s neon wall lamps and hanging plastic tags inside ${locationVisual} gently swaying and shimmering in slow-motion anti-gravity ripples`,
    `a glossy puddle or waxed floor reflection inside ${locationVisual} rippling outward in concentric glowing rings beneath flickering retro fixtures`,
    `a row of vintage analog gauges, cassette reels, and indicator bulbs inside ${locationVisual} spinning rapidly and glowing in hypnotic alternating rhythms`,
    `a dusty skylight ceiling fan inside ${locationVisual} spinning slowly backward as glowing iridescent prism motes drift upward past hanging retro banners`,
    `a row of vintage vending-machine glass buttons and glowing coin slots inside ${locationVisual} flickering in musical wave patterns with shimmering ${palette.energyFx}`,
    `a spinning translucent vinyl record or glowing cassette deck reel on a countertop inside ${locationVisual} radiating concentric rings of ${palette.energyFx}`,
  ];

  const gif2Cutaways = [
    `looking straight up at the glowing ceiling lights of ${locationVisual} as a shimmering violet skylight portal softly closes overhead, drifting slow sparkling motes downward through mist`,
    `a peaceful wide close-up of three gleaming blank rainbow holographic trading cards glinting gently in a soft halo of floating light atop a retro counter`,
    `an atmospheric low pan across settling iridescent stardust and drifting wisps of warm amber and cyan mist swirling slowly past retro fixtures inside ${locationVisual}`,
    `a calm window view looking out from ${locationVisual} as colorful cosmic aurora ribbons fade smoothly into a peaceful sky`,
    `a quiet outdoor neon sign humming steadily outside ${locationVisual} as gentle mist drifts past gleaming damp pavement`,
    `a vintage analog desk clock inside ${locationVisual} gently ticking forward again as frost and iridescent sparkles melt softly away`,
    `a row of clean glass marbles and brass tokens rolling gently to a peaceful stop across sunlit retro tiles inside ${locationVisual}`,
    `a warm tabletop still-life of a glowing glass snowglobe and three blank shimmering foil cards resting quietly by a bright window`,
  ];

  const castHeaderLine = isPureWorld
    ? `Characters: ${heroLook.fullDescription}.`
    : heroLook.mode === 'drone'
    ? `Protagonist across all panels: ${heroLook.fullDescription}.`
    : `Protagonist across all panels: ${heroLook.fullDescription}.`;

  const freshStoryLead = isPureWorld
    ? `Brand-new standalone atmospheric visual story featuring uninhabited retro architecture with no human figures anywhere, an all-new location, and an all-new artistic medium completely unrelated to any earlier images.`
    : `Brand-new standalone visual story featuring an all-new protagonist, all-new wardrobe and silhouette, all-new location, and an all-new artistic medium completely unrelated to any earlier images.`;

  // 1-4 Individual Shot Prompts (synced 100% to the rolled Visual Medium, Story Arc & Hero Cast!)
  const shot01WideArchitecture = sanitizeVisualPromptText(
    `${freshStoryLead} A 16:9 widescreen scene rendered in ${flowArtStyle}. ${castHeaderLine} Cosmic creature: ${safeCreature}. ${arc.p1}`
  );
  const shot02AnomalyPortrait = sanitizeVisualPromptText(
    `A 16:9 widescreen scene rendered in ${flowArtStyle}. ${castHeaderLine} Cosmic creature: ${safeCreature}. ${arc.p2}`
  );
  const shot03LowAngleAction = sanitizeVisualPromptText(
    `A 16:9 widescreen action frame rendered in ${flowArtStyle}. ${castHeaderLine} Cosmic creature: ${safeCreature}. ${arc.p3}`
  );
  const shot04TabletopGearFlatlay = sanitizeVisualPromptText(
    `A 16:9 widescreen closing frame rendered in ${flowArtStyle}. ${castHeaderLine} ${arc.p4}`
  );

  // 5-6 Standalone GIF Prompts
  const gif01Act1TensionLoop = sanitizeVisualPromptText(
    `A 4-second seamless 16:9 looping ${palette.videoType} at 24fps in ${flowArtStyle}. Close-up cutaway scene: ${gif1Cutaways[plan.gif1Idx % gif1Cutaways.length]} in a smooth continuous loop.`
  );
  const gif02Act3AftermathLoop = sanitizeVisualPromptText(
    `A 4-second seamless 16:9 looping ${palette.videoType} at 24fps in ${flowArtStyle}. Atmospheric closing cutaway: ${gif2Cutaways[plan.gif2Idx % gif2Cutaways.length]} in a calm continuous loop.`
  );

  // 7. Lead 16:9 Hero Cinema Video Prompt
  const leadVideo16x9 = sanitizeVisualPromptText(
    `A 4-second 16:9 ${palette.videoType} at 24fps in ${flowArtStyle}. Inside ${locationVisual} under ${lightingClean}, featuring ${heroLook.fullDescription} and ${safeCreature}: ${arc.videoBeat1}; then ${arc.videoBeat2} as the scene hits a dramatic grounded finish. Audio: ${leadAudioClean}`
  );

  // 8. Story-Synced 3-Act Synth Soundtrack Prompt
  const synthSongPrompt = sanitizeVisualPromptText(
    `1990s suburban cosmic story soundtrack (118 BPM, 45-60s instrumental) structured to follow the 3-Act Zine story in "${location}": [0:00-0:15 Act I Tension] mysterious analog cassette synth drone, buzzing fluorescent hum, and creeping bass pulse; [0:15-0:42 Act II Action] punchy FM synthwave bassline, gated 16-bit snare drums, and electric guitar power chords erupting for "${synergy}"; [0:42-0:60 Act III Aftermath] warm, nostalgic midnight synth pads and shimmering bell arpeggios fading into quiet resolution. Strictly instrumental, no vocals.`
  );

  // 9. External 3-Act Long-Form Story Prompt (Fun, spooky 1990s Goosebumps paperback style!)
  const storyGeneratorPrompt = `Write a fun, spooky, fast-paced 1990s Goosebumps-style paperback story (~750 words total) broken into 3 Acts with EXACTLY 3 punchy paragraphs per Act (labeled "ACT 01", "ACT 02", and "ACT 03"):
- Title: ${encounter.entity_name}
- Setting: ${location}
- Hero: ${charClean}
- Spooky Monster: ${anomaly}
- Cool 90s Gear: ${rawArtifact} + ${rawWeapon} (Combo Trick: ${synergy})
- Weird Spooky Sign: ${distortion}
STYLE RULES: Keep the vocabulary super fun, simple, and easy to read (like a classic 1990s spooky kid-adventure paperback — NO heavy technical jargon, NO big textbook sci-fi words!). Use short suspenseful sentences, funny nervous dialogue, creepy sound effects, a cliffhanger at the end of Act 01, a wild slapstick-spooky showdown in Act 02, and a classic playful Goosebumps twist ending in Act 03 where a shiny holographic trading card left behind does one sneaky spooky thing at the very end!`;

  // 0A. MASTER 1-PROMPT 2x2 SEQUENTIAL SHEET (16 Visual Mediums x 12 Story Arcs x 24 Cast Silhouettes x 10 Atmospheres x 6 Camera Grammars!)
  const masterStoryboard2x2Prompt = sanitizeVisualPromptText(
`${freshStoryLead}

${palette.gridIntro}, created strictly in ${flowArtStyle}, divided cleanly into two equal columns and two equal rows.

Setting: ${locationVisual} with ${atmosphere}. ${castHeaderLine} Cosmic creature: ${safeCreature}.

Top-left panel: ${arc.p1}
Top-right panel: ${arc.p2}
Bottom-left panel: ${arc.p3}
Bottom-right panel: ${arc.p4}`
  );

  // 0A-SAFE. ULTRA-SAFE MINIMAL BACKUP (keeps chosen visual medium, cast silhouette, AND a fresh distinct arc!)
  const backupArcMeta = STORYBOARD_STORY_ARCS[(resolvedArcIdx + 3) % STORYBOARD_STORY_ARCS.length];
  const backupArc = storyArcScripts[backupArcMeta.id] || arc;
  const masterStoryboardUltraSafePrompt = sanitizeVisualPromptText(
`${freshStoryLead}

${palette.gridIntro}, created strictly in ${flowArtStyle}.

${castHeaderLine} Friendly glowing retro sci-fi creature: a whimsical towering neon crystal-and-chrome robot floating in swirling starlight.

Top-left panel: ${backupArc.p1.replaceAll(locationVisual, 'a vibrant 1990s retro neon plaza')}
Top-right panel: ${backupArc.p2.replaceAll(locationVisual, 'the colorful retro hall')}
Bottom-left panel: ${backupArc.p3.replaceAll(locationVisual, 'the glowing retro hall')}
Bottom-right panel: ${backupArc.p4.replaceAll(locationVisual, 'the calm retro plaza')}`
  );

  // 0B. SAME-CHAT GIF #1 FOLLOW-UP (MATCHES EXACT VISUAL MEDIUM!)
  const sameChatGif1FollowupPrompt = sanitizeVisualPromptText(
    `In the exact same ${palette.medium} and ${palette.colors} look as the four-panel image above, create a 4-second seamless 16:9 looping ${palette.videoType} showing a brand-new close-up cutaway scene: ${gif1Cutaways[plan.gif1Idx % gif1Cutaways.length]} in a smooth continuous loop.`
  );

  // 0C. SAME-CHAT GIF #2 FOLLOW-UP (MATCHES EXACT VISUAL MEDIUM!)
  const sameChatGif2FollowupPrompt = sanitizeVisualPromptText(
    `In the exact same ${palette.medium} and ${palette.colors} look as the four-panel image above, create a 4-second seamless 16:9 looping ${palette.videoType} showing a brand-new atmospheric cutaway scene: ${gif2Cutaways[plan.gif2Idx % gif2Cutaways.length]} in a calm continuous loop.`
  );

  // 0D. SAME-CHAT LEAD VIDEO #1 (8-SECOND ACT II CLIMAX MATCHING THIS EXACT ARC, CAST & VISUAL MEDIUM!)
  const videoCastClause = isPureWorld
    ? 'with no human characters anywhere'
    : `keeping the exact look of ${protag}`;
  const sameChatVideoFollowupPrompt = sanitizeVisualPromptText(
    `In the exact same ${palette.medium}, ${palette.colors} lighting, and cosmic creature design from the bottom-left panel above (${videoCastClause}), create an 8-second 16:9 ${palette.videoType} inside ${locationVisual} with no dialogue. First three seconds: ${arc.videoBeat1}. Middle three seconds: ${arc.videoBeat2}. Final two seconds: the glowing effects settle cleanly into a steady grounded finish. Audio: vibrant 1990s synthwave swells, crystalline energy chimes, and retro ambient hum.`
  );

  // 0E. SAME-CHAT FINALE VIDEO #2 (8-SECOND ACT III ENDING MATCHING THIS EXACT ARC, CAST & VISUAL MEDIUM!)
  const sameChatOutroVideoPrompt = sanitizeVisualPromptText(
    `In the exact same ${palette.medium} and ${palette.colors} lighting from the four-panel image above (${videoCastClause}), create an 8-second 16:9 closing finale ${palette.videoType} inside ${locationVisual} with no dialogue. First three seconds: ${arc.outroBeat1}. Middle three seconds: ${arc.outroBeat2}. Final two seconds: ${arc.outroBeat3}. Audio: sweeping crystalline chimes, gentle ambient warmth, soft ambience, and nostalgic 1990s synth pads fading out.`
  );

  return {
    resolvedVisualStyleId: palette.id,
    resolvedVisualStyleLabel: `${palette.emoji} ${palette.shortLabel}`,
    resolvedStoryArcId: activeArcMeta.id,
    resolvedStoryArcLabel: `${activeArcMeta.emoji} ${activeArcMeta.shortLabel}`,
    resolvedHeroLookId: heroLook.id,
    resolvedHeroLookLabel: `${heroLook.emoji} ${heroLook.shortLabel}`,
    resolvedAtmosphereLabel: atmosphereObj.label,
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
  const charFull = encounter.featured_character || "Dex 'Neon-Drift' Kowalski";
  const charShort = charFull.split('(')[0].trim() || charFull;
  const anomalyName =
    encounter.anomaly_name ||
    (encounter.card_type === 'bad_guy'
      ? encounter.entity_name
      : 'Dimensional Breach Anomaly');
  const weapon =
    encounter.protagonist_loadout?.improvised_weapon || 'Improvised Hardware Rig';
  const artifact =
    encounter.protagonist_loadout?.nostalgia_artifact || '199X Pocket Artifact';
  const synergy =
    encounter.protagonist_loadout?.weird_synergy_effect || 'Harmonic Overdrive';

  const { morphology, environment, presets } = getChoreographyPresetsForCard(
    encounter.entity_name || anomalyName,
    loc,
    encounter.card_type || 'bad_guy',
    weapon,
    artifact,
    charFull
  );

  const seedNum = hashString(`${encounter.entity_name}|${loc}|${issueNumber}`);
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
    title: encounter.entity_name,
    classification:
      encounter.card_type === 'good_guy'
        ? '199X HERO ISSUE'
        : encounter.critical_smash
        ? 'OMEGA ANOMALY SPECIAL'
        : '199X ANOMALY CHRONICLE',
    sectorTag: encounter.theme_set_badge || environment.badge.toUpperCase(),
    actPhase: `${morphology.badge} • ${encounter.status_affliction || 'CONDITION AMBER'}`,
    location: loc,
    anomalyName,
    characterName: charShort,
    characterFull: charFull,
    weapon,
    artifact,
    synergy,
    lightingMood: environment.lightingCue,
    cameraAngle: presets[0]?.camera || 'Dynamic Low-Angle 24fps Tracking Shot',
    witnessPerspective: `${charShort} • Field Loadout Recon`,
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
