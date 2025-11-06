import { ContentCopy, DoneAll } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import React, { useContext, useState } from 'react';
import { asyncCopyText } from 'src/constants/helpers';
import { makeSafeId } from 'src/pages/UserManual/utils';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const CopyButton = ({ title }: { title: string }) => {
  const [copied, setCopied] = useState(false);
  const toastConfig = useContext(CustomToastContext);
  const hash = makeSafeId(`${title}`);
  const location = window.location;
  const pathName = `${location.origin}${location.pathname}`;

  const handleCopy = async (text: string) => {
    try {
      await asyncCopyText(text);
      toastConfig.setToastConfig({ type: 'success', message: 'URL Copied', open: true });
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      toastConfig.setToastConfig({ type: 'success', message: 'Failed to copy URL', open: true });
    }
  };
  return (
    <IconButton
      onClick={() => handleCopy(`${pathName}#${hash}`)}
      size="small"
      className="!p-1 !text-gray-400 opacity-0 transition-opacity hover:!text-gray-600 group-hover:opacity-100"
      title="Copy link"
    >
      {copied ? <DoneAll fontSize="small" /> : <ContentCopy fontSize="small" />}
    </IconButton>
  );
};

export default CopyButton;
