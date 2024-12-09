import Dialog from '@material-ui/core/Dialog';
import moment from 'moment';
import { CustomCalendarProps, ViewType } from 'src/components/CustomCalendar';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { CustomDialogTransition, dateFormat } from 'src/constants/helpers';

type MobileDayViewProps = {
  onClose: () => void;
  date: string;
  calnedarProps: CustomCalendarProps & { views: ViewType[] };
  Component: any;
};

const MobileDayView = ({ onClose, date, calnedarProps, Component }: MobileDayViewProps) => {
  return (
    <Dialog
      maxWidth="md"
      fullScreen={true}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
        }
      }}
      fullWidth
    >
      <CustomDialogHeader title={moment(date).format(dateFormat)} onClose={onClose} />
      <CustomDialogContent isFooterPresent={false}>
        <Component
          {...calnedarProps}
          components={{ header: () => <></>, toolbar: () => <></> }}
          style={{ ...calnedarProps.style, height: 'calc(100vh - 90px)' }}
        />
      </CustomDialogContent>
    </Dialog>
  );
};

export default MobileDayView;
