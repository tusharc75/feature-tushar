import { Box, Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import { gridLoadingTimeout, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import { cloneDisable, deleteDisable } from 'src/constants/messageHelpers';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import ManagePayrollPolicy from './ManagePayrollPolicy';
import { ListingPageHeader } from 'src/components/PageHeaders';
import axios, { CancelTokenSource } from 'axios';

const PayrollPolicy = () => {
  const renderedFrom = camelCase(sidebarResource.payrollPolicy);
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { generateColumns } = useColumns();

  const {
    state: { user, permissions, resources }
  }: any = useData();

  const [columns, setColumns] = useState(null);
  const [showManageDialog, setShowManageDialog] = useState({ open: false, isClone: false, idToClone: null });
  const [renderCount, setRenderCount] = useState(0);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=${sidebarResource?.payrollPolicy}`);
    data = response?.data?.data;
    const newColumns = generateColumns(renderedFrom, data, routes.payrollPolicyDetail.path, true);
    setColumns([...newColumns, ...getStaticFields(), ActionsRenderer]);
  };

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 130,
    width: 130,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        <HtmlTooltip title={permissions?.payrollPolicy?.isCreate ? 'Clone' : cloneDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Clone"
              disabled={permissions?.payrollPolicy?.isCreate ? false : true}
              onClick={() => {
                setShowManageDialog({ open: true, isClone: true, idToClone: row.original._id });
              }}
            >
              <FileCopyIcon fontSize="small" color={permissions?.payrollPolicy?.isCreate ? 'primary' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>

        <HtmlTooltip title={row?.original?.canDelete ? 'Delete' : deleteDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Delete"
              disabled={row?.original?.canDelete ? false : true}
              onClick={() => {
                setDeleteRecord(row.original);
                setShowDeleteConfirmBox(true);
              }}
            >
              <DeleteIcon fontSize="small" color={row?.original?.canDelete ? 'error' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
      </>
    )
  };

  useEffect(() => {
    if (renderCount > 0) {
      const cancelTokenSource = axios.CancelToken.source();
      fetchData(cancelTokenSource);
      return () => cancelTokenSource.cancel();
    } else {
      setRenderCount(renderCount + 1);
    }
  }, [search, page, limit, filters, sorting, showFilteredRecordsOnly]);

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}`;
    if (isExport) {
      deepFilter = `?`;
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
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || [])?.map((m) => m._id))}`;
    }
    return deepFilter;
  };

  const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    axiosInstance()
      .get(`${routes?.payrollPolicy?.path}${queryString}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data, count } }) => {
        let rows = data?.map((u) => {
          let finalObject: any = prepareDataForGrid(u, user);
          finalObject['isChecked'] = selectedRecords?.some((s) => s._id === u._id);
          finalObject['allowedToEdit'] = permissions?.payrollPolicy?.isUpdate;
          finalObject['canDelete'] = permissions?.payrollPolicy?.isDelete;
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

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const handleDelete = () => {
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords?.map((d) => d._id);
    }
    axiosInstance()
      .put(`${routes?.payrollPolicy?.path}/remove`, { ids: ids })
      .then(() => {
        dispatch({ type: 'selection', selectedRecords: [] });
        fetchData();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const ActionMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={!((selectedRecords?.length > 0 && selectedRecords?.filter((e) => e?.canDelete === true)?.length) === selectedRecords?.length)}
          onClick={() => {
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
        <CustomBreadCrumbs routes={[{ ...routes.payrollPolicy, title: resources?.payrollPolicy?.titlePlural }]} />
      </div>
      <CustomContainer>
        <ListingPageHeader
          // toggleButtonList
          // onToggle
          // selectedType
          // setSelectedType
          // leftSideContents
          searchValue={search}
          onSearch={handleSearch}
          // rightSideContents
          isActionButtonVisible={permissions?.payrollPolicy?.isDelete}
          actionButtonProps={{ disabled: selectedRecords?.length ? false : true }}
          actionMenuItems={<ActionMenuItems />}
          addButtonProps={{ disabled: !permissions?.payrollPolicy.isCreate }}
          addButtonOnclick={() => {
            setShowManageDialog({ open: true, isClone: false, idToClone: null });
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
            resource={sidebarResource.payrollPolicy}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomContainer>
      {showDeleteConfirmBox && (
        <ConfirmationDialog
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete ${resources?.payrollPolicy?.titleSingular} ${deleteRecord?.payrollPolicyName || ''} ?`}
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}

      {showManageDialog.open && (
        <ManagePayrollPolicy
          isClone={showManageDialog.isClone}
          id={showManageDialog.idToClone}
          onClose={() => setShowManageDialog({ open: false, isClone: false, idToClone: null })}
          onSuccess={() => {
            fetchData();
            setShowManageDialog({ open: false, isClone: false, idToClone: null });
          }}
        />
      )}
    </section>
  );
};

export default PayrollPolicy;
