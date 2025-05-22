import axios, { CancelToken } from 'axios';
import { memo, useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { useTableReducer } from 'src/components/CustomReactTable';
import ConfirmationDialogRaw from 'src/components/Helpers/ConfirmationDialog';
import { cn } from 'src/constants/helpers';
import TechnicianList from 'src/pages/TechnicianScheduler/ServiceOrderSidebar/TechnicianList';
import { TechnicianResource } from 'src/pages/TechnicianScheduler/useTechnicianResources';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import AssignEmployeeDialog from 'src/components/AssignRolesDialog/AssignEmployeeDialog';
import { isArray, isObject } from 'lodash';
import { useRoadMapStore } from 'src/pages/TechnicianScheduler/Store';
import AssignTechnicianDialog from 'src/components/TechnicianAssign';

type ServiceOrderSidebarProps = {
  selectedResource: TechnicianResource;
  assignTechnicianDialog: { open: boolean; technicians: any; services: any };
  unAssignTechnicianDialog: DialogData;
  handleSuccess: () => void;
  handleClose: () => void;
  setSelectedRecords: React.Dispatch<React.SetStateAction<any[]>>;
  isMobile: boolean;
  refreshServiceData: boolean;
  viewType: string;
  setAssignTechnicianDialogData: React.Dispatch<React.SetStateAction<{ open: boolean; technicians: any; services: any }>>;
};
type DialogData = {
  open: boolean;
  data: any;
};

const renderedFrom = `service_order_technician`;

const ServiceOrderSidebarImpl = ({
  selectedResource,
  assignTechnicianDialog,
  handleClose,
  handleSuccess,
  setSelectedRecords,
  isMobile,
  unAssignTechnicianDialog,
  refreshServiceData,
  viewType,
  setAssignTechnicianDialogData
}: ServiceOrderSidebarProps) => {
  const toastConfig = useContext(CustomToastContext);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [container, setContainer] = useState<HTMLDivElement>(null);
  const [openTechnicianDialog, setOpenTechnicianDialog] = useState({ open: false, data: null });
  const [leftSearchValue] = useRoadMapStore((state) => state.leftSearchValue);

  const fetchData = (selectedResource: TechnicianResource, search?: string, cancelToken?: CancelToken) => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    let api = `/technician-scheduler/un-assign-service?type=${selectedResource.resource}`;
    api += `&serviceWise=${viewType === 'job' ? 0 : 1}`;
    if (search) {
      api += `&search=${encodeURIComponent(search)}`;
    }
    axiosInstance()
      .get(api, { cancelToken })
      .then(({ data: { data } }) => {
        const rows: any = [];
        data?.forEach((ele, index) => {
          const obj: any = { ...ele };
          obj.index = index + 1;
          obj._id = ele?.service?.uniqueId || ele._id;
          obj.resourceId = ele._id;
          obj.warehouse = ele?.warehouse?.optionValue;
          obj.fieldServiceOrder = ele?.fieldServiceOrder?.optionLabel;
          obj.fieldServiceOrderId = ele?.fieldServiceOrder?.optionValue;
          obj.serviceName = ele?.service?.serviceName;
          obj.serviceId = ele?.service?._id;
          obj.competencyType = ele?.service?.competencyType?.optionLabel;
          obj.competencies = ele?.service?.competencies?.map((e) => e?.optionLabel)?.toString();
          obj.service = ele?.service;
          obj.customerAccount = ele?.customerAccount?.optionLabel;
          obj.customerAccountId = ele?.customerAccount?.optionValue;
          obj.estimateStartDate = ele?.service?.estimateStartDate || ele?.estimateStartDate;
          obj.estimateEndDate = ele?.service?.estimateEndDate || ele?.estimateEndDate;
          obj.resourceNumber = ele?.fieldTicketNumber || ele?.fieldServiceOrderNumber || ele?.rentalJobName;
          rows.push(obj);
        });
        dispatch({ type: 'initialize', data: rows, count: rows?.length });
        dispatch({ type: 'loading', loading: false });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleUnAssign = () => {
    setIsSubmitting(true);
    axiosInstance()
      .put(`/technician`, { ids: [unAssignTechnicianDialog?.data?._id] })
      .then(() => {
        fetchData(selectedResource);
        handleSuccess();
        setIsSubmitting(false);
      })
      .catch((error) => {
        setIsSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  };

  useEffect(() => {
    const cancelToken = axios.CancelToken.source();
    if (selectedResource) {
      fetchData(selectedResource, leftSearchValue, cancelToken.token);
    }
    return () => {
      cancelToken.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedResource, refreshServiceData, leftSearchValue, viewType]);

  return (
    <>
      <div
        className={cn(isMobile ? 'h-[240px]' : 'h-full', 'max-w-full')}
        ref={(div) => {
          setContainer(div);
        }}
      >
        <TechnicianList
          isMobile={isMobile}
          selectedResource={selectedResource}
          container={container}
          dispatch={dispatch}
          setSelectedRecords={setSelectedRecords}
          state={state}
          viewType={viewType}
          setOpenTechnicianDialog={setOpenTechnicianDialog}
        />
      </div>
      {assignTechnicianDialog.open && (
        <AssignTechnicianDialog
          selectedResource={selectedResource}
          technicians={assignTechnicianDialog?.technicians}
          resourceData={assignTechnicianDialog?.services}
          handleSuccess={() => {
            fetchData(selectedResource);
            handleSuccess();
            setOpenTechnicianDialog({ open: false, data: null });
          }}
          handleClose={() => {
            handleClose();
          }}
        />
      )}
      {openTechnicianDialog.open && (
        <AssignEmployeeDialog
          onSuccess={(data) => {
            setAssignTechnicianDialogData({ open: true, technicians: data, services: [openTechnicianDialog.data] });
          }}
          handleClose={() => {
            setOpenTechnicianDialog({ open: false, data: null });
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
          isSubmitting={isSubmitting}
        />
      )}
      {unAssignTechnicianDialog.open && (
        <ConfirmationDialogRaw
          open={true}
          message={`Are you sure you want to un-assign technician ?`}
          okBtnLoading={isSubmitting}
          onClose={handleClose}
          onOk={handleUnAssign}
        />
      )}
    </>
  );
};

const ServiceOrderSidebar = memo(ServiceOrderSidebarImpl) as typeof ServiceOrderSidebarImpl;

export default ServiceOrderSidebar;
