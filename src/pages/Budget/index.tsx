import { useContext, useEffect, useState, useReducer, Fragment } from 'react';
import ManageBudgetDialog from './ManageBudgetDialog';
import { Box, Button, Menu, MenuItem, Grid } from '@material-ui/core';
import { useData } from '../../StateProvider/Provider';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import AddIcon from '@material-ui/icons/Add';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import SearchBox from '../../components/Helpers/SearchBox';
import CustomContainer from '../../components/CustomContainer';
import styles from '../Leads/Header.module.scss';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { MdAdd, MdContacts } from 'react-icons/md';
import axiosInstance from '../../axios/axiosInstance';
import { isObjectEmpty, gridLoadingTimeout, budget, prepareDataForGrid, sidebarResource } from '../../constants/helpers';
import routes from './../../components/Helpers/Routes';
import CustomAgGrid, { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';
import CustomRenderCell from '../../components/Helpers/CustomRenderCell';
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import useColumns, { getStaticFields, getFrameworkComponents, gridFilterParser } from '../../constants/useColumns';
import { useLocation, useHistory } from 'react-router-dom';
import queryString from 'query-string';
import { MdSort, MdFilterList, ImCalendar, FaSuitcase } from 'react-icons/all';
import { isMobile, isTablet } from 'react-device-detect';
import CustomSwipableList from '../../components/SwipableListComponents/CustomSwipableList';
import MobileSortDialog from '../../components/MobileSortDialog';
import MobileFilterDialog from '../../components/MobileFilterDialog';
import { camelCase } from 'lodash';
import { Link } from 'react-router-dom';

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
      deepFilter = `${deepFilter}&deepFilter=${encodeURI(JSON.stringify(deepFilters))}`;
    }
    if (filterByIds?.length || deepFilters?.length) {
      deepFilter = `${deepFilter}&filterType=and`;
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }

    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURI(search)}`;
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
      <Fragment>
        <Grid container className="headerbox">
          <Grid item md={4} sm={11} xs={10}>
            <CustomBreadCrumbs routes={[{ title: routes.budget.title }]} />
          </Grid>
          <Grid item md={8} sm={1} xs={2}>
            <ImportExportLinks
              permissions={permissions?.budget}
              module="budget(s)"
              api={'budget'}
              afterImportCompleted={() => {
                fetchBudgetList();
              }}
              isExportAllOrSomeFeature={true}
              total={rowCount}
              recordsToExport={selectedRecords.length}
              ids={selectedRecords.length ? selectedRecords.map((obj) => obj._id) : []}
              onExportToExcelSuccess={() => {
                if (gridApi) gridApi.deselectAll();
                else fetchBudgetList();
              }}
            />
          </Grid>
        </Grid>

        <CustomContainer>
          <div className="header-panel">
            <Grid className={styles.filter_side_container} container justify="space-between">
              <Grid item xs={12} md={6} sm={12} className={isMobile ? styles.mobile_panel : 'd-flex align-items-center gap-1'}>
                <div className="d-flex align-items-center">
                  <MdContacts className="headerLogo" />
                  <span className="listingHeader">{routes.budget.title}</span>
                </div>
                {isMobile && !isTablet && (
                  <div className="d-flex ">
                    <Button
                      onClick={handleClickOpen}
                      id="demo-customized-button"
                      aria-controls="demo-customized-menu"
                      aria-haspopup="true"
                      // aria-expanded={open ? 'true' : undefined}
                      color="secondary"
                      variant="text"
                      disableElevation
                      startIcon={<MdSort />}
                    >
                      Sort
                    </Button>

                    <MobileSortDialog
                      isOpen={open}
                      handleClose={handleClickClose}
                      contentPart={null}
                      secHeading={['Sort Budget']}
                      columns={columns}
                      dispatch={dispatch}
                    />

                    <Button
                      id="demo-customized-button"
                      aria-controls="demo-customized-menu"
                      aria-haspopup="true"
                      // aria-expanded={open ? 'true' : undefined}
                      variant="text"
                      color="secondary"
                      disableElevation
                      startIcon={<MdFilterList />}
                      onClick={handleOpen}
                    >
                      Filter
                    </Button>

                    <MobileFilterDialog
                      isOpen={isOpenDialog}
                      handleClose={handleClose}
                      contentPart={null}
                      columns={columns}
                      dispatch={dispatch}
                      title={routes?.budget?.title}
                      filters={filters}
                    />
                  </div>
                )}
              </Grid>
              <Grid className={styles.filter_side} item md={6} sm={12} xs={12}>
                <Box className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} component="div">
                  <SearchBox
                    onChange={onSearch}
                    className={styles.search_box_input}
                    value={search}
                    size="small"
                    width="242px"
                    style={isMobile ? { flex: 1 } : {}}
                  />

                  <Grid style={{ display: 'flex', gap: '5px' }}>
                    <>
                      <Button
                        variant={isMobile && !isTablet ? 'text' : 'contained'}
                        color="primary"
                        size="small"
                        startIcon={isMobile && !isTablet ? null : <AddOutlined />}
                        className={isMobile && !isTablet ? 'mobile_button' : styles.add_submit_btn}
                        onClick={() => {
                          setShowManageBudgetDialog({ show: true, id: null, isClone: false });
                        }}
                      >
                        {isMobile && !isTablet ? <MdAdd size={23} /> : 'Add'}
                      </Button>
                    </>

                    <>
                      <Button
                        variant={isMobile && !isTablet ? 'text' : 'outlined'}
                        color="default"
                        size="small"
                        className={
                          isMobile && !isTablet ? 'mobile_button' : `${styles.add_submit_btn} ${styles.action_new_submit_btn} new-dropdown-v1`
                        }
                        onClick={openActions}
                        disabled={selectedRecords.length ? false : true}
                        aria-controls="action-menu"
                        endIcon={<ExpandMore />}
                      >
                        {isMobile && !isTablet ? '' : 'Actions'}
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
                    </>
                  </Grid>
                </Box>
              </Grid>
            </Grid>
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
                    setShowManageBudgetDialog({ show: true, id: d.id, isClone: false });
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
                  owerCollaboratorInitialsOrImages=""
                  onCreate={() => setShowManageBudgetDialog({ show: true, id: null, isClone: null })}
                  showClone={false}
                  onClone={() => {}}
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
      </Fragment>
    </>
  );
}

export default Budget;
