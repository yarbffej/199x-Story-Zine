// Anti-duplicate non-repeating Shuffle Bag & Custom User Options Manager
import {
  SUBURBAN_LOCATIONS,
  SUBURBAN_ANOMALIES,
  RETRO_CHARACTERS,
  NOSTALGIA_ARTIFACTS,
  IMPROVISED_WEAPONS,
  IMPROVISED_GEAR,
  RETRO_ART_STYLES
} from '../data/retroLibrary';
import { getFilteredPoolsForTheme, getThemeSetById } from '../data/themeSets';

const STORAGE_KEY_CUSTOM = "suburban_custom_options_v1";

export interface CustomOptionsData {
  customLocations: string[];
  customAnomalies: string[];
  customCharacters: string[];
  customArtifacts: string[];
  customWeapons: string[];
  customGear: string[];
  customArtStyles: string[];
}

function loadCustomData(): CustomOptionsData {
  if (typeof localStorage === 'undefined') {
    return {
      customLocations: [],
      customAnomalies: [],
      customCharacters: [],
      customArtifacts: [],
      customWeapons: [],
      customGear: [],
      customArtStyles: []
    };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        customLocations: parsed.customLocations || [],
        customAnomalies: parsed.customAnomalies || [],
        customCharacters: parsed.customCharacters || [],
        customArtifacts: parsed.customArtifacts || [],
        customWeapons: parsed.customWeapons || [],
        customGear: parsed.customGear || [],
        customArtStyles: parsed.customArtStyles || []
      };
    }
  } catch (e) {
    console.warn("Failed to load custom retro options from storage:", e);
  }
  return {
    customLocations: [],
    customAnomalies: [],
    customCharacters: [],
    customArtifacts: [],
    customWeapons: [],
    customGear: [],
    customArtStyles: []
  };
}

function saveCustomData(data: CustomOptionsData): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(data));
  } catch (e) {
    console.warn("Failed to save custom retro options to storage:", e);
  }
}

// Memory buffer of recently picked items to prevent back-to-back repeats
const recentLocations: string[] = [];
const recentAnomalies: string[] = [];
const recentCharacters: string[] = [];
const recentArtifacts: string[] = [];
const recentWeapons: string[] = [];
const recentGear: string[] = [];
const recentArtStyles: string[] = [];
const MAX_HISTORY = 30;

function sampleNonRepeating(pool: string[], history: string[], commit: boolean = true): string {
  if (!pool || pool.length === 0) return "";
  if (pool.length === 1) return pool[0];

  // Candidates not in recent history
  const candidates = pool.filter(item => !history.includes(item));
  const pickPool = candidates.length > 0 ? candidates : pool;
  
  // Pick random
  const chosen = pickPool[Math.floor(Math.random() * pickPool.length)];
  
  // Track history only if committing
  if (commit) {
    history.push(chosen);
    if (history.length > Math.min(MAX_HISTORY, Math.floor(pool.length * 0.75))) {
      history.shift();
    }
  }
  return chosen;
}

export class RetroOptionManager {
  private custom: CustomOptionsData;
  private activeThemeId: string = 'all';

  constructor() {
    this.custom = loadCustomData();
  }

  setActiveThemeId(themeId: string): void {
    this.activeThemeId = themeId || 'all';
  }

  getActiveThemeId(): string {
    return this.activeThemeId;
  }

  // Get full combined pools (Built-in + User custom)
  getLocations(themeId?: string): string[] {
    const all = Array.from(new Set([...this.custom.customLocations, ...SUBURBAN_LOCATIONS]));
    const targetTheme = themeId ?? this.activeThemeId;
    if (!targetTheme || targetTheme === 'all') return all;
    return getFilteredPoolsForTheme(targetTheme, all, SUBURBAN_ANOMALIES, RETRO_CHARACTERS, IMPROVISED_GEAR).locations;
  }

  getAnomalies(themeId?: string): string[] {
    const all = Array.from(new Set([...this.custom.customAnomalies, ...SUBURBAN_ANOMALIES]));
    const targetTheme = themeId ?? this.activeThemeId;
    if (!targetTheme || targetTheme === 'all') return all;
    return getFilteredPoolsForTheme(targetTheme, SUBURBAN_LOCATIONS, all, RETRO_CHARACTERS, IMPROVISED_GEAR).anomalies;
  }

