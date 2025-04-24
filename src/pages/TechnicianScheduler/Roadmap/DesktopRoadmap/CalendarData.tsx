import { useDroppable } from '@dnd-kit/core';
import { CalendarMonth, DeleteOutline } from '@mui/icons-material';
import { ClickAwayListener, IconButton } from '@mui/material';
import dayjs from 'dayjs';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { FiExternalLink } from 'react-icons/fi';
import { RiArrowGoBackFill, RiUserShared2Fill } from 'react-icons/ri';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import routes from 'src/components/Helpers/Routes';
import RippleButton from 'src/components/RippleButton';
import { cn, displayDate, sidebarResource, TECHNICIAN_STATUS } from 'src/constants/helpers';
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
  const [isPopupOpened, setIsPopupOpened] = useState(false);
  const isHoverPaused = useRef(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

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
      if (isHoverPaused.current || !isPopupOpened) return;
      const target = e.currentTarget;
      if (!target) return;
      const rect = target?.getBoundingClientRect();
      const x = e.clientX;
      const relativeX = x - rect.left;

      requestAnimationFrame(() => {
        if (popupRef.current && !popupRef.current.contains(e.target as HTMLElement)) {
          const div = popupRef.current;

          const divRect = div.getBoundingClientRect();
          div.style.left = `${relativeX - divRect.width * 0.5}px`;
        }
      });
      // setAnchorPosition({ left: x, top: rect.top + rect.height });
      // setAnchorPosition({ left: x, top: rect.top });
    },
    [isPopupOpened]
  );

  const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    handleMouseEnter();
    handleMouseMove(e);
    isHoverPaused.current = true;
  };
  const handleClosePopup = () => {
    setIsPopupOpened(false);
    isHoverPaused.current = false;
  };
  const handleMouseLeve = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!isHoverPaused.current) {
      setIsPopupOpened(false);
    }
  };

  return (
    <>
      <div style={{ ...pos }} className="absolute" onMouseLeave={handleMouseLeve}>
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
              className={cn(
                `singlePriority mt-[5px] flex h-[calc(var(--data-h)-10px)] w-full cursor-pointer  rounded-md border bg-gray-100/60 text-left dark:bg-gray-900/60`,
                bgColor,
                isPopupOpened ? 'border-2 border-theme' : ''
              )}
            >
              <div className="block min-w-0 max-w-full flex-grow overflow-hidden p-2">
                <>
                  <p className="mb-1 line-clamp-1 text-[13px] font-semibold leading-[16px]">{service?.reference?.optionLabel}</p>
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
              </div>
            </RippleButton>
            {isPopupOpened && (
              <div className="pointer-events-auto absolute bottom-full" ref={popupRef}>
                <div className="w-[260px] rounded-md bg-[--dark-primary,white] p-3 shadow-md ">
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
      {/* <Popover
        disableScrollLock
        open={Boolean(anchorPosition)}
        anchorReference="anchorPosition"
        anchorPosition={anchorPosition}
        onClose={handleClosePopup}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center'
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center'
        }}
        className="pointer-events-none"
        slotProps={{
          transition: CustomDialogTransition,
          backdrop: {
            className: 'pointer-events-none'
          }
        }}
      >
        <ClickAwayListener
          onClickAway={(e) => {
            if (!buttonRef.current.contains(e.target as HTMLElement)) {
              handleClosePopup();
            }
          }}
        >
          <div className="pointer-events-auto">
            <div className="w-[260px] rounded-md bg-[--dark-primary,white] p-3 shadow-md ">
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
        </ClickAwayListener>
      </Popover> */}
    </>
  );
});
