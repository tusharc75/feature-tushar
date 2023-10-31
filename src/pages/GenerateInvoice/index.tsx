import { Box, Button, Grid, IconButton, Menu, MenuItem, TextField } from '@material-ui/core';
import { Fragment, useEffect, useReducer, useState } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import { camelCase, map, uniq } from 'lodash';
import useColumns, { getStaticFields, getFrameworkComponents, gridFilterParser } from '../../constants/useColumns';
import { useData } from 'src/StateProvider/Provider';
import CustomAgGrid, { intialState, reducer } from '../../components/AgGridComponents/CustomAgGrid';
import axiosInstance from 'src/axios/axiosInstance';
import { SUBLEASE_STATUS, gridLoadingTimeout, prepareDataForGrid, removeLocalStorage, sidebarResource, INVOICE_STATUS, FIELD_TICKET_STATUS } from 'src/constants/helpers';
import NoteAddIcon from '@material-ui/icons/NoteAdd';
import VisibilityIcon from '@material-ui/icons/Visibility';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { isMobile } from 'react-device-detect';
import CustomContainer from 'src/components/CustomContainer';
import styles from '../Leads/Header.module.scss';
import SearchBox from 'src/components/Helpers/SearchBox';
import { Autocomplete } from '@material-ui/lab';
import CreateInvoiceDialog from './CreateInvoice';
import InvoiceDialog from './InvoiceDialog';
import CreateBillingDialog from '../RentalManagement/ProgressiveBilling/CreateBillingDialog';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ViewInvoice from '../Invoice/ViewInvoice';
import { ExpandMore } from '@material-ui/icons';

const GENERATE_RESOURCE = [
  {
    key: 'rentalManagement',
    resource: sidebarResource.rentalManagement,
    fieldName: 'rentalJobName',
    invoiceFieldName: 'rentalJob',
    progressiveBilling: true,
    path: routes.rentalManagementDetail.path,
    title: routes.rentalManagement.title
  },
  {
    key: 'sublease',
    resource: sidebarResource.sublease,
    fieldName: 'subleaseName',
    invoiceFieldName: 'sublease',
    progressiveBilling: true,
    path: routes.subleaseDetail.path,
    title: routes.sublease.title
  },
  {
    key: 'repairOrder',
    resource: sidebarResource.repairOrder,
    fieldName: 'repairOrderNumber',
    invoiceFieldName: 'repairOrder',
    progressiveBilling: false,
    path: routes.repairOrderDetail.path,
    title: routes.repairOrder.title
  },
  {
    key: 'fieldTicket',
    resource: sidebarResource.fieldTicket,
    fieldName: 'fieldTicketNumber',
    invoiceFieldName: 'fieldTicket',
    progressiveBilling: false,
    path: routes.fieldTicketDetail.path,
    title: routes.fieldTicket.title
  }
];

