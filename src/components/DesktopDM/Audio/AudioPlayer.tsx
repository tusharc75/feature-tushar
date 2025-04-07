import { Close, Download, Pause, PlayArrow } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { cn } from 'src/constants/helpers';
import WaveSurfer from 'wavesurfer.js';
import { formatTime } from './RecorderClass';

interface AudioPlayerProps {
  src: string;
  hasToDownload?: boolean;
  onDelete?: (src: string) => void;
  downloadFileName?: string | false;
  height?: number;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, onDelete, hasToDownload = false, downloadFileName = false, height = 35 }) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [link, setLink] = useState(src);

  const downloadFile = async (fileUrl: string, instance: WaveSurfer) => {
    try {
      const { data } = await axiosInstance().get(`user/download?fileName=${encodeURIComponent(fileUrl)}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([data]));
      setLink(url);
      instance.load(url);
    } catch (error) {
    }
  };

  useEffect(() => {
    if (waveformRef.current) {
      wavesurferRef.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: 'lightblue',
        progressColor: '#0f9fa9',
        height: height
      });

      wavesurferRef.current.on('ready', () => {
        setDuration(wavesurferRef.current?.getDuration() || 0);
      });
      wavesurferRef.current.on('audioprocess', () => {
        setCurrentTime(wavesurferRef.current?.getCurrentTime() || 0);
      });
      wavesurferRef.current.on('play', () => {
        setPlaying(true);
      });
      wavesurferRef.current.on('pause', () => {
        setPlaying(false);
      });
      return () => {
        wavesurferRef.current?.destroy();
      };
    }
  }, [src, hasToDownload, height]);

  useEffect(() => {
    if (hasToDownload) {
      downloadFile(src, wavesurferRef.current);
    } else {
      setLink(src);
      wavesurferRef.current.load(src);
    }
  }, [hasToDownload, src]);

  const togglePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const handleDownload = () => {
    if (typeof downloadFileName === 'boolean') return;
    const anchor = document.createElement('a');
    anchor.href = link;
    anchor.setAttribute('download', downloadFileName);
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  return (
    <div className={cn('rounded-lg ', hasToDownload ? '' : 'bg-gray-100 p-2 dark:bg-gray-800')}>
      <div className="flex items-center gap-2">
        <IconButton size="small" color="primary" onClick={togglePlayPause}>
          {playing ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
        </IconButton>
        <div className="flex-grow cursor-pointer" ref={waveformRef}></div>
        <span className="min-w-[35px] text-xs">{playing ? formatTime(Math.floor(currentTime)) : formatTime(Math.floor(duration))}</span>
        {typeof onDelete === 'function' && (
          <IconButton size="small" onClick={() => onDelete(src)}>
            <Close fontSize="small" />
          </IconButton>
        )}
        {downloadFileName && (
          <IconButton size="small" color="primary" onClick={() => handleDownload()}>
            <Download fontSize="small" />
          </IconButton>
        )}
      </div>
    </div>
  );
};

export default AudioPlayer;
