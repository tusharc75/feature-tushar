import { Box, Grid, IconButton, Typography, useMediaQuery } from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import { useData } from 'src/StateProvider/Provider';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import Request from './Request';
import RefreshIcon from '@material-ui/icons/Refresh';
import { sidebarResource } from 'src/constants/helpers';
import CustomFilter from 'src/components/Helpers/CustomFilter';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { FiExternalLink } from 'react-icons/fi';
import axios, { CancelTokenSource } from 'axios';
import MobileDialog from 'src/pages/MaterialHandling/Request/MobileDialog';

const MaterialHandling = () => {
  const toastConfig = useContext(CustomToastContext);
  const isMobile = useMediaQuery('(max-width: 960px)');

  const {
    state: { user, selectedEntity, resources }
  }: any = useData();

  const [filterQuery, setFilterQuery] = useState({
    filterById: [],
    deepFilter: []
  });

  const [workOrder, setWorkOrder] = useState(null);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
  const [warehouseOptions, setWarehouseOptions] = useState(null);

  useEffect(() => {
    axiosInstance()
      .get('/sa-formbuilder/lookup?lookupResource=Warehouse')
      .then(({ data: { data } }) => {
        const warehouses: any = [];
        if (data['Warehouse'] && data['Warehouse']?.length) {
          data['Warehouse']?.forEach((ele) => {
            if (
              (ele?.manager && ele?.manager?.includes(user?.user?._id)) ||
              (ele?.materialHandlers && ele?.materialHandlers?.includes(user?.user?._id))
            ) {
              warehouses.push(ele);
            }
          });
        }
        setWarehouseOptions([...warehouses]);
      });
  }, [selectedEntity]);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [filterQuery, warehouseOptions]);

  const getQueryString = () => {
    let filter = `?`;
    const { deepFilter, filterById } = filterQuery;
    if (filterById?.length) {
      filter = `${filter}&filterById=${JSON.stringify(filterById)}`;
    }
    if (deepFilter?.length) {
      filter = `${filter}&deepFilter=${encodeURIComponent(JSON.stringify(deepFilter))}`;
    }
    if (filterById?.length || deepFilter?.length) {
      filter = `${filter}&filterType=and`;
    }
    return filter;
  };

  const fetchData = (cancelTokenSource?: CancelTokenSource) => {
    setWorkOrder(null);
    setSelectedWorkOrder(null);
    let api = `/material-handling`;
    const query = getQueryString();

    axiosInstance()
      .get(`${api}${query}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data } }) => {
        setWorkOrder(data);
        if (data?.length && !isMobile) {
          setSelectedWorkOrder(data[0]);
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const FIELD_TO_FILTER = [
    {
      fieldName: '_id',
      fieldLabel: resources?.workOrder?.titlePlural,
      resource: sidebarResource.workOrder,
      type: 'dropDown'
    },
    {
      fieldName: 'warehouse',
      fieldLabel: resources?.warehouse?.titlePlural,
      resource: sidebarResource.warehouse,
      type: 'dropDown'
    },
    {
      fieldName: 'serializedAsset',
      fieldLabel: resources?.serializedAsset?.titlePlural,
      resource: sidebarResource.serializedAsset,
      type: 'dropDown'
    },
    {
      fieldName: 'productCategory',
      fieldLabel: resources?.productCategory?.titlePlural,
      resource: sidebarResource.productCategory,
      type: 'dropDown'
    },
    {
      fieldName: 'product',
      fieldLabel: resources?.product?.titlePlural,
      resource: sidebarResource.product,
      type: 'dropDown'
    },
    {
      fieldName: 'createDate',
      fieldLabel: 'Create Date',
      type: 'date'
    }
    // {
    //   fieldName: 'requestDate',
    //   fieldLabel: 'Request Date',
    //   type: 'date'
    // },
  ];

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[{ title: routes.materialHandling.title }]} />
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <Box display={'flex'} justifyContent={'end'} alignItems={'center'} pb={2}>
          <Box width={'100%'}>
            <CustomFilter
              field={FIELD_TO_FILTER?.map((e: any) => {
                return { ...e, options: e.fieldName === 'warehouse' ? warehouseOptions : null };
              })}
              setFilterQuery={setFilterQuery}
            />
          </Box>
          <Box mb={1} ml={1}>
            <HtmlTooltip title="Refresh">
              <IconButton size="small" onClick={() => fetchData()}>
                <RefreshIcon />
              </IconButton>
            </HtmlTooltip>
          </Box>
        </Box>
        {workOrder ? (
          workOrder?.length > 0 ? (
            <Grid container spacing={2}>
              <Grid item xs={12} md={4} lg={3}>
                <Box className="container-with-border" p={2}>
                  <Box style={{ maxHeight: isMobile ? 'calc(100vh - 100px)' : 'calc(100vh - 220px)', overflow: 'auto' }}>
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
                              border: selectedWorkOrder === data ? '2.5px solid var(--new_theme_color)' : '1px solid var(--common-border-color)',
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
                                {data?.referenceType} :{' '}
                                <span style={{ color: 'var(--card-color-secondary)' }}>
                                  {data?.referenceType === sidebarResource.workOrder
                                    ? data?.workOrderNumber
                                    : data?.referenceType === sidebarResource.fieldTicket
                                      ? data?.fieldTicketNumber
                                      : ''}
                                </span>
                              </Typography>
                              <Box pl={1}>
                                <IconButton
                                  onClick={() => {
                                    let route;
                                    if (data?.referenceType === sidebarResource.workOrder) {
                                      route = routes?.workOrderDetail?.path;
                                    } else if (data?.referenceType === sidebarResource.fieldTicket) {
                                      route = routes.fieldTicketDetail.path;
                                    }
                                    window.open(`${route}/${data?._id}`);
                                  }}
                                  aria-label="delete"
                                  size="small"
                                >
                                  <FiExternalLink fontSize="inherit" style={{ width: '24', height: '24', color: 'var(--new_theme_color)' }} />
                                </IconButton>
                              </Box>
                            </Box>
                            {data?.referenceType === sidebarResource.workOrder && (
                              <>
                                <Typography variant="body2" style={{ color: 'var(--card-color-primary)', marginBottom: 8, fontWeight: 600 }}>
                                  Product :{' '}
                                  <span style={{ color: 'var(--card-color-secondary)', fontWeight: 500 }}>{data?.product?.optionLabel}</span>
                                </Typography>
                                <Typography variant="body2" style={{ color: 'var(--card-color-primary)', marginBottom: 8, fontWeight: 600 }}>
                                  Asset :{' '}
                                  <span style={{ color: 'var(--card-color-secondary)', fontWeight: 500 }}>{data?.serializedAsset?.optionLabel}</span>
                                </Typography>
                              </>
                            )}
                            {data?.referenceType === sidebarResource.fieldTicket && (
                              <>
                                <Typography variant="body2" style={{ color: 'var(--card-color-primary)', marginBottom: 8, fontWeight: 600 }}>
                                  Customer :{' '}
                                  <span style={{ color: 'var(--card-color-secondary)', fontWeight: 500 }}>{data?.customerAccount?.optionLabel}</span>
                                </Typography>
                                <Typography variant="body2" style={{ color: 'var(--card-color-primary)', marginBottom: 8, fontWeight: 600 }}>
                                  Well Name :{' '}
                                  <span style={{ color: 'var(--card-color-secondary)', fontWeight: 500 }}>{data?.wellName?.optionLabel}</span>
                                </Typography>
                              </>
                            )}
                            <Typography variant="body2" style={{ color: 'var(--card-color-primary)', fontWeight: 600 }}>
                              {resources?.warehouse?.titleSingular} :{' '}
                              <span style={{ color: 'var(--card-color-secondary)', fontWeight: 500 }}>{data?.warehouse?.optionLabel}</span>
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={8} lg={filterQuery?.filterById?.findIndex((f) => f?.field === '_id') === -1 ? 9 : 12}>
                {selectedWorkOrder && (
                  <>
                    {isMobile ? (
                      <>
                        <MobileDialog onClose={() => setSelectedWorkOrder(null)}>
                          <Request
                            referenceId={selectedWorkOrder?._id}
                            fetchDataMaster={fetchData}
                            referenceType={selectedWorkOrder?.referenceType}
                            isMobile={isMobile}
                          />
                        </MobileDialog>
                      </>
                    ) : (
                      <Box className="container-with-border " p={3}>
                        <Request referenceId={selectedWorkOrder?._id} fetchDataMaster={fetchData} referenceType={selectedWorkOrder?.referenceType} />
                      </Box>
                    )}
                  </>
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
