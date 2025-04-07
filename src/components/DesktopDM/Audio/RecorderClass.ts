import { AUDIO_FORMAT } from 'src/components/DesktopDM/constants';

/* eslint-disable @typescript-eslint/no-explicit-any */
export type RecordedData = {
  blob: Blob;
  url: string;
  recordingLength: number;
};
type RecorderProps = {
  onError?: (error: string) => void;
  onStartRecording: (recorder: MediaRecorder) => void;
  onStopRecording: (data: RecordedData) => void;
  onTimeElapse?: (time: string) => void;
};

export function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(remainingSeconds).padStart(2, '0');

  return `${formattedMinutes}:${formattedSeconds}`; // Return formatted string
}

class RecorderClass {
  mediaRecorder: MediaRecorder | null;
  isReady: boolean;
  audioChunks: Blob[];
  recordingLength: number;
  interval: NodeJS.Timeout;
  finalBlob: Blob | null;
  onError?: RecorderProps['onError'];
  onStartRecording: RecorderProps['onStartRecording'];
  onStopRecording: RecorderProps['onStopRecording'];
  onTimeElapse: RecorderProps['onTimeElapse'];

  constructor({ onError, onStartRecording, onStopRecording, onTimeElapse }: RecorderProps) {
    this.mediaRecorder = null;
    this.isReady = false;
    this.audioChunks = [];
    this.recordingLength = 0;
    this.finalBlob = null;
    this.onError = onError;
    this.onStartRecording = onStartRecording;
    this.onStopRecording = onStopRecording;
    this.onTimeElapse = onTimeElapse;
  }

  private checkBrowser() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.onError?.('Your browser does not support audio recording.');
      return false;
    }
    return true;
  }

  startRecording = async () => {
    if (!this.checkBrowser()) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    this.mediaRecorder = recorder;
    recorder.ondataavailable = (event) => {
      this.audioChunks = [...this.audioChunks, event.data];
    };
    recorder.onstop = async () => {
      this.finalBlob = new Blob(this.audioChunks, { type: AUDIO_FORMAT });
      const url = URL.createObjectURL(this.finalBlob);
      this.onStopRecording({
        blob: this.finalBlob,
        url,
        recordingLength: this.recordingLength
      });
      this.audioChunks = [];
      clearInterval(this.interval);
    };
    this.mediaRecorder.start();
    this.playSound('start');
    this.recordingLength = 0;
    clearInterval(this.interval);
    this.onStartRecording(this.mediaRecorder);
    this.interval = setInterval(() => {
      this.recordingLength += 1;
      this.onTimeElapse?.(formatTime(this.recordingLength));
    }, 1000);
  };

  stopRecording = async () => {
    if (!this.mediaRecorder) return;
    this.onTimeElapse?.(formatTime(0));
    this.mediaRecorder.stop();
    // Stop all tracks of the media stream
    const stream = this.mediaRecorder.stream;
    stream.getTracks().forEach((track) => track.stop());
    this.playSound('stop');

    this.finalBlob = null;
  };

  destroy() {
    this.mediaRecorder = null;
    this.isReady = null;
    this.audioChunks = null;
    this.recordingLength = null;
    this.finalBlob = null;
    this.onError = null;
    this.onStartRecording = null;
    this.onStopRecording = null;
    this.onTimeElapse = null;
  }

  private playSound(action: 'start' | 'stop') {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    if (action === 'start') {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // High-pitched frequency for ting
    } else if (action === 'stop') {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // Lower-pitched frequency for tung
    } else {
      console.error("Invalid action. Please use 'start' or 'stop'.");
      return;
    }
    gainNode.gain.setValueAtTime(1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
    oscillator.connect(gainNode).connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5); // Stop after 0.5 seconds
  }
}

export default RecorderClass;