  getCharacters(themeId?: string): string[] {
    const all = Array.from(new Set([...(this.custom.customCharacters || []), ...RETRO_CHARACTERS]));
    const targetTheme = themeId ?? this.activeThemeId;
    if (!targetTheme || targetTheme === 'all') return all;
    return getFilteredPoolsForTheme(targetTheme, SUBURBAN_LOCATIONS, SUBURBAN_ANOMALIES, all, IMPROVISED_GEAR).characters;
  }

  getArtifacts(): string[] {
    return Array.from(new Set([...this.custom.customArtifacts, ...NOSTALGIA_ARTIFACTS]));
  }

  getWeapons(): string[] {
    return Array.from(new Set([...this.custom.customWeapons, ...IMPROVISED_WEAPONS]));
  }

  getGearPresets(themeId?: string): string[] {
    const all = Array.from(new Set([...this.custom.customGear, ...IMPROVISED_GEAR]));
    const targetTheme = themeId ?? this.activeThemeId;
    if (!targetTheme || targetTheme === 'all') return all;
    return getFilteredPoolsForTheme(targetTheme, SUBURBAN_LOCATIONS, SUBURBAN_ANOMALIES, RETRO_CHARACTERS, all).gear;
  }

  getArtStyles(themeId?: string): string[] {
    const targetTheme = themeId ?? this.activeThemeId;
    if (targetTheme && targetTheme !== 'all') {
      const themeDef = getThemeSetById(targetTheme);
      if (themeDef.preferredArtStyles?.length) {
        return themeDef.preferredArtStyles;
      }
    }
    return Array.from(new Set([...(this.custom.customArtStyles || []), ...RETRO_ART_STYLES]));
  }

  // Non-repeating random rolls
  rollLocation(commit: boolean = true, themeId?: string): string {
    return sampleNonRepeating(this.getLocations(themeId), recentLocations, commit);
  }

  rollAnomaly(commit: boolean = true, themeId?: string): string {
    return sampleNonRepeating(this.getAnomalies(themeId), recentAnomalies, commit);
  }

  rollCharacter(commit: boolean = true, themeId?: string): string {
    return sampleNonRepeating(this.getCharacters(themeId), recentCharacters, commit);
  }

  rollArtifact(commit: boolean = true): string {
    return sampleNonRepeating(this.getArtifacts(), recentArtifacts, commit);
  }

  rollWeapon(commit: boolean = true): string {
    return sampleNonRepeating(this.getWeapons(), recentWeapons, commit);
  }

  rollArtStyle(commit: boolean = true, themeId?: string): string {
    return sampleNonRepeating(this.getArtStyles(themeId), recentArtStyles, commit);
  }

  rollGear(commit: boolean = true, themeId?: string): string {
    const targetTheme = themeId ?? this.activeThemeId;
    const themedPresets = this.getGearPresets(targetTheme);
    if ((targetTheme !== 'all' || Math.random() < 0.45) && themedPresets.length > 0) {
      return sampleNonRepeating(themedPresets, recentGear, commit);
    }
    const art = this.rollArtifact(commit);
    const wpn = this.rollWeapon(commit);
    const combined = `${art} + ${wpn}`;
    if (commit) {
      recentGear.push(combined);
      if (recentGear.length > MAX_HISTORY) recentGear.shift();
    }
    return combined;
  }

  // Custom User Options Methods
  addCustomOption(category: 'locations' | 'anomalies' | 'characters' | 'artifacts' | 'weapons' | 'gear' | 'artStyles', item: string): void {
    const trimmed = item.trim();
    if (!trimmed) return;

    if (category === 'locations') {
      if (!this.custom.customLocations.includes(trimmed)) this.custom.customLocations.unshift(trimmed);
    } else if (category === 'anomalies') {
      if (!this.custom.customAnomalies.includes(trimmed)) this.custom.customAnomalies.unshift(trimmed);
    } else if (category === 'characters') {
      if (!this.custom.customCharacters.includes(trimmed)) this.custom.customCharacters.unshift(trimmed);
    } else if (category === 'artifacts') {
      if (!this.custom.customArtifacts.includes(trimmed)) this.custom.customArtifacts.unshift(trimmed);
    } else if (category === 'weapons') {
      if (!this.custom.customWeapons.includes(trimmed)) this.custom.customWeapons.unshift(trimmed);
    } else if (category === 'gear') {
      if (!this.custom.customGear.includes(trimmed)) this.custom.customGear.unshift(trimmed);
    } else if (category === 'artStyles') {
      if (!this.custom.customArtStyles.includes(trimmed)) this.custom.customArtStyles.unshift(trimmed);
    }
    saveCustomData(this.custom);
  }

