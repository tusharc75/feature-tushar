import { AccountCircle, AddCircleOutline, Map } from '@mui/icons-material';
import { Avatar, IconButton, ListItem, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import { FiExternalLink } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import routes from 'src/components/Helpers/Routes';
import { cn } from 'src/constants/helpers';
import { TechnicianResource } from 'src/pages/TechnicianScheduler/useTechnicianResources';

import { Activity } from 'src/pages/TechnicianScheduler/Vis/types';
import { TimelineStore, useTimelineStore } from 'src/pages/TechnicianScheduler/Vis/useTimelineStore';
import { hasDateOverlap } from 'src/pages/TechnicianScheduler/Vis/utils';

const GroupTemplate = ({
  data,
  setStore,
  selectedResource,
  activeItemData
}: {
  data: Activity;
  setStore: (value: Partial<TimelineStore>) => void;
  selectedResource: TechnicianResource;
  activeItemData: {
    type: 'technician' | 'sidebar';
    data: any;
  };
}) => {
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

  return (
    <div
      className={cn(
        'flex  w-full max-w-[299px] cursor-grab items-center !justify-between border-b bg-[--dark-primary,white] px-4 py-2 transition-colors',
        textColorClass,
        bgColorClass
      )}
    >
      <div className="flex min-w-0 items-center gap-4">
        <Avatar sizes="small" style={{ height: 45, width: 45 }} alt="Remy Sharp" src={data?.photo}>
          <AccountCircle style={{ fontSize: 28 }} />
        </Avatar>
        <div>
          <div className="flex items-center gap-1">
            <Typography
              title={`${data?.firstName} ${data?.lastName}`}
              style={{ fontWeight: 'bolder', fontSize: '1rem' }}
              className="line-clamp-1"
            >{`${data?.firstName} ${data?.lastName}`}</Typography>
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
        {/* <HtmlTooltip title={`Assign ${selectedResource?.title}`}> */}
        <IconButton
          onClick={(event) => {
            event.stopPropagation();
            setStore({ assignServiceDialog: { open: true, data: data } });
          }}
          size="small"
          color="primary"
        >
          <AddCircleOutline fontSize="small" className={cn(textColorClass)} />
        </IconButton>
        {/* </HtmlTooltip> */}
        {/* {data?.user?.optionValue && (
          <HtmlTooltip title="Map">
            <IconButton
              color="primary"
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                setStore({ mapData: [data?.user?.optionValue] });
              }}
            >
              <Map fontSize="small" className={cn(textColorClass)} />
            </IconButton>
          </HtmlTooltip>
        )} */}
      </div>
    </div>
  );
};

export default GroupTemplate;
