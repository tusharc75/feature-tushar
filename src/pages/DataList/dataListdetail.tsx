import { Box, Grid } from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import DataListItems from './DataListItems';
import { useData } from 'src/StateProvider/Provider';

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

  const {
    state: { resources }
  }: any = useData();

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
      setCustomizedRoutes([{...routes.dataList,title:resources.dataLists.titleSingular}, { title: data?.title }]);
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
        <CustomTabs value={tabValue} onChange={handleMainTabChange}>
          <CustomTab value={0}>
            Data List Items
          </CustomTab>
        </CustomTabs>
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
