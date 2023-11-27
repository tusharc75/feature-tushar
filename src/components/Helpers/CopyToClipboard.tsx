import { useState } from 'react';
import { MdContentCopy } from 'react-icons/md';
import { Tooltip } from '@material-ui/core';
import { MdOutlineDone } from 'react-icons/md';

export default function CopyToClipboard({ size = 12, textToCopy, ...rest }) {
  const [show, setShow] = useState(false);
  const [copyIcon, setCopyIcon] = useState(false);
  const handleCopyToClipBoard = () => {
    navigator.clipboard.writeText(textToCopy);
    setShow(true);
    setCopyIcon(true);

    const timeOut = setTimeout(() => {
      setShow(false);
    }, 600);

    const copyIconTimeout = setTimeout(() => {
      setCopyIcon(false);
    }, 2000);

    const timeOutIds = [timeOut, copyIconTimeout];

    return () => timeOutIds.forEach((t) => clearTimeout(t));
  };
  return (
    <>
      {textToCopy ? (
        <Tooltip title="✓ Copied to clipboard " open={show} arrow placement="top">
          <span className="pl-2 cursor-pointer" onClick={handleCopyToClipBoard} {...rest}>
            {copyIcon ? <MdOutlineDone size={size} /> : <MdContentCopy size={size} />}
          </span>
        </Tooltip>
      ) : null}
    </>
  );
}
