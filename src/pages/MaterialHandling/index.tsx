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
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import queryString from 'query-string';
import { useHistory } from 'react-router-dom';

const MaterialHandling = () => {
  const toastConfig = useContext(CustomToastContext);

  const history = useHistory();

  const {
    state: { permissions, selectedEntity, user }
  }: any = useData();

  const { workOrder: workOrderId } = queryString.parse(window.location.search);

  const [workOrder, setWorkOrder] = useState(null);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);

  const [warehouseOptions, setWarehouseOptions] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);

  const [workOrderOptions, setWorkOrderOptions] = useState([]);
  const [selectedOptionWorkOrder, setSelectedOptionWorkOrder] = useState(null);

  useEffect(() => {
    axiosInstance()
      .get('/sa-formbuilder/lookup?lookupResource=Warehouse')
      .then(({ data: { data } }) => {
        const warehouses: any = [];
        if (data['Warehouse'] && data['Warehouse']?.length) {
          data['Warehouse']?.forEach((ele) => {
            if (ele?.manager && ele?.manager?.includes(user?.user?._id)) {
              warehouses.push(ele);
            }
          });
        }
        setWarehouseOptions(warehouses);
      });
  }, []);

  useEffect(() => {
    if (warehouseOptions && warehouseOptions?.length) {
      fetchData();
    } else {
      setWorkOrder([]);
    }
  }, [selectedWarehouse, warehouseOptions]);

  const fetchData = () => {
    setWorkOrder(null);
    setSelectedWorkOrder(null);
    setWorkOrderOptions([]);
    setSelectedOptionWorkOrder(null);
    let api = `/material-handling`;
    const filterById: any = [];
    if (selectedWarehouse) {
      filterById.push({ field: 'warehouse', term: selectedWarehouse.optionValue });
    } else {
      filterById.push({ field: 'warehouse', term: { $in: warehouseOptions?.map((e) => e?.optionValue) } });
    }
    api = `${api}?filterById=${JSON.stringify(filterById)}&filterType=and`;
    axiosInstance()
      .get(api)
      .then(({ data: { data } }) => {
        setWorkOrder(data);
        if (data?.length) {
          setSelectedWorkOrder(data[0]);
          const workOrders: any = [];
          data?.forEach((e) => {
            workOrders.push({ optionLabel: e.workOrderNumber, optionValue: e._id });
          });
          setWorkOrderOptions(workOrders);
          if (workOrderId && workOrders?.find((e) => e.optionValue === workOrderId)) {
            setSelectedOptionWorkOrder(workOrders?.find((e) => e.optionValue === workOrderId));
          }
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
        <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'} gridGap={8} pb={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Autocomplete
                options={warehouseOptions}
                fullWidth
                getOptionLabel={(option: any) => option.optionLabel}
                getOptionSelected={(option: any, value: any) => option.optionValue === value.optionValue}
                value={
                  warehouseOptions.filter((data) => data.optionValue === selectedWarehouse?.optionValue).length
                    ? warehouseOptions.filter((data) => data.optionValue === selectedWarehouse?.optionValue)[0]
                    : ''
                }
                onChange={(e, val) => {
                  setSelectedWarehouse(val);
                }}
                size="small"
                renderInput={(params) => <TextField {...params} label={routes.warehouse.title} variant="outlined" />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Autocomplete
                options={workOrderOptions}
                fullWidth
                getOptionLabel={(option: any) => option.optionLabel}
                getOptionSelected={(option: any, value: any) => option.optionValue === value.optionValue}
                value={
                  workOrderOptions.filter((data) => data.optionValue === selectedOptionWorkOrder?.optionValue).length
                    ? workOrderOptions.filter((data) => data.optionValue === selectedOptionWorkOrder?.optionValue)[0]
                    : ''
                }
                onChange={(e, val) => {
                  setSelectedOptionWorkOrder(val);
                  if (val) {
                    setSelectedWorkOrder(workOrder?.find((e) => e._id === val?.optionValue));
                  } else {
                    if (workOrder?.length) {
                      setSelectedWorkOrder(workOrder[0]);
                    }
                  }
                  if(workOrderId){
                    history.push(routes.materialHandling.path)
                  }
                }}
                size="small"
                renderInput={(params) => <TextField {...params} label={routes.workOrder.title} variant="outlined" />}
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
          workOrder?.length > 0 ? (
            <Grid container spacing={2}>
              {!selectedOptionWorkOrder && (
                <Grid item xs={12} lg={3}>
                  <Box className="container-with-border" p={2}>
                    <Box style={{ height: 'calc(100vh - 220px)', overflow: 'auto' }}>
                      {workOrder?.map((data, index) => {
                        return (
                          <Box
                            mb={2}
                            key={index}
                            onClick={() => {
                              setSelectedWorkOrder(data);
                            }}
                            style={
                              {
                                cursor: 'pointer',
                                backgroundColor: 'var(--dark-secondary, white)',
                                '--card-color-primary': 'var(--dark-primary-text, #2A3042)',
                                '--card-color-secondary': 'var(--dark-secondary-text, #5B5B5B)',
                                border: selectedWorkOrder === data ? '2px solid var(--new_theme_color)' : '1px solid var(--common-border-color)',
                                borderRadius: '8px'
                              } as React.CSSProperties
                            }
                          >
                            <Box p={2}>
                              <Box display="flex">
                                <Typography
                                  variant="subtitle2"
                                  style={{ color: 'var(--card-color-primary)', fontSize: 15, marginBottom: 8, fontWeight: 600 }}
                                >
                                  Work Order : <span style={{ color: 'var(--card-color-secondary)' }}>{data?.workOrderNumber}</span>
                                </Typography>
                                <Box pl={1}>
                                  <IconButton
                                    onClick={() => {
                                      window.open(`${routes.workOrderDetail.path}/${data?._id}`);
                                    }}
                                    aria-label="delete"
                                    size="small"
                                  >
                                    <OpenInNewIcon fontSize="inherit" style={{ width: '24', height: '24' }} />
                                  </IconButton>
                                </Box>
                              </Box>
                              <Typography variant="body2" style={{ color: 'var(--card-color-primary)', marginBottom: 8, fontWeight: 600 }}>
                                Product : <span style={{ color: 'var(--card-color-secondary)', fontWeight: 500 }}>{data?.product?.optionLabel}</span>
                              </Typography>
                              <Typography variant="body2" style={{ color: 'var(--card-color-primary)', marginBottom: 8, fontWeight: 600 }}>
                                Asset :{' '}
                                <span style={{ color: 'var(--card-color-secondary)', fontWeight: 500 }}>{data?.serializedAsset?.optionLabel}</span>
                              </Typography>
                              <Typography variant="body2" style={{ color: 'var(--card-color-primary)', fontWeight: 600 }}>
                                {routes.warehouse.title} :{' '}
                                <span style={{ color: 'var(--card-color-secondary)', fontWeight: 500 }}>{data?.warehouse?.optionLabel}</span>
                              </Typography>
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                </Grid>
              )}
              <Grid item xs={12} lg={selectedOptionWorkOrder ? 12 : 9}>
                {selectedWorkOrder && (
                  <Box className="container-with-border " p={3}>
                    <Request workOrder={selectedWorkOrder?._id} />
                  </Box>
                )}
              </Grid>
            </Grid>
          ) : (
            <Box style={{ minHeight: 'calc(100vh - 349px)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Typography>No Request Pending !</Typography>
            </Box>
          )
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MaterialHandling;
