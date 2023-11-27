import { useContext, useEffect, useState } from 'react';
import { camelCase } from 'lodash';
import queryString from 'query-string';
import { useHistory, Link } from 'react-router-dom';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import DeleteIcon from '@material-ui/icons/Delete';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CustomReactTable, {
  checkStaticField,
  getStaticFields,
  gridFilterParser,
  useColumns,
  useTableReducer
} from 'src/components/CustomReactTableNew';
import routes from 'src/components/Helpers/Routes';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import ImportExportLinks from 'src/components/Helpers/ImportExportLinks';
import { useData } from 'src/StateProvider/Provider';
import { CHILD_RESOURCE, gridLoadingTimeout, prepareDataForGrid, rentalManagement, serializedAsset, sidebarResource } from 'src/constants/helpers';
import CustomContainer from 'src/components/CustomContainer';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import SearchBox from 'src/components/Helpers/SearchBox';
import { Button, IconButton, Menu, MenuItem, Box } from '@material-ui/core';
import { AddOutlined, ExpandMore, Warning } from '@material-ui/icons';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import { clearAll, findAll, findOne, insertUpdate, objectStore, setUpindexDB } from 'src/constants/indexdbhelper';
import HideWhenOffline from 'src/components/HideWhenOffline';
import styles from '../Leads/Header.module.scss';
import { rentalJobOfflineUpdate } from './rentalOfflineHelper';
import MessageDialog from 'src/components/Helpers/MessageDialog';
import ManageRentalManagementDialog from './ManageRental';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { cloneDisable, deleteDisable } from 'src/constants/messageHelpers';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

let searchTimeout;

