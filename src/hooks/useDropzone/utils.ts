import { ErrorType, FileData, MimeType } from './types';

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function filterFileByMimeTypesAndSize(
  files: File[] | null | FileList,
  mimeType: string,
  maxSize?: number,
  errorCallback?: (errors: ErrorType) => void
) {
  if (!files) return [];
  files = Array.from(files);
  const acceptedTypes = mimeType.split(',').map((type) => type.trim());
  const tempFiles: File[] = [];
  const errors: ErrorType = {};

  const setError = (file: File, error: string) => {
    errors[file.name] = { message: error };
  };

  const checkIfValidFileType = (file: File) => {
    return acceptedTypes.some((type) => {
      if (type.includes('/*')) {
        // Handle wildcard types like image/*, video/*
        return file.type.startsWith(type.split('/')[0]);
      }
      return file.type === type;
    });
  };

  for (const file of files) {
    if (maxSize && file.size > maxSize) {
      setError(file, `File size exceeds limit: ${formatBytes(file.size)} (max ${formatBytes(maxSize)}).`);
      continue;
    } else if (checkIfValidFileType(file)) {
      tempFiles.push(file);
    } else {
      setError(file, 'Invalid file type');
    }
  }
  if (Object.keys(errors).length) {
    errorCallback?.(errors);
  }
  return tempFiles;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function formatTime(seconds?: number): string {
  if (!seconds) return '00:00:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return [hours.toString().padStart(2, '0'), minutes.toString().padStart(2, '0'), secs.toFixed(0).toString().padStart(2, '0')].join(':');
}

export const createFileDataFromFiles = async (files: File[] | null) => {
  if (!files) return;
  const tempData: FileData[] = [];

  for (const file of files) {
    const videoURL = URL.createObjectURL(file);
    const thumbnail = await generateThumbnail(file);
    const data: FileData = {
      lastModified: file.lastModified,
      name: file.name,
      size: file.size,
      formattedSize: formatBytes(file.size),
      type: file.type,
      src: videoURL,
      thumbnail
    };
    tempData.push(data);
  }
  return tempData;
};

export function generateVideoThumbnail(videoUrl?: string, timeInSeconds: number = 2): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!videoUrl) {
      reject('Video URL is undefined');
      return;
    }

    // Create a video element
    const video = document.createElement('video');
    video.src = videoUrl;
    video.crossOrigin = 'anonymous';

    video.addEventListener('loadeddata', () => {
      video.currentTime = timeInSeconds;
    });

    video.addEventListener('seeked', () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnail = canvas.toDataURL('image/png');
        resolve(thumbnail);
      } else {
        reject('Failed to get canvas context');
      }
    });

    video.addEventListener('error', (err) => {
      reject(`Error loading video: ${err.message}`);
    });
  });
}

export function generateImageThumbnail(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const src = URL.createObjectURL(file);
    img.onload = () => {
      resolve(src);
    };
    img.onerror = (error) => {
      reject(error);
    };

    img.src = src;
  });
}

export async function generateThumbnail(file: File): Promise<string | undefined> {
  if (file.type.startsWith('image/')) {
    return await generateImageThumbnail(file);
  }
  if (file.type.startsWith('video/')) {
    return await generateVideoThumbnail(URL.createObjectURL(file));
  }
  //   if(file.type.startsWith(''))
}

export const removeItemAtIndex = <T>(list: T[], index: number): T[] => {
  if (list.length === 0) return list;
  if (index < 0 || index >= list.length) return list;
  return [...list.slice(0, index), ...list.slice(index + 1)];
};

export const parseAccept = (accept: MimeType | MimeType[]) => {
  if (Array.isArray(accept)) {
    return accept.join(',');
  }
  return accept;
};
