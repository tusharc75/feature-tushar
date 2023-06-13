import { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../axios/axiosInstance';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import { Box, Menu, MenuItem } from '@material-ui/core';
import SearchBox from '../../components/Helpers/SearchBox';
import styles from '../Leads/Header.module.scss';
import routes from '../../components/Helpers/Routes';
import CustomAgGrid, { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';
import {
  isObjectEmpty,
  gridLoadingTimeout,
  getLocalStorageArrayData,
  serviceMaster,
  removeLocalStorage,
  sidebarResource
} from '../../constants/helpers';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { useData } from '../../StateProvider/Provider';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import HtmlTooltip from '../../components/CustomTooltipTitle';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import useColumns, { getStaticFields, getFrameworkComponents, gridFilterParser } from '../../constants/useColumns';
import { prepareDataForGrid } from '../../constants/helpers';
import { MdAdd, MdSort, MdFilterList, MdMiscellaneousServices } from 'react-icons/all';
import CustomSwipableList from '../../components/SwipableListComponents/CustomSwipableList';
import { isMobile, isTablet } from 'react-device-detect';
import { useHistory } from 'react-router-dom';
import MobileSortDialog from '../../components/MobileSortDialog';
import MobileFilterDialog from '../../components/MobileFilterDialog';
import { camelCase } from 'lodash';
import ManageServiceMaster from './ManageServiceMaster';

const ServiceMaster = () => {
  let renderedFrom = camelCase(routes.serviceMaster?.title);
  const localStorageSelectedRecords = `${renderedFrom}_selected`;

  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();

  const [showManageDialog, setShowManageDialog] = useState({ open: false, isClone: false, idToClone: null });
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [gridApi, setGridApi] = useState(null);
  const [sortOpen, setSortOpen] = useState(false);
  const [columns, setColumns] = useState([]);
  const [frameWorkComponent, setFrameWorkComponent] = useState({});
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } =
    state;

  const [isOpenDialog, setisOpenDialog] = useState(false);

  const {
    state: { permissions, selectedEntity }
  }: any = useData();
  const { getColumnData } = useColumns();

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    fetchData();
  }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly]);

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=${serviceMaster.resource}`)
      .then(({ data: { data } }) => {
        let columns = [];
        let rendererNames = [];
        data.forEach((o) => {
          let currentColumn = getColumnData(routes.serviceMaster?.title, o?.fieldData, routes.serviceMasterDetail.path);
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

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    const queryString = getQueryString();
    axiosInstance()
      .get(`${serviceMaster.api}${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data?.map((u) => {
          let finalObject = prepareDataForGrid(u);
          finalObject['isChecked'] = getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.some((s) => s._id === u._id);
          finalObject['allowedToEdit'] = permissions?.serviceMaster?.isUpdate;
          finalObject['canDelete'] = permissions?.serviceMaster?.isUpdate;
          let res = {
            ...finalObject
          };
          return res;
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
    let deepFilter = !isExport ? `?page=${page}&limit=${limit}` : '?';

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

  const handleDelete = () => {
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.map((d) => d._id);
    }
    axiosInstance()
      .put(`${serviceMaster.api}/remove`, { ids: ids })
      .then(() => {
        removeLocalStorage(localStorageSelectedRecords);
        fetchData();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
        setAnchorEl(null);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const ActionsRenderer = (params) => (
    <>
      {permissions?.serviceMaster?.isCreate && (
        <HtmlTooltip title="Clone">
          <IconButton
            size="small"
            aria-label="Clone"
            onClick={() => {
              setShowManageDialog({ open: true, isClone: true, idToClone: params.data._id });
            }}
          >
            <FileCopyIcon color="primary" />
          </IconButton>
        </HtmlTooltip>
      )}
      {permissions?.serviceMaster?.isDelete && (
        <HtmlTooltip title="Delete">
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
        </HtmlTooltip>
      )}
    </>
  );

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
          <CustomBreadCrumbs routes={[routes.serviceMaster]} />
        </Grid>
        <Grid item md={8} sm={1} xs={2}>
          <ImportExportLinks
            permissions={permissions?.serviceMaster}
            module="service master"
            api={serviceMaster.api}
            afterImportCompleted={() => {
              fetchData();
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
              else fetchData();
            }}
            additionalParams={getQueryString(true)}
            title={routes.serviceMaster.title}
            extraImportExportLinks={[
              {
                title: 'Step Template',
                api: `${serviceMaster.api}/steps/unknown/template`,
                type: 'download'
              },
              {
                title: 'Step Export',
                api: `${serviceMaster.api}/steps/unknown/template?export=true${getLocalStorageArrayData(`${localStorageSelectedRecords}`).length
                    ? `&ids=${JSON.stringify(getLocalStorageArrayData(`${localStorageSelectedRecords}`).map((obj) => obj._id))}`
                    : ''
                  }`,
                type: 'export'
              },
              {
                title: 'Step Import',
                api: `${serviceMaster.api}/steps/unknown/import`,
                type: 'import'
              },
              {
                title: 'Consumable Template',
                api: `${serviceMaster.api}/product/unknown/template`,
                type: 'download'
              },
              {
                title: 'Consumable Export',
                api: `${serviceMaster.api}/product/unknown/template?export=true${getLocalStorageArrayData(`${localStorageSelectedRecords}`).length
                    ? `&ids=${JSON.stringify(getLocalStorageArrayData(`${localStorageSelectedRecords}`).map((obj) => obj._id))}`
                    : ''
                  }`,
                type: 'export'
              },
              {
                title: 'Consumable Import',
                api: `${serviceMaster.api}/product/unknown/import`,
                type: 'import'
              }
            ]}
          />
        </Grid>
      </Grid>
      <div className="main-container">
        <div className="header-panel">
          <Grid container className={styles.filter_side_container}>
            <Grid item xs={12} md={6} sm={12} className={isMobile ? styles.mobile_panel : 'd-flex align-items-center gap-1'}>
              {isMobile ? (
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
                    secHeading={['Sort Purchase Order']}
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
                    title={routes?.serviceMaster?.title}
                    filters={filters}
                  />
                </Grid>
              ) : null}
            </Grid>
            <Grid xs={12} sm={12} md={6} container className={styles.filter_side}>
              <Box className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} component="div">
                <Grid style={{ display: 'flex', flex: 1, gap: '5px' }} className={styles.content_box}>
                  <SearchBox
                    onSearch={handleSearch}
                    searchbox={isMobile ? styles.search_box_input : ''}
                    width="242px"
                    size="small"
                    value={search}
                    style={isMobile ? { flex: 1 } : {}}
                  />
                </Grid>
                <Grid style={{ display: 'flex', gap: '5px' }}>
                  {permissions?.serviceMaster?.isCreate && (
                    <Button
                      onClick={() => {
                        setShowManageDialog({ open: true, isClone: false, idToClone: null });
                      }}
                      variant={isMobile && !isTablet ? 'text' : 'contained'}
                      size="small"
                      color="primary"
                      className={isMobile && !isTablet ? 'mobile_button' : styles.add_submit_btn}
                      startIcon={isMobile && !isTablet ? null : <AddOutlined />}
                    >
                      {' '}
                      {isMobile && !isTablet ? <MdAdd size={23} /> : 'Add'}
                    </Button>
                  )}
                  <Button
                    className={isMobile && !isTablet ? 'mobile_button' : styles.action_submit_btn}
                    variant={isMobile && !isTablet ? 'text' : 'outlined'}
                    color="default"
                    size="small"
                    onClick={openActions}
                    aria-controls="action-menu"
                    disabled={[...getLocalStorageArrayData(localStorageSelectedRecords)].length ? false : true}
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
                    {permissions?.serviceMaster?.isDelete && (
                      <MenuItem
                        disabled={[...getLocalStorageArrayData(localStorageSelectedRecords)].length ? false : true}
                        onClick={() => {
                          closeActions();
                          setShowDeleteConfirmBox(true);
                        }}
                      >
                        {[...getLocalStorageArrayData(localStorageSelectedRecords)]?.length
                          ? `Delete (${[...getLocalStorageArrayData(localStorageSelectedRecords)]?.length})`
                          : 'Delete'}
                      </MenuItem>
                    )}
                  </Menu>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </div>
        {columns ? (
          Object.keys(frameWorkComponent).length > 0 ? (
            isMobile && !isTablet ? (
              <CustomSwipableList
                allowSelection={true}
                allowSwipe={true}
                permissions={permissions.serviceMaster}
                primaryField={columns?.find((d) => d.primaryField)}
                onClick={(data) => {
                  history.push(`${routes.serviceMasterDetail.path}/${data._id}`);
                }}
                dataRows={dataRows}
                selectedRecords={getLocalStorageArrayData(`${localStorageSelectedRecords}`)}
                dispatch={dispatch}
                onEdit={(data) => {
                  history.push(`${routes.serviceMasterDetail.path}/${data._id}?openEdit=true`);
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
                chips={[]}
                onCreate={false}
                showClone={true}
                onClone={(data) => {
                  setShowManageDialog({ open: true, isClone: true, idToClone: data._id });
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
                actionWidth={150}
                loading={loading}
                renderedFrom={renderedFrom}
                refreshGrid={fetchData}
                showOnlyShowFilteredRecordSwitch={true}
                showFilters={true}
                resource={sidebarResource.serviceMaster}
              />
            )
          ) : null
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </div>
      {showManageDialog.open && (
        <ManageServiceMaster
          isClone={showManageDialog.isClone}
          serviceMasterId={showManageDialog.idToClone}
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
          message={`Are you sure you want to delete the ${routes.serviceMaster?.title?.toLowerCase()} ${deleteRecord?.serviceMaster || ''} ? `}
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
    </Fragment>
  );
};

export default ServiceMaster;
