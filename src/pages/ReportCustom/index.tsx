import React, { useState, useReducer, useContext, useEffect, Fragment } from 'react';
import { Grid, useTheme, Button, Box, IconButton, Menu, MenuItem } from '@material-ui/core';
import { camelCase, startCase } from 'lodash';
import { MdDescription } from 'react-icons/md';
import styles from 'src/pages/Leads/Header.module.scss';
import MomentUtils from '@date-io/moment';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import routes from 'src/components/Helpers/Routes';
import axiosInstance from 'src/axios/axiosInstance';
import CustomContainer from 'src/components/CustomContainer';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomAgGrid, { reducer, intialState } from 'src/components/AgGridComponents/CustomAgGrid';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { prepareDataForGrid, gridLoadingTimeout } from 'src/constants/helpers';
import Loader from 'src/components/Loader';
import ManageCustomReport from './ManageCustomReport';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { Delete, ExpandMore } from '@material-ui/icons';
import { getStaticFields, staticFrameworkRender } from '../../constants/useColumns';

const CustomReport = () => {
  const theme = useTheme();

  const toastConfig = useContext(CustomToastContext);

  const renderedFrom = 'custom-report';

  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState({ open: false, id: null });
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const [columns] = useState([
    {
      field: 'customReportName',
      headerName: 'Custom Report Name',
      show: true,
      disabled: false,
      cellRenderer: 'reportNameRenderer',
      primaryField: true
    },
    {
      field: 'resource',
      headerName: 'Resource',
      show: true,
      disabled: false,
      cellRenderer: 'commonRenderer',
      primaryField: false
    },
    // {
    //   field: 'filters',
    //   headerName: 'Filters',
    //   show: true,
    //   disabled: false,
    //   cellRenderer: 'commonRenderer',
    //   primaryField: false
    // },
    // {
    //   field: 'column',
    //   headerName: 'Columns',
    //   show: true,
    //   disabled: false,
    //   cellRenderer: 'commonRenderer',
    //   primaryField: false
    // },
    ...getStaticFields()
  ]);

  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, selectedRecords, sorting, search, limit, filters, pageSizes } = state;

  useEffect(() => {
    fetchResourceData();
  }, []);

  const fetchResourceData = async () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    try {
      let { data: { data, count } } = await axiosInstance().get(`custom-report`);
      data = data.map((u: any) => {
        let finalObject: any = prepareDataForGrid(u);
        finalObject.resource = routes[camelCase(finalObject.resource)] ? routes[camelCase(finalObject.resource)]?.title : finalObject.resource
        finalObject.column = finalObject.column?.split(',')?.map((s: string) => startCase(s))?.join(', ');
        finalObject.filters = finalObject.filters.length > 0 ? finalObject?.filters?.map((item) => startCase(item.term)) : [];
        return finalObject;
      });
      dispatch({ type: 'initialize', data: data, count: count });
      setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);
    } catch (error) {
      setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);
      toastConfig.setToastConfig(error);
    }
  };

  const ActionsRenderer = (params) => (
    <>
      <IconButton
        size="small"
        aria-label="Delete"
        onClick={() => {
          setDeleteRecord(params.data);
          setShowDeleteConfirmBox(true);
        }}
      >
        <Delete color={'error'} />
      </IconButton>
    </>
  );

  function ReportNameRenderer(params) {
    return (
      <span
        onClick={() => {
          setShowManageDialog({ open: true, id: params.data._id });
        }}
        className="cursor-pointer link"
      >
        {params.value}
      </span>
    );
  }

  const frameworkComponents = {
    reportNameRenderer: ReportNameRenderer,
    actionsRenderer: ActionsRenderer,
    ...staticFrameworkRender
  };

  const handleDelete = () => {
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords.map((item) => item._id);
    }
    setDeleting(true);
    axiosInstance()
      .put('custom-report/remove', {
        ids
      })
      .then(({ data }) => {
        setDeleting(false);
        setDeleteRecord(null);
        setShowDeleteConfirmBox(false);
        fetchResourceData();
        toastConfig.setToastConfig({
          type: 'success',
          message: data.message,
          open: true
        });
      })
      .catch((err) => {
        setDeleting(false);
        setShowDeleteConfirmBox(false);
        toastConfig.setToastConfig(err);
      });
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  return (
    <MuiPickersUtilsProvider utils={MomentUtils}>
      <div>
        <Grid container className="headerbox">
          <Grid item xs={10}>
            <CustomBreadCrumbs
              routes={[
                { title: 'Reports', path: '/reports' },
                { title: 'Custom Report', path: '' }
              ]}
            />
          </Grid>
          <Grid item xs={2}></Grid>
        </Grid>
        <CustomContainer>
          <div className="header-panel">
            <Grid container className={styles.filter_side_container}>
              <Grid item xs={4} className="d-flex align-items-center gap-1 layout-for-tablet">
                <Box display="flex" justifyContent="center" alignItems="center">
                  <MdDescription size={22} className="headerLogo" />
                  <span className="listingHeader">Custom Report</span>
                </Box>
              </Grid>
              <Grid item xs={8}>
                <Box display="flex" alignItems="center" justifyContent="flex-end">
                  <Box mr={1}>
                    <Button
                      onClick={() => setShowManageDialog((prev) => ({ ...prev, open: true }))}
                      variant="contained"
                      size="small"
                      color="primary"
                    >
                      Add
                    </Button>
                  </Box>
                  <Box>
                    <Button
                      variant="outlined"
                      color="default"
                      size="small"
                      endIcon={<ExpandMore />}
                      onClick={openActions}
                      aria-controls="action-menu"
                      disabled={selectedRecords.length === 0}
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
                        onClick={() => {
                          closeActions();
                          setShowDeleteConfirmBox(true);
                        }}
                      >
                        Delete
                      </MenuItem>
                    </Menu>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </div>
          <div>
            {Object.keys(frameworkComponents).length > 0 && columns ? (
              (
                <CustomAgGrid
                  columns={columns}
                  dataRows={dataRows}
                  frameworkComponents={frameworkComponents}
                  setGridApi={setGridApi}
                  dispatch={dispatch}
                  rowCount={rowCount}
                  limit={limit}
                  pageSizes={pageSizes}
                  page={page}
                  isClientSideGrid={true}
                  actionWidth={100}
                  loading={loading}
                  renderedFrom={renderedFrom}
                  allowSelection={true}
                  allowAction={true}
                  refreshGrid={fetchResourceData}
                  showOnlyShowFilteredRecordSwitch={false}
                />
              )
            ) : (
              <Loader text={'Loading Data...'} style={{ marginTop: '15vh' }} />
            )}
          </div>
        </CustomContainer>
      </div>
      <Fragment>
        {showManageDialog.open && (
          <ManageCustomReport
            id={showManageDialog.id}
            onSuccess={() => {
              fetchResourceData();
              setShowManageDialog({ open: false, id: null });
            }}
            handleClose={() => setShowManageDialog({ open: false, id: null })}
          />
        )}
      </Fragment>
      <Fragment>
        {showDeleteConfirmBox && (
          <ConfirmationDialog
            open={showDeleteConfirmBox}
            message={`Are you sure you want to delete the Custom Report ${deleteRecord?._id ? deleteRecord?.customReportName : ''} ? `}
            onClose={() => {
              setDeleteRecord(null);
              setShowDeleteConfirmBox(false);
            }}
            okBtnLoading={isDeleting}
            onOk={handleDelete}
          />
        )}
      </Fragment>
    </MuiPickersUtilsProvider>
  );
};

export default CustomReport;
