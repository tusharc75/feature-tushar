import { AttachFile } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import React, { useRef } from 'react';
import { getFileIconData } from 'src/assets/fileIcons';
import { AttachedFileType } from 'src/components/DesktopDM/File/FilePreview';

type AttachmentProps = {
  onFileInput: (data: AttachedFileType[]) => void;
};

const AttachmentInput = ({ onFileInput }: AttachmentProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files);
    const data: AttachedFileType[] = newFiles.map((file, index) => ({
      _id: `${new Date().getTime()}_${index}_${file.name}`,
      file,
      url: URL.createObjectURL(file),
      fileName: file.name,
      ...getFileIconData(file.name)
    }));

    onFileInput(data);
    e.target.value = '';
  };

  return (
    <>
      <input
        type="file"
        multiple
        onChange={handleFileInput}
        className="sr-only"
        style={{ display: 'none' }}
        ref={inputRef}
        accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      />
      <IconButton size="small" color="primary" onClick={() => inputRef.current?.click()}>
        <AttachFile fontSize="small" />
      </IconButton>
    </>
  );
};

export default AttachmentInput;
