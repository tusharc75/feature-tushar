import { AccountCircle, AddCircleOutline, Map } from '@mui/icons-material';
import { Avatar, IconButton } from '@mui/material';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import { FiExternalLink } from 'react-icons/fi';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import routes from 'src/components/Helpers/Routes';
import { cn } from 'src/constants/helpers';
import useLocalStorage from 'src/hooks/useLocalStore';
import { TechnicianResource } from 'src/pages/TechnicianScheduler/useTechnicianResources';
import { techSchlocalStoreKey } from 'src/pages/TechnicianScheduler/Vis/DesktopTimeline';

import { Activity } from 'src/pages/TechnicianScheduler/Vis/types';
import { TimelineStore } from 'src/pages/TechnicianScheduler/Vis/useTimelineStore';
import { handleDragPreview, hasDateOverlap } from 'src/pages/TechnicianScheduler/Vis/utils';

const GroupTemplate = ({
  data,
  setStore,
  selectedResource
}: {
  data: Activity;
  setStore: (value: Partial<TimelineStore>) => void;
  selectedResource: TechnicianResource;
}) => {
  const [activeItemData] = useLocalStorage<{
    type: 'technician' | 'sidebar';
    data: any;
  } | null>(techSchlocalStoreKey); // to receive data in group template

  const { isBlocked, showColor } = useMemo(() => {
    if (activeItemData?.type !== 'sidebar') return { showColor: false, isBlocked: false };
    const { data: hoverdIemData } = activeItemData;
    const dataStartDate = dayjs(hoverdIemData?.service?.estimateStartDate || hoverdIemData?.estimateStartDate);
    const dataEndDate = dayjs(hoverdIemData?.service?.estimateEndDate || hoverdIemData?.estimateEndDate);
    const isBlocked = hasDateOverlap([...data?.technicianHistory, ...data?.technicianUnavailability], dataStartDate, dataEndDate);
    return { showColor: !!activeItemData, isBlocked };
  }, [activeItemData, data]);

  const textColorClass = showColor ? (isBlocked ? 'text-white' : 'text-white') : '';
  const bgColorClass = showColor ? (isBlocked ? 'bg-red-500' : 'bg-green-500') : '';

  function handleDragStart(event: React.DragEvent<HTMLDivElement>) {
    event.dataTransfer.effectAllowed = 'move';
    const newData = {
      id: data._id,
      data,
      from: 'technician'
    };
    setStore({ activeItemData: { data: data, type: 'technician' } });
    event.dataTransfer.setData('text/plain', JSON.stringify(newData));
    handleDragPreview(event, () => setStore({ activeItemData: null }));
  }

  return (
    <div
      className={cn(
        'technician-group pointer-events-auto flex w-full max-w-[299px] cursor-grab items-center !justify-between bg-[--dark-primary,white] px-4 py-2 transition-colors',
        textColorClass,
        bgColorClass
      )}
      onDragStart={handleDragStart}
      draggable
    >
      <div className="flex min-w-0 items-center gap-4">
        <Avatar sizes="small" style={{ height: 45, width: 45 }} alt="Remy Sharp" src={data?.photo}>
          <AccountCircle style={{ fontSize: 28 }} />
        </Avatar>
        <div>
          <div className="flex items-center gap-1">
            <p
              title={`${data?.firstName} ${data?.lastName}`}
              style={{ fontWeight: 'bolder', fontSize: '1rem' }}
              className="line-clamp-1 dark:text-white"
            >{`${data?.firstName} ${data?.lastName}`}</p>
            <a href={`${routes.employeeMasterDetail.path}/${data._id}`} target={'_blank'} rel="noreferrer">
              <FiExternalLink size={16} className={cn('align-baseline text-gray-500 dark:text-gray-300', textColorClass)} />
            </a>
          </div>
          <p className={cn('line-clamp-1 text-[0.8rem] text-gray-500', textColorClass)} title={`${data?.competencyType?.optionLabel || ''}`}>
            {`${data?.competencyType?.optionLabel || ''}`}
          </p>
          <p
            className={cn('line-clamp-1 text-[0.6rem] text-gray-500', textColorClass)}
            title={`${data?.competencies?.map((e) => e?.optionLabel)?.toString() || ''}`}
          >
            {`${data?.competencies?.map((e) => e?.optionLabel)?.toString() || ''}`}
          </p>
        </div>
      </div>
      <div className="flex-shrink-0">
        <HtmlTooltip title={`Assign ${selectedResource?.title}`}>
          <IconButton
            onClick={(event) => {
              event.stopPropagation();
              setStore({ assignServiceDialog: { open: true, data: data } });
            }}
            size="small"
          >
            <AddCircleOutline fontSize="small" className={cn('text-[--primary] dark:text-white', textColorClass)} />
          </IconButton>
        </HtmlTooltip>
        {data?.user?.optionValue && (
          <HtmlTooltip title="Map">
            <IconButton
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                setStore({ mapData: [data?.user?.optionValue] });
              }}
              color="primary"
            >
              <Map fontSize="small" className={cn('text-[--primary] dark:text-white', textColorClass)} />
            </IconButton>
          </HtmlTooltip>
        )}
      </div>
    </div>
  );
};

export default GroupTemplate;
