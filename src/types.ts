export interface ProtagonistLoadout {
  nostalgia_artifact: string;
  improvised_weapon: string;
  weird_synergy_effect: string;
}

export interface ImpelRatings {
  strength: number;
  speed: number;
  energy: number;
  psychic: number;
}

export type CardThemeType = 
  | 'vintage-cardstock' 
  | 'cracked-ice' 
  | 'memphis-rad' 
  | 'cosmic-nebula'
  | 'atomic-purple' 
  | 'jazz-cup' 
  | 'brushed-metal' 
  | 'liquid-chrome'
  | 'hypercolor-thermal' 
  | 'synthwave-grid' 
  | 'cyber-pcb' 
  | 'holo-diffraction'
  | 'vhs-static' 
  | 'laser-backdrop' 
  | 'neon-splatter' 
  | 'trapper-keeper'
  | 'grunge-newsprint' 
  | 'amber-terminal' 
  | 'gold-embossed' 
  | 'holographic-foil'
  | 'tie-dye-swirl' 
  | 'carbon-fiber' 
  | 'prismatic-refractor' 
  | 'toxic-ooze' 
  | 'bubblegum-wax';

export interface ChecklistItem {
  number: number;
  name: string;
  checked?: boolean;
  rarity?: 'standard' | 'silver' | 'gold' | 'prism';
  threatColor?: string;
  status?: string;
}

export interface CombatEncounter {
  entity_name: string;
  anomaly_name?: string;
  location?: string;
  cosmic_distortion: string;
  threat_level_color: string;
  protagonist_loadout: ProtagonistLoadout;
  impel_ratings?: ImpelRatings;
  combat_ticker: string[];
  status_affliction: string;
  critical_smash: boolean;
  visual_generation_prompt: string;
  video_generation_prompt: string;
  flow_video_prompt?: string;
  grounded_ending_type?: 'aim_hold' | 'slide_cover' | 'sprint_exit' | 'recon_kneel' | 'holster_stride';
  featured_character?: string;
  visual_style?: string;
  card_number?: number;
  is_foil?: boolean;
  card_foil_rarity?: 'standard' | 'silver' | 'gold' | 'prism';
  card_theme?: CardThemeType;
  card_type?: 'bad_guy' | 'good_guy' | 'checklist';
  checklist_items?: ChecklistItem[];
  checklist_subtitle?: string;
  theme_set_id?: string;
  theme_set_name?: string;
  theme_set_badge?: string;
  morphology_type?: string;
  environment_type?: string;
}

export interface EncounterRequestParams {
  location?: string;
  anomaly?: string;
  improvised_gear?: string;
  character?: string;
  art_style?: string;
  card_type?: 'bad_guy' | 'good_guy' | 'auto';
  zone?: string;
  theme_set_id?: string;
}