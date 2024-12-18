import { Box, MenuItem } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
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
import routes from 'src/components/Helpers/Routes';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { gridLoadingTimeout, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import { deleteDisable } from 'src/constants/messageHelpers';
import ManageTrainAiModel from './ManageTrainAiModel';

let renderedFrom = camelCase(sidebarResource.trainAiModel);

const TrainAiModel = () => {
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { user, permissions, selectedEntity, resources }
  }: any = useData();
  let { referenceId }: any = queryString.parse(history.location.search);
  const [showManageTrainAiModelDialog, setShowManageTrainAiModelDialog] = useState({ open: false });
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [columns, setColumns] = useState(null);
  const { page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    fetchData();
  }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly]);

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource.trainAiModel}`)
      .then(({ data: { data } }) => {
        let newColumns = generateColumns(renderedFrom, data, routes.trainAiModel.path, true);
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
    )
  };

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`/generative-ai/feed-data${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data?.map((u) => {
          let finalObject: any = prepareDataForGrid(u, user);
          finalObject['isChecked'] = selectedRecords.some((s) => s._id === u._id);
          finalObject['canDelete'] = permissions?.trainAiModel?.isDelete;
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
    let deepFilter = `?page=${page}&limit=${limit}`;
    if (isExport) {
      deepFilter = `?`;
    }
    const { filterByIds, deepFilters } = gridFilterParser(filters);
    if (referenceId) {
      filterByIds.push({ field: 'rentalJob', term: referenceId });
    }
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

  const handleDelete = () => {
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords.map((d) => d._id);
    }
    axiosInstance()
      .put(`/generative-ai/feed-data/remove`, { ids: ids })
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

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const ActionMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={selectedRecords.every((e) => e.canDelete) ? false : true}
          onClick={() => {
            if (selectedRecords.length === 1){
              setDeleteRecord(selectedRecords[0]);
              }else{
                setDeleteRecord(null)
              }
            setShowDeleteConfirmBox(true);
          }}
        >
          {`Delete (${selectedRecords.length})`}
        </MenuItem>
      </>
    );
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ ...routes.trainAiModel, title: resources?.trainAiModel?.titlePlural }]} />
      </div>
      <CustomContainer>
        <ListingPageHeader
          searchValue={search}
          onSearch={handleSearch}
          isActionButtonVisible={true}
          actionButtonProps={{ disabled: selectedRecords.length ? false : true }}
          actionMenuItems={<ActionMenuItems />}
          addButtonOnclick={() => {
            setShowManageTrainAiModelDialog({ open: true });
          }}
          isAddButtonVisible={permissions?.trainAiModel?.isCreate}
          setQueryString={false}
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
            resource={sidebarResource.trainAiModel}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomContainer>
      {showManageTrainAiModelDialog.open && (
        <ManageTrainAiModel
          onClose={() => setShowManageTrainAiModelDialog({ open: false })}
          onSuccess={() => {
            setShowManageTrainAiModelDialog({ open: false });
            fetchData();
          }}
        />
      )}
      {showDeleteConfirmBox && (
        <ConfirmationDialog
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete ${deleteRecord ? `${resources?.trainAiModel?.titleSingular?.toLowerCase()} : ${deleteRecord?.topic}` : `selected ${resources?.trainAiModel?.titlePlural?.toLowerCase()}`} ?`}              
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
    </section>
  );
};

export default TrainAiModel;
