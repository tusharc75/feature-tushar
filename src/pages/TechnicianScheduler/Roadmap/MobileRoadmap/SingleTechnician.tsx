import { useDroppable } from '@dnd-kit/core';
import { AccountCircle, CalendarMonth, ExpandLess, ExpandMore, Map } from '@mui/icons-material';
import { Avatar, Collapse, IconButton, ListItemButton, Typography } from '@mui/material';
import { memo } from 'react';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { cn, displayDate } from 'src/constants/helpers';
import { HandleSelect } from 'src/pages/TechnicianScheduler/Roadmap';
import MapImpl from 'src/pages/TechnicianScheduler/Roadmap/DesktopRoadmap/MapImpl';
import { useRoadMapStore } from 'src/pages/TechnicianScheduler/Store';
import { getColorFromPriority, getPriority } from '../helperFunctions';
import type { TActivity } from '../types';

const SingleMobileTechnician = memo(({ handleMapClick, item, index, handleChange, compareCollapse, handleSelect }: any) => {
  const { setNodeRef, isOver, active } = useDroppable({
    id: item._id,
    data: {
      index: index,
      item,
      accepts: ['sidebar']
    }
  });

  return (
    <li
      className={cn('list-none border-b', isOver && active.data.current?.type === 'sidebar' ? 'bg-gray-100 dark:bg-gray-800' : '')}
      ref={setNodeRef}
    >
      <ListItemButton className="flex h-[--data-h] items-center !justify-between px-4 ">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar sizes="small" style={{ height: 45, width: 45 }} alt="Remy Sharp" src={item?.photo}>
            <AccountCircle style={{ fontSize: 28 }} />
          </Avatar>
          <div className="">
            <Typography style={{ fontWeight: 'bolder', fontSize: '1rem' }}>{`${item?.firstName} ${item?.lastName}`}</Typography>
            <p className="line-clamp-1 text-[0.8rem] text-gray-500" title={`${item?.competencyType?.optionLabel || ''}`}>
              {`${item?.competencyType?.optionLabel || ''}`}
            </p>
            <p className="line-clamp-1 text-[0.6rem] text-gray-500" title={`${item?.competencies?.map((e) => e?.optionLabel)?.toString() || ''}`}>
              {`${item?.competencies?.map((e) => e?.optionLabel)?.toString() || ''}`}
            </p>
          </div>
        </div>
        <div className="flex flex-shrink-0">
          <IconButton
            onClick={(event) => {
              event.stopPropagation();

              handleMapClick(index, item);
            }}
          >
            <Map fontSize="medium" />
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleChange(`${index}`);
            }}
          >
            {compareCollapse(index) ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </div>
      </ListItemButton>
      <CalendarData services={item?.technicianHistory || []} handleSelect={handleSelect} compareCollapse={compareCollapse} index={index} />
    </li>
  );
});

export default SingleMobileTechnician;

type CalendarDataProps = {
  handleSelect: HandleSelect;
  services: TActivity['technicianHistory'];
  compareCollapse: (index: number | string) => boolean;
  index: number;
};

const CalendarData = memo(({ services, handleSelect, compareCollapse, index }: CalendarDataProps) => {
  const [mapData] = useRoadMapStore((state) => state.mapData);

  if (mapData)
    return (
      <Collapse in={compareCollapse(index)} unmountOnExit>
        <MapImpl className="relative min-h-[400px] w-full overflow-auto px-2" />
      </Collapse>
    );
  return (
    <Collapse in={compareCollapse(index)} unmountOnExit>
      <ul className="space-y-2 border-t p-4">
        {(!services || !services.length) && <p className=" text-center text-sm">No Data found</p>}
        {services?.map((service) => {
          const priority = getPriority(service.status);
          const bgColor = getColorFromPriority(priority);
          return (
            <li className="list-none">
              <HtmlTooltip
                title={
                  <div>
                    <p>{service?.reference?.optionLabel}</p>
                    <p className="text-[12px]">
                      {displayDate(service?.startDate)} - {displayDate(service?.endDate)}
                    </p>
                  </div>
                }
                className={cn(`block h-[--data-h] cursor-pointer overflow-hidden rounded-md border bg-[--dark-primary,white]`, bgColor)}
                key={service._id}
              >
                <div
                  onClick={() => {
                    handleSelect(null, { _id: service?._id }, 'un-assign');
                  }}
                  className="flex h-[--data-h] flex-col justify-center p-[14px]"
                >
                  <p className="mb-2 line-clamp-1 text-[13px] font-semibold leading-[16px]">{service?.reference?.optionLabel}</p>
                  <p className="flex items-center gap-1 text-[10px] font-medium leading-[16px] text-[#777575] dark:text-gray-100">
                    <CalendarMonth className="!h-[12px] !w-[12px]" /> {displayDate(service?.startDate)}-
                    <span className="line-clamp-1 ">{displayDate(service?.endDate)}</span>
                  </p>
                  <p className="{styles.chip} {styles[priority]} text-[10px] font-medium leading-[16px] text-[#777575]">{service.status}</p>
                </div>
              </HtmlTooltip>
            </li>
          );
        })}
      </ul>
    </Collapse>
  );
});
