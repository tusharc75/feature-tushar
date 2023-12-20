import { useState, useEffect, useContext } from 'react';
import { Box, Button } from '@material-ui/core';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { useParams } from 'react-router-dom';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import Analysis from './Analysis';
import axiosInstance from 'src/axios/axiosInstance';
import { ACTIVITY_RESOURCE, serializedAsset } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import PerformanceAnalysis from './PerformanceAnalysis';
import Current from './Current';
import DataSimulationDialog from './DataSimulation';
import Status from './Status';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import Alarms from './Alarms';
import ActivityButton from 'src/components/Activity/ActivityButton';

const IotChartDetail = () => {
  const toastConfig = useContext(CustomToastContext);
  const { assetId } = useParams();
  const [assetData, setAssetData] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [dataPoints, setDataPoints] = useState([]);
  const [openDataSimulationDialog, setOpenDataSimulationDialog] = useState(false);
  const [deviceTemplate, setDeviceTemplate] = useState(null);

  useEffect(() => {
    fetchData();
  }, [assetId]);

  useEffect(() => {
    if (deviceTemplate) {
      const query = [{ field: 'deviceTemplate', term: deviceTemplate }];
      const deepFilter = [{ field: 'active', term: 'yes' }, { field: 'alarm', term: 'no' }];
      axiosInstance()
        .get(`${routes.iotDataPoints.path}?filterById=${JSON.stringify(query)}&deepFilter=${JSON.stringify(deepFilter)}&sortBy=order&orderBy=asc&filterType=and`)
        .then(({ data: { data } }) => {
          setDataPoints(data?.data);
        });
    }
  }, [deviceTemplate]);

  const fetchData = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/iot-chart${serializedAsset.api}/${assetId}`);
      setAssetData(data);
      setDeviceTemplate(data?.deviceTemplates?._id);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };

  function a11yProps(index: any) {
    return {
      id: `main-tab-${index}`,
      'aria-controls': `main-tabpanel-${index}`
    };
  }

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1 flex flex-row justify-between">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[routes.iotChart, { title: `${assetData?.assetNumber ?? ''}` }]} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            <Button
              onClick={() => {
                setOpenDataSimulationDialog(!openDataSimulationDialog);
              }}
              variant="outlined"
              color="primary"
              size="small"
            >
              Data Simulation
            </Button>
            <ActivityButton
              referenceId={assetData?._id}
              resource={ACTIVITY_RESOURCE.serializedAsset}
              resourceLabel={assetData?.assetNumber}
            />
          </Box>
        </Box>
      </Box>
      {deviceTemplate ? (
        <Box className={`detail-container-v1`}>
          <Tabs
            className="new-tab-container-v1"
            variant="scrollable"
            scrollButtons="auto"
            value={tabValue}
            onChange={handleMainTabChange}
            indicatorColor="primary"
            textColor="primary"
            aria-label="Product Details Tab"
            TabIndicatorProps={{
              style: {
                height: 0
              }
            }}
          >
            <Tab className={'tabLayout'} value={0} label={<div className="d-flex align-items-center tab-font">Current</div>} {...a11yProps(0)} />
            {/* <Tab className={'tabLayout'} value={1} label={<div className="d-flex align-items-center tab-font">Analysis</div>} {...a11yProps(1)} /> */}
            <Tab
              className={'tabLayout'}
              value={2}
              label={<div className="d-flex align-items-center tab-font">Performance Analysis</div>}
              {...a11yProps(2)}
            />
            <Tab className={'tabLayout'} value={3} label={<div className="d-flex align-items-center tab-font">Alarms</div>} {...a11yProps(3)} />
            <Tab className={'tabLayout'} value={4} label={<div className="d-flex align-items-center tab-font">Status</div>} {...a11yProps(4)} />
          </Tabs>
          {tabValue === 0 && <Current deviceTemplate={deviceTemplate} assetId={assetId} />}
          {/* {tabValue === 1 && <Analysis assetId={assetId} dataPoints={dataPoints} />} */}
          {tabValue === 2 && <PerformanceAnalysis deviceTemplate={deviceTemplate} assetId={assetId} dataPoints={dataPoints} />}
          {tabValue === 3 && <Alarms deviceTemplate={deviceTemplate} assetId={assetId} />}
          {tabValue === 4 && <Status assetId={assetId} dataPoints={dataPoints} />}
        </Box>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {openDataSimulationDialog && <DataSimulationDialog onClose={() => setOpenDataSimulationDialog(false)} />}
    </Box>
  );
};

export default IotChartDetail;
