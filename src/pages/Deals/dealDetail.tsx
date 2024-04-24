import { Box, Grid } from '@material-ui/core';
import { camelCase } from 'lodash';
import React, { useContext, useEffect, useState } from 'react';
import { BiFoodMenu } from 'react-icons/bi';
import { FaWpforms } from 'react-icons/fa';
import { useParams } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import ActivityButton from 'src/components/Activity/ActivityButton';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import routes from 'src/components/Helpers/Routes';
import { sidebarResource } from 'src/constants/helpers';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import DetailsPage from '../../components/Shared/DetailsPage';
import Material from './Material';
import Units from './Units';

const DealDetail = () => {
  const { id } = useParams();
  const toastConfig = useContext(CustomToastContext);

  const [dealData, setDealData] = useState(null);
  const [fields, setFields] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (id) {
      fetchFields();
      fetchData();
    }
  }, [id]);

  const fetchFields = async () => {
    axiosInstance()
      .get('/field?resource=Deals')
      .then(({ data: { data } }) => {
        setFields(data?.filter((field) => field.isRead));
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchData = async () => {
    axiosInstance()
      .get(`${routes.deals.path}/${id}`)
      .then(({ data: { data } }) => {
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
        <CustomTabs value={tabValue} onChange={handleMainTabChange}>
          <CustomTab index={0}>
            <FaWpforms className="mr-1" fontSize="inherit" /> Header
          </CustomTab>
          {/* <CustomTab
                        index={1}
                    ><BiFoodMenu className="mr-1" fontSize="inherit" /> Material</CustomTab> */}
          <CustomTab index={2}>
            <BiFoodMenu className="mr-1" fontSize="inherit" /> {routes.units.title}
          </CustomTab>
        </CustomTabs>
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
