import { useState, useEffect } from 'react';
import { Box, Dialog, Button, Grid, Tab, Tabs, TextField, Typography } from '@material-ui/core';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import { CalendarToday, List } from '@material-ui/icons';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from '../../../constants/helpers';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import History from './index';
import CalendarView from './CalendarView';

const HistoryDialog = ({ close, product, warehouse, storageLocation, productName }) => {
  const [currentView, setCurrentView] = useState('list');

  const detectMobile = isMobile && !isTablet;

  return (
    <Dialog fullScreen TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true} fullWidth>
      <CustomDialogHeader title={`History - ${productName}`} onClose={close} showRequiredLabel={false}></CustomDialogHeader>
      <CustomDialogContent>
        <Box
          className={`flex justify-end items-center min-h-[50px] ${
            !detectMobile && currentView !== 'calendar' && 'absolute top-[65px] right-[16px]'
          } `}
        >
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
