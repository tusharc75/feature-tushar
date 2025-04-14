import { useDroppable } from '@dnd-kit/core';
import { CalendarMonth } from '@mui/icons-material';
import { Popover } from '@mui/material';
import dayjs from 'dayjs';
import { memo, useState } from 'react';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import RippleButton from 'src/components/RippleButton';
import { cn, CustomDialogTransition, displayDate } from 'src/constants/helpers';
import { HandleSelect } from 'src/pages/TechnicianScheduler/Roadmap';
import { TActivity } from 'src/pages/TechnicianScheduler/Roadmap/types';
import { getColorFromPriority, getPositionOfDate, getPriority } from '../helperFunctions';

type CalnedarDataProps = {
  activity: TActivity[];
  selected: string[] | [];
  handleSelect: HandleSelect;
  startDate: dayjs.Dayjs;
  dayPixel: number;
};

export default function CalendarData({ activity, handleSelect, startDate, dayPixel }: CalnedarDataProps) {
  return (
    <>
      {activity?.map((item, index) => {
        return (
          <Services
            index={index}
            item={item}
            key={item._id}
            services={item?.fieldTicket || []}
            handleSelect={handleSelect}
            startDate={startDate}
            dayPixel={dayPixel}
          />
        );
      })}
    </>
  );
}

const Services = memo(({ startDate, services, handleSelect, dayPixel, item, index }: any) => {
  const { setNodeRef, isOver, active } = useDroppable({
    id: item._id,
    data: {
      index: index,
      item,
      accepts: ['sidebar']
    }
  });

  return (
    <>
      <div
        ref={setNodeRef}
        className={cn('relative h-[--data-h] border-b', isOver && active.data.current?.type === 'sidebar' ? 'bg-gray-100 dark:bg-gray-800' : '')}
      >
        {services?.map((service) => (
          <SingleService service={service} handleSelect={handleSelect} key={service._id} startDate={startDate} dayPixel={dayPixel} />
        ))}
      </div>
    </>
  );
});

const SingleService = memo(({ service, handleSelect, startDate, dayPixel }: any) => {
  const [anchorPosition, setAnchorPosition] = useState<{ top: number; left: number } | null>(null);

  const handleUnAssign = () => {
    handleSelect(null, { _id: service?.technician, technicianHistoryId: service?._id }, '');
  };

  const priority = getPriority(service.status);
  const bgColor = getColorFromPriority(priority);
  service.startDate = service.startDate || service.estimateStartDate;
  service.endDate = service.endDate || service.estimateEndDate;
  const pos = getPositionOfDate(service.startDate, service.endDate, startDate, dayPixel);

  const handleOpenPopup = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = e.clientX;
    setAnchorPosition({ left: x, top: rect.top + rect.height });
  };
  const handleClosePopup = () => {
    setAnchorPosition(null);
  };

  return (
    <>
      <RippleButton
        style={{ ...pos }}
        key={service._id}
        onClick={handleOpenPopup}
        className={cn(
          `singlePriority absolute mt-[5px] flex h-[calc(var(--data-h)-10px)] cursor-pointer overflow-hidden rounded-md border bg-[--dark-primary,white] text-left`,
          bgColor,
          anchorPosition ? 'border-2 border-theme' : ''
        )}
      >
        <HtmlTooltip
          title={
            <div>
              <p>
                {service?.fieldTicket[0]?.fieldTicketNumber ||
                  service?.rentalJob[0]?.rentalJobName ||
                  service?.fieldServiceOrder[0]?.fieldServiceOrderNumber}
              </p>
              <p className="text-[12px]">
                {displayDate(service?.startDate)} - {displayDate(service?.endDate)}
              </p>
            </div>
          }
          placement="top"
          className="block min-w-0 max-w-full flex-grow p-2"
        >
          <>
            <p className="mb-2 break-all text-[13px] font-semibold leading-[16px]">
              {service?.fieldTicket[0]?.fieldTicketNumber ||
                service?.rentalJob[0]?.rentalJobName ||
                service?.fieldServiceOrder[0]?.fieldServiceOrderNumber}
            </p>
            <p className="{styles.chip} {styles[priority]} text-[10px] font-medium leading-[16px] text-[#777575]">
              {service?.serviceDetail?.serviceName}
            </p>
          </>
        </HtmlTooltip>
      </RippleButton>

      <Popover
        disableScrollLock
        open={Boolean(anchorPosition)}
        anchorReference="anchorPosition"
        anchorPosition={anchorPosition}
        onClose={handleClosePopup}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center'
        }}
        slotProps={{
          transition: CustomDialogTransition
        }}
      >
        <div>
          <div className="w-[250px] rounded-md bg-[--dark-primary,white] p-3 shadow-md">
            <p className="mb-2 line-clamp-1 text-[13px] font-semibold leading-[16px]">
              {service?.fieldTicket[0]?.fieldTicketNumber ||
                service?.rentalJob[0]?.rentalJobName ||
                service?.fieldServiceOrder[0]?.fieldServiceOrderNumber}
            </p>

            <p className="{styles.chip} {styles[priority]} text-[10px] font-medium leading-[16px] text-[#777575]">
              {service?.serviceDetail?.serviceName}
            </p>
            <p className="flex items-center gap-1 text-[10px] font-medium leading-[16px] text-[#777575] dark:text-gray-100">
              <CalendarMonth className="!h-[12px] !w-[12px]" /> {displayDate(service?.startDate)}-
              <span className="line-clamp-1 ">{displayDate(service?.endDate)}</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <ThemeButton>Dispach</ThemeButton>
              <ThemeButton>Return</ThemeButton>
              <ThemeButton onClick={() => handleUnAssign()}>Un-assign</ThemeButton>
            </div>
          </div>
        </div>
      </Popover>
    </>
  );
});
