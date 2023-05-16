import { Box, Grid, Typography } from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import { useData } from 'src/StateProvider/Provider';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import Request from './Request';

const MaterialHandling = () => {

  const toastConfig = useContext(CustomToastContext);
  
  const { state: { permissions, selectedEntity, user } }: any = useData();

  const [workOrder, setWorkOrder] = useState(null);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setWorkOrder(null);
    axiosInstance()
      .get(`/material-handling`)
      .then(({ data: { data } }) => {
        setWorkOrder(data)
        if (data?.length) {
          setSelectedWorkOrder(data[0])
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[{ title: routes.materialHandling.title }]} />
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        {workOrder ? (
          <Grid container spacing={2}>
            <Grid item xs={12} md={3} sm={12}>
              {workOrder?.map((data, index) => {
                return (
                  <Box mb={2} key={index}
                    onClick={() => {
                      setSelectedWorkOrder(data);
                    }}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: selectedWorkOrder === data ? '#298b88' : 'white',
                      color: selectedWorkOrder === data ? 'white' : 'black',
                      border: '1px solid #ebebeb'
                    }}
                  >
                    <Box p={2}>
                      <Typography>{`Work Order : ${data?.workOrderNumber}`}</Typography>
                      <Typography>{`Product : ${data?.product?.optionLabel}`}</Typography>
                      <Typography>{`Asset : ${data?.serializedAsset?.optionLabel}`}</Typography>
                      <Typography>{`${routes.warehouse.title} : ${data?.warehouse?.optionLabel}`}</Typography>
                    </Box>
                  </Box>
                );
              })}
            </Grid>
            <Grid item xs={12} md={9} sm={12}>
              {selectedWorkOrder && (
                <Box style={{ border: '1px solid #ebebeb' }}  >
                  <Request workOrder={selectedWorkOrder?._id} />
                </Box>
              )}
            </Grid>
          </Grid>
        ) : (
          <Box p={2} height={500} bgcolor="white">
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MaterialHandling;
