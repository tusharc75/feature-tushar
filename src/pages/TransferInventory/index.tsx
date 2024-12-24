import { Box, MenuItem } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { camelCase } from 'lodash';
import queryString from 'query-string';
import { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import ImportExportLinks from 'src/components/Helpers/ImportExportLinks';
import routes from 'src/components/Helpers/Routes';
import { ListingPageHeader } from 'src/components/PageHeaders';
import {
  checkIsAllowedToDelete,
  getDefaultMyRecordType,
  gridLoadingTimeout,
  prepareDataForGrid,
  sidebarResource,
  transferInventory
} from 'src/constants/helpers';
import { cloneDisable, deleteDisable } from 'src/constants/messageHelpers';
import ManageTransferInventory from './ManageTransferInventory';
import axios, { CancelTokenSource } from 'axios';
import { useSetWalkmeData } from 'src/components/CustomIntro';
import { createTransferInventoryFlow } from 'src/pages/TransferInventory/walkmeSteps';

const TransferInventory = () => {
  const { setWalkmeData } = useSetWalkmeData();
  const renderedFrom = camelCase(sidebarResource.transferInventory);
  const toastConfig = useContext(CustomToastContext);
  const [showManageTransferInventoryDialog, setShowManageTransferInventoryDialog] = useState({ open: false, isClone: false, idToClone: null });
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [isDeleting, setDeleting] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [columns, setColumns] = useState(null);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const history = useHistory();
  const { type }: any = queryString.parse(history.location.search);
  const {
    state: { user, permissions, selectedEntity, resources }
  }: any = useData();

  const types = [
    {
      key: `My ${resources?.transferInventory?.titlePlural}`,
      value: 1
    },
    {
      key: `All ${resources?.transferInventory?.titlePlural}`,
      value: 2
    }
  ];
  const [selectedType, setSelectedType] = useState(getDefaultMyRecordType(user.user, sidebarResource.transferInventory));

  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly, selectedType]);

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource.transferInventory}`)
      .then(({ data: { data } }) => {
        setWalkmeData([createTransferInventoryFlow(data, resources?.transferInventory?.titleSingular)]);
        const newColumns = generateColumns(renderedFrom, data, routes.transferInventoryDetail.path, true);
        setColumns([...newColumns, ...getStaticFields(), ActionsRenderer]);
      });
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
        <HtmlTooltip title={permissions?.transferInventory?.isCreate ? 'Clone' : cloneDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Clone"
              disabled={permissions?.transferInventory?.isCreate ? false : true}
              onClick={() => {
                setShowManageTransferInventoryDialog({ open: true, isClone: true, idToClone: row.original._id });
              }}
            >
              <FileCopyIcon fontSize="small" color={permissions?.transferInventory?.isCreate ? 'primary' : 'disabled'} />
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

  const fetchData = (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`${transferInventory.api}${queryString}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data, count } }) => {
        let rows = data?.map((u) => {
          let finalObject: any = prepareDataForGrid(u, user);
          finalObject['isChecked'] = false;
          finalObject['canDelete'] =
            permissions?.transferInventory?.isDelete &&
            checkIsAllowedToDelete(user, sidebarResource.transferInventory, finalObject?.ownerId) &&
            u?.canDelete;
          return finalObject;
        });
        dispatch({ type: 'initialize', data: rows, count: count });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}`;
    if (selectedType === 1) {
      deepFilter = deepFilter + `&myRecords=1`;
    }
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
      deepFilter = `${deepFilter}&getById=${JSON.stringify(selectedRecords.map((m) => m._id))}`;
    }
    return deepFilter;
  };

  const handleDelete = () => {
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords.map((d) => d._id);
    }
    if (ids?.length > 0) {
      setDeleting(true);
      axiosInstance()
        .put(`${transferInventory.api}/remove`, { ids: ids })
        .then(() => {
          dispatch({ type: 'selection', selectedRecords: [] });
          fetchData();
          setShowDeleteConfirmBox(false);
          setDeleteRecord(null);
          setDeleting(false);
        })
        .catch((error) => {
          setDeleting(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const onTypeChange = (event, type) => {
    dispatch({ type: 'pageChange', page: 0 });
  };

  const ActionMenuItems = () => {
    return (
      <MenuItem
        disabled={selectedRecords.every((e) => e?.canDelete) ? false : true}
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
    );
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ ...routes.transferInventory, title: resources?.transferInventory?.titlePlural }]} />
        <ImportExportLinks
          permissions={permissions?.transferInventory}
          module="transfer inventory"
          api={transferInventory.api}
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
          toggleButtonList={types}
          onToggle={onTypeChange}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          // leftSideContents
          searchValue={search}
          onSearch={handleSearch}
          // rightSideContents
          isActionButtonVisible={true}
          actionButtonProps={{ disabled: selectedRecords?.length ? false : true }}
          actionMenuItems={<ActionMenuItems />}
          // addButtonProps
          addButtonOnclick={() => {
            setShowManageTransferInventoryDialog({ open: true, isClone: false, idToClone: null });
          }}
          isAddButtonVisible={permissions?.transferInventory?.isCreate}
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
            resource={sidebarResource.transferInventory}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomContainer>
      {showManageTransferInventoryDialog.open && (
        <ManageTransferInventory
          isClone={showManageTransferInventoryDialog.isClone}
          transferInventoryId={showManageTransferInventoryDialog.idToClone}
          onClose={() => setShowManageTransferInventoryDialog({ open: false, isClone: false, idToClone: null })}
          onSuccess={(data) => {
            setShowManageTransferInventoryDialog({ open: false, isClone: false, idToClone: null });
            fetchData();
            history.push(`${routes.transferInventoryDetail.path}/${data._id}`);
          }}
        />
      )}
      {showDeleteConfirmBox && (
        <ConfirmationDialog
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete ${
            deleteRecord
              ? `${resources?.transferInventory?.titleSingular?.toLowerCase()} :
            ${deleteRecord?._id ? deleteRecord?.transferNumber || '' : ''}`
              : `selected ${resources?.transferInventory?.titlePlural?.toLowerCase()}`
          } ?`}
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          onOk={handleDelete}
          okBtnLoading={isDeleting}
        />
      )}
    </section>
  );
};

export default TransferInventory;
