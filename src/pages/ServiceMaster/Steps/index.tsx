import { useState, useEffect, useContext, Fragment, useReducer } from 'react';
import CustomAgGrid, { reducer, intialState } from '../../../components/AgGridComponents/CustomAgGrid';
import { Box, Grid, IconButton, Menu, MenuItem, Paper, Typography, Button, Tooltip } from '@material-ui/core';
import axiosInstance from 'src/axios/axiosInstance';
import StepDialog from './StepDialog';
import { getLocalStorageArrayData, serviceMaster } from 'src/constants/helpers';
import { camelCase } from 'lodash';
import routes from 'src/components/Helpers/Routes';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { useData } from '../../../StateProvider/Provider';
import { gridLoadingTimeout } from 'src/constants/helpers';
import { CommonRenderer } from '../../../components/AgGridComponents/CustomAgGridCellRenderers';
import DeleteIcon from '@material-ui/icons/Delete';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import EditIcon from '@material-ui/icons/Edit';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import FieldDialog from './FieldDialog';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import { ExpandMore } from '@material-ui/icons';
import ArrangeView from 'src/components/Helpers/ArrangeView';
import DragIndicatorIcon from '@material-ui/icons/DragIndicator';
import ImportExportMenu from 'src/components/Helpers/ImportExportMenu';

