import { Box, Button, Grid, IconButton, Menu, MenuItem, TextField } from '@material-ui/core';
import { Fragment, useContext, useEffect, useState } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import { camelCase, map, uniq } from 'lodash';
import { useData } from 'src/StateProvider/Provider';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTableNew';
import axiosInstance from 'src/axios/axiosInstance';
import { gridLoadingTimeout, prepareDataForGrid, sidebarResource, INVOICE_STATUS, FIELD_TICKET_STATUS } from 'src/constants/helpers';
import NoteAddIcon from '@material-ui/icons/NoteAdd';
import VisibilityIcon from '@material-ui/icons/Visibility';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import styles from '../Leads/Header.module.scss';
import SearchBox from 'src/components/Helpers/SearchBox';
import { Autocomplete } from '@material-ui/lab';
import CreateInvoiceDialog from './CreateInvoice';
import InvoiceDialog from './InvoiceDialog';
import CreateBillingDialog from '../RentalManagement/ProgressiveBilling/CreateBillingDialog';
import ViewInvoice from '../Invoice/ViewInvoice';
import { ExpandMore } from '@material-ui/icons';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

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
  // {
  //   key: 'salesOrder',
  //   resource: sidebarResource.salesOrder,
  //   fieldName: 'salesOrderNumber',
  //   invoiceFieldName: 'salesOrder',
  //   progressiveBilling: false,
  //   path: routes.salesOrderDetail.path,
  //   title: routes.salesOrder.title
  // }
];

const GenerateInvoice = ({ resourceRendered = null }) => {
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { permissions, selectedEntity }
  }: any = useData();

  const { state, dispatch } = useTableReducer();
  const { page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { getColumnData } = useColumns();

  const [columns, setColumns] = useState(null);
  const [createInvoiceDialog, setCreateInvoiceDialog] = useState({ open: false, data: null });
  const [viewInvoiceDialog, setViewInvoiceDialog] = useState({ open: false, data: null });
  const [viewSingleInvoiceDialog, setViewSingleInvoiceDialog] = useState({ open: false, invoice: null });
  const [selectedResource, setSelectedResource] = useState(null);
  const [resourceList, setResourceList] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);

  const renderedFrom = resourceRendered
    ? `${camelCase(routes[`${resourceRendered}Invoice`].title + ' Invoice')}`
    : `${selectedResource?.key + camelCase(routes?.generateInvoice.title)}`;

  useEffect(() => {
    const options: any = [];
    GENERATE_RESOURCE?.forEach((item) => {
      if (permissions[item.key] && permissions[item.key]?.isRead === true) {
        options.push({ ...item, title: routes[item.key] ? routes[item.key]?.title : item.title });
      }
    });
    setResourceList(options);
    if (resourceRendered) {
      setSelectedResource(GENERATE_RESOURCE.find((r) => r.key === resourceRendered));
    } else {
      if (options?.length) {
        setSelectedResource(options[0]);
      }
    }
  }, []);

  useEffect(() => {
    fetchGridColumns();
  }, [selectedResource]);

  useEffect(() => {
    if (selectedResource) fetchData();
  }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly, selectedResource]);

  const fetchGridColumns = async () => {
    setColumns(null);
    const response = await axiosInstance().get(`/field?resource=${selectedResource.resource}`);
    let data = response?.data?.data;
    let columns = [];
    data.forEach((o) => {
      let currentColumn = getColumnData(renderedFrom, o?.fieldData, selectedResource?.path);
      if (currentColumn !== null) {
        columns = [...columns, currentColumn?.columnData];
      }
    });
    columns = [...columns, ...getStaticFields(), ActionsRenderer];
    setColumns(columns);
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    axiosInstance()
      .get(`${routes?.generateInvoice.path}${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
          let finalObject: any = prepareDataForGrid(u);
          finalObject['isChecked'] = selectedRecords?.some((s) => s._id === u._id);
          return finalObject;
        });
        dispatch({ type: 'initialize', data: rows, count: count });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      })
      .finally(() => {
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
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || []).map((m) => m._id))}`;
    }
    return deepFilter;
  };

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 110,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        {selectedResource?.progressiveBilling ? (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <HtmlTooltip title="Create Invoice">
              <span>
                <IconButton
                  size="small"
                  onClick={() => {
                    setCreateInvoiceDialog({ open: true, data: [row?.original] });
                  }}
                >
                  <NoteAddIcon fontSize="small" color="primary" />
                </IconButton>
              </span>
            </HtmlTooltip>
            {row?.original?.invoiceCount ? (
              <Box ml={1}>
                <HtmlTooltip title="View Invoices">
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setViewInvoiceDialog({ open: true, data: row?.original });
                      }}
                    >
                      <VisibilityIcon fontSize="small" color="primary" />
                    </IconButton>
                  </span>
                </HtmlTooltip>
              </Box>
            ) : null}
          </div>
        ) : row?.original?.status === INVOICE_STATUS.readyToInvoice ? (
          <HtmlTooltip title="Create Invoice">
            <span>
              <IconButton
                size="small"
                onClick={() => {
                  setCreateInvoiceDialog({ open: true, data: [row?.original] });
                }}
              >
                <NoteAddIcon fontSize="small" color="primary" />
              </IconButton>
            </span>
          </HtmlTooltip>
        ) : (
          <HtmlTooltip title="View Invoice">
            <span>
              <IconButton
                size="small"
                onClick={() => {
                  setViewSingleInvoiceDialog({ open: true, invoice: row?.original?.invoiceId || row?.original?.invoice });
                }}
              >
                <VisibilityIcon fontSize="small" color="primary" />
              </IconButton>
            </span>
          </HtmlTooltip>
        )}
      </>
    )
  };

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

  return selectedResource ? (
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
      <div className="main-container">
        <div className="header-panel">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            <div className={'flex justify-between align-items-center gap-1 w-full'}>
              <Autocomplete
                id="generate-invoice"
                style={{ width: '300px' }}
                options={resourceList?.map((item) => item)}
                renderInput={(params) => <TextField {...params} variant="outlined" label="Resource" margin="dense" required={true} />}
                getOptionLabel={(option) => option?.title}
                onChange={(e, val) => {
                  dispatch({ type: 'selection', selectedRecords: [] });
                  setSelectedResource(val);
                }}
                disableClearable={true}
                value={selectedResource}
              />
            </div>
            <div className="flex flex-wrap gap-[8px]  justify-end">
              <SearchBox
                onChange={handleSearch}
                className={styles.search_box_input}
                value={search}
                size="small"
              />
              {selectedResource.resource === sidebarResource.fieldTicket && (
                <div className="flex gap-[8px] flex-wrap items-center">
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
                </div>
              )}
            </div>
          </div>
        </div>
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            isClientSideGrid={false}
            refreshGrid={fetchData}
            showFilters={true}
            showOnlyShowFilteredRecordSwitch={true}
            hideSelection={selectedResource.resource === sidebarResource.fieldTicket ? false : true}
            resource={selectedResource.resource}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
        {createInvoiceDialog.open &&
          (selectedResource.resource === sidebarResource.rentalManagement ? (
            <CreateBillingDialog
              rentalManagementData={createInvoiceDialog.data[0]}
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
                dispatch({ type: 'selection', selectedRecords: [] });
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
      </div>
    </Fragment>
  ) : null;
};

export default GenerateInvoice;
