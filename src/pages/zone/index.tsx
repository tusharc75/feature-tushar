import { useState, useEffect, Fragment, useContext, useReducer } from 'react';
import Grid from '@material-ui/core/Grid';
import { Link } from 'react-router-dom';
import Button from '@material-ui/core/Button';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../axios/axiosInstance';
import styles from '../Leads/Header.module.scss';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import CustomContainer from '../../components/CustomContainer';
import CreateZone from '../zone/CreateZone';
import routes from '../../components/Helpers/Routes';
import SearchBox from '../../components/Helpers/SearchBox';
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import { gridLoadingTimeout, gridPageSizes, isObjectEmpty, sidebarResource } from '../../constants/helpers';
import CustomAgGrid, { intialState, reducer } from '../../components/AgGridComponents/CustomAgGrid';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import { useData } from '../../StateProvider/Provider';
import { Box, Menu, MenuItem } from '@material-ui/core';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { useLocation } from 'react-router-dom';
import queryString from 'query-string';
import useColumns, { getStaticFields, getFrameworkComponents, gridFilterParser } from '../../constants/useColumns';
import { prepareDataForGrid } from '../../constants/helpers';
import { GiFireZone, MdAdd, MdSort, MdFilterList } from 'react-icons/all';
import CustomSwipableList from '../../components/SwipableListComponents/CustomSwipableList';
import { isMobile, isTablet } from 'react-device-detect';
import { useHistory } from 'react-router-dom';
import { FaSuitcase } from 'react-icons/fa';
import MobileSortDialog from '../../components/MobileSortDialog';
import MobileFilterDialog from '../../components/MobileFilterDialog';
import { camelCase } from 'lodash';

