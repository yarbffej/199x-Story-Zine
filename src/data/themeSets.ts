import { CardThemeType } from '../types';
import {
  SUBURBAN_LOCATIONS,
  SUBURBAN_ANOMALIES,
  RETRO_CHARACTERS,
  IMPROVISED_GEAR,
  RETRO_ART_STYLES,
  COSMIC_DISTORTIONS,
  STATUS_AFFLICTIONS
} from './retroLibrary';
import {
  ME_LOCATIONS,
  ME_ANOMALIES,
  ME_CHARACTERS,
  ME_GEAR,
  ME_ART_STYLES,
  ME_DISTORTIONS,
  ME_AFFLICTIONS
} from './mutableEchoLibrary';

export type UniverseId = '199x' | 'mutable-echo';

export interface ThemeSetDefinition {
  id: string;
  universe?: UniverseId;
  name: string;
  shortBadge: string;
  icon: string;
  tagline: string;
  accentColor: string;
  cardThemes: CardThemeType[];
  threatColors: string[];
  locationPattern: RegExp;
  anomalyPattern: RegExp;
  characterPattern: RegExp;
  gearPattern: RegExp;
  preferredArtStyles: string[];
  preferredDistortions: string[];
  preferredAfflictions: string[];
}

export const THEME_SETS: ThemeSetDefinition[] = [
  {
    id: 'all',
    name: 'All Series 2 (Master Pool)',
    shortBadge: 'SERIES 2 MASTER',
    icon: '🌐',
    tagline: 'Complete 500+ 199X Suburban Cosmic Pool',
    accentColor: '#FF007F',
    cardThemes: [
      'memphis-rad', 'atomic-purple', 'laser-backdrop', 'gold-embossed', 'toxic-ooze',
      'cracked-ice', 'cyber-pcb', 'synthwave-grid', 'vintage-cardstock', 'liquid-chrome',
      'cosmic-nebula', 'hypercolor-thermal', 'vhs-static', 'jazz-cup', 'holo-diffraction'
    ],
    threatColors: ['#FF007F', '#39FF14', '#00F0FF', '#FFE600', '#BD00FF', '#FF5500'],
    locationPattern: /.*/i,
    anomalyPattern: /.*/i,
    characterPattern: /.*/i,
    gearPattern: /.*/i,
    preferredArtStyles: RETRO_ART_STYLES,
    preferredDistortions: COSMIC_DISTORTIONS,
    preferredAfflictions: STATUS_AFFLICTIONS
  },
  {
    id: 'arcade-laser-afterhours',
    name: 'Arcade & Laser Tag After Hours',
    shortBadge: 'ARCADE AFTER HOURS',
    icon: '🕹️',
    tagline: 'Blacklight Mazes, Coin-Op Pits & Roller Rinks',
    accentColor: '#00F0FF',
    cardThemes: ['synthwave-grid', 'laser-backdrop', 'holo-diffraction', 'atomic-purple', 'memphis-rad'],
    threatColors: ['#00F0FF', '#FF007F', '#BD00FF', '#39FF14'],
    locationPattern: /(arcade|laser tag|roller rink|bowling|pinball|skeeball|redemption|fighting game|game cage|chained game|miniature golf|bumper boat)/i,
    anomalyPattern: /(arcade|laser|token|skeeball|bowling|pinsetter|rollerblade|digital pet|virtual|game counselor|jukebox|stereogram|bop|reflex|8-ball|hologram|clown|pinball|disco-ball|fortune-teller|mini-golf|roller-rink|ticket-muncher|spring-coil|kaleidoscope|fog-machine)/i,
    characterPattern: /(quarter-king|laser-ace|boombox|pinsetter|neon-drift|bop-it|pool-shark|card-shark|d20|glitter)/i,
    gearPattern: /(arcade|laser|rollerblade|yo-yo|pog|handheld|light-up|skateboard|billiard|pool cue|bowling|vest)/i,
    preferredArtStyles: [
      "Jim Lee style 90s graphic novel action illustration with dynamic shadows and saturated gouache",
      "16-bit painted box art illustration with dramatic gouache lighting and airbrushed glows",
      "Late-night comic book panel with saturated 1990s color palette and dramatic inkwork"
    ],
    preferredDistortions: [
      "Arcade coin return chutes spit polished obsidian tokens from another dimension.",
      "Fluorescent ceiling tubes hum at strange dimensional frequencies.",
      "Floor polish creates an event horizon reflecting distant nebulae."
    ],
    preferredAfflictions: [
      "Blacklight Pupil Dilation",
      "Laser Tag Sensor Sickness",
      "Thumb Button Spasm",
      "Virtual Pet Guilt Burden"
    ]
  },
  {
    id: 'vhs-midnight-vault',
    name: 'Midnight VHS & Cinema Vault',
    shortBadge: 'MIDNIGHT VHS VAULT',
    icon: '📼',
    tagline: 'Rental Backrooms, 1-Hour Darkrooms & Late Fees',
    accentColor: '#BD00FF',
    cardThemes: ['vhs-static', 'atomic-purple', 'cosmic-nebula', 'cracked-ice', 'laser-backdrop'],
    threatColors: ['#BD00FF', '#FF0055', '#00E5FF', '#FFE600'],
    locationPattern: /(video|vhs|suncoast|cinema|drive-in|darkroom|photo|tv|broadcast|cassette|record store|music megastore|comic shop)/i,
    anomalyPattern: /(vhs|video|rewinder|projectionist|camera|darkroom|photo|negative|cassette|voice|audio|psychic hotline|channel 3|rotary|payphone|slide viewer|bookmark|horror book|drive-in|portrait-kiosk|ventriloquist|velvet painting|halftone|shadow fox|cuckoo-clock)/i,
    characterPattern: /(av club|projectionist|polaroid|darkroom|walkman|astrology|raincoat|riot-grrrl|keytar|card-shark)/i,
    gearPattern: /(vhs|camcorder|video|cassette|talk-boy|walkman|3d slide|laserdisc|cd player|camera|phone|audio)/i,
    preferredArtStyles: [
      "Dark Horse 90s indie horror comic book illustration with heavy ink pools and neon rim-light",
      "Todd McFarlane style 90s comic book splash page with heavy black contour inks and rich crosshatching",
      "Gritty 1990s pulp graphic novel illustration with deep suburban shadows and electric highlights"
    ],
    preferredDistortions: [
      "VHS tape magnetic ribbons unravel through four-dimensional space.",
      "Televisions across the showroom broadcast yesterday's conversations in eerie reverse.",
      "The payphone bank rings in complex microtonal choral harmonies."
    ],
    preferredAfflictions: [
      "Magnetic Tape Glitch",
      "Stereo Separation Vertigo",
      "Static-Shock Hallucinations",
      "Homesick for 1996"
    ]
  },
  {
    id: 'dead-mall-retail',
    name: 'Dead Mall & Clearance Aisle',
    shortBadge: 'DEAD MALL SECTOR',
    icon: '🛍️',
    tagline: '8:59 PM Clearance Canyons, Escalators & Security',
    accentColor: '#FF007F',
    cardThemes: ['memphis-rad', 'jazz-cup', 'gold-embossed', 'hypercolor-thermal', 'holo-diffraction'],
    threatColors: ['#FF007F', '#00FFA3', '#FFE600', '#00F0FF'],
    locationPattern: /(novelty depot|clearance|department store|mall|catalog|layaway|dressing room|shoe|carpet|toy warehouse|seasonal|blue-light|nail salon|laundromat)/i,
    anomalyPattern: /(mall|manager|walker|escalator|security|santa|claw machine|plush|denim|t-shirt|windbreaker|mannequin|wish-book|gargoyle|troll doll|action figure|micro-mansion|shark puppet|carousel|shopping-cart|laundromat|dryer|chandelier|lava-lamp|neon-sign|snowglobe|rock-shop|aquarium|teacup)/i,
    characterPattern: /(neon-drift|mall security|henderson|coupons|dayglo|scrunchie|pawn-shop|dragon-kick|slap-bracelet)/i,
    gearPattern: /(sneakers|slap-bracelet|mirror|watch|skillet|shopping|coat|windbreaker|umbrella|compact|hair gel|stapler)/i,
    preferredArtStyles: [
      "90s Dark Horse indie graphic novel ink-and-watercolor illustration",
      "Bruce Timm 90s animated series dynamic cel art on dark painted gouache background",
      "Late-night comic book panel with saturated 1990s color palette and dramatic inkwork"
    ],
    preferredDistortions: [
      "Aisle linoleum tiles warp into infinite geometric voids.",
      "Clearance price tags peel off shelves and flutter upward like glowing moths.",
      "Mall skylights reveal a churning vortex of purple nebulae and floating debris.",
      "Display mannequins in shop windows begin breathing in synchronized rhythm."
    ],
    preferredAfflictions: [
      "Existential Mall Doldrums",
      "Hypercolor Fever Sweats",
      "Muzak-Induced Dissociation",
      "Plastic Vapor Intoxication"
    ]
  },
  {
    id: 'food-court-mutants',
    name: 'Food Court & Slushie Bio-Mutants',
    shortBadge: 'BIO-SLIME COURT',
    icon: '🥤',
    tagline: 'Radioactive Slushies, Fun-Pack Slime & Animatronic Pizza',
    accentColor: '#39FF14',
    cardThemes: ['toxic-ooze', 'hypercolor-thermal', 'memphis-rad', 'jazz-cup', 'atomic-purple'],
    threatColors: ['#39FF14', '#CCFF00', '#FF3366', '#FF6600'],
    locationPattern: /(soft-serve|pizza|food court|slushie|cafeteria|snack bar|popcorn|soda|bakery|buffet|diner|yogurt|ice cream|fast food|drive-thru)/i,
    anomalyPattern: /(slime|slushie|blender|pizza|soda|gum|candy|drink|lip balm|gak|ooze|goop|pastry|pie|lunch counter|popping-candy|drive-thru|animatronic|vending|snow-cone|pretzel|soft-serve|toaster|bubble-tea|cotton-candy|gumball|popcorn|root-beer|nacho-cheese|ice cream)/i,
    characterPattern: /(short-order|slush-queen|jawbreaker|lunch lady|barbecue)/i,
    gearPattern: /(slime|skillet|plunger|waffle iron|ladle|drink straw|candy|putty|bucket|griddle|squeegee)/i,
    preferredArtStyles: [
      "Gross-out 90s skateboard deck screen-printed graphic with thick contour linework",
      "90s Dark Horse indie graphic novel ink-and-watercolor illustration",
      "Todd McFarlane style 90s comic book splash page with heavy black contour inks and rich crosshatching"
    ],
    preferredDistortions: [
      "Soft-serve dispenser spews churning black-hole antimatter cream.",
      "Vending machines drop chilled cans containing liquid starlight.",
      "Drive-thru squawk box emits the dying whispers of forgotten stars."
    ],
    preferredAfflictions: [
      "Sugar Crash Lethargy",
      "Slime-Coated Equilibrium",
      "Pop-Rock Tongue Fissure",
      "Nostalgia-Poisoned"
    ]
  },
  {
    id: 'cyber-56k-glitch',
    name: '56k Dial-Up & Tech Bench Glitch',
    shortBadge: '56K CYBER GLITCH',
    icon: '💾',
    tagline: 'Modem Singularities, CRT Walls & Floppy Necromancy',
    accentColor: '#00FFA3',
    cardThemes: ['cyber-pcb', 'liquid-chrome', 'vhs-static', 'synthwave-grid', 'cracked-ice'],
    threatColors: ['#00FFA3', '#00F0FF', '#39FF14', '#FFE600'],
    locationPattern: /(software|kiosk|soldering|computer|crt|microfiche|electronics|car audio|shareware|equipment room|control room|radio tower|satellite)/i,
    anomalyPattern: /(modem|56k|dial-up|crt|floppy|cd-rom|aol|battery|camera|cable|descrambler|microchip|y2k|defrag|dos|shareware|co-processor|link cable|flyback|monolith)/i,
    characterPattern: /(pixel|solder|pendelton|microfiche|cartridge|pawn-shop|mini-truck|air-conditioner)/i,
    gearPattern: /(floppy|console|battery|soldering|crt|pager|vr headset|cartridge|mouse|receipt|watch|aerial|cable)/i,
    preferredArtStyles: [
      "16-bit painted box art illustration with dramatic gouache lighting and airbrushed glows",
      "Jim Lee style 90s graphic novel action illustration with dynamic shadows and saturated gouache",
      "Dark Horse 90s indie horror comic book illustration with heavy ink pools and neon rim-light"
    ],
    preferredDistortions: [
      "Cash register receipts print unreadable astrological coordinates.",
      "Security uniform patches unravel into living barcode tendrils.",
      "Automatic sliding doors slice cleanly through the spacetime continuum."
    ],
    preferredAfflictions: [
      "Dial-Up Deafness",
      "Chronologically Misaligned",
      "Static-Shock Hallucinations",
      "Stereogram Stare Catatonia"
    ]
  },
  {
    id: 'cul-de-sac-nightwatch',
    name: 'Cul-de-Sac & Backyard Nightwatch',
    shortBadge: 'CUL-DE-SAC WATCH',
    icon: '🛸',
    tagline: 'Sprinkler Vortexes, Half-Pipes, Storm Cellars & Quarries',
    accentColor: '#FFE600',
    cardThemes: ['cosmic-nebula', 'cracked-ice', 'liquid-chrome', 'atomic-purple', 'vintage-cardstock'],
    threatColors: ['#FFE600', '#00F0FF', '#FF5500', '#76FF03'],
    locationPattern: /(cul-de-sac|skatepark|parking lot|basement|waterpark|pool|rooftop|stormwater|batting cage|tire|garage|trampoline|quarry|climbing|drive-in|greenhouse|storm cellar|culvert|car wash|driveway|radio tower)/i,
    anomalyPattern: /(water|lawnmower|aerator|asphalt|bug zapper|kraken|vigilante|battery acid|tire|semi-truck|unicorn|8-ball|hellhound|fogger|alien|flamingo|attic|treehouse|garden hose|trampoline|firefly|sprout-head|scarecrow|sump-pump|noodle|pool-noodle|neon-moth|rain-puddle|storm-cloud|barn-owl|venus-flytrap|raccoon|cactus|skateboard)/i,
    characterPattern: /(alley-cat|spokes|half-pipe|snowblower|grip-tape|bait-shop|barbecue|tailgate|cardboard)/i,
    gearPattern: /(garden|baseball|skateboard|bicycle|maglite|crowbar|tire|hammer|wrench|shovel|rake|hose|water|flashlight)/i,
    preferredArtStyles: [
      "Gritty 1990s pulp graphic novel illustration with deep suburban shadows and electric highlights",
      "90s Dark Horse indie graphic novel ink-and-watercolor illustration",
      "Bruce Timm 90s animated series dynamic cel art on dark painted gouache background"
    ],
    preferredDistortions: [
      "The ceiling sprinkler heads spray hyper-dense gravitational mercury.",
      "Shopping carts roll against gravity toward a singular localized point.",
      "Escalators climb continuously into a starry purple night void."
    ],
    preferredAfflictions: [
      "Homesick for 1996",
      "Nostalgia-Poisoned",
      "Chronologically Misaligned",
      "Velcro Friction Burns"
    ]
  },
  {
    id: 'scholastic-schoolyard',
    name: 'Scholastic Book Fair & Schoolyard',
    shortBadge: 'SCHOLASTIC HAUNT',
    icon: '🎒',
    tagline: 'Book Fair Labyrinths, Trapper Keepers, POGs & Gym Floors',
    accentColor: '#FFAB00',
    cardThemes: ['vintage-cardstock', 'laser-backdrop', 'gold-embossed', 'memphis-rad', 'holo-diffraction'],
    threatColors: ['#FFAB00', '#FF007F', '#00E5FF', '#39FF14'],
    locationPattern: /(scholastic|book|school|wrestling|library|play-zone|ball pit|cafeteria|playground|marble|av club|dentist|band room|hobby shop)/i,
    anomalyPattern: /(pog|binder|book|play-zone|ball-pit|pta|ankle|compact|bookmark|8-ball|marionette|fang|counselor|figurines|stereogram|sock-monkey|ceiling-star|color-block|transit-bus|library|card-catalog|origami|sticky-hand|jack-in-the-box)/i,
    characterPattern: /(maya lin|coach miller|titanium|pendelton|slap-shot|microfiche|coupons|slap-bracelet|d20|pom-pom|cross|cardboard|tailgate|glitter|lunch lady)/i,
    gearPattern: /(trapper keeper|lunchbox|pog|folder|binder|pencil|hockey|jump rope|dart bow|sketch|gazette|ankle|dental|crutch)/i,
    preferredArtStyles: [
      "90s Dark Horse indie graphic novel ink-and-watercolor illustration",
      "Jim Lee style 90s graphic novel action illustration with dynamic shadows and saturated gouache",
      "16-bit painted box art illustration with dramatic gouache lighting and airbrushed glows"
    ],
    preferredDistortions: [
      "Clearance price tags peel off shelves and flutter upward like glowing moths.",
      "Aisle linoleum tiles warp into infinite geometric voids.",
      "Fluorescent ceiling tubes hum at strange dimensional frequencies."
    ],
    preferredAfflictions: [
      "Velcro Friction Burns",
      "Nostalgia-Poisoned",
      "Stereogram Stare Catatonia",
      "Virtual Pet Guilt Burden"
    ]
  }
];

