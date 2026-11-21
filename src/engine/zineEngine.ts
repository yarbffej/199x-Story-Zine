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

export function buildLongForm3ActChronicle(
  encounter: CombatEncounter,
  anomalyOverride?: string
): ZineActs {
  const location = encounter.location || 'K&B Novelty Depot clearance aisle at 8:59 PM';
  const charFull = encounter.featured_character || "Dex 'Neon-Drift' Kowalski (199X Suburban Recon Operative)";
  const charShort = charFull.split('(')[0].trim() || 'The Operative';
  const anomaly =
    anomalyOverride ||
    encounter.anomaly_name ||
    (encounter.card_type === 'bad_guy'
      ? encounter.entity_name
      : 'Residual Dimensional Rift Anomaly');
  const weapon = encounter.protagonist_loadout?.improvised_weapon || 'modified hardware rig';
  const artifact = encounter.protagonist_loadout?.nostalgia_artifact || 'retro pocket artifact';
  const synergy = encounter.protagonist_loadout?.weird_synergy_effect || 'Harmonic Overdrive Resonance';
  const distortion = encounter.cosmic_distortion || 'Fluorescent ceiling tubes hum at impossible dimensional frequencies.';
  const affliction = encounter.status_affliction || 'Static-Shock Hallucinations';
  const ticker0 = encounter.combat_ticker?.[0] || `${anomaly} destabilizes the local suburban grid.`;
  const ticker1 = encounter.combat_ticker?.[1] || `${charShort} locks ${artifact} and ${weapon} into active phase alignment.`;

  const seed = hashString(`${encounter.entity_name}|${location}|${weapon}|${artifact}`);

  const act1Openers = [
    `At exactly one minute before closing time, ${location} had already slipped halfway out of standard suburban time and into something buzzing, airless, and electric. Along the scuffed checkerboard linoleum, forty-watt fluorescent ballast tubes flickered in an uneven three-beat cadence, casting pools of bruised violet and sodium-amber shadow between the deserted fixtures. Outside in the sodium-lit parking lot, not a single station wagon or hatchback moved; inside, the air tasted sharply of warm CRT ozone, floor wax, and copper coins.`,
    `Nobody in the neighborhood ever lingered around ${location} once the sun dropped behind the cul-de-sac treeline, and tonight the silence felt thick enough to snap like an over-wound cassette ribbon. Rows of forgotten 1990s hardware and sun-bleached display racks stretched toward the back exit in rigid perspective lines, bathed in the sickly cyan wash of an idling transformer box. Even the dust motes hanging beneath the ceiling vents had stopped drifting, pinned in mid-air by an invisible barometric drop.`,
    `The hum began forty feet beneath the concrete slab of ${location}, rising up through the metal shelving brackets until every loose price tag and wire rack vibrated in sympathetic harmony. Overhead, rain ticked against the skylights in slow, deliberate intervals, throwing streaked neon reflections across the empty corridor. It was the unmistakable signature of a late-night suburban breach—the exact moment mundane 199X architecture begins peeling at the corners.`,
  ];

  const act1Middles = [
    `${charShort} stepped past the threshold with boots planted light on the tiles, keeping one gloved hand resting near the ${weapon} while checking the analog readout rigged to the ${artifact}. Across the sector, the first unmistakable symptoms of ${affliction} were already taking hold: shadows detached themselves by half an inch from the objects casting them, and a faint static charge raised the fine hairs along ${charShort}'s forearms. ${distortion}`,
    `Crouching beside an overturned plastic crate to read the micro-vibrations in the floor, ${charShort} unclipped the ${artifact} and held it level toward the darkest recess of ${location}. Instead of normal ambient room noise, the air carried a low magnetic warble—the telltale carrier wave of ${affliction} saturating the building's wiring. Every reflective surface within thirty yards rippled like dark soda water as ${distortion.charAt(0).toLowerCase() + distortion.slice(1)}`,
    `From the far end of ${location}, a cold draft smelling of scorched circuit boards and cherry fog-machine vapor rolled low across the floor tiles. ${charShort} adjusted the strap of the ${weapon}, watching the indicator LEDs on the ${artifact} climb rapidly into the red zone as ${affliction} began warping depth perception down the corridor. Right on cue, ${distortion.charAt(0).toLowerCase() + distortion.slice(1)}`,
  ];

  const act1Closers = [
    `Then the ambient hum cut out completely, replaced by a sub-audible pressure wave that bowed the ceiling tiles inward. Out of the deepest pocket of shadow at the heart of ${location}, ${anomaly} began to uncoil into physical space, bending the surrounding neon glare around its silhouette like a lens. ${ticker0} There would be no backup from town tonight—only whatever improvised 199X engineering ${charShort} carried on their belt.`,
    `At the center of the warped geometry, space fractured with the crisp snap of an overloaded flyback transformer. ${anomaly} surged into full material density, radiating chromatic shockwaves that turned drifting dust into glittering geometric sparks across ${location}. ${ticker0} ${charShort} exhaled once, steadied their stance, and Thumb-clicked the ${artifact} into live combat calibration.`,
    `Before the emergency exit sign could finish its third blink, the breach locked into full manifestation. Towering amidst the skewed architecture of ${location}, ${anomaly} announced its arrival with a bone-rattling kinetic pulse that rattled every bolt in the framing. ${ticker0} Narrowing their eyes against the glare, ${charShort} brought the ${weapon} forward to meet the surge head-on.`,
  ];

  const act2Openers = [
    `The opening clash erupted across ${location} in a burst of pure 1990s graphic-novel velocity. ${anomaly} lunged first, lashing violent arcs of anomalous energy across the middle aisle and tearing deep gouges through metal trim and laminate paneling alike. Diving laterally beneath the initial sweep, ${charShort} skidded across the polished floor on scuffed sneakers, sparks kicking up as the ${weapon} deflected the leading edge of the shockwave by millimeters.`,
    `Zero warning separated the standoff from full-throttle kinetic collision. ${anomaly} drove forward with terrifying mass and unnatural agility, warping the local gravity pocket inside ${location} until loose bolts, tokens, and shattered plastic housings orbited waist-high in the air. ${charShort} vaulted cleanly over a buckled counter, planting one boot against a structural column to launch sideways out of the anomaly's crushing trajectory.`,
    `The first shockwave from ${anomaly} slammed down the length of ${location} like a runaway freight train made of static and neon. Ceiling louvers rattled loose as ${charShort} dropped into a low, balanced slide, bracing the ${weapon} with both hands to carve a clean defensive lane through the distortion field. Every impact echoed with the amplified crunch of overloaded arcade speakers.`,
  ];

  const act2Middles = [
    `With zero room left to retreat, ${charShort} slammed the ${artifact} directly against the housing of the ${weapon}, bridging their circuits in an audacious field modification. Instantly, the improvised coupling ignited ${synergy}—flooding the corridor with a brilliant counter-frequency halo that pushed back the crushing weight of ${affliction}. ${ticker1} Arcs of electric cyan and hot magenta energy danced along the length of the ${weapon}, turning everyday suburban salvage into a precision anomaly-breaker.`,
    `Remembering an old late-night schematic scribbled in the margins of a spiral notebook, ${charShort} twisted the dial on the ${artifact} past its factory stop and locked it onto the frame of the ${weapon}. The resulting feedback loop triggered ${synergy} with a deafening harmonic chord that rattled every pane of glass in ${location}. ${ticker1} Caught flat-footed by the sudden phase-shift, ${anomaly} recoiled as its outer distortion shield fractured like tempered ice.`,
    `Timing the pulse between two erratic voltage spikes, ${charShort} pressed the ${artifact} flush into the grip assembly of the ${weapon}. A blinding ribbon of chromatic resonance roared to life as ${synergy} engaged at peak output, slicing cleanly through the haze of ${affliction}. ${ticker1} For three heart-stopping seconds, the entire interior of ${location} lit up like a pinball playfield on jackpot multiball.`,
  ];

  const act2Closers = [
    `Pushing that momentum to the limit, ${charShort} sprinted up an inclined rack and drove a decisive, grounded strike straight through the core anchor sustaining ${anomaly}. No wasted motion, no theatricalflourish—just raw leverage, high-voltage synergy, and split-second 199X reflexes meeting cosmic impossibility at point-blank range. With a thunderous implosion of harmless prism sparks, the dimensional tether anchoring the breach snapped clean in two.`,
    `Refusing to let the anomaly re-anchor, ${charShort} planted both heels into the floor tiles and unleashed the full stored charge of ${synergy} from the ${weapon}. The beam met ${anomaly} dead-center, unraveling its chaotic form into harmless ribbons ofphosphorescent vapor that spiraled toward the rafters and vanished. One final shockwave rolled outward through ${location}, blowing open the double doors before dropping into sudden, ringing stillness.`,
    `In one fluid, grounded finish, ${charShort} pivoted behind a steel stanchion and channeled the surging resonance of the ${artifact} through the ${weapon}, pinning ${anomaly}'s dimensional rift until its unstable geometry collapsed inward on itself. A brilliant flash of ultraviolet and gold washed across the walls of ${location}, etching crisp comic-book silhouettes against every surface before the breach sealed shut with an audible vacuum pop.`,
  ];

  const act3Openers = [
    `Silence returned to ${location} all at once—not the heavy, suffocating dread of the breach, but the crisp, familiar quiet of a late 1990s night after a summer thunderstorm passes. Overhead, half the fluorescent strips hummed steadily back to warm white life while cool night air drifted in through a cracked transom window, carrying the faint smell of wet asphalt and pine needles. The oppressive grip of ${affliction} evaporated completely.`,
    `As the final ribbons of chromatic static dissolved above the rafters of ${location}, normal suburban gravity reasserted itself with a gentle clatter of settling plastic and brass tokens. The warped perspective lines along the floor tiles snapped smoothly back into true ninety-degree angles, leaving only faint scorch crescents and a dusting of iridescent frost where ${anomaly} had stood moments earlier.`,
    `For a long minute, the only sound inside ${location} was the rhythmic tick of cooling metal housings and the distant hum of a streetlamp ballast out by the curb. ${charShort} remained crouched in a textbook grounded stance until every sensor needle on the ${artifact} settled back to zero, confirming that the local spacetime seam had fused shut for good.`,
  ];

  const act3Middles = [
    `Lowering the ${weapon}, ${charShort} uncoupled the warm casing of the ${artifact} and blew a thin wisp of ozone smoke off its contacts. Despite running way past any sane voltage rating to sustain ${synergy}, the retro hardware held together with electrical tape, solder, and sheer 199X stubbornness. Across the room, the bizarre distortions that had twisted ${location} were already fading into ordinary scuff marks that the morning shift would blame on a faulty floor buffer.`,
    `Standing up and brushing glittering dimensional grit from their jacket sleeves, ${charShort} ran a quick diagnostic check over the ${weapon} and tucked the ${artifact} safely back into a padded utility pouch. Without the ambient surge feeding ${synergy}, the gear looked almost ordinary again—just beat-up 1990s neighborhood salvage carrying hairline heat-tints that proved what had happened here.`,
    `${charShort} walked the perimeter of ${location} once to make sure no secondary micro-rifts lingered behind the shelving bays. Beneath the sole of one sneaker, a handful of brass arcade tokens and fused plastic shards clinked across the tile—physical souvenirs from a clash nobody on the daytime town council would ever believe.`,
  ];

  const act3Closers = [
    `Right at the exact focal point where ${anomaly} had vanished, a single rectangle of condensed prismatic cardstock rested face-up on the floor, shimmering with a fresh Series 2 holographic foil sheen. ${charShort} scooped up the newly crystallized trading card, slipped it into a protective binder sleeve, and shouldered the ${weapon}. By the time the distant town clock struck the hour, ${location} stood quiet and secure—logged, archived, and ready for the next issue.`,
    `Resting squarely atop a scarred countertop at the center of ${location} was the unmistakable glint of a freshly minted Series 2 archival card, its embossed surface still warm from the dimensional collapse. ${charShort} pocketed the specimen alongside the ${artifact}, gave the quiet room one final nod, and stepped out under the sodium-orange streetlights into the cool 199X night.`,
    `Before slipping out the side service door of ${location}, ${charShort} spotted a gleaming prismatic card wedged neatly beside a cooled brass token—the unmistakable physical imprint left behind whenever an Omega-class anomaly is neutralized. Sliding the card into their jacket pocket and slinging the ${weapon} low, ${charShort} disappeared down the misty sidewalk before the first patrol headlights turned the corner.`,
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

const FEMALE_HERO_PATTERN =
  /\b(maya|mina|samira|chloe|tessa|cassie|kira|wendy|trixie|jenny|angela|brenda|valerie|nadia|brooke|tara|cindy|roxie|elena|sonia|evelyn|becca|lily|lyra|selene|asha|lunch lady|sarah|jessica|amanda|ashley|rachel|emily|hannah|megan|nicole|stephanie|heather|melissa|michelle|tiffany|amber|kimberly|christina|kelly|erin|laura|maria|lisa|karen|nancy|donna|susan|woman|female|girl|lady|queen|mom|mother|sister|she|her)\b/i;

const VETERAN_AGE_PATTERN =
  /\b(coach|officer|professor|arthur|dale|brenda|big mike|sgt|frank|dr\.|evelyn|stan|lunch lady|hank|detective|novak|wade|president|teacher|veteran|dad|warden|orthodontist)\b/i;

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
      match?.[2] || '1990s suburban recon explorer in authentic nineties streetwear'
    ).trim()
  );
  const seed = hashString(shortName.toLowerCase());

  const isFemale = FEMALE_HERO_PATTERN.test(charClean);
  const isVeteran = VETERAN_AGE_PATTERN.test(charClean);
  const genderNoun: 'female' | 'male' = isFemale ? 'female' : 'male';
  const pronounSubj: 'she' | 'he' = isFemale ? 'she' : 'he';
  const pronounPoss: 'her' | 'his' = isFemale ? 'her' : 'his';

  const ageBuild = isFemale
    ? isVeteran
      ? '38-year-old woman'
      : '28-year-old woman'
    : isVeteran
    ? '41-year-old man'
    : '28-year-old man';

  const femaleHair = [
    'shoulder-length chestnut-brown hair held back with neon clips',
    'chin-length jet-black angled bob haircut with bangs',
    'wavy copper-auburn hair tied in a high 1990s ponytail',
    'shoulder-length layered dark-blonde hair',
    'curly dark-brown hair pulled half-back',
    'short tousled espresso-brown shag haircut',
  ];
  const maleHair = [
    'short messy dark-brown 1990s parted curtains hair',
    'spiky jet-black hair',
    'short sandy-blonde hair under a backward 1990s cap',
    'wavy dark-chestnut hair pushed back',
    'clean dark buzz-fade haircut',
    'chin-length tousled brown grunge hair',
  ];
  const hairDesc = pickSeeded(isFemale ? femaleHair : maleHair, seed, 1);

  const traitLower = traitRaw.toLowerCase();
  let topDesc = '';
  if (traitLower.includes('windbreaker')) {
    topDesc = 'teal-and-magenta geometric 1990s nylon windbreaker zipped halfway over a white tee';
  } else if (traitLower.includes('leather flight jacket')) {
    topDesc = 'scuffed dark-brown 1990s leather flight jacket over a gray crew tee';
  } else if (traitLower.includes('denim vest')) {
    topDesc = 'studded blue denim vest over a charcoal hoodie with fingerless gloves';
  } else if (traitLower.includes('track jacket')) {
    topDesc = 'navy-and-crimson striped 1990s athletic track jacket';
  } else if (traitLower.includes('sensor vest')) {
    topDesc = 'neon-trimmed blacklight laser-tag vest over a purple long-sleeve shirt';
  } else if (traitLower.includes('crimson gi')) {
    topDesc = 'sleeveless crimson martial-arts gi top with black belt';
  } else if (traitLower.includes('corduroy')) {
    topDesc = 'tan corduroy blazer over a plaid button-down shirt';
  } else if (traitLower.includes('flannel')) {
    topDesc = 'red-and-black plaid 1990s flannel overshirt over a dark graphic-free tee';
  } else if (traitLower.includes('coveralls')) {
    topDesc = 'slate-blue mechanic coveralls rolled at the sleeves';
  } else if (traitLower.includes('spandex')) {
    topDesc = 'neon-cobalt 1990s aerobics jacket over athletic gear';
  } else {
    topDesc = pickSeeded(
      [
        'color-blocked teal-and-plum 1990s nylon windbreaker over a heather-gray tee',
        'faded indigo 1990s denim jacket with rolled sleeves over a crimson ringer tee',
        'forest-green and gold 1990s varsity bomber jacket',
        'charcoal-and-cyan 1990s retro track jacket',
        'burgundy overshirt jacket over a black turtleneck',
        'cobalt-blue 1990s utility vest over a white long-sleeve tee',
      ],
      seed,
      2
    );
  }

  const bottomDesc = traitLower.includes('inline skates') || traitLower.includes('rollerblade')
    ? 'baggy dark-wash 1990s jeans, knee pads, and neon inline skates'
    : pickSeeded(
        [
          'baggy dark-wash 1990s denim jeans and white-and-neon high-top sneakers',
          'charcoal 1990s cargo pants and scuffed black skate sneakers',
          'cuffed stonewashed blue jeans and retro cross-trainer sneakers',
        ],
        seed,
        3
      );

  const lockedSheet = `a ${ageBuild} with ${hairDesc}, wearing ${topDesc} with ${bottomDesc}`;

  return {
    genderNoun,
    pronounSubj,
    pronounPoss,
    shortRole: traitRaw,
    lockedSheet,
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
      'luminous cyan and hot-magenta neon energy lines',
      'shimmering ultraviolet-purple and electric-aqua crystal highlights',
      'glowing amber-gold and neon-teal starlight rings',
      'iridescent lime-green and coral-pink glowing contours',
      'warm molten-orange and cobalt-blue prismatic accents',
    ],
    seed,
    4
  );

  if (/(robot|toy|animatronic|automaton|vending|claw|jukebox|rewinder|drone|pinsetter)/i.test(lower) || morphologyId === 'mechanical_automaton') {
    return `"${cleanedName}", an imaginative towering 1990s retro sci-fi robot-automaton built from chunky vintage hardware, chrome dials, glowing glass screens, and ${glowPalette}`;
  }
  if (/(slime|ooze|slushie|soda|gum|candy|pizza|gel|gak|syrup|cream)/i.test(lower) || morphologyId === 'slime_ooze') {
    return `"${cleanedName}", a whimsical towering translucent jelly-and-crystal retro sci-fi creature swirling with fizzy bubbles and ${glowPalette}`;
  }
  if (/(modem|crt|tv|video|floppy|cd|cable|pixel|hologram|phone|stereogram|glitch|microchip|keyboard|console|pet)/i.test(lower) || morphologyId === 'cyber_signal') {
    return `"${cleanedName}", a quirky glowing 1990s holographic electronics creature made of floating vintage CRT screens, pixel waves, tangled retro cords, and ${glowPalette}`;
  }
  if (/(ribbon|cord|serpent|boa|tentacle|hose|wire|tape)/i.test(lower) || morphologyId === 'serpent_constricter') {
    return `"${cleanedName}", a sweeping serpentine retro sci-fi creature woven from iridescent floating magnetic tape ribbons, neon coils, and ${glowPalette}`;
  }
  if (/(swarm|cluster|token|figurine|plush|slammer|marionette|doll|shark|unicorn)/i.test(lower) || morphologyId === 'swarm_cluster') {
    return `"${cleanedName}", a fantastical floating 1990s retro-toy cosmic entity surrounded by orbiting holographic prisms and ${glowPalette}`;
  }
  return `"${cleanedName}", a towering imaginative 1990s cosmic sci-fi creature made of translucent vintage plastic, chrome rings, geometric prisms, and ${glowPalette}`;
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
];

