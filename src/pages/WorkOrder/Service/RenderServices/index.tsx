import { Chip, IconButton } from '@material-ui/core';
import { ArrowBackIos, ArrowForwardIos, DeleteOutline, FormatQuote, Message, MoreHoriz, People } from '@material-ui/icons';
import React, { useEffect } from 'react';
import { PostWorkIcon, PreWorkIcon, WorkStations } from 'src/assets/svg/svgIcons';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { ButtonType, ThemeButton } from 'src/components/Helpers/Buttons';
import { WORKORDER_SERVICE_STATUS, getChipColor, sidebarResource } from 'src/constants/helpers';
import { RenderStatusIcon } from '../index';
import RenderTotalTime from './RenderTotalTime';
import useTab from './useTab';

export type ServicesButtons = { visible: boolean; id: string | number } & ButtonType;

type RenderServiceProps = {
  isColapsed: boolean;
  serviceSteps: any;
  stylesForEveryTab: (selectedService: any, data: any, index: number) => React.CSSProperties;
  selectedService: any;
  handleColapse: () => void;
  stepSubmitedData: any;
  setSelectedService: any;
  user: any;
  handleOpenMenu: (event: React.MouseEvent<HTMLElement>) => void;
  resource: any;
  quotationData: any;
  allowedToEdit: boolean;
  setShowConfirmBox: (data: boolean) => void;
  servicesButtons: ServicesButtons[];
  isMobile: boolean;

  initialTabIndex: number;
};

