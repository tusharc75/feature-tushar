import axios, { CancelToken } from 'axios';
import { forwardRef, memo, useContext, useEffect, useImperativeHandle, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { useTableReducer } from 'src/components/CustomReactTable';
import { cn } from 'src/constants/helpers';
import { TechnicianResource } from 'src/pages/TechnicianScheduler/useTechnicianResources';
import TechnicianList from 'src/pages/TechnicianScheduler/Vis/ServiceOrderSidebar/TechnicianList';
import { useTimelineStore } from 'src/pages/TechnicianScheduler/Vis/useTimelineStore';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
// import AssignTechnicianDialog from '../../Roadmap/AssignTechnicianDialogWithDateTime';

type ServiceOrderSidebarProps = {
  selectedResource: TechnicianResource;
  isMobile: boolean;
  viewType: 'job' | 'service';
  fetchRoadmap: () => void;
};

const renderedFrom = `service_order_technician`;

export type ServiceOrderSidebarRef = {
  fetchServiceData: (selectedResource: TechnicianResource, leftSearchValue?: string) => void;
};

const ServiceOrderSidebarImpl = forwardRef<ServiceOrderSidebarRef, ServiceOrderSidebarProps>(
  ({ selectedResource, isMobile, viewType, fetchRoadmap }, ref) => {
    const [leftSearchValue] = useTimelineStore((state) => state.leftSearchValue);

    const toastConfig = useContext(CustomToastContext);
    const { state, dispatch } = useTableReducer({ renderedFrom });
    const [container, setContainer] = useState<HTMLDivElement>(null);

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

    useImperativeHandle(ref, () => {
      return {
        fetchServiceData: (selectedResource, leftSearchValue) => {
          fetchData(selectedResource, leftSearchValue);
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedResource, leftSearchValue]);

    useEffect(() => {
      const cancelToken = axios.CancelToken.source();
      if (selectedResource) {
        fetchData(selectedResource, leftSearchValue, cancelToken.token);
      }
      return () => {
        cancelToken.cancel();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedResource, leftSearchValue, viewType]);

    return (
      <>
        <div
          className={cn(isMobile ? 'h-[240px]' : 'h-full', 'max-w-full')}
          ref={(div) => {
            setContainer(div);
          }}
        >
          <TechnicianList isMobile={isMobile} selectedResource={selectedResource} container={container} state={state} viewType={viewType} />
        </div>
      </>
    );
  }
);

const ServiceOrderSidebar = memo(ServiceOrderSidebarImpl) as typeof ServiceOrderSidebarImpl;

export default ServiceOrderSidebar;
