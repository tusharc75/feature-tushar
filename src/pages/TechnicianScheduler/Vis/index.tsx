import { AddOutlined, FormatListBulleted, Refresh } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import dayjs from 'dayjs';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { FiSidebar } from 'react-icons/fi';
import axiosInstance from 'src/axios/axiosInstance';
import ButtonMenu from 'src/components/ButtonMenu';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import IconButtonTabs from 'src/components/IconButtonTabs';
import { cn, sidebarResource } from 'src/constants/helpers';

import { useTechnicianResources } from 'src/pages/TechnicianScheduler/useTechnicianResources';
import DesktopTimeline from 'src/pages/TechnicianScheduler/Vis/DesktopTimeline';
import Dialogs from 'src/pages/TechnicianScheduler/Vis/Dialogs';
import ServiceOrderSidebar, { ServiceOrderSidebarRef } from 'src/pages/TechnicianScheduler/Vis/ServiceOrderSidebar';
import DesktopWrapper from 'src/pages/TechnicianScheduler/Vis/ServiceOrderSidebar/DesktopWrapper';
import { Activity, Service } from 'src/pages/TechnicianScheduler/Vis/types';
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
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [timelineData, setTimelineData] = useState<{ groups: DataSet<any, 'id'> | null; items: DataSet<any, 'id'> | null }>({
    groups: null,
    items: null
  });

  const onDragEnd = ({ service, technician }: { service: Service; technician: Activity }) => {
    setStore({ assignTechnicianDialog: { open: true, service, technicianData: [technician] } });
  };

  const fetchRoadmap = useCallback(async () => {
    if (!selectedResource?.resource) return;
    setLoading(true);
    await axiosInstance()
      .get<{ data: Activity[] }>(`/technician-scheduler/get-schedule?resource=${selectedResource?.resource}`)
      .then(({ data: { data } }) => {
        let itemList = [];
        let groupList = [];

        for (const item of data) {
          const group: DataGroup = {
            ...item,
            id: item._id,
            content: `${item.firstName} ${item.lastName}`,
            visible: true
          };
          for (const technician of item.technicianHistory) {
            let start = technician.estimateStartDate;
            let end = technician.estimateEndDate;
            if (start === end) {
              start = dayjs(start).tz().startOf('day').toDate();
              end = dayjs(end).tz().endOf('day').toDate();
            }
            const singleItem: DataItem & { itemType: string; status: string } = {
              ...technician,
              id: technician._id,
              group: item._id,
              status: technician.status,
              content: technician?.reference?.optionLabel,
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
            const singleItem: DataItem & { itemType: string; status: string } = {
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
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedResource?.resource]);

  useEffect(() => {
    fetchRoadmap();
  }, [fetchRoadmap]);

  const handleRefreshAll = () => {
    fetchRoadmap();
    serviceOrderSidebarRef.current?.fetchServiceData(selectedResource);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconButton size={'small'} onClick={() => setIsSidebarOpen((prev) => !prev)}>
            <FiSidebar />
          </IconButton>
          <ButtonMenu
            showChevron={true}
            getLabel={(d) => d.title}
            items={technicianResources}
            getSelectedMenuItem={(item) => item.key === selectedResource.key}
            onItemClick={(e, item) => {
              setStore({ selectedResource: item });
            }}
          >
            <span className="flex items-center gap-2 [&_svg]:text-[18px]">{selectedResource?.title}</span>
          </ButtonMenu>
        </div>
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
      <div className={cn('mt-4 flex h-[calc(100vh-200px)] min-h-[500px]')}>
        <div className={cn('overflow-hidden transition-all duration-300', isSidebarOpen ? 'w-[314px]' : 'w-0')}>
          <DesktopWrapper setIsSidebarOpen={setIsSidebarOpen}>
            <ServiceOrderSidebar
              ref={serviceOrderSidebarRef}
              selectedResource={selectedResource}
              fetchRoadmap={fetchRoadmap}
              isMobile={false}
              viewType={viewType}
            />
          </DesktopWrapper>
        </div>
        <div className="ml-[-1px] flex flex-grow">
          <DesktopTimeline onDragEnd={onDragEnd} loading={loading} key={selectedResource?.key || 'timeline'} timelineData={timelineData} />
        </div>
      </div>

      <Dialogs createDialog={createDialog} setCreateDialog={setCreateDialog} viewType={viewType} refreshAllData={handleRefreshAll} />
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
