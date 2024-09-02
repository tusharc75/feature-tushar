import { Box, IconButton } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { camelCase } from 'lodash';
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
import { gridLoadingTimeout, prepareDataForGrid, sidebarResource } from '../../constants/helpers';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import ManageCreditMemo from './ManageCreditMemo';
import { ListingPageHeader } from 'src/components/PageHeaders';
import axios, { CancelTokenSource } from 'axios';

const CreditMemo = () => {
  const renderedFrom = camelCase(routes?.creditMemo.title);
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer();
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { generateColumns } = useColumns();

  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();

  const [selectedType, setSelectedType] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState({ open: false, isClone: false, idToClone: null });
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);

  const [columns, setColumns] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

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
    let newColumns = generateColumns(renderedFrom, data, routes.creditMemoDetail.path, true);
    setColumns([...newColumns, ...getStaticFields(), ActionsRenderer]);
    console.log(columns);
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
        {permissions?.creditMemo?.isCreate ? (
          <HtmlTooltip title="Clone">
            <IconButton
              size="small"
              aria-label="Clone"
              onClick={() => {
                setShowManageDialog({ open: true, isClone: true, idToClone: row.original._id });
              }}
            >
              <FileCopyIcon fontSize="small" color="primary" />
            </IconButton>
          </HtmlTooltip>
        ) : (
          <HtmlTooltip className="cursor-stop" title="You do not have permission to clone/create">
            <IconButton aria-label="Clone" size="small">
              <FileCopyIcon fontSize="small" />
            </IconButton>
          </HtmlTooltip>
        )}
        {permissions?.creditMemo?.isDelete && (
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
        )}
      </>
    )
  };

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
      .get(`${routes.creditMemo.path}${queryString}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data } }) => {
        let count = data?.count;
        let rows = data?.data?.map((u) => {
          let finalObject = prepareDataForGrid(u, user);
          finalObject['isChecked'] = false;
          finalObject['allowedToEdit'] = permissions?.creditMemo?.isUpdate;
          finalObject['canDelete'] = permissions?.creditMemo?.isDelete;
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
        setAnchorEl(null);
        setIsSubmitting(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setIsSubmitting(false);
      });
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[routes.creditMemo]} />
        <ImportExportLinks
          permissions={permissions?.creditMemo}
          module={routes.creditMemo.title}
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
          // toggleButtonList
          // onToggle
          // selectedType
          // setSelectedType
          // leftSideContents
          searchValue={search}
          onSearch={handleSearch}
          // rightSideContents
          isActionButtonVisible={false}
          // actionButtonProps
          // actionMenuItems
          // addButtonProps
          addButtonOnclick={() => {
            setShowManageDialog({ open: true, isClone: false, idToClone: null });
          }}
          isAddButtonVisible={permissions?.creditMemo?.isCreate }
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
          message={`Are you sure you want to delete ${routes?.creditMemo?.title} ${deleteRecord?.creditMemoNumber || ''} ?`}
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
