import { Box, Dialog, Grid, IconButton } from '@material-ui/core';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { CustomDialogTransition, gridLoadingTimeout, isObjectEmpty, packages, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import CommonSkeleton from '../Helpers/CommonSkeleton';
import routes from '../Helpers/Routes';
import { ListingPageHeader } from '../PageHeaders';
import axios, { CancelTokenSource } from 'axios';
import { Link } from 'react-router-dom';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import VisibilityIcon from '@material-ui/icons/Visibility';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import Services from 'src/pages/Packages/Services';
import Products from 'src/pages/Packages/Products';
import Packages from 'src/pages/Packages/Packages';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';

const AssignPackageDialog = ({
  onSuccess,
  handleClose,
  packageType = null,
  customerAccount = null,
  ids = [],
  isSubmitting = false,
  hideQty = false
}) => {
  const renderedFrom = `${camelCase(sidebarResource?.packages)}`;
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { generateColumns } = useColumns();

  const [open, setOpen] = useState({ open: false, data: null });
  const [tabValue, setTabValue] = useState(0);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);

  const {
    state: { selectedEntity, resources }
  }: any = useData();

  const [columns, setColumns] = useState(null);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const defaultColumns = [
    {
      accessor: 'qty',
      Header: 'Qty',
      minWidth: 150,
      width: 150,
      editable: true,
      disableFilters: true,
      disableSortBy: true,
      disabled: true,
      Cell: ({ row }) => <h5 className="text-truncate">{row?.original?.qty}</h5>
    }
  ];

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly]);

  const fetchGridColumns = () => {
    axiosInstance()
      .get('/field?resource=Packages&view=true')
      .then(({ data: { data } }) => {
        let columns = [];
        let newColumns = generateColumns(renderedFrom, data, routes.packagesDetail.path);

        newColumns?.forEach((o) => {
          if (o?.accessor === 'packageName') {
            o.cell = ({ row }) => {
              return (
                <span className="d-flex align-items-center gap-2">
                  <Link
                    className="link text-truncate"
                    title={row?.original?.packageName}
                    to={`${routes.packagesDetail.path}/${row?.original?._id}`}
                    target={'_blank'}
                    rel="noopener noreferrer"
                  >
                    {row?.original?.packageName}
                  </Link>
                  <HtmlTooltip title={`View`}>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setOpen({ open: true, data: row?.original });
                      }}
                    >
                      <VisibilityIcon fontSize="small" color="primary" />
                    </IconButton>
                  </HtmlTooltip>
                </span>
              );
            };
          }
        });

        columns = [...newColumns, ...getStaticFields()];
        if (hideQty) {
          setColumns([...columns]);
        } else {
          setColumns([...defaultColumns, ...columns]);
        }
      });
  };

  const fetchData = (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`${packages.api}${queryString}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data }) => {
        let rows = data.data.map((u) => {
          let finalObject = prepareDataForGrid(u);
          finalObject['isChecked'] = selectedRecords.some((s) => s._id === u._id);
          finalObject['unitMain'] = u?.unit;
          finalObject['pricingMethodMain'] = u?.pricingMethod;
          finalObject['qty'] = 1;
          const qtyAdded = selectedRecords?.filter((e) => e._id === u._id);
          if (qtyAdded.length) {
            finalObject['qty'] = qtyAdded[0].qty;
          }
          return {
            ...finalObject
          };
        });
        dispatch({ type: 'initialize', data: rows, count: data.count });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const getQueryString = () => {
    const ignoreIds = ids && ids?.length > 0 ? ids : [];
    let deepFilter = `?page=${page}&limit=${limit}&ignoreIds=${JSON.stringify(ignoreIds)}`;
    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`;
    }
    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || []).map((m) => m._id))}`;
    }
    const { filterByIds, deepFilters } = gridFilterParser(filters);
    const updatedDeepFilters = [...deepFilters];
    const updatedFilterByIds = [...filterByIds];
    if (packageType) {
      updatedDeepFilters.push({
        field: 'packageType',
        term: packageType
      });
    }
    if (updatedDeepFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(updatedDeepFilters))}`;
    }
    if (updatedFilterByIds?.length) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(updatedFilterByIds)}`;
    }
    if (updatedDeepFilters?.length || updatedFilterByIds?.length) {
      deepFilter = `${deepFilter}&filterType=and`;
    }
    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }
    if (customerAccount) {
      deepFilter = `${deepFilter}&customerAccount=${customerAccount}`;
    }
    if (search) {
      deepFilter = `${deepFilter}&search=${search}`;
    }
    return deepFilter;
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const onSaveEdit = (data, row) => {
    if (!data || !data?.qty) return;
    const rows = [...dataRows];
    rows?.forEach((d) => {
      if (row?._id === d._id) {
        d.qty = parseInt(data.qty);
        d.isChecked = true;
      }
    });
    if (!selectedRecords?.find((e) => e._id === row?._id)) {
      const editRow = rows?.find((e) => e._id === row?._id);
      if (editRow) {
        dispatch({ type: 'selection', selectedRecords: [...selectedRecords, editRow] });
      }
    } else {
      const updatedSelectedRecords = selectedRecords?.map((e) => {
        if (e?._id === row?._id) {
          return { ...e, qty: parseInt(data?.qty), isChecked: true };
        }
        return e;
      });
      dispatch({ type: 'selection', selectedRecords: updatedSelectedRecords });
    }
    dispatch({ type: 'update', data: rows });
  };

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Dialog
      TransitionComponent={CustomDialogTransition}
      fullWidth
      maxWidth="md"
      fullScreen={true}
      open={true}
      onClose={handleClose}
      aria-labelledby="assign-roles-dialog"
    >
      <CustomDialogHeader
        title={`Assign ${resources?.packages?.titlePlural}`}
        showManimizeMaximize={false}
        showRequiredLabel={false}
        onClose={handleClose}
      />
      <CustomDialogContent isFooterPresent={false}>
        <ListingPageHeader
          showSearchInMobile={true}
          searchValue={search}
          onSearch={handleSearch}
          isActionButtonVisible={false}
          addButtonProps={{
            disabled: isSubmitting || selectedRecords?.length === 0,
            loading: isSubmitting,
            iconsEnabled: false,
            text: selectedRecords?.length > 0 ? `(${selectedRecords?.length})` : '',
            textAddShow: true
          }}
          addButtonOnclick={() => {
            if (selectedRecords?.some((r) => r?.qty > 1)) {
              setShowConfirmationDialog(true);
            } else {
              onSuccess(selectedRecords);
            }
          }}
          isAddButtonVisible={true}
          setQueryString={false}
        />

        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 250px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            onSaveEdit={onSaveEdit}
            refreshGrid={fetchData}
            showOnlyShowFilteredRecordSwitch={true}
            showFilters={true}
            resource={sidebarResource.packages}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}

        {showConfirmationDialog && (
          <ConfirmationDialog
            open={true}
            message="Please confirm this if you want to split this quantity into multiple line item(s)?"
            onOk={() => {
              setShowConfirmationDialog(false);
              const data: any = [];
              selectedRecords?.forEach((r) => {
                for (let i = 0; i < r?.qty; i++) {
                  data.push({
                    ...r,
                    qty: 1
                  });
                }
              });
              onSuccess(data);
            }}
            onClose={() => {
              setShowConfirmationDialog(false);
              onSuccess(selectedRecords);
            }}
          />
        )}

        {open?.open && (
          <Dialog
            fullWidth
            TransitionComponent={CustomDialogTransition}
            maxWidth="md"
            fullScreen={true}
            open={true}
            onClose={() => {
              setOpen({ open: false, data: null });
              setTabValue(0);
            }}
            aria-labelledby="assign-roles-dialog"
          >
            <CustomDialogHeader
              title={open?.data?.packageName || ''}
              showManimizeMaximize={false}
              showRequiredLabel={false}
              onClose={() => {
                setOpen({ open: false, data: null });
                setTabValue(0);
              }}
            />
            <CustomDialogContent>
              <Box>
                <CustomTabs value={tabValue} onChange={handleMainTabChange}>
                  <CustomTab value={0}>Services</CustomTab>
                  <CustomTab value={1}>Products</CustomTab>
                  <CustomTab value={2}>Sub Packages</CustomTab>
                </CustomTabs>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={12} md={12} lg={12}>
                    <TabPanel value={tabValue} index={0}>
                      {tabValue === 0 && <Services packageData={open?.data} packageId={open?.data?._id} allowedToEdit={false} fullHeight={true} />}
                    </TabPanel>
                    <TabPanel value={tabValue} index={1}>
                      {tabValue === 1 && <Products packageData={open?.data} packageId={open?.data?._id} allowedToEdit={false} fullHeight={true} />}
                    </TabPanel>
                    <TabPanel value={tabValue} index={2}>
                      {tabValue === 2 && <Packages packageData={open?.data} packageId={open?.data?._id} allowedToEdit={false} fullHeight={true} />}
                    </TabPanel>
                  </Grid>
                </Grid>
              </Box>
            </CustomDialogContent>
          </Dialog>
        )}
      </CustomDialogContent>
    </Dialog>
  );
};

export default AssignPackageDialog;
