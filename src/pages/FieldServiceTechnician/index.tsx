import { Box, Button, Grid, IconButton, Menu, MenuItem, Paper, Typography } from '@material-ui/core';
import { Fragment, useContext, useEffect, useReducer, useState } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import { useData } from 'src/StateProvider/Provider';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import FieldTicket from './FieldTicket';


const FieldServiceTechnician = () => {

  const toastConfig = useContext(CustomToastContext);
  const { state: { permissions, selectedEntity, user } }: any = useData();

  const [fieldService, setFieldService] = useState(null);
  const [selectedFieldService, setSelectedFieldService] = useState(null);

  useEffect(() => {
    fetchData()
  }, []);

  const fetchData = () => {
    axiosInstance().get(`/field-service-technician`)
      .then(({ data: { data } }) => {
        setFieldService(data?.data)
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[{ title: routes.fieldServiceTechnician.title }]} />
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        {fieldService ?
          <Grid container spacing={2}>
            <Grid item xs={12} md={4} sm={12}>
              {fieldService?.map((data, index) => {
                return <Box
                  mb={2}
                  key={index} onClick={() => {
                    setSelectedFieldService(data)
                  }}
                  style={{
                    cursor: "pointer",
                    backgroundColor: selectedFieldService === data ? "#298b88" : "white",
                    color: selectedFieldService === data ? "white" : "black",
                    border: "1px solid #D3D3D3"
                  }}
                >
                  <Box p={3}>
                    <Typography>{data?.serviceOrderNumber}</Typography>
                  </Box>
                </Box>;
              })}
            </Grid>
            <Grid item xs={12} md={8} sm={12}>
              {selectedFieldService &&
                <Box
                  style={{
                    border: "1px solid #D3D3D3"
                  }}>
                  <FieldTicket selectedFieldService={selectedFieldService} />
                </Box>}
            </Grid>
          </Grid> :
          <Box p={2} height={500} bgcolor="white">
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>}
      </Box>
    </Box>
  );
};

export default FieldServiceTechnician;
