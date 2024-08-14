import { useState } from 'react';
import { MdContentCopy, MdOutlineDone } from 'react-icons/md';
import HtmlTooltip from '../CustomTooltipTitle';
import { cn } from 'src/constants/helpers';

export default function CopyToClipboard({ size = 12, textToCopy, className = '', ...rest }) {
  const [show, setShow] = useState(false);
  const [copyIcon, setCopyIcon] = useState(true);

  const handleCopyToClipBoard = () => {
    navigator.clipboard.writeText(textToCopy);
    setShow(true);
    setCopyIcon(false);

    const timeOut = setTimeout(() => {
      setShow(false);
    }, 600);

    const copyIconTimeout = setTimeout(() => {
      setCopyIcon(true);
    }, 2000);

    const timeOutIds = [timeOut, copyIconTimeout];

    return () => timeOutIds.forEach((t) => clearTimeout(t));
  };
  return (
    <>
      {textToCopy ? (
        <HtmlTooltip title="✓ Copied to clipboard " className="flex-shrink-0" open={show} arrow placement="top">
          <span className={cn('ml-2 cursor-pointer', className)} style={{ minWidth: `${size}px` }} onClick={handleCopyToClipBoard} {...rest}>
            {copyIcon ? <MdContentCopy size={size} /> : <MdOutlineDone size={size} />}
          </span>
        </HtmlTooltip>
      ) : null}
    </>
  );
}
