import { CheckCircle, CheckCircleOutline, RadioButtonUnchecked } from '@mui/icons-material';
import { Checkbox, FormControlLabel } from '@mui/material';
import { ThemeButton } from 'src/components/Helpers/Buttons';
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
  allServiceSteps,
  preWork,
  useServiceSelectionState
}) => {
  const { handleSelectMultiple, isGroupIndeterminate, isGroupSelected } = useServiceSelectionState;
  return (
    <div className="relative isolate min-w-0 max-w-full ">
      {!isColapsed && (
        <div className="mb-2 mt-2 flex items-center justify-between gap-2">
          <FormControlLabel
            className="ml-2"
            control={
              <Checkbox
                checked={isGroupSelected(allServiceSteps)}
                indeterminate={isGroupIndeterminate(allServiceSteps)}
                onChange={(e) => {
                  handleSelectMultiple(e.target.checked, allServiceSteps);
                }}
                checkedIcon={<CheckCircle />}
                indeterminateIcon={<CheckCircleOutline />}
                icon={<RadioButtonUnchecked />}
                sx={{ p: '4px' }}
              />
            }
            label={<span className="ml-[3px]">Select All</span>}
          />

          <div className="flex gap-2">
            {servicesButtons.map(({ id, children, visible, ...rest }) => {
              if (!visible) return null;
              return (
                <ThemeButton key={id} {...rest} className={`${isColapsed ? 'hidden' : ''} round`}>
                  {children}
                </ThemeButton>
              );
            })}
          </div>
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
          completed,
          useServiceSelectionState
        }}
      />
    </div>
  );
};

export default RenderServiceGroup;
