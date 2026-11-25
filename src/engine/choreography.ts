import { CombatEncounter } from '../types';

export type BadGuyMorphologyId =
  | 'slime_ooze'
  | 'mechanical_automaton'
  | 'cyber_signal'
  | 'serpent_constricter'
  | 'swarm_cluster'
  | 'spectral_phantom'
  | 'behemoth_golem'
  | 'kinetic_hazard';

export type GoodGuyMorphologyId =
  | 'wheeled_glider'
  | 'tech_broadcaster'
  | 'heavy_brawler'
  | 'stealth_sleuth';

export type MorphologyId = BadGuyMorphologyId | GoodGuyMorphologyId;

export type EnvironmentProfileId =
  | 'arcade_neon'
  | 'vhs_cinema'
  | 'aquatic_humid'
  | 'outdoor_night'
  | 'food_court_diner'
  | 'tech_lab_office'
  | 'retail_aisle';

export interface ChoreographyPreset {
  id: string;
  label: string;
  camera: string;
  action: string;
  audio: string;
}

export interface MorphologyMeta {
  id: MorphologyId;
  badge: string;
  icon: string;
}

export interface EnvironmentMeta {
  id: EnvironmentProfileId;
  badge: string;
  icon: string;
  lightingCue: string;
  ambientAudio: string;
  propAnchor: string;
}

export const MORPHOLOGY_META: Record<MorphologyId, MorphologyMeta> = {
  slime_ooze: { id: 'slime_ooze', badge: 'VISCOUS OOZE / BIO-FLUID', icon: '🧪' },
  mechanical_automaton: { id: 'mechanical_automaton', badge: 'HEAVY AUTOMATON / RIG', icon: '⚙️' },
  cyber_signal: { id: 'cyber_signal', badge: 'SIGNAL / CYBER-ANOMALY', icon: '⚡' },
  serpent_constricter: { id: 'serpent_constricter', badge: 'COILING TENDRIL / SERPENT', icon: '🐍' },
  swarm_cluster: { id: 'swarm_cluster', badge: 'KINETIC SWARM / HIVEMIND', icon: '🐝' },
  spectral_phantom: { id: 'spectral_phantom', badge: 'SPECTRAL PHANTOM / VOID', icon: '👻' },
  behemoth_golem: { id: 'behemoth_golem', badge: 'APEX BEHEMOTH / TITAN', icon: '🦍' },
  kinetic_hazard: { id: 'kinetic_hazard', badge: 'HIGH-VELOCITY HAZARD', icon: '💥' },
  wheeled_glider: { id: 'wheeled_glider', badge: 'WHEELED SPEED OPERATIVE', icon: '🛼' },
  tech_broadcaster: { id: 'tech_broadcaster', badge: 'ANALOG TECH SPECIALIST', icon: '📹' },
  heavy_brawler: { id: 'heavy_brawler', badge: 'HEAVY SUBURBAN ENFORCER', icon: '🏏' },
  stealth_sleuth: { id: 'stealth_sleuth', badge: 'NIGHT-SHIFT RECON SLEUTH', icon: '🔦' }
};

export const ENVIRONMENT_META: Record<EnvironmentProfileId, EnvironmentMeta> = {
  arcade_neon: {
    id: 'arcade_neon',
    badge: 'BLACKLIGHT ARCADE / RINK',
    icon: '🕹️',
    lightingCue: 'pulsating ultraviolet blacklight and neon cabinet reflections',
    ambientAudio: 'cascading 16-bit arcade attract-mode synths, brass token clatter, and high-voltage neon hum',
    propAnchor: 'glowing coin-op cabinet bank'
  },
  vhs_cinema: {
    id: 'vhs_cinema',
    badge: 'VHS VAULT / DARKROOM',
    icon: '📼',
    lightingCue: 'flickering 35mm projector beams and amber darkroom safelights',
    ambientAudio: 'whirring VHS transport reels, magnetic tape static hiss, and deep analog bass drone',
    propAnchor: 'steel media return chute'
  },
  aquatic_humid: {
    id: 'aquatic_humid',
    badge: 'HYDRO BASIN / MIST ZONE',
    icon: '🌊',
    lightingCue: 'rippling caustic water reflections and blazing ultraviolet neon highlights',
    ambientAudio: 'echoing tile splashes, pressurized pump valves, and subterranean hydro-hum',
    propAnchor: 'tiled basin retaining wall'
  },
  outdoor_night: {
    id: 'outdoor_night',
    badge: 'SODIUM-VAPOR NIGHTWATCH',
    icon: '🌙',
    lightingCue: 'amber sodium-vapor streetlamp pools and wet asphalt rim-lighting',
    ambientAudio: '60Hz overhead transformer buzz, wind whipping through chain-link fencing, and distant thunder',
    propAnchor: 'rain-slicked concrete curb'
  },
  food_court_diner: {
    id: 'food_court_diner',
    badge: 'FOOD COURT / CHROME DINER',
    icon: '🍔',
    lightingCue: 'buzzing neon menu boards and polished chrome counter reflections',
    ambientAudio: 'hissing commercial compressors, sizzling griddle steam, and flickering fluorescent ballast hum',
    propAnchor: 'stainless-steel service counter'
  },
  tech_lab_office: {
    id: 'tech_lab_office',
    badge: 'CRT LAB / 56K BENCH',
    icon: '🖥️',
    lightingCue: 'emerald phosphor CRT monitor glow and electric static arcs',
    ambientAudio: 'degaussing CRT coils, cooling fan drone, dot-matrix stepper motors, and 56k carrier clicks',
    propAnchor: 'heavy CRT monitor rack'
  },
  retail_aisle: {
    id: 'retail_aisle',
    badge: 'FLUORESCENT RETAIL CANYON',
    icon: '🛒',
    lightingCue: 'harsh overhead fluorescent strip lights and waxed linoleum reflections',
    ambientAudio: 'buzzing fluorescent tubes, rattling metal shelving, and distant PA static crackle',
    propAnchor: 'reinforced steel display gondola'
  }
};

