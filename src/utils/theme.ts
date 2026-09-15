import type { HeatmapTheme } from '../types';

export interface ThemeColors {
  name: string;
  id: HeatmapTheme;
  colorsDark: [string, string, string, string, string]; // levels 0, 1, 2, 3, 4
  colorsLight: [string, string, string, string, string];
}

export const HEATMAP_THEMES: Record<HeatmapTheme, ThemeColors> = {
  'github-green': {
    name: 'GitHub Classic (Green)',
    id: 'github-green',
    colorsDark: ['#21262d', '#0e4429', '#006d32', '#26a641', '#39d353'],
    colorsLight: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
  },
  'cobalt-blue': {
    name: 'Cobalt Blue',
    id: 'cobalt-blue',
    colorsDark: ['#21262d', '#0c2d6b', '#1158c7', '#388bfd', '#79c0ff'],
    colorsLight: ['#ebedf0', '#b6e3ff', '#54aeff', '#0969da', '#054da7'],
  },
  'cyber-teal': {
    name: 'Cyber Teal',
    id: 'cyber-teal',
    colorsDark: ['#21262d', '#043834', '#08635c', '#14b8a6', '#5eead4'],
    colorsLight: ['#ebedf0', '#99f6e4', '#2dd4bf', '#0d9488', '#115e59'],
  },
  'amethyst-purple': {
    name: 'Amethyst Purple',
    id: 'amethyst-purple',
    colorsDark: ['#21262d', '#38165b', '#6b21a8', '#a855f7', '#d8b4fe'],
    colorsLight: ['#ebedf0', '#e9d5ff', '#c084fc', '#9333ea', '#6b21a8'],
  },
  'flame-orange': {
    name: 'Flame Orange',
    id: 'flame-orange',
    colorsDark: ['#21262d', '#451a03', '#9a3412', '#f97316', '#fdba74'],
    colorsLight: ['#ebedf0', '#fed7aa', '#fb923c', '#ea580c', '#9a3412'],
  },
  'high-contrast': {
    name: 'Accessible High-Contrast',
    id: 'high-contrast',
    colorsDark: ['#21262d', '#003820', '#00753f', '#00a35c', '#2cff99'],
    colorsLight: ['#ebedf0', '#7ee787', '#238636', '#196c2e', '#0f5323'],
  },
};

export function getHeatmapCellColor(
  level: 0 | 1 | 2 | 3 | 4,
  themeId: HeatmapTheme = 'github-green',
  isLight: boolean = false
): string {
  const theme = HEATMAP_THEMES[themeId] || HEATMAP_THEMES['github-green'];
  const palette = isLight ? theme.colorsLight : theme.colorsDark;
  return palette[level] ?? palette[0];
}
