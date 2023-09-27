import { Fragment, useContext, useEffect, useReducer, useState } from 'react';
import { Box, Button, Grid, IconButton, Menu, MenuItem, Tooltip } from '@material-ui/core';
import ConfirmationDialogRaw from 'src/components/Helpers/ConfirmationDialog';
import routes from 'src/components/Helpers/Routes';
import CustomAgGrid, { intialState, reducer } from 'src/components/AgGridComponents/CustomAgGrid';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import { gridLoadingTimeout, prepareDataForGrid } from 'src/constants/helpers';
import { camelCase } from 'lodash';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { ExpandMore } from '@material-ui/icons';
import { CommonRenderer, CreatedByRenderer, UpdatedByRenderer } from 'src/components/AgGridComponents/CustomAgGridCellRenderers';
import ManageCustomDataPoints from './ManageCustomDataPoints';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import FileCopyIcon from '@material-ui/icons/FileCopy';

export default function CustomDataPoints({ deviceTemplate }) {

  const renderedFrom = camelCase('CustomDataPoints');
  const toastConfig = useContext(CustomToastContext);
  
  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords, appendRows } = state;

  const [gridApi, setGridApi] = useState(null);
  const [columns, setColumns] = useState([]);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [open, setOpen] = useState({ open: false, isClone: false, id: null });
  const [anchorActionEl, setAnchorActionEl] = useState(null);

  useEffect(() => {
    fetchGridColumns();
    fetchData();
  }, []);

  const fetchGridColumns = () => {
    setColumns([
      { field: 'fieldLabel', headerName: 'Field Label', show: true, disabled: true, cellRenderer: 'fieldLabelRenderer' },
      { field: 'createdBy', headerName: 'Created By', show: true, filter: false, cellRenderer: 'createdByRenderer' },
      { field: 'updatedBy', headerName: 'Updated By', show: true, filter: false, cellRenderer: 'updatedByRenderer' }
    ]);
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    const response = await axiosInstance().get(`${routes?.deviceTemplates?.path}/custom-data-points?deviceTemplate=${deviceTemplate}`);
    const data = response?.data?.data;
    let rows = data?.map((u: any) => {
      let finalObject: any = prepareDataForGrid(u);
      finalObject['canDelete'] = true;
      finalObject['allowedToEdit'] = true;
      finalObject['isChecked'] = selectedRecords?.some((s) => s?._id === u?._id);
      return {
        ...finalObject
      };
    });
    let count = rows?.length;
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
  };

  const ActionsRenderer = (params) => (
    <Fragment>
      {params?.data?.allowedToEdit ? (
        <Tooltip title="Edit">
          <IconButton
            size="small"
            aria-label="Edit"
            onClick={() => {
              setOpen({ open: true, isClone: false, id: params?.data?._id });
            }}
          >
            <EditIcon fontSize="small" color="primary" />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip className="cursor-stop" title="You do not have permission to edit">
          <IconButton aria-label="Clone" size="small">
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      <Tooltip title="Clone">
        <IconButton
          size="small"
          aria-label="Clone"
          onClick={() => {
            setOpen({ open: true, isClone: true, id: params?.data?.id });
          }}
        >
          <FileCopyIcon fontSize="small" color="primary" />
        </IconButton>
      </Tooltip>
      {params?.data?.canDelete ? (
        <Tooltip title="Delete">
          <IconButton
            size="small"
            aria-label="Delete"
            onClick={() => {
              setDeleteRecord(params.data);
              setShowDeleteConfirmBox(true);
            }}
          >
            <DeleteIcon fontSize="small" color="error" />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip className="cursor-stop" title="You do not have permission to delete">
          <IconButton aria-label="Delete" size="small">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Fragment>
  );

  const FieldLabelRenderer = (params) =>
    params?.value ? (
      <p
        onClick={() => {
          setOpen({ open: true, isClone: false, id: params?.data?._id });
        }}
        className="link text-truncate"
      >
        {params.value}
      </p>
    ) : (
      <NoDataCell />
    );

  const frameworkComponents = {
    commonRenderer: CommonRenderer,
    fieldLabelRenderer: FieldLabelRenderer,
    createdByRenderer: CreatedByRenderer,
    updatedByRenderer: UpdatedByRenderer,
    actionsRenderer: ActionsRenderer
  };

  const handleDelete = () => {
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords.map((m) => m._id);
    }
    axiosInstance()
      .put(`${routes?.deviceTemplates?.path}/custom-data-points/remove`, { ids: ids })
      .then(({ data }) => {
        fetchData();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const openActions = (event) => {
    setAnchorActionEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorActionEl(null);
  };

  return (
    <Fragment>
      <Box p={1} pb={2}>
        <Grid container>
          <Grid item xs={3} md={3} sm={3}>
            <Button
              size="small"
              variant="contained"
              color="primary"
              onClick={() => {
                setOpen({ open: true, isClone: false, id: null });
              }}
            >
              Add
            </Button>
          </Grid>
          <Grid item xs={9} md={9} sm={9}>
            <Box display={'flex'} justifyContent={'flex-end'} alignItems="center">
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
                    selectedRecords.length === 1 && setDeleteRecord(selectedRecords[0]);
                    setShowDeleteConfirmBox(true);
                  }}
                >
                  Delete
                </MenuItem>
              </Menu>
            </Box>
          </Grid>
        </Grid>
      </Box>
      {columns && Object.keys(frameworkComponents).length > 0 ? (
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
          actionWidth={150}
          loading={loading}
          renderedFrom={renderedFrom}
          refreshGrid={fetchData}
          showOnlyShowFilteredRecordSwitch={true}
          isClientSideGrid={true}
        />
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}

      {open.open && (
        <ManageCustomDataPoints
          deviceTemplate={deviceTemplate}
          open={open?.open}
          isClone={open?.isClone}
          id={open?.id}
          onClose={() => setOpen({ open: false, isClone: false, id: null })}
          onSuccess={() => {
            setOpen({ open: false, isClone: false, id: null });
            fetchData();
          }}
        />
      )}

      {showDeleteConfirmBox && (
        <ConfirmationDialogRaw
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete ?`}
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
    </Fragment>
  );
}