const Zone = () => {
  const renderedFrom = camelCase(routes?.zone.title);
  const localStorageSelectedRecords = `${renderedFrom}_selected`;

  const location = useLocation();
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions, user, selectedEntity }
  }: any = useData();
  const { getColumnData } = useColumns();

  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [open, setOpen] = useState({ open: false, isClone: false });
  const [zoneId, setZoneId] = useState(null);
  const [columns, setColumns] = useState([]);
  const [frameWorkComponent, setFrameWorkComponent] = useState({});
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } =
    state;
  const [isOpenDialog, setisOpenDialog] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    const parsedParams = queryString.parse(location?.search);
    if (parsedParams?.id) {
      setZoneId(parsedParams?.id);
      setOpen({ open: true, isClone: false });
    }
  }, [location]);

  useEffect(() => {
    fetchZone();
  }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly]);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = () => {
    axiosInstance()
      .get('/field?resource=Zone')
      .then(({ data: { data } }) => {
        let columns = [];
        let rendererNames = [];
        data.forEach((o) => {
          let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.zoneDetail.path);
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
    <Fragment>
      <Tooltip
        className={permissions?.zone?.isCreate ? '' : 'cursor-stop'}
        title={permissions?.zone?.isCreate ? 'Clone' : 'You do not have permission to clone/create'}
      >
        <IconButton
          size="small"
          aria-label="Clone"
          onClick={() => {
            setZoneId(params.data.id);
            setOpen({ open: true, isClone: true });
          }}
        >
          <FileCopyIcon fontSize="small" color="primary" />
        </IconButton>
      </Tooltip>
      {permissions?.zone?.isDelete ? (
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
        <Tooltip className="cursor-stop" title={`You do not have permission to delete `}>
          <IconButton aria-label="Delete">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Fragment>
  );


  const getQueryString = (isExport = false) => {
    let deepFilter = !isExport ? `?page=${page}&limit=${limit}` : '?';
    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`;
    }

    const { filterByIds, deepFilters } = gridFilterParser(filters)

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

  const fetchZone = () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    if (gridApi) {
      gridApi.setRowData([]);
    }
    axiosInstance()
      .get(`/zone${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data.map((u: any) => {
          let finalObject = prepareDataForGrid(u);
          finalObject['canDelete'] = permissions?.zone?.isDelete;
          finalObject['isChecked'] = selectedRecords.some((s) => s._id === u._id);
          finalObject['allowedToEdit'] = permissions?.zone?.isUpdate;
          return {
            ...finalObject
          };
        });
        if (appendRows) {
          dispatch({
            type: 'initialize',
            data: [...dataRows, ...rows],
            count: count,
            selectedRecords: [...dataRows, ...rows].filter((f) => f.isChecked === true)
          });
        } else {
          dispatch({
            type: 'initialize',
            data: rows,
            count: count,
            selectedRecords: rows.filter((f) => f.isChecked === true)
          });
        }
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

  const handleDelete = () => {
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords.map((m) => m._id);
    }
    axiosInstance()
      .put(`/zone/remove`, { ids: ids })
      .then(() => {
        fetchZone();
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

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const handleOpen = () => {
    setisOpenDialog(true);
  };

  const handleClickOpen = () => {
    setSortOpen(true);
  };

  const handleClickClose = () => {
    setSortOpen(false);
  };

  const handleFilterClose = () => {
    setisOpenDialog(false);
  };

  return (
    <Fragment>
      <Grid container className="headerbox">
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs routes={[{ title: routes.zone.title }]} />
        </Grid>
        <Grid item md={8} sm={1} xs={2}>
          <ImportExportLinks
            permissions={permissions?.zone}
            module="zone"
            api={'/zone'}
            afterImportCompleted={() => {
              fetchZone();
            }}
            isExportAllOrSomeFeature={true}
            total={rowCount}
            recordsToExport={selectedRecords.length}
            ids={selectedRecords.length ? selectedRecords.map((obj) => obj._id) : []}
            onExportToExcelSuccess={() => {
              if (gridApi) gridApi.deselectAll();
              else fetchZone();
            }}
            additionalParams={getQueryString(true)}
          />
        </Grid>
      </Grid>
      <CustomContainer>
        <div className="header-panel">
          <Grid container className={styles.filter_side_container}>
            <Grid item xs={12} md={6} sm={12} className={isMobile ? styles.mobile_panel : 'd-flex align-items-center gap-1'}>
              {isMobile && (
                <>
                  <Grid style={{ display: 'inline-flex' }}>
                    <Button
                      onClick={handleClickOpen}
                      id="demo-customized-button"
                      aria-controls="demo-customized-menu"
                      aria-haspopup="true"
                      aria-expanded={'true'}
                      color="secondary"
                      variant="text"
                      disableElevation
                      startIcon={<MdSort />}
                      className={'sort-filter-tablet'}
                      style={isTablet ? { marginLeft: '50px' } : {}}
                    >
                      Sort
                    </Button>
                    <MobileSortDialog
                      isOpen={sortOpen}
                      handleClose={handleClickClose}
                      contentPart={null}
                      secHeading={['Sort Zone']}
                      columns={columns}
                      dispatch={dispatch}
                    />
                    <Button
                      id="demo-customized-button"
                      aria-controls="demo-customized-menu"
                      aria-haspopup="true"
                      aria-expanded={'true'}
                      variant="text"
                      color="secondary"
                      disableElevation
                      className={'sort-filter-tablet'}
                      startIcon={<MdFilterList />}
                      onClick={handleOpen}
                    >
                      Filter
                    </Button>
                    <MobileFilterDialog
                      isOpen={isOpenDialog}
                      handleClose={handleFilterClose}
                      contentPart={null}
                      columns={columns}
                      dispatch={dispatch}
                      title={routes?.zone?.title}
                      filters={filters}
                    />
                  </Grid>
                </>
              )}
            </Grid>
            <Grid md={6} sm={12} xs={12} container className={styles.filter_side}>
              <Box className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} component="div">
                <Grid>
                  <SearchBox
                    onSearch={handleSearch}
                    searchbox={styles.search_box_input}
                    width={isMobile ? '200px' : '242px'}
                    style={isMobile ? { flex: 1 } : {}}
                    size="small"
                    value={search}
                  />
                </Grid>

                <Grid style={{ display: 'flex', gap: '5px' }}>
                  {permissions?.zone?.isCreate && (
                    <Button
                      className={isMobile && !isTablet ? 'mobile_button' : styles.add_submit_btn}
                      onClick={() => {
                        setZoneId(null);
                        setOpen({ open: true, isClone: false });
                      }}
                      variant={isMobile && !isTablet ? 'text' : 'contained'}
                      size="small"
                      color="primary"
                      startIcon={isMobile && !isTablet ? null : <AddOutlined />}
                    >
                      {isMobile && !isTablet ? <MdAdd size={23} /> : 'Add'}
                    </Button>
                  )}
                  {permissions?.zone?.isDelete && (
                    <Button
                      variant={isMobile && !isTablet ? 'text' : 'outlined'}
                      color="default"
                      size="small"
                      onClick={openActions}
                      disabled={selectedRecords.length ? false : true}
                      aria-controls="action-menu"
                      className={isMobile && !isTablet ? 'mobile_button' : styles.action_submit_btn}
                      endIcon={<ExpandMore />}
                    >
                      {isMobile && !isTablet ? '' : 'Actions'}
                    </Button>
                  )}
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
                      disabled={!permissions?.zone.isDelete}
                      onClick={() => {
                        closeActions();
                        setShowDeleteConfirmBox(true);
                      }}
                    >
                      Delete
                    </MenuItem>
                  </Menu>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </div>

        {Object.keys(frameWorkComponent).length > 0 ? (
          isMobile && !isTablet ? (
            <CustomSwipableList
              allowSelection={true}
              allowSwipe={true}
              permissions={permissions?.zone}
              primaryField={columns?.find((d) => d.primaryField)}
              onClick={(data) => {
                setZoneId(data.id);
                setOpen({ open: true, isClone: false });
              }}
              dataRows={dataRows}
              selectedRecords={selectedRecords}
              dispatch={dispatch}
              onEdit={(data) => {
                setZoneId(data.id);
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
              additionalDetails={[
                {
                  icon: <FaSuitcase size={18} />,
                  field: 'name'
                }
              ]}
              chips={[]}
              owerCollaboratorInitialsOrImages=""
              onCreate={false}
              showClone={true}
              onClone={(data) => {
                setZoneId(data.id);
                setOpen({ open: true, isClone: true });
              }}
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
              refreshGrid={fetchZone}
              showOnlyShowFilteredRecordSwitch={true}
              showFilters={true}
              resource={sidebarResource.zone}
            />
          )
        ) : null}

        {showDeleteConfirmBox && (
          <ConfirmationDialog
            open={showDeleteConfirmBox}
            message={`Are you sure you want to delete zone  ${deleteRecord?._id ? deleteRecord?.name : ''}?`}
            onClose={() => {
              setDeleteRecord(null);
              setShowDeleteConfirmBox(false);
            }}
            onOk={handleDelete}
          />
        )}

        {open?.open && (
          <CreateZone
            isUpdateDisabled={false}
            zoneId={zoneId}
            isClone={open?.isClone}
            onClose={() => setOpen({ open: false, isClone: false })}
            onSuccess={() => {
              setOpen({ open: false, isClone: false });
              fetchZone();
            }}
          />
        )}
      </CustomContainer>
    </Fragment>
  );
};

export default Zone;
