import { describe, expect, it, vi } from 'vitest';
import { SIMPLE_RATE, Speaker, spoken, voiceFor, type Synth } from './speech';

const voice = (lang: string, more: { default?: boolean; localService?: boolean; name?: string } = {}) =>
  ({ lang, default: false, localService: true, name: lang, ...more });

/** A fake speechSynthesis: what was said, and how often it was cut off. */
function fakeSynth(voices: ReturnType<typeof voice>[]) {
  const said: { text: string; lang: string; rate: number; voice: unknown }[] = [];
  const listeners: (() => void)[] = [];
  const synth = {
    voices, speaking: false, cancels: 0, said,
    getVoices: () => synth.voices,
    speak: (u: { text: string; lang: string; rate: number; voice: unknown }) => { said.push(u); synth.speaking = true; },
    cancel: () => { synth.cancels++; synth.speaking = false; },
    addEventListener: (_: string, f: () => void) => listeners.push(f),
    fire: () => listeners.forEach((f) => f()),
  };
  class Utterance { text: string; lang = ''; rate = 1; voice: unknown = null; constructor(t: string) { this.text = t; } }
  return { synth, speaker: new Speaker(synth as unknown as Synth, Utterance as unknown as typeof SpeechSynthesisUtterance) };
}

describe('voiceFor', () => {
  it('picks a voice by language prefix, the default and on-device ones first', () => {
    const vs = [voice('en-US', { name: 'remote', localService: false }), voice('en-GB', { name: 'local' }), voice('da_DK'), voice('enx-XX')];
    expect(voiceFor(vs, 'en')?.name).toBe('local');
    expect(voiceFor([...vs, voice('en-AU', { default: true, name: 'default' })], 'en')?.name).toBe('default');
    expect(voiceFor(vs, 'da')?.lang).toBe('da_DK');
    expect(voiceFor(vs, 'DA')?.lang).toBe('da_DK');
  });

  it('has none for a language without a voice (and "en" is not "enx")', () => {
    expect(voiceFor([voice('en-US'), voice('enx-XX')], 'da')).toBeNull();
    expect(voiceFor([voice('enx-XX')], 'en')).toBeNull();
    expect(voiceFor([], 'en')).toBeNull();
  });
});

describe('Speaker', () => {
  it('is unavailable without speechSynthesis or a voice, and says nothing then', () => {
    expect(new Speaker(undefined, undefined).available('en')).toBe(false);
    expect(new Speaker(undefined, undefined).say('Hi', 'en', 'simple')).toBe(false);
    const { synth, speaker } = fakeSynth([voice('en-US')]);
    expect(speaker.available('da')).toBe(false);
    expect(speaker.say('Hej', 'da', 'simple')).toBe(false);
    expect(synth.said).toEqual([]);
  });

  it('becomes available when the voices arrive', () => {
    const { synth, speaker } = fakeSynth([]);
    const changed = vi.fn();
    speaker.onvoices(changed);
    expect(speaker.available('da')).toBe(false);
    synth.voices = [voice('da-DK')];
    synth.fire();
    expect(changed).toHaveBeenCalledOnce();
    expect(speaker.available('da')).toBe(true);
  });

  it('cancels what it was saying before each new text, in the voice of the language, slower at Simple', () => {
    const { synth, speaker } = fakeSynth([voice('en-US'), voice('da-DK')]);
    expect(speaker.say('Radio waves.', 'en', 'simple')).toBe(true);
    expect(speaker.speaking).toBe(true);
    speaker.say('Radiobølger.', 'da', 'technical');
    expect(synth.cancels).toBe(2);
    expect(synth.said.map((u) => [u.text, u.lang, u.rate])).toEqual([['Radio waves.', 'en-US', SIMPLE_RATE], ['Radiobølger.', 'da-DK', 1]]);
    expect(synth.said[1].voice).toBe(synth.voices[1]);
    speaker.cancel();
    expect(speaker.speaking).toBe(false);
  });
});

describe('spoken', () => {
  it('joins the parts as sentences, leaving out empty ones', () => {
    expect(spoken('Radio waves', '', ' A wavy line runs from the box to your phone. ', 'Big wiggles are ones.')).toBe(
      'Radio waves. A wavy line runs from the box to your phone. Big wiggles are ones.');
    expect(spoken('Which road next?', '3 doors lead further down')).toBe('Which road next? 3 doors lead further down.');
    expect(spoken('', '  ')).toBe('');
  });
});
