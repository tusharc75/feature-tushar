import { Button, IconButton } from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../../StateProvider/Provider';
import axiosInstance from '../../../axios/axiosInstance';
import { gridLoadingTimeout, prepareDataForGrid, sidebarResource } from '../../../constants/helpers';
import routes from './../../../components/Helpers/Routes';
import { camelCase } from 'lodash';
import CustomReactTable, { getStaticFields, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import AssignSerializedAssetDialog from 'src/components/AssignRolesDialog/AssignSerializedAssetDialog';
import { ExpandMore } from '@material-ui/icons';
import { Menu, MenuItem, Box } from '@material-ui/core';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import DeleteIcon from '@material-ui/icons/Delete';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialogRaw from '../../../components/Helpers/ConfirmationDialog';
import ImportExportMenu from 'src/components/Helpers/ImportExportMenu';
import { useHistory } from 'react-router-dom';
import queryString from 'query-string';
import AssignDynamicDialog from 'src/components/AssignRolesDialog/AssignDynamicDialog';
import CustomTabs, { CustomTab } from 'src/components/CustomTabs';

const SupplierItems = ({ api, id, allowedToEdit, permission }) => {
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { itemTab }: any = parsed;
  const toastConfig = useContext(CustomToastContext);

  const { generateColumns } = useColumns();

  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();

  const [tabValue, setTabValue] = useState(itemTab ? parseInt(itemTab) : 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignDialog, setAssignDialog] = useState({ open: false, type: null, data: null });
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [columns, setColumns] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

  const renderedFrom = camelCase(
    tabValue === 0 ? sidebarResource.productCategory : tabValue === 1 ? sidebarResource.product : routes?.serializedAsset.title
  );

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, page, limit, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

  useEffect(() => {
    setColumns(null);
    fetchFields();
  }, [tabValue]);

  useEffect(() => {
    fetchData();
  }, [page, limit, filters, sorting, selectedEntity, showFilteredRecordsOnly]);

  const fetchFields = async () => {
    let data;
    const selectedResourceData: any =
      tabValue === 0 ? sidebarResource.productCategory : tabValue === 1 ? sidebarResource.product : sidebarResource.serializedAsset;
    const path = tabValue === 0 ? routes.productCategoryDetail.path : tabValue === 1 ? routes.productDetail.path : routes.serializedAssetDetail.path;
    const response = await axiosInstance().get(`/field?resource=${selectedResourceData}`);
    data = response?.data?.data;
    const newColumns = generateColumns(renderedFrom, data, path);
    setColumns([...newColumns, ...getStaticFields(), ActionsRenderer]);
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
        <HtmlTooltip title="Delete">
          <IconButton
            size="small"
            aria-label="Delete"
            onClick={() => {
              setDeleteRecord(row.original);
              setShowDeleteConfirmBox(true);
            }}
          >
            <DeleteIcon color="error" />
          </IconButton>
        </HtmlTooltip>
      </>
    )
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .get(`${api}/items/${id}/${tabValue === 0 ? 'productCategory' : tabValue === 1 ? 'product' : 'serializedAsset'}`)
      .then(({ data: { data } }) => {
        let rows = data?.map((u) => {
          let finalObject = prepareDataForGrid(u, user);
          return finalObject;
        });
        dispatch({ type: 'initialize', data: rows, count: rows?.length });
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
    setIsSubmitting(true);
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords?.map((d) => d._id);
    }
    axiosInstance()
      .put(`${api}/items/${id}/delete`, { ids: ids })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        dispatch({ type: 'selection', selectedRecords: [] });
        fetchData();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
        setAnchorEl(null);
        setIsSubmitting(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setIsSubmitting(false);
      });
  };

  const assignItems = async (values) => {
    setIsSubmitting(true);
    axiosInstance()
      .put(`${api}/items/${id}/assign`, values)
      .then(({ data }) => {
        fetchData();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setIsSubmitting(false);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setIsSubmitting(false);
      });
  };

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    history.push(`?itemTab=${newValue}`);
    setTabValue(newValue);
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Box display="flex" justifyContent={'space-between'}>
        <Box />
        <ImportExportMenu
          permissions={permission}
          module="supplier-account-items"
          api={`${api}/items/${id}`}
          afterImportCompleted={() => {
            fetchData();
          }}
          isExportAllOrSomeFeature={true}
          ids={[]}
          additionalParams={``}
        />
      </Box>
      <CustomTabs value={tabValue} onChange={handleMainTabChange}>
        <CustomTab value={0} label={'Product Category'} primaryColor={true} />
        <CustomTab value={1} label={'Products'} primaryColor={true} />
        <CustomTab value={2} label={'Assets'} primaryColor={true} />
      </CustomTabs>
      <Box display="flex" justifyContent={'space-between'}>
        {allowedToEdit && (
          <>
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={() => {
                if (tabValue === 0) {
                  setAssignDialog({ open: true, type: 'productCategory', data: dataRows });
                } else if (tabValue === 1) {
                  setAssignDialog({ open: true, type: 'product', data: dataRows });
                } else {
                  setAssignDialog({ open: true, type: 'serializedAsset', data: dataRows });
                }
              }}
            >
              Add {tabValue === 0 ? 'Product Category' : tabValue === 1 ? 'Product' : 'Asset'}
            </Button>
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
                  setShowDeleteConfirmBox(true);
                }}
              >
                {`Delete (${selectedRecords?.length})`}
              </MenuItem>
            </Menu>
          </>
        )}
      </Box>
      {columns ? (
        <CustomReactTable
          height={'calc(100vh - 200px)'}
          columns={columns}
          state={state}
          dispatch={dispatch}
          renderedFrom={renderedFrom}
          isClientSideGrid={true}
          refreshGrid={fetchData}
          showOnlyShowFilteredRecordSwitch={false}
        />
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {assignDialog.open && assignDialog.type === 'product' && (
        <AssignProductDialog
          ids={assignDialog?.data?.map((item) => item._id) || []}
          handleCloseDialog={() => setAssignDialog({ open: false, type: null, data: null })}
          onSuccess={(data) => {
            setAssignDialog({ open: false, type: null, data: null });
            assignItems({ products: data?.map((item) => item._id) || [] });
          }}
          serialized={true}
          isSubmitting={isSubmitting}
        />
      )}
      {assignDialog.open && assignDialog.type === 'serializedAsset' && (
        <AssignSerializedAssetDialog
          reference={'supplier'}
          referenceData={null}
          ids={assignDialog?.data?.map((item) => item._id) || []}
          isAssigning={false}
          handleClose={() => setAssignDialog({ open: false, type: null, data: null })}
          handleSucess={(data) => {
            const assignData = data?.map((item) => item.id);
            assignItems({ serializedAssets: assignData || [] });
            setAssignDialog({ open: false, type: null, data: null });
          }}
        />
      )}
      {assignDialog.open && assignDialog.type === 'productCategory' && (
        <AssignDynamicDialog
          onSuccess={(data) => {
            const assignData = data?.map((item) => item.id);
            assignItems({ productCategories: assignData || [] });
            setAssignDialog({ open: false, type: null, data: null });
          }}
          handleClose={() => {
            setAssignDialog({ open: false, type: null, data: null });
          }}
          ids={assignDialog?.data?.map((item) => item._id) || []}
          resource={sidebarResource?.productCategory}
          isSubmitting={false}
        />
      )}
      {showDeleteConfirmBox && (
        <ConfirmationDialogRaw
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete the ${tabValue === 0 ? 'Product Category' : tabValue === 1 ? 'Product' : 'Asset'} ?`}
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          okBtnLoading={isSubmitting}
          onOk={handleDelete}
        />
      )}
    </>
  );
};

export default SupplierItems;
