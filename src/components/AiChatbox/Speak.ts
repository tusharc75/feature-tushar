import React from 'react';

type State = React.Dispatch<
  React.SetStateAction<{
    isPlaying: boolean;
    isPaused: boolean;
    isFinished: boolean;
    isLoading: boolean;
  }>
>;

export class Speak {
  utterance: SpeechSynthesisUtterance;
  isPaused: boolean;
  synth: SpeechSynthesis;
  voice: number;
  voices: SpeechSynthesisVoice[];
  text: string;
  isPlaying: boolean;
  isEnded: boolean;
  setSpeakerState: State;
  constructor(setSpeakerState: State, voice: number = 4) {
    this.isPaused = false;
    this.text = '';
    this.utterance = new SpeechSynthesisUtterance(this.text);
    this.synth = window.speechSynthesis;
    this.isPlaying = false;
    this.isEnded = false;
    this.voice = voice;
    // this.voices = this.getEnglishVoices();
    // this.utterance.voice = this.getPreferredVoice();
    this.utterance.volume = 1;
    this.setSpeakerState = setSpeakerState;
  }

  // getEnglishVoices() {
  //   if (this.voices?.length > 0) return this.voices;
  //   const voices = window.speechSynthesis.getVoices();
  //   const englishVoices = voices.filter((voice) => voice.lang.startsWith('en'));
  //   if (englishVoices.length > 0) {
  //     this.voices = englishVoices;
  //     return englishVoices;
  //   }
  //   this.voices = voices;
  //   return voices;
  // }

  // getPreferredVoice() {
  //   const voiceName = 'Microsoft AndrewMultilingual Online (Natural) - English (United States)';
  //   const isAvailableForWidows = this.voices.find((voice) => voice.name === voiceName);
  //   if (isAvailableForWidows) return isAvailableForWidows;
  //   const isNaturalAvailable = this.voices.find((voice) => voice.name.toLowerCase().includes('natural'));
  //   if (isNaturalAvailable) return isNaturalAvailable;
  //   return this.voices[this.voice] || this.voices[0];
  // }

  play(text: string) {
    this.isEnded = false;
    this.setSpeakerState((prev) => ({ ...prev, isFinished: false, isLoading: true, isPlaying: false, isPaused: false }));
    if (this.isPaused) this.isPaused = false;
    if (this.synth.speaking) this.synth.cancel();
    //this.getEnglishVoices();
    this.text = text;
    this.utterance = new SpeechSynthesisUtterance(text);
    this.utterance.lang = 'en-US';
    this.utterance.rate = 1;
    this.utterance.pitch = 1;
    this.utterance.rate = 1;
    //this.utterance.voice = this.getPreferredVoice();
    this.synth.speak(this.utterance);
    this.utterance.addEventListener('start', () => {
      this.isPlaying = true;
      this.setSpeakerState((prev) => ({ ...prev, isLoading: false, isPlaying: true }));
    });
    this.utterance.addEventListener('end', () => {
      this.setSpeakerState((prev) => ({ ...prev, isFinished: true, isPlaying: false, isLoading: false, isPaused: false }));
      this.reset();
      this.isPlaying = false;
      this.isEnded = true;
    });
  }
  reset() {
    this.isPaused = false;
    this.text = '';
    this.utterance = new SpeechSynthesisUtterance(this.text);
    this.synth = window.speechSynthesis;
    this.isPlaying = false;
    this.isEnded = false;
  }

  pause() {
    if (!this.isPaused) {
      this.setSpeakerState((prev) => ({ ...prev, isPaused: true, isPlaying: false }));
      this.isPaused = true;
      this.synth.pause();
      this.isPlaying = false;
    }
  }
  resume() {
    if (this.isPaused) {
      this.setSpeakerState((prev) => ({ ...prev, isPlaying: true, isPaused: false }));
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
    this.setSpeakerState((prev) => ({ ...prev, isFinished: false, isPlaying: false, isLoading: false, isPaused: false }));
  }
  changeVoice(voice: number) {
    this.voice = voice;
    this.utterance.voice = this.voices[voice];
  }
}
