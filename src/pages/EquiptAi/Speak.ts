import React from 'react';

export class Speak {
  utterance: SpeechSynthesisUtterance;
  isPaused: boolean;
  synth: SpeechSynthesis;
  voice: number;
  voices: SpeechSynthesisVoice[];
  text: string;
  isPlaying: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  constructor(setLoading: React.Dispatch<React.SetStateAction<boolean>>, voice: number = 4) {
    this.isPaused = false;
    this.text = '';
    this.utterance = new SpeechSynthesisUtterance(this.text);
    this.synth = window.speechSynthesis;
    this.isPlaying = false;
    this.voice = voice;
    this.voices = this.getEnglishVoices();
    this.utterance.voice = this.getPreferredVoice();
    this.utterance.volume = 1;
    this.setLoading = setLoading;
  }

  getEnglishVoices() {
    const voices = window.speechSynthesis.getVoices().filter((voice) => voice.lang === 'en-US');
    this.voices = voices;
    return voices;
  }

  play(text: string) {
    if (this.isPaused) this.isPaused = false;
    if (this.synth.speaking) this.synth.cancel();
    this.getEnglishVoices();
    this.text = text;
    this.utterance = new SpeechSynthesisUtterance(text);
    this.utterance.lang = 'en-US';
    this.utterance.rate = 1;
    this.utterance.pitch = 1.2;
    this.utterance.rate = 1.2;
    this.utterance.voice = this.getPreferredVoice();
    this.synth.speak(this.utterance);
    this.setLoading(true);
    this.utterance.addEventListener('start', () => {
      this.isPlaying = true;
      setTimeout(() => {
        this.setLoading(false);
      }, 0);
    });
    this.utterance.addEventListener('end', () => {
      this.isPlaying = false;
      this.setLoading(false);
    });
  }

  getPreferredVoice() {
    const voiceName = 'Microsoft AndrewMultilingual Online (Natural) - English (United States)';
    const isAvailable = this.voices.find((voice) => voice.name === voiceName);
    if (isAvailable) {
      return isAvailable;
    }
    return this.voices[this.voice] || this.voices[0];
  }
  pause() {
    if (!this.isPaused) {
      this.isPaused = true;
      this.synth.pause();
      this.isPlaying = false;
    }
  }
  resume() {
    if (this.isPaused) {
      this.isPaused = false;
      this.synth.resume();
      this.isPlaying = true;
    }
  }
  stop() {
    this.synth.cancel();
    this.isPaused = true;
    this.isPlaying = false;
    this.utterance = null;
    this.setLoading(false);
  }
  changeVoice(voice: number) {
    this.voice = voice;
    this.utterance.voice = this.voices[voice];
  }
}
