import { Box, IconButton, MenuItem } from '@mui/material';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import routes from 'src/components/Helpers/Routes';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { gridLoadingTimeout, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ManageResourceDataMappingDialog from 'src/pages/ResourceDataMapping/ManageResourceDataMappingDialog';
import axios, { CancelTokenSource } from 'axios';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import ImportExportLinks from 'src/components/Helpers/ImportExportLinks';
import { deleteDisable, editDisable } from 'src/constants/messageHelpers';

const ResourceDataMapping = ({ resourceRendered }) => {
  const renderedFrom = camelCase(sidebarResource[resourceRendered]);
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { user, permissions, resources }
  }: any = useData();

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { generateColumns } = useColumns();

  const [columns, setColumns] = useState(null);
  const [openManageResourceDataMappingDialog, setOpenManageResourceDataMappingDialog] = useState({ open: false, _id: null });
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [search, page, limit, filters, sorting, showFilteredRecordsOnly]);

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=${sidebarResource[resourceRendered]}`);
    data = response?.data?.data;
    let newColumns = generateColumns(renderedFrom, data, routes.salesOrderDetail.path, true);
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
        <HtmlTooltip title={permissions?.[resourceRendered]?.isUpdate ? 'Edit' : editDisable}>
          <IconButton
            size="small"
            aria-label="Edit"
            disabled={permissions?.[resourceRendered]?.isUpdate ? false : true}
            onClick={() => {
              setOpenManageResourceDataMappingDialog({ open: true, _id: row?.original?._id });
            }}
          >
            <EditIcon color={permissions?.[resourceRendered]?.isUpdate ? 'primary' : 'disabled'} fontSize="small" />
          </IconButton>
        </HtmlTooltip>
        <HtmlTooltip title={permissions?.[resourceRendered]?.isDelete ? 'Delete' : deleteDisable}>
          <IconButton
            size="small"
            aria-label="Delete"
            disabled={permissions?.[resourceRendered]?.isDelete ? false : true}
            onClick={() => {
              setDeleteRecord(row.original);
              setShowDeleteConfirmBox(true);
            }}
          >
            <DeleteIcon color={permissions?.[resourceRendered]?.isDelete ? 'error' : 'disabled'} fontSize="small" />
          </IconButton>
        </HtmlTooltip>
      </>
    )
  };

  const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    axiosInstance()
      .get(`/resource-data-mapping${queryString}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data, count } }) => {
        let rows = data?.map((u) => {
          let finalObject = prepareDataForGrid(u, user);
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
    let deepFilter = `?resource=${sidebarResource[resourceRendered]}&page=${page}&limit=${limit}`;
    if (isExport) {
      deepFilter = `?resource=${sidebarResource[resourceRendered]}`;
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

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const handleDelete = async () => {
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords?.map((d) => d._id);
    }
    setDeleteLoading(true);
    axiosInstance()
      .put(`/resource-data-mapping/remove?resource=${sidebarResource[resourceRendered]}`, { ids })
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
        setDeleteLoading(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setDeleteLoading(false);
      });
  };

  const ActionMenuItems = () => {
    return (
      <>
        <MenuItem
          onClick={() => {
            if (selectedRecords?.length === 1) {
              setDeleteRecord(selectedRecords[0]);
            } else {
              setDeleteRecord(null);
            }
            setShowDeleteConfirmBox(true);
          }}
        >
          {`Delete (${selectedRecords?.length})`}
        </MenuItem>
      </>
    );
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ title: resources?.[resourceRendered]?.titlePlural }]} />
        <ImportExportLinks
          permissions={permissions?.[resourceRendered]}
          module={resources?.[resourceRendered]?.titlePlural}
          api={'/resource-data-mapping'}
          afterImportCompleted={() => {
            fetchData();
          }}
          isExportAllOrSomeFeature={true}
          total={rowCount}
          recordsToExport={selectedRecords?.length}
          ids={selectedRecords?.map((obj) => obj._id)}
          onExportToExcelSuccess={() => {
            fetchData();
          }}
          additionalParams={getQueryString(true)}
        />
      </div>
      <CustomContainer>
        <ListingPageHeader
          searchValue={search}
          onSearch={handleSearch}
          isActionButtonVisible={true}
          actionButtonProps={{ disabled: selectedRecords?.length ? false : true }}
          actionMenuItems={<ActionMenuItems />}
          addButtonOnclick={() => {
            setOpenManageResourceDataMappingDialog({ open: true, _id: null });
          }}
          isAddButtonVisible={true}
        />

        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
            showOnlyShowFilteredRecordSwitch={true}
            showFilters={true}
            resource={sidebarResource[resourceRendered]}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
        {openManageResourceDataMappingDialog.open && (
          <ManageResourceDataMappingDialog
            resourceRendered={resourceRendered}
            onClose={() => {
              setOpenManageResourceDataMappingDialog({ open: false, _id: null });
            }}
            onSuccess={() => {
              setOpenManageResourceDataMappingDialog({ open: false, _id: null });
              fetchData();
            }}
            resourceId={openManageResourceDataMappingDialog?._id}
          />
        )}
        {showDeleteConfirmBox && (
          <ConfirmationDialog
            open={showDeleteConfirmBox}
            message={`Are you sure you want to delete ?`}
            onClose={() => {
              setDeleteRecord(null);
              setShowDeleteConfirmBox(false);
            }}
            okBtnLoading={deleteLoading}
            onOk={handleDelete}
          />
        )}
      </CustomContainer>
    </section>
  );
};

export default ResourceDataMapping;
