import { Info, KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { Collapse } from '@mui/material';
import { useState } from 'react';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { cn } from 'src/constants/helpers';
import RenderServiceCountBadge from 'src/pages/WorkOrder/Service/RenderServices/RenderServiceCountBadge';
import RenderServicesList from 'src/pages/WorkOrder/Service/RenderServices/RenderServicesList';

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
    <div className="relative isolate min-w-0 max-w-full">
      <div
        className={cn(
          'flex cursor-pointer items-center gap-2 rounded-[8px] bg-[#F3F4F6] dark:bg-[--dark-secondary]',
          isColapsed ? 'justify-center py-4' : 'justify-between p-4 '
        )}
        onClick={() => {
          if (!isColapsed) setExpanded((prev) => !prev);
        }}
      >
        {isColapsed ? (
          <HtmlTooltip title={group.product}>
            <Info />
          </HtmlTooltip>
        ) : (
          <>
            <div className="flex flex-grow items-center justify-between">
              <h6 className={'text-base font-medium leading-[24px]'}>{group.product}</h6>
              <RenderServiceCountBadge serviceSteps={group.serviceSteps} />
            </div>
            {expanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </>
        )}
      </div>
      {expanded && <div className="absolute -left-[10px] top-[25px] z-[-1] h-[calc(100%-68px)] w-full rounded-md border border-r-0 border-dashed" />}
      <Collapse in={expanded}>
        <div className="bg-[var(--dark-primary,white)]">
          {!isColapsed && (
            <div className="mb-2 mt-2 flex items-center justify-end gap-2">
              {servicesButtons.map(({ id, children, onClick, visible, ...rest }) => {
                if (!visible) return null;
                return (
                  <ThemeButton
                    key={id}
                    onClick={(e) => {
                      onClick(e, group?._id ? group?._id : null);
                    }}
                    {...rest}
                    className={isColapsed ? 'hidden' : ''}
                  >
                    {children}
                  </ThemeButton>
                );
              })}
            </div>
          )}
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

export default RenderSingleGroup;
