import React, { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import AddIcon from '@material-ui/icons/Add';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { GiStockpiles } from 'react-icons/gi';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { Box, Chip, Tooltip } from '@material-ui/core';
import SearchBox from 'src/components/Helpers/SearchBox';
import styles from '../Leads/Header.module.scss';
import routes from 'src/components/Helpers/Routes';
import CustomAgGrid, { reducer, intialState } from 'src/components/AgGridComponents/CustomAgGrid';
import { transferAsset, isObjectEmpty, gridLoadingTimeout, getLocalStorageArrayData, sidebarResource } from 'src/constants/helpers';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { useData } from 'src/StateProvider/Provider';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { useHistory } from 'react-router-dom';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import ImportExportLinks from 'src/components/Helpers/ImportExportLinks';
import useColumns, { getStaticFields, getFrameworkComponents } from 'src/constants/useColumns';
import { prepareDataForGrid } from 'src/constants/helpers';
import ManageTransferAsset from './ManageTransferAsset';
import { isMobile, isTablet } from 'react-device-detect';
import CustomSwipableList from 'src/components/SwipableListComponents/CustomSwipableList';
import { FaSuitcase } from 'react-icons/fa';
import { MdAdd, MdFilterList, MdSort, RiFileTransferFill, GiCargoShip, RiFolderTransferFill, SiStatuspage } from 'react-icons/all';
import MobileSortDialog from 'src/components/MobileSortDialog';
import MobileFilterDialog from 'src/components/MobileFilterDialog';
import { camelCase } from 'lodash';
import queryString from 'query-string';
import HideWhenOffline from 'src/components/HideWhenOffline';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';

const TransferAsset = () => {
  const TransferAssetType = [
    {
      key: `All ${routes.transferAsset.title}`,
      value: 1
    },
    {
      key: `My ${routes.transferAsset.title}`,
      value: 2
    }
  ];
  let renderedFrom = camelCase(routes?.transferAsset.title);
  const toastConfig = useContext(CustomToastContext);
  const [showManageTransferAssetDialog, setShowManageTransferAssetDialog] = useState({ open: false, isClone: false, idToClone: null });
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [isDeleting, setDeleting] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [gridApi, setGridApi] = useState(null);
  const [columns, setColumns] = useState([]);
  const [frameWorkComponent, setFrameWorkComponent] = useState({});
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const [open, setOpen] = React.useState(false);
  const [isOpenDialog, setisOpenDialog] = useState(false);
  const history = useHistory();
  const { type }: any = queryString.parse(history.location.search);
  const [selectedType, setSelectedType] = useState(type ? parseInt(type) : 1);
  const [filter, setFilter] = useState(`All ${routes.transferAsset.title}`);
  const [fromRental, setFromRental] = useState(history.location?.state?.rental);
  const localStorageSelectedRecords = `${renderedFrom}_selected`;

  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();
  const { getColumnData } = useColumns();

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    fetchTransferAsset();
  }, [page, limit, filters, sorting, search, fromRental, selectedEntity, selectedType, showFilteredRecordsOnly]);

  const fetchGridColumns = () => {
    axiosInstance()
      .get('/field?resource=Transfer Asset')
      .then(({ data: { data } }) => {
        let columns = [];
        let rendererNames = [];
        data.forEach((o) => {
          let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.transferAssetDetail.path);
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

  const fetchTransferAsset = () => {
    dispatch({ type: 'loading', loading: true });

    if (gridApi) {
      gridApi.setRowData([]);
    }

    const queryString = getQueryString();
    axiosInstance()
      .get(`${transferAsset.api}${queryString}`)
      .then(({ data }) => {
        let rows = data.data?.map((u) => {
          let finalObject = prepareDataForGrid(u, user);
          finalObject['canDelete'] = false;
          finalObject['isChecked'] = selectedRecords.some((s) => s._id === u._id);
          finalObject['allowedToEdit'] = permissions?.transferAsset?.isUpdate;
          return finalObject;
        });

        data.data = data.data?.map((u, i) => ({
          ...prepareDataForGrid(u, user)
        }));

        dispatch({ type: 'initialize', data: rows, count: data.count });
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
    let deepFilter = `?page=${page}&limit=${limit}`;
    if (selectedType === 2) {
      deepFilter = deepFilter + `&myRecords=1`;
    }
    if (isExport) {
      deepFilter = `?`;
    }

    if (fromRental) {
      let filterById = [];
      filterById.push({ field: 'rentalJob', term: fromRental?._id });
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterById)}`;
    }

    if (showFilteredRecordsOnly) {
      const savedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
      deepFilter = `${deepFilter}&getById=${JSON.stringify(savedRecords.map((m) => m._id))}`;
    }

    if (!isObjectEmpty(filters)) {
      const updatedFilters = [];
      Object.keys(filters).forEach((field) => {
        updatedFilters.push({
          field: replaceFieldName(field),
          term: filters[field].filter
        });
      });
      deepFilter = `${deepFilter}&deepFilter=${encodeURI(JSON.stringify(updatedFilters))}&filterType=and`;
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }

    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURI(search)}`;
    }

    return deepFilter;
  };

  const columnState = JSON.parse(localStorage.getItem(routes.transferAsset?.title));
  if (columnState) {
    columns.map((item) => {
      columnState.map((d) => {
        if (d.colId == item.field) {
          item.show = !d.hide;
        }
      });
    });
  }

  const handleDelete = () => {
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords.map((d) => d._id);
    }
    setDeleting(true);
    axiosInstance()
      .put(`${transferAsset.api}/remove`, { ids: ids })
      .then(() => {
        fetchTransferAsset();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
        setAnchorEl(null);
        setDeleting(false);
      })
      .catch((error) => {
        setDeleting(false);
        toastConfig.setToastConfig(error);
      });
  };
  const handleTransferAssetTypeSel = (filterValues) => {
    setSelectedType(filterValues);
    history.push(`?type=${filterValues}`);
  };

  const handleFilter = (event, newFilter) => {
    if (newFilter != null) {
      setFilter(newFilter);
      handleTransferAssetTypeSel(TransferAssetType.find((d) => d.key === newFilter).value);
    }
  };

  const ActionsRenderer = (params) => (
    <>
      {permissions?.transferAsset?.isCreate && (
        <HtmlTooltip title="Clone">
          <IconButton
            size="small"
            aria-label="Clone"
            onClick={() => {
              setShowManageTransferAssetDialog({ open: true, isClone: true, idToClone: params.data._id });
            }}
          >
            <FileCopyIcon color="primary" />
          </IconButton>
        </HtmlTooltip>
      )}
      {permissions?.transferAsset?.isDelete && params?.data.status === 'New' ? (
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
      ) : (
        <Tooltip title="Don't have the permissions to Delete">
          <IconButton size="small" aria-label="Delete" className="cursor-stop">
            <DeleteIcon color="disabled" />
          </IconButton>
        </Tooltip>
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

  const handleOpen = () => {
    setisOpenDialog(true);
  };

  const handleClose = () => {
    setisOpenDialog(false);
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClickClose = () => {
    setOpen(false);
  };

  return (
    <Fragment>
      <Grid container className="headerbox">
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs routes={[routes.transferAsset]} />
        </Grid>
        <Grid item md={8} sm={1} xs={2}>
          <ImportExportLinks
            permissions={permissions?.transferAsset}
            module="purchase order"
            api={transferAsset.api}
            afterImportCompleted={() => {
              fetchTransferAsset();
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
              else fetchTransferAsset();
            }}
            additionalParams={getQueryString(true)}
          />
        </Grid>
      </Grid>
      <div className="main-container">
        <div className="header-panel">
          <Grid container className={styles.filter_side_container}>
            <Grid item xs={12} md={6} sm={12} className={isMobile ? styles.mobile_panel : 'd-flex align-items-center gap-1'}>
              <div className="d-flex align-items-center">
                <GiStockpiles size={20} style={{ paddingBottom: '3px' }} className="headerLogo" />
                <span className="listingHeader">{routes.transferAsset?.title} </span>
              </div>
              {isMobile && !isTablet ? (
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
                    secHeading={['Sort Transfer Assests']}
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
                    title={routes?.transferAsset?.title}
                    filters={filters}
                  />
                </div>
              ) : (
                <HideWhenOffline>
                  <div className={`align-items-center gap-1 layout-for-mobile `}>
                    {TransferAssetType && (
                      <ToggleButtonGroup
                        size="small"
                        className="ml-2"
                        value={TransferAssetType[selectedType - 1].key}
                        exclusive
                        onChange={handleFilter}
                      >
                        {TransferAssetType.map((k, index) => {
                          return (
                            <ToggleButton value={k.key} key={index}>
                              {k.key}
                            </ToggleButton>
                          );
                        })}
                      </ToggleButtonGroup>
                    )}
                  </div>
                </HideWhenOffline>
              )}
              {fromRental && (
                <Chip
                  className="ml-3"
                  color="primary"
                  label={`Rental Job : ${fromRental?.rentalJobName}`}
                  onDelete={() => {
                    setFromRental(null);
                  }}
                />
              )}
            </Grid>
            <Grid xs={12} sm={12} md={6} container className={styles.filter_side}>
              <Box className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} component="div">
                <Grid style={{ display: 'flex', flex: 1, gap: '5px' }} className={isMobile ? styles.content_box : ''}>
                  <SearchBox
                    onSearch={handleSearch}
                    searchbox={styles.search_box_input}
                    width="242px"
                    style={isMobile && !isTablet ? { flex: 1 } : {}}
                    size="small"
                    value={search}
                  />
                  <Grid style={{ display: 'flex', gap: '5px' }}>
                    {permissions?.transferAsset?.isCreate && (
                      <Button
                        onClick={() => {
                          setShowManageTransferAssetDialog({ open: true, isClone: false, idToClone: null });
                        }}
                        variant={isMobile && !isTablet ? 'text' : 'contained'}
                        size="small"
                        color="primary"
                        className={isMobile && !isTablet ? 'mobile_button' : styles.add_submit_btn}
                        startIcon={isMobile && !isTablet ? null : <AddIcon />}
                      >
                        {isMobile && !isTablet ? <MdAdd size={23} /> : 'Add'}
                      </Button>
                    )}
                  </Grid>

                  {/* <HtmlTooltip title={selectedRecords.length > 0 ? '' : 'Please select some records'}>
                    <span>
                      <Button
                        className={isMobile ? 'mobile_button' : styles.action_submit_btn}
                        variant={isMobile ? 'text' : 'contained'}
                        color="default"
                        size="small"
                        onClick={openActions}
                        disabled={selectedRecords.length === 0 || selectedRecords.filter((t: any) => t.status !== 'New').length > 0}
                        aria-controls="action-menu"
                        endIcon={<ExpandMore />}
                      >
                        {isMobile ? '' : 'Actions'}
                      </Button>
                    </span>
                  </HtmlTooltip>
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
                    {permissions?.transferAsset?.isDelete && (
                      <MenuItem
                        onClick={() => {
                          closeActions();
                          setShowDeleteConfirmBox(true);
                        }}
                      >
                        Delete
                      </MenuItem>
                    )}
                  </Menu> */}
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
                permissions={permissions?.transferAsset}
                primaryField={columns?.find((d) => d.primaryField)}
                onClick={(data) => {
                  history.push(`${routes.transferAssetDetail.path}/${data._id}`);
                }}
                dataRows={dataRows}
                selectedRecords={selectedRecords}
                dispatch={dispatch}
                onEdit={() => {}}
                extraParamsToCheckDelete={true}
                onDelete={(data) => {
                  setDeleteRecord(data);
                  setShowDeleteConfirmBox(true);
                }}
                rowCount={rowCount}
                page={page}
                loading={loading}
                chips={[
                  {
                    icons: <RiFileTransferFill />,
                    label: 'Transfer From Plant: ',
                    field: 'transferFromPlant'
                  },
                  {
                    icons: <RiFolderTransferFill />,
                    label: 'Transfer To Plant: ',
                    field: 'transferToPlant'
                  },
                  {
                    icons: <GiCargoShip />,
                    label: 'Plant Ship To: ',
                    field: 'plantShipTo'
                  },
                  {
                    icon: <SiStatuspage />,
                    label: 'Status: ',
                    field: 'status: '
                  }
                ]}
                additionalDetails={[
                  {
                    icon: <FaSuitcase size={18} />,
                    field: 'transferType'
                  }
                ]}
                owerCollaboratorInitialsOrImages="owerCollaboratorInitialsOrImages"
                onCreate={false}
                showClone={true}
                onClone={(data) => {
                  setShowManageTransferAssetDialog({ open: true, isClone: true, idToClone: data._id });
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
                refreshGrid={fetchTransferAsset}
                showOnlyShowFilteredRecordSwitch={true}
                showFilters={true}
                resource={sidebarResource.transferAsset}
              />
            )
          ) : null
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </div>
      {showManageTransferAssetDialog.open && (
        <ManageTransferAsset
          isClone={showManageTransferAssetDialog.isClone}
          transferAssetId={showManageTransferAssetDialog.idToClone}
          onClose={() => setShowManageTransferAssetDialog({ open: false, isClone: false, idToClone: null })}
          onSuccess={(data) => {
            setShowManageTransferAssetDialog({ open: false, isClone: false, idToClone: null });
            fetchTransferAsset();
            history.push(`${routes.transferAssetDetail.path}/${data._id}`);
          }}
        />
      )}
      {showDeleteConfirmBox && (
        <ConfirmationDialog
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete the ${routes?.transferAsset?.title?.toLowerCase()} ${
            deleteRecord?._id ? deleteRecord?.transferAssetNumber : ''
          } ? `}
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          onOk={handleDelete}
          okBtnLoading={isDeleting}
        />
      )}
    </Fragment>
  );
};

export default TransferAsset;
