import { CombatEncounter, CardThemeType } from '../types';
import { ZinePaletteId, getZinePalette } from '../data/zinePalettes';
import { getChoreographyPresetsForCard } from './choreography';

export interface ZineActs {
  sceneSetup: string;     // 3 rich paragraphs (Act 01)
  intervention: string;   // 3 rich paragraphs (Act 02)
  aftermath: string;      // 3 rich paragraphs (Act 03)
}

export interface ZinePrompts {
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
  [/\bChuck\s*E\.?\s*Cheese(?:'s)?\b|\bChuck's\b/gi, 'animatronic pizza arcade'],
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
  [/\bskeleton\b|\bskulls?\b|\bcoffin\b|\bgravestone\b/gi, 'glowing prism hologram'],
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

function toVisualSafeSetting(rawLocation: string): string {
  const loc = (rawLocation || '').toLowerCase();
  if (/(arcade|coin-op|pinball|skeeball|redemption|fighting game|game cage)/i.test(loc)) {
    return 'a vibrant neon-lit 1990s retro arcade hall lined with glowing game cabinets';
  }
  if (/(roller rink|laser tag|bowling|blacklight)/i.test(loc)) {
    return 'a glowing blacklight 1990s roller rink and neon lounge with geometric carpet';
  }
  if (/(video|vhs|cinema|drive-in|projection|darkroom|photo|cassette|record|music|comic|bookstore)/i.test(loc)) {
    return 'a glowing 1990s retro video, music, and comic shop filled with colorful displays';
  }
  if (/(food court|diner|pizza|buffet|soft-serve|bakery|cafeteria|yogurt|concession|soda|luncheonette|snack bar|drive-thru|slushie|ice cream)/i.test(loc)) {
    return 'a chrome-and-neon 1990s retro mall food court diner at dusk';
  }
  if (/(computer|software|electronics|soldering|library|microfiche|shareware|control room|equipment room|tv|broadcast|radio tower)/i.test(loc)) {
    return 'a glowing 1990s retro electronics and computer workshop filled with humming CRT monitors';
  }
  if (/(waterpark|pool|car wash|greenhouse|rainforest|fountain|moat|ice arena|drain|stormwater)/i.test(loc)) {
    return 'a misty neon-lit 1990s indoor tropical fountain atrium with shimmering tile reflections';
  }
  if (/(cul-de-sac|skatepark|parking lot|rooftop|backyard|quarry|highway|driveway|batting cage|trampoline|miniature golf|storm cellar)/i.test(loc)) {
    return 'a twilight 1990s suburban neon plaza and rain-slicked avenue under glowing streetlamps';
  }
  return 'a vibrant neon-lit 1990s suburban shopping mall atrium with glowing glass storefronts';
}

function toVisualSafeCreatureDescription(
  rawAnomaly: string,
  morphologyId: string
): string {
  const lower = (rawAnomaly || '').toLowerCase();
  const seed = hashString(lower || 'cosmic-creature');
  const glowPalette = pickSeeded(
    [
      'luminous cyan and hot-magenta neon light bands',
      'shimmering ultraviolet-purple and electric-aqua crystal accents',
      'glowing amber-gold and neon-teal starlight rings',
      'iridescent turquoise and prism-pink geometric highlights',
    ],
    seed,
    4
  );

  if (/(robot|toy|animatronic|automaton|vending|claw|jukebox|rewinder|drone|pinsetter)/i.test(lower) || morphologyId === 'mechanical_automaton') {
    return `a whimsical towering 1990s retro sci-fi robot creature built from colorful vintage cassette decks, chrome dials, and ${glowPalette}`;
  }
  if (/(slime|ooze|slushie|soda|gum|candy|pizza|gel|gak|syrup|cream)/i.test(lower) || morphologyId === 'slime_ooze') {
    return `a whimsical towering translucent neon-jelly crystal creature swirling with sparkling soda bubbles and ${glowPalette}`;
  }
  if (/(modem|crt|tv|vhs|video|floppy|cd|cable|pixel|hologram|phone|stereogram|glitch|microchip|keyboard|console|pet)/i.test(lower) || morphologyId === 'cyber_signal') {
    return `a whimsical glowing 1990s holographic television-prism creature made of floating retro CRT glass, neon pixel waves, and ${glowPalette}`;
  }
  if (/(ribbon|cord|serpent|boa|tentacle|hose|wire|cable|tape)/i.test(lower) || morphologyId === 'serpent_constricter') {
    return `a whimsical soaring neon serpent creature woven from shimmering iridescent cassette tape ribbons and ${glowPalette}`;
  }
  if (/(swarm|cluster|token|figurine|plush|pogs?|slammer|marionette)/i.test(lower) || morphologyId === 'swarm_cluster') {
    return `a whimsical floating constellation creature formed by orbiting 1990s holographic prisms, shiny brass tokens, and ${glowPalette}`;
  }
  return `a whimsical towering 1990s cosmic comic-book crystal guardian creature made of translucent retro glass prisms, chrome rings, and ${glowPalette}`;
}

export function compile199xZinePrompts(
  encounter: CombatEncounter,
  acts?: ZineActs,
  anomalyOverride?: string
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

  // Clean natural visual descriptions that pass Google Flow / Nano Banana 2.1 & Veo cleanly
  const safeSetting = toVisualSafeSetting(rawLocation);
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

  const flowArtStyle =
    'vibrant 1990s hand-inked Western indie graphic novel watercolor and gouache illustration with bold ink contours, rich cyan, magenta, and amber neon lighting, clean borderless artwork, and blank surfaces with no words or lettering';

  // 1. Image 01 (Act 01 Opening)
  const shot01WideArchitecture = sanitizeVisualPromptText(
    `A 16:9 widescreen architectural comic-book illustration in ${flowArtStyle}. Wide exterior view outside the rain-slicked glowing glass entrance doors of ${safeSetting} on a colorful evening, as ${heroLock.lockedSheet} opens the entrance door holding ${safeGadget1} and ${safeGadget2}.`
  );

  // 2. Image 02 (Act 01->02 Reveal)
  const shot02AnomalyPortrait = sanitizeVisualPromptText(
    `A 16:9 widescreen close-up comic-book creature illustration in ${flowArtStyle}. Inside the neon-lit aisles of ${safeSetting}, ${safeCreature} materializes playfully out of swirling cyan and violet starlight, casting glowing rainbow reflections across the tiles.`
  );

  // 3. Image 03 (Act 02 Showdown)
  const shot03LowAngleAction = sanitizeVisualPromptText(
    `A 16:9 widescreen low-angle sci-fi comic-book illustration in ${flowArtStyle}. Inside the main floor of ${safeSetting}, ${heroLock.lockedSheet} stands braced on the left connecting ${safeGadget1} and ${safeGadget2} to project a shimmering rainbow-cyan beam of cosmic starlight toward ${safeCreature} on the right amidst bright golden comic sparkles.`
  );

  // 4. Image 04 (Act 03 Aftermath)
  const shot04TabletopGearFlatlay = sanitizeVisualPromptText(
    `A 16:9 widescreen top-down overhead flat-lay still-life illustration in ${flowArtStyle}. Resting neatly on scuffed retro checkered floor tiles inside ${safeSetting} are ${safeGadget1}, ${safeGadget2}, gleaming brass arcade tokens, and three blank shimmering rainbow holographic foil trading cards arranged cleanly as a peaceful tabletop still life.`
  );

  // 5. Story GIF #1 (Act 01 Cutaway Loop)
  const gif01Act1TensionLoop = sanitizeVisualPromptText(
    `A 4-second seamless 16:9 animated comic-book loop at 24fps in ${flowArtStyle}. Close-up of a glowing 1990s retro CRT monitor beside ${safeGadget1} as bright cyan and magenta waveforms ripple across the screen and tiny rainbow sparkles dance along the chrome trim in a smooth continuous loop.`
  );

  // 6. Story GIF #2 (Act 03 Cutaway Loop)
  const gif02Act3AftermathLoop = sanitizeVisualPromptText(
    `A 4-second seamless 16:9 animated comic-book loop at 24fps in ${flowArtStyle}. Upward view toward the glowing neon ceiling lights of ${safeSetting} as a swirling violet starlight portal softly closes overhead, drifting shimmering cyan and gold glitter motes lazily downward in a peaceful continuous loop.`
  );

  // 7. Lead 16:9 Hero Cinema Video Prompt
  const leadVideo16x9 = sanitizeVisualPromptText(
    `A 4-second 16:9 animated 1990s sci-fi comic-book clip at 24fps in ${flowArtStyle}. Inside ${safeSetting} under ${lightingClean}, ${heroLock.lockedSheet} stands on the left projecting a bright rainbow-cyan beam of cosmic starlight from ${safeGadget1} and ${safeGadget2} across the room toward ${safeCreature} on the right, sending sparkling neon prism trails floating through the air as both hold a dramatic comic-book pose. Audio: ${leadAudioClean}`
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

  // 0A. MASTER 1-PROMPT 2x2 SEQUENTIAL STORYBOARD SHEET (Concise Google Flow / Nano Banana 2.1 native phrasing!)
  const masterStoryboard2x2Prompt = sanitizeVisualPromptText(
`A 16:9 four-panel 2x2 comic-book storyboard grid painted in vibrant 1990s hand-inked watercolor and gouache art with cyan, magenta, and amber neon lighting, borderless edge-to-edge panels, and blank visual surfaces with no lettering.

Setting: ${safeSetting}. Hero across all panels: ${heroLock.lockedSheet}. Cosmic creature: ${safeCreature}.

Top-left panel: Wide exterior evening view outside the rain-slicked glowing glass entrance doors as the hero opens the door holding ${safeGadget1} and ${safeGadget2}.
Top-right panel: Tight interior close-up inside the glowing neon aisles featuring only the whimsical cosmic creature emerging brightly from swirling cyan and violet starlight.
Bottom-left panel: Dynamic low-angle comic splash inside the main floor with the same hero braced on the left projecting a shimmering rainbow-cyan beam of cosmic starlight from both retro gadgets toward the glowing creature on the right amidst bright golden sparkles.
Bottom-right panel: Top-down overhead flat-lay still life on scuffed checkered tiles showing ${safeGadget1}, ${safeGadget2}, gleaming brass arcade tokens, and three blank shimmering rainbow holographic foil trading cards arranged neatly on the floor.`
  );

  // 0A-SAFE. ULTRA-SAFE MINIMAL BACKUP (short, ultra-friendly 4-panel Flow/Nano Banana prompt)
  const masterStoryboardUltraSafePrompt = sanitizeVisualPromptText(
`A 16:9 four-panel 2x2 comic-book illustration grid painted in colorful 1990s hand-inked watercolor and gouache style with bright cyan, magenta, and amber neon lighting and purely visual borderless panels with blank surfaces.

Top-left panel: Wide exterior evening view of a glowing 1990s retro arcade plaza storefront as ${heroLock.lockedSheet} opens the glass entrance door carrying a glowing neon scanner.
Top-right panel: Colorful interior close-up of a friendly towering glowing crystal-and-neon retro sci-fi robot floating in swirling purple starlight inside the arcade.
Bottom-left panel: Wide low-angle comic-book scene inside the neon arcade showing the same hero on the left beaming a shimmering rainbow prism light from a retro handheld gadget toward the glowing crystal robot on the right in a shower of golden stars.
Bottom-right panel: Top-down overhead still-life flat-lay on checkered floor tiles showing retro neon gadgets, shiny gold arcade tokens, and three blank shimmering rainbow holographic trading cards.`
  );

  // 0B. SAME-CHAT GIF #1 FOLLOW-UP (BRAND-NEW CUTAWAY SCENE — NEVER REPEATS PANEL 1!)
  const sameChatGif1FollowupPrompt = sanitizeVisualPromptText(
    `In the exact same 1990s hand-inked watercolor comic style and neon color palette as the storyboard above, create a 4-second seamless 16:9 animated looping clip showing a brand-new close-up cutaway scene: a glowing vintage 1990s CRT monitor beside ${safeGadget1} on a shelf as colorful cyan and magenta radar waves ripple across the screen and tiny golden starlight sparkles flicker along the chrome edges in a smooth continuous loop.`
  );

  // 0C. SAME-CHAT GIF #2 FOLLOW-UP (BRAND-NEW CUTAWAY SCENE — NEVER REPEATS PANEL 4!)
  const sameChatGif2FollowupPrompt = sanitizeVisualPromptText(
    `In the exact same 1990s hand-inked watercolor comic style and neon lighting as the storyboard above, create a 4-second seamless 16:9 animated looping clip showing a brand-new upward cutaway view: looking up at the glowing fluorescent ceiling lights of ${safeSetting} as a shimmering violet starlight portal softly closes overhead, letting slow glowing cyan and gold light motes drift downward through neon mist in a calm continuous loop.`
  );

  // 0D. SAME-CHAT LEAD VIDEO #1 (8-SECOND ACT II CLIMAX SHOWDOWN!)
  const sameChatVideoFollowupPrompt = sanitizeVisualPromptText(
    `In the exact same 1990s hand-inked watercolor comic style, lighting, hero outfit, and cosmic creature design from the bottom-left panel above, create an 8-second 16:9 animated comic-book clip inside ${safeSetting} with no dialogue. First three seconds: the camera glides behind the ${heroLock.genderNoun} hero as ${heroLock.pronounSubj} braces on the left and activates ${safeGadget1} and ${safeGadget2} while the glowing cosmic creature floats forward on the right. Middle three seconds: a dazzling rainbow-cyan beam of cosmic starlight streams across the room, gently pushing the glowing creature back in a colorful shower of sparkling prism stars. Final two seconds: the glowing sparkles settle as both hold a dramatic, steady comic-book standoff pose. Audio: vibrant 1990s synthwave swells, crystalline energy chimes, and neon hum.`
  );

  // 0E. SAME-CHAT FINALE VIDEO #2 (8-SECOND ACT III ENDING / VICTORY OUTRO THAT CLOSES THE TALE!)
  const sameChatOutroVideoPrompt = sanitizeVisualPromptText(
    `In the exact same 1990s hand-inked watercolor comic style, lighting, and hero outfit from the storyboard above, create an 8-second 16:9 closing finale animated clip inside ${safeSetting} with no dialogue. First three seconds: the glowing cosmic creature shimmers and gently dissolves upward into ribbons of cyan, gold, and magenta holographic light as the neon room returns to peaceful calm. Middle three seconds: those shimmering light ribbons drift down onto the checkered tiles beside the hero's sneakers and crystallize into three gleaming blank rainbow holographic trading cards. Final two seconds: the ${heroLock.genderNoun} hero stoops, picks up the sparkling holographic cards, and walks calmly out through the glowing glass exit doors into the misty 1990s twilight. Audio: sweeping crystalline chimes, gentle card sparkle, soft sneaker footsteps, and warm nostalgic 1990s synth pads fading out.`
  );

  return {
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
  >
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
  const prompts = compile199xZinePrompts(encounter, acts, anomalyName);

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
