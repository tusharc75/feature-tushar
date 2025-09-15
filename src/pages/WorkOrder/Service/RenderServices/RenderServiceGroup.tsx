import { Info, KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { Collapse } from '@mui/material';
import { useState } from 'react';
import { PostWorkIcon, PreWorkIcon } from 'src/assets/svg/svgIcons';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { cn } from 'src/constants/helpers';
import RenderServiceCountBadge from 'src/pages/WorkOrder/Service/RenderServices/RenderServiceCountBadge';
import RenderServicesList from 'src/pages/WorkOrder/Service/RenderServices/RenderServicesList';

const RenderServiceGroup = ({
  serviceSteps,
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
  completed,
  preWork
}) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="relative isolate min-w-0 max-w-full rounded-[8px] border">
      <div
        className={cn(
          'flex cursor-pointer items-center gap-2  bg-[white] dark:bg-[--dark-primary]',
          isColapsed ? 'justify-center py-4' : 'justify-between p-4 ',
          expanded ? 'rounded-t-[8px] border-b bg-[rgb(242,245,254)] dark:bg-[#1E293B]' : 'rounded-[8px] '
        )}
        onClick={() => {
          if (!isColapsed) setExpanded((prev) => !prev);
        }}
      >
        <RenderServiceCountBadge serviceSteps={serviceSteps} />
        {isColapsed ? (
          <HtmlTooltip title={'Services'}>
            <Info />
          </HtmlTooltip>
        ) : (
          <>
            <div className='flex gap-2'>
              <h6 className={'text-base font-medium leading-[24px]'}>Services</h6>
              {user?.brandPolicy?.servicePrePost ?
                preWork ? (
                  <HtmlTooltip enterTouchDelay={0} title="Pre Work Service" arrow placement="top">
                    <PreWorkIcon />
                  </HtmlTooltip>
                ) : (
                  <HtmlTooltip enterTouchDelay={0} title="Post Work Service" arrow placement="top">
                    <PostWorkIcon />
                  </HtmlTooltip>
                ) : null}
            </div>
            {expanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </>
        )}
      </div>

      <Collapse in={expanded}>
        <div className={cn('rounded-b-[8px] bg-[rgb(248,250,255)] p-4 transition-all dark:bg-[#111827]', isColapsed ? 'p-2' : '')}>
          {!isColapsed && (
            <div className="mb-2 mt-2 flex items-center justify-end gap-2">
              {servicesButtons.map(({ id, children, visible, ...rest }) => {
                if (!visible) return null;
                return (
                  <ThemeButton key={id} {...rest} className={`${isColapsed ? 'hidden' : ''} round`}>
                    {children}
                  </ThemeButton>
                );
              })}
            </div>
          )}
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
      </Collapse>
    </div >
  );
};

export default RenderServiceGroup;
