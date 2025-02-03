import { Dialog } from '@mui/material';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import ChartTypes from './ChartTypes';
import { CustomDialogTransition } from 'src/constants/helpers';

const FullScreenChart = ({ close, chart, filterData, globalFilters, selectedDashboardId, fetchDashboards, kpiFilters, fetchKpiFilters }) => {
  return (
    <Dialog TransitionComponent={CustomDialogTransition} open onClose={close} fullScreen>
      <CustomDialogHeader title={'Full Screen Chart'} onClose={close} showRequiredLabel={false} />
      <CustomDialogContent isFooterPresent={false}>
        <ChartTypes
          fetchDashboards={fetchDashboards}
          selectedDashboardId={selectedDashboardId}
          fullScreen={true}
          chart={chart}
          filterData={filterData}
          globalFilters={globalFilters}
          kpiFilters={kpiFilters}
          fetchKpiFilters={fetchKpiFilters}
        />
      </CustomDialogContent>
    </Dialog>
  );
};

export default FullScreenChart;
