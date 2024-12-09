import Dialog from '@material-ui/core/Dialog';
import { CustomDialogTransition, dateFormat } from 'src/constants/helpers';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { Calendar, CalendarProps } from 'react-big-calendar';
import moment from 'moment';

type MobileDayViewProps = {
  onClose: () => void;
  date: string;
  calnedarProps: CalendarProps;
};

const MobileDayView = ({ onClose, date, calnedarProps }: MobileDayViewProps) => {
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
        <Calendar
          {...calnedarProps}
          components={{ header: () => <></>, toolbar: () => <></> }}
          style={{ ...calnedarProps.style, height: 'calc(100vh - 90px)' }}
        />
      </CustomDialogContent>
    </Dialog>
  );
};

export default MobileDayView;
