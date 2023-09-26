import { useState, useEffect, useContext } from 'react';
import { Box, Button } from '@material-ui/core';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { useParams } from 'react-router-dom';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import Analysis from './Analysis';
import axiosInstance from 'src/axios/axiosInstance';
import { serializedAsset } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import PerformanceAnalysis from './PerformanceAnalysis';
import Current from './Current';
import DataSimulationDialog from './DataSimulation';
import Status from './Status';
import CustomDataPoints from './CustomDataPoints';

const IotChartDetail = () => {

    const toastConfig = useContext(CustomToastContext);
    const { assetId } = useParams();
    const [customizedRoutes, setCustomizedRoutes] = useState([]);
    const [tabValue, setTabValue] = useState(0);
    const [dataPoints, setDataPoints] = useState([]);
    const [openDataSimulationDialog, setOpenDataSimulationDialog] = useState(false);
    const [customDataPoints, setCustomDataPoints] = useState([]);

    useEffect(() => {
        fetchData()
    }, [assetId])

    useEffect(() => {
        axiosInstance().get(`${routes?.iotDataPoints?.path}`).then(({ data: { data } }) => {
            setDataPoints(data?.data)
        });
    }, [assetId]);

    useEffect(() => {
        axiosInstance().get(`${routes?.deviceTemplates?.path}/custom-data-points`).then(({ data: { data } }) => {
            setCustomDataPoints(data)
        });
    }, [assetId]);

    const fetchData = async () => {
        try {
            const { data: { data } } = await axiosInstance().get(`${serializedAsset.api}/${assetId}`);
            setCustomizedRoutes([routes.iotChart, { title: `${data?.assetNumber ?? ''}` }]);
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
                    <CustomBreadCrumbs routes={customizedRoutes} />
                </Box>
                <Button
                    onClick={() => {
                        setOpenDataSimulationDialog(!openDataSimulationDialog);
                    }}
                    variant='contained'
                    color="primary"
                    size="small"
                >
                    Data Simulation
                </Button>
            </Box>
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
                    <Tab className={'tabLayout'} value={1} label={<div className="d-flex align-items-center tab-font">Analysis</div>} {...a11yProps(1)} />
                    <Tab className={'tabLayout'} value={2} label={<div className="d-flex align-items-center tab-font">Performance Analysis</div>} {...a11yProps(2)} />
                    <Tab className={'tabLayout'} value={3} label={<div className="d-flex align-items-center tab-font">Status</div>} {...a11yProps(3)} />
                    <Tab className={'tabLayout'} value={4} label={<div className="d-flex align-items-center tab-font">Custom Data Points</div>} {...a11yProps(4)} />
                </Tabs>
                {tabValue === 0 && <Current assetId={assetId} />}
                {tabValue === 1 && <Analysis assetId={assetId} dataPoints={dataPoints} />}
                {tabValue === 2 && <PerformanceAnalysis assetId={assetId} dataPoints={dataPoints} />}
                {tabValue === 3 && <Status assetId={assetId} dataPoints={dataPoints} />}
                {tabValue === 4 && <CustomDataPoints assetId={assetId} dataPoints={customDataPoints} />}
            </Box>
            {openDataSimulationDialog &&
                <DataSimulationDialog
                    onClose={() => setOpenDataSimulationDialog(false)}
                />}
        </Box>
    );
};

export default IotChartDetail;
