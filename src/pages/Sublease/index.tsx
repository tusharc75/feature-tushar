import { Box, Chip, IconButton, MenuItem } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import axios, { CancelTokenSource } from 'axios';
import { camelCase } from 'lodash';
import queryString from 'query-string';
import { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import { useSetWalkmeData } from 'src/components/CustomIntro';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ImportExportLinks from 'src/components/Helpers/ImportExportLinks';
import routes from 'src/components/Helpers/Routes';
import { ListingPageHeader } from 'src/components/PageHeaders';
import {
  checkIsAllowedToDelete,
  getDefaultMyRecordType,
  gridLoadingTimeout,
  prepareDataForGrid,
  sidebarResource,
  sublease
} from 'src/constants/helpers';
import { cloneDisable, deleteDisable } from 'src/constants/messageHelpers';
import { createSubleaseFlow } from 'src/pages/Sublease/walkmeSteps';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import ManageSublease from './ManageSublease';

const Sublease = () => {
  const { setWalkmeData } = useSetWalkmeData();
  let renderedFrom = camelCase(sidebarResource.sublease);
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { user, permissions, selectedEntity, resources }
  }: any = useData();

  const types = [
    {
      key: `My ${resources?.sublease?.titlePlural}`,
      value: 1
    },
    {
      key: `All ${resources?.sublease?.titlePlural}`,
      value: 2
    }
  ];

  const history = useHistory();
  let { referenceId, referenceType }: any = queryString.parse(history.location.search);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { generateColumns } = useColumns();
  const [columns, setColumns] = useState(null);
  const [selectedType, setSelectedType] = useState(getDefaultMyRecordType(user.user, sidebarResource.sublease));
  const [showManageDialog, setShowManageDialog] = useState({ open: false, isClone: false, idToClone: null });
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [renderCount, setRenderCount] = useState(0);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    if (renderCount > 0) {
      const cancelTokenSource = axios.CancelToken.source();
      fetchData(cancelTokenSource);
      return () => cancelTokenSource.cancel();
    } else setRenderCount((preCount) => preCount + 1);
  }, [search, page, limit, selectedType, filters, sorting, selectedEntity, showFilteredRecordsOnly]);

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=Sublease`);
    data = response?.data?.data;
    setWalkmeData([createSubleaseFlow(data, resources?.sublease?.titlePlural)]);
    let newColumns = generateColumns(renderedFrom, data, routes.subleaseDetail.path, true);
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
        <HtmlTooltip title={permissions?.sublease?.isCreate ? 'Clone' : cloneDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Clone"
              disabled={permissions?.sublease?.isCreate ? false : true}
              onClick={() => {
                setShowManageDialog({ open: true, isClone: true, idToClone: row.original._id });
              }}
            >
              <FileCopyIcon fontSize="small" color={permissions?.sublease?.isCreate ? 'primary' : 'disabled'} />
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

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}`;
    if (isExport) {
      deepFilter = `?`;
    }
    if (selectedType === 1) {
      deepFilter = deepFilter + `&myRecords=1`;
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
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || []).map((m) => m._id))}`;
    }
    return deepFilter;
  };

  const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`${sublease.api}${queryString}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
          let finalObject: any = prepareDataForGrid(u, user);
          finalObject['isChecked'] = selectedRecords.some((s) => s._id === u._id);
          finalObject['canDelete'] =
            permissions?.sublease?.isDelete && checkIsAllowedToDelete(user, sidebarResource.sublease, finalObject?.ownerId) && u?.canDelete;
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
      ids = selectedRecords.map((d) => d._id);
    }
    axiosInstance()
      .put(`${sublease.api}/remove`, { ids: ids })
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

  const updateQueryParams = () => {
    const queryParams = new URLSearchParams(history.location.search);
    queryParams.delete('referenceId');
    queryParams.delete('referenceType');
    referenceId = queryParams.get('referenceId');
    referenceType = queryParams.get('referenceType');
    history.replace({
      search: queryParams.toString()
    });
    fetchData();
  };

  const onTypeChange = (event, type) => {
    dispatch({ type: 'pageChange', page: 0 });
    const value = types.find((d) => d.key === type).value;
    setSelectedType(value);
    if (referenceId && referenceType) {
      history.push(`?type=${value}&referenceType=${referenceType}&referenceId=${referenceId}`);
    } else {
      history.push(`?type=${value}`);
    }
  };

  const ActionMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={selectedRecords.every((e) => e.canDelete) ? false : true}
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
        <CustomBreadCrumbs routes={[{ ...routes.sublease, title: resources?.sublease?.titlePlural }]} />
        <ImportExportLinks
          permissions={permissions?.sublease}
          module={resources?.sublease?.titlePlural}
          api={sublease.api}
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
          leftSideContents={
            referenceType ? <Chip className="ml-3" color="primary" label={`Rental Job : ${referenceType}`} onDelete={updateQueryParams} /> : null
          }
          searchValue={search}
          onSearch={handleSearch}
          // rightSideContents
          isActionButtonVisible={true}
          actionButtonProps={{ disabled: selectedRecords?.length ? false : true }}
          actionMenuItems={<ActionMenuItems />}
          // addButtonProps
          addButtonOnclick={() => {
            setShowManageDialog({ open: true, isClone: false, idToClone: null });
          }}
          isAddButtonVisible={permissions?.sublease?.isCreate}
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
            resource={sidebarResource.sublease}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomContainer>
      {showManageDialog.open && (
        <ManageSublease
          isClone={showManageDialog.isClone}
          subleaseId={showManageDialog.idToClone}
          onClose={() => setShowManageDialog({ open: false, isClone: false, idToClone: null })}
          onSuccess={() => {
            setShowManageDialog({ open: false, isClone: false, idToClone: null });
            fetchData();
          }}
        />
      )}
      {showDeleteConfirmBox && (
        <ConfirmationDialog
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete the ${resources?.sublease?.titleSingular?.toLowerCase()} ? `}
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

export default Sublease;
