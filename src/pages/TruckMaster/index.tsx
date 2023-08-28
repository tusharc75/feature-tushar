import { Box, Button, Grid, IconButton, Menu, MenuItem, Tooltip } from '@material-ui/core';
import { Fragment, useContext, useEffect, useReducer, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import ImportExportLinks from 'src/components/Helpers/ImportExportLinks';
import routes from 'src/components/Helpers/Routes';
import SearchBox from 'src/components/Helpers/SearchBox';
import { camelCase } from 'lodash';
import useColumns, { getStaticFields, getFrameworkComponents, gridFilterParser } from '../../constants/useColumns';
import { useData } from 'src/StateProvider/Provider';
import CustomAgGrid, { intialState, reducer } from '../../components/AgGridComponents/CustomAgGrid';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import { MdAdd } from 'react-icons/md';
import CustomSwipableList from 'src/components/SwipableListComponents/CustomSwipableList';
import axiosInstance from 'src/axios/axiosInstance';
import {
  getLocalStorageArrayData,
  gridLoadingTimeout,
  isObjectEmpty,
  prepareDataForGrid,
  removeLocalStorage,
  sidebarResource
} from 'src/constants/helpers';
import { Link } from 'react-router-dom';
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import styles from '../Leads/Header.module.scss';
import ManageTruckMaster from './ManageTruckMaster';
import CardView from './CardView';
import AppsIcon from '@material-ui/icons/Apps';
import ViewListIcon from '@material-ui/icons/ViewList';

const TruckMaster = () => {
  const renderedFrom = camelCase(routes?.truckMaster.title);
  const localStorageSelectedRecords = `${renderedFrom}_selected`;

  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions, selectedEntity, user }
  }: any = useData();
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } =
    state;
  const [truckMasterId, setTruckMasterId] = useState(null);
  const [open, setOpen] = useState({ open: false, isClone: false });
  const [anchorEl, setAnchorEl] = useState(null);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [frameWorkComponent, setFrameWorkComponent] = useState({});
  const [columns, setColumns] = useState([]);
  const [gridApi, setGridApi] = useState(null);
  const { getColumnData } = useColumns();

  const [viewType, setViewType] = useState(1);
  const [cardViewData, setCardViewData] = useState([]);

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource?.truckMaster}`)
      .then(({ data: { data } }) => {
        let columns = [];
        let rendererNames = [];
        data.forEach((o) => {
          let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.truckMasterDetail.path, true);
          if (currentColumn !== null) {
            columns = [...columns, currentColumn?.columnData];
            if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
              rendererNames.push(currentColumn?.rendererName);
            }
          }
        });
        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
        tempFrameworkComponent = {
          ...tempFrameworkComponent,
          actionsRenderer: ActionsRenderer
        };
        setFrameWorkComponent({ ...tempFrameworkComponent });
        columns = [...columns, ...getStaticFields()];
        setColumns([...columns]);
      });
  };

  const fetchTruckMasterData = () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    if (gridApi) {
      gridApi.setRowData([]);
    }
    axiosInstance()
      .get(`${routes?.truckMaster.path}${queryString}`)
      .then(({ data: { data } }) => {
        setCardViewData(data?.data);
        let rows = data?.data?.map((u: any) => {
          let finalObject: any = prepareDataForGrid(u);
          finalObject['canDelete'] = permissions?.truckMaster?.isDelete;
          finalObject['isChecked'] = selectedRecords?.some((s) => s._id === u._id);
          finalObject['allowedToEdit'] = permissions?.truckMaster?.isUpdate;
          return {
            ...finalObject
          };
        });
        if (appendRows) {
          dispatch({
            type: 'initialize',
            data: [...dataRows, ...rows],
            count: data?.count,
            selectedRecords: [...dataRows, ...rows].filter((f) => f.isChecked === true)
          });
        } else {
          dispatch({
            type: 'initialize',
            data: rows,
            count: data?.count,
            selectedRecords: rows.filter((f) => f.isChecked === true)
          });
        }
        dispatch({ type: 'initialize', data: rows, count: data?.count });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      });
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = !isExport ? `?page=${page}&limit=${limit}` : '?';
    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`;
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

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const ActionsRenderer = (params) => (
    <Fragment>
      {permissions?.truckMaster?.isCreate ? (
        <Tooltip title="Clone">
          <IconButton
            size="small"
            aria-label="Clone"
            onClick={() => {
              setTruckMasterId(params.data.id);
              setOpen({ open: true, isClone: true });
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

      {params?.data?.canDelete ? (
        <Tooltip title="Delete">
          <IconButton
            aria-label="Delete"
            onClick={() => {
              setDeleteRecord(params.data);
              setShowDeleteConfirmBox(true);
            }}
          >
            <DeleteIcon fontSize="small" color="error" />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip className="cursor-stop" title="You do not have permission to delete">
          <IconButton aria-label="Delete" size="small">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Fragment>
  );

  const handleDelete = () => {
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords.map((m) => m._id);
    }
    axiosInstance()
      .put(`${routes?.truckMaster?.path}/remove`, { ids: ids })
      .then(({ data }) => {
        removeLocalStorage(localStorageSelectedRecords);
        fetchTruckMasterData();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    fetchTruckMasterData();
  }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly]);

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ title: routes.truckMaster.title }]} />
        <ImportExportLinks
          permissions={permissions.truckMaster}
          module="truckMaster"
          api={'truck-master'}
          afterImportCompleted={() => {
            fetchTruckMasterData();
          }}
          isExportAllOrSomeFeature={true}
          total={rowCount}
          recordsToExport={getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length}
          ids={
            getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length
              ? getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.map((obj) => obj._id)
              : []
          }
          onExportToExcelSuccess={() => {
            if (gridApi) gridApi.deselectAll();
            else fetchTruckMasterData();
          }}
          additionalParams={getQueryString(true)}
        />
      </div>
      <CustomContainer>
        <div className="header-panel">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={'d-flex align-items-center gap-1'}>
              <IconButton
                size="small"
                aria-label="Clone"
                onClick={() => {
                  setViewType(1);
                }}
              >
                <AppsIcon color={viewType === 1 ? 'primary' : 'disabled'} />
              </IconButton>
              <IconButton
                size="small"
                aria-label="Clone"
                onClick={() => {
                  setViewType(2);
                }}
              >
                <ViewListIcon color={viewType === 2 ? 'primary' : 'disabled'} />
              </IconButton>
            </div>
            <div className="flex flex-wrap gap-[8px]  justify-end">
              <SearchBox onChange={handleSearch} className={styles.search_box_input} size="small" value={search} />
              <div className="flex gap-[8px] flex-wrap items-center">
                {permissions?.truckMaster?.isCreate && (
                  <Button
                    className={'no-shadow'}
                    onClick={() => {
                      setTruckMasterId(null);
                      setOpen({ open: true, isClone: false });
                    }}
                    variant={'contained'}
                    size="small"
                    color="primary"
                    startIcon={<AddOutlined />}
                  >
                    Add
                  </Button>
                )}
                {permissions?.truckMaster?.isDelete && (
                  <>
                    <Button
                      variant={'outlined'}
                      color="default"
                      size="small"
                      onClick={openActions}
                      disabled={selectedRecords.length ? false : true}
                      aria-controls="action-menu"
                      className={`new-dropdown-v1`}
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
                      <MenuItem
                        disabled={
                          !(
                            (selectedRecords?.length > 0 && selectedRecords?.filter((e) => e?.canDelete === true)?.length) === selectedRecords?.length
                          )
                        }
                        onClick={() => {
                          closeActions();
                          // eslint-disable-next-line no-lone-blocks
                          {
                            selectedRecords.length === 1 && setDeleteRecord(selectedRecords[0]);
                          }
                          setShowDeleteConfirmBox(true);
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
        </div>
        {viewType === 1 && (
          <CardView
            data={cardViewData}
            fields={columns}
            setTruckMasterId={setTruckMasterId}
            setOpen={setOpen}
            setDeleteRecord={setDeleteRecord}
            setShowDeleteConfirmBox={setShowDeleteConfirmBox}
          />
        )}
        {viewType === 2 && (
          <>
            {Object.keys(frameWorkComponent).length > 0 ? (
              isMobile && !isTablet ? (
                <CustomSwipableList
                  allowSelection={true}
                  allowSwipe={true}
                  permissions={permissions.truckMaster}
                  primaryField={columns?.find((d) => d.primaryField)}
                  onClick={(data) => {
                    setTruckMasterId(data.id);
                    setOpen({ open: true, isClone: false });
                  }}
                  dataRows={dataRows}
                  selectedRecords={selectedRecords}
                  dispatch={dispatch}
                  onEdit={(data) => {
                    setTruckMasterId(data.id);
                    setOpen({ open: true, isClone: false });
                  }}
                  extraParamsToCheckDelete={true}
                  onDelete={(data) => {
                    setDeleteRecord(data);
                    setShowDeleteConfirmBox(true);
                  }}
                  rowCount={rowCount}
                  page={page}
                  loading={loading}
                  additionalDetails={[]}
                  owerCollaboratorInitialsOrImages=""
                  onCreate={false}
                  showClone={true}
                  onClone={(data) => {
                    setTruckMasterId(data.id);
                    setOpen({ open: true, isClone: true });
                  }}
                  chips={[]}
                  renderedFrom={renderedFrom}
                />
              ) : (
                <CustomAgGrid
                  columns={columns}
                  dataRows={dataRows}
                  frameworkComponents={frameWorkComponent}
                  setGridApi={setGridApi}
                  dispatch={dispatch}
                  rowCount={rowCount}
                  limit={limit}
                  pageSizes={pageSizes}
                  page={page}
                  allowAction={true}
                  loading={loading}
                  renderedFrom={renderedFrom}
                  refreshGrid={fetchTruckMasterData}
                  showOnlyShowFilteredRecordSwitch={true}
                />
              )
            ) : null}
          </>
        )}

        {showDeleteConfirmBox && (
          <ConfirmationDialog
            open={showDeleteConfirmBox}
            message={`Are you sure you want to delete Truck Master  ${deleteRecord?.truckName || ''} ?`}
            onClose={() => {
              setDeleteRecord(null);
              setShowDeleteConfirmBox(false);
            }}
            onOk={handleDelete}
          />
        )}
        {open?.open && (
          <ManageTruckMaster
            id={truckMasterId}
            isClone={open?.isClone}
            onClose={() => setOpen({ open: false, isClone: false })}
            onSuccess={() => {
              setOpen({ open: false, isClone: false });
              fetchTruckMasterData();
            }}
          />
        )}
      </CustomContainer>
    </section>
  );
};

export default TruckMaster;
