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

  return (
    <Dialog fullScreen TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true} fullWidth>
      <CustomDialogHeader title={`History - ${productName}`} onClose={close} showRequiredLabel={false}></CustomDialogHeader>
      <CustomDialogContent>
        <Box display="flex" justifyContent="flex-end" alignItems="center"
          style={(isMobile && !isTablet) || currentView === "calendar" ? {} : { position: 'absolute', top: '65px', right: '10px' }}>
          <Box display="flex">
            <ToggleButtonGroup
              size="small"
              exclusive
              value={currentView}
              onChange={(e, newVal) => {
                setCurrentView(newVal);
              }}
            >
              <ToggleButton value={'list'}>
                <List fontSize="small" />
              </ToggleButton>
              <ToggleButton value={'calendar'}>
                <CalendarToday fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
        {currentView === 'list' ? (
          <History
            product={product}
            warehouse={warehouse}
            storageLocation={storageLocation}
          />
        ) : (
          <div>
            <CalendarView
              product={product}
              warehouse={warehouse}
              storageLocation={storageLocation}
            />
          </div>
        )}
      </CustomDialogContent>
    </Dialog>
  );
};

export default HistoryDialog;
