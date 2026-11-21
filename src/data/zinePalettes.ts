import { CardThemeType } from '../types';

export type ZinePaletteId =
  | 'memphis-rad'
  | 'toxic-ooze'
  | 'synthwave-grid'
  | 'atomic-purple'
  | 'jazz-cup'
  | 'gold-embossed'
  | 'hypercolor-thermal'
  | 'holo-diffraction';

export interface ZinePalette {
  finishId: ZinePaletteId;
  name: string;
  emoji: string;
  paperBg: string;
  cardBg: string;
  heroYellow: string;
  popPink: string;
  popCyan: string;
  popLime: string;
  act1Tint: string;
  act2Tint: string;
  act3Tint: string;
  ink: string;
}

export const ZINE_PALETTES: ZinePalette[] = [
  {
    finishId: 'memphis-rad',
    name: 'Memphis Candy',
    emoji: '📐',
    paperBg: '#FFFBF0',
    cardBg: '#FFF3C4',
    heroYellow: '#FFE600',
    popPink: '#FF2A85',
    popCyan: '#00E5FF',
    popLime: '#B8FF00',
    act1Tint: '#FFF9C4',
    act2Tint: '#FFE4F0',
    act3Tint: '#E0F7FA',
    ink: '#121212',
  },
  {
    finishId: 'toxic-ooze',
    name: 'Fun-Pack Slime',
    emoji: '🧪',
    paperBg: '#F4FFE8',
    cardBg: '#E3FFC4',
    heroYellow: '#B8FF00',
    popPink: '#FF2A85',
    popCyan: '#00F0B5',
    popLime: '#FFE600',
    act1Tint: '#ECFCCB',
    act2Tint: '#D9F99D',
    act3Tint: '#CCFBF1',
    ink: '#121212',
  },
  {
    finishId: 'synthwave-grid',
    name: 'Arcade Neon',
    emoji: '🕹️',
    paperBg: '#F5F9FF',
    cardBg: '#E0EEFF',
    heroYellow: '#00E5FF',
    popPink: '#FF007F',
    popCyan: '#FFE600',
    popLime: '#A3FF00',
    act1Tint: '#E0F7FA',
    act2Tint: '#FCE7F3',
    act3Tint: '#FEF9C3',
    ink: '#121212',
  },
  {
    finishId: 'atomic-purple',
    name: 'Atomic Berry',
    emoji: '🟣',
    paperBg: '#FDF7FF',
    cardBg: '#F3E8FF',
    heroYellow: '#E879F9',
    popPink: '#9333EA',
    popCyan: '#00E5FF',
    popLime: '#FFE600',
    act1Tint: '#F3E8FF',
    act2Tint: '#FCE7F3',
    act3Tint: '#E0F2FE',
    ink: '#121212',
  },
  {
    finishId: 'jazz-cup',
    name: '90s Jazz Cup',
    emoji: '🥤',
    paperBg: '#F8FFFE',
    cardBg: '#CCFBF1',
    heroYellow: '#2DD4BF',
    popPink: '#9333EA',
    popCyan: '#38BDF8',
    popLime: '#FACC15',
    act1Tint: '#CCFBF1',
    act2Tint: '#F3E8FF',
    act3Tint: '#E0F2FE',
    ink: '#121212',
  },
  {
    finishId: 'gold-embossed',
    name: 'Book Fair Gold',
    emoji: '🏆',
    paperBg: '#FFFDF2',
    cardBg: '#FEF08A',
    heroYellow: '#FACC15',
    popPink: '#EA580C',
    popCyan: '#38BDF8',
    popLime: '#A3E635',
    act1Tint: '#FEF9C3',
    act2Tint: '#FFEDD5',
    act3Tint: '#ECFCCB',
    ink: '#121212',
  },
  {
    finishId: 'hypercolor-thermal',
    name: 'Hypercolor',
    emoji: '🌡️',
    paperBg: '#FFF7FA',
    cardBg: '#FFE4E6',
    heroYellow: '#FB7185',
    popPink: '#E11D48',
    popCyan: '#FACC15',
    popLime: '#2DD4BF',
    act1Tint: '#FFE4E6',
    act2Tint: '#FEF3C7',
    act3Tint: '#CCFBF1',
    ink: '#121212',
  },
  {
    finishId: 'holo-diffraction',
    name: 'Laser Prism',
    emoji: '🌈',
    paperBg: '#F8FAFC',
    cardBg: '#E0E7FF',
    heroYellow: '#38BDF8',
    popPink: '#EC4899',
    popCyan: '#A855F7',
    popLime: '#B8FF00',
    act1Tint: '#E0F2FE',
    act2Tint: '#FCE7F3',
    act3Tint: '#F3E8FF',
    ink: '#121212',
  },
];

export function getZinePalette(cardTheme?: CardThemeType | string): ZinePalette {
  const direct = ZINE_PALETTES.find((p) => p.finishId === cardTheme);
  if (direct) return direct;
  if (cardTheme === 'cracked-ice' || cardTheme === 'liquid-chrome') return ZINE_PALETTES[7];
  if (cardTheme === 'vhs-static' || cardTheme === 'cosmic-nebula') return ZINE_PALETTES[3];
  if (cardTheme === 'cyber-pcb') return ZINE_PALETTES[1];
  if (cardTheme === 'vintage-cardstock') return ZINE_PALETTES[5];
  return ZINE_PALETTES[0];
}
