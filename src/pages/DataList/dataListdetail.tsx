import { Box, Grid, Tab, Tabs  } from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import { useParams } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import DataListItems from './DataListItems';
import axiosInstance from 'src/axios/axiosInstance';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { FaWpforms } from 'react-icons/fa';
import TabPanel from '../../components/TabPanel';

const DataListDetail = () => {
  const { id } = useParams();
  const toastConfig = useContext(CustomToastContext);
  const [dataListData, setDataListData] = useState(null);
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([routes.dataList]);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };


  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`${routes.dataList.path}/${id}`);
      setDataListData(data);
      setCustomizedRoutes([routes.dataList, { title: data?.title }]);
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Box>
      </Box>
      <Box className={'detail-container-v1'}>
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
                <FaWpforms className="mr-1" fontSize="inherit" /> Data List Items
              </div>
            }
            value={0}
            aria-controls="a11y-tabpanel-0"
            id="a11y-tab-0"
          />
        </Tabs>
        <TabPanel value={tabValue} index={0}>
          {loading ? (
          <Grid container spacing={2} style={{ padding: '8px' }}>
            <CommonSkeleton lenArray={[...Array(13).keys()]} />
          </Grid>
        ) : (
          <DataListItems dataListId={id} />
        )}
        </TabPanel>  
      </Box>
    </Box>
  );
};

export default DataListDetail;
