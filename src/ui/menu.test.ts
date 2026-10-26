import { describe, expect, it } from 'vitest';
import { languageNote, menuMove } from './menu';

describe('the ⋯ menu keys (menuMove)', () => {
  it('moves down and up, wrapping at the ends', () => {
    expect(menuMove('ArrowDown', 0, 4)).toBe(1);
    expect(menuMove('ArrowDown', 3, 4)).toBe(0);
    expect(menuMove('ArrowUp', 2, 4)).toBe(1);
    expect(menuMove('ArrowUp', 0, 4)).toBe(3);
  });
  it('jumps to the first and last item', () => {
    for (const k of ['Home', 'PageUp']) expect(menuMove(k, 2, 4)).toBe(0);
    for (const k of ['End', 'PageDown']) expect(menuMove(k, 1, 4)).toBe(3);
  });
  it('walks the same list with left and right, mirrored right to left', () => {
    expect(menuMove('ArrowRight', 1, 4)).toBe(2);
    expect(menuMove('ArrowLeft', 1, 4)).toBe(0);
    expect(menuMove('ArrowRight', 1, 4, true)).toBe(0);
    expect(menuMove('ArrowLeft', 1, 4, true)).toBe(2);
  });
  it('starts from either end when nothing is focused yet', () => {
    expect(menuMove('ArrowDown', -1, 4)).toBe(0);
    expect(menuMove('ArrowUp', -1, 4)).toBe(3);
    expect(menuMove('Home', -1, 4)).toBe(0);
  });
  it('leaves other keys (Enter, Space, Tab, Escape, letters) to the item and the menu', () => {
    for (const k of ['Enter', ' ', 'Tab', 'Escape', 'a']) expect(menuMove(k, 1, 4)).toBeNull();
    expect(menuMove('ArrowDown', 0, 0)).toBeNull();
  });
});

describe('a language in the list, by its name in the reader\'s language (languageNote)', () => {
  it('names it in the reader\'s language', () => {
    expect(languageNote('nl', 'Nederlands', 'da')).toBe('nederlandsk');
    expect(languageNote('de', 'Deutsch', 'en')).toBe('German');
    expect(languageNote('da', 'Dansk', 'de')).toBe('Dänisch');
  });
  it('says nothing where that is its own name, or where the browser doesn\'t know it', () => {
    expect(languageNote('da', 'Dansk', 'da')).toBeUndefined();
    expect(languageNote('en', 'English', 'en')).toBeUndefined();
    expect(languageNote('xq', 'Xq', 'en')).toBeUndefined();
    expect(languageNote('da', 'Dansk', 'not a language!')).toBeUndefined();
  });
});
