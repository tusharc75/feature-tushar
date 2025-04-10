import { useState } from 'react';
import { Dialog } from '@mui/material';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from '../../../constants/helpers';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import Consumables from './Consumables';

const ConsumablesDialog = ({ onClose, serviceOrderData, consumables, onSubmit }) => {

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [selectedRecords, setSelectedRecords] = useState(null);

  return (
    <Dialog
      maxWidth="md"
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullWidth
    >
      <>
        <CustomDialogHeader
          title={`Select Products/Consumables`}
          onClose={onClose}
          isMinimized={!fullScreen}
          onMinimizeMaximize={() => {
            setFullScreen((prevState) => !prevState);
          }}
          showRequiredLabel={false}
          showManimizeMaximize={true}
        ></CustomDialogHeader>
        <CustomDialogContent>
          <Consumables
            allowedToEdit={false}
            serviceOrderData={serviceOrderData}
            serviceOrderFields={null}
            stepFullScreen={fullScreen}
            fetchData={() => { }}
            technicians={null}
            fetchConsumablesData={() => { }}
            setSelectedRecords={setSelectedRecords}
            allConsumables={consumables}
          />
        </CustomDialogContent>
        <CustomDialogFooter>
          <ThemeButton
            buttonType="transparent"
            onClick={() => {
              onClose();
            }}
          >
            Close
          </ThemeButton>
          <ThemeButton
            id="dialog-save-button"
            buttonType="theme"
            onClick={() => {
              onSubmit(selectedRecords?.map((r) => r?._id));
            }}
          >
            Proceed
          </ThemeButton>
        </CustomDialogFooter>
      </>
    </Dialog>
  );
};

export default ConsumablesDialog;
