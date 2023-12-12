import { useState, useEffect, useContext, Fragment } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { Box, Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import routes from 'src/components/Helpers/Routes';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTableNew';
import { repairType, gridLoadingTimeout, sidebarResource } from 'src/constants/helpers';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { useData } from 'src/StateProvider/Provider';
import { prepareDataForGrid } from 'src/constants/helpers';
import { isMobile, isTablet } from 'react-device-detect';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { ExpandMore } from '@material-ui/icons';
import { deleteDisable } from 'src/constants/messageHelpers';
import AssignDynamicDialog from 'src/components/AssignRolesDialog/AssignDynamicDialog';

interface Props {
  renderedFrom: string;
  id: string;
}

const ProductRepairType = (props: Props) => {
  const { renderedFrom, id } = props;
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer();
  const { dataRows, selectedRecords } = state;

  const [columns, setColumns] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [isDeleting, setDeleting] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

  const {
    state: { permissions }
  }: any = useData();
  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=${repairType.resource}`)
      .then(({ data: { data } }) => {
        const newColumns = generateColumns(routes.repairType?.title, data, routes.repairTypeDetail.path);
        setColumns([...newColumns, ActionsRenderer]);
      });
  };

  const fetchData = () => {
    dispatch({ type: 'selection', selectedRecords: [] });
    dispatch({ type: 'loading', loading: true });

    axiosInstance()
      .get(`${routes.product.path}/${id}/repair-type`)
      .then(({ data: { data } }) => {
        let rows = data?.map((u) => {
          let finalObject = prepareDataForGrid(u);
          let res = {
            ...finalObject
          };
          return res;
        });
        dispatch({
          type: 'initialize',
          data: rows,
          count: data.length
        });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 150,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        <HtmlTooltip title={permissions?.product?.isUpdate ? 'Delete' : deleteDisable}>
          <span>
            <IconButton
              disabled={permissions?.product?.isUpdate ? false : true}
              size="small"
              aria-label="Delete"
              onClick={() => {
                setDeleteRecord(row?.original);
                setShowDeleteConfirmBox(true);
              }}
            >
              <DeleteIcon color={permissions?.product?.isUpdate ? 'error' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
      </>
    )
  };

  const handleDelete = () => {
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
      setDeleteRecord(null);
    } else {
      ids = selectedRecords.map((d) => d._id);
    }
    setDeleting(true);
    closeActions();
    axiosInstance()
      .put(`${routes.product.path}/${id}/repair-type/remove`, { ids: ids })
      .then(() => {
        fetchData();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
        setDeleting(false);
      })
      .catch((error) => {
        setDeleting(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleSubmit = (ids: string[]) => {
    setSubmitting(true);
    axiosInstance()
      .post(`${routes.product.path}/${id}/repair-type`, {
        repairType: ids
      })
      .then(() => {
        fetchData();
        setSubmitting(false);
        setOpenAddDialog(false);
      })
      .catch((err) => {
        setSubmitting(false);
        toastConfig.setToastConfig(err);
      });
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  return (
    <Fragment>
      {permissions?.product?.isUpdate && (
        <Box display="flex" justifyContent="space-between" p={1} pt={2} pb={2}>
          <Button variant="contained" color="primary" size="small" onClick={() => setOpenAddDialog(true)}>
            Add Repair Types
          </Button>
          <Box display={'flex'}>
            <Button
              variant={isMobile && !isTablet ? 'text' : 'outlined'}
              color="default"
              size="small"
              onClick={openActions}
              disabled={selectedRecords.length ? false : true}
              aria-controls="action-menu"
              style={{ marginLeft: '0.6rem' }}
              endIcon={<ExpandMore />}
              className="new-dropdown-v1"
            >
              {isMobile && !isTablet ? '' : 'Actions'}
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
              <MenuItem disabled={selectedRecords.length === 0} onClick={() => setShowDeleteConfirmBox(true)}>
                Delete
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      )}
      {columns ? (
        <CustomReactTable
          height={'calc(100vh - 150px)'}
          columns={columns}
          state={state}
          dispatch={dispatch}
          renderedFrom={renderedFrom}
          refreshGrid={fetchData}
          isClientSideGrid={true}
          hideSelection={!permissions?.product.isUpdate}
          hideAction={!permissions?.product.isUpdate}
        />
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {showDeleteConfirmBox && (
        <ConfirmationDialog
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete the ${routes.repairType?.title} ? `}
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          onOk={handleDelete}
          okBtnLoading={isDeleting}
        />
      )}
      {openAddDialog && (
        <AssignDynamicDialog
          resource={sidebarResource?.repairType}
          onSuccess={(data) => {
            handleSubmit(data?.map((d) => d?._id));
          }}
          handleClose={() => {
            setOpenAddDialog(false);
          }}
          ids={dataRows.map((d) => d?._id)}
          isSubmitting={isSubmitting}
        />
      )}
    </Fragment>
  );
};

export default ProductRepairType;
