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
import { Box } from '@material-ui/core';
import queryString from 'query-string';
import SearchBox from 'src/components/Helpers/SearchBox';
import styles from '../Leads/Header.module.scss';
import routes from 'src/components/Helpers/Routes';
import CustomAgGrid, { reducer, intialState } from 'src/components/AgGridComponents/CustomAgGrid';
import { transferInventory, isObjectEmpty, gridLoadingTimeout, TRANSFER_INVENTORY_STATUS, sidebarResource } from 'src/constants/helpers';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { useData } from 'src/StateProvider/Provider';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { useHistory } from 'react-router-dom';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import ImportExportLinks from 'src/components/Helpers/ImportExportLinks';
import useColumns, { getStaticFields, getFrameworkComponents } from 'src/constants/useColumns';
import { prepareDataForGrid } from 'src/constants/helpers';
import ManageTransferInventory from './ManageTransferInventory';
import { isMobile, isTablet } from 'react-device-detect';
import CustomSwipableList from 'src/components/SwipableListComponents/CustomSwipableList';
import { FaSuitcase } from 'react-icons/fa';
import { MdAdd, MdFilterList, MdSort, RiFileTransferFill, GiCargoShip, RiFolderTransferFill, SiStatuspage } from 'react-icons/all';
import MobileSortDialog from 'src/components/MobileSortDialog';
import MobileFilterDialog from 'src/components/MobileFilterDialog';
import { camelCase } from 'lodash';
import HideWhenOffline from 'src/components/HideWhenOffline';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';

