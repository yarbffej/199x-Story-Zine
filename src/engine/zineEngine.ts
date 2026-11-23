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
  const anomaly =
    anomalyOverride ||
    encounter.anomaly_name ||
    encounter.entity_name ||
    'The Neon Shadow Monster';
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
    `Pitch dark. Dead quiet. Then—*THUMP. THUMP. THUMP.* Something massive stomped straight out into the center aisle! When the emergency lights blinked back on in spooky red, there it stood—glowing, grinning, and towering almost to the rafters: ${anomaly}! And tonight, ${location} belonged entirely to the monster.`,
    `*CREEEAK.* The gigantic shadow stretched across the back wall... taller... wider... and then peeled completely off the wall! Out of a swirling cloud of glowing neon fog stepped ${anomaly}, rattling every single shelf in ${location}. No humans. No rules. Showtime!`,
    `A loud *ZAP!* shook the ceiling tiles, and a bright whirlpool of rainbow sparks spun open right in the middle of ${location}. Rising straight out of the glowing mist like a runaway midnight movie monster was ${anomaly}—bright eyes flashing, wild energy crackling, and ready to turn the whole place upside down!`,
    `Right inside the glossy front window glass, a gigantic spooky reflection appeared—even though the aisle looked empty! One second later—*POP!*—${anomaly} stepped right through the shimmer into full view, letting out a wild echoing rattle that shook loose half the ceiling tiles!`,
    `Suddenly, every buzzing sound cut out completely. Total, creepy silence. Then—*BOOM!*—two display racks slid sideways and ${anomaly} burst straight into the open, crackling with wild neon sparks! Whatever had kept this crazy creature sleeping all day had finally snapped wide open!`,
    `A mischievous echoing laugh bounced off every corner of ${location} at once. Up from the scuffed floor tiles swirled a glittering neon tornado—and out popped ${anomaly}, bigger and wilder than anything in a horror comic! Every arcade screen and store lamp flashed wildly to welcome its new boss.`,
    `Wait a second. That gigantic glowing shape creeping past the front counter wasn't a store display—it was MOVING! Stretching all the way up toward the skylights, ${anomaly} shook off a shower of glowing sparks and grinned wide across empty ${location}.`,
    `One last flicker of the overhead lights, and *FZZZT!*—the air smelled like burnt popcorn and electric sparks. Looming straight out of the darkest corner of ${location} was ${anomaly}, glowing brighter than ten pinball machines on multiball at once!`,
  ];

  const act2Openers = [
    `${anomaly} wasted ZERO seconds! With a joyful, booming rattle, the monster swept straight down the main aisle of ${location}, sending stacks of 90s boxes, bright wrappers, and shiny tokens spinning up toward the ceiling like a crazy indoor parade!`,
    `The whole empty room went completely bonkers! ${anomaly} bounced off the back wall in a blaze of neon glow, rattling every glass case and turning ordinary shelves into a wild glowing playground. *CRASH! CLATTER! BOING!*`,
    `With a huge *WHOOSH!*, ${anomaly} sent a rippling wave of sparkling color rolling right across the waxed floor of ${location}. Stools lifted two feet into mid-air, old store signs spun around like pinwheels, and the monster loomed right in the middle of the chaos!`,
    `${anomaly} wasn't holding back at all! Charging through ${location} like a runaway roller coaster made of neon sparks, the giant monster turned the whole deserted building into a glowing haunted funhouse—lights flashing like a disco party gone completely wild!`,
    `First a shelf wobbled. Then the whole aisle tilted! Towering proudly at the heart of ${location}, ${anomaly} whirled its glowing energy through every corner until forgotten toys, cassette tapes, and brass coins orbited around it like tiny colorful moons!`,
    `No one was around to tell ${anomaly} to quiet down—so the monster went all out! With a sizzling *CRACKLE-POP!*, it surged past the deserted front counter, making every buzzer, bell, and neon tube in ${location} sing at top volume!`,
    `Right down the center of empty ${location}, ${anomaly} put on the wildest after-hours show in town! Giant glowing ribbons shot off the walls, retro displays jittered to life, and the monster stretched higher and brighter with every passing second!`,
    `*KA-BOOM!* Not a scary boom—a wild, electric rainbow boom! ${anomaly} zoomed from one end of ${location} to the other, tossing clouds of neon glitter and spinning every loose fixture into a crazy late-night tornado!`,
  ];

  const act2Middles = [
    `Right in the middle of the mess, the forgotten ${artifact} and the ${weapon} slid straight across the shaking counter and slammed together—*CLICK-BZZZT!* Instantly, a dazzling chain reaction fired off ${funTrick}, blasting bright rainbow waves right into ${anomaly}'s glowing swirl!`,
    `Even the weird 1990s junk on the shelves couldn't sit still anymore! The vibrating ${artifact} tumbled right onto the ${weapon}—*WHIRRR-DING!*—setting off an accidental fireworks burst of ${funTrick} that made ${anomaly} spin around in total surprise!`,
    `Every plug, dial, and button inside ${location} hit overdrive at the exact same second! The ${artifact} sparked straight into the ${weapon}, unleashing a wild, bouncing wave of ${funTrick} that lit up the whole empty room like the Fourth of July!`,
    `Caught up in ${anomaly}'s swirling neon breeze, the ${artifact} and the ${weapon} clattered together in mid-air—*KA-ZING!* Suddenly, a gigantic glowing burst of ${funTrick} erupted across ${location}, turning the ceiling into a spinning kaleidoscope!`,
    `At the peak of the monster mayhem, ${anomaly} brushed right past the buzzing ${artifact} and the ${weapon} on the counter. *BEEP-BEEP-ZAP!* Out roared a sizzling super-wave of ${funTrick}, swirling around the giant creature like a runaway neon lasso!`,
    `Higher and brighter grew the monster's glow—until the overloaded ${artifact} popped right against the ${weapon}! *ZAP-POP!* Together they unleashed ${funTrick} in a massive wave of color that shook every windowpane in ${location}!`,
    `The whole building hummed like a giant stereo cranked past ten! Swirling straight through the glowing air, the ${artifact} and ${weapon} triggered ${funTrick}—wrapping ${anomaly} in dazzling streaks of light like a pinball machine hitting super jackpot!`,
    `Just when ${anomaly} reached full giant size, every neon sign in ${location} blinked at once alongside the buzzing ${artifact} and ${weapon}. *BOOOOM!* A wild storm of ${funTrick} flooded every aisle from floor to rafters!`,
  ];

  const act2Closers = [
    `That did it! Caught right in the middle of its own wild ${funTrick} storm, ${anomaly} wobbled like a giant glowing bowl of Jell-O, spun around three super-fast times, and let out a goofy *BWOOOOP!* With one huge sparkling *POP!* of rainbow confetti light, the monster shrank smaller and smaller—and vanished straight into thin air!`,
    `As the first pale hint of sunrise peeked past the curtains, ${anomaly}'s glowing outline fizzled, popped, and unraveled like a giant spool of neon ribbon spiraling straight up to the rafters. One last twinkling *WHOOSH!*—and poof! Gone without a trace!`,
    `Spinning faster and faster like a gigantic neon top, ${anomaly} floated upward in a swirl of dazzling starlight. With a funny whistling sound like a deflating balloon, the monster zipped into one tiny bright dot—and blinked out completely!`,
    `Wrapped tight inside a glowing ring of ${funTrick}, ${anomaly} jittered, flickered like an old TV losing channel 3, and—*BLINK!*—exploded into a harmless shower of warm golden sparkles drifting gently down across empty ${location}.`,
    `For two breathless seconds, ${location} glowed bright enough to spot from the moon. Then—*SNAP!*—every crazy floating box, token, and retro prop dropped softly right back onto its shelf, and ${anomaly} melted away into a puff of glittering mist.`,
    `One final booming chuckle echoed off the ceiling before ${anomaly} folded inward with a crisp *POP!* Instantly, the neon storm died down, the weird indoor wind stopped, and the wild flashing lights inside ${location} blinked calmly back to normal.`,
    `A huge flash of purple and gold swept from wall to wall across ${location}—and then total stillness! When the sparkling haze cleared a second later, ${anomaly} was completely gone, leaving only tiny shimmering sparks floating lazily like sleepy fireflies.`,
    `With a dramatic *FZZZT-POP!*, ${anomaly} burst into a hundred harmless glowing soap bubbles that drifted toward the ceiling and blinked out one by one. Every rattling shelf settled back down. The weird hum stopped completely.`,
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
    `Wait a second—what was that shiny rectangle lying right on the floor where ${anomaly} had popped? Resting face-up in a sunbeam was a brand-new, super-glossy holographic trading card, still warm to the touch, with a bright foil picture of ${anomaly} right on the front! The room stayed dead quiet... except for the sneaky little moment when the monster on the card winked.`,
    `Right on the front counter sat something that definitely wasn't there yesterday: a gleaming rainbow foil trading card showing ${anomaly} frozen mid-leap! Everything inside ${location} looked completely over—right up until the shiny card wiggled half an inch to the left and let out one tiny, muffled giggle.`,
    `Tucked neatly beside a brass token near the front door lay a crisp holographic trading card sparkling with rainbow foil! On the front, ${anomaly} grinned straight out of the shiny cardstock. High above the quiet doorway, the switched-off neon sign suddenly blinked twice and spelled: SEE YOU NEXT ISSUE.`,
    `Right by the entrance sat a freshly minted holographic trading card with ${anomaly} glaring playfully off the foil! The whole empty building stayed silent for five whole seconds... and then, if you looked closely at the card, wait a minute—wasn't the monster facing LEFT a second ago?!`,
    `Sitting neatly in the exact center of the counter was a glowing Series 2 holographic trading card of ${anomaly}! The midnight haunt was over. Totally over. At least... until the card slid across the polished laminate with a tiny, familiar *BZZZT*.`,
    `Right on the doorstep lay a shimmering rainbow trading card, glowing faintly like a night-light with ${anomaly} trapped right inside the foil. Behind it, the empty glass window of ${location} fogged up all by itself with one cheeky drawn smiley face... and then cleared away.`,
    `Lying right where the monster had vanished was a gleaming holographic card, shimmering softly in the quiet morning light. Everything was calm and still inside ${location}—until the shiny foil card gave one tiny playful tap... tap... tap against the counter.`,
    `A sudden glint caught the morning sun on the floor of ${location}: a brand-new holographic trading card of ${anomaly}, sparkling with rainbow foil and still faintly warm! As the sun climbed higher outside, the tiny shadow cast by the card stretched across the counter—and sprouted two wiggly glowing antennae.`,
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

// 10 WILDLY DISTINCT BAD-GUY-ONLY MONSTER VIBES / STAGING MOODS (ZERO HUMAN HEROES!)
export const STORYBOARD_MONSTER_MOODS: StoryboardHeroLook[] = [
  {
    id: 'colossal-giant',
    emoji: '🌋',
    shortLabel: 'Colossal Towering Giant',
    mode: 'pure-world',
    colorFamily: 'colossal',
    fullDescription:
      'uninhabited 1990s location with no human figures anywhere; the sole star is the monster at colossal skyscraper-like indoor scale, dwarfing shelves, arcade cabinets, and ceiling rafters',
    stagingCue: 'colossal ceiling-scraping scale looming dramatically over tiny retro fixtures',
  },
  {
    id: 'mischievous-trickster',
    emoji: '😈',
    shortLabel: 'Mischievous Slapstick Trickster',
    mode: 'pure-world',
    colorFamily: 'trickster',
    fullDescription:
      'uninhabited 1990s location with no human figures anywhere; the sole star is the mischievous wide-eyed monster playfully juggling floating retro objects and tipping cluttered displays',
    stagingCue: 'playful chaotic mischief tossing vintage toys, coins, and props across the room',
  },
  {
    id: 'shadow-lurker',
    emoji: '🌒',
    shortLabel: 'Eerie Backlit Shadow Lurker',
    mode: 'pure-world',
    colorFamily: 'shadow',
    fullDescription:
      'uninhabited 1990s location with no human figures anywhere; the sole star is the eerie backlit monster emerging out of deep moody fog with glowing eyes piercing the mist',
    stagingCue: 'dramatic backlit mystery silhouette with glowing eyes shining through curling fog',
  },
  {
    id: 'neon-disco-overdrive',
    emoji: '🪩',
    shortLabel: 'Neon Disco Prism Overdrive',
    mode: 'pure-world',
    colorFamily: 'disco',
    fullDescription:
      'uninhabited 1990s location with no human figures anywhere; the sole star is the monster bursting with dazzling kaleidoscope prism beams, flashing arcade colors, and mirror-ball reflections',
    stagingCue: 'blinding neon disco kaleidoscope bursts bouncing off every glossy surface',
  },
  {
    id: 'haunted-frost-fog',
    emoji: '❄️',
    shortLabel: 'Haunted Frost & Fog Apparition',
    mode: 'pure-world',
    colorFamily: 'frost',
    fullDescription:
      'uninhabited 1990s location with no human figures anywhere; the sole star is the monster trailing curling clouds of shimmering icy mist with sparkling frost creeping across glass and counters',
    stagingCue: 'shimmering frost crystals, misty breath-like vapor clouds, and chilled glowing reflections',
  },
  {
    id: 'poltergeist-vortex',
    emoji: '🌀',
    shortLabel: 'Swirling Poltergeist Vortex',
    mode: 'pure-world',
    colorFamily: 'vortex',
    fullDescription:
      'uninhabited 1990s location with no human figures anywhere; the sole star is the monster centered inside a wild levitating cyclone of orbiting 1990s cassettes, coins, boxes, and flyers',
    stagingCue: 'a spinning gravity-defying cyclone of orbiting retro objects swirling around the monster',
  },
  {
    id: 'scale-growth-surge',
    emoji: '🔬',
    shortLabel: 'Miniature-to-Giant Growth Surge',
    mode: 'pure-world',
    colorFamily: 'growth',
    fullDescription:
      'uninhabited 1990s location with no human figures anywhere; the sole star is the monster starting small beside tabletop relics in early frames before surging to gigantic room-filling scale',
    stagingCue: 'dramatic size shift growing from tabletop curio scale to massive room-filling titan',
  },
  {
    id: 'bioluminescent-relic',
    emoji: '✨',
    shortLabel: 'Glowing Firefly Bioluminescence',
    mode: 'pure-world',
    colorFamily: 'bioluminescent',
    fullDescription:
      'uninhabited 1990s location with no human figures anywhere; the sole star is the luminous monster radiating magical firefly-like bioluminescent patterns and drifting glowing spores',
    stagingCue: 'ethereal bioluminescent glow surrounded by hundreds of tiny floating starlight fireflies',
  },
  {
    id: 'museum-diorama-spook',
    emoji: '🏛️',
    shortLabel: 'Haunted Spotlight Diorama',
    mode: 'pure-world',
    colorFamily: 'diorama',
    fullDescription:
      'uninhabited 1990s location with no human figures anywhere; the sole star is the monster posed with theatrical eerie grandeur inside crisp spotlight beams like a haunted exhibit coming alive',
    stagingCue: 'theatrical museum-gallery spotlight cones illuminating every tactile detail of the monster',
  },
  {
    id: 'cartoon-reality-bender',
    emoji: '🌈',
    shortLabel: 'Surreal Wavy Reality Bender',
    mode: 'pure-world',
    colorFamily: 'surreal',
    fullDescription:
      'uninhabited 1990s location with no human figures anywhere; the sole star is the monster warping checkered floor tiles, walls, and vintage signage into impossible wavy dreamlike curves',
    stagingCue: 'playful surreal bent walls, wavy checkerboard floors, and impossible dreamlike geometry',
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

const VARIETY_STORAGE_KEY = '199x_zine_badguy_variety_v3';
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

  const flowArtStyle = `${palette.medium}, color palette of ${palette.colors}, ${cameraGrammar}, borderless edge-to-edge full-bleed visuals, and blank surfaces with no words or lettering`;

  // 12 COMPLETELY DIFFERENT 4-SCENE BAD-GUY-ONLY ARCS (100% Monster Spotlight, ZERO Human Heroes!)
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

  const storyArcScripts: Record<string, StoryArcScript> = {
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

  const castHeaderLine = `Monster staging: ${monsterMood.fullDescription}, emphasizing ${monsterMood.stagingCue}.`;
  const freshStoryLead = `Brand-new standalone atmospheric monster showcase featuring an uninhabited 1990s location with no human characters anywhere, an all-new creature design, and an all-new artistic medium completely unrelated to any earlier images.`;

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
  const storyGeneratorPrompt = `Write a fun, spooky, fast-paced 1990s Goosebumps-style MONSTER-ONLY paperback story (~750 words total) broken into 3 Acts with EXACTLY 3 punchy paragraphs per Act (labeled "ACT 01", "ACT 02", and "ACT 03"):
- Star Bad Guy Monster: ${anomaly} (100% Bad Guy focus — DO NOT include any human hero or Good Guy vs. Bad Guy battle!)
- Spooky After-Hours Setting: ${location}
- Haunted 90s Relics Sitting in the Shop: ${rawArtifact} & ${rawWeapon} (Wild Burst: ${synergy})
- Weird Spooky Sign: ${distortion}
STYLE RULES: Keep the vocabulary super fun, simple, and easy to read (like a classic 1990s spooky paperback — NO heavy technical jargon, NO big textbook sci-fi words, and NO human hero!). Tell what happens right after closing time when nobody is around and this monster takes over the whole place! Use short suspenseful sentences, creepy sound effects, a cliffhanger when the monster wakes up in Act 01, wild spooky-funny mayhem in Act 02, and a classic sneaky Goosebumps twist ending in Act 03 where a shiny holographic trading card left on the counter does one spooky little thing!`;

  // 0A. MASTER 1-PROMPT 2x2 SEQUENTIAL SHEET (16 Visual Mediums x 12 Bad-Guy Arcs x 10 Monster Vibes x 10 Atmospheres x 6 Camera Grammars!)
  const masterStoryboard2x2Prompt = sanitizeVisualPromptText(
`${freshStoryLead}

${palette.gridIntro}, created strictly in ${flowArtStyle}, divided cleanly into two equal columns and two equal rows.

Setting: ${locationVisual} with ${atmosphere}. ${castHeaderLine} Featured monster across panels: ${safeCreature}.

Top-left panel: ${arc.p1}
Top-right panel: ${arc.p2}
Bottom-left panel: ${arc.p3}
Bottom-right panel: ${arc.p4}`
  );

  // 0A-SAFE. ULTRA-SAFE MINIMAL BACKUP (keeps chosen visual medium, monster vibe, zero humans & distinct arc!)
  const backupArcMeta = STORYBOARD_STORY_ARCS[(resolvedArcIdx + 3) % STORYBOARD_STORY_ARCS.length];
  const backupArc = storyArcScripts[backupArcMeta.id] || arc;
  const masterStoryboardUltraSafePrompt = sanitizeVisualPromptText(
`${freshStoryLead}

${palette.gridIntro}, created strictly in ${flowArtStyle}.

${castHeaderLine} Friendly glowing retro creature: a whimsical towering luminous crystal-and-neon storybook guardian floating in swirling starlight.

Top-left panel: ${backupArc.p1.replaceAll(locationVisual, 'a vibrant empty 1990s retro neon plaza')}
Top-right panel: ${backupArc.p2.replaceAll(locationVisual, 'the colorful uninhabited retro hall')}
Bottom-left panel: ${backupArc.p3.replaceAll(locationVisual, 'the glowing empty retro hall')}
Bottom-right panel: ${backupArc.p4.replaceAll(locationVisual, 'the calm uninhabited retro plaza')}`
  );

  // 0B. SAME-CHAT GIF #1 FOLLOW-UP (MATCHES EXACT VISUAL MEDIUM!)
  const sameChatGif1FollowupPrompt = sanitizeVisualPromptText(
    `In the exact same ${palette.medium} and ${palette.colors} look as the four-panel image above (with no human figures anywhere), create a 4-second seamless 16:9 looping ${palette.videoType} showing a brand-new close-up cutaway scene: ${gif1Cutaways[plan.gif1Idx % gif1Cutaways.length]} in a smooth continuous loop.`
  );

  // 0C. SAME-CHAT GIF #2 FOLLOW-UP (MATCHES EXACT VISUAL MEDIUM!)
  const sameChatGif2FollowupPrompt = sanitizeVisualPromptText(
    `In the exact same ${palette.medium} and ${palette.colors} look as the four-panel image above (with no human figures anywhere), create a 4-second seamless 16:9 looping ${palette.videoType} showing a brand-new atmospheric cutaway scene: ${gif2Cutaways[plan.gif2Idx % gif2Cutaways.length]} in a calm continuous loop.`
  );

  // 0D. SAME-CHAT LEAD VIDEO #1 (8-SECOND ACT II MONSTER MAYHEM MATCHING THIS EXACT ARC, VIBE & VISUAL MEDIUM!)
  const sameChatVideoFollowupPrompt = sanitizeVisualPromptText(
    `In the exact same ${palette.medium}, ${palette.colors} lighting, and monster design from the bottom-left panel above (with no human characters anywhere, keeping ${monsterMood.stagingCue}), create an 8-second 16:9 ${palette.videoType} inside empty ${locationVisual} with no dialogue. First three seconds: ${arc.videoBeat1}. Middle three seconds: ${arc.videoBeat2}. Final two seconds: the glowing effects settle cleanly into a steady grounded finish. Audio: vibrant 1990s synthwave swells, crystalline energy chimes, and spooky retro ambient hum.`
  );

  // 0E. SAME-CHAT FINALE VIDEO #2 (8-SECOND ACT III ENDING MATCHING THIS EXACT ARC & VISUAL MEDIUM!)
  const sameChatOutroVideoPrompt = sanitizeVisualPromptText(
    `In the exact same ${palette.medium} and ${palette.colors} lighting from the four-panel image above (with no human characters anywhere), create an 8-second 16:9 closing finale ${palette.videoType} inside empty ${locationVisual} with no dialogue. First three seconds: ${arc.outroBeat1}. Middle three seconds: ${arc.outroBeat2}. Final two seconds: ${arc.outroBeat3}. Audio: sweeping crystalline chimes, gentle ambient warmth, soft ambience, and nostalgic 1990s synth pads fading out.`
  );

  return {
    resolvedVisualStyleId: palette.id,
    resolvedVisualStyleLabel: `${palette.emoji} ${palette.shortLabel}`,
    resolvedStoryArcId: activeArcMeta.id,
    resolvedStoryArcLabel: `${activeArcMeta.emoji} ${activeArcMeta.shortLabel}`,
    resolvedHeroLookId: monsterMood.id,
    resolvedHeroLookLabel: `${monsterMood.emoji} ${monsterMood.shortLabel}`,
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
