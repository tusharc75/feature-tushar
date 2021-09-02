import { useState } from "react";
import { MdContentCopy } from "react-icons/md";
import { Tooltip } from "@material-ui/core";

export default function CopyToClipboard({ size = 12, textToCopy, ...rest }) {
  const [show, setShow] = useState(false);
  const handleCopyToClipBoard = () => {
    //@ts-ignore
    navigator.clipboard.writeText(textToCopy);
    setShow(true);
    setTimeout(() => {
      setShow(false);
    }, 600);
  };
  return (
    <>
      {textToCopy ? (
        <Tooltip title="Copied to clipboard" open={show}>
          <span
            className="pl-2 cursor-pointer"
            onClick={handleCopyToClipBoard}
            {...rest}
          >
            <MdContentCopy size={size} />
          </span>
        </Tooltip>
      ) : null}
    </>
  );
}
