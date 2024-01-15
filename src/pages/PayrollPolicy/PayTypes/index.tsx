import { useState, useEffect, useContext } from 'react';
import { Box, Grid, IconButton, Menu, MenuItem, Button } from '@material-ui/core';
import axiosInstance from 'src/axios/axiosInstance';
import { CHILD_RESOURCE, prepareDataForGrid } from 'src/constants/helpers';
import { camelCase } from 'lodash';
import routes from 'src/components/Helpers/Routes';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { useData } from '../../../StateProvider/Provider';
import { gridLoadingTimeout } from 'src/constants/helpers';
import DeleteIcon from '@material-ui/icons/Delete';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import EditIcon from '@material-ui/icons/Edit';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import { ExpandMore } from '@material-ui/icons';
import CustomReactTable, { getStaticFields, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import ManagePayType from './ManagePayType';
import { cloneDisable, deleteDisable, editDisable } from 'src/constants/messageHelpers';
import FileCopyIcon from '@material-ui/icons/FileCopy'

const Steps = ({ payrollPolicyId }) => {
  const renderedFrom = `${camelCase(routes?.payrollPolicy?.title)}_payTypes`;
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer();
  const { selectedRecords } = state;
  const {
    state: { permissions }
  }: any = useData();

  const [payTypeDialog, setPayTypeDialog] = useState({ open: false, data: null, isClone: false });
  const [showConfirmBox, setShowConfirmBox] = useState({ open: false, ids: null });
  const [anchorActionEl, setAnchorActionEl] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [columns, setColumns] = useState([]);
  const { generateColumns } = useColumns();

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.payTypes}`);
    data = response?.data?.data;
    const newColumns = generateColumns(renderedFrom, data);
    setColumns([...newColumns, ...getStaticFields(), ActionsRenderer]);
  };

  useEffect(() => {
    fetchGridColumns();
    fetchData();
  }, [payrollPolicyId]);

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 100,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        <HtmlTooltip title={permissions?.payrollPolicy?.isUpdate ? 'Edit' : editDisable}>
          <IconButton
            size="small"
            aria-label="Edit"
            disabled={!permissions?.payrollPolicy?.isUpdate}
            onClick={() => {
              setPayTypeDialog({ open: true, data: row?.original, isClone: false });
            }}
          >
            <EditIcon color={permissions?.payrollPolicy?.isUpdate ? 'primary' : 'disabled'} />
          </IconButton>
        </HtmlTooltip>
        <HtmlTooltip title={permissions?.payrollPolicy?.isCreate ? 'Clone' : cloneDisable}>
          <IconButton
            size="small"
            aria-label="Clone"
            disabled={!permissions?.payrollPolicy?.isCreate}
            onClick={() => {
              setPayTypeDialog({ open: true, isClone: true, data: row?.original });
            }}
          >
            <FileCopyIcon fontSize="small" color={permissions?.payrollPolicy?.isCreate ? 'primary' : 'disabled'} />
          </IconButton>
        </HtmlTooltip>
        <HtmlTooltip title={permissions?.payrollPolicy?.isDelete ? 'Delete' : deleteDisable}>
          <IconButton
            size="small"
            aria-label="Delete"
            disabled={!permissions?.payrollPolicy?.isDelete}
            onClick={() => {
              setShowConfirmBox({ open: true, ids: [row?.original?._id] });
            }}
          >
            <DeleteIcon color={permissions?.payrollPolicy?.isDelete ? 'error' : 'disabled'} />
          </IconButton>
        </HtmlTooltip>
      </>
    )
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    axiosInstance()
      .get(`${routes.payrollPolicy.path}/pay-types/${payrollPolicyId}`)
      .then(({ data: { data } }) => {
        data = data?.map((u) => {
          let finalObject = prepareDataForGrid(u);
          return {
            ...finalObject
          };
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
    setDeleting(true);
    axiosInstance()
      .put(`${routes.payrollPolicy.path}/pay-types/remove`, { ids: showConfirmBox.ids })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          message: data.message,
          severity: 'success'
        });
        setDeleting(false);
        fetchData();
        setShowConfirmBox({ open: false, ids: null });
      })
      .catch((err) => {
        setDeleting(false);
        toastConfig.setToastConfig(err);
      });
  };

  const openActions = (event) => {
    setAnchorActionEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorActionEl(null);
  };

  return (
    <>
      {permissions?.payrollPolicy?.isUpdate && (
        <Box p={1}>
          <Grid container>
            <Grid item xs={3} md={3} sm={3}>
              <Button
                size="small"
                variant="contained"
                color="primary"
                onClick={() => {
                  setPayTypeDialog({ open: true, data: null, isClone: false });
                }}
              >
                Add Pay Type
              </Button>
            </Grid>
            <Grid item xs={9} md={9} sm={9}>
              <Box display={'flex'} justifyContent={'flex-end'} alignItems="center">
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
                      setShowConfirmBox({ open: true, ids: selectedRecords?.map((e) => e._id) });
                    }}
                  >
                    Delete
                  </MenuItem>
                </Menu>
                <Box ml={1} />
              </Box>
            </Grid>
          </Grid>
        </Box>
      )}
      {columns ? (
        <CustomReactTable
          height={'calc(100vh - 200px)'}
          columns={columns}
          state={state}
          dispatch={dispatch}
          renderedFrom={renderedFrom}
          isClientSideGrid={true}
          refreshGrid={fetchData}
        />
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {payTypeDialog.open && (
        <ManagePayType
          onClose={() => setPayTypeDialog({ open: false, data: null, isClone: false })}
          onSuccess={() => {
            setPayTypeDialog({ open: false, data: null, isClone: false });
            fetchData();
          }}
          payTypeData={payTypeDialog.data}
          payrollPolicyId={payrollPolicyId}
          isClone={payTypeDialog.isClone}
        />
      )}
      {showConfirmBox.open && (
        <ConfirmationDialog
          open={true}
          message={`Are you sure you want to delete this Pay Type?`}
          okBtnLoading={deleting}
          onClose={() => {
            setShowConfirmBox({ open: false, ids: null });
          }}
          onOk={handleDelete}
        />
      )}
    </>
  );
};

export default Steps;