const STORYBOARD_ART_PALETTES = STORYBOARD_VISUAL_STYLES;

const STORYBOARD_ATMOSPHERES: string[] = [
  'warm golden-hour late-afternoon sunlight slanting dramatically through dust motes and retro fixtures',
  'crisp violet twilight dusk as colorful vintage signs and lamps flicker brightly to life',
  'hazy pastel sunset glow with long geometric shadows and shimmering iridescent air',
  'clear starry deep-cobalt night sky with swirling aurora-like cosmic ribbons overhead',
  'bright retro indoor neon haze with glowing ceiling fixtures and floating starlight reflections',
  'misty post-rain evening air with colorful neon signage gleaming across damp surfaces',
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
  { id: 'classic-showdown', emoji: '🃏', shortLabel: 'Classic Clash & Holo Relic' },
];

interface StoryboardPlan {
  paletteIdx: number;
  arcIdx: number;
  atmoIdx: number;
  gif1Idx: number;
  gif2Idx: number;
}

const storyboardPlanCache = new Map<string, StoryboardPlan>();
const recentStoryboardPlans: StoryboardPlan[] = [];

function pickFreshIndex(length: number, seed: number, offset: number, avoid: number[]): number {
  const base = Math.abs(seed + offset * 97) % length;
  for (let step = 0; step < length; step++) {
    const candidate = (base + step) % length;
    if (!avoid.includes(candidate)) return candidate;
  }
  return base;
}

