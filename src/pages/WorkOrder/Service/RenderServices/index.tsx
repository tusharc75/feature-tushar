import { Chip, IconButton, Typography } from '@material-ui/core';
import { ArrowBackIos, ArrowForwardIos, DeleteOutline, FormatQuote, Message, MoreHoriz, People } from '@material-ui/icons';
import React from 'react';
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
  setShowConfirmBox: any;
  servicesButtons: ServicesButtons[];
  isMobile: boolean;
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
  isMobile
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

  const { containerRef, activeTab, tabSize, handleNextClick, handlePrevClick, hasNextTab, hasPrevTab } = useTab({
    active: isMobile,
    totlaTabs: serviceSteps?.length || 0,
    activeTabIndex: 0,
    gap: 8
  });

  return (
    <>
      <div className={`${isMobile ? 'p-4' : 'container-with-border p-[20px]'}`}>
        {isMobile ? (
          <>
            <div className="flex items-center gap-[8px]">
              <IconButton
                disabled={!hasPrevTab}
                onClick={() => {
                  const activeTab = handlePrevClick();
                  const data = serviceSteps[activeTab];
                  if (data?.type === 'service') {
                    setSelectedService(data);
                  }
                }}
                size="small"
              >
                <ArrowBackIos />
              </IconButton>
              <div className={`flex overflow-x-auto overflow-y-hidden gap-[8px]`} ref={containerRef}>
                {serviceSteps?.map((data, index) => {
                  return (
                    <RenderSingleService
                      key={data._id}
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
                        index
                      }}
                    />
                  );
                })}
              </div>
              <IconButton
                disabled={!hasNextTab}
                onClick={() => {
                  const activeTab = handleNextClick();
                  const data = serviceSteps[activeTab];
                  if (data?.type === 'service') {
                    setSelectedService(data);
                  }
                }}
                size="small"
              >
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
                    key={data._id}
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
                      index
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
  index
}) => {
  const style = stylesForEveryTab(selectedService, data, index);
  const stepTimes = getFieldsWithOtherDetails(data, stepSubmitedData);
  return (
    <div
      key={data._id}
      className=" duration-300 transition-all p-2 min-w-[var(--tab-size)] max-w-[var(--tab-size)]"
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
        {data?.type === 'service' ? (
          <div
            className={` bg-[var(--dark-primary,_var(--primary))] text-white w-[20px] h-[20px] rounded-full text-center flex justify-center items-center text-[10px] flex-shrink-0`}
          >
            <span>{data?.order}</span>
          </div>
        ) : (
          data?.type === 'quotation' && <FormatQuote style={{ maxWidth: '20px', marginRight: '-10px' }} />
        )}

        <div className={`flex items-center relative gap-2 ${isColapsed ? 'hidden' : ''}`}>
          <h6 className="text-[16px] font-semibold line-clamp-1 min-w-0">{data?.serviceName}</h6>
          {user?.brandPolicy?.servicePrePost && data?.type === 'service' && (
            <>
              {data?.preWork ? (
                <HtmlTooltip enterTouchDelay={0} title="Pre Work Service" arrow placement="top">
                  <span>
                    <PreWorkIcon style={{ verticalAlign: 'middle' }} />
                  </span>
                </HtmlTooltip>
              ) : (
                <HtmlTooltip enterTouchDelay={0} title="Post Work Service">
                  <span>
                    <PostWorkIcon style={{ verticalAlign: 'middle' }} />
                  </span>
                </HtmlTooltip>
              )}
            </>
          )}
          {data?.type === 'service' && data?.assignedUsers?.length > 0 && (
            <HtmlTooltip enterTouchDelay={0} title={data?.assignedUsers?.map((e) => e?.optionLabel)?.toString()}>
              <span>
                <People style={{ fontSize: 20 }} />
              </span>
            </HtmlTooltip>
          )}
          {data?.type === 'service' && data?.assignedWorkStations?.length > 0 && (
            <HtmlTooltip enterTouchDelay={0} title={`Work Stations-${data?.assignedWorkStations?.map((e) => e?.optionLabel)?.toString()}`}>
              <span>
                <WorkStations className="align-text-top" />
              </span>
            </HtmlTooltip>
          )}
          {data?.comment && (
            <HtmlTooltip enterTouchDelay={0} title={data?.comment}>
              <span>
                <Message style={{ fontSize: 20 }} />
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
                      onClick={() => setShowConfirmBox(true)}
                    >
                      <DeleteOutline style={{ fontSize: '18px' }} />
                    </IconButton>
                  </HtmlTooltip>
                )}
                {/* PassFail */}
                {data?.type === 'service' && data?.serviceStatus && (
                  <RenderStatusIcon style={{ maxWidth: 24, height: 24, margin: '5px 3px 0 auto' }} stepStatus={data?.serviceStatus} />
                )}
                {data?.type === 'quotation' && quotationData && (
                  <RenderStatusIcon style={{ maxWidth: 24, height: 24, margin: '5px 3px 0 auto' }} stepStatus={quotationData?.status} />
                )}
              </div>
            )}
          </>
        )}
      </div>
      {/* Chips */}
      <div className={`flex items-center flex-wrap gap-2 basis-full w-full ml-[20px] ${isColapsed ? 'hidden' : ''}`}>
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
      </div>
    </div>
  );
};
