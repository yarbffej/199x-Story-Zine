import React from 'react';
import { Radio, Palette } from 'lucide-react';
import { STUDIO_UI_THEMES, StudioUiTheme, UiThemeId } from '../data/uiThemes';
import { playZineBlip } from '../utils/audio';

interface HeaderProps {
  crtEnabled?: boolean;
  onToggleCrt?: () => void;
  soundMuted?: boolean;
  onToggleSound?: () => void;
  encounterCount?: number;
  criticalCount?: number;
  isGenerating?: boolean;
  uiTheme?: StudioUiTheme;
  onSelectUiTheme?: (themeId: UiThemeId) => void;
}

export const Header: React.FC<HeaderProps> = ({
  uiTheme = STUDIO_UI_THEMES[0],
  onSelectUiTheme,
}) => {
  return (
    <header
      id="app-header"
      style={{
        backgroundColor: uiTheme.headerBg,
        color: uiTheme.headerInk,
        borderColor: uiTheme.headerBorder,
      }}
      className="border-b-[2.5px] backdrop-blur-md sticky top-0 z-30 transition-colors duration-300"
    >
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand Identity */}
        <div className="flex items-center gap-3">
          <div
            style={{
              backgroundColor: uiTheme.logoBg,
              color: uiTheme.logoText,
              borderColor: uiTheme.borderColor,
            }}
            className="relative flex items-center justify-center w-9 h-9 rounded-xl border-2 shadow-sm"
          >
            <Radio className="w-4 h-4 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span
                style={{
                  backgroundColor: uiTheme.surfaceElevated,
                  color: uiTheme.headerSub,
                  borderColor: uiTheme.borderColor,
                }}
                className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider"
              >
                199X SUBURBAN • SERIES 2
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-black tracking-wider flex items-center gap-2">
              <span>199X STORY ZINE</span>
              <span
                style={{ color: uiTheme.headerSub }}
                className="font-extrabold"
              >
                ENGINE
              </span>
            </h1>
          </div>
        </div>

        {/* Top Backdrop Theme Switcher */}
        {onSelectUiTheme && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="hidden xl:inline-flex items-center gap-1 text-[11px] font-mono font-bold uppercase opacity-80 mr-1">
              <Palette className="w-3.5 h-3.5" />
              Backdrop:
            </span>
            {STUDIO_UI_THEMES.map((th) => {
              const active = th.id === uiTheme.id;
              return (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => {
                    playZineBlip(830);
                    onSelectUiTheme(th.id);
                  }}
                  title={`${th.name} — ${th.tagline}`}
                  style={{
                    backgroundColor: active ? th.accent1 : uiTheme.surfaceBg,
                    color: active ? th.accent1Ink : uiTheme.ink,
                    borderColor: active ? th.borderColor : uiTheme.borderColor,
                    boxShadow: active
                      ? `3px 3px 0px ${uiTheme.borderColor}`
                      : undefined,
                  }}
                  className={`px-2.5 py-1 rounded-full border-2 text-[11px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    active
                      ? '-translate-y-0.5 scale-105'
                      : 'opacity-85 hover:opacity-100 hover:-translate-y-0.5'
                  }`}
                >
                  <span>{th.emoji}</span>
                  <span>{th.shortLabel}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
