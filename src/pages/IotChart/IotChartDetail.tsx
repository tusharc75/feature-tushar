import { useState, useEffect, useContext } from 'react';
import { Grid, Box } from '@material-ui/core';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { useParams } from 'react-router-dom';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import { useData } from '../../StateProvider/Provider';
import routes from 'src/components/Helpers/Routes';
import Analysis from './Analysis';
import axiosInstance from 'src/axios/axiosInstance';
import { serializedAsset } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const IotChartDetail = () => {
    const toastConfig = useContext(CustomToastContext);
    const { assetId } = useParams();
    const {
        state: { user, permissions }
    }: any = useData();
    const [customizedRoutes, setCustomizedRoutes] = useState([]);
    const [tabValue, setTabValue] = useState(0);

    useEffect(() => {
        fetchData()
    }, [assetId])

    const fetchData = async () => {
        try {
            const {
                data: { data }
            } = await axiosInstance().get(`${serializedAsset.api}/${assetId}`);
            setCustomizedRoutes([
                routes.iotChart,
                { title: `${data?.assetNumber ?? ''}` }
            ]);
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
            <Box className="headerbox-v1">
                <Box className="nav-v1">
                    <CustomBreadCrumbs routes={customizedRoutes} />
                </Box>
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
                </Tabs>
                {tabValue === 0 && (
                    <Box>
                        Current
                    </Box>
                )}
                {tabValue === 1 && <Analysis assetId={assetId} />}
                {tabValue === 2 && (
                    <Box>
                        Performance Analysis
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default IotChartDetail;
