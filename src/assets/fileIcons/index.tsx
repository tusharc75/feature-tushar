import { FileIcon, AudioFile, VideoFile, AIFile, PDFFile, PowerPointFile, ImageFile, ExcelFile, WordFile, ZIPFile } from './icons';
export * from './icons';

export const fileIcons = [
  {
    extensions: ['.txt', '.rtf'],
    icon: FileIcon,
    type: 'any'
  },
  {
    extensions: ['.doc', '.docx', '.docs'],
    icon: WordFile,
    type: 'word'
  },
  {
    extensions: ['.pdf'],
    icon: PDFFile,
    type: 'pdf'
  },
  {
    extensions: ['.xlsx', '.xml', '.xls', '.xlsm', '.xlt', '.xltm', '.xltx', '.xlw'],
    icon: ExcelFile,
    type: 'excel'
  },
  {
    extensions: ['.csv'],
    icon: ExcelFile,
    type: 'csv'
  },
  {
    extensions: ['.pot', '.potm', '.potx', '.ppa', '.ppam', '.pptx', '.pptm', '.ppt', '.ppsx'],
    icon: PowerPointFile,
    type: 'powerpoint'
  },
  {
    extensions: ['.tif', 'tiff', '.bmp', '.jpg', '.jpeg', '.gif', '.png', '.eps', '.raw', '.cr2', '.nef', '.orf', '.sr2'],
    icon: ImageFile,
    type: 'image'
  },
  {
    extensions: [
      '.arc',
      '.arj',
      '.as',
      '.b64',
      '.btoa',
      '.bz',
      '.bz2',
      '.cab',
      '.cpt',
      '.gz',
      '.hqx',
      '.iso',
      '.lha',
      '.lzh',
      '.mim',
      '.mme',
      '.pak',
      '.pf',
      '.rar',
      '.rpm',
      '.sea',
      '.sit',
      '.sitx',
      '.tar',
      '.gz',
      '.tbz',
      '.tbz2',
      '.tgz',
      '.uu',
      '.uue',
      '.z',
      '.zip',
      '.zipx',
      '.zoo'
    ],
    icon: ZIPFile,
    type: 'compressed'
  },
  {
    extensions: ['.ai'],
    icon: AIFile,
    type: 'illustration'
  },
  {
    extensions: ['.mp3', '.wav', '.flac', '.aac', '.aiff', '.ogg'],
    icon: AudioFile,
    type: 'audio'
  },
  {
    extensions: ['.mp4', '.mkv', '.avi', '.flv', '.f4v', '.mov'],
    icon: VideoFile,
    type: 'video'
  }
];

export const getFileIconData = (fileName: string): FileIconData => {
  const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  if (!extension) return fileIcons[0] as unknown as FileIconData;
  const iconData = fileIcons.find((icd) => icd.extensions.includes(extension as any)) as unknown as FileIconData;
  if (iconData) {
    return iconData;
  }
  return fileIcons[0] as unknown as FileIconData;
};

export type FileIconData = { extensions: string; icon: FileIconType; type: FileTypes };
export type FileTypes = 'compressed' | 'illustration' | 'audio' | 'video' | 'any' | 'word' | 'pdf' | 'excel' | 'csv' | 'powerpoint' | 'image';
export type FileIconType =
  | typeof FileIcon
  | typeof AudioFile
  | typeof VideoFile
  | typeof AIFile
  | typeof PDFFile
  | typeof PowerPointFile
  | typeof ImageFile
  | typeof ExcelFile
  | typeof WordFile
  | typeof ZIPFile;
export type FileIconExtensions = FileIconData['extensions'][number];

type FileIconsMap = {
  [key in FileTypes]: {
    extensions: readonly string[];
    icon: FileIconType;
    type: FileTypes;
  };
};
export const fileIconsMap = fileIcons.reduce((acc, curr) => {
  acc[curr.type] = curr;
  return acc;
}, {} as FileIconsMap);