const RentalManagement = () => {
  const renderedFrom = camelCase(routes?.rentalManagement.title);
  const toastConfig = useContext(CustomToastContext);
  const { isOffline } = useContext(CustomOfflineContext);

  const types = [
    {
      key: `My ${routes.rentalManagement.title}`,
      value: 1
    },
    {
      key: `All ${routes.rentalManagement.title}`,
      value: 2
    }
  ];
  const history = useHistory();
  const { type }: any = queryString.parse(history.location.search);

  const { state, dispatch } = useTableReducer();
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { getColumnData } = useColumns();

  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();

  const [renderCount, setRenderCount] = useState(0);
  const [locationKeys, setLocationKeys] = useState([]);
  const [selectedType, setSelectedType] = useState(type ? parseInt(type) : 1);
  const [columns, setColumns] = useState(null);
  const [showManageRentalManagementDialog, setShowManageRentalManagementDialog] = useState({ open: false, isClone: false, idToClone: null });
  const [singleRentalManagementDelete, setSingleRentalManagementDelete] = useState({
    id: null,
    show: false,
    rentalJobName: ''
  });
  const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] = useState(false);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState<any>({});
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    setUpindexDB();
    fetchGridColumns();
  }, []);

  useEffect(() => {
    let millisec = Object.keys(search).length > 0 ? 600 : 5;
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    searchTimeout = setTimeout(() => {
      fetchData();
    }, millisec);
  }, [search]);

  useEffect(() => {
    if (renderCount > 0) {
      fetchData();
    } else setRenderCount((preCount) => preCount + 1);
  }, [page, limit, selectedType, filters, sorting, selectedEntity, showFilteredRecordsOnly]);

  const extraColumns = [
    {
      accessor: 'subleaseAssets',
      Header: 'Sublease Assets',
      minWidth: 100,
      width: 100,
      disableFilters: true,
      disableSortBy: true,
      Cell: ({ row }) => (row?.original?.['subleaseAssets'] ? 'Yes' : 'No')
    }
  ];

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

  const fetchGridColumns = async () => {
    let data;
    if (isOffline) {
      data = await findOne(objectStore.resource, objectStore.rentalManagement);
    } else {
      const response = await axiosInstance().get(`/field?resource=Rental Management&entity=${selectedEntity}&view=true`);
      data = response?.data?.data;
      try {
        insertUpdate(objectStore.resource, objectStore.rentalManagement, data);
      } catch (ex) {
        console.error(`Rental Management: Error while storing data for Offline context. Error: ${ex.message}`);
      }
    }

    let columns = [];
    data.forEach((o) => {
      if (o?.fieldData?.fieldName === 'rentalJobName') {
        columns = [
          ...columns,
          {
            accessor: o?.fieldData?.fieldName,
            Header: o?.fieldData?.fieldLabel,
            minWidth: 180,
            width: 180,
            Cell: ({ row }) => (
              <>
                <Link className="link text-truncate" title={row?.original[o?.fieldData?.fieldName]} to={`${routes.rentalManagement.path}/detail/${row?.original?._id}`}>
                  {row?.original[o?.fieldData?.fieldName]}
                </Link>
                {row?.original?.assetsNotReceivedInPo && (
                  <Box ml={1}>
                    <HtmlTooltip title={`Assets on PO not received`}>
                      <Warning style={{ fontSize: '14px' }} fontSize="small" color="error" />
                    </HtmlTooltip>
                  </Box>
                )}
              </>
            )
          }
        ];
      } else {
        let currentColumn: any = getColumnData(renderedFrom, o?.fieldData, routes.rentalManagementDetail.path, true);
        if (currentColumn !== null) {
          if (isOffline) {
            currentColumn.columnData['filter'] = false;
            currentColumn.columnData['sortable'] = false;
          }
          columns = [...columns, currentColumn?.columnData]
        }
      }
      return o?.fieldData;
    });

    let staticFields: any = getStaticFields();
    if (permissions?.sublease) {
      staticFields = [...extraColumns, ...staticFields];
    }
    staticFields.forEach((field) => {
      columns.push(checkStaticField(renderedFrom, field));
    });
    setColumns([...columns, ActionsRenderer]);
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
          <HtmlTooltip title={permissions?.rentalManagement?.isCreate ? 'Clone' : cloneDisable}>
            <span>
              <IconButton
                size="small"
                aria-label="Clone"
                disabled={permissions?.rentalManagement?.isCreate ? false : true}
                onClick={() => {
                  setShowManageRentalManagementDialog({ open: true, isClone: true, idToClone: row?.original?._id });
                }}
              >
                <FileCopyIcon fontSize="small" color={permissions?.rentalManagement?.isCreate ? 'primary' : 'disabled'} />
              </IconButton>
            </span>
          </HtmlTooltip>
          <HtmlTooltip title={row?.original.canDelete ? 'Delete' : deleteDisable}>
            <span>
              <IconButton
                size="small"
                aria-label="Delete"
                disabled={row?.original.canDelete ? false : true}
                onClick={() => {
                  setSingleRentalManagementDelete({
                    show: true,
                    id: row?.original?._id,
                    rentalJobName: `${row?.original?.rentalJobName}`
                  });
                }}
              >
                <DeleteIcon fontSize="small" color={row?.original.canDelete ? 'error' : 'disabled'} />
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

    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || []).map((m) => m._id))}`;
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
    return deepFilter;
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    try {
      let data: any = [],
        count;
      if (!isOffline) {
        const response: any = await axiosInstance().get(`${rentalManagement.api}${queryString}`);
        data = response?.data?.data;
        count = response?.data?.count;
      } else {
        data = await findAll(objectStore.rentalManagement);
        count = data?.length || 0;
      }
      let rows = data.map((u) => {
        let finalObject: any = prepareDataForGrid(u, user);
        finalObject['isChecked'] = selectedRecords.some((s) => s._id === u._id);
        finalObject['canDelete'] = permissions?.rentalManagement?.isDelete && finalObject?.ownerId === user?.user?._id && u?.material?.length === 0;
        return finalObject;
      });
      dispatch({ type: 'initialize', data: rows, count: count });
    } catch (error) {
      toastConfig.setToastConfig(error);
    } finally {
      setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);
    }
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const handleAddOffline = async () => {
    const data: any = [];
    selectedRecords.forEach((element) => {
      data.push(element._id);
    });
    await rentalJobOfflineUpdate(data);
    closeActions();
    axiosInstance()
      .get(`/field/child?resource=${CHILD_RESOURCE.rentalManagementProduct}`)
      .then(({ data: { data } }) => {
        insertUpdate(objectStore.resource, 'rentalManagementProduct', data);
      });
    axiosInstance()
      .get(`/field/child?resource=${CHILD_RESOURCE.rentalManagementCost}`)
      .then(({ data: { data } }) => {
        insertUpdate(objectStore.resource, 'rentalManagementCost', data);
      });
    axiosInstance()
      .get(`/field?resource=${sidebarResource['deliveryTicket']}&showHiddenFields=true`)
      .then(({ data: { data } }) => {
        insertUpdate(objectStore.resource, objectStore.deliveryTicket, data);
      });
    axiosInstance()
      .get(`/field?resource=${serializedAsset.resource}&view=true`)
      .then(({ data: { data } }) => {
        insertUpdate(objectStore.resource, 'serializedAsset', data);
      });
    axiosInstance()
      .get(`/field?resource=Product&view=true`)
      .then(({ data: { data } }) => {
        insertUpdate(objectStore.resource, 'Product', data);
      });

    dispatch({ type: 'selection', selectedRecords: [] });
  };

  const handleRemoveoffline = async () => {
    await clearAll(objectStore.rentalManagement);
    await clearAll(objectStore.deliveryTicket);
    closeActions();
  };

  const handleSingleDelete = async () => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .put(`${rentalManagement.api}/remove`, {
        ids: [singleRentalManagementDelete.id]
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchData();
        dispatch({ type: 'loading', loading: false });
        setSingleRentalManagementDelete({ id: null, show: false, rentalJobName: '' });
      })
      .catch((error) => {
        dispatch({ type: 'loading', loading: false });
        toastConfig.setToastConfig(error);
      });
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    let recordsToDelete = [];
    if (deleteRecord?._id) {
      recordsToDelete.push(deleteRecord?._id);
    } else {
      recordsToDelete = selectedRecords?.map((o) => o._id);
    }
    if (recordsToDelete.length > 0) {
      axiosInstance()
        .put(`${rentalManagement.api}/remove`, {
          ids: recordsToDelete
        })
        .then(({ data }) => {
          dispatch({ type: 'selection', selectedRecords: [] });
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          setIsConformDialogVisible(false);
          setDeleteLoading(false);
          if (deleteRecord) setDeleteRecord({});
          fetchData();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setIsConformDialogVisible(false);
          setDeleteLoading(false);
        });
    }
  };

  const showConfirmBox = (row) => {
    if (row) {
      setIsConformDialogVisible(true);
      if (row && row._id) {
        setDeleteRecord(row);
      }
    } else {
      if (selectedRecords?.find((d) => d.canDelete === false)) {
        setShowDeleteWarningConfirmBox(true);
      } else {
        setIsConformDialogVisible(true);
      }
    }
  };

  const onTypeChange = (event, type) => {
    dispatch({ type: 'pageChange', page: 0 });
    const value = types.find((d) => d.key === type).value;
    setSelectedType(value);
    history.push(`?type=${value}`);
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
        <CustomBreadCrumbs routes={[routes.rentalManagement]} />
        <ImportExportLinks
          permissions={permissions?.rentalManagement}
          module={routes.rentalManagement.title}
          api={rentalManagement.api}
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
        <div className="header-panel">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={'flex flex-wrap align-items-center gap-2 w-full'}>
              <HideWhenOffline>
                <ToggleButtonGroup size="small" className="align-items-center" value={types[selectedType - 1].key} exclusive onChange={onTypeChange}>
                  {types.map((k, index) => {
                    return (
                      <ToggleButton value={k.key} key={index}>
                        {k.key}
                      </ToggleButton>
                    );
                  })}
                </ToggleButtonGroup>

                {permissions?.planning?.isRead && (
                  <ToggleButtonGroup size="small" className="align-items-center">
                    <ToggleButton
                      onClick={() => {
                        history.push({
                          pathname: routes.planning.path,
                          state: 'Rental Job'
                        });
                      }}
                    >
                      <span>{`Planned Rental`}</span>
                    </ToggleButton>
                  </ToggleButtonGroup>
                )}
                {permissions?.planningView?.isRead && (
                  <ToggleButtonGroup size="small" className="align-items-center">
                    <ToggleButton
                      onClick={() => {
                        history.push({
                          pathname: routes.planningView.path,
                          state: {
                            resource: sidebarResource?.rentalManagement
                          }
                        });
                      }}
                    >
                      <span>{`Calendar`}</span>
                    </ToggleButton>
                  </ToggleButtonGroup>
                )}
              </HideWhenOffline>
            </div>
            <div className="flex flex-wrap gap-[8px] justify-end">
              <HideWhenOffline>
                <SearchBox onChange={handleSearch} className={styles.search_box_input} value={search} size="small" />
              </HideWhenOffline>
              <div className="flex gap-[8px] flex-wrap items-center">
                <HideWhenOffline>
                  {permissions?.rentalManagement?.isCreate && permissions?.rentalManagement?.isUpdate && (
                    <Button
                      variant={'contained'}
                      color="primary"
                      size="small"
                      onClick={() => {
                        setShowManageRentalManagementDialog({ open: true, isClone: false, idToClone: null });
                      }}
                      className={'no-shadow'}
                      startIcon={<AddOutlined />}
                    >
                      Add
                    </Button>
                  )}
                  <Button
                    variant={'outlined'}
                    color="default"
                    size="small"
                    className={`new-dropdown-v1`}
                    onClick={openActions}
                    aria-controls="action-menu"
                    endIcon={<ExpandMore />}
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
                    {selectedRecords?.length > 0 && (
                      <MenuItem
                        disabled={selectedRecords.every((e) => e.canDelete) ? false : true}
                        onClick={() => {
                          closeActions();
                          showConfirmBox(null);
                        }}
                      >
                        {`Delete (${selectedRecords?.length})`}
                      </MenuItem>
                    )}
                    <MenuItem disabled={!selectedRecords.length} onClick={() => handleAddOffline()}>
                      Add Offline
                    </MenuItem>
                    <MenuItem onClick={() => handleRemoveoffline()}>Clear All Offline Data</MenuItem>
                  </Menu>
                </HideWhenOffline>
              </div>
            </div>
          </div>
        </div>

        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            isClientSideGrid={false}
            refreshGrid={fetchData}
            showOnlyShowFilteredRecordSwitch={true}
            showFilters={true}
            resource={sidebarResource.rentalManagement}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}

        {showDeleteWarningConfirmBox && (
          <MessageDialog
            open={showDeleteWarningConfirmBox}
            message={`You are trying to delete records which you do not have permission to delete, Please remove those records from selection and try again.`}
            onClose={() => setShowDeleteWarningConfirmBox(false)}
          />
        )}

        {isConfirmDialogVisible && (
          <ConfirmationDialog
            open={isConfirmDialogVisible}
            message={`Are you sure you want to delete selected ${routes.rentalManagement.title.toLowerCase()} ?`}
            onClose={() => {
              if (deleteRecord) setDeleteRecord({});
              setIsConformDialogVisible(false);
            }}
            okBtnLoading={deleteLoading}
            onOk={handleDelete}
          />
        )}

        {singleRentalManagementDelete.show && (
          <ConfirmationDialog
            open={singleRentalManagementDelete.show}
            message={`Are you sure you want to delete this ${routes.rentalManagement.title.toLowerCase()} ${
              singleRentalManagementDelete ? (singleRentalManagementDelete?.id ? singleRentalManagementDelete?.rentalJobName : '') : ''
            }?`}
            onClose={() =>
              setSingleRentalManagementDelete({
                id: null,
                show: false,
                rentalJobName: ''
              })
            }
            onOk={handleSingleDelete}
          />
        )}

        {showManageRentalManagementDialog.open && (
          <ManageRentalManagementDialog
            isClone={showManageRentalManagementDialog.isClone}
            open={showManageRentalManagementDialog.open}
            rentalManagementId={showManageRentalManagementDialog.idToClone}
            onClose={() => setShowManageRentalManagementDialog({ open: false, isClone: false, idToClone: null })}
            onSuccess={() => {
              if (!isOffline) {
                fetchData();
              }
              setShowManageRentalManagementDialog({ open: false, isClone: false, idToClone: null });
            }}
          />
        )}
      </CustomContainer>
    </section>
  );
};

export default RentalManagement;
