import { Info, KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { Collapse } from '@mui/material';
import { useMemo, useState } from 'react';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import RippleButton from 'src/components/RippleButton';
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
  const [expanded, setExpanded] = useState(false);

  const isSelected = useMemo(() => {
    return !!selectedService && !!group?.serviceSteps.find((d) => d._id === selectedService?._id && selectedService.parentId === group._id);
  }, [selectedService, group?.serviceSteps, group._id]);

  return (
    <div className="relative isolate min-w-0 max-w-full rounded-[8px] border">
      <div
        className={cn(
          'relative isolate transition-[border-radius]',
          expanded ? 'rounded-t-[8px] border-b bg-[rgb(242,245,254)] dark:bg-[#1E293B]' : 'rounded-[8px]'
        )}
      >
        <div
          className={cn(
            'flex items-center gap-2 rounded-[inherit] ',
            'data-[selected=true]:![outline:2px_solid_var(--new-theme-color)] ',
            group?.serviceSteps?.length === 1 ? 'cursor-pointer ' : '',
            isColapsed ? 'justify-center py-4' : 'justify-between p-4 '
          )}
          data-selected={isSelected}
          onClick={(e) => {
            if (group?.serviceSteps?.length === 1) {
              setSelectedService(group.serviceSteps[0]);
            }
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
              <HtmlTooltip title={expanded ? 'Collapse' : 'Expand'} className="block max-h-[24px] rounded-[inherit]">
                <RippleButton
                  onClickCapture={(e) => {
                    setExpanded((prev) => !prev);
                    e.preventDefault();
                  }}
                  className={cn('rounded-[inherit] text-inherit ', 'hover:bg-gray-300 dark:hover:bg-gray-700')}
                >
                  {expanded ? <KeyboardArrowUp color="inherit" /> : <KeyboardArrowDown color="inherit" />}
                </RippleButton>
              </HtmlTooltip>
            </>
          )}
        </div>
      </div>
      <Collapse in={expanded}>
        <div
          className={cn(
            'rounded-b-[8px] bg-[rgb(248,250,255)] p-4 transition-all dark:bg-[#111827]',
            isColapsed ? 'p-2' : '',
            isSelected ? 'dark:bg-[#1E293B]' : ''
          )}
        >
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
