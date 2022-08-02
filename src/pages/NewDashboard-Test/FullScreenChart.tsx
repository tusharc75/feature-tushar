import React from 'react';
import { Dialog } from '@material-ui/core';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import ChartTypes from './ChartTypes';

const FullScreenChart = ({ close, chart, filterData, globalFilters }) => {
  return (
    <Dialog open onClose={close} fullScreen>
      <CustomDialogHeader title={'Full Screen Chart'} onClose={close} />
      <CustomDialogContent>
        <ChartTypes fullScreen={true} chart={chart} filterData={filterData} globalFilters={globalFilters} />
      </CustomDialogContent>
    </Dialog>
  );
};

export default FullScreenChart;
