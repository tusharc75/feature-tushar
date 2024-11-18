import { ErrorType, MimeType } from './types';
import React, { useState } from 'react';
import { filterFileByMimeTypesAndSize, parseAccept } from './utils';

export * from './types';
export * from './utils';

type UseDropProps = {
  onDragEnter?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, files: File[]) => void;
  onError?: (err: ErrorType) => void;
  accept?: MimeType | MimeType[];
  disabled?: boolean;
  maxSize?: number;
  multiple?: boolean;
};

let timeout: NodeJS.Timeout;

const useDropZone = (props?: UseDropProps) => {
  const {
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDrop,
    accept = ['application/pdf', 'image/*', 'video/*'],
    disabled = false,
    maxSize = 1024 * 1024 * 100,
    onError,
    multiple = false
  } = props;
  const [isHovering, setIsHovering] = useState(false);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsHovering(true);
    onDragEnter?.(e);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      setIsHovering(false);
    }, 800);
    onDragLeave?.(e);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsHovering(true);
    onDragOver?.(e);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsHovering(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const filteredFiles = filterFileByMimeTypesAndSize(droppedFiles, parseAccept(accept), maxSize, onError);
    if (!disabled && filteredFiles.length > 0) {
      onDrop?.(e, multiple ? filteredFiles : [filteredFiles[0]]);
    }
  };

  const rootProps: React.HTMLAttributes<HTMLElement> = {
    onDragEnter: handleDragEnter,
    onDragLeave: handleDragLeave,
    onDragOver: handleDragOver,
    onDrop: handleDrop
  };

  return {
    isHovering,
    rootProps
  };
};

export default useDropZone;
