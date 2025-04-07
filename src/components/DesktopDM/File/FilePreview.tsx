import { useMemo } from 'react';
import { FileIconData } from 'src/assets/fileIcons';
import RenderFiles from 'src/components/DesktopDM/File/RenderFiles';
import RenderImages from 'src/components/DesktopDM/File/RenderImages';
import { Attachment } from 'src/components/DesktopDM/types';

export type AttachedFileType = (Attachment & FileIconData) & { file?: File };

type FilePreviewProps = {
  files: AttachedFileType[];
  hasToDownload?: boolean;
  showDownloadButton?: boolean;
  onDelete?: (file: Attachment & FileIconData) => void;
};

export type RenderFileProps = FilePreviewProps;

export type RenderSingleFileProps = {
  file: FilePreviewProps['files'][number];
} & Omit<RenderFileProps, 'files'>;

const FilePreview = ({ files: allFiles, hasToDownload = false, showDownloadButton = false, onDelete }: FilePreviewProps) => {
  const { images, files } = useMemo(() => {
    const data: { images: AttachedFileType[]; files: AttachedFileType[] } = {
      images: [],
      files: []
    };
    if (!allFiles) return data;
    for (const file of allFiles) {
      if (file.type === 'image') {
        data.images.push(file);
      } else {
        data.files.push(file);
      }
    }
    return data;
  }, [allFiles]);

  return (
    <div className="space-y-2">
      <RenderImages files={images} hasToDownload={hasToDownload} onDelete={onDelete} showDownloadButton={showDownloadButton} />
      <RenderFiles files={files} hasToDownload={hasToDownload} onDelete={onDelete} showDownloadButton={showDownloadButton} />
    </div>
  );
};

export default FilePreview;
