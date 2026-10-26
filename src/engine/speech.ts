// Read aloud (#53): the words of a scene spoken by the browser's own voices (speechSynthesis), for readers who listen
// rather than read. Off by default; screen-reader users hear the announcer in their own voice instead. Offered only
// where the system has a voice for the page's language (no Danish voice, no Danish read aloud).
import type { Level } from '../define';

/** The voices and calls of `speechSynthesis` that read aloud uses (a fake in tests). */
export interface Synth extends Pick<SpeechSynthesis, 'speak' | 'cancel' | 'speaking' | 'addEventListener'> {
  getVoices(): Pick<SpeechSynthesisVoice, 'lang' | 'default' | 'localService'>[];
}
type Voice = ReturnType<Synth['getVoices']>[number];

/** At Simple it is read a little slower. */
export const SIMPLE_RATE = 0.9;

/** The voice for language `lang` ("da"): one whose own language is it or starts with it ("da-DK", "da_DK"); the
 *  system's default and on-device voices first. Null where there is none. */
export function voiceFor<V extends Voice>(voices: V[], lang: string): V | null {
  const want = lang.toLowerCase();
  const fits = voices.filter((v) => {
    const l = v.lang.toLowerCase().replace('_', '-');
    return l === want || l.startsWith(`${want}-`);
  });
  const rank = (v: V) => (v.default ? 0 : 2) + (v.localService ? 0 : 1);
  return fits.sort((a, b) => rank(a) - rank(b))[0] ?? null;
}

/** Parts of a text to say, as one: empty parts left out, and each ending as a sentence, so the voice pauses between
 *  a title and what follows it ("Radio waves. A wavy line runs…"). */
export function spoken(...parts: string[]): string {
  return parts.map((p) => p.trim()).filter(Boolean).map((p) => (/[.!?…:]$/.test(p) ? p : `${p}.`)).join(' ');
}

export class Speaker {
  constructor(
    private synth: Synth | undefined = globalThis.speechSynthesis,
    private Utterance: typeof SpeechSynthesisUtterance | undefined = globalThis.SpeechSynthesisUtterance,
  ) {}

  private voice(lang: string) {
    return this.synth && this.Utterance ? voiceFor(this.synth.getVoices(), lang) : null;
  }
  /** Whether there is a voice for `lang`. The list may fill in later: `onvoices` says when. */
  available(lang: string) {
    return !!this.voice(lang);
  }
  /** Call `f` when the system's voices change (Chrome loads them after the page). */
  onvoices(f: () => void) {
    this.synth?.addEventListener('voiceschanged', f);
  }
  /** Say `text` in `lang`, cutting off whatever was being said; false if there's no voice for it. */
  say(text: string, lang: string, level: Level): boolean {
    const v = this.voice(lang);
    if (!v || !text) return false;
    this.synth!.cancel();
    const u = new this.Utterance!(text);
    u.voice = v as SpeechSynthesisVoice;
    u.lang = v.lang;
    u.rate = level === 'simple' ? SIMPLE_RATE : 1;
    this.synth!.speak(u);
    return true;
  }
  cancel() {
    this.synth?.cancel();
  }
  get speaking() {
    return !!this.synth?.speaking;
  }
}

export const speaker = new Speaker();
