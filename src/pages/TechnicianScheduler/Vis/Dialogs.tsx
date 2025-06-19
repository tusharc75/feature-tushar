import React, { useContext, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { useTimelineStore } from 'src/pages/TechnicianScheduler/Vis/useTimelineStore';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import StartStopDateDialog from 'src/pages/FieldTicket/material/StartStopDateDialog';
import ServiceAssignDialog from 'src/pages/TechnicianScheduler/Vis/ServiceAssignDialog';
import ManageServiceOrderDialog from 'src/pages/FieldServiceOrder/ManageServiceOrder';
import ManageFieldTicket from 'src/pages/FieldTicket/ManageFieldTicket';
import ManageRentalManagementDialog from 'src/pages/RentalManagement/ManageRental';
import { sidebarResource } from 'src/constants/helpers';
import ConfirmationDialogRaw from 'src/components/Helpers/ConfirmationDialog';
import TechnicianAssign from 'src/components/TechnicianAssign';
import AssignEmployeeDialog from 'src/components/AssignRolesDialog/AssignEmployeeDialog';
import { isArray, isObject } from 'lodash';

const Dialogs = ({
  viewType,
  createDialog,
  setCreateDialog,
  refreshAllData
}: {
  viewType: 'service' | 'job';
  createDialog: boolean;
  setCreateDialog: React.Dispatch<React.SetStateAction<boolean>>;
  refreshAllData: () => void;
}) => {
  const toastConfig = useContext(CustomToastContext);
  const [isSubmittingStartEnd, setIsSubmittingStartEnd] = useState(false);
  const [isUnAssignSubmitting, setIsUnAssignSubmitting] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const [unAssignTechnicianDialog] = useTimelineStore((store) => store.unAssignTechnicianDialog);
  const [assignServiceDialog, setStore] = useTimelineStore((store) => store.assignServiceDialog);
  const [assignTechnicianDialog] = useTimelineStore((store) => store.assignTechnicianDialog);
  const [startEndDateConfirmationDialog] = useTimelineStore((store) => store.startEndDateConfirmationDialog);
  const [openTechnicianDialog] = useTimelineStore((store) => store.openTechnicianDialog);
  const [selectedResource] = useTimelineStore((store) => store.selectedResource);

  const handleUpdateStartEndDate = (values: any) => {
    let value: any = {
      type: startEndDateConfirmationDialog.type,
      referenceId: startEndDateConfirmationDialog.referenceId,
      referenceType: selectedResource?.resource,
      _id: [startEndDateConfirmationDialog._id]
    };
    if (startEndDateConfirmationDialog.type !== 'stop') {
      value.startDate = values?.startDate;
    } else {
      value.endDate = values?.endDate;
    }
    if (values?.notes) value.notes = values?.notes;
    setIsSubmittingStartEnd(true);
    axiosInstance()
      .put(`/technician/start-end-date`, value)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
        setStore({ startEndDateConfirmationDialog: { open: false, type: null, referenceId: null, minDateTime: null, notes: '', _id: null } });
        setIsSubmittingStartEnd(false);
        refreshAllData();
      })
      .catch((error) => {
        setIsSubmittingStartEnd(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleUnAssign = () => {
    setIsUnAssignSubmitting(true);
    axiosInstance()
      .put(`/technician`, { ids: [unAssignTechnicianDialog?.id] })
      .then(() => {
        setStore({ unAssignTechnicianDialog: { id: null, open: false } });
        setIsUnAssignSubmitting(false);
        refreshAllData();
      })
      .catch((error) => {
        setIsUnAssignSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleAssign = (technicians: any, resourceData: any) => {
    const technician: any = [];
    technicians.forEach((d) => {
      const element: any = {};
      element.technician = d?._id;
      element.uniqueId = resourceData?._id;
      element.service = resourceData?.service?._id;
      element.warehouse = resourceData?.warehouse;
      element.referenceId = resourceData?.resourceId;
      element.referenceType = selectedResource?.resource;
      element.estimateStartDate = resourceData?.service?.estimateStartDate || resourceData?.estimateStartDate;
      element.estimateEndDate = resourceData?.service?.estimateEndDate || resourceData?.estimateEndDate;
      technician.push(element);
    });
    setIsAssigning(true);
    axiosInstance()
      .post(`/technician`, { technician: technician })
      .then(() => {
        refreshAllData();
        setStore({ openTechnicianDialog: { open: false, data: null } });
        setIsAssigning(false);
      })
      .catch((error) => {
        setIsAssigning(false);
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <>
      {createDialog && selectedResource?.resource === sidebarResource.fieldServiceOrder && (
        <ManageServiceOrderDialog
          isClone={false}
          serviceOrderId={null}
          onClose={() => setCreateDialog(false)}
          onSuccess={() => setCreateDialog(false)}
          open={createDialog}
          isRedirectTodetailPage={false}
        />
      )}
      {createDialog && selectedResource?.resource === sidebarResource.fieldTicket && (
        <ManageFieldTicket
          id={null}
          isClone={false}
          onClose={() => setCreateDialog(false)}
          onSuccess={() => setCreateDialog(false)}
          isRedirectTodetailPage={false}
        />
      )}
      {createDialog && selectedResource?.resource === sidebarResource.rentalManagement && (
        <ManageRentalManagementDialog
          isClone={false}
          open={createDialog}
          rentalManagementId={null}
          onClose={() => setCreateDialog(false)}
          onSuccess={() => setCreateDialog(false)}
          isAutomated={true}
        />
      )}

      {startEndDateConfirmationDialog.open && (
        <StartStopDateDialog
          type={startEndDateConfirmationDialog.type}
          resource={selectedResource.resource}
          onClose={() => {
            setStore({ startEndDateConfirmationDialog: { open: false, type: null, referenceId: null, minDateTime: null, notes: '', _id: null } });
          }}
          handleSubmit={(value) => {
            handleUpdateStartEndDate(value);
          }}
          loading={isSubmittingStartEnd}
          minStartDateTime={startEndDateConfirmationDialog.minDateTime}
          notes={startEndDateConfirmationDialog.notes}
        />
      )}
      {assignTechnicianDialog.open && (
        <>
          <TechnicianAssign
            resource={{
              resource: selectedResource?.resource,
              titleSingular: selectedResource?.titleSingular,
              titlePlural: selectedResource?.title
            }}
            technicians={assignTechnicianDialog?.technicianData?.map?.((d) => ({ _id: d?._id, name: d?.firstName + ' ' + d?.lastName }))}
            resourceData={[assignTechnicianDialog?.service] as any}
            handleSuccess={() => {
              refreshAllData();
              setStore({
                assignServiceDialog: { open: false, data: null },
                assignTechnicianDialog: { open: false, service: null, technicianData: null },
                unAssignTechnicianDialog: { open: false, id: null }
              });
            }}
            handleClose={() => {
              setStore({
                assignServiceDialog: { open: false, data: null },
                assignTechnicianDialog: { open: false, service: null, technicianData: null },
                unAssignTechnicianDialog: { open: false, id: null }
              });
            }}
          />
        </>
      )}
      {assignServiceDialog.open && (
        <ServiceAssignDialog
          handleClose={() => {
            setStore({ assignServiceDialog: { open: false, data: null } });
          }}
          selectedResource={selectedResource}
          handleAdd={(resourceData) => {
            setStore({ assignTechnicianDialog: { open: true, technicianData: [assignServiceDialog.data], service: resourceData } });
          }}
          viewType={viewType}
        />
      )}

      {openTechnicianDialog.open && (
        <AssignEmployeeDialog
          onSuccess={(data) => {
            handleAssign(data, openTechnicianDialog.data);
          }}
          handleClose={() => {
            setStore({ openTechnicianDialog: { data: null, open: false } });
          }}
          defaultCompetencyType={
            openTechnicianDialog?.data?.service?.competencyType
              ? isObject(openTechnicianDialog?.data?.service?.competencyType)
                ? [openTechnicianDialog?.data?.service?.competencyType]
                : isArray(openTechnicianDialog?.data?.service?.competencyType)
                  ? openTechnicianDialog?.data?.service?.competencyType
                  : []
              : []
          }
          warehouse={openTechnicianDialog.data?.warehouse}
          ids={[]}
          isSubmitting={isAssigning}
        />
      )}
      {unAssignTechnicianDialog.open && (
        <ConfirmationDialogRaw
          open={true}
          message={`Are you sure you want to un-assign technician ?`}
          okBtnLoading={isUnAssignSubmitting}
          onClose={() => {
            setStore({ unAssignTechnicianDialog: { id: null, open: false } });
          }}
          onOk={handleUnAssign}
        />
      )}
    </>
  );
};

export default Dialogs;
