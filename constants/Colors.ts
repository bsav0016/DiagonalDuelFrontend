/**
 * Colors used in the app, defined for light and dark mode.
 */

const tintColorLight = '#4263eb';
const tintColorDark = '#748ffc';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#f5f7fb',
    surface: '#ffffff',
    border: '#e3e7ef',
    muted: '#6b7280',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#0f1115',
    surface: '#1a1d24',
    border: '#2a2f3a',
    muted: '#9ca3af',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
  button: {
    text: 'white',
    background: '#4263eb',
    disabled: '#c5cad6',
  },
  board: {
    background: '#1b2487',
    player1: '#ef4444',
    player2: '#facc15',
    valid: '#c7d2fe',
    empty: '#3b82f6',
    borderColor: '#2b36b8',
    emptyEdge: '#2f5fd0',
    player1Edge: '#b91c1c',
    player2Edge: '#ca8a04'
  },
  onlinePlay: {
    general: '#9127b8',
    loss: '#de3c3c',
    win: '#49de60',
    text: 'black'
  }
};
