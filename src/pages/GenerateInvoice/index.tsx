import { Box, IconButton, MenuItem, TextField } from '@mui/material';
import Grid from '@mui/material/Grid2';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Autocomplete from '@mui/material/Autocomplete';
import { camelCase, map, uniq } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { FIELD_TICKET_STATUS, INVOICE_STATUS, gridLoadingTimeout, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import ViewInvoice from '../Invoice/ViewInvoice';
import CreateBillingDialog from '../RentalManagement/ProgressiveBilling/CreateBillingDialog';
import CreateInvoiceDialog from './CreateInvoice';
import InvoiceDialog from './InvoiceDialog';
import axios, { CancelTokenSource } from 'axios';
import NoDataCell from 'src/components/Helpers/NoDataCell';

const GenerateInvoice = ({ resourceRendered = null }) => {
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { permissions, selectedEntity, resources }
  }: any = useData();

  const [selectedResource, setSelectedResource] = useState(null);
  const renderedFrom = resourceRendered
    ? `${camelCase(routes[`${resourceRendered}Invoice`].title + ' Invoice')}`
    : `${selectedResource?.key + camelCase(sidebarResource.generateInvoice)}`;

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { generateColumns } = useColumns();

  const [columns, setColumns] = useState(null);
  const [createInvoiceDialog, setCreateInvoiceDialog] = useState({ open: false, data: null });
  const [viewInvoiceDialog, setViewInvoiceDialog] = useState({ open: false, data: null });
  const [viewSingleInvoiceDialog, setViewSingleInvoiceDialog] = useState({ open: false, invoice: null });

  const [resourceList, setResourceList] = useState([]);
  const [isDownloading, setIsDownloading] = useState(false);

  const GENERATE_RESOURCE = [
    {
      key: 'rentalManagement',
      resource: sidebarResource.rentalManagement,
      fieldName: 'rentalJobName',
      invoiceFieldName: 'rentalJob',
      progressiveBilling: true,
      path: routes.rentalManagementDetail.path,
      title: resources?.rentalManagement?.titlePlural
    },
    {
      key: 'sublease',
      resource: sidebarResource.sublease,
      fieldName: 'subleaseName',
      invoiceFieldName: 'sublease',
      progressiveBilling: true,
      path: routes.subleaseDetail.path,
      title: resources?.sublease?.titlePlural
    },
    {
      key: 'repairOrder',
      resource: sidebarResource.repairOrder,
      fieldName: 'repairOrderNumber',
      invoiceFieldName: 'repairOrder',
      progressiveBilling: false,
      path: routes?.repairOrderDetail?.path,
      title: resources?.repairOrder?.titlePlural
    },
    {
      key: 'fieldTicket',
      resource: sidebarResource.fieldTicket,
      fieldName: 'fieldTicketNumber',
      invoiceFieldName: 'fieldTicket',
      progressiveBilling: false,
      path: routes.fieldTicketDetail.path,
      title: resources?.fieldTicket?.titlePlural
    },
    {
      key: 'salesOrder',
      resource: sidebarResource.salesOrder,
      fieldName: 'salesOrderNumber',
      invoiceFieldName: 'salesOrder',
      progressiveBilling: false,
      path: routes.salesOrderDetail.path,
      title: resources?.salesOrder?.titlePlural
    }
  ];

  useEffect(() => {
    const options: any = [];
    GENERATE_RESOURCE?.forEach((item) => {
      if (permissions[item.key] && permissions[item.key]?.isRead === true) {
        options.push({ ...item });
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
    if(selectedResource){
      fetchGridColumns();
    }
  }, [selectedResource]);

  useEffect(() => {
    if (selectedResource) {
      const cancelTokenSource = axios.CancelToken.source();
      fetchData(cancelTokenSource);
      return () => cancelTokenSource.cancel();
    }
  }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly, selectedResource]);

  const fetchGridColumns = async () => {
    setColumns(null);
    const response = await axiosInstance().get(`/field?resource=${selectedResource.resource}`);
    let data = response?.data?.data;
    const newColumns = generateColumns(renderedFrom, data, selectedResource?.path);
    let extraColumns = [];
    if (selectedResource?.resource === sidebarResource.fieldTicket) {
      extraColumns.push({
        accessor: 'totalAmount',
        Header: 'Total Amount',
        disableFilters: true,
        disableSortBy: true,
        Cell: ({ row }) => {
          return row.original?.totalAmount ? (
            <div>
              <p className="text-truncate">{row.original.totalAmount}</p>
            </div>
          ) : (
            <NoDataCell />
          );
        }
      });
    }
    setColumns([...newColumns, ...extraColumns, ...getStaticFields(), ActionsRenderer]);
  };

  const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    axiosInstance()
      .get(`${routes?.generateInvoice.path}${queryString}`, { cancelToken: cancelTokenSource?.token })
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

  const LeftSideContents = () => {
    return (
      <>
        {!resourceRendered && (
          <Autocomplete
            id="generate-invoice"
            style={{ width: '300px' }}
            options={resourceList?.map((item) => item)}
            renderInput={(params) => <TextField {...params} variant="outlined" label="Resource" margin="dense" size="small" required={true} />}
            getOptionLabel={(option) => option?.title}
            onChange={(e, val) => {
              dispatch({ type: 'selection', selectedRecords: [] });
              dispatch({ type: 'pageChange', page: 0 });
              setSelectedResource(val);
            }}
            disableClearable={true}
            value={selectedResource}
          />
        )}
      </>
    );
  };

  const uniqueInvoices = () => {
    if (selectedRecords?.length > 0) {
      const uniqueInvoice = uniq(map(selectedRecords, 'invoiceId'));
      return uniqueInvoice?.filter(Boolean);
    }
    return [];
  };

  const handleDownloadZip = async () => {
    try {
      toastConfig.setToastConfig({
        hideDuration: null,
        open: true,
        type: 'info',
        message: `Your file will be downloaded in a matter of seconds`
      });
      setIsDownloading(true);
      const uniqueInvoice = uniqueInvoices();
      if (uniqueInvoice?.length > 0) {
        const invoiceIds = uniqueInvoice.join(',');
        await axiosInstance()
          .get(`${routes?.generateInvoice.path}/invoice-field-ticket-zip?invoiceIds=${invoiceIds}`, {
            responseType: 'blob'
          })
          .then((response) => {
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Invoice_Tickets.zip');
            document.body.appendChild(link);
            link.click();
            setIsDownloading(false);
            toastConfig.setToastConfig({
              open: true,
              type: 'success',
              message: 'Downloaded successfully.'
            });
            dispatch({ type: 'selection', selectedRecords: [] });
            dispatch({ type: 'pageChange', page: 0 });
          })
          .catch((error) => {
            toastConfig.setToastConfig(error);
            setIsDownloading(false);
          });
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
      setIsDownloading(false);
    }
  };

  const ActionMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={checkUniqCreateInvoice()}
          onClick={() => {
            setCreateInvoiceDialog({ open: true, data: selectedRecords });
          }}
        >
          Create Invoice
        </MenuItem>
        {selectedResource?.resource === sidebarResource.fieldTicket && (
          <MenuItem disabled={uniqueInvoices()?.length === 0 || isDownloading} onClick={handleDownloadZip}>
            Download Invoice Tickets
          </MenuItem>
        )}
      </>
    );
  };

  return selectedResource ? (
    <Fragment>
      <Grid container className="headerbox">
        <Grid size={{md:4, sm:11, xs:10}}>
          <CustomBreadCrumbs
            routes={[
              {
                title: resourceRendered
                  ? resources[`${resourceRendered}Invoice`]
                    ? resources[`${resourceRendered}Invoice`]?.titlePlural
                    : 'Invoice'
                  : resources?.generateInvoice?.titlePlural
              }
            ]}
          />
        </Grid>
        <Grid size={{md:8, sm:1, xs:2}} />
      </Grid>
      <div className="main-container">
        <ListingPageHeader
          leftSideContents={LeftSideContents()}
          searchValue={search}
          onSearch={handleSearch}
          isActionButtonVisible={selectedResource.resource === sidebarResource.fieldTicket}
          actionMenuItems={<ActionMenuItems />}
          actionButtonProps={{ disabled: selectedRecords.length ? false : true }}
          isAddButtonVisible={false}
        />
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
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
