import axios, { CancelToken } from 'axios';
import { memo, useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import ConfirmationDialogRaw from 'src/components/Helpers/ConfirmationDialog';
import { TechnicianResource } from 'src/pages/TechnicianScheduler/useTechnicianResources';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import AssignTechnicianDialog from '../Roadmap/AssignTechnicianDialog';
import { useTableReducer } from 'src/components/CustomReactTable';
import { rentalManagement } from 'src/constants/helpers';
import TechnicianList from 'src/pages/TechnicianScheduler/ServiceOrderSidebar/TechnicianList';

type ServiceOrderSidebarProps = {
  selectedResource: TechnicianResource;
  assignTechnicianDialog: { open: boolean; technicianData: any; service: any };
  unAssignTechnicianDialog: DialogData;
  handleSucess: () => void;
  handleClose: () => void;
  setSelectedRecords: React.Dispatch<React.SetStateAction<any[]>>;
  setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
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
  unAssignTechnicianDialog
}: ServiceOrderSidebarProps) => {
  const toastConfig = useContext(CustomToastContext);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [container, setContainer] = useState<HTMLDivElement>(null);

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
          obj.estimateStartDate = ele?.service?.estimateStartDate;
          obj.estimateEndDate = ele?.service?.estimateEndDate;
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

  const removeAddedData = (selectedServiceOrder: any[]) => {
    const type = selectedServiceOrder[0]?.fieldTicketNumber
      ? 'fieldTicket'
      : selectedServiceOrder[0]?.rentalJobName
        ? 'rentalJob'
        : selectedServiceOrder[0]?.fieldServiceOrderNumber
          ? 'fieldServiceOrder'
          : '';

    if (['fieldTicket', 'rentalJob'].includes(type)) {
      const newData = [...(state.dataRows || [])].filter((f) => {
        const selectedIds = selectedServiceOrder.map((d) => d._id);
        if (selectedIds.includes(f._id)) {
          return false;
        }
        return true;
      });
      dispatch({ type: 'update', data: newData });
    }
  };

  const handleUnAssign = () => {
    setIsSubmitting(true);
    axiosInstance()
      .put(`${rentalManagement.api}/technician`, { ids: [{ id: unAssignTechnicianDialog?.data?.technicianHistoryId }] })
      .then(() => {
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
      <div className="h-full " ref={setContainer}>
        <TechnicianList
          selectedResource={selectedResource}
          container={container}
          dispatch={dispatch}
          setSelectedRecords={setSelectedRecords}
          state={state}
        />
      </div>
      {assignTechnicianDialog.open && (
        <AssignTechnicianDialog
          technicianData={assignTechnicianDialog.technicianData}
          selectedServiceOrder={[assignTechnicianDialog.service]}
          handleSucess={(selectedServiceOrders) => {
            removeAddedData(selectedServiceOrders);
            handleSucess();
          }}
          handleClose={() => {
            handleClose();
          }}
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
