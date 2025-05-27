import { AddOutlined, FormatListBulleted, Refresh } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import dayjs from 'dayjs';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import ButtonMenu from 'src/components/ButtonMenu';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import IconButtonTabs from 'src/components/IconButtonTabs';
import { sidebarResource } from 'src/constants/helpers';
import ManageServiceOrderDialog from 'src/pages/FieldServiceOrder/ManageServiceOrder';
import ManageFieldTicket from 'src/pages/FieldTicket/ManageFieldTicket';
import ManageRentalManagementDialog from 'src/pages/RentalManagement/ManageRental';
import { useTechnicianResources } from 'src/pages/TechnicianScheduler/useTechnicianResources';
import DesktopTimeline from 'src/pages/TechnicianScheduler/Vis/DesktopTimeline';
import ServiceOrderSidebar, { ServiceOrderSidebarRef } from 'src/pages/TechnicianScheduler/Vis/ServiceOrderSidebar';
import { Activity } from 'src/pages/TechnicianScheduler/Vis/types';
import { TimlineProvider, useTimelineStore } from 'src/pages/TechnicianScheduler/Vis/useTimelineStore';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { DataGroup, DataItem, DataSet } from 'vis-timeline/standalone';

const TimelineElementImpl = () => {
  const toastConfig = useContext(CustomToastContext);
  const serviceOrderSidebarRef = useRef<ServiceOrderSidebarRef>(null);
  const [viewType, setViewType] = useState<'job' | 'service'>('job');
  const [selectedResource, setStore] = useTimelineStore((store) => store.selectedResource);
  const [createDialog, setCreateDialog] = useState(false);
  const technicianResources = useTechnicianResources(toastConfig, (resource) => setStore({ selectedResource: resource }));

  const [timelineData, setTimelineData] = useState<{ groups: DataSet<any, 'id'> | null; items: DataSet<any, 'id'> | null }>({
    groups: null,
    items: null
  });

  const fetchRoadmap = useCallback(async () => {
    await axiosInstance()
      .get<{ data: Activity[] }>(`/technician-scheduler/get-schedule?resource=${selectedResource.resource}`)
      .then(({ data: { data } }) => {
        let itemList = [];
        let groupList = [];

        for (const item of data) {
          const group: DataGroup = {
            ...item,
            id: item._id,
            content: `${item.firstName} ${item.lastName}`
          };
          for (const technician of item.technicianHistory) {
            let start = technician.estimateStartDate;
            let end = technician.estimateEndDate;
            if (start === end) {
              start = dayjs(start).tz().startOf('day').toDate();
              end = dayjs(end).tz().endOf('day').toDate();
            }
            const singleItem: DataItem & { itemType: string } = {
              ...technician,
              id: technician._id,
              group: item._id,
              content: technician?.reference?.optionLabel,
              status: '',
              start,
              end,
              itemType: technician.type || 'technicianHistory',
              type: undefined
            };
            itemList.push(singleItem);
          }
          for (const technician of item.technicianUnavailability) {
            let start = technician.startDate;
            let end = technician.endDate;
            if (start === end) {
              start = dayjs(start).tz().startOf('day').toDate();
              end = dayjs(end).tz().endOf('day').toDate();
            }
            const singleItem: DataItem & { itemType: string } = {
              ...technician,
              id: technician._id,
              group: item._id,
              content: `${technician?.title}${technician?.reason ? ` - ${technician?.reason}` : ''}`,
              status: 'UnAvailable',
              start,
              end,
              itemType: 'technicianUnavailability',
              type: undefined
            };
            itemList.push(singleItem);
          }
          groupList.push(group);
        }

        const groups = new DataSet(groupList);
        const items = new DataSet(itemList);
        setTimelineData({ groups, items });
      });
  }, [selectedResource?.resource]);

  useEffect(() => {
    fetchRoadmap();
  }, [fetchRoadmap]);

  const handleRefreshAll = () => {
    fetchRoadmap();
    serviceOrderSidebarRef.current?.fetchServiceData();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <ButtonMenu
          showChevron={true}
          getLabel={(d) => d.title}
          items={technicianResources}
          getSelectedMenuItem={(item) => item.key === selectedResource.key}
          onItemClick={(e, item) => {
            setSelectedReSource(item);
          }}
        >
          <span className="flex items-center gap-2 [&_svg]:text-[18px]">{selectedResource?.title}</span>
        </ButtonMenu>
        <div className="flex gap-2">
          <ThemeButton
            buttonType="theme"
            id={'add-button'}
            onClick={(e) => {
              setCreateDialog(true);
            }}
            startIcon={<AddOutlined />}
            mobileTooltip="Create"
            iconForMobile={<AddOutlined />}
          >
            Create
          </ThemeButton>
          <IconButtonTabs
            items={
              [
                {
                  value: 'job',
                  icon: <FormatListBulleted />,
                  tooltip: 'Job View'
                },
                {
                  value: 'service',
                  icon: <FormatListBulleted />,
                  tooltip: 'Service View'
                }
              ] as const
            }
            setValue={setViewType}
            value={viewType}
          />
          <HtmlTooltip title={'Refresh'}>
            <IconButton size="small" onClick={handleRefreshAll}>
              <Refresh fontSize="small" color="primary" />
            </IconButton>
          </HtmlTooltip>
        </div>
      </div>
      <div className="mt-4 grid h-[calc(100vh-200px)] min-h-[500px] grid-cols-[1fr_300px]">
        <DesktopTimeline key={selectedResource?.key || 'timeline'} timelineData={timelineData} />
        <ServiceOrderSidebar
          ref={serviceOrderSidebarRef}
          selectedResource={selectedResource}
          fetchRoadmap={fetchRoadmap}
          isMobile={false}
          viewType={viewType}
        />
      </div>

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
    </div>
  );
};

const TimelineElement = () => (
  <TimlineProvider>
    <TimelineElementImpl />
  </TimlineProvider>
);
export default TimelineElement;

// template: function (item, element, data) {
//   return ReactDOM.render(<b>{item.content}</b>, element);
// },
