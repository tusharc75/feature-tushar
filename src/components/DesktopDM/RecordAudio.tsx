import { Mic } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import { useEffect, useRef, useState } from 'react';

const RecordAudio = () => {
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingLength, setRecordingLength] = useState(0);
  const [waveformData, setWaveformData] = useState(null);
  const canvasRef = useRef(null);

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Your browser does not support audio recording.');
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);

    recorder.ondataavailable = (event) => {
      setAudioChunks((prev) => [...prev, event.data]);
    };

    recorder.onstop = async () => {
      const blob = new Blob(audioChunks, { type: 'audio/wav' });
      setAudioBlob(blob);

      // Extract waveform data
      const audioBuffer = await getAudioBuffer(blob);
      const waveData = extractWaveform(audioBuffer);
      setWaveformData(waveData);

      drawWaveform(waveData);
    };

    setMediaRecorder(recorder);
    recorder.start();
    setIsRecording(true);

    setRecordingLength(0);
    const timer = setInterval(() => setRecordingLength((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
    }
    setIsRecording(false);
    setAudioChunks([]);
  };

  const getAudioBuffer = (blob) => {
    return new Promise((resolve) => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const reader = new FileReader();
      reader.onload = async () => {
        const arrayBuffer = reader.result;
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        resolve(audioBuffer);
      };
      reader.readAsArrayBuffer(blob);
    });
  };

  const extractWaveform = (audioBuffer) => {
    const channelData = audioBuffer.getChannelData(0); // Mono channel
    const sampleRate = Math.floor(channelData.length / canvasRef.current.width);
    const waveform = [];
    for (let i = 0; i < channelData.length; i += sampleRate) {
      waveform.push(channelData[i]);
    }
    return waveform;
  };

  const drawWaveform = (waveform) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    waveform.forEach((sample, index) => {
      const x = index;
      const y = (sample * canvas.height) / 2 + canvas.height / 2;
      ctx.lineTo(x, y);
    });
    ctx.strokeStyle = 'black';
    ctx.stroke();
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <h1>Audio Recorder</h1>
      <button onClick={startRecording} disabled={isRecording}>
        Start Recording
      </button>
      <button onClick={stopRecording} disabled={!isRecording}>
        Stop Recording
      </button>
      <p>Recording Length: {recordingLength} seconds</p>
      {audioBlob && (
        <>
          <p>Audio recorded! Waveform displayed below:</p>
          <canvas ref={canvasRef} width="500" height="200"></canvas>
        </>
      )}
    </div>
  );
};

export default RecordAudio;
