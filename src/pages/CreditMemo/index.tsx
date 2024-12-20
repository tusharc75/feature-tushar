import { Box, IconButton, MenuItem } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { camelCase, sortBy } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomContainer from '../../components/CustomContainer';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import { checkIsAllowedToDelete, getDefaultMyRecordType, gridLoadingTimeout, INVOICE_STATUS, prepareDataForGrid, sidebarResource } from '../../constants/helpers';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import ManageCreditMemo from './ManageCreditMemo';
import { ListingPageHeader } from 'src/components/PageHeaders';
import axios, { CancelTokenSource } from 'axios';
import MessageDialog from 'src/components/Helpers/MessageDialog';
import { cloneDisable, deleteDisable } from 'src/constants/messageHelpers';
import { Delete } from '@material-ui/icons';

const CreditMemo = () => {
  const {
    state: { user, permissions, selectedEntity, resources }
  }: any = useData();

  const types = [
    {
      key: `My ${resources?.creditMemo?.titlePlural}`,
      value: 1
    },
    {
      key: `All ${resources?.creditMemo?.titlePlural}`,
      value: 2
    }
  ];

  const renderedFrom = camelCase(sidebarResource.creditMemo);
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { generateColumns } = useColumns();

  const [selectedType, setSelectedType] = useState(getDefaultMyRecordType(user.user, sidebarResource.creditMemo));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState({ open: false, isClone: false, idToClone: null });
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);

  const [columns, setColumns] = useState(null);
  const [statusOptions, setStatusOptions] = useState(null);
  const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] = useState(false);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [search, page, limit, selectedType, filters, sorting, selectedEntity, showFilteredRecordsOnly]);

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=${sidebarResource?.creditMemo}`);
    data = response?.data?.data;
    data?.forEach((d) => {
      if (d?.fieldData?.fieldName === 'status') {
        const statusOps = d?.fieldData?.option?.filter((e) => ![INVOICE_STATUS.cancelled, INVOICE_STATUS.new].includes(e.optionValue));
        setStatusOptions(statusOps);
      }
    });
    let newColumns = generateColumns(renderedFrom, data, routes.creditMemoDetail.path, true);
    setColumns([...newColumns, ...getStaticFields(), ActionsRenderer]);
  };

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
        <HtmlTooltip title={permissions?.creditMemo?.isCreate ? 'Clone' : cloneDisable}>
          <IconButton
            size="small"
            aria-label="Clone"
            onClick={() => {
              setShowManageDialog({ open: true, isClone: true, idToClone: row.original._id });
            }}
            disabled={permissions?.creditMemo?.isCreate ? false : true}
          >
            <FileCopyIcon fontSize="small" color={permissions?.creditMemo?.isCreate ? 'primary' : 'disabled'} />
          </IconButton>
        </HtmlTooltip>
        <HtmlTooltip title={row?.original?.canDelete ? 'Delete' : deleteDisable}>
          <IconButton
            size="small"
            aria-label="Delete"
            onClick={() => {
              setDeleteRecord(row.original);
              setShowDeleteConfirmBox(true);
            }}
            disabled={row?.original?.canDelete ? false : true}
          >
            <Delete fontSize="small" color={row?.original?.canDelete ? 'error' : 'disabled'} />
          </IconButton>
        </HtmlTooltip>
      </>
    )
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}`;
    if (isExport) {
      deepFilter = `?`;
    }

    if (selectedType === 1) {
      deepFilter = deepFilter + `&myRecords=1`;
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
      .get(`${routes.creditMemo.path}${queryString}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data } }) => {
        let count = data?.count;
        let rows = data?.data?.map((u) => {
          let finalObject: any = prepareDataForGrid(u, user);
          finalObject['isChecked'] = false;
          finalObject['allowedToEdit'] = permissions?.creditMemo?.isUpdate;
          finalObject['canDelete'] = permissions?.creditMemo?.isDelete && checkIsAllowedToDelete(user, sidebarResource.creditMemo, finalObject?.ownerId) && u?.canDelete;
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
    setIsSubmitting(true);
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords?.map((d) => d._id);
    }
    axiosInstance()
      .put(`${routes.creditMemo.path}/remove`, { ids: ids })
      .then(() => {
        dispatch({ type: 'selection', selectedRecords: [] });
        fetchData();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
        setIsSubmitting(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setIsSubmitting(false);
      });
  };

  const showConfirmBox = () => {
    if (selectedRecords?.find((d) => d.canDelete === false)) {
      setShowDeleteWarningConfirmBox(true);
    } else {
      setShowDeleteConfirmBox(true);
    }
  };

  const onTypeChange = (event, type) => {
    dispatch({ type: 'pageChange', page: 0 });
  };

  const ActionMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={!selectedRecords?.every((d) => d?.canDelete)}
          onClick={() => {
            if (selectedRecords.length === 1){ 
              setDeleteRecord(selectedRecords[0]);
              }else{
                setDeleteRecord(null)
              }
            showConfirmBox();
          }}
        >
          {`Delete (${selectedRecords?.length})`}
        </MenuItem>
        {permissions?.creditMemo?.isUpdate && selectedRecords?.length && !selectedRecords?.some((s) => s.status === 'Closed') && (
          <>
            {statusOptions?.map((status) => {
              return (
                <MenuItem
                  onClick={() => {
                    handleStatusUpdate(status?.optionValue);
                  }}
                  disabled={false}
                >
                  {`Status Change - ${status?.optionLabel}`}
                </MenuItem>
              );
            })}
          </>
        )}
      </>
    );
  };

  const handleStatusUpdate = (status) => {
    const isSameStatus = selectedRecords?.every((e) => e.status === selectedRecords[0].status);
    if (!isSameStatus) {
      toastConfig.setToastConfig({
        open: true,
        type: 'error',
        message: 'Please select Credit Memo with same status'
      });
      return;
    }
    const creditMemos = sortBy(selectedRecords, '_id').map((s) => ({ _id: s._id, prevStatus: s.status }));
    setIsSubmitting(true);
    axiosInstance()
      .put(`${routes.creditMemo.path}/update-status`, { creditMemos: creditMemos, status: status })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        dispatch({ type: 'selection', selectedRecords: [] });
        fetchData();
        setIsSubmitting(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setIsSubmitting(false);
      });
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ ...routes.creditMemo, title: resources?.creditMemo?.titlePlural }]} />
        <ImportExportLinks
          permissions={permissions?.creditMemo}
          module={resources?.creditMemo?.titlePlural}
          api={routes.creditMemo.path}
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
          onlyExport={true}
        />
      </div>
      <CustomContainer>
        <ListingPageHeader
          toggleButtonList={types}
          onToggle={onTypeChange}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          searchValue={search}
          onSearch={handleSearch}
          isActionButtonVisible={permissions?.creditMemo?.isDelete}
          actionButtonProps={{ disabled: selectedRecords?.length ? false : true }}
          actionMenuItems={<ActionMenuItems />}
          addButtonOnclick={() => {
            setShowManageDialog({ open: true, isClone: false, idToClone: null });
          }}
          isAddButtonVisible={permissions?.creditMemo?.isCreate}
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
            resource={sidebarResource.creditMemo}
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
          message={`Are you sure you want to delete ${deleteRecord ? `${resources?.creditMemo?.titleSingular?.toLowerCase()} : ${deleteRecord?.creditMemoNumber}` : `selected ${resources?.creditMemo?.titlePlural?.toLowerCase()}`} ?`}
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          okBtnLoading={isSubmitting}
          onOk={handleDelete}
        />
      )}
      {showManageDialog.open && (
        <ManageCreditMemo
          isClone={showManageDialog.isClone}
          creditMemoId={showManageDialog.idToClone}
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

export default CreditMemo;
