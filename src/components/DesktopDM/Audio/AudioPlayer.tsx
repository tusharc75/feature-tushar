import { Close, Delete, Download, MoreVert, Pause, PlayArrow } from '@mui/icons-material';
import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getFileUrl } from 'src/components/DesktopDM/utils';
import { cn } from 'src/constants/helpers';
import WaveSurfer from 'wavesurfer.js';
import { formatTime } from './RecorderClass';

interface AudioPlayerProps<P> {
  src: string;
  onDeletePayload?: P;
  hasToDownload?: boolean;
  onDelete?: (src: string, payload: P) => void;
  downloadFileName?: string | false;
  height?: number;
}

const AudioPlayer = <P,>({ src, onDelete, hasToDownload = false, downloadFileName = false, height = 35, onDeletePayload }: AudioPlayerProps<P>) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [link, setLink] = useState(src);
  const [optionMenuAnchor, setOptionMenuAnchor] = useState<HTMLButtonElement | null>(null);

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
        wavesurferRef.current = null;
      };
    }
  }, [src, hasToDownload, height]);

  useEffect(() => {
    if (hasToDownload) {
      getFileUrl(src).then((url) => {
        setLink(url);
        wavesurferRef.current.load(url);
      });
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

  const isBothButtonVisible = useMemo(() => typeof onDelete === 'function' && downloadFileName, [downloadFileName, onDelete]);

  return (
    <div className={cn('rounded-lg ', hasToDownload ? '' : 'bg-gray-100 p-2 dark:bg-gray-800')}>
      <div className="flex items-center gap-2">
        <IconButton size="small" color="primary" onClick={togglePlayPause}>
          {playing ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
        </IconButton>
        <div className="flex-grow cursor-pointer" ref={waveformRef}></div>
        <span className="min-w-[35px] text-xs">{playing ? formatTime(Math.floor(currentTime)) : formatTime(Math.floor(duration))}</span>
        {isBothButtonVisible ? (
          <>
            <IconButton size="small" color={'primary'} onClick={(e) => setOptionMenuAnchor(e.currentTarget)}>
              <MoreVert fontSize="small" />
            </IconButton>
            <Menu
              anchorEl={optionMenuAnchor}
              disableScrollLock
              open={Boolean(optionMenuAnchor)}
              onClose={() => setOptionMenuAnchor(null)}
              slotProps={{ paper: { onClick: () => setOptionMenuAnchor(null), sx: { minWidth: '150px' } } }}
            >
              <MenuItem onClick={() => handleDownload()}>
                <ListItemIcon>
                  <Download color="primary" />
                </ListItemIcon>
                <ListItemText>Download</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => onDelete(src, onDeletePayload)}>
                <ListItemIcon>
                  <Delete color="error" />
                </ListItemIcon>
                <ListItemText>Delete</ListItemText>
              </MenuItem>
            </Menu>
          </>
        ) : (
          <>
            {typeof onDelete === 'function' && (
              <IconButton size="small" onClick={() => onDelete(src, onDeletePayload)}>
                <Close fontSize="small" />
              </IconButton>
            )}
            {downloadFileName && (
              <IconButton size="small" color="primary" onClick={() => handleDownload()}>
                <Download fontSize="small" />
              </IconButton>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AudioPlayer;
