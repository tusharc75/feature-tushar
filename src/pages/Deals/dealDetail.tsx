import { Box, Grid, Tab, Tabs } from '@material-ui/core';
import React, { useContext, useEffect, useState } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { BiFoodMenu } from 'react-icons/bi';
import { useParams } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import DetailsPage from '../../components/Shared/DetailsPage';
import TabPanel from '../../components/TabPanel';
import { FaWpforms } from 'react-icons/fa';
import Material from './Material';
import Units from './Units';
import ActivityButton from 'src/components/Activity/ActivityButton';
import { camelCase } from 'lodash';
import { sidebarResource } from 'src/constants/helpers';

const DealDetail = () => {

    const { id } = useParams();
    const toastConfig = useContext(CustomToastContext);

    const [dealData, setDealData] = useState(null)
    const [fields, setFields] = useState(null);
    const [tabValue, setTabValue] = useState(0);

    useEffect(() => {
        if (id) {
            fetchFields();
            fetchData();
        }
    }, [id]);

    const fetchFields = async () => {
        axiosInstance().get('/field?resource=Deals').then(({ data: { data } }) => {
            setFields(data?.filter((field) => field.isRead));
        })
            .catch((err) => {
                toastConfig.setToastConfig(err);
            });
    };

    const fetchData = async () => {
        axiosInstance().get(`${routes.deals.path}/${id}`).then(({ data: { data } }) => {
            setDealData(data);
        })
            .catch((err) => {
                toastConfig.setToastConfig(err);
            });
    };

    const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
        setTabValue(newValue);
    };

    return (
        <Box className="main-container-v1">
            <Box className="headerbox-v1">
                <Box className="nav-v1">
                    <CustomBreadCrumbs routes={[routes.deals, { title: dealData?.dealname }]} />
                </Box>
                <Box className="controls-v1">
                    <Box className="control-buttons-v1">
                        <ActivityButton referenceId={dealData?._id} resource={camelCase(sidebarResource.deals)} resourceLabel={dealData?.dealname} />
                    </Box>
                </Box>
            </Box>
            <Box className="detail-container-v1">
                <Tabs
                    className="new-tab-container-v1"
                    value={tabValue}
                    onChange={handleMainTabChange}
                    textColor="primary"
                    TabIndicatorProps={{
                        style: {
                            height: 0
                        }
                    }}
                >
                    <Tab
                        className={'tabLayout'}
                        label={
                            <div className="d-flex align-items-center tab-font">
                                <FaWpforms className="mr-1" fontSize="inherit" /> Header
                            </div>
                        }
                        value={0}
                        aria-controls="a11y-tabpanel-0"
                        id="a11y-tab-0"
                    />
                    {/* <Tab
                        className={'tabLayout'}
                        label={
                            <div className="d-flex align-items-center tab-font">
                                <BiFoodMenu className="mr-1" fontSize="inherit" /> Material
                            </div>
                        }
                        value={1}
                        aria-controls="a11y-tabpanel-1"
                        id="a11y-tab-1"
                    /> */}
                    <Tab
                        className={'tabLayout'}
                        label={
                            <div className="d-flex align-items-center tab-font">
                                <BiFoodMenu className="mr-1" fontSize="inherit" /> {routes.units.title}
                            </div>
                        }
                        value={2}
                        aria-controls="a11y-tabpanel-2"
                        id="a11y-tab-2"
                    />
                </Tabs>
                <TabPanel value={tabValue} index={0}>
                    <Box>
                        {dealData && fields ? (
                            <DetailsPage data={dealData} fields={fields} />
                        ) : (
                            <Grid container spacing={2} style={{ padding: '8px' }}>
                                <CommonSkeleton lenArray={[...Array(7).keys()]} />
                            </Grid>
                        )}
                    </Box>
                </TabPanel>
                <TabPanel value={tabValue} index={1}>
                    <Material dealId={id} />
                </TabPanel>
                <TabPanel value={tabValue} index={2}>
                    <Units dealData={dealData} />
                </TabPanel>
            </Box>
        </Box>
    );
};

export default DealDetail;
