import { Box } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { camelCase } from 'lodash';
import React, { useContext, useEffect, useState } from 'react';
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
import { useData } from 'src/StateProvider/Provider';

const DealDetail = () => {
  const { id } = useParams();
  const toastConfig = useContext(CustomToastContext);

  const [dealData, setDealData] = useState(null);
  const [fields, setFields] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  const {
    state: { resources }
  }: any = useData();

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
          <CustomBreadCrumbs routes={[{ ...routes.deals, title: resources?.deals?.titlePlural }, { title: dealData?.dealname }]} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            <ActivityButton referenceId={dealData?._id} resource={camelCase(sidebarResource.deals)} resourceLabel={dealData?.dealname} />
          </Box>
        </Box>
      </Box>
      <Box className="detail-container-v1">
        <CustomTabs value={tabValue} onChange={handleMainTabChange}>
          <CustomTab value={0}>Header</CustomTab>
          <CustomTab value={2}>{resources?.units?.titlePlural}</CustomTab>
        </CustomTabs>
        <TabPanel value={tabValue} index={0}>
          <Box>
            {dealData && fields ? (
              <DetailsPage data={dealData} fields={fields} />
            ) : (
              <div className="p-2">
                <CommonSkeleton lenArray={[...Array(10).keys()]} />
              </div>
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
