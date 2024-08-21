import { IconButton, IconButtonProps } from '@material-ui/core';
import { DoneAllOutlined, FileCopyOutlined } from '@material-ui/icons';
import React, { useState } from 'react';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { copyTextToClipboard } from 'src/constants/helpers';

type CopyToClipboardButtonProps = {
  text: string;
  containerProps?: React.HTMLAttributes<HTMLSpanElement>;
} & IconButtonProps;

const CopyToClipboardButton = ({ text, ...props }: CopyToClipboardButtonProps) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = (text: string) => {
    setIsCopied(true);
    copyTextToClipboard(text);
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  return (
    <HtmlTooltip title={isCopied ? 'Copied' : 'Copy'}>
      <IconButton size="small" {...props} onClick={() => handleCopy(text)}>
        {isCopied ? <DoneAllOutlined fontSize="small" className="!text-green-500" /> : <FileCopyOutlined fontSize="small" />}
      </IconButton>
    </HtmlTooltip>
  );
};

export default CopyToClipboardButton;
