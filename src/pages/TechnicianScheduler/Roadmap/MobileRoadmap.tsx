import { AccountCircle, CalendarMonth, Close, ExpandLess, ExpandMore, Map } from '@mui/icons-material';
import { Avatar, Collapse, IconButton, ListItemButton, Skeleton, Typography } from '@mui/material';
import React, { useCallback, useState } from 'react';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { cn, displayDate } from 'src/constants/helpers';
import MapView from '../Map';
import { getColorFromPriority, getPriority } from './helperFunctions';
import type { TActivity } from './types';
import { useDroppable } from '@dnd-kit/core';

type TProps = {
  activity: TActivity[];
  expanded: any;
  selected: string[] | [];
  handleToggle: any;
  handleSelect: any;
  loading: boolean;
  setSelected: React.Dispatch<React.SetStateAction<string[]>>;
  leftSidebar: (isMobile: Boolean) => React.ReactNode;
};

const COLLAPSIBLE_UNIQUE_NAME = '_fieldTicketInvoice';

const MobileRoadmap: React.FC<TProps> = ({ activity, expanded, selected, handleToggle, handleSelect, loading, setSelected, leftSidebar }) => {
  const [open, setOpen] = useState<string | false>(false);

  const handleChange = useCallback((index: string | number) => {
    const newIndex = `${index}${COLLAPSIBLE_UNIQUE_NAME}`;
    setOpen((prev) => (!prev ? newIndex : prev === newIndex ? false : newIndex));
  }, []);

  const compareCollapse = useCallback(
    (index: number | string) => {
      const newIndex = `${index}${COLLAPSIBLE_UNIQUE_NAME}`;
      return open === newIndex;
    },
    [open]
  );

  const handleMapClick = useCallback(
    (index: number, item: any) => {
      const newIndex = `${index}${COLLAPSIBLE_UNIQUE_NAME}`;
      handleSelect('', item, 'map');
      setOpen(newIndex);
    },
    [handleSelect]
  );

  return (
    <>
      {leftSidebar(true)}
      <div className="max-h-[600px] overflow-auto border border-[var(--common-border-color)]">
        <div className="sticky top-0 z-[2] flex items-center gap-2 border-b bg-[--dark-secondary,white] p-4">
          <Map />
          <Typography variant="body1" display="block">
            Technician
          </Typography>
        </div>
        {!loading ? (
          <ul>
            {activity?.map((item, index) => {
              return (
                <SingleMobileTechnician
                  compareCollapse={compareCollapse}
                  handleChange={handleChange}
                  handleMapClick={handleMapClick}
                  handleSelect={handleSelect}
                  index={index}
                  item={item}
                  selected={selected}
                  setSelected={setSelected}
                  key={item._id}
                />
              );
            })}
          </ul>
        ) : (
          <ul>
            {[...Array(9).keys()].map((item, index) => {
              return (
                <li className="list-none border-b">
                  <ListItemButton className="flex h-[--data-h] items-center !justify-between px-4 ">
                    <div className="flex min-w-0 flex-grow items-center gap-4">
                      <Skeleton width={'45px'} variant="circular" height={'45px'} sx={{ flexShrink: 0 }} />
                      <div className="w-full">
                        <Typography style={{ fontWeight: 'bolder', fontSize: '1rem' }}>
                          <Skeleton />
                        </Typography>
                        <p className="line-clamp-1 text-[0.8rem] text-gray-500">
                          <Skeleton />
                        </p>
                        <p className="line-clamp-1 text-[0.6rem] text-gray-500">
                          <Skeleton />
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-shrink-0">
                      <IconButton>
                        <Map fontSize="medium" />
                      </IconButton>
                    </div>
                  </ListItemButton>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
};

export default MobileRoadmap;

const SingleMobileTechnician = ({ handleMapClick, item, index, setSelected, selected, handleChange, compareCollapse, handleSelect }) => {
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
              setSelected(null);
              handleChange(`${index}`);
            }}
          >
            {compareCollapse(index) ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </div>
      </ListItemButton>

      <Collapse in={compareCollapse(index)}>
        <CalendarData services={item?.fieldTicket || []} handleSelect={handleSelect} selected={selected} setSelected={setSelected} />
      </Collapse>
    </li>
  );
};

const CalendarData = ({ services, handleSelect, selected, setSelected }) => {
  if (selected)
    return (
      <div className="relative min-h-[400px] w-full overflow-auto p-2">
        <MapView userIds={selected} />
        <IconButton
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setSelected(null);
          }}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            zIndex: 1
          }}
        >
          <Close />
        </IconButton>
      </div>
    );
  return (
    <div>
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
                    <p> {service?.fieldTicket[0]?.fieldTicketNumber || service?.rentalJob[0]?.rentalJobName || service?.fieldServiceOrder[0]?.fieldServiceOrderNumber}</p>
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
                    handleSelect(null, { _id: service?.technician, technicianHistoryId: service?._id }, '');
                  }}
                  className="flex h-[--data-h] flex-col justify-center p-[14px]"
                >
                  <p className="mb-2 line-clamp-1 text-[13px] font-semibold leading-[16px]">
                    {service?.fieldTicket[0]?.fieldTicketNumber || service?.rentalJob[0]?.rentalJobName || service?.fieldServiceOrder[0]?.fieldServiceOrderNumber}
                  </p>
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
    </div>
  );
};
