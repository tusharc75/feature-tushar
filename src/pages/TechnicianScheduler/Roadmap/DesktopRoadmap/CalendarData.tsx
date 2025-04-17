import { useDroppable } from '@dnd-kit/core';
import { CalendarMonth, DeleteOutline, Replay, Send } from '@mui/icons-material';
import { IconButton, Popover } from '@mui/material';
import dayjs from 'dayjs';
import { memo, useState } from 'react';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import RippleButton from 'src/components/RippleButton';
import { cn, CustomDialogTransition, displayDate, sidebarResource, TECHNICIAN_STATUS } from 'src/constants/helpers';
import { HandleSelect } from 'src/pages/TechnicianScheduler/Roadmap';
import { TActivity } from 'src/pages/TechnicianScheduler/Roadmap/types';
import { getColorFromPriority, getPositionOfDate, getPriority } from '../helperFunctions';
import { FiExternalLink } from 'react-icons/fi';
import routes from 'src/components/Helpers/Routes';
import { DispatchUser, ReceiveUser } from 'src/assets/svg/SvgElements';

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
            services={item?.technicianHistory || []}
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
        <div className="block min-w-0 max-w-full flex-grow p-2">
          <>
            <p className="mb-1 line-clamp-1 text-[13px] font-semibold leading-[16px]">{service?.reference?.optionLabel}</p>
            <p className="flex items-center gap-1 text-[10px] font-medium leading-[16px] text-[#777575] dark:text-gray-100">
              <CalendarMonth className="!h-[12px] !w-[12px]" /> {displayDate(service?.startDate)}-
              <span className="line-clamp-1 ">{displayDate(service?.endDate)}</span>
            </p>
            <div className="-ml-[2px] flex">
              {service?.referenceType === sidebarResource.fieldServiceOrder && [TECHNICIAN_STATUS.reserved, TECHNICIAN_STATUS.returned]?.includes(service?.status) && (
                <HtmlTooltip title="Dispatch">
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(null, service, 'dispatch');
                      handleClosePopup();
                    }}
                    size="small"
                    color="primary"
                  >
                    <DispatchUser />
                  </IconButton>
                </HtmlTooltip>
              )}
              {service?.referenceType === sidebarResource.fieldServiceOrder && service?.status === TECHNICIAN_STATUS.dispatched && (
                <HtmlTooltip title="Return">
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(null, service, 'return');
                      handleClosePopup();
                    }}
                    size="small"
                    color="primary"
                  >
                    <ReceiveUser />
                  </IconButton>
                </HtmlTooltip>
              )}
              {service?.status === TECHNICIAN_STATUS.reserved && (
                <HtmlTooltip title="Un-Assign">
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(null, { _id: service?._id }, 'un-assign');
                      handleClosePopup();
                    }}
                    size="small"
                    color="error"
                  >
                    <DeleteOutline fontSize="small" />
                  </IconButton>
                </HtmlTooltip>
              )}
            </div>
          </>
        </div>
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
          <div className="w-[260px] rounded-md bg-[--dark-primary,white] p-3 shadow-md">
            <div className="mb-1 flex items-center gap-1">
              <p className="line-clamp-1 text-[13px] font-semibold leading-[16px]">{service?.reference?.optionLabel}</p>
              <IconButton
                size="small"
                aria-label="Details"
                onClick={() => {
                  if (service?.referenceType === sidebarResource?.fieldServiceOrder) {
                    window.open(`${routes.fieldServiceOrderDetail.path}/${service?.reference?.optionValue}`);
                  } else if (service?.referenceType === sidebarResource?.fieldTicket) {
                    window.open(`${routes.fieldTicketDetail.path}/${service?.reference?.optionValue}`);
                  } else if (service?.referenceType === sidebarResource?.rentalManagement) {
                    window.open(`${routes.rentalManagementDetail.path}/${service?.reference?.optionValue}`);
                  }
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
            </div>
            {service?.serviceDetail?.serviceName && (
              <p className="{styles.chip} {styles[priority]} text-[12px] font-medium leading-[16px] text-[#777575]">
                Service : {service?.serviceDetail?.serviceName}
              </p>
            )}
            <p className="flex items-center gap-1 text-[12px] font-medium leading-[16px] text-[#777575] dark:text-gray-100">
              Customer : {service?.reference?.customerAccount?.optionLabel}
            </p>
            <p className="mt-1 flex items-center gap-1 text-[12px] font-medium leading-[16px] text-[#777575] dark:text-gray-100">
              <CalendarMonth className="!h-[12px] !w-[12px]" /> {displayDate(service?.startDate)}-
              <span className="line-clamp-1 ">{displayDate(service?.endDate)}</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {service?.referenceType === sidebarResource.fieldServiceOrder && service?.status === TECHNICIAN_STATUS.reserved && (
                <ThemeButton
                  buttonType="theme"
                  onClick={() => {
                    handleSelect(null, service, 'dispatch');
                    handleClosePopup();
                  }}
                >
                  Dispatch
                </ThemeButton>
              )}
              {service?.referenceType === sidebarResource.fieldServiceOrder && service?.status === TECHNICIAN_STATUS.dispatched && (
                <ThemeButton
                  buttonType="theme"
                  onClick={() => {
                    handleSelect(null, service, 'return');
                    handleClosePopup();
                  }}
                >
                  Return
                </ThemeButton>
              )}
              {service?.status === TECHNICIAN_STATUS.reserved && (
                <ThemeButton
                  onClick={() => {
                    handleSelect(null, { _id: service?._id }, 'un-assign');
                    handleClosePopup();
                  }}
                >
                  Un-Assign
                </ThemeButton>
              )}
            </div>
          </div>
        </div>
      </Popover>
    </>
  );
});
