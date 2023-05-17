import { Box, Grid, IconButton, TextField, Typography } from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import { useData } from 'src/StateProvider/Provider';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import Request from './Request';
import RefreshIcon from '@material-ui/icons/Refresh';
import { Autocomplete } from '@material-ui/lab';
import { Link } from 'react-router-dom'

const MaterialHandling = () => {

  const toastConfig = useContext(CustomToastContext);

  const { state: { permissions, selectedEntity, user } }: any = useData();

  const [workOrder, setWorkOrder] = useState(null);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
  const [plantOptions, setPlantOptions] = useState([]);
  const [selectedPlant, setSelectedPlant] = useState(null)

  useEffect(() => {
    axiosInstance()
      .get('/sa-formbuilder/lookup?lookupResource=Warehouse')
      .then(({ data: { data } }) => {
        setPlantOptions(data.Warehouse);
      });
  }, [])

  useEffect(() => {
    fetchData();
  }, [selectedPlant]);

  const fetchData = () => {
    setWorkOrder(null);
    setSelectedWorkOrder(null)
    let api = `/material-handling`;
    if (selectedPlant) {
      api = `${api}?filterById=${JSON.stringify([{ field: 'warehouse', term: selectedPlant.optionValue }])}&filterType=and`;
    }
    axiosInstance().get(api).then(({ data: { data } }) => {
      setWorkOrder(data)
      if (data?.length) {
        setSelectedWorkOrder(data[0])
      }
    }).catch((error) => {
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
        <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'} gridGap={8} pb={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Autocomplete
                options={plantOptions}
                fullWidth
                getOptionLabel={(option: any) => option.optionLabel}
                getOptionSelected={(option: any, value: any) => option.optionValue === value.optionValue}
                value={plantOptions.filter((data) => data.optionValue === selectedPlant?.optionValue).length ? plantOptions.filter((data) => data.optionValue === selectedPlant?.optionValue)[0] : ''}
                onChange={(e, val) => {
                  setSelectedPlant(val);
                }}
                size="small"
                renderInput={(params) => <TextField {...params} label={routes.warehouse.title} variant="outlined" />}
              />
            </Grid>
          </Grid>
          <Box>
            <IconButton size="small" onClick={() => fetchData()}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>
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
