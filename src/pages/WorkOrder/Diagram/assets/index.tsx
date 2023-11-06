import { FileIcon, AudioFile, VideoFile, AIFile, PDFFile, PowerPointFile, ImageFile, ExcelFile, WordFile, ZIPFile } from './icons';

export const fileIcons = [
  {
    extensions: ['.txt', '.rtf'],
    icon: FileIcon
  },
  {
    extensions: ['.doc', '.docx', '.docs'],
    icon: WordFile
  },
  {
    extensions: ['.pdf'],
    icon: PDFFile
  },
  {
    extensions: ['.xlsx', '.xml', '.xls', '.xlsm', '.xlt', '.xltm', '.xltx', '.xlw'],
    icon: ExcelFile
  },
  {
    extensions: ['.csv'],
    icon: ExcelFile
  },
  {
    extensions: ['.pot', '.potm', '.potx', '.ppa', '.ppam', '.pptx', '.pptm', '.ppt', '.ppsx'],
    icon: PowerPointFile
  },
  {
    extensions: ['.tif', 'tiff', '.bmp', '.jpg', '.jpeg', '.gif', '.png', '.eps', '.raw', '.cr2', '.nef', '.orf', '.sr2'],
    icon: ImageFile
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
    icon: ZIPFile
  },
  {
    extensions: ['.ai'],
    icon: AIFile
  },
  {
    extensions: ['.mp3', '.wav', '.flac', '.aac', '.aiff', '.ogg'],
    icon: AudioFile
  },
  {
    extensions: ['.mp4', '.mkv', '.avi', '.flv', '.f4v', '.mov'],
    icon: VideoFile
  }
];

export const getFileIcon = (fileName: string) => {
  let extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  let data = fileIcons.find((o) => o.extensions.indexOf(extension) >= 0);
  if (data && data?.icon) {
    return data.icon;
  } else {
    return FileIcon; // default icon if no icon is found for the file extension.
  }
};

export const getFileNameWithExtention = (file: { url: string; name: string }) => {
  const fileNameExtention = file.name.lastIndexOf('.');
  if (fileNameExtention > -1) {
    return file.name;
  } else {
    const extention = file.url.substring(file.url.lastIndexOf('.')).toLowerCase();
    return `${file.name}${extention}`;
  }
};