  bulkAddOptions(category: 'locations' | 'anomalies' | 'characters' | 'artifacts' | 'weapons' | 'gear' | 'artStyles', rawText: string): number {
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    let added = 0;
    lines.forEach(line => {
      this.addCustomOption(category, line);
      added++;
    });
    return added;
  }

  removeCustomOption(category: 'locations' | 'anomalies' | 'characters' | 'artifacts' | 'weapons' | 'gear' | 'artStyles', item: string): void {
    if (category === 'locations') {
      this.custom.customLocations = this.custom.customLocations.filter(i => i !== item);
    } else if (category === 'anomalies') {
      this.custom.customAnomalies = this.custom.customAnomalies.filter(i => i !== item);
    } else if (category === 'characters') {
      this.custom.customCharacters = this.custom.customCharacters.filter(i => i !== item);
    } else if (category === 'artifacts') {
      this.custom.customArtifacts = this.custom.customArtifacts.filter(i => i !== item);
    } else if (category === 'weapons') {
      this.custom.customWeapons = this.custom.customWeapons.filter(i => i !== item);
    } else if (category === 'gear') {
      this.custom.customGear = this.custom.customGear.filter(i => i !== item);
    } else if (category === 'artStyles') {
      this.custom.customArtStyles = this.custom.customArtStyles.filter(i => i !== item);
    }
    saveCustomData(this.custom);
  }

  getCustomData(): CustomOptionsData {
    return { ...this.custom };
  }

  setCustomData(newData: CustomOptionsData): void {
    this.custom = {
      customLocations: Array.from(new Set(newData.customLocations || [])),
      customAnomalies: Array.from(new Set(newData.customAnomalies || [])),
      customCharacters: Array.from(new Set(newData.customCharacters || [])),
      customArtifacts: Array.from(new Set(newData.customArtifacts || [])),
      customWeapons: Array.from(new Set(newData.customWeapons || [])),
      customGear: Array.from(new Set(newData.customGear || [])),
      customArtStyles: Array.from(new Set(newData.customArtStyles || []))
    };
    saveCustomData(this.custom);
  }

  mergeCustomData(incoming: Partial<CustomOptionsData>): { addedCounts: Record<keyof CustomOptionsData, number>; totalAdded: number } {
    const counts: Record<keyof CustomOptionsData, number> = {
      customLocations: 0,
      customAnomalies: 0,
      customCharacters: 0,
      customArtifacts: 0,
      customWeapons: 0,
      customGear: 0,
      customArtStyles: 0
    };

    const mergeCategory = (key: keyof CustomOptionsData, items?: string[]) => {
      if (!items || !items.length) return;
      items.forEach(rawItem => {
        const trimmed = rawItem.trim();
        if (trimmed && !this.custom[key].includes(trimmed)) {
          this.custom[key].unshift(trimmed);
          counts[key]++;
        }
      });
    };

    mergeCategory('customLocations', incoming.customLocations);
    mergeCategory('customAnomalies', incoming.customAnomalies);
    mergeCategory('customCharacters', incoming.customCharacters);
    mergeCategory('customArtifacts', incoming.customArtifacts);
    mergeCategory('customWeapons', incoming.customWeapons);
    mergeCategory('customGear', incoming.customGear);
    mergeCategory('customArtStyles', incoming.customArtStyles);

    saveCustomData(this.custom);
    const totalAdded = Object.values(counts).reduce((a, b) => a + b, 0);
    return { addedCounts: counts, totalAdded };
  }

  clearCustomData(): void {
    this.custom = {
      customLocations: [],
      customAnomalies: [],
      customCharacters: [],
      customArtifacts: [],
      customWeapons: [],
      customGear: [],
      customArtStyles: []
    };
    saveCustomData(this.custom);
  }
}

export const retroOptionManager = new RetroOptionManager();
