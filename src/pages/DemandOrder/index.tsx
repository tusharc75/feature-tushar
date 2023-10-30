import { Button, IconButton, Tooltip } from '@material-ui/core';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomContainer from '../../components/CustomContainer';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import GridDeleteIcon from '../../components/Helpers/GridDeleteIcon';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import MessageDialog from '../../components/Helpers/MessageDialog';
import {
  demandOrder,
  getLocalStorageArrayData,
  gridLoadingTimeout,
  prepareDataForGrid,
  removeLocalStorage,
  sidebarResource
} from '../../constants/helpers';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import { camelCase } from 'lodash';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTableNew';
import ManageDemandOrderDialog from './ManageDemandOrderDialog';
import SearchBox from 'src/components/Helpers/SearchBox';
import styles from '../Leads/Header.module.scss';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import { Menu, MenuItem } from '@material-ui/core';
import { ToggleButtonGroup, ToggleButton } from '@material-ui/lab';

let searchTimeout;

const DemandOrder = () => {
  const { state: tableState, dispatch } = useTableReducer();
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = tableState;

  const DemandOrderType = [
    {
      key: `My ${routes.demandOrder.title}`,
      value: 1
    },
    {
      key: `All ${routes.demandOrder.title}`,
      value: 2
    }
  ];

  const renderedFrom = camelCase(routes?.demandOrder.title);
  const localStorageSelectedRecords = `${renderedFrom}_selected`;
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();
  const [selectedType, setSelectedType] = useState(1);
  const [renderCount, setRenderCount] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState<any>({});
  const [showManageSalesOrderDialog, setShowManageSalesOrderDialog] = useState({ open: false, isClone: false, idToClone: null });
  const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] = useState(false);

  const [singleSalesOrderDelete, setSingleSalesOrderDelete] = useState({
    id: null,
    show: false,
    demandOrderNumber: ''
  });

  const { getColumnData } = useColumns();
  const [columns, setColumns] = useState(null);

  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
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

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=Demand Order`);
    data = response?.data?.data;
    let columns = [];
    data.forEach((o) => {
      let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.demandOrderDetail.path, true);
      if (currentColumn !== null) {
        columns = [...columns, currentColumn?.columnData];
      }
      return o?.fieldData;
    });
    columns = [...columns, ...getStaticFields(), ActionsRenderer];
    setColumns(columns);
  };

  const handleSingleDeleteSalesOrder = async () => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .put(`${demandOrder.api}/remove`, {
        ids: [singleSalesOrderDelete.id]
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchData();
        dispatch({ type: 'loading', loading: false });
        setSingleSalesOrderDelete({ id: null, show: false, demandOrderNumber: '' });
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
    canDrag: false,
    Cell: ({ row }) => (
      <>
        {permissions?.demandOrder?.isCreate ? (
          <Tooltip title="Clone">
            <IconButton
              size="small"
              aria-label="Clone"
              onClick={() => {
                setShowManageSalesOrderDialog({ open: true, isClone: true, idToClone: row.original._id });
              }}
            >
              <FileCopyIcon fontSize="small" color="primary" />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip className="cursor-stop" title="You do not have permission to clone/create">
            <IconButton aria-label="Clone" size="small">
              <FileCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        <GridDeleteIcon
          hasDeletePermission={permissions?.demandOrder?.isDelete}
          ownerId={user?.user?._id}
          userId={user?.user?._id}
          onDelete={() =>
            setSingleSalesOrderDelete({
              show: true,
              id: row.original._id,
              demandOrderNumber: `${row.original.demandOrderNumber}`
            })
          }
          entity="demand order"
        />
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
      const savedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
      deepFilter = `${deepFilter}&getById=${JSON.stringify(savedRecords.map((m) => m._id))}`;
    }
    return deepFilter;
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    axiosInstance()
      .get(`${demandOrder.api}${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
          let finalObject = prepareDataForGrid(u, user);
          finalObject['isChecked'] = false;
          finalObject['allowedToEdit'] = permissions?.demandOrder?.isUpdate;
          finalObject['canDelete'] = permissions?.demandOrder?.isDelete;
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

  const showConfirmBox = (row) => {
    if (row) {
      setIsConformDialogVisible(true);
      if (row && row._id) {
        setDeleteRecord(row);
      }
    } else {
      if (selectedRecords.find((d) => d.canDelete === false)) {
        setShowDeleteWarningConfirmBox(true);
      } else {
        setIsConformDialogVisible(true);
      }
    }
  };

  const handleDeleteSalesOrder = async () => {
    setDeleteLoading(true);
    let recordsToDelete = [];
    if (deleteRecord?._id) {
      recordsToDelete.push(deleteRecord?._id);
    } else {
      recordsToDelete = selectedRecords.map((o) => o._id);
    }
    if (recordsToDelete.length > 0) {
      axiosInstance()
        .put(`${demandOrder.api}/remove`, {
          ids: recordsToDelete
        })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          removeLocalStorage(localStorageSelectedRecords);
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

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const onTypeChange = (event, type) => {
    dispatch({ type: 'pageChange', page: 0 });
    const value = DemandOrderType.find((d) => d.key === type).value;
    setSelectedType(value);
    history.push(`?type=${value}`);
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[routes.demandOrder]} />
        <ImportExportLinks
          permissions={permissions?.demandOrder}
          module="demandOrder"
          api={demandOrder.api}
          afterImportCompleted={() => {}}
          isExportAllOrSomeFeature={true}
          total={rowCount}
          recordsToExport={getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length}
          ids={
            getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length
              ? getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.map((obj) => obj._id)
              : []
          }
          onExportToExcelSuccess={() => {
            fetchData();
          }}
          additionalParams={getQueryString(true)}
        />
      </div>
      <CustomContainer>
        <div className="header-panel">
          <div className={'flex justify-between align-items-center gap-1 w-full'}>
            <ToggleButtonGroup
              size="small"
              className="align-items-center gap-1 "
              value={DemandOrderType[selectedType - 1].key}
              exclusive
              onChange={onTypeChange}
            >
              {DemandOrderType.map((k, index) => {
                return (
                  <ToggleButton value={k.key} key={index}>
                    {k.key}
                  </ToggleButton>
                );
              })}
            </ToggleButtonGroup>
          </div>
          <div className="flex flex-wrap gap-[8px]  justify-end">
            <SearchBox onChange={handleSearch} className={styles.search_box_input} value={search} size="small" />
            <div className="flex gap-[8px] flex-wrap items-center">
              <Button
                variant={'contained'}
                color="primary"
                size="small"
                className={`no-shadow`}
                onClick={() => {
                  setShowManageSalesOrderDialog({ open: true, isClone: false, idToClone: null });
                }}
                startIcon={<AddOutlined />}
              >
                Add
              </Button>
              {permissions?.demandOrder?.isDelete && (
                <>
                  <Button
                    variant={'outlined'}
                    color="default"
                    size="small"
                    onClick={openActions}
                    className={`new-dropdown-v1`}
                    aria-controls="action-menu"
                    endIcon={<ExpandMore />}
                    disabled={selectedRecords?.length ? false : true}
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
                    <MenuItem
                      onClick={() => {
                        closeActions();
                        showConfirmBox(null);
                      }}
                    >
                      Delete
                    </MenuItem>
                  </Menu>
                </>
              )}
            </div>
          </div>
        </div>
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            onSelect={() => {}}
            state={tableState}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            isClientSideGrid={false}
            refreshGrid={fetchData}
            showOnlyShowFilteredRecordSwitch={true}
            showFilters={true}
            resource={sidebarResource.demandOrder}
          />
        ) : null}
        {showDeleteWarningConfirmBox ? (
          <MessageDialog
            open={showDeleteWarningConfirmBox}
            message={`You are trying to delete records which you do not have permission to delete, Please remove those records from selection and try again.`}
            onClose={() => setShowDeleteWarningConfirmBox(false)}
          />
        ) : null}
        {isConfirmDialogVisible ? (
          <ConfirmationDialog
            open={isConfirmDialogVisible}
            message={`Are you sure you want to delete ${routes?.demandOrder?.title?.toLowerCase()} ${deleteRecord?.salesOrderName || ''} ?`}
            onClose={() => {
              setDeleteRecord(null);
              setIsConformDialogVisible(false);
            }}
            okBtnLoading={deleteLoading}
            onOk={handleDeleteSalesOrder}
          />
        ) : null}
        {singleSalesOrderDelete.show ? (
          <ConfirmationDialog
            open={singleSalesOrderDelete.show}
            message={`Are you sure you want to delete Demand Order: ${singleSalesOrderDelete.demandOrderNumber}?`}
            onClose={() =>
              setSingleSalesOrderDelete({
                id: null,
                show: false,
                demandOrderNumber: ''
              })
            }
            onOk={handleSingleDeleteSalesOrder}
          />
        ) : null}
      </CustomContainer>
      {showManageSalesOrderDialog.open && (
        <ManageDemandOrderDialog
          isClone={showManageSalesOrderDialog.isClone}
          open={showManageSalesOrderDialog.open}
          demandOrderId={showManageSalesOrderDialog.idToClone}
          onClose={() => setShowManageSalesOrderDialog({ open: false, isClone: false, idToClone: null })}
          onSuccess={() => {
            fetchData();
            setShowManageSalesOrderDialog({ open: false, isClone: false, idToClone: null });
          }}
        />
      )}
    </section>
  );
};

export default DemandOrder;