export function detectSubjectMorphology(
  entityName: string,
  cardType: 'bad_guy' | 'good_guy' | 'checklist' = 'bad_guy',
  characterDesc: string = ''
): MorphologyId {
  const text = `${entityName} ${characterDesc}`.toLowerCase();

  if (cardType === 'good_guy') {
    if (/(rollerblade|skate|half-pipe|bmx|10-speed|spokes|neon-drift|rink|mini-truck|scooter|wheel)/i.test(text)) {
      return 'wheeled_glider';
    }
    if (/(camcorder|av club|solder|microfiche|polaroid|darkroom|walkman|boombox|keytar|cartridge|oscilloscope|pager|projectionist|geiger|radio|astrology|d20)/i.test(text)) {
      return 'tech_broadcaster';
    }
    if (/(wrestling|coach|hockey|slap-shot|karate|dragon-kick|pinsetter|mechanic|quarterback|tailgate|snowblower|barbecue|lunch lady|grip-tape|billiard|pool-shark)/i.test(text)) {
      return 'heavy_brawler';
    }
    return 'stealth_sleuth';
  }

  // Bad guy classification
  if (/(slime|ooze|gak|putty|lip balm|slushie|soda|syrup|acid|chemical|molten|tar|mango mist|blister-pack|goop|bubblegum)/i.test(text)) {
    return 'slime_ooze';
  }
  if (/(vending|claw machine|pinsetter|escalator|animatronic|robot|drone|lawnmower|aerator|jukebox|rewinder|engine|mangler|crushing|oven|dispenser|water blaster|cannon)/i.test(text)) {
    return 'mechanical_automaton';
  }
  if (/(modem|56k|dial-up|crt|vhs|laserdisc|cd-rom|floppy|cable|defrag|glitch|stereogram|pixel|y2k|hologram|payphone|rotary|channel 3|descrambler|frequency|shareware|microchip|keyboard)/i.test(text)) {
    return 'cyber_signal';
  }
  if (/(boa|serpent|kraken|tentacle|cord|ribbon|stretch|coiled|parasite|strangler|filament|hose|wire)/i.test(text)) {
    return 'serpent_constricter';
  }
  if (/(swarm|hivemind|cluster|syndicate|cabal|chanting|fang swarm|shuriken|pog|figurines)/i.test(text)) {
    return 'swarm_cluster';
  }
  if (/(ghost|phantom|poltergeist|specter|spectre|banshee|revenant|void|psychic|shadow|oracle|chronomancer|incubus|paradox|demiurge|necromancer)/i.test(text)) {
    return 'spectral_phantom';
  }
  if (/(spinner|flail|rollerblade|guillotine|laser pointer|bug zapper|singularity|popping-candy|silly string|8-ball|slap bracelet)/i.test(text)) {
    return 'kinetic_hazard';
  }
  return 'behemoth_golem';
}

export function detectEnvironmentProfile(location: string): EnvironmentProfileId {
  const loc = (location || '').toLowerCase();
  if (/(arcade|laser tag|roller rink|bowling|pinball|blacklight|skeeball|redemption|fighting game)/i.test(loc)) {
    return 'arcade_neon';
  }
  if (/(video|vhs|suncoast|cinema|drive-in|projection|darkroom|photo|tv|broadcast|cassette)/i.test(loc)) {
    return 'vhs_cinema';
  }
  if (/(waterpark|pool|car wash|greenhouse|rainforest|slushie|drain|stormwater|fountain|moat|ice arena)/i.test(loc)) {
    return 'aquatic_humid';
  }
  if (/(cul-de-sac|skatepark|parking lot|rooftop|backyard|quarry|drive-thru|highway|storm cellar|radio tower|driveway|batting cage)/i.test(loc)) {
    return 'outdoor_night';
  }
  if (/(food court|diner|pizza|buffet|soft-serve|bakery|cafeteria|yogurt|concession|soda|luncheonette|snack bar)/i.test(loc)) {
    return 'food_court_diner';
  }
  if (/(computer|software|electronics|soldering|library|microfiche|av club|shareware|control room|equipment room)/i.test(loc)) {
    return 'tech_lab_office';
  }
  return 'retail_aisle';
}

const CAMERA_STYLES = [
  'Dynamic low-angle dolly push-in at 24fps',
  'Sharp Dutch-angle lateral tracking shot at 24fps',
  'Wide floor-level tracking shot with crisp foreground parallax at 24fps',
  'Rapid whip-pan into a tight telephoto lock-off at 24fps',
  'High-contrast Steadicam backward lead shot at 24fps',
  'Overhead security-angle crane drop into eye-level lock at 24fps'
];

