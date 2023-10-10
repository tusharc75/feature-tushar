import { Box, Button, Menu, MenuItem } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { camelCase } from 'lodash';
import queryString from 'query-string';
import { useContext, useEffect, useReducer, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { FaSuitcase, ImCalendar, TbArrowsSort } from 'react-icons/all';
import { MdContacts, MdOutlineFilterAlt } from 'react-icons/md';
import { useHistory, useLocation } from 'react-router-dom';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomAgGrid, { intialState, reducer } from '../../components/AgGridComponents/CustomAgGrid';
import CustomContainer from '../../components/CustomContainer';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import SearchBox from '../../components/Helpers/SearchBox';
import MobileFilterDialog, { DisplayFiltersForMobile } from '../../components/MobileFilterDialog';
import MobileSortDialog from '../../components/MobileSortDialog';
import CustomSwipableList from '../../components/SwipableListComponents/CustomSwipableList';
import {
  budget,
  getLocalStorageArrayData,
  gridLoadingTimeout,
  prepareDataForGrid,
  removeLocalStorage,
  sidebarResource
} from '../../constants/helpers';
import useColumns, { getFrameworkComponents, getStaticFields, gridFilterParser } from '../../constants/useColumns';
import styles from '../Leads/Header.module.scss';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import ManageBudgetDialog from './ManageBudgetDialog';

let timeout;
function Budget() {
  const renderedFrom = camelCase(routes?.budget.title);
  const location = useLocation();
  const history = useHistory();
  const {
    state: { permissions, user, selectedEntity }
  }: any = useData();
  const { budgetApi } = budget;

  const [deleteRecord, setDeleteRecord] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [showManageBudgetDialog, setShowManageBudgetDialog] = useState({
    show: false,
    id: null,
    isClone: false
  });
  const { getColumnData } = useColumns();
  const [columns, setColumns] = useState([]);
  const [frameWorkComponent, setFrameWorkComponent] = useState({});

  const [gridApi, setGridApi] = useState(null);
  const toastConfig = useContext(CustomToastContext);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const localStorageSelectedRecords = `${renderedFrom}_selected`;

  const [isOpenDialog, setisOpenDialog] = useState(false);

  const handleOpen = () => {
    setisOpenDialog(true);
  };

  const handleClose = () => {
    setisOpenDialog(false);
  };

  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClickClose = () => {
    setOpen(false);
  };

  useEffect(() => {
    let millisec = Object.keys(search).length > 0 ? 600 : 5;

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      fetchBudgetList();
    }, millisec);
  }, [search]);

  useEffect(() => {
    fetchBudgetList();
  }, [page, limit, filters, sorting, selectedEntity, showFilteredRecordsOnly]);

  useEffect(() => {
    const parsedParams = queryString.parse(location?.search);
    if (parsedParams?.id) {
      setShowManageBudgetDialog({ show: true, id: parsedParams?.id, isClone: false });
    }
  }, [location]);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=Budget&view=true`)
      .then(({ data: { data } }) => {
        let columns = [];
        let rendererNames = [];
        data.forEach((o) => {
          let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.budgetDetail.path, true);
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

  const ActionsRenderer = (params) => (
    <>
      <Tooltip
        className={permissions?.budget.isCreate ? '' : 'cursor-stop'}
        title={permissions?.budget.isCreate ? 'Clone' : 'You do not have permission to clone/create'}
      >
        <IconButton
          size="small"
          aria-label="Clone"
          onClick={() => {
            setShowManageBudgetDialog({ show: true, id: params.data._id, isClone: true });
          }}
        >
          <FileCopyIcon fontSize="small" color="primary" />
        </IconButton>
      </Tooltip>
      {permissions?.budget?.isDelete && (
        <Tooltip title="Delete">
          <IconButton
            size="small"
            aria-label="Delete"
            onClick={() => {
              setDeleteRecord(params.data);
              setShowDeleteConfirmBox(true);
            }}
          >
            <DeleteIcon color="error" />
          </IconButton>
        </Tooltip>
      )}
    </>
  );

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}`;

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

  const fetchBudgetList = () => {
    dispatch({ type: 'loading', loading: true });

    if (gridApi) {
      gridApi.setRowData([]);
    }

    const queryString = getQueryString();
    axiosInstance()
      .get(`/budget${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
          let finalObject = prepareDataForGrid(u);
          finalObject['canDelete'] = permissions?.budget.isDelete;
          finalObject['isChecked'] = selectedRecords.some((s) => s._id === u._id);
          finalObject['allowedToEdit'] = permissions?.budget.isUpdate;
          return {
            ...finalObject
          };
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

  const onSuccess = () => {
    // Add code of getting grid data again
    fetchBudgetList();
    setShowManageBudgetDialog({ show: false, id: null, isClone: false });
  };

  const handleDelete = () => {
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords.map((d) => d._id);
    }
    axiosInstance()
      .put(`${budgetApi}/remove`, { ids: ids })
      .then(() => {
        removeLocalStorage(localStorageSelectedRecords);
        fetchBudgetList();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
        setAnchorEl(null);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const onSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  return (
    <>
      {showManageBudgetDialog.show && (
        <ManageBudgetDialog
          open={showManageBudgetDialog.show}
          onSuccess={onSuccess}
          onClose={() => {
            setShowManageBudgetDialog({ show: false, id: null, isClone: false });
          }}
          budgetId={showManageBudgetDialog.id}
          isClone={showManageBudgetDialog.isClone}
        />
      )}
      <section className="main-container-v1">
        <div className="headerbox-v1">
          <CustomBreadCrumbs routes={[{ title: routes.budget.title }]} />
          <ImportExportLinks
            permissions={permissions?.budget}
            module="budget(s)"
            api={'budget'}
            afterImportCompleted={() => {
              fetchBudgetList();
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
              else fetchBudgetList();
            }}
          />
        </div>

        <CustomContainer>
          <div className="header-panel">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
              <div className={'d-flex flex-wrap align-items-center gap-1 w-full'}>
                <div className="d-flex align-items-center">
                  <MdContacts className="headerLogo" />
                  <span className="listingHeader">{routes.budget.title}</span>
                </div>
                {isMobile && !isTablet && (
                  <div className="d-flex flex-wrap items-center justify-between w-full">
                    <div></div>
                    <div className="flex flex-wrap items-center gap-1">
                      <IconButton
                        onClick={handleClickOpen}
                        id="demo-customized-button"
                        aria-controls="demo-customized-menu"
                        aria-haspopup="true"
                        aria-expanded={open ? 'true' : undefined}
                        size="small"
                        className={'mobileIconButton secondary'}
                      >
                        <TbArrowsSort className="rotate-90" size={16} />
                      </IconButton>

                      <MobileSortDialog
                        isOpen={open}
                        handleClose={handleClickClose}
                        contentPart={null}
                        secHeading={['Sort Budget']}
                        columns={columns}
                        dispatch={dispatch}
                      />

                      <IconButton
                        id="demo-customized-button"
                        aria-controls="demo-customized-menu"
                        aria-haspopup="true"
                        aria-expanded={open ? 'true' : undefined}
                        size="small"
                        className={'mobileIconButton secondary'}
                        onClick={handleOpen}
                      >
                        <MdOutlineFilterAlt size={16} />
                      </IconButton>

                      <MobileFilterDialog
                        isOpen={isOpenDialog}
                        handleClose={handleClose}
                        contentPart={null}
                        columns={columns}
                        dispatch={dispatch}
                        title={routes?.budget?.title}
                        filters={filters}
                        resource={sidebarResource.budget}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-[8px]  justify-end">
                <SearchBox onChange={onSearch} className={styles.search_box_input} value={search} size="small" />

                <div className="flex gap-[8px] flex-wrap items-center">
                  <Button
                    variant={'contained'}
                    color="primary"
                    size="small"
                    startIcon={<AddOutlined />}
                    className={`no-shadow`}
                    onClick={() => {
                      setShowManageBudgetDialog({ show: true, id: null, isClone: false });
                    }}
                  >
                    Add
                  </Button>

                  <Button
                    variant={'outlined'}
                    color="default"
                    size="small"
                    className={`new-dropdown-v1`}
                    onClick={openActions}
                    disabled={selectedRecords.length ? false : true}
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
                    <MenuItem onClick={() => setShowDeleteConfirmBox(true)}>Delete</MenuItem>
                  </Menu>
                </div>
              </div>
              <DisplayFiltersForMobile resource={sidebarResource.budget} />
            </div>
          </div>
          <Box component="div">
            {Object.keys(frameWorkComponent).length > 0 ? (
              isMobile && !isTablet ? (
                <CustomSwipableList
                  allowSelection={true}
                  allowSwipe={true}
                  permissions={permissions?.budget}
                  primaryField={columns?.find((d) => d.primaryField)}
                  onClick={(d) => {
                    history.push(`${routes.budgetDetail.path}/${d.id}`);
                    // setShowManageBudgetDialog({ show: true, id: d.id, isClone: false });
                  }}
                  dataRows={dataRows}
                  selectedRecords={selectedRecords}
                  dispatch={dispatch}
                  onEdit={(d) => {
                    setShowManageBudgetDialog({ show: true, id: d.id, isClone: false });
                  }}
                  extraParamsToCheckDelete={true}
                  onDelete={(d) => {
                    setDeleteRecord(d);
                    setShowDeleteConfirmBox(true);
                  }}
                  rowCount={rowCount}
                  page={page}
                  loading={loading}
                  additionalDetails={[
                    {
                      icon: <FaSuitcase />,
                      field: 'entity'
                    }
                  ]}
                  chips={[
                    {
                      icon: <ImCalendar />,
                      label: 'Year: ',
                      field: 'year'
                    }
                  ]}
                  onClone={(d) => {
                    setShowManageBudgetDialog({ show: true, id: d._id, isClone: true });
                  }}
                  owerCollaboratorInitialsOrImages=""
                  onCreate={() => setShowManageBudgetDialog({ show: true, id: null, isClone: null })}
                  showClone={true}
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
                  actionWidth={100}
                  loading={loading}
                  renderedFrom={renderedFrom}
                  refreshGrid={fetchBudgetList}
                  showOnlyShowFilteredRecordSwitch={true}
                  showFilters={true}
                  resource={sidebarResource.budget}
                />
              )
            ) : null}
          </Box>
        </CustomContainer>

        {showDeleteConfirmBox && (
          <ConfirmationDialog
            open={showDeleteConfirmBox}
            message={
              deleteRecord?._id
                ? `Are you sure you want to delete the budget ${deleteRecord?.name} ?`
                : 'Are you sure you want to delete selected budget(s) ?'
            }
            onClose={() => {
              setDeleteRecord(null);
              setShowDeleteConfirmBox(false);
            }}
            onOk={handleDelete}
          />
        )}
      </section>
    </>
  );
}

export default Budget;
