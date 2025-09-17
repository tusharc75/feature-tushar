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
  preWork
}) => {
  return (
    <div className="relative isolate min-w-0 max-w-full ">
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
  );
};

export default RenderServiceGroup;
