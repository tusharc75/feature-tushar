import { CalendarMonth } from '@mui/icons-material';
import dayjs from 'dayjs';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { cn, displayDate } from 'src/constants/helpers';
import { HandleSelect } from 'src/pages/TechnicianScheduler/Roadmap';
import { TActivity } from 'src/pages/TechnicianScheduler/Roadmap/types';
import { getColorFromPriority, getPositionOfDate, getPriority } from '../helperFunctions';
import { useDroppable } from '@dnd-kit/core';

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
            startDate={startDate}
            services={item?.fieldTicket || []}
            handleSelect={handleSelect}
            dayPixel={dayPixel}
          />
        );
      })}
    </>
  );
}

const Services = ({ startDate, services, handleSelect, dayPixel, item, index }) => {
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
        {services?.map((service) => {
          const priority = getPriority(service.status);
          const bgColor = getColorFromPriority(priority);
          service.startDate = service.startDate || service.estimateStartDate;
          service.endDate = service.endDate || service.estimateEndDate;
          const pos = getPositionOfDate(service.startDate, service.endDate, startDate, dayPixel);

          return (
            <HtmlTooltip
              title={
                <div>
                  <p>{service?.fieldTicket[0]?.fieldTicketNumber || service?.rentalJob[0]?.rentalJobName || service?.fieldServiceOrder[0]?.fieldServiceOrderNumber}</p>
                  <p className="text-[12px]">
                    {displayDate(service?.startDate)} - {displayDate(service?.endDate)}
                  </p>
                </div>
              }
              className={cn(
                `singlePriority absolute mt-[5px] h-[calc(var(--data-h)-10px)] cursor-pointer overflow-hidden rounded-md border bg-[--dark-primary,white]`,
                bgColor
              )}
              style={{ ...pos }}
              key={service._id}
              placement="top"
            >
              <div
                onClick={() => {
                  handleSelect(null, { _id: service?.technician, technicianHistoryId: service?._id }, '');
                }}
                className="flex h-[--data-h] flex-col justify-center p-2"
              >
                <p className="mb-2 line-clamp-1 text-[13px] font-semibold leading-[16px]">
                  {service?.fieldTicket[0]?.fieldTicketNumber || service?.rentalJob[0]?.rentalJobName || service?.fieldServiceOrder[0]?.fieldServiceOrderNumber}
                </p>
                <p className="{styles.chip} {styles[priority]} text-[10px] font-medium leading-[16px] text-[#777575]">{service?.serviceDetail?.serviceName}</p>
                <p className="flex items-center gap-1 text-[10px] font-medium leading-[16px] text-[#777575] dark:text-gray-100">
                  <CalendarMonth className="!h-[12px] !w-[12px]" /> {displayDate(service?.startDate)}-
                  <span className="line-clamp-1 ">{displayDate(service?.endDate)}</span>
                </p>
              </div>
            </HtmlTooltip>
          );
        })}
      </div>
    </>
  );
};