const Steps = ({ serviceId }) => {
  const renderedFrom = `${camelCase(routes?.serviceMaster?.title)}_steps`;
  const localStorageSelectedRecords = `${renderedFrom}_selected`;

  const [stepDialog, setStepDialog] = useState({ open: false, stepId: '' });
  const [stepFieldsDialog, setStepFieldsDialog] = useState({ open: false, stepIds: [] });
  const [showConfirmBox, setShowConfirmBox] = useState({ open: false, ids: null });

  const {
    state: { permissions, user, selectedEntity }
  }: any = useData();
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, pageSizes, search, filters, sorting, selectedRecords, limit, appendRows } = state;
  const toastConfig = useContext(CustomToastContext);
  const [anchorActionEl, setAnchorActionEl] = useState(null);
  const [arrangeView, setArrangeView] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const [columns, setColumns] = useState([
    { field: 'stepName', headerName: 'Step Name', show: true, disabled: true, cellRenderer: 'stepNameRenderer' },
    { field: 'order', headerName: 'Sequence', show: true, disabled: true, cellRenderer: 'commonRenderer' },
    { field: 'leadDay', headerName: 'Lead Time', show: true, cellRenderer: 'commonRenderer' },
    { field: 'costPrice', headerName: 'Cost Price', show: true, cellRenderer: 'commonRenderer' },
    { field: 'listPrice', headerName: 'List Price', show: true, cellRenderer: 'commonRenderer' },
    { field: 'fieldCount', headerName: 'Fields', show: true, cellRenderer: 'commonRenderer' }
  ]);

  useEffect(() => {
    fetchStepsData();
  }, [serviceId]);

  const fetchStepsData = async () => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .get(`${serviceMaster.api}/steps/${serviceId}`)
      .then(({ data: { data } }) => {
        data?.forEach((e: any) => {
          e.fieldCount = e?.fields?.length;
        });
        dispatch({
          type: 'initialize',
          data: data,
          count: data.length
        });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((err) => {
        dispatch({ type: 'loading', loading: false });
        toastConfig.setToastConfig(err);
      });
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${serviceMaster.api}/steps/${serviceId}/remove`, { ids: showConfirmBox.ids })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          message: data.message,
          severity: 'success'
        });
        fetchStepsData();
        setShowConfirmBox({ open: false, ids: null });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleArrangeUpdate = (rows: any[]) => {
    setIsAssigning(true);
    rows?.forEach((e: any) => {
      delete e.name;
    });
    axiosInstance()
      .put(`${serviceMaster.api}/steps/${serviceId}/order`, { data: rows || [] })
      .then(({ data }) => {
        fetchStepsData();
        setIsAssigning(false);
        setArrangeView(false);
        toastConfig.setToastConfig({
          open: true,
          message: data.message,
          severity: 'success'
        });
      })
      .catch((err) => {
        setIsAssigning(false);
        toastConfig.setToastConfig(err);
      });
  };

  const ActionsRenderer = (params) =>
    permissions?.serviceMaster?.isUpdate && (
      <>
        <HtmlTooltip title="Edit">
          <IconButton
            aria-label="setting"
            onClick={(e) => {
              setStepDialog({ open: true, stepId: params?.data?._id });
            }}
            size="small"
          >
            <EditIcon color="primary" fontSize="small" />
          </IconButton>
        </HtmlTooltip>
        <HtmlTooltip title="Add Fields">
          <IconButton
            aria-label="setting"
            onClick={(e) => {
              setStepFieldsDialog({ open: true, stepIds: [params?.data?._id] });
            }}
            size="small"
          >
            <AddCircleOutlineIcon color="primary" fontSize="small" />
          </IconButton>
        </HtmlTooltip>
        <HtmlTooltip title="Delete">
          <IconButton
            size="small"
            aria-label="Clone"
            onClick={() => {
              setShowConfirmBox({ open: true, ids: [params?.data?._id] });
            }}
          >
            <DeleteIcon color="error" fontSize="small" />
          </IconButton>
        </HtmlTooltip>
      </>
    );

  const StepNameRenderer = (params) =>
    params?.value ? (
      <p
        onClick={() => {
          setStepDialog({ open: true, stepId: params?.data?._id });
        }}
        className="link text-truncate"
      >
        {params.value}
      </p>
    ) : (
      <NoDataCell />
    );

  const frameworkComponents = {
    stepNameRenderer: StepNameRenderer,
    actionsRenderer: ActionsRenderer,
    commonRenderer: CommonRenderer
  };

  const openActions = (event) => {
    setAnchorActionEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorActionEl(null);
  };

  return (
    <>
      {permissions?.serviceMaster?.isUpdate && (
        <Box p={1}>
          <Grid container>
            <Grid item xs={3} md={3} sm={3}>
              <Button
                size="small"
                variant="contained"
                color="primary"
                onClick={() => {
                  setStepDialog({ open: true, stepId: '' });
                }}
              >
                Add Steps
              </Button>
            </Grid>
            <Grid item xs={9} md={9} sm={9}>
              <Box display={'flex'} justifyContent={'flex-end'} alignItems="center">
                {dataRows?.length ? (
                  <Button
                    variant="outlined"
                    className="btn-outline-v1"
                    size="small"
                    onClick={() => setArrangeView(true)}
                    startIcon={<DragIndicatorIcon fontSize="small" className="mr-1 dark:text-white text-[var(--primary)]" />}
                  >
                    Arrange
                  </Button>
                ) : null}
                <Box ml={1} />
                <Button
                  variant="outlined"
                  color="default"
                  size="small"
                  onClick={openActions}
                  aria-controls="action-menu"
                  disabled={selectedRecords.length === 0}
                  endIcon={<ExpandMore />}
                  className="new-dropdown-v1"
                >
                  Actions
                </Button>
                <Menu
                  anchorEl={anchorActionEl}
                  keepMounted
                  getContentAnchorEl={null}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left'
                  }}
                  id="action-menu"
                  open={Boolean(anchorActionEl)}
                  onClose={closeActions}
                >
                  <MenuItem
                    onClick={() => {
                      closeActions();
                      setStepFieldsDialog({ open: true, stepIds: selectedRecords?.map((e) => e._id) });
                    }}
                  >
                    Add Bulk Fields
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      closeActions();
                      setShowConfirmBox({ open: true, ids: selectedRecords?.map((e) => e._id) });
                    }}
                  >
                    Delete
                  </MenuItem>
                </Menu>
                <Box ml={1} />

                <ImportExportMenu
                  permissions={permissions?.packages}
                  module="packages-products"
                  api={`${serviceMaster.api}/steps/${serviceId}`}
                  afterImportCompleted={() => {
                    fetchStepsData();
                  }}
                  isExportAllOrSomeFeature={true}
                  total={rowCount}
                  recordsToExport={selectedRecords.length}
                  ids={
                    getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length
                      ? getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.map((obj) => obj._id)
                      : []
                  }
                  additionalParams={`serviceId=${serviceId}`}
                />
                {/* <ImportExportMenu
                  permissions={permissions?.serviceMaster}
                  module="Service Master Steps"
                  api={`${serviceMaster.api}/steps/${serviceId}`}
                  afterImportCompleted={() => {
                    fetchStepsData();
                  }}
                  isExportAllOrSomeFeature={true}
                  ids={[]}
                  onExportToExcelSuccess={() => {
                    if (gridApi) gridApi.deselectAll();
                    else fetchStepsData();
                  }}
                /> */}
              </Box>
            </Grid>
          </Grid>
        </Box>
      )}
      {columns && frameworkComponents ? (
        <CustomAgGrid
          allowSelection={permissions?.serviceMaster?.isUpdate}
          allowAction={permissions?.serviceMaster?.isUpdate}
          columns={columns}
          dataRows={dataRows}
          isClientSideGrid={true}
          frameworkComponents={frameworkComponents}
          setGridApi={setGridApi}
          dispatch={dispatch}
          rowCount={rowCount}
          limit={limit}
          pageSizes={pageSizes}
          page={page}
          actionWidth={150}
          loading={loading}
          renderedFrom={renderedFrom}
          refreshGrid={fetchStepsData}
        />
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {showConfirmBox.open && (
        <ConfirmationDialog
          open={true}
          message={`Are you sure you want to delete this step(s)?`}
          okBtnLoading={false}
          onClose={() => {
            setShowConfirmBox({ open: false, ids: null });
          }}
          onOk={handleDelete}
        />
      )}
      {stepDialog.open && (
        <StepDialog
          handleClose={() => {
            setStepDialog({ open: false, stepId: '' });
          }}
          handleSucess={() => {
            setStepDialog({ open: false, stepId: '' });
            fetchStepsData();
          }}
          serviceId={serviceId}
          steps={dataRows}
          stepId={stepDialog.stepId}
        />
      )}
      {stepFieldsDialog.open && (
        <FieldDialog
          serviceId={serviceId}
          stepIds={stepFieldsDialog.stepIds}
          steps={[]}
          handleClose={() => {
            setStepFieldsDialog({ open: false, stepIds: [] });
          }}
          handleSucess={() => {
            setStepFieldsDialog({ open: false, stepIds: [] });
            fetchStepsData();
          }}
        />
      )}
      {arrangeView && (
        <ArrangeView
          data={
            dataRows?.map((d) => {
              return { _id: d?._id, name: d?.stepName || '', order: d?.order };
            }) || []
          }
          title={'Arrange'}
          handleClose={() => setArrangeView(false)}
          handleSubmit={handleArrangeUpdate}
          loading={isAssigning}
        />
      )}
    </>
  );
};

export default Steps;
