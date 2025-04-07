import { useMemo } from 'react';
import { FileIconData } from 'src/assets/fileIcons';
import axiosInstance from 'src/axios/axiosInstance';
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

export type RenderFileProps = {
  getFileUrl: (fileUrl: string, onSuccess?: (url: string) => void) => Promise<string>;
  handleDownload: (file: AttachedFileType) => Promise<void>;
} & FilePreviewProps;

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

  const handleDownload = async (file: AttachedFileType) => {
    let fileDownloadUrl = file.url;
    if (hasToDownload) {
      fileDownloadUrl = await getFileUrl(file.url);
    } else {
      fileDownloadUrl = file.url;
    }
    const anchor = document.createElement('a');
    anchor.href = fileDownloadUrl;
    anchor.setAttribute('download', file.fileName);
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  const getFileUrl = async (fileUrl: string, onSuccess?: (url: string) => void) => {
    try {
      const { data } = await axiosInstance().get(`user/download?fileName=${encodeURIComponent(fileUrl)}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([data]));
      onSuccess?.(url);
      return url;
    } catch (error) {
    }
  };

  return (
    <div className="space-y-2">
      <RenderImages
        files={images}
        getFileUrl={getFileUrl}
        handleDownload={handleDownload}
        hasToDownload={hasToDownload}
        onDelete={onDelete}
        showDownloadButton={showDownloadButton}
      />
      <RenderFiles
        files={files}
        getFileUrl={getFileUrl}
        handleDownload={handleDownload}
        hasToDownload={hasToDownload}
        onDelete={onDelete}
        showDownloadButton={showDownloadButton}
      />
    </div>
  );
};

export default FilePreview;
