import { Box, Button, Grid, IconButton, Menu, MenuItem } from '@material-ui/core';
import { ExpandMore } from '@material-ui/icons';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import ManageHolidays from './ManageHolidays';
import axiosInstance from 'src/axios/axiosInstance';
import { CHILD_RESOURCE, gridLoadingTimeout, prepareDataForGrid } from 'src/constants/helpers';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import ImportExportMenu from 'src/components/Helpers/ImportExportMenu';

const Holidays = ({ payrollPolicyData }) => {
  const renderedFrom = `${camelCase(routes?.payrollPolicy?.title)}_holidays`;
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer();
  const { rowCount, selectedRecords } = state;
  const {
    state: { permissions, user }
  }: any = useData();

  const { generateColumns } = useColumns();

  const [columns, setColumns] = useState(null);
  const [manageHolidays, setManageHolidays] = useState({ open: false, id: null });
  const [anchorEl, setAnchorEl] = useState(null);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);

  useEffect(() => {
    fetchFields();
    fetchData();
  }, []);

  const fetchFields = async () => {
    const response = await axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.payrollHoliday}`);
    var data = response?.data?.data;
    const newColumns = generateColumns(renderedFrom, data);

    newColumns?.forEach((e: any) => {
      e.editable = false;
    });
    setColumns([
      ...newColumns,
      {
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
            <HtmlTooltip title={'Edit'}>
              <IconButton
                size="small"
                aria-label="Edit"
                onClick={() => {
                  setManageHolidays({ open: true, id: row?.original?._id });
                }}
              >
                <EditIcon fontSize="small" color={'primary'} />
              </IconButton>
            </HtmlTooltip>

            <HtmlTooltip title={'Delete'}>
              <IconButton
                size="small"
                aria-label="Delete"
                onClick={() => {
                  setShowConfirmBox(true);
                  setDeleteRecord(row?.original);
                }}
              >
                <DeleteIcon fontSize="small" color={'error'} />
              </IconButton>
            </HtmlTooltip>
          </>
        )
      }
    ]);
  };

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });

    axiosInstance()
      .get(`${routes.payrollPolicy?.path}/holidays/${payrollPolicyData?._id}`)
      .then(({ data: { data, count } }) => {
        let rows = data?.map((u) => {
          let finalObject: any = prepareDataForGrid(u, user);
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

  const handleDelete = () => {
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords?.map((d) => d._id);
    }
    axiosInstance()
      .put(`${routes?.payrollPolicy?.path}/holidays/${payrollPolicyData?._id}/remove`, { ids: ids })
      .then(() => {
        fetchData();
        setShowConfirmBox(false);
        setDeleteRecord(null);
        setAnchorEl(null);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
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
                  setManageHolidays({ open: true, id: null });
                }}
              >
                Add Holiday
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
                      setShowConfirmBox(true);
                    }}
                  >
                    Delete
                  </MenuItem>
                </Menu>
                <Box ml={1} />
                <ImportExportMenu
                  permissions={permissions?.payrollPolicy}
                  module="packages-products"
                  api={`${routes.payrollPolicy.path}/holidays/${payrollPolicyData?._id}`}
                  afterImportCompleted={() => {
                    fetchData();
                  }}
                  isExportAllOrSomeFeature={true}
                  total={rowCount}
                  recordsToExport={selectedRecords.length}
                  ids={selectedRecords?.length ? selectedRecords?.map((obj) => obj._id) : []}
                  additionalParams={`payrollPolicyId=${payrollPolicyData?._id}`}
                />
              </Box>
            </Grid>
          </Grid>
        </Box>
      )}

      {columns ? (
        <CustomReactTable
          height={'calc(100vh - 283px)'}
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
      {manageHolidays?.open && (
        <ManageHolidays
          payrollPolicyId={payrollPolicyData?._id}
          id={manageHolidays?.id}
          onSuccess={() => {
            fetchData();
            setManageHolidays({ open: false, id: null });
          }}
          onClose={() => {
            setManageHolidays({ open: false, id: null });
          }}
        />
      )}

      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${deleteRecord?.name || ''} ?`}
          onClose={() => {
            setDeleteRecord(null);
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
    </>
  );
};

export default Holidays;