function getNonRepeatingStoryboardPlan(signature: string): StoryboardPlan {
  const cached = storyboardPlanCache.get(signature);
  if (cached) return cached;

  const seed = hashString(signature);
  const recentWindow = recentStoryboardPlans.slice(-4);

  const plan: StoryboardPlan = {
    paletteIdx: pickFreshIndex(STORYBOARD_ART_PALETTES.length, seed, 1, recentWindow.map((p) => p.paletteIdx)),
    arcIdx: pickFreshIndex(STORYBOARD_STORY_ARCS.length, seed, 3, recentWindow.map((p) => p.arcIdx)),
    atmoIdx: pickFreshIndex(STORYBOARD_ATMOSPHERES.length, seed, 2, recentWindow.slice(-3).map((p) => p.atmoIdx)),
    gif1Idx: pickFreshIndex(5, seed, 7, recentWindow.slice(-2).map((p) => p.gif1Idx)),
    gif2Idx: pickFreshIndex(5, seed, 8, recentWindow.slice(-2).map((p) => p.gif2Idx)),
  };

  storyboardPlanCache.set(signature, plan);
  if (storyboardPlanCache.size > 60) {
    const firstKey = storyboardPlanCache.keys().next().value;
    if (firstKey) storyboardPlanCache.delete(firstKey);
  }
  recentStoryboardPlans.push(plan);
  if (recentStoryboardPlans.length > 8) recentStoryboardPlans.shift();
  return plan;
}

