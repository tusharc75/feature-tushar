import { ArrowBackIos, ArrowForwardIos, FormatQuote, KeyboardArrowDown, KeyboardArrowUp, Message, MoreHoriz, People } from '@mui/icons-material';
import ApartmentIcon from '@mui/icons-material/Apartment';
import { Chip, Collapse, IconButton } from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { MdKeyboardDoubleArrowUp } from 'react-icons/md';
import { PostWorkIcon, PreWorkIcon } from 'src/assets/svg/svgIcons';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { ThemeButton, ThemeButtonProps } from 'src/components/Helpers/Buttons';
import { cn, getChipColor, sidebarResource } from 'src/constants/helpers';
import { RenderStatusIcon } from '../index';
import RenderTotalTime from './RenderTotalTime';
import useTab from './useTab';
import axiosInstance from 'src/axios/axiosInstance';
import { useData } from 'src/StateProvider/Provider';

export type ServicesButtons = { visible: boolean; id: string | number } & ThemeButtonProps;

type RenderServiceProps = {
  isColapsed: boolean;
  serviceSteps: any;
  allServices: any,
  products: any,
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
  completed: boolean;
};

const RenderService = ({
  isColapsed,
  serviceSteps,
  allServices,
  products,
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
  initialTabIndex = 0,
  completed
}: RenderServiceProps) => {
  const [isMobileSlideOpen, setIsMobileSlideOpen] = useState(false);
  const [policy, setPolicy] = useState(null);

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const {
          data: { data }
        } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.workOrder}`);

        if (data && user?.brand === data.brand) {
          setPolicy(data.policy);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchPolicy();
  }, [user?.brand]);

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
    totalTabs: serviceSteps?.length || 0,
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

  const isAnyButtonVisible = servicesButtons.some((d) => d.visible);

  const group = useMemo(() => {
    if (policy && policy.enableServicesOnConsumables && products?.length > 0) {
      return products?.map(p => ({ _id: p?._id, product: p?.product?.optionLabel, serviceSteps: allServices?.filter(s => s?.parentId === p?._id) }))
    }
    return null;
  }, [policy, allServices, products]);

  return (
    <>
      <div className={`${isMobile ? 'p-3' : 'min-h-full border p-[20px]'} relative isolate`}>
        {isMobile ? (
          <>
            {isAnyButtonVisible && (
              <span className=" absolute -top-[25px] right-[15px] rounded-[5px_5px_0_0] bg-[var(--dark-primary,_white)] [border-bottom:0px_!important] [border:1px_solid_var(--common-border-color)]">
                <IconButton size="small" onClick={() => setIsMobileSlideOpen((prev) => !prev)} className="p-[6px] ">
                  <MdKeyboardDoubleArrowUp className={`${isMobileSlideOpen ? ' ' : '[transform:rotate(180deg)]'} transition-all duration-300`} />
                  <span className="sr-only">Open menu</span>
                </IconButton>
                {servicesButtons.map(({ id, children, visible, ...rest }, index) => {
                  if (!visible) return null;
                  return (
                    <span
                      className={`absolute -right-[5.5px] rounded-full bg-[var(--dark-secondary,_white)] ${isMobileSlideOpen ? 'opacity-100' : 'sr-only opacity-0'
                        }`}
                      style={{ top: isMobileSlideOpen ? `-${(index + 1) * 32 + (index + 1) * 8}px` : '-24px', transition: `top 0.${index + 2}s` }}
                    >
                      <ThemeButton key={id} {...rest} className={`${isColapsed ? 'hidden' : ''} round`}>
                        {children}
                      </ThemeButton>
                    </span>
                  );
                })}
              </span>
            )}

            <div className="grid min-h-[74px] grid-cols-[30px_1fr_30px] items-center gap-[8px]">
              <IconButton disabled={!hasPrevTab} className={`${!hasPrevTab ? 'opacity-0' : 'opacity-100'}`} onClick={handlePrevClick} size="small">
                <ArrowBackIos />
              </IconButton>
              <div className={`flex gap-[8px] overflow-x-auto overflow-y-hidden`} ref={containerRef}>
                <RenderServicesList
                  {...{
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
                  }}
                />
              </div>
              <IconButton disabled={!hasNextTab} className={`${!hasNextTab ? 'opacity-0' : 'opacity-100'}`} onClick={handleNextClick} size="small">
                <ArrowForwardIos />
              </IconButton>
            </div>
          </>
        ) : (
          <>
            <div className={`mb-1 flex flex-wrap gap-2 ${isColapsed ? 'justify-around' : 'justify-end'} mb-3 items-center`}>
              {isColapsed ? null : <h6 className="mr-auto text-[16px]">Services</h6>}
              {servicesButtons.map(({ id, children, visible, ...rest }) => {
                if (!visible) return null;
                return (
                  <ThemeButton key={id} {...rest} className={isColapsed ? 'hidden' : ''}>
                    {children}
                  </ThemeButton>
                );
              })}
              <IconButton size={'small'} onClick={handleColapse}>
                <ArrowForwardIos fontSize="small" className={cn('transition-all', isColapsed ? '' : '[transform:rotate(180deg)]')} />
              </IconButton>
            </div>
            {group && (
              <div className="mb-4 grid gap-4">
                {group.map((d) => (
                  <RenderSingleGroup
                    key={d._id}
                    servicesButtons={servicesButtons}
                    group={d}
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
                      isMobile,
                      completed
                    }}
                  />
                ))}
              </div>
            )}
            <div className={`max-h-[calc(100vh-300px)] overflow-y-auto overflow-x-hidden`}>
              <RenderServicesList
                {...{
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
                }}
              />
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default RenderService;

const RenderSingleGroup = ({
  group,
  isColapsed,
  servicesButtons,
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
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="relative isolate">
      <div
        className=" flex cursor-pointer items-center justify-between gap-2 rounded-[8px] bg-[#F3F4F6] p-4 dark:bg-[--dark-secondary]"
        onClick={() => setExpanded((prev) => !prev)}
      >
        <div className="flex flex-grow items-center justify-between">
          <h6 className="text-base font-medium leading-[24px]">{group.product}</h6>
          <span className="text-xs text-gray-500">{group?.serviceSteps?.length} Services</span>
        </div>
        {expanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
      </div>
      {expanded && <div className="absolute -left-[10px] top-[25px] z-[-1] h-[calc(100%-68px)] w-full rounded-md border border-r-0 border-dashed" />}
      <Collapse in={expanded}>
        <div className="bg-[var(--dark-primary,white)]">
          <div className="mb-2 mt-2 flex items-center justify-end gap-2">
            {servicesButtons.map(({ id, children, onClick, visible, ...rest }) => {
              if (!visible) return null;
              return (
                <ThemeButton
                  key={id}
                  onClick={(e) => {
                    onClick(e, group?._id ? group?._id : null)
                  }}
                  {...rest}
                  className={isColapsed ? 'hidden' : ''}
                >
                  {children}
                </ThemeButton>
              );
            })}
          </div>
          <RenderServicesList
            {...{
              serviceSteps: group.serviceSteps,
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
            }}
          />
        </div>
      </Collapse>
    </div>
  );
};

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
          'absolute inset-0 bottom-0 left-0 right-0 top-0 -z-[1] flex h-full items-center justify-center',
          isColapsed && 'opacity-0',
          isMobile ? 'w-full' : 'flex-grow'
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
            className={`transition-all duration-300 ${isMobile ? 'rounded-md p-2' : 'px-3 py-[14px] first-of-type:[border-radius:5px_5px_0_0] last-of-type:[border-radius:0_0_5px_5px]'
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
