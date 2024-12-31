import { Box, Dialog } from '@mui/material';
import { CalendarToday, List } from '@mui/icons-material';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useState } from 'react';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import { CustomDialogTransition } from '../../../constants/helpers';
import CalendarView from './CalendarView';
import History from './index';

const HistoryDialog = ({ close, product, warehouse, storageLocation, productName }) => {
  const [currentView, setCurrentView] = useState('list');

  return (
    <Dialog fullScreen TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true} fullWidth>
      <CustomDialogHeader title={`History - ${productName}`} onClose={close} showRequiredLabel={false}></CustomDialogHeader>
      <CustomDialogContent isFooterPresent={false}>
        <Box className={`flex min-h-[50px] items-center justify-end ${currentView !== 'calendar' && 'md:absolute md:right-[16px] md:top-[65px]'} `}>
          <Box display="flex">
            <ToggleButtonGroup size="small" exclusive value={currentView} onChange={(e, newVal) => {}}>
              <ToggleButton value={'list'} onClick={() => setCurrentView('list')}>
                <List fontSize="small" />
              </ToggleButton>
              <ToggleButton value={'calendar'} onClick={() => setCurrentView('calendar')}>
                <CalendarToday fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
        {currentView === 'list' ? (
          <History product={product} warehouse={warehouse} storageLocation={storageLocation} />
        ) : (
          <div>
            <CalendarView product={product} warehouse={warehouse} storageLocation={storageLocation} />
          </div>
        )}
      </CustomDialogContent>
    </Dialog>
  );
};

export default HistoryDialog;
