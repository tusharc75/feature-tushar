import { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

type UserVoiceRecognitionProps = {
  type: 'continuous' | 'once';
};

const useVoiceRecognition = (props?: UserVoiceRecognitionProps) => {
  const { type = 'once' } = props || {};
  const toastConfig = useContext(CustomToastContext);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const [voiceIntensity, setVoiceIntensity] = useState(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const browserSupportsSpeechRecognition = 'webkitSpeechRecognition' in window;

  useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = type === 'continuous';
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setListening(true);
    recognition.onend = () => {
      setListening(false);
      if (type === 'continuous' && recognitionRef.current) {
        recognitionRef.current.start();
      }
    };
    recognition.onaudiostart = () => {
      setVoiceIntensity(80); // Simulate voice intensity when audio starts
    };
    recognition.onaudioend = () => {
      setVoiceIntensity(0); // Reset voice intensity when audio ends
    };
    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPart;
        } else {
          interimTranscript += transcriptPart;
        }
      }
      setTranscript((prev) => prev + finalTranscript);
      setInterimTranscript(interimTranscript);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [browserSupportsSpeechRecognition, type]);

  const startListening = useCallback(() => {
    if (!browserSupportsSpeechRecognition) {
      toastConfig.setToastConfig({
        message: 'This browser does not support the Web Speech API.',
        open: true,
        type: 'warning'
      });
    }
    if (recognitionRef.current && !listening) {
      recognitionRef.current.start();
    }
  }, [browserSupportsSpeechRecognition, listening, toastConfig]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && listening) {
      recognitionRef.current.stop();
    }
  }, [listening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    transcript: transcript + interimTranscript,
    listening,
    voiceIntensity,
    startListening,
    stopListening,
    resetTranscript,
    browserSupportsSpeechRecognition
  };
};

export default useVoiceRecognition;
