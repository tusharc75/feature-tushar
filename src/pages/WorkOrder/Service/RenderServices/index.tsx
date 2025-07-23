import { ArrowBackIos, ArrowForwardIos } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { MdKeyboardDoubleArrowUp } from 'react-icons/md';
import axiosInstance from 'src/axios/axiosInstance';
import { ThemeButton, ThemeButtonProps } from 'src/components/Helpers/Buttons';
import { cn, sidebarResource } from 'src/constants/helpers';
import useTab from './useTab';
import RenderServicesList from 'src/pages/WorkOrder/Service/RenderServices/RenderServicesList';
import RenderSingleGroup from 'src/pages/WorkOrder/Service/RenderServices/RenderSingleGroup';
import RenderServiceGroup from 'src/pages/WorkOrder/Service/RenderServices/RenderServiceGroup';

export type ServicesButtons = { visible: boolean; id: string | number } & ThemeButtonProps;

type RenderServiceProps = {
  isColapsed: boolean;
  serviceSteps: any;
  allServices: any;
  products: any;
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
      return products?.map((p) => ({
        _id: p?._id,
        product: p?.product?.optionLabel,
        serviceSteps: allServices?.filter((s) => s?.parentId === p?._id)
      }));
    }
    return null;
  }, [policy, allServices, products]);

  return (
    <>
      <div className={`${isMobile ? 'p-3' : 'min-h-full border'} relative isolate`}>
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
                      className={`absolute -right-[5.5px] rounded-full bg-[var(--dark-secondary,_white)] ${
                        isMobileSlideOpen ? 'opacity-100' : 'sr-only opacity-0'
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
            <div className={`mb-1 flex flex-wrap gap-2 p-[20px_20px_0px] ${isColapsed ? 'justify-around' : 'justify-end'} items-center`}>
              {isColapsed ? null : <h6 className="mr-auto text-[16px]">Services</h6>}
              <IconButton size={'small'} onClick={handleColapse}>
                <ArrowForwardIos fontSize="small" className={cn('transition-all', isColapsed ? '' : '[transform:rotate(180deg)]')} />
              </IconButton>
            </div>
            <div className={`max-h-[calc(100vh-300px)] overflow-y-auto overflow-x-hidden p-[20px]`}>
              {group && (
                <div className="mb-4 grid gap-4 ">
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
              {policy && policy.enableServicesOnConsumables ? (
                <RenderServiceGroup
                  servicesButtons={servicesButtons}
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
              ) : (
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
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default RenderService;
