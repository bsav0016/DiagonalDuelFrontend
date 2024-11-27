/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
  button: {
    text: 'white',
    background: '#007bff'
  },
  board: {
    background: '#0000aa',
    player1: 'red',//'#d96c6c',
    player2: 'yellow',//'#27b84d',
    valid: '#9127b8',
    empty: '#007bff',
    borderColor: '#0000dd'
  },
  onlinePlay: {
    general: '#9127b8',
    loss: '#de3c3c',
    win: '#49de60',
    text: 'black'
  }
};