const TransferInventory = () => {
  const TransferInventoryType = [
    {
      key: `All ${routes.transferInventory.title}`,
      value: 1,
    },
    {
      key: `My ${routes.transferInventory.title}`,
      value: 2,
    },
  ];
  const renderedFrom = camelCase(routes?.transferInventory.title)
  const toastConfig = useContext(CustomToastContext);
  const [showManageTransferInventoryDialog, setShowManageTransferInventoryDialog] = useState({ open: false, isClone: false, idToClone: null });
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
  const localStorageSelectedRecords = `${renderedFrom}_selected`;

  const [fromRental, setFromRental] = useState(history.location?.state?.rental);
  const { type }: any = queryString.parse(history.location.search);
  const [selectedType, setSelectedType] = useState(type ? parseInt(type) : 1);
  const [filter, setFilter] = useState(`All ${routes.transferInventory.title}`);

  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();
  const { getColumnData } = useColumns();

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    fetchTransferInventory();
  }, [page, limit, filters, sorting, search, fromRental, selectedEntity, showFilteredRecordsOnly, selectedType]);

  const fetchGridColumns = () => {
    axiosInstance()
      .get('/field?resource=Transfer Inventory')
      .then(({ data: { data } }) => {
        let columns = [];
        let rendererNames = [];
        data.forEach((o) => {
          let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.transferInventoryDetail.path);
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

  const fetchTransferInventory = () => {
    dispatch({ type: 'loading', loading: true });

    if (gridApi) {
      gridApi.setRowData([]);
    }

    const queryString = getQueryString();
    axiosInstance()
      .get(`${transferInventory.api}${queryString}`)
      .then(({ data }) => {
        let rows = data.data?.map((u) => {
          let finalObject = prepareDataForGrid(u, user);
          finalObject['canDelete'] = (permissions?.transferInventory?.isDelete && u?.status === TRANSFER_INVENTORY_STATUS.new && u?.products?.length === 0)
            && [...(u.collaborator || []), u.owner].some((d) => d?.optionValue === user?.user?._id);
          finalObject['isChecked'] = selectedRecords.some((s) => s._id === u._id);
          finalObject['allowedToEdit'] = permissions?.transferInventory?.isUpdate && [...(u.collaborator || []), u.owner].some((d) => d?.optionValue === user?.user?._id);
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

    let deepFilter = `?page=${page}&limit=${limit}&filterTransferInventory=${selectedType}`;
    if (isExport) {
      deepFilter = `filterTransferInventory=${selectedType}`;
    }
    else {
      deepFilter = `?page=${page}&limit=${limit}&filterTransferInventory=${selectedType}`;
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
    if (showFilteredRecordsOnly) {
      const savedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
      deepFilter = `${deepFilter}&getById=${JSON.stringify(savedRecords.map(m => m._id))}`;
    }
    return deepFilter;
  };

  const columnState = JSON.parse(localStorage.getItem(routes.transferInventory?.title));
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
      .put(`${transferInventory.api}/remove`, { ids: ids })
      .then(() => {
        fetchTransferInventory();
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

  const handleTransferInventoryTypeSel = (filterValues) => {
    setSelectedType(filterValues);
    history.push(`?type=${filterValues}`)
  }

  const handleFilter = (event, newFilter) => {
    if (newFilter != null) {
      setFilter(newFilter);
      handleTransferInventoryTypeSel(TransferInventoryType.find((d) => d.key === newFilter).value);

    }
  };

  const ActionsRenderer = (params) => (
    <>
      {permissions?.transferInventory?.isCreate && (
        <HtmlTooltip title="Clone">
          <IconButton
            size="small"
            aria-label="Clone"
            onClick={() => {
              setShowManageTransferInventoryDialog({ open: true, isClone: true, idToClone: params.data._id });
            }}
          >
            <FileCopyIcon color="primary" />
          </IconButton>
        </HtmlTooltip>
      )}
      {(params?.data?.canDelete) && (
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
          <CustomBreadCrumbs routes={[routes.transferInventory]} />
        </Grid>
        <Grid item md={8} sm={1} xs={2}>
          <ImportExportLinks
            permissions={permissions?.transferInventory}
            module="transfer inventory"
            api={transferInventory.api}
            afterImportCompleted={() => {
              fetchTransferInventory();
            }}
            isExportAllOrSomeFeature={true}
            total={rowCount}
            recordsToExport={selectedRecords.length}
            ids={selectedRecords.length ? selectedRecords.map((obj) => obj._id) : []}
            onExportToExcelSuccess={() => {
              if (gridApi) gridApi.deselectAll();
              else fetchTransferInventory();
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
                <span className="listingHeader">{routes.transferInventory?.title} </span>
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
                    secHeading={['Sort Transfer Inventories']}
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
                    title={routes?.transferInventory?.title}
                    filters={filters}
                  />
                </div>
              ) :
                <HideWhenOffline>
                  <div className={`align-items-center gap-1 layout-for-mobile `}>
                    {TransferInventoryType && (
                      <ToggleButtonGroup size="small" className="ml-2" value={TransferInventoryType[selectedType - 1].key} exclusive onChange={handleFilter}>
                        {TransferInventoryType.map((k, index) => {
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
              }
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
                    {permissions?.transferInventory?.isCreate && (
                      <Button
                        onClick={() => {
                          setShowManageTransferInventoryDialog({ open: true, isClone: false, idToClone: null });
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
                permissions={permissions?.transferInventory}
                primaryField={columns?.find((d) => d.primaryField)}
                onClick={(data) => {
                  history.push(`${routes.transferInventoryDetail.path}/${data._id}`);
                }}
                dataRows={dataRows}
                selectedRecords={selectedRecords}
                dispatch={dispatch}
                onEdit={(data) => {
                  history.push(`${routes.transferInventoryDetail.path}/${data._id}`);
                }}
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
                  setShowManageTransferInventoryDialog({ open: true, isClone: true, idToClone: data._id });
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
                isClientSideGrid={true}
                renderedFrom={renderedFrom}
                refreshGrid={fetchTransferInventory}
                showOnlyShowFilteredRecordSwitch={true}
                showFilters={true}
                resource={sidebarResource.transferInventory}
              />
            )
          ) : null
        ) : (
          <Box p={2} height={500} bgcolor="white">
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </div>
      {showManageTransferInventoryDialog.open && (
        <ManageTransferInventory
          isClone={showManageTransferInventoryDialog.isClone}
          transferInventoryId={showManageTransferInventoryDialog.idToClone}
          onClose={() => setShowManageTransferInventoryDialog({ open: false, isClone: false, idToClone: null })}
          onSuccess={(data) => {
            setShowManageTransferInventoryDialog({ open: false, isClone: false, idToClone: null });
            fetchTransferInventory();
            history.push(`${routes.transferInventoryDetail.path}/${data._id}`);
          }}
        />
      )}
      {showDeleteConfirmBox && (
        <ConfirmationDialog
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete the ${routes?.transferInventory?.title?.toLowerCase()} 
          ${deleteRecord?._id ? deleteRecord?.transferNumber || '' : ''}?`}
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

export default TransferInventory;
