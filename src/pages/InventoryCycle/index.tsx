import React, { useState, useContext, Fragment, useEffect, useReducer } from 'react';
import { Grid, Box, Button, Menu, MenuItem, IconButton, Tooltip } from '@material-ui/core';
import { GiCycle } from 'react-icons/all';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import CustomContainer from '../../components/CustomContainer';
import styles from '../Leads/Header.module.scss';
import { isMobile, isTablet } from 'react-device-detect';
import SearchBox from '../../components/Helpers/SearchBox';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import axiosInstance from '../../axios/axiosInstance';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import { MdAdd } from 'react-icons/all';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import useColumns, { getStaticFields, getFrameworkComponents, checkStaticField } from '../../constants/useColumns';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { useData } from '../../StateProvider/Provider';
import CustomAgGrid, { intialState, reducer } from '../../components/AgGridComponents/CustomAgGrid';
import { CheckboxRenderer } from '../../components/AgGridComponents/CustomAgGridCellRenderers';
import DeleteIcon from '@material-ui/icons/Delete';
import HideWhenOffline from '../../components/HideWhenOffline';
import { CustomOfflineContext } from '../../StateProvider/OfflineContext/OfflineContext';
import { camelCase } from 'lodash';
import { prepareDataForGrid } from 'src/constants/helpers';
import { isObjectEmpty, gridLoadingTimeout } from '../../constants/helpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { Link } from 'react-router-dom';
import CreateInventoryCycle from './CreateInventoryCycle';

