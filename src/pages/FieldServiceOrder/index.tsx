import { Box, IconButton, MenuItem } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { camelCase } from 'lodash';
import queryString from 'query-string';
import { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import CustomContainer from 'src/components/CustomContainer';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { cloneDisable, deleteDisable } from 'src/constants/messageHelpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import routes from '../../components/Helpers/Routes';
import {
  checkIsAllowedToDelete,
  fieldServiceOrder,
  getDefaultMyRecordType,
  gridLoadingTimeout,
  prepareDataForGrid,
  sidebarResource
} from '../../constants/helpers';
import ManageServiceOrder from './ManageServiceOrder';
import { findAll, findOne, insertUpdate, objectStore, setUpindexDB } from 'src/constants/indexdbhelper';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import { fieldServiceOrderAddOffline, fieldServiceOrderClearOffline } from './Services/OfflineHelper';
import HideWhenOffline from 'src/components/HideWhenOffline';
import axios, { CancelTokenSource } from 'axios';
import { useSetWalkmeData } from 'src/components/CustomIntro';
import { createFieldServiceOrderFlow } from './walkmeSteps';

let serviceOrderTimeout;

const ServiceOrder = () => {
  const types = [
    {
      key: `My ${routes.fieldServiceOrder.title}`,
      value: 1
    },
    {
      key: `All ${routes.fieldServiceOrder.title}`,
      value: 2
    }
  ];

  const { setWalkmeData } = useSetWalkmeData();

  const renderedFrom = camelCase(routes?.fieldServiceOrder.title);

  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();
  const [selectedType, setSelectedType] = useState(getDefaultMyRecordType(user.user, sidebarResource.fieldServiceOrder));
  const [renderCount, setRenderCount] = useState(0);
  const [showManageDialog, setShowManageDialog] = useState({ open: false, isClone: false, idToClone: null });
  const { state, dispatch } = useTableReducer();

  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const [columns, setColumns] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState({ open: false, ids: [] });

  const { generateColumns, checkStaticField } = useColumns();

  const { isOffline } = useContext(CustomOfflineContext);

  useEffect(() => {
    setUpindexDB();
    fetchGridColumns();
  }, []);

  const fetchGridColumns = async () => {
    let data;
    if (isOffline) {
      data = await findOne(objectStore.resource, sidebarResource.fieldServiceOrder);
    } else {
      const response = await axiosInstance().get(`/field?resource=${sidebarResource.fieldServiceOrder}`);
      data = response?.data?.data;
      setWalkmeData([createFieldServiceOrderFlow(data)]);
      try {
        insertUpdate(objectStore.resource, sidebarResource.fieldServiceOrder, data);
      } catch (e) {
        toastConfig.setToastConfig(e);
      }
    }
    const newColumns = generateColumns(renderedFrom, data, routes.fieldServiceOrderDetail.path, true);
    let staticFields = getStaticFields();
    staticFields.forEach((field) => {
      newColumns.push(checkStaticField(renderedFrom, field));
    });
    setColumns([...newColumns, ActionsRenderer]);
  };

  //  Grid Variables - End
  const [locationKeys, setLocationKeys] = useState([]);
  useEffect(() => {
    return history.listen((location) => {
      const { type }: any = queryString.parse(history.location.search);
      if (history.action === 'PUSH') {
        setLocationKeys([location.key]);
      }
      if (history.action === 'POP') {
        if (locationKeys[1] === location.key) {
          setLocationKeys(([_, ...keys]) => keys);
          // Handle forward event
          setSelectedType(type ? parseInt(type) : 1);
        } else {
          setLocationKeys((keys) => [location.key, ...keys]);
          // Handle back event
          setSelectedType(type ? parseInt(type) : 1);
        }
      }
    });
  }, [locationKeys]);

  useEffect(() => {
    let millisec = Object.keys(search).length > 0 ? 600 : 5;
    if (serviceOrderTimeout) {
      clearTimeout(serviceOrderTimeout);
    }
    serviceOrderTimeout = setTimeout(() => {
      fetchData();
    }, millisec);
  }, [search]);

  useEffect(() => {
    if (renderCount > 0) {
      const cancelTokenSource = axios.CancelToken.source();
      fetchData(cancelTokenSource);
      return () => cancelTokenSource.cancel();
    } else setRenderCount((preCount) => preCount + 1);
  }, [page, limit, selectedType, filters, sorting, selectedEntity, showFilteredRecordsOnly]);

  const handleDelete = async (ids) => {
    axiosInstance().put(`${fieldServiceOrder.api}/remove`, { ids })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        dispatch({ type: 'selection', selectedRecords: [] });
        fetchData();
        setShowDeleteConfirmBox({ open: false, ids: [] });
      })
      .catch((error) => {
        dispatch({ type: 'loading', loading: false });
        toastConfig.setToastConfig(error);
      });
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
        <HideWhenOffline>
          <HtmlTooltip title={permissions?.fieldServiceOrder?.isCreate ? 'Clone' : cloneDisable}>
            <span>
              <IconButton
                size="small"
                aria-label="Clone"
                disabled={permissions?.fieldServiceOrder?.isCreate ? false : true}
                onClick={() => {
                  setShowManageDialog({ open: true, isClone: true, idToClone: row?.original._id });
                }}
              >
                <FileCopyIcon fontSize="small" color={permissions?.fieldServiceOrder?.isCreate ? 'primary' : 'disabled'} />
              </IconButton>
            </span>
          </HtmlTooltip>
        </HideWhenOffline>
        <HideWhenOffline>
          <HtmlTooltip title={row?.original?.canDelete ? 'Delete' : deleteDisable}>
            <span>
              <IconButton
                size="small"
                aria-label="Delete"
                disabled={row?.original?.canDelete ? false : true}
                onClick={() => {
                  setShowDeleteConfirmBox({ open: true, ids: [row.original?._id] });
                }}
              >
                <DeleteIcon fontSize="small" color={row?.original?.canDelete ? 'error' : 'disabled'} />
              </IconButton>
            </span>
          </HtmlTooltip>
        </HideWhenOffline>
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

  const fetchData = (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    if (isOffline) {
      findAll(objectStore.fieldServiceOrder).then((data) => {
        let rows = data?.map((u) => {
          let finalObject: any = prepareDataForGrid(u);
          finalObject['isChecked'] = selectedRecords.some((s) => s._id === u._id);
          finalObject['canDelete'] =
            permissions?.fieldServiceOrder?.isDelete &&
            checkIsAllowedToDelete(user, sidebarResource.fieldServiceOrder, finalObject?.ownerId) &&
            u?.canDelete;
          return finalObject;
        });
        dispatch({ type: 'initialize', data: rows, count: rows.length });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      });
      return;
    } else {
      axiosInstance()
        .get(`${fieldServiceOrder.api}${queryString}`, { cancelToken: cancelTokenSource?.token })
        .then(({ data: { data, count } }) => {
          let rows = data?.map((u) => {
            let finalObject: any = prepareDataForGrid(u);
            finalObject['isChecked'] = selectedRecords.some((s) => s._id === u._id);
            finalObject['canDelete'] =
              permissions?.fieldServiceOrder?.isDelete &&
              checkIsAllowedToDelete(user, sidebarResource.fieldServiceOrder, finalObject?.ownerId) &&
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
    }
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const onTypeChange = (event, type) => {
    dispatch({ type: 'pageChange', page: 0 });
  };

  const handleAddOffline = async () => {
    const data: any = [];
    selectedRecords.forEach((element) => {
      data.push(element._id);
    });
    await fieldServiceOrderAddOffline(data);
    dispatch({ type: 'selection', selectedRecords: [] });
  };

  const handleRemoveoffline = async (ids: any[] = []) => {
    await fieldServiceOrderClearOffline(ids);
  };

  const ActionMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={selectedRecords.every((e) => e.canDelete) ? (selectedRecords?.length ? false : true) : true}
          onClick={() => {
            setShowDeleteConfirmBox({ open: true, ids: selectedRecords.map((d) => d._id) });
          }}
        >
          {`Delete (${selectedRecords.length})`}
        </MenuItem>
        <MenuItem disabled={!selectedRecords.length} onClick={() => handleAddOffline()}>
          {`Add ${routes.fieldServiceOrder.title} Offline`}
        </MenuItem>
        <MenuItem
          disabled={!selectedRecords.length}
          onClick={() => handleRemoveoffline(selectedRecords?.map((e) => e._id))}
        >{`Clear Offline Data (${selectedRecords.length})`}</MenuItem>
        <MenuItem onClick={() => handleRemoveoffline()}>Clear All Offline Data</MenuItem>
      </>
    );
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[routes.fieldServiceOrder]} />
        {!isOffline && (
          <ImportExportLinks
            permissions={permissions?.fieldServiceOrder}
            module="fieldServiceOrder"
            api={fieldServiceOrder.api}
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
        )}
      </div>
      <CustomContainer>
        <ListingPageHeader
          toggleButtonList={types}
          onToggle={onTypeChange}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          searchValue={search}
          onSearch={handleSearch}
          isActionButtonVisible={true}
          actionMenuItems={<ActionMenuItems />}
          addButtonOnclick={() => {
            setShowManageDialog({ open: true, isClone: false, idToClone: null });
          }}
          isAddButtonVisible={!isOffline && permissions?.fieldServiceOrder?.isCreate}
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
            showFilters={!isOffline}
            resource={sidebarResource.fieldServiceOrder}
            isClientSideGrid={isOffline ? true : false}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
        {showDeleteConfirmBox.open && (
          <ConfirmationDialog
            open={showDeleteConfirmBox.open}
            message={`Are you sure you want to delete the ${routes?.fieldServiceOrder.title?.toLowerCase()}${selectedRecords.length ? 's' : ''} ? `}
            onClose={() => {
              setShowDeleteConfirmBox({ open: false, ids: [] });
            }}
            onOk={() => {
              handleDelete(showDeleteConfirmBox.ids)
            }}
          />
        )}
      </CustomContainer>
      {showManageDialog.open && (
        <ManageServiceOrder
          isClone={showManageDialog.isClone}
          serviceOrderId={showManageDialog.idToClone}
          onClose={() => setShowManageDialog({ open: false, isClone: false, idToClone: null })}
          onSuccess={(data) => {
            history.push(`${routes.fieldServiceOrderDetail.path}/${data._id}`);
            setShowManageDialog({ open: false, isClone: false, idToClone: null });
          }}
          open={showManageDialog.open}
        />
      )}
    </section>
  );
};

export default ServiceOrder;
