import { Dialog, Typography } from '@mui/material';
import { useContext, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { CustomDialogTransition } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import CustomDateTimeRangePicker, { DateTimeRange, DateValidationError } from 'src/components/CustomDateTimeRangePicker';
import { isMobile, isTablet } from 'react-device-detect';

function AssignTechnicianActualDatesDialog({ technicianData, selectedResource, selectedServiceOrder, handleClose, handleSucess }) {

  const toastConfig = useContext(CustomToastContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState({ open: false, message: '' });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [dateTimeRanges, setDateTimeRanges] = useState<DateTimeRange[]>([
    {
      startDateTime: selectedServiceOrder?.[0]?.service?.estimateStartDate || selectedServiceOrder?.[0]?.estimateStartDate || null,
      endDateTime: selectedServiceOrder?.[0]?.service?.estimateEndDate || selectedServiceOrder?.[0]?.estimateEndDate || null
    }
  ]);
  const [validationErrors, setValidationErrors] = useState<DateValidationError[]>([]);

  const handleAssign = (skipDateValidation = false) => {
    let data = [];
    selectedServiceOrder?.map((ele) => {
      dateTimeRanges?.map((range) => {
        data.push({
          uniqueId: ele?.service?.uniqueId,
          service: ele?.serviceId,
          technician: technicianData?._id,
          warehouse: ele?.warehouse,
          referenceId: ele?.resourceId,
          referenceType: selectedResource?.resource,
          startDate: range?.startDateTime,
          endDate: range?.endDateTime
        });
      });
    });
    setIsSubmitting(true);
    axiosInstance()
      .post(`/technician`, { technician: data, skipDateValidation })
      .then(() => {
        handleSucess();
        setIsSubmitting(false);
        setShowConfirmBox({ open: false, message: '' });
      })
      .catch((error) => {
        if (skipDateValidation) {
          toastConfig.setToastConfig(error);
        } else {
          setShowConfirmBox({ open: true, message: error?.message });
        }
        setIsSubmitting(false);
      });
  };

  return (
    <Dialog open={true} fullWidth maxWidth="sm" TransitionComponent={CustomDialogTransition} fullScreen={fullScreen || isMobile || isTablet}>
      <CustomDialogHeader
        title={`Assign Technician ${selectedServiceOrder[0]?.service?.serviceName || ''} (${selectedServiceOrder[0]?.fieldTicketNumber || selectedServiceOrder[0]?.rentalJobName || selectedServiceOrder[0]?.fieldServiceOrderNumber})`}
        onClose={handleClose}
        showRequiredLabel={true}
        showManimizeMaximize={true}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
      />
      <CustomDialogContent>
        <Typography>Please enter the actual dates on technician worked</Typography>
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
            handleAssign();
          }}
          disabled={isSubmitting || validationErrors?.length > 0}
        >
          Assign
        </ThemeButton>
      </CustomDialogFooter>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox.open}
          message={`${showConfirmBox?.message}. Do you still wish to proceed with this assignment?`}
          onClose={() => {
            setShowConfirmBox({ open: false, message: '' });
          }}
          onOk={() => {
            handleAssign(true);
          }}
        />
      )}
    </Dialog>
  );
}

export default AssignTechnicianActualDatesDialog;
