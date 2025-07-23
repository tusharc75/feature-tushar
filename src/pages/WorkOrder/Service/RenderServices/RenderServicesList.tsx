import { FormatQuote, Message, MoreHoriz, People } from '@mui/icons-material';
import ApartmentIcon from '@mui/icons-material/Apartment';
import { Chip, IconButton } from '@mui/material';
import { PostWorkIcon, PreWorkIcon } from 'src/assets/svg/svgIcons';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { cn, getChipColor } from 'src/constants/helpers';
import { RenderStatusIcon } from '../index';
import RenderTotalTime from './RenderTotalTime';

const RenderServicesList = ({
  serviceSteps,
  isColapsed,
  stylesForEveryTab,
  selectedService,
  stepSubmitedData,
  setSelectedService,
  user,
  handleOpenMenu,
  resource,
  quotationData,
  allowedToEdit,
  setShowConfirmBox,
  getFieldsWithOtherDetails,
  isMobile,
  completed
}) => {
  if (!serviceSteps || serviceSteps?.length === 0) {
    return (
      <div
        className={cn(
          '-z-[1] flex h-full min-h-[200px] items-center justify-center rounded-md border',
          isColapsed && 'opacity-0',
          isMobile ? 'w-full' : 'flex-grow',
          isColapsed && 'hidden'
        )}
      >
        <p className="select-none text-[18px] text-gray-500">No services added yet</p>
      </div>
    );
  }
  return (
    <>
      {serviceSteps?.map((data, index) => {
        const style = stylesForEveryTab(selectedService, data, index);
        const stepTimes = getFieldsWithOtherDetails(data, stepSubmitedData);

        return (
          <div
            key={data.uniqueId}
            className={`transition-all duration-300 ${
              isMobile ? 'rounded-md p-2' : 'px-3 py-[14px] first-of-type:[border-radius:5px_5px_0_0] last-of-type:[border-radius:0_0_5px_5px]'
            } min-w-[var(--tab-size)] max-w-[var(--tab-size)]`}
            style={{
              ...style
            }}
            onClick={() => {
              if (data?.type === 'service') {
                setSelectedService(data);
              }
            }}
          >
            <div className="mb-1 flex items-center gap-2">
              <HtmlTooltip
                enterTouchDelay={0}
                placement="top"
                className={isColapsed ? 'mx-auto' : ''}
                arrow
                title={isMobile ? data?.serviceName : ''}
              >
                {data?.type === 'service' ? (
                  <div
                    className={`flex h-[20px] w-[20px] flex-shrink-0 items-center justify-center rounded-full bg-[var(--dark-secondary,_var(--primary))] text-center text-[10px] text-white transition-all duration-300`}
                  >
                    <span>{data?.order}</span>
                  </div>
                ) : (
                  data?.type === 'quotation' && <FormatQuote style={{ maxWidth: '20px', marginRight: '-10px' }} />
                )}
              </HtmlTooltip>

              <div className={`relative flex items-center gap-2 ${isColapsed ? 'hidden' : ''}`}>
                <HtmlTooltip enterTouchDelay={0} placement="top" arrow title={isMobile ? data?.serviceName : ''}>
                  <h6 className="line-clamp-1 min-w-0 text-[16px] font-semibold">{data?.serviceName}</h6>
                </HtmlTooltip>
                {user?.brandPolicy?.servicePrePost && data?.type === 'service' && (
                  <>
                    {data?.preWork ? (
                      <HtmlTooltip enterTouchDelay={0} title="Pre Work Service" arrow placement="top">
                        <span>
                          <PreWorkIcon style={{ verticalAlign: 'middle' }} />
                        </span>
                      </HtmlTooltip>
                    ) : (
                      <HtmlTooltip enterTouchDelay={0} title="Post Work Service" arrow>
                        <span>
                          <PostWorkIcon style={{ verticalAlign: 'middle' }} />
                        </span>
                      </HtmlTooltip>
                    )}
                  </>
                )}
                {data?.type === 'service' && data?.assignedUsers?.length > 0 && (
                  <HtmlTooltip title={data?.assignedUsers?.map((e) => e?.optionLabel)?.toString()}>
                    <People fontSize="small" />
                  </HtmlTooltip>
                )}
                {data?.type === 'service' && data?.assignedWorkStations?.length > 0 && (
                  <HtmlTooltip title={`Work Stations-${data?.assignedWorkStations?.map((e) => e?.optionLabel)?.toString()}`}>
                    <ApartmentIcon fontSize="small" />
                  </HtmlTooltip>
                )}
                {data?.comment && (
                  <HtmlTooltip title={data?.comment}>
                    <span>
                      <Message style={{ fontSize: 18 }} />
                    </span>
                  </HtmlTooltip>
                )}
              </div>

              {!isColapsed && (
                <>
                  {data?.type === 'service' && (
                    <div className="flex flex-grow items-center justify-end gap-1">
                      <HtmlTooltip title="Actions">
                        <IconButton
                          size="small"
                          color="primary"
                          aria-label="menu"
                          onClick={(event) => {
                            handleOpenMenu(event);
                            setSelectedService(data);
                          }}
                        >
                          <MoreHoriz />
                        </IconButton>
                      </HtmlTooltip>
                    </div>
                  )}
                </>
              )}
            </div>
            {/* Chips */}
            <div className={`flex w-full basis-full flex-wrap items-center gap-2 pl-[20px] ${isColapsed ? 'hidden' : ''}`}>
              {data?.type === 'service' && (
                <div className="ml-1">
                  <Chip
                    label={data?.status}
                    variant="outlined"
                    style={{
                      ...getChipColor(data?.status),
                      fontWeight: 700
                    }}
                  />
                </div>
              )}
              {data?.type === 'quotation' && quotationData && (
                <div className="ml-1">
                  <Chip label={`Status : ${quotationData?.status}`} variant="outlined" color="primary" />
                </div>
              )}

              {user?.brandPolicy?.workOrderTimer && <RenderTotalTime stepTimes={stepTimes} />}
              {/* PassFail */}
              <div className="ml-auto max-w-fit">
                {data?.type === 'service' && data?.serviceStatus && (
                  <RenderStatusIcon
                    className={`${isMobile ? 'h-[20px] max-w-[20px]' : 'h-[24px] max-w-[24px]'} mt-[3px] flex-shrink-0`}
                    stepStatus={data?.serviceStatus}
                  />
                )}
                {data?.type === 'quotation' && quotationData && (
                  <RenderStatusIcon
                    className={`${isMobile ? 'h-[20px] max-w-[20px]' : 'h-[24px] max-w-[24px]'} mt-[3px] flex-shrink-0`}
                    stepStatus={quotationData?.status}
                  />
                )}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
};

export default RenderServicesList;
