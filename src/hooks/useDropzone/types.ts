export type FileData = {
  lastModified: number;
  name: string;
  size: number;
  type: string;
  src: string;
  thumbnail: string | undefined;
  formattedSize: string;
};

export type ErrorType = {
  [key: string]: {
    message: string;
  };
};

export type MimeType =
  | 'application/pdf'
  | 'application/json'
  | 'application/xml'
  | 'application/zip'
  | 'application/x-rar-compressed'
  | 'application/octet-stream'
  | 'application/vnd.ms-excel'
  | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  | 'application/vnd.ms-powerpoint'
  | 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  | 'application/msword'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  | 'image/jpeg'
  | 'image/png'
  | 'image/gif'
  | 'image/bmp'
  | 'image/webp'
  | 'image/svg+xml'
  | 'video/mp4'
  | 'video/webm'
  | 'video/ogg'
  | 'audio/mpeg'
  | 'audio/wav'
  | 'audio/ogg'
  | 'text/plain'
  | 'text/html'
  | 'text/css'
  | 'text/javascript'
  | 'application/typescript'
  | 'application/x-www-form-urlencoded'
  | 'multipart/form-data'
  | 'image/*'
  | 'video/*'
  | 'audio/*';
