import { Box, Grid, IconButton, Tab, Tabs, TextField, Typography } from '@material-ui/core';
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
import { Link } from 'react-router-dom';
import TabPanel from 'src/components/TabPanel';
import Consumables from '../WorkOrder/Consumables';

const MaterialHandling = () => {
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { permissions, selectedEntity, user }
  }: any = useData();

  const [workOrder, setWorkOrder] = useState(null);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
  const [plantOptions, setPlantOptions] = useState([]);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [tabValue, setTabValue] = useState<any>(0);

  useEffect(() => {
    axiosInstance()
      .get('/sa-formbuilder/lookup?lookupResource=Warehouse')
      .then(({ data: { data } }) => {
        setPlantOptions(data.Warehouse);
      });
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedPlant]);

  const fetchData = () => {
    setWorkOrder(null);
    setSelectedWorkOrder(null);
    let api = `/material-handling`;
    if (selectedPlant) {
      api = `${api}?filterById=${JSON.stringify([{ field: 'warehouse', term: selectedPlant.optionValue }])}&filterType=and`;
    }
    axiosInstance()
      .get(api)
      .then(({ data: { data } }) => {
        setWorkOrder(data);
        if (data?.length) {
          setSelectedWorkOrder(data[0]);
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
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
                value={
                  plantOptions.filter((data) => data.optionValue === selectedPlant?.optionValue).length
                    ? plantOptions.filter((data) => data.optionValue === selectedPlant?.optionValue)[0]
                    : ''
                }
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
                  <Box
                    mb={2}
                    key={index}
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
                <Box
                  style={{
                    border: '1px solid #D3D3D3',
                    borderTop: 'none'
                  }}
                >
                  <Tabs
                    className="new-tab-container-v1"
                    value={tabValue}
                    onChange={handleMainTabChange}
                    textColor="primary"
                    TabIndicatorProps={{
                      style: {
                        display: 'none'
                      }
                    }}
                  >
                    <Tab
                      className={'tabLayout'}
                      label={
                        <div className="d-flex align-items-center tab-font">
                          {/* <FaWpforms className="mr-1" fontSize="inherit" /> */}
                          Field Ticket
                        </div>
                      }
                      {...a11yProps(0)}
                    />
                    <Tab
                      className={'tabLayout'}
                      label={
                        <div className="d-flex align-items-center tab-font">
                          {/* <BiFoodMenu className="mr-1" fontSize="inherit" /> */}
                          Consumables
                        </div>
                      }
                      {...a11yProps(1)}
                    />
                  </Tabs>
                  <TabPanel value={tabValue} index={0}>
                    <Box>
                      <Request workOrder={selectedWorkOrder?._id} />
                    </Box>
                  </TabPanel>
                  <TabPanel value={tabValue} index={1}>
                    <Box>
                      <Consumables
                        allowedToEdit={true}
                        isCreate={false}
                        workOrderId={selectedWorkOrder?._id}
                        warehouse={selectedWorkOrder?.warehouse?.optionValue}
                        service={null}
                        uniqueId={null}
                        stepId={null}
                        serviceName={null}
                      />
                    </Box>
                  </TabPanel>
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
