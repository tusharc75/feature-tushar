import { useState } from 'react';
import { MdContentCopy, MdOutlineDone } from 'react-icons/md';
import HtmlTooltip from '../CustomTooltipTitle';

export default function CopyToClipboard({ size = 12, textToCopy, ...rest }) {
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
        <HtmlTooltip title="✓ Copied to clipboard " open={show} arrow placement="top">
          <span className="ml-2 cursor-pointer" style={{ minWidth: `${size}px` }} onClick={handleCopyToClipBoard} {...rest}>
            {copyIcon ? <MdContentCopy size={size} /> : <MdOutlineDone size={size} />}
          </span>
        </HtmlTooltip>
      ) : null}
    </>
  );
}
