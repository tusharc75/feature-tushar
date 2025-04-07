import axios, { CancelToken } from 'axios';
import { memo, useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { useTableReducer } from 'src/components/CustomReactTable';
import ConfirmationDialogRaw from 'src/components/Helpers/ConfirmationDialog';
import { cn, fieldServiceOrder, fieldTicket, rentalManagement } from 'src/constants/helpers';
import TechnicianList from 'src/pages/TechnicianScheduler/ServiceOrderSidebar/TechnicianList';
import { TechnicianResource } from 'src/pages/TechnicianScheduler/useTechnicianResources';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import AssignTechnicianDialog from '../Roadmap/AssignTechnicianDialog';
import AssignEmployeeDialog from 'src/components/AssignRolesDialog/AssignEmployeeDialog';

type ServiceOrderSidebarProps = {
  selectedResource: TechnicianResource;
  assignTechnicianDialog: { open: boolean; technicianData: any; service: any };
  unAssignTechnicianDialog: DialogData;
  handleSucess: () => void;
  handleClose: () => void;
  setSelectedRecords: React.Dispatch<React.SetStateAction<any[]>>;
  setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
  isMobile: boolean;
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
  handleSucess,
  setSelectedRecords,
  setRefresh,
  isMobile,
  unAssignTechnicianDialog
}: ServiceOrderSidebarProps) => {
  const toastConfig = useContext(CustomToastContext);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [container, setContainer] = useState<HTMLDivElement>(null);
  const [openTechnicianDialog, setOpenTechnicianDialog] = useState({ open: false, data: null });

  const fetchData = (selectedResource: TechnicianResource, cancelToken?: CancelToken) => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });

    axiosInstance()
      .get(`/technician-scheduler/un-assign-service?type=${selectedResource.resource}`, { cancelToken })
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

  const handleAssign = (technicians, resourceData) => {
    const technician: any = [];
    technicians.forEach((d) => {
      const element: any = {};
      element.technician = d?._id;
      element.uniqueId = resourceData?._id;
      element.service = resourceData?.service?._id;
      element.warehouse = resourceData?.warehouse;
      if (selectedResource?.key === 'fieldTicket') {
        element.fieldTicket = resourceData?.resourceId;
        element.estimateStartDate = resourceData?.service?.estimateStartDate;
        element.estimateEndDate = resourceData?.service?.estimateEndDate;
      } else if (selectedResource?.key === 'rentalJob') {
        element.rentalJob = resourceData?.resourceId;
        element.estimateStartDate = resourceData?.estimateStartDate;
        element.estimateEndDate = resourceData?.estimateEndDate;
      } else {
        element.fieldServiceOrder = resourceData?.resourceId;
        element.estimateStartDate = resourceData?.estimateStartDate;
        element.estimateEndDate = resourceData?.estimateEndDate;
      }
      technician.push(element);
    });
    const baseApi =
      selectedResource?.key === 'fieldTicket'
        ? fieldTicket.api
        : selectedResource?.key === 'rentalJob'
          ? rentalManagement.api
          : selectedResource?.key === 'fieldServiceOrder'
            ? fieldServiceOrder.api
            : '';
    setIsSubmitting(true);
    axiosInstance()
      .post(`${baseApi}/technician`, { technician: technician })
      .then(() => {
        handleSucess();
        setOpenTechnicianDialog({ open: false, data: null });
        setIsSubmitting(false);
      })
      .catch((error) => {
        setIsSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleUnAssign = () => {
    setIsSubmitting(true);
    axiosInstance()
      .put(`${rentalManagement.api}/technician`, { ids: [{ id: unAssignTechnicianDialog?.data?.technicianHistoryId }] })
      .then(() => {
        fetchData(selectedResource);
        handleSucess();
        setIsSubmitting(false);
        setRefresh((prev) => !prev);
      })
      .catch((error) => {
        setIsSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  };

  useEffect(() => {
    const cancelToken = axios.CancelToken.source();
    if (selectedResource) {
      fetchData(selectedResource, cancelToken.token);
    }
    return () => {
      cancelToken.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedResource]);

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
          setOpenTechnicianDialog={setOpenTechnicianDialog}
        />
      </div>
      {assignTechnicianDialog.open && (
        <AssignTechnicianDialog
          technicianData={assignTechnicianDialog.technicianData}
          selectedServiceOrder={[assignTechnicianDialog.service]}
          handleSucess={() => {
            fetchData(selectedResource);
            handleSucess();
          }}
          handleClose={() => {
            handleClose();
          }}
        />
      )}
      {openTechnicianDialog.open && (
        <AssignEmployeeDialog
          reference={selectedResource.key}
          onSuccess={(data) => {
            handleAssign(data, openTechnicianDialog.data);
          }}
          handleClose={() => {
            setOpenTechnicianDialog({ open: false, data: null });
          }}
          defaultCompetency={openTechnicianDialog?.data?.service?.competencyType ? [openTechnicianDialog?.data?.service?.competencyType] : []}
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