const RenderService = ({
  isColapsed,
  serviceSteps,
  stylesForEveryTab,
  selectedService,
  handleColapse,
  stepSubmitedData,
  setSelectedService,
  user,
  handleOpenMenu,
  resource,
  quotationData,
  allowedToEdit,
  setShowConfirmBox,
  servicesButtons,
  isMobile,

  initialTabIndex = 0
}: RenderServiceProps) => {
  const getFieldsWithOtherDetails = (step: any, stepSubmitedData) => {
    const steps = stepSubmitedData?.filter((item: any) => item?.uniqueId === step?.uniqueId);
    const stepTimes = [];
    steps.forEach((item) => {
      let obj: any = {};
      obj.startDate = item?.startDate;
      obj.endDate = item?.endDate;
      obj.pauseDate = item?.pauseDate;
      obj.duration = item?.duration || 0;
      obj.status = item?.status;
      stepTimes.push(obj);
    });
    return stepTimes;
  };

  const { containerRef, handleNextClick, handlePrevClick, hasNextTab, hasPrevTab } = useTab({
    active: isMobile,
    totlaTabs: serviceSteps?.length || 0,
    activeTabIndex: initialTabIndex,
    gap: 8,
    onTabChange: handleTabChange
  });

  function handleTabChange(index: number) {
    const data = serviceSteps[index];
    if (data?.type === 'service') {
      setSelectedService(data);
    }
  }

  return (
    <>
      <div className={`${isMobile ? 'p-4' : 'container-with-border p-[20px]'}`}>
        {isMobile ? (
          <>
            <div className="grid grid-cols-[30px_1fr_30px] items-center gap-[8px] min-h-[74px]">
              <IconButton disabled={!hasPrevTab} className={`${!hasPrevTab ? 'opacity-0' : 'opacity-100'}`} onClick={handlePrevClick} size="small">
                <ArrowBackIos />
              </IconButton>
              <div className={`flex overflow-x-auto overflow-y-hidden gap-[8px]`} ref={containerRef}>
                {serviceSteps?.map((data, index) => {
                  return (
                    <RenderSingleService
                      key={data.uniqueId}
                      {...{
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
                        data,
                        index,
                        isMobile
                      }}
                    />
                  );
                })}
              </div>
              <IconButton disabled={!hasNextTab} className={`${!hasNextTab ? 'opacity-0' : 'opacity-100'}`} onClick={handleNextClick} size="small">
                <ArrowForwardIos />
              </IconButton>
            </div>

            <div className={`gap-2 flex flex-wrap ${isColapsed ? 'justify-around' : 'justify-end'} mt-3`}>
              {servicesButtons.map(({ id, children, visible, ...rest }) => {
                if (!visible) return null;
                return (
                  <ThemeButton key={id} {...rest} className={isColapsed ? 'hidden' : ''}>
                    {children}
                  </ThemeButton>
                );
              })}
              {isMobile || (
                <IconButton size={'small'} onClick={handleColapse}>
                  {isColapsed ? <ArrowForwardIos /> : <ArrowBackIos />}
                </IconButton>
              )}
            </div>
          </>
        ) : (
          <>
            <div className={`mb-1 gap-2 flex flex-wrap ${isColapsed ? 'justify-around' : 'justify-end'} mb-3`}>
              {servicesButtons.map(({ id, children, visible, ...rest }) => {
                if (!visible) return null;
                return (
                  <ThemeButton key={id} {...rest} className={isColapsed ? 'hidden' : ''}>
                    {children}
                  </ThemeButton>
                );
              })}
              {isMobile || (
                <IconButton size={'small'} onClick={handleColapse}>
                  {isColapsed ? <ArrowForwardIos /> : <ArrowBackIos />}
                </IconButton>
              )}
            </div>
            <div className={`overflow-x-hidden overflow-y-auto max-h-[calc(100vh-300px)]`}>
              {serviceSteps?.map((data, index) => {
                return (
                  <RenderSingleService
                    key={data.uniqueId}
                    {...{
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
                      data,
                      index,
                      isMobile
                    }}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default RenderService;

const RenderSingleService = ({
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
  data,
  index,
  isMobile
}) => {
  const style = stylesForEveryTab(selectedService, data, index);
  const stepTimes = getFieldsWithOtherDetails(data, stepSubmitedData);

  return (
    <div
      key={data.uniqueId}
      className={`duration-300 transition-all ${
        isMobile ? 'p-2 rounded-md' : 'px-3 py-[14px] first-of-type:[border-radius:5px_5px_0_0] last-of-type:[border-radius:0_0_5px_5px]'
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
      <div className="flex items-start gap-2">
        <HtmlTooltip enterTouchDelay={0} placement="top" arrow title={isMobile ? data?.serviceName : ''}>
          {data?.type === 'service' ? (
            <div
              className={`${
                isColapsed ? 'mx-auto' : ''
              }  transition-all duration-300 bg-[var(--dark-primary,_var(--primary))] text-white w-[20px] h-[20px] rounded-full text-center flex justify-center items-center text-[10px] flex-shrink-0`}
            >
              <span>{data?.order}</span>
            </div>
          ) : (
            data?.type === 'quotation' && <FormatQuote style={{ maxWidth: '20px', marginRight: '-10px' }} />
          )}
        </HtmlTooltip>

        <div className={`flex items-center relative gap-2 ${isColapsed ? 'hidden' : ''}`}>
          <HtmlTooltip enterTouchDelay={0} placement="top" arrow title={isMobile ? data?.serviceName : ''}>
            <h6 className="text-[16px] font-semibold line-clamp-1 min-w-0">{data?.serviceName}</h6>
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
            <HtmlTooltip arrow enterTouchDelay={0} title={data?.assignedUsers?.map((e) => e?.optionLabel)?.toString()}>
              <span>
                <People style={{ fontSize: 20 }} />
              </span>
            </HtmlTooltip>
          )}
          {data?.type === 'service' && data?.assignedWorkStations?.length > 0 && (
            <HtmlTooltip arrow enterTouchDelay={0} title={`Work Stations-${data?.assignedWorkStations?.map((e) => e?.optionLabel)?.toString()}`}>
              <span>
                <WorkStations className="align-text-top" size={15} />
              </span>
            </HtmlTooltip>
          )}
          {data?.comment && (
            <HtmlTooltip arrow enterTouchDelay={0} title={data?.comment}>
              <span>
                <Message style={{ fontSize: 18 }} />
              </span>
            </HtmlTooltip>
          )}
        </div>

        {!isColapsed && (
          <>
            {data?.type === 'service' && (
              <div className="flex items-center gap-1 flex-grow justify-end">
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
                {resource === sidebarResource.workOrder && (
                  <HtmlTooltip enterTouchDelay={0} title="Delete" placement="top" arrow>
                    <IconButton
                      size="small"
                      color="inherit"
                      style={{ color: 'red', marginTop: '3px' }}
                      aria-label="delete"
                      disabled={allowedToEdit && data?.status === WORKORDER_SERVICE_STATUS.pending ? false : true}
                      onClick={() => {
                        setShowConfirmBox(true);
                      }}
                    >
                      <DeleteOutline style={{ fontSize: '18px' }} />
                    </IconButton>
                  </HtmlTooltip>
                )}
              </div>
            )}
          </>
        )}
      </div>
      {/* Chips */}
      <div className={`flex items-center flex-wrap gap-2 basis-full w-full pl-[20px] ${isColapsed ? 'hidden' : ''}`}>
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
              className={`${isMobile ? 'max-w-[20px] h-[20px]' : 'max-w-[24px] h-[24px]'} flex-shrink-0 mt-[3px]`}
              stepStatus={data?.serviceStatus}
            />
          )}
          {data?.type === 'quotation' && quotationData && (
            <RenderStatusIcon
              className={`${isMobile ? 'max-w-[20px] h-[20px]' : 'max-w-[24px] h-[24px]'} flex-shrink-0 mt-[3px]`}
              stepStatus={quotationData?.status}
            />
          )}
        </div>
      </div>
    </div>
  );
};
