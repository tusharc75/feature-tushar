import { useCallback, useContext, useState } from 'react';
import SelectionConfirmationDialog from 'src/components/Helpers/SelectionConfirmationDialog';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import AssignTechnicianActualDatesDialog from './AssignTechnicianActualDatesDialog';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { TechnicianAssignProps } from './types';

const TechnicianAssign = ({ resourceData, handleClose, handleSuccess, technicians, resource }: TechnicianAssignProps) => {

  const [assignDialog, setAssignDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState({ open: false, message: '', dateTimeRanges: null });
  const toastConfig = useContext(CustomToastContext);

  const handleAssign = (skipDateValidation = false, dateTimeRanges = null) => {
    let data = [];

    resourceData?.map((ele: any) => {
      technicians?.map((technician) => {
        if (dateTimeRanges?.length > 0) {
          dateTimeRanges?.map((range) => {
            data.push({
              uniqueId: ele?.uniqueId,
              service: ele?.serviceId,
              technician: technician?._id,
              warehouse: ele?.warehouse,
              referenceId: ele?.resourceId,
              referenceType: resource?.resource,
              startDate: range?.startDateTime,
              endDate: range?.endDateTime
            });
          });
        } else {
          data.push({
            uniqueId: ele?.uniqueId,
            service: ele?.serviceId,
            technician: technician?._id,
            warehouse: ele?.warehouse,
            referenceId: ele?.resourceId,
            referenceType: resource?.resource,
            estimateStartDate: ele?.estimateStartDate,
            estimateEndDate: ele?.estimateEndDate
          });
        }
      });
    });

    setIsSubmitting(true);
    axiosInstance()
      .post(`/technician`, { technician: data, skipDateValidation })
      .then(() => {
        handleSuccess();
        setIsSubmitting(false);
        setShowConfirmBox({ open: false, message: '', dateTimeRanges: null });
      })
      .catch((error) => {
        if (skipDateValidation) {
          toastConfig.setToastConfig(error);
        } else {
          setShowConfirmBox({ open: true, message: error?.message, dateTimeRanges: dateTimeRanges });
        }
        setIsSubmitting(false);
      });
  };

  const assignMessage = useCallback(() => {
    const resourceName = resourceData?.length === 1 ? `${resource?.titleSingular}-${resourceData[0]?.resourceNumber}` : resource?.titlePlural;
    const technicianName = technicians?.length === 1 ? `${technicians[0]?.name}` : 'Technicians';
    return `Would you like to assign (${resourceName}) to ${technicianName} on the actual dates or the estimated dates? Please confirm your preference.`;
  }, [resourceData, technicians, resource]);

  return (
    <>
      {assignDialog && (
        <AssignTechnicianActualDatesDialog
          handleAssign={(dateTimeRanges) => {
            handleAssign(false, dateTimeRanges);
          }}
          handleClose={() => {
            setAssignDialog(false);
          }}
          resourceData={resourceData}
          isSubmitting={isSubmitting}
        />
      )}

      <SelectionConfirmationDialog
        open={true}
        message={assignMessage()}
        onOk={(type) => {
          if (type === 'Actual Dates') {
            setAssignDialog(true);
          } else {
            handleAssign();
          }
        }}
        onClose={handleClose}
        selection1={'Actual Dates'}
        selection2={'Estimate Dates'}
        okBtnLoading={isSubmitting}
      />
      {showConfirmBox?.open && (
        <ConfirmationDialog
          open={showConfirmBox.open}
          message={`${showConfirmBox?.message}. Do you still wish to proceed with this assignment?`}
          onClose={() => {
            setShowConfirmBox({ open: false, message: '', dateTimeRanges: null });
          }}
          onOk={() => {
            handleAssign(true, showConfirmBox?.dateTimeRanges);
          }}
          okBtnLoading={isSubmitting}
        />
      )}
    </>
  );
};

export default TechnicianAssign;
