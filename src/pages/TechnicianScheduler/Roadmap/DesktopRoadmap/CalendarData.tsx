import { useDroppable } from '@dnd-kit/core';
import { CalendarMonth, DeleteOutline } from '@mui/icons-material';
import { ClickAwayListener, IconButton } from '@mui/material';
import dayjs from 'dayjs';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { FiExternalLink } from 'react-icons/fi';
import { RiArrowGoBackFill, RiUserShared2Fill } from 'react-icons/ri';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import routes from 'src/components/Helpers/Routes';
import RippleButton from 'src/components/RippleButton';
import { cn, displayDate, sidebarResource, TECHNICIAN_STATUS } from 'src/constants/helpers';
import { HandleSelect } from 'src/pages/TechnicianScheduler/Roadmap';
import { TActivity } from 'src/pages/TechnicianScheduler/Roadmap/types';
import { addOverlapCount, getScrollContainer, isCollidingOnTop } from 'src/pages/TechnicianScheduler/Roadmap/utils';
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
  const newServices = useMemo(() => addOverlapCount(services), [services]);

  return (
    <>
      <div
        ref={setNodeRef}
        className={cn('relative h-[--data-h] border-b', isOver && active.data.current?.type === 'sidebar' ? 'bg-gray-100 dark:bg-gray-800' : '')}
      >
        {newServices?.map((service) => (
          <SingleService
            service={service}
            handleSelect={handleSelect}
            key={`${service._id}-${service.overlapCount}`}
            startDate={startDate}
            dayPixel={dayPixel}
          />
        ))}
      </div>
    </>
  );
});

const SingleService = memo(({ service, handleSelect, startDate, dayPixel }: any) => {
  const [isPopupOpened, setIsPopupOpened] = useState(false);
  const [isHoverPaused, setIsHoverPaused] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const scrollContainer = useRef<HTMLElement>(null);

  const priority = getPriority(service.status);
  const bgColor = getColorFromPriority(priority);
  service.startDate = service.startDate || service.estimateStartDate;
  service.endDate = service.endDate || service.estimateEndDate;
  const pos = getPositionOfDate(service.startDate, service.endDate, startDate, dayPixel);

  const handleMouseEnter = () => {
    if (!isPopupOpened) {
      setIsPopupOpened(true);
    }
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      if (isHoverPaused || !isPopupOpened) return;
      const target = e.currentTarget;
      if (!target) return;
      const rect = target?.getBoundingClientRect();
      const x = e.clientX;
      const relativeX = x - rect.left;
      if (!scrollContainer.current) {
        scrollContainer.current = getScrollContainer(e.currentTarget);
      }
      const isTopColliding = isCollidingOnTop(popupRef.current, scrollContainer.current, 50);

      requestAnimationFrame(() => {
        if (popupRef.current && !popupRef.current.contains(e.target as HTMLElement)) {
          const div = popupRef.current;
          const divRect = div.getBoundingClientRect();
          div.style.left = `${relativeX - divRect.width * 0.5}px`;
          if (isTopColliding) {
            div.style.bottom = '';
            div.style.top = '100%';
          }
        }
      });
    },
    [isPopupOpened, isHoverPaused]
  );

  const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    handleMouseEnter();
    handleMouseMove(e);
    setIsHoverPaused(true);
  };
  const handleClosePopup = () => {
    setIsPopupOpened(false);
    setIsHoverPaused(false);
  };
  const handleMouseLeve = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!isHoverPaused) {
      setIsPopupOpened(false);
    }
  };

  const height = 79 / ((service.overlapCount || 0) + 1);

  return (
    <>
      <div
        style={{ ...pos, height: `${height}px`, marginTop: service.overlapIndex > 0 ? `${(height + 1) * (service.overlapIndex || 0) + 5}px` : 5 }}
        className="absolute"
        onMouseLeave={handleMouseLeve}
      >
        <ClickAwayListener
          onClickAway={(e) => {
            if (!buttonRef.current.contains(e.target as HTMLElement)) {
              handleClosePopup();
            }
          }}
        >
          <div>
            <RippleButton
              ref={buttonRef}
              key={service._id}
              onClick={handleClick}
              onMouseEnter={handleMouseEnter}
              onMouseMove={handleMouseMove}
              // onMouseLeave={handleMouseLeve}
              style={{ height: `${height}px` }}
              className={cn(
                `singlePriority  flex w-full cursor-pointer rounded-md border bg-gray-100 text-left dark:bg-gray-900`,
                bgColor,
                isHoverPaused && isPopupOpened ? 'outline-2 outline-offset-0 outline-theme' : ''
              )}
            >
              <div
                className={cn('block min-w-0 max-w-full flex-grow overflow-hidden', service.overlapCount > 0 ? 'flex items-center pl-2' : 'p-2')}
                style={{ height }}
              >
                <>
                  <p className={cn('line-clamp-1 text-[13px] font-semibold leading-[16px]', service.overlapCount > 0 ? '' : 'mb-1')}>
                    {service?.reference?.optionLabel}
                  </p>
                  {service.overlapCount === 0 && (
                    <>
                      <p className="flex items-center gap-1 text-[10px] font-medium leading-[16px] text-[#777575] dark:text-gray-100">
                        <CalendarMonth className="!h-[12px] !w-[12px]" /> {displayDate(service?.startDate)}-
                        <span className="line-clamp-1 ">{displayDate(service?.endDate)}</span>
                      </p>
                      <div className="-ml-[2px] flex">
                        {service?.referenceType === sidebarResource.fieldServiceOrder &&
                          [TECHNICIAN_STATUS.reserved, TECHNICIAN_STATUS.returned]?.includes(service?.status) && (
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
                                <RiUserShared2Fill size={18} />
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
                              <RiArrowGoBackFill size={18} />
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
                  )}
                </>
              </div>
            </RippleButton>
            {isPopupOpened && (
              <div className="pointer-events-auto absolute bottom-full z-10" ref={popupRef}>
                <div className="w-[260px] rounded-md border bg-[--dark-primary,white] p-3 shadow-md">
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
            )}
          </div>
        </ClickAwayListener>
      </div>
    </>
  );
});