const GenerateInvoice = ({ resourceRendered = null }) => {
  const renderedFrom = resourceRendered
    ? `${camelCase(routes[`${resourceRendered}Invoice`].title + ' Invoice')}`
    : `${camelCase(routes?.generateInvoice.title)}`;
  const localStorageSelectedRecords = `${renderedFrom}_selected`;

  const {
    state: { permissions, selectedEntity }
  }: any = useData();

  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } =
    state;
  const [frameWorkComponent, setFrameWorkComponent] = useState({});
  const [columns, setColumns] = useState(null);
  const [gridApi, setGridApi] = useState(null);
  const { getColumnData } = useColumns();

  const [createInvoiceDialog, setCreateInvoiceDialog] = useState({ open: false, data: null });

  const [viewInvoiceDialog, setViewInvoiceDialog] = useState({ open: false, data: null });
  const [viewSingleInvoiceDialog, setViewSingleInvoiceDialog] = useState({ open: false, invoice: null });

  const [selectedResource, setSelectedResource] = useState(
    resourceRendered ? GENERATE_RESOURCE.find((r) => r.key === resourceRendered) : GENERATE_RESOURCE[0]
  );
  const [resourceList, setResourceList] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    const options: any = [];
    GENERATE_RESOURCE?.forEach((item) => {
      if (permissions[item.key] && permissions[item.key]?.isRead === true) {
        options.push({ ...item, title: routes[item.key] ? routes[item.key]?.title : item.title });
      }
    });
    setResourceList(options);
  }, []);

  useEffect(() => {
    fetchGridColumns();
  }, [selectedResource]);

  useEffect(() => {
    fetchData();
  }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly, selectedResource]);

  const fetchGridColumns = async () => {
    setColumns(null);
    const response = await axiosInstance().get(`/field?resource=${selectedResource.resource}`);
    let data = response?.data?.data;
    let columns = [];
    let rendererNames = [];
    data.forEach((o) => {
      let currentColumn = getColumnData(renderedFrom, o?.fieldData, selectedResource?.path);
      if (currentColumn !== null) {
        columns = [...columns, currentColumn?.columnData];
        if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
          rendererNames.push(currentColumn?.rendererName);
        }
      }
    });
    let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
    tempFrameworkComponent = {
      ...tempFrameworkComponent,
      actionsRenderer: ActionsRenderer
    };
    setFrameWorkComponent({ ...tempFrameworkComponent });
    columns = [...columns, ...getStaticFields()];
    setColumns([...columns]);
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    let queryString = getQueryString();
    if (selectedResource.resource === sidebarResource.rentalManagement) {
      queryString = `/rental-management${queryString}`;
    }
    if (gridApi) {
      gridApi.setRowData([]);
    }
    axiosInstance()
      .get(`${routes?.generateInvoice.path}${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data?.map((u: any) => {
          let finalObject: any = prepareDataForGrid(u);
          finalObject['isChecked'] = selectedRecords?.some((s) => s._id === u._id);
          return {
            ...finalObject
          };
        });
        if (appendRows) {
          dispatch({
            type: 'initialize',
            data: [...dataRows, ...rows],
            count: count,
            selectedRecords: [...dataRows, ...rows].filter((f) => f.isChecked === true)
          });
        } else {
          dispatch({
            type: 'initialize',
            data: rows,
            count: count,
            selectedRecords: rows.filter((f) => f.isChecked === true)
          });
        }
        dispatch({ type: 'initialize', data: rows, count: count });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      });
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = !isExport ? `?page=${page}&limit=${limit}&resource=${selectedResource?.resource}` : '?';

    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`;
    }

    const { filterByIds, deepFilters } = gridFilterParser(filters);

    if (filterByIds?.length) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterByIds)}`;
    }
    if (deepFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(deepFilters))}`;
    }
    if (filterByIds?.length || deepFilters?.length) {
      deepFilter = `${deepFilter}&filterType=and`;
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }

    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURIComponent(search)}`;
    }
    if (showFilteredRecordsOnly) {
      const savedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
      deepFilter = `${deepFilter}&getById=${JSON.stringify(savedRecords.map((m) => m._id))}`;
    }
    return deepFilter;
  };

  const ActionsRenderer = (params) => (
    <Fragment>
      {selectedResource?.progressiveBilling ? (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <HtmlTooltip title="Create Invoice">
            <IconButton
              size="small"
              onClick={() => {
                setCreateInvoiceDialog({ open: true, data: [params.data] });
              }}
            >
              <NoteAddIcon fontSize="small" color="primary" />
            </IconButton>
          </HtmlTooltip>
          <Box ml={1}>
            <HtmlTooltip title="View Invoices">
              <IconButton
                size="small"
                onClick={() => {
                  setViewInvoiceDialog({ open: true, data: params.data });
                }}
              >
                <VisibilityIcon fontSize="small" color="primary" />
              </IconButton>
            </HtmlTooltip>
          </Box>
        </div>
      ) : params.data?.status === INVOICE_STATUS.readyToInvoice ? (
        <HtmlTooltip title="Create Invoice">
          <IconButton
            size="small"
            onClick={() => {
              setCreateInvoiceDialog({ open: true, data: [params.data] });
            }}
          >
            <NoteAddIcon fontSize="small" color="primary" />
          </IconButton>
        </HtmlTooltip>
      ) : (
        <HtmlTooltip title="View Invoice">
          <IconButton
            size="small"
            onClick={() => {
              setViewSingleInvoiceDialog({ open: true, invoice: params.data?.invoiceId || params.data?.invoice });
            }}
          >
            <VisibilityIcon fontSize="small" color="primary" />
          </IconButton>
        </HtmlTooltip>
      )}
    </Fragment>
  );

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const checkUniqCreateInvoice = () => {
    if (selectedRecords.length === 0) {
      return true;
    } else if (selectedRecords.find((e) => e.status === FIELD_TICKET_STATUS.invoiced)) {
      return true;
    } else if (
      uniq(map(selectedRecords, 'customerAccountId')).length === 1 &&
      uniq(map(selectedRecords, 'wellNameId')).length === 1 &&
      uniq(map(selectedRecords, 'warehouseId')).length === 1 &&
      uniq(map(selectedRecords, 'invoiceId')).length === 1
    ) {
      return false;
    } else {
      return true;
    }
  };

  return (
    <Fragment>
      <Grid container className="headerbox">
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs
            routes={[
              {
                title: resourceRendered
                  ? routes[`${resourceRendered}Invoice`]
                    ? routes[`${resourceRendered}Invoice`]?.title
                    : 'Invoice'
                  : routes.generateInvoice.title
              }
            ]}
          />
        </Grid>
        <Grid item md={8} sm={1} xs={2} />
      </Grid>
      <CustomContainer>
        <div className="header-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {!resourceRendered && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Autocomplete
                id="generate-invoice"
                style={{ width: '300px' }}
                options={resourceList?.map((item) => item)}
                renderInput={(params) => <TextField {...params} variant="outlined" label="Resource" margin="dense" required={true} />}
                getOptionLabel={(option) => option?.title}
                onChange={(e, val) => {
                  setSelectedResource(val);
                }}
                disableClearable={true}
                value={selectedResource}
              />
            </div>
          )}
          <Grid container className={styles.filter_side_container}>
            <Grid item xs={12} md={6} sm={12} className={isMobile ? styles.mobile_panel : 'd-flex align-items-center gap-1'}></Grid>
            <Grid md={6} sm={12} xs={12} container className={styles.filter_side}>
              <Box className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} component="div">
                <SearchBox onChange={handleSearch} className={isMobile ? styles.search_box_input : ''} size="small" value={search} />
                {selectedResource.resource === sidebarResource.fieldTicket && (
                  <>
                    <Button
                      variant={'outlined'}
                      color="default"
                      size="small"
                      onClick={openActions}
                      disabled={selectedRecords.length ? false : true}
                      aria-controls="action-menu"
                      className={`new-dropdown-v1`}
                      endIcon={<ExpandMore />}
                    >
                      Actions
                    </Button>
                    <Menu
                      anchorEl={anchorEl}
                      keepMounted
                      getContentAnchorEl={null}
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left'
                      }}
                      id="action-menu"
                      open={Boolean(anchorEl)}
                      onClose={closeActions}
                    >
                      <MenuItem
                        disabled={checkUniqCreateInvoice()}
                        onClick={() => {
                          setCreateInvoiceDialog({ open: true, data: selectedRecords });
                          closeActions();
                        }}
                      >
                        Create Invoice
                      </MenuItem>
                    </Menu>
                  </>
                )}
              </Box>
            </Grid>
          </Grid>
        </div>
        {columns && Object.keys(frameWorkComponent).length > 0 ? (
          <CustomAgGrid
            columns={columns}
            dataRows={dataRows}
            frameworkComponents={frameWorkComponent}
            setGridApi={setGridApi}
            dispatch={dispatch}
            rowCount={rowCount}
            limit={limit}
            pageSizes={pageSizes}
            page={page}
            allowAction={true}
            loading={loading}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
            showFilters={true}
            actionWidth={120}
            resource={sidebarResource.sublease}
            allowSelection={selectedResource.resource === sidebarResource.fieldTicket ? true : false}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
        {createInvoiceDialog.open &&
          (selectedResource.resource === sidebarResource.rentalManagement ? (
            <CreateBillingDialog
              rentalManagementData={createInvoiceDialog.data}
              onClose={() => {
                setCreateInvoiceDialog({ open: false, data: null });
              }}
              onSuccess={() => {
                setCreateInvoiceDialog({ open: false, data: null });
                fetchData();
              }}
            />
          ) : (
            <CreateInvoiceDialog
              resourceData={createInvoiceDialog?.data}
              onClose={() => setCreateInvoiceDialog({ open: false, data: null })}
              resource={selectedResource.resource}
              progressiveBilling={selectedResource.progressiveBilling}
              onSuccess={() => {
                setCreateInvoiceDialog({ open: false, data: null });
                removeLocalStorage(localStorageSelectedRecords);
                fetchData();
              }}
            />
          ))}
        {viewInvoiceDialog.open && (
          <InvoiceDialog
            resourceData={viewInvoiceDialog?.data}
            selectedResource={selectedResource}
            handleClose={() => {
              setViewInvoiceDialog({ open: false, data: null });
            }}
          />
        )}

        {viewSingleInvoiceDialog.open && (
          <ViewInvoice
            invoiceId={viewSingleInvoiceDialog.invoice}
            onClose={() => {
              setViewSingleInvoiceDialog({ open: false, invoice: null });
            }}
            onSuccess={() => {
              setViewSingleInvoiceDialog({ open: false, invoice: null });
               fetchData();
            }}
            resource={selectedResource.resource}
          />
        )}
      </CustomContainer>
    </Fragment>
  );
};

export default GenerateInvoice;
