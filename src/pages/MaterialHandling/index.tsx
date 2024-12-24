import { Box, Grid, IconButton, Typography, useMediaQuery } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import { useData } from 'src/StateProvider/Provider';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import Request from './Request';
import RefreshIcon from '@mui/icons-material/Refresh';
import { sidebarResource } from 'src/constants/helpers';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { FiExternalLink } from 'react-icons/fi';
import axios from 'axios';
import MobileDialog from 'src/pages/MaterialHandling/Request/MobileDialog';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { BiFilterAlt } from 'react-icons/bi';
import DisplayFilterChip from 'src/pages/Reports/tables/DisplayFilterChip';
import Filter from 'src/components/Filter';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';
import { isEmpty } from 'lodash';

let cancelTokenSource = null;

const MaterialHandling = () => {
  const toastConfig = useContext(CustomToastContext);
  const isMobile = useMediaQuery('(max-width: 960px)');

  const {
    state: { user, selectedEntity, resources }
  }: any = useData();

  const [showFilter, setShowFilter] = useState(false);
  const [deepFilters, setDeepFilters] = useState([]);
  const [filterByIds, setFilterByIds] = useState([]);
  const [filterTerm, setFilterTerm] = useState({});
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
    fetchData();
  }, [warehouseOptions]);

  const getQueryString = (deepFiltersP = deepFilters, filterByIdsP = filterByIds) => {
    let filter = `?`;
    if (filterByIdsP?.length > 0) {
      const filterById = filterByIdsP
        ?.filter((f) => {
          if (typeof f?.term === 'object') return !isEmpty(f?.term);
          return Array.isArray(f?.term) && f?.term?.length > 0;
        })
        ?.map((f) => {
          const term = filterTerm[f?.field] === '$nin' ? '$nin' : '$in';
          if (Array.isArray(f?.term)) {
            return {
              field: f?.field,
              term: {
                [term]: f?.term?.map?.((d: any) => d.optionValue)
              }
            };
          }
          if (term === '$nin') {
            return {
              field: f?.field,
              term: {
                ['$nin']: [f?.term?.optionValue]
              }
            };
          }
          return {
            field: f?.field,
            term: f?.term?.optionValue
          };
        });
      if (filterById?.length > 0) {
        filter = `${filter}filterById=${JSON.stringify(filterById)}&`;
      }
    }

    let deepFilter = [];

    if (deepFiltersP?.length > 0) {
      deepFilter = [
        ...deepFilter,
        ...deepFiltersP
          ?.filter((d) => d?.term?.length && !['from_createDate', 'to_createDate']?.includes(d?.field))
          ?.map((d) => {
            if (filterTerm[d?.field] === '$nin' && Array.isArray(d?.term)) {
              return {
                ...d,
                term: { $nin: d?.term }
              };
            }
            return d;
          })
      ];
    }

    if (
      deepFiltersP?.length > 0 &&
      (deepFiltersP?.some((f) => f?.field === 'from_createDate') || deepFiltersP?.some((f) => f?.field === 'to_createDate'))
    ) {
      deepFilter.push({
        field: 'createdate',
        term: {
          from: deepFiltersP?.find((f) => f?.field === 'from_createDate')?.term,
          to: deepFiltersP?.find((f) => f?.field === 'to_createDate')?.term
        }
      });
    }

    if (deepFilter?.length) {
      filter = `${filter}&deepFilter=${encodeURIComponent(JSON.stringify(deepFilter))}`;
    }

    filter = `${filter}&filterType=and`;
    return filter;
  };

  const fetchData = (deepFiltersP = deepFilters, filterByIdsP = filterByIds) => {
    setWorkOrder(null);
    setSelectedWorkOrder(null);
    let api = `/material-handling`;
    const query = getQueryString(deepFiltersP, filterByIdsP);

    if (cancelTokenSource) {
      cancelTokenSource.cancel();
    }
    cancelTokenSource = axios.CancelToken.source();

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
      fieldData: {
        _id: '630dc2429ec41869052396b1',
        fieldName: '_id',
        fieldLabel: resources?.workOrder?.titlePlural,
        lookup: true,
        lookupResource: sidebarResource.workOrder,
        resource: sidebarResource.materialHandling,
        type: 'dropDown',
        order: 0,
        required: false,
        sectionName: 'Material Handeling Filter',
        isTooltip: false,
        editAble: false,
        brand: user?.user?.brand,
        roleType: 0,
        sectionProperties: ''
      },
      isRead: true,
      isCreate: true,
      isUpdate: true
    },
    {
      fieldData: {
        _id: '630dc2429ec41869052396b2',
        fieldName: 'warehouse',
        fieldLabel: resources?.warehouse?.titlePlural,
        lookup: true,
        lookupResource: sidebarResource.warehouse,
        resource: sidebarResource.materialHandling,
        type: 'dropDown',
        order: 1,
        required: false,
        multiple: false,
        customOptions: warehouseOptions,
        sectionName: 'Material Handeling Filter',
        isTooltip: false,
        editAble: false,
        brand: user?.user?.brand,
        roleType: 0,
        sectionProperties: ''
      },
      isRead: true,
      isCreate: true,
      isUpdate: true
    },
    {
      fieldData: {
        _id: '630dc2429ec41869052396b3',
        fieldName: 'serializedAsset',
        fieldLabel: resources?.serializedAsset?.titlePlural,
        lookup: true,
        lookupResource: sidebarResource.serializedAsset,
        resource: sidebarResource.materialHandling,
        type: 'dropDown',
        order: 2,
        required: false,
        sectionName: 'Material Handeling Filter',
        isTooltip: false,
        editAble: false,
        brand: user?.user?.brand,
        roleType: 0,
        sectionProperties: ''
      },
      isRead: true,
      isCreate: true,
      isUpdate: true
    },
    {
      fieldData: {
        _id: '630dc2429ec41869052396b4',
        fieldName: 'productCategory',
        fieldLabel: resources?.productCategory?.titlePlural,
        lookup: true,
        lookupResource: sidebarResource.productCategory,
        resource: sidebarResource.materialHandling,
        type: 'dropDown',
        order: 3,
        required: false,
        sectionName: 'Material Handeling Filter',
        isTooltip: false,
        editAble: false,
        brand: user?.user?.brand,
        roleType: 0,
        sectionProperties: ''
      },
      isRead: true,
      isCreate: true,
      isUpdate: true
    },
    {
      fieldData: {
        _id: '630dc2429ec41869052396b5',
        fieldName: 'product',
        fieldLabel: resources?.product?.titlePlural,
        lookup: true,
        lookupResource: sidebarResource.product,
        resource: sidebarResource.materialHandling,
        type: 'dropDown',
        order: 4,
        required: false,
        sectionName: 'Material Handeling Filter',
        isTooltip: false,
        editAble: false,
        brand: user?.user?.brand,
        roleType: 0,
        sectionProperties: ''
      },
      isRead: true,
      isCreate: true,
      isUpdate: true
    },
    {
      fieldData: {
        _id: '630dc2429ec41869052396b6',
        fieldName: 'createDate',
        fieldLabel: 'Create Date',
        lookup: false,
        resource: sidebarResource.materialHandling,
        type: 'date',
        order: 5,
        required: false,
        sectionName: 'Material Handeling Filter',
        isTooltip: false,
        editAble: false,
        brand: user?.user?.brand,
        roleType: 0,
        sectionProperties: ''
      },
      isRead: true,
      isCreate: true,
      isUpdate: true
    }
  ];

  return (
    <MuiPickersUtilsProvider utils={MomentUtils}>
      <Box className="main-container-v1">
        <Box className="headerbox-v1">
          <Box className="nav-v1">
            <CustomBreadCrumbs routes={[{ title: resources?.materialHandling?.titlePlural }]} />
          </Box>
        </Box>
        <Box className={`detail-container-v1`}>
          <div className="mb-4 flex items-center justify-between">
            <DisplayFilterChip
              filterTerm={filterTerm}
              resourceColumns={FIELD_TO_FILTER}
              deepFilters={deepFilters}
              filterByIds={filterByIds}
              fetchResourceData={(deepFilter, filterById) => {
                fetchData(deepFilter, filterById);
              }}
              setDeepFilters={setDeepFilters}
              setFilterByIds={setFilterByIds}
            />
            <div className="flex gap-2">
              <ThemeButton
                tooltip="Apply Filters"
                startIcon={<BiFilterAlt className="-ml-1 mr-1 mt-[1px]" />}
                iconForMobile={<BiFilterAlt />}
                onClick={() => {
                  setShowFilter(true);
                }}
                variant="outlined"
              >
                Show Filters
              </ThemeButton>
              <HtmlTooltip title="Refresh">
                <IconButton size="small" onClick={() => fetchData()}>
                  <RefreshIcon />
                </IconButton>
              </HtmlTooltip>
            </div>
          </div>
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
                                    <span style={{ color: 'var(--card-color-secondary)', fontWeight: 500 }}>
                                      {data?.serializedAsset?.optionLabel}
                                    </span>
                                  </Typography>
                                </>
                              )}
                              {data?.referenceType === sidebarResource.fieldTicket && (
                                <>
                                  <Typography variant="body2" style={{ color: 'var(--card-color-primary)', marginBottom: 8, fontWeight: 600 }}>
                                    Customer :{' '}
                                    <span style={{ color: 'var(--card-color-secondary)', fontWeight: 500 }}>
                                      {data?.customerAccount?.optionLabel}
                                    </span>
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
                <Grid item xs={12} md={8} lg={filterByIds?.findIndex((f) => f?.field === '_id') === -1 ? 9 : 12}>
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
                          <Request
                            referenceId={selectedWorkOrder?._id}
                            fetchDataMaster={fetchData}
                            referenceType={selectedWorkOrder?.referenceType}
                          />
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
        {showFilter && (
          <Filter
            onClose={() => {
              setShowFilter(false);
            }}
            loading={false}
            filterTitle={resources?.materialHandling?.titleSingular}
            resource={sidebarResource.materialHandling}
            columns={FIELD_TO_FILTER}
            onApplyFilter={() => {
              setShowFilter(false);
              fetchData();
            }}
            deepFilters={deepFilters}
            setDeepFilters={setDeepFilters}
            filterByIds={filterByIds}
            setFilterByIds={setFilterByIds}
            filterTerm={filterTerm}
            setFilterTerm={setFilterTerm}
            reportConfig={{ defaultColumn: true, notMultiSelectFields: ['warehouse'] }}
          />
        )}
      </Box>
    </MuiPickersUtilsProvider>
  );
};

export default MaterialHandling;
