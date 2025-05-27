import { CalendarMonth, DeleteOutline } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import { memo } from 'react';
import { FiExternalLink } from 'react-icons/fi';
import { RiArrowGoBackFill, RiUserShared2Fill } from 'react-icons/ri';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import routes from 'src/components/Helpers/Routes';
import TooltipPopover from 'src/components/TooltipPopover';
import { cn, displayDateTime, sidebarResource, TECHNICIAN_STATUS } from 'src/constants/helpers';
import { getColorFromPriority, getPriority } from '../utils';
import { TimelineStore } from 'src/pages/TechnicianScheduler/Vis/useTimelineStore';

export const ItemTemplate = memo(({ service, setStore }: { service: any; setStore: (value: Partial<TimelineStore>) => void }) => {
  const priority = getPriority(service.status || '');
  const bgColor = getColorFromPriority(priority);

  const handleSelect = (event: any, data: any, type: 'un-assign' | 'dispatch' | 'return') => {
    if (type === 'un-assign') {
      setStore({ unAssignTechnicianDialog: { open: true, id: service._id } });
    } else if (type === 'dispatch') {
      setStore({
        startEndDateConfirmationDialog: {
          open: true,
          type: 'start',
          referenceId: data?.referenceId,
          minDateTime: data?.end || null,
          notes: '',
          _id: data?._id
        }
      });
    } else if (type === 'return') {
      setStore({
        startEndDateConfirmationDialog: {
          open: true,
          type: 'stop',
          referenceId: data?.referenceId,
          minDateTime: data?.start,
          notes: data?.notes,
          _id: data?._id
        }
      });
    }
  };

  return (
    <>
      <TooltipPopover
        title={
          <div className="">
            {service?.itemType === 'technicianUnavailability' ? (
              <div className="w-[260px] rounded-md border bg-[--dark-primary,white] p-3 shadow-md">
                <p className="{styles.chip} {styles[priority]} text-[12px] font-medium leading-[16px] text-[#777575]">{service?.title}</p>
                {service?.reason && (
                  <p className="{styles.chip} {styles[priority]} text-[12px] font-medium leading-[16px] text-[#777575]">Reason : {service?.reason}</p>
                )}
                <p className="mt-1 flex items-center gap-1 text-[12px] font-medium leading-[16px] text-[#777575] dark:text-gray-100">
                  Start: <CalendarMonth className="!h-[12px] !w-[12px]" />
                  <span className="line-clamp-1 ">{displayDateTime(service?.start)}</span>
                </p>
                <p className="mt-1 flex items-center gap-1 text-[12px] font-medium leading-[16px] text-[#777575] dark:text-gray-100">
                  End: <CalendarMonth className="!h-[12px] !w-[12px]" />
                  <span className="line-clamp-1 ">{displayDateTime(service?.end)}</span>
                </p>
              </div>
            ) : (
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
                  Start: <CalendarMonth className="!h-[12px] !w-[12px]" />
                  <span className="line-clamp-1 ">{displayDateTime(service?.start)}</span>
                </p>
                <p className="mt-1 flex items-center gap-1 text-[12px] font-medium leading-[16px] text-[#777575] dark:text-gray-100">
                  End: <CalendarMonth className="!h-[12px] !w-[12px]" />
                  <span className="line-clamp-1 ">{displayDateTime(service?.end)}</span>
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {service?.referenceType === sidebarResource.fieldServiceOrder && service?.status === TECHNICIAN_STATUS.reserved && (
                    <ThemeButton
                      buttonType="theme"
                      onClick={() => {
                        handleSelect(null, service, 'dispatch');
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
                      }}
                    >
                      Return
                    </ThemeButton>
                  )}
                  {service?.status === TECHNICIAN_STATUS.reserved && (
                    <ThemeButton
                      onClick={() => {
                        handleSelect(null, { _id: service?._id }, 'un-assign');
                      }}
                    >
                      Un-Assign
                    </ThemeButton>
                  )}
                </div>
              </div>
            )}
          </div>
        }
      >
        <div
          key={service._id}
          className={cn(`singlePriority  flex w-full cursor-pointer rounded-md border bg-gray-100 text-left dark:bg-gray-900`, bgColor)}
        >
          <div className={cn('block min-w-0 max-w-full flex-grow overflow-hidden', service.overlapCount > 0 ? 'flex items-center pl-2' : 'p-2')}>
            <>
              <p className={cn('line-clamp-1 text-[13px] font-semibold leading-[16px]', service.overlapCount > 0 ? '' : 'mb-1')}>
                {service?.itemType === 'technicianUnavailability' ? (
                  <span style={{ color: 'white' }}>{`${service?.title}${service?.reason ? ` - ${service?.reason}` : ''}`}</span>
                ) : (
                  service?.reference?.optionLabel
                )}
              </p>
              {service?.itemType !== 'technicianUnavailability' && (
                <>
                  <p className="flex items-center gap-1 text-[10px] font-medium leading-[16px] text-[#777575] dark:text-gray-100">
                    <CalendarMonth className="!h-[12px] !w-[12px]" /> {displayDateTime(service?.start)}-
                    <span className="line-clamp-1 ">{displayDateTime(service?.end)}</span>
                  </p>
                  <div className="-ml-[2px] flex">
                    {service?.referenceType === sidebarResource.fieldServiceOrder &&
                      [TECHNICIAN_STATUS.reserved, TECHNICIAN_STATUS.returned]?.includes(service?.status) && (
                        <HtmlTooltip title="Dispatch">
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelect(null, service, 'dispatch');
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
        </div>
      </TooltipPopover>
    </>
  );
});
