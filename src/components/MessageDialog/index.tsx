import { Error } from '@material-ui/icons';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from 'src/constants/helpers';
import DashboardModal from '../DashboardModal';

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
        {getMessageList(errorMessages)?.map((d) => (
          <div
            key={d.message}
            title={d?.message}
            className="grid grid-cols-[1fr_5fr] gap-[20px]  shadow-[0px_5.44444px_27.22222px_0px_rgba(0,_0,_0,_0.06)] px-[15px] py-[12px] md:px-[20px] rounded-lg"
            style={{ border: '1px solid var(--common-border-color)' }}
          >
            <div>
              <h6 className="text-[13px] mb-[6px]">Index:</h6>
              <p className="text-[14px]">{d?.indexes?.map((index) => `${index}`.padStart(2, '0'))}</p>
            </div>
            <div>
              <h6 className="text-[13px] mb-[6px]">Error Message:</h6>
              <p className="text-[14px] line-clamp-1">{d?.message}</p>
            </div>
          </div>
        ))}
      </div>
    </DashboardModal>
  );
}