const InventoryCycle = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const { getColumnData } = useColumns();
  const toastConfig = useContext(CustomToastContext);
  const [gridApi, setGridApi] = useState(null);
  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [frameWorkComponent, setFrameWorkComponent] = useState({});
  const [columns, setColumns] = useState([]);
  const [isAllChecked, setIsAllChecked] = useState(false);
  const [clonedData, setClonedData] = useState([]);
  const renderedFrom = camelCase(`${routes.inventoryCycle.title}`);
  const [open, setOpen] = useState({ open: false, isClone: false });

  const { isOffline, isSynch } = useContext(CustomOfflineContext);
  const [inventoryCycleId, setInventoryCycleId] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } =
    state;
  const [deleteRecord, setDeleteRecord] = useState(null);
  const localStorageSelectedRecords = `${renderedFrom}_selected`;
  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    fetchInventoryCycle();
  }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly]);

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const handleDelete = () => {
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords.map((m) => m._id);
    }
    axiosInstance()
      .put(`/inventory-cycle/remove`, { ids: ids })
      .then(() => {
        fetchInventoryCycle();
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

  const fetchGridColumns = () => {
    axiosInstance()
      .get('/field?resource=Inventory Cycle')
      .then(({ data: { data } }) => {
        let columns = [];
        let rendererNames = [];
        data.forEach((o) => {
          if (o?.fieldData?.primaryField === true) {
            columns = [
              ...columns,
              { field: o?.fieldData?.fieldName, headerName: o?.fieldData?.fieldLabel, show: true, disabled: false, cellRenderer: 'nameRenderer' }
            ];
          } else {
            let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.inventoryCycle.path);

            if (currentColumn !== null) {
              columns = [...columns, currentColumn?.columnData];
              if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
                rendererNames.push(currentColumn?.rendererName);
              }
            }
          }
        });
        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
        tempFrameworkComponent = {
          ...tempFrameworkComponent,
          nameRenderer: NameRenderer,
          actionsRenderer: ActionsRenderer
        };
        setFrameWorkComponent({ ...tempFrameworkComponent });
        // columns = [...columns, ...getStaticFields()];
        setColumns([...columns]);
      });
  };
  const NameRenderer = (params) => (
    <Link className="link" title={params.value} to={`${routes.inventoryCycleDetail.path}/${params.data._id}`}>
      {params.value}
    </Link>
  );

  const ActionsRenderer = (params) => (
    <Fragment>
      <Tooltip title="Clone">
        <IconButton
          size="small"
          aria-label="Clone"
          onClick={() => {
            setInventoryCycleId(params.data.id);
            setOpen({ open: true, isClone: true });
          }}
        >
          <FileCopyIcon fontSize="small" color="primary" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Delete">
        <IconButton
          size="small"
          aria-label="Delete"
          onClick={() => {
            setDeleteRecord(params.data);
            setShowDeleteConfirmBox(true);
            // setSingleRentalManagementDelete({
            //   show: true,
            //   id: params.data._id,
            //   rentalJobName: `${params.data.rentalJobName}`,
            // })
          }}
        >
          <DeleteIcon fontSize="small" color="error" />
        </IconButton>
      </Tooltip>
    </Fragment>
  );

  const replaceFieldName = (field) => {
    switch (field) {
      case 'createdBy':
        return 'createdBy.user.concatedName';

      case 'updatedBy':
        return 'updatedBy.user.concatedName';

      default:
        return field;
    }
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = !isExport ? `?page=${page}&limit=${limit}` : '?';
    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`;
    }

    if (!isObjectEmpty(filters)) {
      const updatedFilters = [];

      Object.keys(filters).forEach((field) => {
        updatedFilters.push({
          field: replaceFieldName(field),
          term: filters[field].filter
        });
      });
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(updatedFilters))}&filterType=and`;
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${replaceFieldName(sorting[0].colId)}&orderBy=${sorting[0].sort}`;
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

  const fetchInventoryCycle = () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    if (gridApi) {
      gridApi.setRowData([]);
    }
    axiosInstance()
      .get(`/inventory-cycle${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data.map((u: any) => {
          let finalObject = prepareDataForGrid(u);
          finalObject['canDelete'] = permissions?.inventoryCycle?.isDelete;
          finalObject['isChecked'] = selectedRecords.some((s) => s._id === u._id);
          finalObject['allowedToEdit'] = permissions?.inventoryCycle?.isUpdate;
          return {
            ...finalObject
          };
        });
        setIsAllChecked(false);
        setClonedData(data);
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

        if (gridApi) {
          try {
            let oldSelectedRecords = localStorage.getItem(localStorageSelectedRecords)
              ? JSON.parse(localStorage.getItem(localStorageSelectedRecords))
              : [];
            if (oldSelectedRecords.length > 0) {
              gridApi.forEachNode(function (node) {
                node.setSelected(oldSelectedRecords.some((o) => o === node.data._id));
              });
            }
          } catch (ex) {
            console.error('Error in getting selected records from local storage');
          }
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

  return (
    <>
      <Fragment>
        <Grid container className="headerbox">
          <Grid item md={4} sm={11} xs={10}>
            <CustomBreadCrumbs routes={[routes.inventoryCycle]} />
          </Grid>
          <Grid item md={8} sm={1} xs={2}>
            <Grid container direction="row">
              <Grid item xs={12} sm={12}>
                <Grid container justify="flex-end">
                  <ImportExportLinks
                    permissions={permissions?.inventoryCycle}
                    module="inventoryCycles"
                    api={'/inventory-cycle'}
                    afterImportCompleted={() => {
                      fetchInventoryCycle();
                    }}
                    isExportAllOrSomeFeature={true}
                    total={rowCount}
                    recordsToExport={selectedRecords.length}
                    ids={selectedRecords.length ? selectedRecords.map((obj) => obj._id) : []}
                    onExportToExcelSuccess={() => {
                      if (gridApi) gridApi.deselectAll();
                      else fetchInventoryCycle();
                    }}
                    additionalParams={getQueryString(true)}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        <CustomContainer>
          <div className="header-panel">
            <Grid container className={styles.filter_side_container}>
              <Grid item xs={12} md={6} sm={12} className={isMobile ? styles.mobile_panel : 'd-flex align-items-center gap-1'}>
                <div className="d-flex align-items-center">
                  <GiCycle size={20} style={{ paddingBottom: '3px' }} />
                  <span className="listingHeader">{routes.inventoryCycle.title}</span>
                </div>
              </Grid>

              <Grid md={6} sm={12} xs={12} container className={styles.filter_side}>
                <Box className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} component="div">
                  <Grid style={{ width: '100%', display: 'flex' }}>
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
                    <Button
                      className={isMobile && !isTablet ? 'mobile_button' : styles.add_submit_btn}
                      onClick={() => {
                        // setProductCategoryId(null);
                        setInventoryCycleId(null);
                        setOpen({ open: true, isClone: false });
                      }}
                      variant={isMobile && !isTablet ? 'text' : 'contained'}
                      size="small"
                      color="primary"
                      startIcon={isMobile && !isTablet ? null : <AddOutlined />}
                    >
                      {isMobile && !isTablet ? <MdAdd size={23} /> : 'Add'}
                    </Button>
                    <Button
                      variant={isMobile && !isTablet ? 'text' : 'contained'}
                      color="default"
                      size="small"
                      onClick={openActions}
                      disabled={selectedRecords.length ? false : true}
                      aria-controls="action-menu"
                      className={isMobile && !isTablet ? 'mobile_button' : styles.action_submit_btn}
                    >
                      {isMobile && !isTablet ? '' : 'Actions'} <ExpandMore />
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
                        // disabled={!permissions?.inventoryCycle.isDelete}
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
          {Object.keys(frameWorkComponent).length > 0 && (
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
              refreshGrid={fetchInventoryCycle}
              showOnlyShowFilteredRecordSwitch={true}
            />
          )}

          {open?.open && (
            <CreateInventoryCycle
              isUpdateDisabled={false}
              inventoryCycleId={inventoryCycleId}
              isClone={open?.isClone}
              onClose={() => setOpen({ open: false, isClone: false })}
              onSuccess={() => {
                setOpen({ open: false, isClone: false });
                fetchInventoryCycle();
              }}
            />
          )}

          {showDeleteConfirmBox && (
            <ConfirmationDialog
              open={showDeleteConfirmBox}
              message={`Are you sure you want to delete Inventory Cycle  ${deleteRecord?._id ? deleteRecord?.cycleCode : ''}?`}
              onClose={() => {
                setDeleteRecord(null);
                setShowDeleteConfirmBox(false);
              }}
              onOk={handleDelete}
            />
          )}
        </CustomContainer>
      </Fragment>
    </>
  );
};

export default InventoryCycle;
