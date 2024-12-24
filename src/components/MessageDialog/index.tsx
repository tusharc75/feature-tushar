import { Error } from '@mui/icons-material';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from 'src/constants/helpers';
import DashboardModal from '../DashboardModal';
import { Button, Collapse } from '@mui/material';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';

interface ErrorMessages {
  index?: number;
  message: string;
}

export default function CustomMessageDialog({
  open,
  errorMessages,
  onClose,
  forwardText
}: {
  open: boolean;
  errorMessages: ErrorMessages[];
  onClose: () => void;
  forwardText?: string;
}) {
  const [expanded, setExpanded] = useState({});
  const getMessageList = (message) => {
    const errorMessages: any = [];
    message?.forEach((m) => {
      const { index, message } = m;
      const existingMessage = errorMessages.find((m) => m?.message === message);
      if (existingMessage) {
        existingMessage.indexes.push(index);
      } else {
        errorMessages.push({ message, indexes: [index] });
      }
    });
    return errorMessages;
  };

  return (
    <DashboardModal
      dialogProps={{
        disableEscapeKeyDown: true,
        fullScreen: isMobile || isTablet,
        maxWidth: 'sm',
        TransitionComponent: CustomDialogTransition,
        onClose: (e, reason) => {
          if (reason !== 'backdropClick') {
          }
        },
        keepMounted: true,
        fullWidth: true
      }}
      modalHead={{
        icon: <Error color={'error'} />,
        title: 'Message',
        fullScreenOption: true
      }}
      handleClose={() => onClose()}
      aria-labelledby="confirmation-dialog-title"
      open={open}
      id="confirmation-dialog"
    >
      <div className="grid gap-2">
        {getMessageList(errorMessages)?.map((d, index) => <RenderSingleMessage key={`${d?.indexes?.toString()}${d.message}`} index={index} d={d} />)}
      </div>
    </DashboardModal>
  );
}

const RenderSingleMessage = ({ d, index }) => {
  const [expanded, setExpanded] = useState(false);
  const itemRef = useRef<HTMLSpanElement>(null);
  const [itemHeight, setItemHeight] = useState(46);
  const indexesString = d?.indexes?.join(', ');

  useLayoutEffect(() => {
    if (itemRef?.current) {
      setItemHeight(itemRef?.current?.offsetHeight);
    } else {
      setItemHeight(46);
    }
  }, []);

  return (
    <div
      key={`${index}${d.message}`}
      className="grid grid-cols-[1fr_5fr] gap-[20px]  rounded-lg px-[15px] py-[12px] shadow-[0px_5.44444px_27.22222px_0px_rgba(0,_0,_0,_0.06)] md:px-[20px]"
      style={{ border: '1px solid var(--common-border-color)' }}
    >
      <div title={d?.indexes?.toString()} className="cursor-help">
        <p className="mb-[8px] text-[13px]">Index</p>
        <h6
          className={`overflow-hidden text-[16px] transition-all duration-300`}
          style={{ maxHeight: expanded ? itemHeight : itemHeight < 46 ? itemHeight : 46 }}
        >
          <span ref={itemRef}>{indexesString}</span>
        </h6>
        {itemHeight > 46 && (
          <Button size="small" onClick={() => setExpanded((prev) => !prev)}>
            {expanded ? 'Hide' : 'More..'}
          </Button>
        )}
      </div>
      <div title={d?.message} className=" cursor-help">
        <p className="mb-[8px] text-[13px]">Message</p>
        <p className="text-[16px]">{d?.message}</p>
      </div>
    </div>
  );
};
