import { Box, Grid } from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import { useParams } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import DataListItems from './DataListItems';
import axiosInstance from 'src/axios/axiosInstance';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

const DataListDetail = () => {
  const { id } = useParams();
  const toastConfig = useContext(CustomToastContext);
  const [dataListData, setDataListData] = useState(null);
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([routes.dataList]);
  const [loading, setLoading] = useState(false);

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
      <Box>
        {loading ? (
          <Grid container spacing={2} style={{ padding: '8px' }}>
            <CommonSkeleton lenArray={[...Array(13).keys()]} />
          </Grid>
        ) : (
          <DataListItems dataListId={id} />
        )}
      </Box>
    </Box>
  );
};

export default DataListDetail;
