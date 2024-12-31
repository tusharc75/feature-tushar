import { IconButton, IconButtonProps, SvgIconTypeMap } from '@mui/material';
import { OverridableComponent } from '@mui/material/OverridableComponent';
import { DoneAllOutlined, FileCopyOutlined } from '@mui/icons-material';
import React, { useState } from 'react';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { cn, copyTextToClipboard } from 'src/constants/helpers';

type CopyToClipboardButtonProps = {
  text: string;
  // prettier-ignore
  containerProps?: React.HTMLAttributes<HTMLSpanElement>;
  smallIcon?: boolean;
} & IconButtonProps;

const CopyToClipboardButton = ({ text, smallIcon = false, ...props }: CopyToClipboardButtonProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const { className, ...buttonProps } = props || {};

  const handleCopy = (text: string) => {
    setIsCopied(true);
    copyTextToClipboard(text);
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  return (
    <HtmlTooltip title={isCopied ? 'Copied' : 'Copy'} className="p-0">
      <IconButton
        size="small"
        {...buttonProps}
        className={cn(className, smallIcon ? '[&_.MuiIconButton-label]:!p-[3px]' : '')}
        onClick={() => handleCopy(text)}
      >
        {isCopied ? (
          <DoneAllOutlined fontSize="small" className={cn('!text-green-500', smallIcon ? '!text-[16px]' : '')} />
        ) : (
          <FileCopyOutlined className={cn(smallIcon ? '!text-[16px]' : '')} fontSize="small" />
        )}
      </IconButton>
    </HtmlTooltip>
  );
};

export default CopyToClipboardButton;