export const MUTABLE_ECHO_THEME_SETS: ThemeSetDefinition[] = [
  {
    id: 'me-all',
    universe: 'mutable-echo',
    name: 'All Mutable Echo Nodes (Phases 01–50)',
    shortBadge: 'ME! MASTER ARCHIVE',
    icon: '🗡️',
    tagline: 'Destiny gets tangled. ME! untangles it. (50-Phase Matrix)',
    accentColor: '#00F0FF',
    cardThemes: [
      'cyber-pcb', 'vhs-static', 'synthwave-grid', 'liquid-chrome', 'cosmic-nebula',
      'cracked-ice', 'atomic-purple', 'toxic-ooze', 'gold-embossed', 'laser-backdrop'
    ],
    threatColors: ['#00F0FF', '#FF007A', '#00CC88', '#FFAA00', '#A855F7'],
    locationPattern: /.*/i,
    anomalyPattern: /.*/i,
    characterPattern: /.*/i,
    gearPattern: /.*/i,
    preferredArtStyles: ME_ART_STYLES,
    preferredDistortions: ME_DISTORTIONS,
    preferredAfflictions: ME_AFFLICTIONS
  },
  {
    id: 'me-iron-chapel',
    universe: 'mutable-echo',
    name: 'Node BB // Iron Chapel & Sub-Sector 4',
    shortBadge: 'NODE BB: IRON CHAPEL',
    icon: '⚙️',
    tagline: 'Weeping Copper Conduits, The Dry Floor (Log 006) & Sodium Mist',
    accentColor: '#FFAA00',
    cardThemes: ['cyber-pcb', 'gold-embossed', 'liquid-chrome', 'vhs-static'],
    threatColors: ['#FFAA00', '#00F0FF', '#FF007A'],
    locationPattern: /(iron chapel|sub-sector 4|sub-level 4|dry floor|conduit|catacomb|manifold|gantry)/i,
    anomalyPattern: /(tether|golem|automaton|404-null|echo-echo|obsidian sentry|lattice weaver)/i,
    characterPattern: /(me!|walter|shift-boss|marek|felix)/i,
    gearPattern: /(tuning blade|broom|bypass rod|wrench|stethoscope|foundry|pry-bar)/i,
    preferredArtStyles: [ME_ART_STYLES[1], ME_ART_STYLES[3], ME_ART_STYLES[0]],
    preferredDistortions: [ME_DISTORTIONS[2], ME_DISTORTIONS[1], ME_DISTORTIONS[0]],
    preferredAfflictions: ['OBSERVATIONAL DREAD', 'OBLIGATION DENSITY: CRITICAL', 'WARM EQUILIBRIUM ACHIEVED']
  },
  {
    id: 'me-silent-lines',
    universe: 'mutable-echo',
    name: 'Node LL // Silent Lines & Signal Labs',
    shortBadge: 'NODE LL: SILENT LINES',
    icon: '🔬',
    tagline: 'Dr. Aris, Compound Lenses, CRT Telemetry & Wet Cliffside Sea-Base',
    accentColor: '#A855F7',
    cardThemes: ['atomic-purple', 'vhs-static', 'cracked-ice', 'cyber-pcb'],
    threatColors: ['#A855F7', '#00F0FF', '#FF007A'],
    locationPattern: /(silent lines|cliffside|sea-base|cryo|server-well|navigation bridge|arcade)/i,
    anomalyPattern: /(kaelen-9|sub-routine delta|memory drone|spectral diver|mirror-kin|tether)/i,
    characterPattern: /(aris|selene|vance|corbin|felix|me!)/i,
    gearPattern: /(compound ocular|crt|wetline|lantern|scan-jammer|tuning blade)/i,
    preferredArtStyles: [ME_ART_STYLES[4], ME_ART_STYLES[0], ME_ART_STYLES[1]],
    preferredDistortions: [ME_DISTORTIONS[6], ME_DISTORTIONS[3], ME_DISTORTIONS[4]],
    preferredAfflictions: ['0.43s HESITATION ANOMALY', 'INCOMPLETENESS GAP // NON-RECOVERABLE', 'SEVERANCE DEPTH: ABSOLUTE']
  },
  {
    id: 'me-blueprint-woods',
    universe: 'mutable-echo',
    name: 'Node AF33 // Living Blueprint Woods',
    shortBadge: 'NODE AF33: WOODS',
    icon: '🌲',
    tagline: 'Brass-Armored Pines, Cyan Sap, Vitrified Chalk & 80Hz Thrums',
    accentColor: '#00CC88',
    cardThemes: ['cyber-pcb', 'cracked-ice', 'synthwave-grid', 'toxic-ooze'],
    threatColors: ['#00CC88', '#00F0FF', '#FFAA00'],
    locationPattern: /(blueprint|af33|mangrove|geode|mesozoic|jungle|ferns)/i,
    anomalyPattern: /(tether|nix|spore weaver|swarm envoy|xylar|silicon monk)/i,
    characterPattern: /(lily|one who followed|asha|s'keth|me!)/i,
    gearPattern: /(chalk|tuning blade|lantern|sextant|pry-bar)/i,
    preferredArtStyles: [ME_ART_STYLES[2], ME_ART_STYLES[0], ME_ART_STYLES[4]],
    preferredDistortions: [ME_DISTORTIONS[0], ME_DISTORTIONS[1], ME_DISTORTIONS[3]],
    preferredAfflictions: ['10-12 FPS TEMPORAL STUTTER', 'SEVERANCE DEPTH: ABSOLUTE', 'WARM EQUILIBRIUM ACHIEVED']
  },
  {
    id: 'me-architect-core',
    universe: 'mutable-echo',
    name: 'Node AZ // Architect Core & Monolithic Sieve',
    shortBadge: 'NODE AZ: ARCHITECT',
    icon: '🏛️',
    tagline: 'Mirror-Slick Obsidian Cathedral, 432Hz Carrier Wave & Log 009',
    accentColor: '#00F0FF',
    cardThemes: ['cosmic-nebula', 'liquid-chrome', 'cracked-ice', 'synthwave-grid'],
    threatColors: ['#00F0FF', '#FF007A', '#FFFFFF'],
    locationPattern: /(architect|obsidian|monolithic sieve|anchor point|moon|cloud reefs)/i,
    anomalyPattern: /(last architect|architect envoy|archival core|silicon monk|corpse-god|obsidian sentry)/i,
    characterPattern: /(me!|vance|one who followed|lyra|asha)/i,
    gearPattern: /(tuning blade|wetline|lantern|sextant)/i,
    preferredArtStyles: [ME_ART_STYLES[5], ME_ART_STYLES[1], ME_ART_STYLES[0]],
    preferredDistortions: [ME_DISTORTIONS[1], ME_DISTORTIONS[2], ME_DISTORTIONS[6]],
    preferredAfflictions: ['SEVERANCE DEPTH: ABSOLUTE', 'OBLIGATION DENSITY: CRITICAL', 'INCOMPLETENESS GAP // NON-RECOVERABLE']
  },
  {
    id: 'me-chitinous-trenches',
    universe: 'mutable-echo',
    name: 'Chitinous Trenches & Boiling Mercury',
    shortBadge: 'CHITINOUS TRENCH',
    icon: '🦀',
    tagline: 'Qrix, The Dredge Queen, Brine-Divers & Subterranean Salt Vaults',
    accentColor: '#39FF14',
    cardThemes: ['toxic-ooze', 'cyber-pcb', 'atomic-purple', 'liquid-chrome'],
    threatColors: ['#39FF14', '#00CC88', '#FFAA00'],
    locationPattern: /(mercury|trench|saltwater|hydrothermal|submerged|kilobyte sea)/i,
    anomalyPattern: /(qrix|vaelith|oron|kragor|dredge queen|corpse-god|spore weaver)/i,
    characterPattern: /(orlov|corbin|tarek|s'keth|tannis)/i,
    gearPattern: /(plasma torch|geiger|stethoscope|canister|bypass rod)/i,
    preferredArtStyles: [ME_ART_STYLES[0], ME_ART_STYLES[3], ME_ART_STYLES[1]],
    preferredDistortions: [ME_DISTORTIONS[1], ME_DISTORTIONS[3], ME_DISTORTIONS[5]],
    preferredAfflictions: ['OBLIGATION DENSITY: CRITICAL', 'OBSERVATIONAL DREAD', '10-12 FPS TEMPORAL STUTTER']
  },
  {
    id: 'me-temporal-loops',
    universe: 'mutable-echo',
    name: 'Chrono-Vapor & Mirror-Kin Loops',
    shortBadge: '4.2s STUTTER LOOP',
    icon: '⏳',
    tagline: 'Logs 001.2, 008, 010 & 015 — Jazz Loops, PRNP Graffiti & VHS Reflections',
    accentColor: '#FF007A',
    cardThemes: ['synthwave-grid', 'vhs-static', 'laser-backdrop', 'atomic-purple'],
    threatColors: ['#FF007A', '#00F0FF', '#A855F7'],
    locationPattern: /(chrono-vapor|mirror-kin|subway terminal|lost eras|clock-tower|arcade|mesozoic)/i,
    anomalyPattern: /(mirror-kin|echo-echo|memory drone|sub-routine delta|lattice weaver|tether)/i,
    characterPattern: /(me!|lily|selene|jax|aris)/i,
    gearPattern: /(tuning blade|crt|chalk|lantern|scan-jammer)/i,
    preferredArtStyles: [ME_ART_STYLES[0], ME_ART_STYLES[2], ME_ART_STYLES[4]],
    preferredDistortions: [ME_DISTORTIONS[4], ME_DISTORTIONS[5], ME_DISTORTIONS[0]],
    preferredAfflictions: ['4.2s CHRONO-VAPOR LOOP', '10-12 FPS TEMPORAL STUTTER', '0.43s HESITATION ANOMALY']
  },
  {
    id: 'me-vitrified-wastes',
    universe: 'mutable-echo',
    name: 'Node AA // Vitrified Wastes & Osteo-Steel',
    shortBadge: 'VITRIFIED WASTES',
    icon: '🏜️',
    tagline: 'Saffron Skies, Echo-Chamber Maw, Sunken Kilobyte Sea & Scavengers',
    accentColor: '#FFE600',
    cardThemes: ['gold-embossed', 'liquid-chrome', 'vintage-cardstock', 'cyber-pcb'],
    threatColors: ['#FFE600', '#FF5500', '#00F0FF'],
    locationPattern: /(vitrified|saffron|echo-chamber|kilobyte|megastructure|sand dunes|coastal)/i,
    anomalyPattern: /(alpha-zero|t-88|varek|xylar|golem|kragor)/i,
    characterPattern: /(tarek|jax|lyra|tannis|marek|asha)/i,
    gearPattern: /(plasma torch|sextant|geiger|pry-bar|canister|tuning blade)/i,
    preferredArtStyles: [ME_ART_STYLES[5], ME_ART_STYLES[3], ME_ART_STYLES[2]],
    preferredDistortions: [ME_DISTORTIONS[0], ME_DISTORTIONS[1], ME_DISTORTIONS[6]],
    preferredAfflictions: ['OBLIGATION DENSITY: CRITICAL', 'SEVERANCE DEPTH: ABSOLUTE', 'WARM EQUILIBRIUM ACHIEVED']
  }
];

export const ALL_THEME_SETS: ThemeSetDefinition[] = [
  ...THEME_SETS,
  ...MUTABLE_ECHO_THEME_SETS
];

export function isMutableEchoTheme(themeId?: string): boolean {
  return Boolean(themeId && themeId.startsWith('me-'));
}

export function getThemeSetsForUniverse(universe: UniverseId): ThemeSetDefinition[] {
  return universe === 'mutable-echo' ? MUTABLE_ECHO_THEME_SETS : THEME_SETS;
}

export function getThemeSetById(id?: string): ThemeSetDefinition {
  if (!id || id === 'all') return THEME_SETS[0];
  if (id === 'me-all') return MUTABLE_ECHO_THEME_SETS[0];
  return ALL_THEME_SETS.find(t => t.id === id) || THEME_SETS[0];
}

export function getFilteredPoolsForTheme(
  themeId: string,
  allLocations: string[] = SUBURBAN_LOCATIONS,
  allAnomalies: string[] = SUBURBAN_ANOMALIES,
  allCharacters: string[] = RETRO_CHARACTERS,
  allGear: string[] = IMPROVISED_GEAR
): {
  theme: ThemeSetDefinition;
  locations: string[];
  anomalies: string[];
  characters: string[];
  gear: string[];
} {
  const theme = getThemeSetById(themeId);
  const isME = isMutableEchoTheme(theme.id);

  const baseLocations = isME ? ME_LOCATIONS : allLocations;
  const baseAnomalies = isME ? ME_ANOMALIES : allAnomalies;
  const baseCharacters = isME ? ME_CHARACTERS : allCharacters;
  const baseGear = isME ? ME_GEAR : allGear;

  if (theme.id === 'all' || theme.id === 'me-all') {
    return {
      theme,
      locations: baseLocations,
      anomalies: baseAnomalies,
      characters: baseCharacters,
      gear: baseGear
    };
  }

  const locs = baseLocations.filter(l => theme.locationPattern.test(l));
  const anoms = baseAnomalies.filter(a => theme.anomalyPattern.test(a));
  const chars = baseCharacters.filter(c => theme.characterPattern.test(c));
  const gears = baseGear.filter(g => theme.gearPattern.test(g));

  return {
    theme,
    locations: locs.length >= 3 ? locs : baseLocations,
    anomalies: anoms.length >= 3 ? anoms : baseAnomalies,
    characters: chars.length >= 3 ? chars : baseCharacters,
    gear: gears.length >= 3 ? gears : baseGear
  };
}
