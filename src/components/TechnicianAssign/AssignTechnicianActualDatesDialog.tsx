import { Dialog, Typography } from '@mui/material';
import { useCallback, useState } from 'react';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { CustomDialogTransition } from 'src/constants/helpers';
import CustomDateTimeRangePicker, { DateTimeRange, DateValidationError } from 'src/components/CustomDateTimeRangePicker';
import { isMobile, isTablet } from 'react-device-detect';

function AssignTechnicianActualDatesDialog({ handleAssign, handleClose, resourceData, isSubmitting }) {
  
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [dateTimeRanges, setDateTimeRanges] = useState<DateTimeRange[]>([
    {
      startDateTime: resourceData?.[0]?.estimateStartDate || null,
      endDateTime: resourceData?.[0]?.estimateEndDate || null
    }
  ]);
  const [validationErrors, setValidationErrors] = useState<DateValidationError[]>([]);

  const getTitle = useCallback(() => {
    return `${resourceData[0]?.fieldTicketNumber || resourceData[0]?.rentalJobName || resourceData[0]?.fieldServiceOrderNumber}`;
  }, [resourceData]);

  return (
    <Dialog open={true} fullWidth maxWidth="sm" TransitionComponent={CustomDialogTransition} fullScreen={fullScreen || isMobile || isTablet}>
      <CustomDialogHeader
        title={`Assign Technician(s) ${resourceData?.length > 1 ? '' : getTitle()}`}
        onClose={handleClose}
        showRequiredLabel={true}
        showManimizeMaximize={true}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
      />
      <CustomDialogContent>
        <Typography>{`Please enter the actual dates on technician(s) worked`}</Typography>
        <CustomDateTimeRangePicker
          value={dateTimeRanges}
          onChange={(value) => setDateTimeRanges(value as DateTimeRange[])}
          multipleRanges={true}
          startPlaceholder="Start Date & Time"
          endPlaceholder="End Date & Time"
          setValidationErrors={setValidationErrors}
        />
      </CustomDialogContent>
      <CustomDialogFooter>
        <ThemeButton buttonType="transparent" onClick={handleClose}>
          Close
        </ThemeButton>
        <ThemeButton
          isLoading={isSubmitting}
          buttonType="theme"
          onClick={() => {
            handleAssign(dateTimeRanges);
          }}
          disabled={isSubmitting || validationErrors?.length > 0}
        >
          Assign
        </ThemeButton>
      </CustomDialogFooter>
    </Dialog>
  );
}

export default AssignTechnicianActualDatesDialog;
