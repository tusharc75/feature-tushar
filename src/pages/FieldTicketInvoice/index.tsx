import { Box, Button, Grid, IconButton, Menu, MenuItem } from '@material-ui/core';
import { Fragment, useContext, useEffect, useReducer, useState } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import { camelCase } from 'lodash';
import useColumns, { getStaticFields, getFrameworkComponents, gridFilterParser } from '../../constants/useColumns';
import { useData } from 'src/StateProvider/Provider';
import CustomAgGrid, { intialState, reducer } from '../../components/AgGridComponents/CustomAgGrid';
import axiosInstance from 'src/axios/axiosInstance';
import { FIELD_TICKET_STATUS, gridLoadingTimeout, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import NoteAddIcon from '@material-ui/icons/NoteAdd';
import VisibilityIcon from '@material-ui/icons/Visibility';
import CreateInvoiceDialog from './CreateInvoiceDialog';
import ViewInvoice from '../Invoice/ViewInvoice';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { isMobile, isTablet } from 'react-device-detect';
import CustomContainer from 'src/components/CustomContainer';
import styles from '../Leads/Header.module.scss';
import SearchBox from 'src/components/Helpers/SearchBox';
import { ExpandMore } from '@material-ui/icons';

const FieldTicketInvoice = () => {
  const toastConfig = useContext(CustomToastContext);
  const renderedFrom = camelCase(routes?.fieldTicket.title);
  const localStorageSelectedRecords = `${renderedFrom}_selected`;
  const {
    state: { permissions, selectedEntity, user }
  }: any = useData();
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } =
    state;
  const [frameWorkComponent, setFrameWorkComponent] = useState({});
  const [columns, setColumns] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [gridApi, setGridApi] = useState(null);
  const { getColumnData } = useColumns();
  const [createInvoiceDialog, setCreateInvoiceDialog] = useState({ open: false, isBulkCreate: false, data: null });
  const [viewInvoiceDialog, setViewInvoiceDialog] = useState({ open: false, data: null });

  const fetchGridColumns = async () => {
    const response = await axiosInstance().get(`/field?resource=${sidebarResource?.fieldTicket}`);
    let data = response?.data?.data;
    let columns = [];
    let rendererNames = [];
    data.forEach((o) => {
      let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.fieldTicketDetail.path);
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

  const fetchFieldTicketData = async () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    if (gridApi) {
      gridApi.setRowData([]);
    }
    axiosInstance()
      .get(`${routes?.fieldTicketInvoice.path}${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data?.map((u: any) => {
          let finalObject: any = prepareDataForGrid(u);
          finalObject['canDelete'] = permissions?.fieldTicket?.isDelete;
          finalObject['isChecked'] = selectedRecords?.some((s) => s._id === u._id);
          finalObject['allowedToEdit'] = permissions?.fieldTicket?.isUpdate;
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
    let deepFilter = !isExport ? `?page=${page}&limit=${limit}` : '?';

    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`;
    }

    const { filterByIds, deepFilters } = gridFilterParser(filters);

    deepFilters.push({ field: 'status', term: [FIELD_TICKET_STATUS.readyToInvoice, FIELD_TICKET_STATUS.invoiced] });

    if (filterByIds?.length) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterByIds)}`;
    }
    if (deepFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURI(JSON.stringify(deepFilters))}`;
    }
    if (filterByIds?.length || deepFilters?.length) {
      deepFilter = `${deepFilter}&filterType=and`;
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }

    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURI(search)}`;
    }
    if (showFilteredRecordsOnly) {
      const savedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
      deepFilter = `${deepFilter}&getById=${JSON.stringify(savedRecords.map((m) => m._id))}`;
    }
    return deepFilter;
  };

  const ActionsRenderer = (params) => (
    <Fragment>
      {!params.data.invoice ? (
        <HtmlTooltip title="Create Invoice">
          <IconButton
            size="small"
            onClick={() => {
              setCreateInvoiceDialog({ open: true, isBulkCreate: false, data: params.data });
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
              setViewInvoiceDialog({ open: true, data: params.data });
            }}
          >
            <VisibilityIcon fontSize="small" color="primary" />
          </IconButton>
        </HtmlTooltip>
      )}
    </Fragment>
  );

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    fetchFieldTicketData();
  }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly]);

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const isSelectedInvoiceEqual = (arr) => {

    if(arr.some(k => 'invoiceId' in k)) return false

    if (arr?.length <= 1) {
      return true
    }

    const customerAccountId = arr[0]?.customerAccountId;
    const warehouseId = arr[0]?.warehouseId;
    const wellNameId = arr[0]?.wellNameId;

    let count = 0;

    for (let i = 1; i < arr.length; i++) {
      const data = arr[i]
      if (data?.customerAccountId === customerAccountId && data?.warehouseId === warehouseId && data?.wellNameId === wellNameId) {
        count++;
      }
      if (count === arr?.length - 1) return true
    }

    return false;
  }

  return (
    <Fragment>
      <Grid container className="headerbox">
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs routes={[{ title: routes.fieldTicketInvoice.title }]} />
        </Grid>
        <Grid item md={8} sm={1} xs={2} />
      </Grid>
      <CustomContainer>
        <div className="header-panel">
          <Grid container className={styles.filter_side_container}>
            <Grid item xs={12} md={6} sm={12} className={isMobile ? styles.mobile_panel : 'd-flex align-items-center gap-1'}>
            </Grid>
            <Grid md={6} sm={12} xs={12} container className={styles.filter_side}>
              <Box className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} component="div">
                <SearchBox
                  onChange={handleSearch}
                  className={isMobile ? styles.search_box_input : ''}
                  size="small"
                  value={search}
                />
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
                      disabled={!isSelectedInvoiceEqual(selectedRecords)}
                      onClick={() => {
                        setCreateInvoiceDialog({ open: true, isBulkCreate: true, data: null })
                        closeActions();
                      }}
                    >
                      Create Invoice
                    </MenuItem>
                  </Menu>
                </>
              </Box>
            </Grid>
          </Grid>
        </div>
        {Object.keys(frameWorkComponent).length > 0 ? (
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
            refreshGrid={fetchFieldTicketData}
            showOnlyShowFilteredRecordSwitch={true}
            showFilters={true}
            actionWidth={120}
            resource={sidebarResource.fieldTicket}
          />
        )
          : null}
        {createInvoiceDialog.open && (
          <CreateInvoiceDialog
            fieldTicketData={createInvoiceDialog.data}
            isBulkCreate={createInvoiceDialog.isBulkCreate}
            selectedData={createInvoiceDialog.isBulkCreate ? selectedRecords : []}
            onClose={() => setCreateInvoiceDialog({ open: false, isBulkCreate: false, data: null })}
            onSuccess={() => {
              setCreateInvoiceDialog({ open: false, isBulkCreate: false, data: null });
              fetchFieldTicketData();
            }}
          />
        )}
        {viewInvoiceDialog.open && (
          <ViewInvoice
            invoiceData={{ ...viewInvoiceDialog.data, invoiceNumber: viewInvoiceDialog?.data?.invoice, _id: viewInvoiceDialog?.data?.invoiceId }}
            estimateStartDate={null}
            onClose={() => {
              setViewInvoiceDialog({ open: false, data: null });
            }}
            onSuccess={() => {
              setViewInvoiceDialog({ open: false, data: null });
              fetchFieldTicketData();
            }}
          />
        )}
      </CustomContainer>
    </Fragment>
  );
};

export default FieldTicketInvoice;