export function compile199xZinePrompts(
  encounter: CombatEncounter,
  acts?: ZineActs,
  anomalyOverride?: string,
  visualStyleIdOverride?: string,
  storyArcIdOverride?: string
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

  const heroLock = buildConsistentHeroVisualLock(charClean);
  const safeCreature = toVisualSafeCreatureDescription(rawAnomaly, morphology.id);
  const lightingClean = sanitizeVisualPromptText(environment.lightingCue);
  const leadAudioClean = sanitizeVisualPromptText(leadPreset.audio);

  const planSignature = `${rawLocation}|${rawAnomaly}|${rawChar}|${rawWeapon}|${rawArtifact}|${encounter.visual_style || ''}|${encounter.card_theme || ''}`;
  const plan = getNonRepeatingStoryboardPlan(planSignature);
  const overrideStyle = visualStyleIdOverride
    ? STORYBOARD_VISUAL_STYLES.find((s) => s.id === visualStyleIdOverride)
    : undefined;
  const palette = overrideStyle || STORYBOARD_ART_PALETTES[plan.paletteIdx];
  const atmosphere = STORYBOARD_ATMOSPHERES[plan.atmoIdx];

  const resolvedArcIdx = storyArcIdOverride
    ? Math.max(0, STORYBOARD_STORY_ARCS.findIndex((a) => a.id === storyArcIdOverride))
    : plan.arcIdx;
  const activeArcMeta = STORYBOARD_STORY_ARCS[resolvedArcIdx];

  const flowArtStyle = `${palette.medium}, color palette of ${palette.colors}, borderless edge-to-edge full-bleed visuals, and blank surfaces with no words or lettering`;

  // 10 COMPLETELY DIFFERENT 4-SCENE NARRATIVE ARCS (breaks out of "solo hero -> solo monster -> zap -> cards on floor"!)
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
      p1: `Sudden mid-chase sprint inside ${locationVisual} under ${atmosphere}: the hero races at full speed directly toward the camera glancing urgently over ${heroLock.pronounPoss} shoulder while the towering cosmic creature bursts through background displays far behind in a trail of ${palette.energyFx}.`,
      p2: `Tense hide-and-seek suspense inside ${locationVisual}: tight close-up of the hero crouched silently behind a cluttered retro counter holding ${safeGadget1} close while the cosmic creature's gigantic glowing shadow sweeps directly across the wall overhead.`,
      p3: `Clever environmental trap springing inside ${locationVisual}: wide dynamic angle as the hero pulls a heavy hanging cable or topples a glowing retro display rig, triggering a dazzling domino chain reaction that tangles and catches the surprised cosmic creature in swirling ribbons of ${palette.energyFx} (no laser beams).`,
      p4: `Exhausted victorious breath-catcher outside ${locationVisual}: calm twilight shot of the hero sitting on the front curb steps catching ${heroLock.pronounPoss} breath with a relieved grin while tiny glowing stars drift peacefully upward from the building behind.`,
      videoBeat1: `the hero sprints frantically around a cluttered retro counter in ${locationVisual} while the cosmic creature surges close behind knocking floating props aside`,
      videoBeat2: `the hero yanks a heavy overhead fixture cord, triggering a brilliant domino trap of glowing cables and ${palette.energyFx} that wraps cleanly around the startled creature`,
      outroBeat1: `the tangled cosmic creature lets out a resonant musical chime and gently dissolves into floating ribbons of starlight as ${locationVisual} settles down`,
      outroBeat2: `three shimmering blank holographic cards flutter gently down like falling leaves onto the curb beside the front steps`,
      outroBeat3: `the ${heroLock.genderNoun} hero sits on the steps grinning in relief, pocketing the glowing cards under the quiet evening stars`,
    },
    'zero-g-chaos': {
      p1: `Astonishing zero-gravity anomaly inside ${locationVisual} bathed in ${atmosphere}: chairs, stools, arcade tokens, retro boxes, and neon fixtures float effortlessly off the floor in mid-air while the hero grabs onto a bolted counter in wide-eyed wonder.`,
      p2: `Weightless astronaut leap through floating debris inside ${locationVisual}: dynamic tilted mid-air view of the hero pushing off a floating display shelf, weaving gracefully between drifting retro objects toward the cosmic creature hovering upside-down at the center of the room.`,
      p3: `High-stakes gravity core anchor inside ${locationVisual}: tight kinetic close-up as the hero floats right up to the swirling center of the vortex and latches ${safeGadget1} onto the glowing nexus, sending expanding golden rings of ${palette.energyFx} snapping outward across the ceiling and walls.`,
      p4: `Soft grounded landing inside ${locationVisual}: cozy low-angle scene after gravity gently returns, showing the hero standing amidst harmlessly scattered retro props and fallen popcorn/tokens while a single glowing prism shimmers softly on a tilted shelf.`,
      videoBeat1: `inside weightless ${locationVisual}, tables and retro boxes drift slowly in mid-air as the hero pushes off a floating shelf like an astronaut toward the hovering cosmic creature`,
      videoBeat2: `the hero clips ${safeGadget1} right into the swirling floating vortex core, erupting in concentric golden rings of ${palette.energyFx} as normal gravity gently pulls everything downward`,
      outroBeat1: `floating retro objects drift softly back onto the floor as the glowing cosmic creature unwinds upward into harmless pastel mist`,
      outroBeat2: `three gleaming blank holographic cards settle smoothly onto an overturned crate beside the hero's sneakers`,
      outroBeat3: `the ${heroLock.genderNoun} hero brushes cosmic dust off ${heroLock.pronounPoss} jacket, scoops up the cards, and smiles across the quiet room`,
    },
    'portal-hop': {
      p1: `Surreal doorway discovery inside ${locationVisual} under ${atmosphere}: seen from behind the hero standing before an ordinary back-room doorway that glows wildly open into an impossible neon-horizon cosmic dimension filled with floating geometric islands.`,
      p2: `Stepping across worlds: dramatic side-angle view right on the glowing threshold as the hero steps halfway through the luminous portal archway while sideways gravity pulls retro posters and glowing dust into the starlit void.`,
      p3: `Showdown inside the alternate cosmic pocket: breathtaking wide surreal vista of a dreamlike floating starfield mirror-version of ${locationVisual}, where the hero vaults across hovering checkered platforms outmaneuvering the gigantic glowing cosmic creature amid ${palette.energyFx}.`,
      p4: `Tumbling safely back to reality: cheerful candid floor-level frame of the hero landing cleanly back on the ordinary quiet floor of ${locationVisual} laughing in relief as the glowing doorway clicks shut into a normal everyday door.`,
      videoBeat1: `inside the surreal starfield mirror-version of ${locationVisual}, the hero leaps effortlessly across hovering geometric platforms while the gigantic cosmic creature spirals around them`,
      videoBeat2: `the hero activates ${safeGadget1} and ${safeGadget2} on the central platform, weaving a brilliant luminous ring of ${palette.energyFx} that folds the portal smoothly back toward home`,
      outroBeat1: `the swirling starfield doorway folds inward in brilliant iridescent waves as the hero steps cleanly back into normal ${locationVisual}`,
      outroBeat2: `as the doorway returns to ordinary wood and glass, three gleaming blank holographic cards appear resting on the threshold`,
      outroBeat3: `the ${heroLock.genderNoun} hero laughs in relief, picks up the glowing cards, and leans happily against the quiet hallway wall`,
    },
    'harmonic-truce': {
      p1: `Hilarious chaotic malfunction inside ${locationVisual} under ${atmosphere}: the oversized cosmic creature is ALREADY bouncing clumsily through the background making neon signs spin and arcade displays glitch chaotically while the hero ducks in through a side aisle shielding ${heroLock.pronounPoss} eyes.`,
      p2: `Gentle musical calibration: warm tight close-up of the hero kneeling calmly to twist analog dials on ${safeGadget1}, sending soft glowing sound-wave rings drifting through the air as the curious cosmic creature leans down listening with tilted head.`,
      p3: `Synchronized cosmic crescendo: breathtaking wide painterly vista of the hero and the towering cosmic creature standing peacefully side-by-side at the center of ${locationVisual} bathed in swirling aurora ribbons of ${palette.energyFx} as warped shelves straighten harmoniously around them.`,
      p4: `Heartwarming farewell: intimate close-up of the shrunk cosmic creature as a tiny warm glowing starlight orb hovering gently just above the hero's open palm before drifting peacefully upward toward the skylights.`,
      videoBeat1: `the hero calmly adjusts the glowing dials on ${safeGadget1} inside ${locationVisual}, sending soft rhythmic rings of warm light floating gently toward the restless cosmic creature`,
      videoBeat2: `the creature's chaotic static softens into glowing harmony as hero and creature stand together inside a breathtaking swirling aurora of ${palette.energyFx}`,
      outroBeat1: `the peaceful cosmic creature shrinks into a warm glowing starlight firefly that circles the hero playfully once before floating up through the skylight`,
      outroBeat2: `soft sparkles drift onto the hero's open palm and settle into three warm shimmering blank holographic trading cards`,
      outroBeat3: `the ${heroLock.genderNoun} hero waves gently toward the night sky with a warm smile as ${locationVisual} glows peacefully`,
    },
    'machine-overload': {
      p1: `Urgent warning signs inside ${locationVisual} under ${atmosphere}: dramatic angled close-up of blinking amber and crimson console gauges, humming transformers, and buzzing overhead fixtures while the hero rushes toward the back control wall in the mid-ground.`,
      p2: `Looming presence behind glass: suspenseful layered frame with the hero working urgently at a messy retro control panel of glowing toggle switches and coiled cables in the foreground while the giant cosmic creature presses right up against a frosted glass window directly behind ${heroLock.pronounPoss === 'her' ? 'her' : 'him'}.`,
      p3: `Last-second breaker flip: kinetic low-angle freeze-frame of the hero diving dramatically across the floor to pull a massive industrial switch lever on the wall just as the cosmic creature surges forward, flooding the entire room in a blinding harmonic wave of ${palette.energyFx}.`,
      p4: `Warm power restored: peaceful wide shot of cozy golden lights humming steadily back on across quiet ${locationVisual} as the hero leans back against the calm control console wiping ${heroLock.pronounPoss} brow with a tired smile.`,
      videoBeat1: `while the giant cosmic creature looms behind a glowing glass partition in ${locationVisual}, the hero sprints across the floor dodging sparks toward the main vintage power lever`,
      videoBeat2: `the hero dives and pulls the massive breaker lever down, unleashing a sweeping harmonic pulse of ${palette.energyFx} across every fixture in the room`,
      outroBeat1: `the harmonic surge calms the overloaded machinery as the cosmic creature dissolves smoothly into peaceful glowing static`,
      outroBeat2: `warm golden room lights flicker steadily back on while three blank shimmering holographic cards slide cleanly out of the console slot`,
      outroBeat3: `the ${heroLock.genderNoun} hero exhales with a grin, pockets the gleaming cards, and switches off the humming console`,
    },
    'noir-mystery': {
      p1: `Mysterious clue discovery inside ${locationVisual} under ${atmosphere}: moody low-angle over-the-shoulder view of the hero crouching to inspect glowing iridescent footprints and softly humming melted arcade tokens leading deep into the shadowy aisles.`,
      p2: `Silent widescreen first contact: dramatic symmetrical architectural wide shot showing BOTH the small silhouette of the hero on the far near side and the towering cosmic creature standing silently at the opposite end of the long misty corridor of ${locationVisual}.`,
      p3: `Surreal Escher-like reality bend: dizzying dramatic Dutch-angle action shot inside ${locationVisual} as walls and checkered floors curve upward around them while the hero sprints along a tilted wall launching a bright arc of ${palette.energyFx} from ${safeGadget1} toward the creature's glowing core.`,
      p4: `Quiet dawn walk-away: poetic wide exterior frame of the hero strolling out across a misty empty suburban parking lot at cool pale dawn, glancing back once over ${heroLock.pronounPoss} shoulder at the peaceful normal facade of ${locationVisual}.`,
      videoBeat1: `across the long misty corridor of ${locationVisual}, walls and tiles tilt surreally as the hero sprints sideways along a banked display rack toward the towering cosmic creature`,
      videoBeat2: `the hero snaps ${safeGadget1} into phase alignment, sending a crisp geometric wave of ${palette.energyFx} snapping the crooked room cleanly back to ninety-degree reality`,
      outroBeat1: `the warped corridor straightens with a soft chime as the cosmic creature fades gently into drifting morning mist`,
      outroBeat2: `a single gleaming trio of blank holographic cards rests quietly on the damp doorstep outside as pale dawn breaks`,
      outroBeat3: `the ${heroLock.genderNoun} hero scoops them up and strolls peacefully across the quiet morning lot`,
    },
    'mirror-decoy': {
      p1: `Uncanny mirror reveal inside ${locationVisual} under ${atmosphere}: medium side view of the hero staring into a glossy storefront window or polished chrome mirror — the real room behind looks completely empty, yet the towering cosmic creature is visible ONLY inside the reflection.`,
      p2: `Hall of holographic mirages: dazzling wide interior view of ${locationVisual} filled with three translucent shimmering holographic decoys of the cosmic creature refracting rainbow light across every wall as the hero navigates calmly between them.`,
      p3: `Mirror-bounce counterplay: kinetic low-angle action shot as the hero holds up a gleaming reflective retro surface (${safeGadget1}) at a sharp angle, bouncing the cosmic creature's own blinding prism wave straight back into a spinning kaleidoscope ring of ${palette.energyFx}.`,
      p4: `Peaceful sunlit stillness: serene wide interior shot of warm sunbeams or calm skylight streaming through spotless dust-free glass across quiet ${locationVisual}, with one tiny shimmering rainbow glass prism catching light on a windowsill.`,
      videoBeat1: `surrounded by shimmering holographic mirages inside ${locationVisual}, the hero pivots swiftly holding up gleaming reflective ${safeGadget1} as the real cosmic creature surges forward`,
      videoBeat2: `the creature's prism wave strikes the reflective surface and rebounds into a breathtaking spinning kaleidoscope ring of ${palette.energyFx}`,
      outroBeat1: `all the shimmering mirages chime and fold harmoniously back into a single bright prism spark that rises and vanishes`,
      outroBeat2: `the mirror surfaces clear completely as three blank holographic rainbow cards materialize neatly along the sunlit ledge`,
      outroBeat3: `the ${heroLock.genderNoun} hero smiles at ${heroLock.pronounPoss} normal reflection, collects the cards, and heads calmly toward the exit`,
    },
    'rooftop-skyline': {
      p1: `Looking up from the twilight street outside ${locationVisual} under ${atmosphere}: dramatic low-angle outdoor establishing view from the damp sidewalk gazing up at the glowing neon roof sign as swirling aurora clouds and silent prism lightning gather above the building.`,
      p2: `High-altitude vantage point: thrilling overhead perspective of the hero perched heroically atop the glowing neon awning or balcony overlook of ${locationVisual}, surveying the massive cosmic creature emerging into the mist-filled plaza below.`,
      p3: `Skyward diversion leap: breathtaking dynamic mid-air shot capturing the hero leaping down from the high marquee ledge while channeling ${safeGadget1} and ${safeGadget2} to sweep the cosmic creature's swirling energy straight upward into the starry night sky like a giant beacon of ${palette.energyFx}.`,
      p4: `Peaceful suburban skyline exhale: serene wide rear-3/4 closing view of the hero leaning peacefully against a rooftop parapet or beside a parked vintage bicycle/skateboard, gazing out over twinkling quiet suburban neighborhood lights under the clear night sky.`,
      videoBeat1: `from atop the glowing neon marquee of ${locationVisual}, the hero leaps dynamically downward through swirling twilight mist toward the towering cosmic creature in the plaza below`,
      videoBeat2: `landing in a smooth athletic crouch, the hero sweeps ${safeGadget1} skyward, channeling the creature's swirling energy straight up into the night sky in a towering pillar of ${palette.energyFx}`,
      outroBeat1: `the soaring aurora beacon blooms peacefully high above the roofline like silent starlight fireworks before fading into clear night air`,
      outroBeat2: `soft glowing sparkles rain gently onto the rooftop parapet, forming three gleaming blank holographic trading cards`,
      outroBeat3: `the ${heroLock.genderNoun} hero tucks the cards safely away and looks out peacefully over the quiet glowing town lights`,
    },
    'flashlight-recon': {
      p1: `Atmospheric late-night arrival outside ${locationVisual} under ${atmosphere}: wide moody twilight street view with warm amber streetlamps and glowing neon reflections as the hero arrives carrying a backpack and vintage gear toward the shadowy building.`,
      p2: `Flashlight beam cutting the dark: dramatic high-contrast chiaroscuro interior shot deep inside unlit ${locationVisual}, where a single bright cone of flashlight light held by the hero cuts through swirling fog to suddenly reveal the cosmic creature's glowing eyes and giant silhouette.`,
      p3: `Close-quarters counter vault: kinetic tight-angle action frame inside the narrow aisle as the cosmic creature sweeps forward sending floating papers and sparks skyward while the hero vaults athletically right over a retro counter in a swirling wake of ${palette.energyFx}.`,
      p4: `Quiet pocketing & heading home: warm medium close-up of the hero's hands sliding a glowing blank rainbow holographic card neatly into ${heroLock.pronounPoss} 1990s jacket pocket while stepping back out into the peaceful humming night.`,
      videoBeat1: `deep inside dimly lit ${locationVisual}, the hero's bright beam sweeps across fog to reveal the giant cosmic creature surging down the narrow aisle`,
      videoBeat2: `the hero vaults smoothly over a counter in one fluid motion, triggering a bright sweeping halo of ${palette.energyFx} from ${safeGadget1} that calms the creature mid-stride`,
      outroBeat1: `the glowing fog clears gently as the cosmic creature dissolves upward into soft shimmering dust motes inside quiet ${locationVisual}`,
      outroBeat2: `a fanned trio of gleaming blank rainbow holographic cards rests softly on the polished counter beside the hero's hand`,
      outroBeat3: `the ${heroLock.genderNoun} hero slips the glowing cards into ${heroLock.pronounPoss} jacket pocket and walks peacefully out into the cool night`,
    },
    'classic-showdown': {
      p1: `Wide exterior threshold arrival outside ${locationVisual} under ${atmosphere}: the hero pushes open the glowing entrance doors holding ${safeGadget1} and ${safeGadget2} as strange shimmer spills onto the pavement.`,
      p2: `Dramatic solo reveal deep inside ${locationVisual}: tight atmospheric close-up of only the towering cosmic creature rising out of swirling mist amid ${palette.energyFx}.`,
      p3: `Widescreen full-body showdown inside ${locationVisual}: dynamic low-angle view with the hero braced on the left projecting a blazing beam of ${palette.energyFx} from ${safeGadget1} and ${safeGadget2} straight across toward the advancing cosmic creature on the right.`,
      p4: `Clean 90-degree top-down overhead flat-lay still life on scuffed retro tiles inside ${locationVisual} showing cooled ${safeGadget1}, ${safeGadget2}, gleaming brass arcade tokens, and three blank shimmering rainbow holographic foil trading cards.`,
      videoBeat1: `the camera glides behind the hero bracing on the left of ${locationVisual} as ${heroLock.pronounSubj} links ${safeGadget1} and ${safeGadget2} while the creature advances on the right`,
      videoBeat2: `a blazing linear beam of ${palette.energyFx} streams across the room, gently pushing the glowing creature back into calm stillness`,
      outroBeat1: `the cosmic creature shimmers and dissolves upward into ribbons of glowing holographic light as ${locationVisual} snaps back to normal`,
      outroBeat2: `those shimmering light ribbons condense onto the scuffed floor beside the hero's sneakers into three gleaming blank rainbow holographic trading cards`,
      outroBeat3: `the ${heroLock.genderNoun} hero stoops, pockets the sparkling cards, and strolls calmly out through the glowing exit doors into the quiet night`,
    },
  };

  const arc = storyArcScripts[activeArcMeta.id] || storyArcScripts['chase-trap'];

  // 5 DISTINCT CUTAWAY GIF #1 & #2 SCENES
  const gif1Cutaways = [
    `a glowing vintage 1990s CRT monitor beside ${safeGadget1} on a shelf as colorful radar waveforms ripple across the glass screen and ${palette.energyFx} shimmer along the chrome edges`,
    `an extreme macro view of ${safeGadget1}'s translucent plastic casing and analog indicator dials lighting up in rhythmic pulses while colorful reflections sweep across the polished counter`,
    `a row of vintage 1990s neon wall lamps and hanging plastic tags inside ${locationVisual} gently swaying and shimmering in slow-motion anti-gravity ripples`,
    `a glossy puddle or waxed floor reflection inside ${locationVisual} rippling outward in concentric glowing rings beneath flickering retro fixtures`,
    `a row of vintage analog gauges, cassette reels, and indicator bulbs inside ${locationVisual} spinning rapidly and glowing in hypnotic alternating rhythms`,
  ];

  const gif2Cutaways = [
    `looking straight up at the glowing ceiling lights of ${locationVisual} as a shimmering violet skylight portal softly closes overhead, drifting slow sparkling motes downward through mist`,
    `a peaceful wide close-up of three gleaming blank rainbow holographic trading cards glinting gently in a soft halo of floating light atop a retro counter`,
    `an atmospheric low pan across settling iridescent stardust and drifting wisps of warm amber and cyan mist swirling slowly past retro fixtures inside ${locationVisual}`,
    `a calm window view looking out from ${locationVisual} as colorful cosmic aurora ribbons fade smoothly into a peaceful twilight sky`,
    `a quiet outdoor neon sign humming steadily outside ${locationVisual} as gentle evening mist drifts past gleaming damp pavement`,
  ];

  // 1-4 Individual Shot Prompts (synced 100% to the rolled Story Arc & Visual Medium!)
  const shot01WideArchitecture = sanitizeVisualPromptText(
    `A 16:9 widescreen scene rendered in ${flowArtStyle}. Hero: ${heroLock.lockedSheet}. Cosmic creature: ${safeCreature}. ${arc.p1}`
  );
  const shot02AnomalyPortrait = sanitizeVisualPromptText(
    `A 16:9 widescreen scene rendered in ${flowArtStyle}. Hero: ${heroLock.lockedSheet}. Cosmic creature: ${safeCreature}. ${arc.p2}`
  );
  const shot03LowAngleAction = sanitizeVisualPromptText(
    `A 16:9 widescreen action frame rendered in ${flowArtStyle}. Hero: ${heroLock.lockedSheet}. Cosmic creature: ${safeCreature}. ${arc.p3}`
  );
  const shot04TabletopGearFlatlay = sanitizeVisualPromptText(
    `A 16:9 widescreen closing frame rendered in ${flowArtStyle}. Hero: ${heroLock.lockedSheet}. ${arc.p4}`
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
    `A 4-second 16:9 ${palette.videoType} at 24fps in ${flowArtStyle}. Inside ${locationVisual} under ${lightingClean}, featuring ${heroLock.lockedSheet} and ${safeCreature}: ${arc.videoBeat1}; then ${arc.videoBeat2} as the scene hits a dramatic grounded finish. Audio: ${leadAudioClean}`
  );

  // 8. Story-Synced 3-Act Synth Soundtrack Prompt
  const synthSongPrompt = sanitizeVisualPromptText(
    `1990s suburban cosmic story soundtrack (118 BPM, 45-60s instrumental) structured to follow the 3-Act Zine story in "${location}": [0:00-0:15 Act I Tension] mysterious analog cassette synth drone, buzzing fluorescent hum, and creeping bass pulse; [0:15-0:42 Act II Action] punchy FM synthwave bassline, gated 16-bit snare drums, and electric guitar power chords erupting for "${synergy}"; [0:42-0:60 Act III Aftermath] warm, nostalgic midnight synth pads and shimmering bell arpeggios fading into quiet resolution. Strictly instrumental, no vocals.`
  );

  // 9. External 3-Act Long-Form Story Prompt
  const storyGeneratorPrompt = `Write a rich, deadpan-weird, kinetic 1990s suburban cosmic comic-zine story (~900 words total) broken into 3 Acts with EXACTLY 3 vivid paragraphs per Act (labeled "ACT 01", "ACT 02", and "ACT 03"):
- Title: ${encounter.entity_name}
- Setting: ${location}
- Operative: ${charClean}
- Anomaly: ${anomaly}
- Retro Gear Loadout: ${rawArtifact} + ${rawWeapon} (Synergy: ${synergy})
- Environmental Distortion: ${distortion}
- Status Debuff: ${encounter.status_affliction}
Keep 100% authentic 1990s suburban details, tactile hardware physics, and a grounded, definitive Act 03 resolution where a holographic trading card crystallizes in the aftermath.`;

  // 0A. MASTER 1-PROMPT 2x2 SEQUENTIAL SHEET (12 Visual Mediums x 10 Completely Different 4-Scene Story Arcs!)
  const masterStoryboard2x2Prompt = sanitizeVisualPromptText(
`${palette.gridIntro}, created strictly in ${flowArtStyle}, divided cleanly into two equal columns and two equal rows.

Setting: ${locationVisual} with ${atmosphere}. Hero across all panels: ${heroLock.lockedSheet}. Cosmic creature: ${safeCreature}.

Top-left panel: ${arc.p1}
Top-right panel: ${arc.p2}
Bottom-left panel: ${arc.p3}
Bottom-right panel: ${arc.p4}`
  );

  // 0A-SAFE. ULTRA-SAFE MINIMAL BACKUP (keeps both the chosen visual medium AND a fresh distinct arc!)
  const backupArcMeta = STORYBOARD_STORY_ARCS[(resolvedArcIdx + 3) % STORYBOARD_STORY_ARCS.length];
  const backupArc = storyArcScripts[backupArcMeta.id] || arc;
  const masterStoryboardUltraSafePrompt = sanitizeVisualPromptText(
`${palette.gridIntro}, created strictly in ${flowArtStyle}.

Hero across all panels: ${heroLock.lockedSheet}. Friendly glowing retro sci-fi creature: a whimsical towering neon crystal-and-chrome robot floating in swirling starlight.

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

  // 0D. SAME-CHAT LEAD VIDEO #1 (8-SECOND ACT II CLIMAX MATCHING THIS EXACT ARC & VISUAL MEDIUM!)
  const sameChatVideoFollowupPrompt = sanitizeVisualPromptText(
    `In the exact same ${palette.medium}, ${palette.colors} lighting, hero outfit, and cosmic creature design from the bottom-left panel above, create an 8-second 16:9 ${palette.videoType} inside ${locationVisual} with no dialogue. First three seconds: ${arc.videoBeat1}. Middle three seconds: ${arc.videoBeat2}. Final two seconds: the glowing effects settle cleanly as both hold a dramatic, steady grounded finish. Audio: vibrant 1990s synthwave swells, crystalline energy chimes, and retro ambient hum.`
  );

  // 0E. SAME-CHAT FINALE VIDEO #2 (8-SECOND ACT III ENDING MATCHING THIS EXACT ARC & VISUAL MEDIUM!)
  const sameChatOutroVideoPrompt = sanitizeVisualPromptText(
    `In the exact same ${palette.medium}, ${palette.colors} lighting, and hero outfit from the four-panel image above, create an 8-second 16:9 closing finale ${palette.videoType} inside ${locationVisual} with no dialogue. First three seconds: ${arc.outroBeat1}. Middle three seconds: ${arc.outroBeat2}. Final two seconds: ${arc.outroBeat3}. Audio: sweeping crystalline chimes, gentle ambient warmth, soft footsteps, and nostalgic 1990s synth pads fading out.`
  );

  return {
    resolvedVisualStyleId: palette.id,
    resolvedVisualStyleLabel: `${palette.emoji} ${palette.shortLabel}`,
    resolvedStoryArcId: activeArcMeta.id,
    resolvedStoryArcLabel: `${activeArcMeta.emoji} ${activeArcMeta.shortLabel}`,
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
  > & { visualStyleIdOverride?: string; storyArcIdOverride?: string }
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
    existingMedia?.storyArcIdOverride
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