export function getChoreographyPresetsForCard(
  entityName: string,
  location: string,
  cardType: 'bad_guy' | 'good_guy' | 'checklist' = 'bad_guy',
  weapon: string = 'improvised weapon',
  artifact: string = 'retro device',
  characterDesc: string = ''
): {
  morphology: MorphologyMeta;
  environment: EnvironmentMeta;
  presets: ChoreographyPreset[];
} {
  const cleanName = (entityName || 'The Subject').replace(/['"]/g, '');
  const loc = location || 'the suburban sector';
  const morphId = detectSubjectMorphology(entityName, cardType, characterDesc);
  const envId = detectEnvironmentProfile(loc);
  const morphology = MORPHOLOGY_META[morphId];
  const environment = ENVIRONMENT_META[envId];
  const prop = environment.propAnchor;
  const light = environment.lightingCue;
  const baseAudio = environment.ambientAudio;

  let presets: ChoreographyPreset[] = [];

  switch (morphId) {
    case 'slime_ooze':
      presets = [
        {
          id: 'hydro_surge_crystallize',
          label: '1. Tidal Surge & Crystallize',
          camera: CAMERA_STYLES[0],
          action: `${cleanName} surges forward in a pressurized wave across ${loc}, crests into a towering jagged wall under ${light}, and flash-hardens into a completely rigid, translucent glass-like monolith.`,
          audio: `Pressurized chemical hiss, heavy viscous slosh, sharp crystalline freeze crack, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'ceiling_drop_splatter_lock',
          label: '2. Overhead Drop & Anchor',
          camera: CAMERA_STYLES[2],
          action: `${cleanName} drops with heavy gravitational force from the ceiling rafters of ${loc}, splashes outward against the ${prop}, and instantaneously locks its pseudopods into a motionless spiked silhouette.`,
          audio: `Wet heavy impact thud, sizzling floor wax corrosion, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'aisle_geyser_eruption',
          label: '3. Geyser Eruption Hold',
          camera: CAMERA_STYLES[1],
          action: `${cleanName} compresses tightly against the floor of ${loc}, erupts straight upward in a high-pressure bio-luminescent geyser, and holds its towering apex pose in eerie zero-gravity stillness.`,
          audio: `Sub-bass hydraulic pressure release, bubbling neon fizz, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'tendril_clamp_freeze',
          label: '4. Pseudopod Clamp Freeze',
          camera: CAMERA_STYLES[3],
          action: `${cleanName} lashes two thick gelatinous tendrils forward to clamp onto the ${prop} inside ${loc}, hauls its massive core forward two paces, and freezes dead still under ${light}.`,
          audio: `Thick rubbery suction snap, creaking metal frame, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'bubble_expansion_shock',
          label: '5. Shockwave Expansion Lock',
          camera: CAMERA_STYLES[4],
          action: `${cleanName} expands rapidly across the width of ${loc}, venting a dense plume of neon vapor around the ${prop}, then solidifies into an unmoving, razor-sharp ridge formation.`,
          audio: `Hissing aerosol vent, deep resonant bass thrum, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'lens_lunge_blackout',
          label: '6. Acid Lunge & Blackout',
          camera: CAMERA_STYLES[5],
          action: `${cleanName} lunges across the polished floor of ${loc} toward the foreground, stops inches from the lens with glowing droplets suspended in mid-air, and holds completely motionless.`,
          audio: `Rapid liquid rush, electrical short-circuit pop, and ${baseAudio}. No dialogue.`
        }
      ];
      break;

    case 'mechanical_automaton':
      presets = [
        {
          id: 'hydraulic_stomp_lock',
          label: '1. Hydraulic Stomp & Lock',
          camera: CAMERA_STYLES[0],
          action: `${cleanName} advances two thunderous mechanical strides through ${loc}, slams its heavy steel chassis against the ${prop}, and locks all pistons into an imposing, motionless stance.`,
          audio: `Crushing hydraulic piston impacts, Pneumatic air-brake release, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'overload_spark_freeze',
          label: '2. High-Voltage Spark Freeze',
          camera: CAMERA_STYLES[1],
          action: `${cleanName} violently snaps its articulated limbs open inside ${loc}, discharges a linear arc of blue electrical sparks into the ${prop}, and freezes rigid as its internal indicators glow.`,
          audio: `High-voltage transformer arc, heavy relay clunk, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'conveyor_ram_halt',
          label: '3. Bulldozer Charge & Halt',
          camera: CAMERA_STYLES[4],
          action: `${cleanName} barrels forward in a straight-line bulldozer charge down ${loc}, shoves the ${prop} aside with screeching metal friction, and brakes to an immediate dead stop.`,
          audio: `Screaming servo motors, scraping sheet metal, abrupt mechanical lock, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'jaw_clamp_statue',
          label: '4. Mechanical Clamp Pose',
          camera: CAMERA_STYLES[3],
          action: `${cleanName} rears back beneath ${light} in ${loc}, snaps its spring-loaded steel jaws shut with a shower of sparks, and holds a rigid, predatory silhouette.`,
          audio: `Metallic guillotine snap, spring-steel recoil, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'vent_purge_lockdown',
          label: '5. Steam Purge Lockdown',
          camera: CAMERA_STYLES[2],
          action: `${cleanName} plants its heavy iron stabilizers into the floor of ${loc}, blasts twin jets of superheated vapor from its side vents, and locks down in total mechanical stillness.`,
          audio: `Twin pressurized steam blasts, heavy iron anchor thud, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'rafter_grapple_hang',
          label: '6. Conduit Grapple Hold',
          camera: CAMERA_STYLES[5],
          action: `${cleanName} fires a motorized steel cable upward into the ceiling girders of ${loc}, hoists its chassis three feet off the floor, and hangs dead still in menacing silhouette.`,
          audio: `Ratcheting steel winch, girder impact clang, and ${baseAudio}. No dialogue.`
        }
      ];
      break;

    case 'cyber_signal':
      presets = [
        {
          id: 'phosphor_phase_lock',
          label: '1. Phosphor Phase-Step Lock',
          camera: CAMERA_STYLES[3],
          action: `${cleanName} stutters forward in three razor-sharp frame-jumps across ${loc}, shatters a wall of static over the ${prop}, and locks into a hyper-crisp, motionless geometric silhouette.`,
          audio: `Screaming 56k baud handshake tone, CRT degauss thump, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'crt_arc_materialize',
          label: '2. High-Voltage Arc Pose',
          camera: CAMERA_STYLES[0],
          action: `${cleanName} surges out of the ${prop} inside ${loc} on a jagged bolt of cyan electricity, plants its form in the center aisle under ${light}, and holds completely motionless.`,
          audio: `Crackling flyback transformer arc, ozone snap, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'scanline_shatter_freeze',
          label: '3. Scanline Shatter Freeze',
          camera: CAMERA_STYLES[1],
          action: `${cleanName} lunges forward through ${loc}, splits the surrounding air into horizontal VHS tracking bands, and halts instantaneously in a rigid, high-contrast freeze-frame.`,
          audio: `Analog tape-head glitch, sub-bass synth drop, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'magnetic_ribbon_anchor',
          label: '4. Data-Ribbon Anchor Hold',
          camera: CAMERA_STYLES[2],
          action: `${cleanName} extends taut ribbons of magnetic data-tape into the structural beams of ${loc}, pulls itself into an elevated suspension pose, and freezes without a tremor.`,
          audio: `High-speed cassette rewind whine, taut metallic snap, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'monolith_pulse_blackout',
          label: '5. EMP Pulse & Blackout',
          camera: CAMERA_STYLES[4],
          action: `${cleanName} strides forward in ${loc}, emits a single blinding rectangular pulse of emerald phosphor light that blows out the overhead fixtures, and stands motionless in the neon dark.`,
          audio: `Glass bulb pop, deep electromagnetic hum, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'lens_rush_cut',
          label: '6. Terminal Velocity Cut',
          camera: CAMERA_STYLES[5],
          action: `${cleanName} accelerates straight toward the lens down ${loc} in a streak of chromatic aberration and exits the frame cleanly before the static settles.`,
          audio: `Doppler modem screech, sharp static cut, and ${baseAudio}. No dialogue.`
        }
      ];
      break;

    case 'serpent_constricter':
      presets = [
        {
          id: 'coil_pillar_anchor',
          label: '1. Pillar Coil & Strike Hold',
          camera: CAMERA_STYLES[0],
          action: `${cleanName} whips its articulated length across ${loc}, wraps two tight coils around the ${prop}, and locks its raised head forward in a motionless, spring-loaded strike posture.`,
          audio: `Whipping cable whoosh, creaking steel compression, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'rafter_drop_ambush',
          label: '2. Rafter Drop Ambush',
          camera: CAMERA_STYLES[5],
          action: `${cleanName} drops half its coiled mass from the ceiling trusses of ${loc}, arrests its descent inches above the floor under ${light}, and freezes rigid with fangs bared.`,
          audio: `Rattling ceiling grid, spring-steel tension snap, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'sidewinder_aisle_lock',
          label: '3. Sidewinder Dash & Lock',
          camera: CAMERA_STYLES[2],
          action: `${cleanName} carves a fast S-curve across the floor of ${loc}, knocks a row of fixtures aside, and plants its muscular tail firmly to hold an unmoving sentinel pose.`,
          audio: `Scraping plastic scales on tile, sharp hiss, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'tendril_span_brace',
          label: '4. Cross-Aisle Brace Freeze',
          camera: CAMERA_STYLES[1],
          action: `${cleanName} anchors its tendrils between two opposite walls of ${loc}, pulls its central mass taut like a bowstring, and holds completely motionless in the glare.`,
          audio: `High-tension cable groan, acoustic thrum, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'gondola_vault_statue',
          label: '5. Display Crest Statue',
          camera: CAMERA_STYLES[3],
          action: `${cleanName} surges up and over the top of the ${prop} in ${loc}, plants its upper coils on the crest, and freezes into a jagged, towering silhouette.`,
          audio: `Heavy metallic clatter, sharp whip crack, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'camera_bypass_slither',
          label: '6. Low-Angle Bypass Exit',
          camera: CAMERA_STYLES[4],
          action: `${cleanName} darts at blinding speed along the floor of ${loc}, shoots directly past the edge of the camera lens, and exits frame cleanly into the shadows.`,
          audio: `Rapid frictional rush, low-end rumble, and ${baseAudio}. No dialogue.`
        }
      ];
      break;

    case 'swarm_cluster':
      presets = [
        {
          id: 'wedge_formation_lock',
          label: '1. Phalanx Wedge Lock',
          camera: CAMERA_STYLES[0],
          action: `${cleanName} surges down ${loc} in a tight synchronized wedge, slams in unison onto the ${prop}, and locks every unit simultaneously into motionless formation.`,
          audio: `Hundreds of synchronized plastic clicks, sharp metallic impact, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'wall_cascade_freeze',
          label: '2. Shelf Cascade & Freeze',
          camera: CAMERA_STYLES[2],
          action: `${cleanName} pours over the upper ledges of ${loc} like a kinetic avalanche, Fan-spreads across the floor under ${light}, and halts on a single synchronized beat.`,
          audio: `Cascading hard-plastic clatter, sudden eerie silence, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'monolith_stack_assemble',
          label: '3. Hive Tower Assembly',
          camera: CAMERA_STYLES[1],
          action: `${cleanName} converges from both sides of ${loc}, interlocks rapidly atop the ${prop} into a single towering totem, and freezes completely rigid.`,
          audio: `Rapid magnetic snap-locks, resonant hum, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'ricochet_volley_halt',
          label: '4. Ricochet Volley Halt',
          camera: CAMERA_STYLES[3],
          action: `${cleanName} launches in a straight linear volley across ${loc}, embeds deeply into the ${prop} with sparks flying, and holds dead still in embedded formation.`,
          audio: `High-speed projectile whiz, consecutive impact thuds, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'strobe_march_stop',
          label: '5. Strobe March Dead-Stop',
          camera: CAMERA_STYLES[4],
          action: `${cleanName} advances three synchronized steps down ${loc} under ${light}, then stops in absolute unison with glowing eyes fixed ahead.`,
          audio: `Rhythmic mechanical march, sharp electronic chime, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'past_lens_flyby',
          label: '6. High-Speed Flyby Exit',
          camera: CAMERA_STYLES[5],
          action: `${cleanName} streaks in a straight, non-looping trajectory down ${loc} directly past the camera lens, exiting the frame cleanly into the dark corridor.`,
          audio: `Doppler whoosh of dozens of units, static crackle, and ${baseAudio}. No dialogue.`
        }
      ];
      break;

    case 'spectral_phantom':
      presets = [
        {
          id: 'shadow_glide_lock',
          label: '1. Zero-G Glide & Lock',
          camera: CAMERA_STYLES[0],
          action: `${cleanName} glides silently six inches above the floor of ${loc}, passes through a beam of ${light}, and locks into a stark, motionless silhouette beside the ${prop}.`,
          audio: `Reversed cassette choir chord, sub-zero frost crackle, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'flicker_step_statue',
          label: '2. Blacklight Strobe Appear',
          camera: CAMERA_STYLES[3],
          action: `Overhead lights in ${loc} flicker twice as ${cleanName} advances twenty feet in a split-second cut, halting dead still in the foreground with piercing luminescence.`,
          audio: `Fluorescent starter pop, deep CRT hum, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'telekinetic_part_hold',
          label: '3. Telekinetic Wake Freeze',
          camera: CAMERA_STYLES[4],
          action: `${cleanName} drifts forward through ${loc}, pushing loose debris symmetrically aside along the floor, then stops completely motionless as gravity locks the room.`,
          audio: `Low-frequency psychic resonance, sliding plastic debris, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'mirror_emerge_halt',
          label: '4. Glass Threshold Emerge',
          camera: CAMERA_STYLES[1],
          action: `${cleanName} steps cleanly out of the reflective surface of the ${prop} inside ${loc}, plants its spectral form under ${light}, and holds an unmoving sentinel stance.`,
          audio: `Crystalline glass chime, analog synth swell, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'ceiling_levitate_lock',
          label: '5. Apex Levitation Hold',
          camera: CAMERA_STYLES[2],
          action: `${cleanName} rises vertically two feet off the floor of ${loc} with cape and contours taut, then locks into a rigid, statuesque mid-air suspension.`,
          audio: `Electrostatic hair-raising hum, distant thunder clap, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'corridor_vanish_exit',
          label: '6. Shadow Rush Exit',
          camera: CAMERA_STYLES[5],
          action: `${cleanName} surges straight down ${loc} in a silent streak of violet afterimages and exits the frame cleanly into deep shadow.`,
          audio: `Sudden vacuum rush, magnetic tape stop click, and ${baseAudio}. No dialogue.`
        }
      ];
      break;

    case 'kinetic_hazard':
      presets = [
        {
          id: 'ricochet_spark_embed',
          label: '1. Ricochet Spark & Embed',
          camera: CAMERA_STYLES[3],
          action: `${cleanName} banks sharply off two hard surfaces in ${loc} with bright friction sparks, slams into the ${prop}, and locks dead still in embedded tension.`,
          audio: `Metallic ricochet zings, sharp impact crunch, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'laser_snap_freeze',
          label: '2. Precision Beam Lock',
          camera: CAMERA_STYLES[0],
          action: `${cleanName} streaks across ${loc}, fires a single razor-straight neon beam across the aisle, and halts instantaneously in a locked mechanical stance.`,
          audio: `1990s laser-tag piezo zap, relay lock click, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'taut_recoil_hold',
          label: '3. Spring-Steel Recoil Hold',
          camera: CAMERA_STYLES[1],
          action: `${cleanName} snaps forward with explosive spring tension inside ${loc}, cracks the tile beside the ${prop}, and freezes in a rigid, high-tension hold.`,
          audio: `Heavy spring-steel snap, ceramic tile crack, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'arc_discharge_statue',
          label: '4. Bug-Zapper Arc Freeze',
          camera: CAMERA_STYLES[2],
          action: `${cleanName} lunges onto the ${prop} in ${loc}, triggers a blinding violet electrical flash under ${light}, and holds completely motionless as smoke curls upward.`,
          audio: `High-voltage bug-zapper snap, transformer hum, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'skid_brake_standoff',
          label: '5. Urethane Skid Brake',
          camera: CAMERA_STYLES[4],
          action: `${cleanName} hurtles down ${loc} at blistering speed, locks its edges in a smoking lateral skid, and stops dead still in the center of the frame.`,
          audio: `Screeching urethane skid on linoleum, bass thump, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'ballistic_frame_exit',
          label: '6. Ballistic Frame Exit',
          camera: CAMERA_STYLES[5],
          action: `${cleanName} rockets in a straight line through ${loc}, streaks past the camera lens with neon motion trails, and exits frame cleanly.`,
          audio: `Supersonic whip-crack, doppler synth pass, and ${baseAudio}. No dialogue.`
        }
      ];
      break;

    case 'behemoth_golem':
      presets = [
        {
          id: 'titan_shoulder_check',
          label: '1. Pillar Impact & Glare',
          camera: CAMERA_STYLES[0],
          action: `${cleanName} charges down ${loc} with ground-shaking momentum, shoulder-checks the ${prop} until the frame shudders, and locks into an imposing, motionless power stance.`,
          audio: `Seismic footsteps, structural concrete crunch, low growl resonance, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'vault_landing_crouch',
          label: '2. Heavy Drop & Three-Point Lock',
          camera: CAMERA_STYLES[2],
          action: `${cleanName} leaps over a barrier in ${loc}, lands in a heavy three-point impact crouch that cracks the floor tile under ${light}, and freezes completely rigid.`,
          audio: `Earth-shattering landing thud, cracking tile, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'barrier_breach_pose',
          label: '3. Display Breach & Hold',
          camera: CAMERA_STYLES[1],
          action: `${cleanName} smashes straight through a partition beside the ${prop} in ${loc}, plants both feet wide in the debris, and holds a towering, unmoving silhouette.`,
          audio: `Shattering acrylic and metal, heavy breathing reverb, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'overhead_press_freeze',
          label: '4. Monolith Hoist Freeze',
          camera: CAMERA_STYLES[3],
          action: `${cleanName} grips the edge of the ${prop} inside ${loc}, tilts it six inches off the floor in a display of raw strength, and freezes in locked isometric tension.`,
          audio: `Groaning structural steel, deep sub-bass rumble, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'shadow_stride_emerge',
          label: '5. Shadow Emerge Sentinel',
          camera: CAMERA_STYLES[4],
          action: `${cleanName} takes two massive, deliberate strides out of the back shadows of ${loc} into ${light} and halts dead still, filling the frame.`,
          audio: `Booming deliberate footfalls, flickering ballast buzz, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'apex_charge_exit',
          label: '6. Freight-Train Charge Exit',
          camera: CAMERA_STYLES[5],
          action: `${cleanName} lowers its shoulders and charges at freight-train velocity down ${loc}, rocketing cleanly past the camera lens out of frame.`,
          audio: `Thunderous stampede rush, wind shear, and ${baseAudio}. No dialogue.`
        }
      ];
      break;

    case 'wheeled_glider':
      presets = [
        {
          id: 'hockey_stop_aim',
          label: '1. Urethane Hockey-Stop Aim',
          camera: CAMERA_STYLES[2],
          action: `${cleanName} carves at high speed down ${loc}, executes a razor-sharp lateral hockey-stop beside the ${prop}, and locks ${weapon} forward in a motionless low stance.`,
          audio: `Screeching urethane wheels on floor wax, precision bearing whirr, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'coping_grind_plant',
          label: '2. Counter Grind & Plant',
          camera: CAMERA_STYLES[1],
          action: `${cleanName} grinds along the metal edge of the ${prop} in ${loc} with a shower of sparks, sticks a clean two-footed dismount under ${light}, and freezes in combat readiness.`,
          audio: `Metallic truck grind, clean deck slap landing, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'powerslide_under_cover',
          label: '3. Low Powerslide Into Cover',
          camera: CAMERA_STYLES[0],
          action: `${cleanName} sprints and drops into a low knee-slide across ${loc}, braces one hand against the ${prop}, and holds ${weapon} steady in total stillness.`,
          audio: `Nylon knee-pad slide, tactile cassette click on ${artifact}, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'wall_bank_rebound',
          label: '4. Banked Wall Rebound Lock',
          camera: CAMERA_STYLES[3],
          action: `${cleanName} banks high off an angled surface in ${loc}, lands with knees bent in the center aisle, and raises ${artifact} in a rigid, motionless scan.`,
          audio: `Rubber tire chirp, suspension compression, electronic beep, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'fakie_pivot_brace',
          label: '5. Half-Cab Pivot & Brace',
          camera: CAMERA_STYLES[4],
          action: `${cleanName} rolls backward through ${loc}, snaps a crisp 180-degree linear pivot without spinning, and plants the brakes dead still with ${weapon} leveled.`,
          audio: `Crisp wheel snap, rubber brake plug stop, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'jet_dash_flyby',
          label: '6. Full-Throttle Flyby Exit',
          camera: CAMERA_STYLES[5],
          action: `${cleanName} pushes off with explosive speed down ${loc}, streaks past the camera lens under ${light}, and exits the frame cleanly.`,
          audio: `High-speed bearing whine, wind rush, and ${baseAudio}. No dialogue.`
        }
      ];
      break;

    case 'tech_broadcaster':
      presets = [
        {
          id: 'Kneel_rig_calibrate',
          label: '1. Tactical Kneel & Lock-On',
          camera: CAMERA_STYLES[0],
          action: `${cleanName} dashes to the ${prop} inside ${loc}, drops to one knee, snaps ${artifact} into active alignment, and holds ${weapon} in a rock-steady, motionless lock.`,
          audio: `Mechanical switch toggle, CRT capacitor whine, cassette engagement click, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'strobe_flash_capture',
          label: '2. Strobe Flash & Freeze',
          camera: CAMERA_STYLES[3],
          action: `${cleanName} braces against the ${prop} in ${loc}, triggers a blinding xenon strobe burst from ${artifact} that illuminates the room, and freezes in a sharp defensive pose.`,
          audio: `Capacitor charge whine, sharp xenon camera flash pop, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'cable_jack_grounding',
          label: '3. Terminal Jack-In Hold',
          camera: CAMERA_STYLES[1],
          action: `${cleanName} slides across ${loc} to an exposed panel on the ${prop}, slams a heavy coaxial connector home with ${artifact}, and holds position in rigid concentration.`,
          audio: `Heavy metallic jack insertion, electrical surge hum, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'antenna_whip_deploy',
          label: '4. Aerial Deploy & Scan',
          camera: CAMERA_STYLES[2],
          action: `${cleanName} takes two brisk steps into ${loc} under ${light}, snaps ${weapon} and ${artifact} to full extension, and locks into an unmoving signal-tracking stance.`,
          audio: `Telescoping metal whip snap, Geiger-style frequency ticks, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'cover_peek_telemetry',
          label: '5. Gondola Recon Brace',
          camera: CAMERA_STYLES[4],
          action: `${cleanName} slips behind the ${prop} in ${loc}, angles ${artifact} down the dark corridor, and freezes completely still as green telemetry illuminates their visor.`,
          audio: `Soft sneaker plant, digital chronograph beep, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'evasive_stride_exit',
          label: '6. Recon Sprint Exit',
          camera: CAMERA_STYLES[5],
          action: `${cleanName} secures ${artifact} to their belt, sprints down ${loc} with ${weapon} held tight, and exits the camera frame cleanly into the shadows.`,
          audio: `Rapid sneaker footsteps, gear belt clatter, and ${baseAudio}. No dialogue.`
        }
      ];
      break;

    case 'heavy_brawler':
      presets = [
        {
          id: 'two_handed_guard_plant',
          label: '1. Heavy Guard Plant & Lock',
          camera: CAMERA_STYLES[0],
          action: `${cleanName} charges forward into ${loc}, plants both boots wide beside the ${prop}, and locks ${weapon} across their chest in an unyielding, motionless guard stance.`,
          audio: `Heavy rubber-soled boot plant, solid wood-and-steel grip tap, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'barrier_shove_brace',
          label: '2. Counter Breach & Brace',
          camera: CAMERA_STYLES[1],
          action: `${cleanName} drives a shoulder into a barricade in ${loc}, clears the lane beside the ${prop}, and freezes in a low, coiled combat stance with ${weapon} raised.`,
          audio: `Heavy metallic crash, sliding fixture scrape, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'floor_strike_shock',
          label: '3. Ground Anchor Impact',
          camera: CAMERA_STYLES[2],
          action: `${cleanName} strides into the center of ${loc} under ${light}, drives the butt of ${weapon} firmly onto the floor tile, and stands like an unmoving statue.`,
          audio: `Resonant metallic floor strike, echoing hall reverb, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'vault_over_counter',
          label: '4. Tactical Vault & Plant',
          camera: CAMERA_STYLES[3],
          action: `${cleanName} vaults cleanly over the ${prop} inside ${loc}, lands solidly on both feet without a stumble, and points ${weapon} forward in total stillness.`,
          audio: `Hand-plant thud on laminate, heavy two-boot landing, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'artifact_shield_wall',
          label: '5. Relic Shield Wall Hold',
          camera: CAMERA_STYLES[4],
          action: `${cleanName} skids to a halt in ${loc}, raises ${artifact} in their lead hand like a tactical buckler with ${weapon} cocked back, and holds completely motionless.`,
          audio: `Scuffing high-top sneakers, metallic latch click, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'rush_past_camera',
          label: '6. Point-Blank Charge Exit',
          camera: CAMERA_STYLES[5],
          action: `${cleanName} lowers their center of gravity and sprints straight down ${loc} with ${weapon} at the ready, charging cleanly past the camera lens out of frame.`,
          audio: `Pounding athletic footsteps, jacket fabric rustle, and ${baseAudio}. No dialogue.`
        }
      ];
      break;

    case 'stealth_sleuth':
    default:
      presets = [
        {
          id: 'flashlight_sweep_lock',
          label: '1. Cross-Wrist Beam Lock',
          camera: CAMERA_STYLES[0],
          action: `${cleanName} moves swiftly to the ${prop} in ${loc}, drops into a braced tactical crouch, and locks ${artifact} and ${weapon} forward in a motionless cross-wrist hold.`,
          audio: `Crisp flashlight switch click, rubber sole squeak on tile, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'slide_into_shadow',
          label: '2. Corner Slide & Freeze',
          camera: CAMERA_STYLES[2],
          action: `${cleanName} executes a fast low slide across ${loc} into the shadow of the ${prop}, bringing ${weapon} up to eye level and freezing without a sound.`,
          audio: `Smooth cloth-on-linoleum slide, subtle gear click, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'doorway_breach_hold',
          label: '3. Threshold Breach & Hold',
          camera: CAMERA_STYLES[3],
          action: `${cleanName} steps sharply out from behind the ${prop} in ${loc} under ${light}, plants their lead foot firmly, and holds ${weapon} in a rock-solid aim.`,
          audio: `Quick tactical step, windbreaker rustle, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'low_recon_scan',
          label: '4. One-Knee Recon Lock',
          camera: CAMERA_STYLES[1],
          action: `${cleanName} drops to one knee in the center of ${loc}, activates ${artifact} with a soft neon glow, and remains completely motionless while scanning the sector.`,
          audio: `Electronic relic hum, quiet relay click, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'back_to_pillar_brace',
          label: '5. Pillar Cover Brace',
          camera: CAMERA_STYLES[4],
          action: `${cleanName} darts across ${loc}, plants their back flat against the ${prop}, and locks ${weapon} at the ready in total stillness.`,
          audio: `Two rapid footsteps, solid back-plant against steel, and ${baseAudio}. No dialogue.`
        },
        {
          id: 'shadow_evade_exit',
          label: '6. Shadow Evade Exit',
          camera: CAMERA_STYLES[5],
          action: `${cleanName} dashes diagonally across ${loc} under ${light} with ${artifact} and ${weapon} secured, exiting the camera frame cleanly into deep cover.`,
          audio: `Swift sneaker dash, distant door latch, and ${baseAudio}. No dialogue.`
        }
      ];
      break;
  }

  return {
    morphology,
    environment,
    presets
  };
}

export function buildFlowVideoPromptFromPreset(
  encounter: CombatEncounter,
  preset: ChoreographyPreset,
  artStyleOverride?: string
): string {
  const styleText = artStyleOverride || encounter.visual_style || '1990s graphic novel ink-and-gouache art style';
  return `Animate the provided image: Maintain exact subject likeness, environment geometry, and ${styleText} from the source image. Camera: ${preset.camera}. Runtime: Exactly 4.0 seconds. Action: ${preset.action} Ending directive: Grounded, definitive finish. Absolutely NO swirling, NO weapon twirling, NO spinning in circles, NO circular vortex loops, and NO sinking or melting downward into the floor! The subject holds their final position completely rigid or exits frame cleanly. Fluid 24fps motion, smooth easing, no texture jitter. Audio: ${preset.audio}`;
}

// Track recently used preset IDs so consecutive rolls never pick the same movement pattern
const recentPresetIds: string[] = [];

export function generateDynamicVideoPrompts(params: {
  entityName: string;
  location: string;
  cardType: 'bad_guy' | 'good_guy' | 'checklist';
  weapon: string;
  artifact: string;
  characterDesc?: string;
  artStyle?: string;
  preferredIndex?: number;
}): {
  videoPrompt: string;
  flowPrompt: string;
  morphologyId: MorphologyId;
  environmentId: EnvironmentProfileId;
  chosenPreset: ChoreographyPreset;
} {
  const { morphology, environment, presets } = getChoreographyPresetsForCard(
    params.entityName,
    params.location,
    params.cardType,
    params.weapon,
    params.artifact,
    params.characterDesc
  );

  let chosenPreset = presets[0];
  if (typeof params.preferredIndex === 'number' && presets[params.preferredIndex % presets.length]) {
    chosenPreset = presets[params.preferredIndex % presets.length];
  } else {
    const unused = presets.filter(p => !recentPresetIds.includes(p.id));
    const pool = unused.length > 0 ? unused : presets;
    chosenPreset = pool[Math.floor(Math.random() * pool.length)];
  }

  recentPresetIds.push(chosenPreset.id);
  if (recentPresetIds.length > 18) {
    recentPresetIds.shift();
  }

  const styleText = params.artStyle || '1990s Dark Horse graphic novel ink-and-watercolor aesthetic';
  const antiSwirl = 'Ending action rule: Absolute grounded finish. Strictly NO swirling, NO weapon twirling, NO spinning items in circles, and NO floor sinking. The subject holds their final position steady or exits frame cleanly.';

  const videoPrompt = `${chosenPreset.camera} inside ${params.location}. Visual style: Stylized ${styleText}, non-photorealistic. Runtime: Exactly 4.0 seconds. Action: ${chosenPreset.action} ${antiSwirl}\nAudio: ${chosenPreset.audio}`;

  const flowPrompt = `Animate the provided image: Maintain exact subject likeness, environment geometry, and ${styleText} from the source image. Camera: ${chosenPreset.camera}. Runtime: Exactly 4.0 seconds. Action: ${chosenPreset.action} Ending directive: Grounded, definitive finish. Absolutely NO swirling, NO weapon twirling, NO spinning in circles, NO circular vortex loops, and NO sinking or melting downward into the floor! The subject holds their final position completely rigid or exits frame cleanly. Fluid 24fps motion, smooth easing, no texture jitter. Audio: ${chosenPreset.audio}`;

  return {
    videoPrompt,
    flowPrompt,
    morphologyId: morphology.id,
    environmentId: environment.id,
    chosenPreset
  };
}
