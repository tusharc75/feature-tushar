import { useState, useEffect, useContext } from 'react';
import { Box, IconButton, MenuItem } from '@mui/material';
import axiosInstance from 'src/axios/axiosInstance';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { camelCase } from 'lodash';
import { gridLoadingTimeout, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import { Delete, Edit, FileCopy } from '@mui/icons-material';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import axios, { CancelTokenSource } from 'axios';
import { cloneDisable, deleteDisable, editDisable } from 'src/constants/messageHelpers';
import { ListingPageHeader } from 'src/components/PageHeaders';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import CustomContainer from 'src/components/CustomContainer';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { fetch_resource_view_fields } from 'src/components/ResourceFields';
import ManageOnboarding from './ManageOnboarding';

const Onboarding = () => {
  const renderedFrom = camelCase(sidebarResource.onboarding);
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { user, permissions, selectedEntity, resources }
  }: any = useData();

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const [showManageDialog, setShowManageDialog] = useState({ open: false, id: null, isClone: false });
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState({ open: false, data: null });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [columns, setColumns] = useState(null);

  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = async () => {
    const { fieldsDataForRead } = await fetch_resource_view_fields(
      sidebarResource?.onboarding,
      permissions?.onboarding?.isUpdate
    );
    const newColumns = generateColumns(
      renderedFrom,
      fieldsDataForRead,
      routes.onboardingDetail.path,
      true
    );
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
        <HtmlTooltip title={permissions?.onboarding?.isUpdate ? 'Edit' : editDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Edit"
              disabled={!permissions?.onboarding?.isUpdate}
              onClick={() => {
                setShowManageDialog({ open: true, id: row.original._id, isClone: false });
              }}
            >
              <Edit fontSize="small" color={permissions?.onboarding?.isUpdate ? 'primary' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
        <HtmlTooltip title={permissions?.onboarding?.isCreate ? 'Clone' : cloneDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Clone"
              disabled={!permissions?.onboarding?.isCreate}
              onClick={() => {
                setShowManageDialog({ open: true, id: row.original._id, isClone: true });
              }}
            >
              <FileCopy fontSize="small" color={permissions?.onboarding?.isCreate ? 'primary' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
        <HtmlTooltip title={permissions?.onboarding?.isDelete ? 'Delete' : deleteDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Delete"
              disabled={!permissions?.onboarding?.isDelete}
              onClick={() => {
                setShowDeleteConfirmBox({ open: true, data: row.original });
              }}
            >
              <Delete fontSize="small" color={permissions?.onboarding?.isDelete ? 'error' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
      </>
    )
  };

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [page, limit, filters, sorting, selectedEntity, showFilteredRecordsOnly]);

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}`;

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

  const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    try {
      const response = await axiosInstance().get(`${routes.onboarding.path}${queryString}`, {
        cancelToken: cancelTokenSource?.token
      });

      const rows = response?.data?.data?.map((u) => {
        const finalObject = prepareDataForGrid(u, user);
        finalObject['isChecked'] = selectedRecords?.some((s) => s._id === u._id);
        return finalObject;
      });

      dispatch({ type: 'initialize', data: rows, count: response?.data?.count });
    } catch (error) {
      toastConfig.setToastConfig(error);
    } finally {
      setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);
    }
  };

  const handleDelete = async (data = null) => {
    let recordsToDelete = [];
    if (data) {
      recordsToDelete.push(data?._id);
    } else if (selectedRecords?.length) {
      recordsToDelete = selectedRecords?.map((r) => r?._id);
    }

    if (recordsToDelete.length > 0) {
      setDeleteLoading(true);
      try {
        await axiosInstance().put(`${routes.onboarding.path}/remove`, {
          ids: recordsToDelete
        });

        dispatch({ type: 'selection', selectedRecords: [] });
        setShowDeleteConfirmBox({ open: false, data: null });
        fetchData();
      } catch (error) {
        toastConfig.setToastConfig(error);
      } finally {
        setDeleteLoading(false);
      }
    }
  };

  const actionButtonMenuItems = () => {
    return (
      <MenuItem
        onClick={() => setShowDeleteConfirmBox({ open: true, data: null })}
        disabled={!selectedRecords?.length}
      >
        Delete
      </MenuItem>
    );
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs
          routes={[{ ...routes.onboarding, title: resources?.onboarding?.titlePlural }]}
        />
      </div>

      <CustomContainer>
        <ListingPageHeader
          searchValue={search}
          onSearch={handleSearch}
          isActionButtonVisible={permissions?.onboarding?.isDelete}
          actionButtonProps={{ disabled: !selectedRecords?.length }}
          actionMenuItems={actionButtonMenuItems()}
          addButtonOnclick={() => setShowManageDialog({ open: true, id: null, isClone: false })}
          isAddButtonVisible={permissions?.onboarding?.isCreate}
        />

        {columns ? (
          <Box zIndex={5} width={'100%'}>
            <CustomReactTable
              height={'calc(100vh - 200px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              renderedFrom={renderedFrom}
              refreshGrid={fetchData}
              showOnlyShowFilteredRecordSwitch={true}
              showFilters={true}
              resource={sidebarResource.onboarding}
            />
          </Box>
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomContainer>

      {showManageDialog.open && (
        <ManageOnboarding
          onClose={() => setShowManageDialog({ open: false, id: null, isClone: false })}
          onSuccess={() => {
            fetchData();
            setShowManageDialog({ open: false, id: null, isClone: false });
          }}
          id={showManageDialog.id}
          isClone={showManageDialog.isClone}
        />
      )}

      {showDeleteConfirmBox?.open && (
        <ConfirmationDialog
          open={showDeleteConfirmBox?.open}
          message={`Are you sure you want to delete ${showDeleteConfirmBox?.data
            ? `${resources?.onboarding?.titleSingular?.toLowerCase()}: ${showDeleteConfirmBox?.data?.componentName}`
            : 'selected record(s)'
            }?`}
          onClose={() => setShowDeleteConfirmBox({ open: false, data: null })}
          okBtnLoading={deleteLoading}
          onOk={() => handleDelete(showDeleteConfirmBox?.data)}
        />
      )}
    </section>
  );
};

export default Onboarding;
