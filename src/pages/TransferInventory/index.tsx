import { Box, Tooltip } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import { camelCase } from 'lodash';
import queryString from 'query-string';
import React, { useContext, useEffect, useReducer, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { CiUser, GiCargoShip, MdOutlineFilterAlt, RiFileTransferFill, RiFolderTransferFill, SiStatuspage, TbArrowsSort } from 'react-icons/all';
import { useHistory } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomAgGrid, { intialState, reducer } from 'src/components/AgGridComponents/CustomAgGrid';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import ImportExportLinks from 'src/components/Helpers/ImportExportLinks';
import routes from 'src/components/Helpers/Routes';
import SearchBox from 'src/components/Helpers/SearchBox';
import HideWhenOffline from 'src/components/HideWhenOffline';
import MobileFilterDialog, { DisplayFiltersForMobile } from 'src/components/MobileFilterDialog';
import MobileSortDialog from 'src/components/MobileSortDialog';
import CustomSwipableList from 'src/components/SwipableListComponents/CustomSwipableList';
import { TRANSFER_INVENTORY_STATUS, gridLoadingTimeout, prepareDataForGrid, sidebarResource, transferInventory } from 'src/constants/helpers';
import styles from '../Leads/Header.module.scss';
import ManageTransferInventory from './ManageTransferInventory';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTableNew';

const TransferInventory = () => {
  const TransferInventoryType = [
    {
      key: `My ${routes.transferInventory.title}`,
      value: 1
    },
    {
      key: `All ${routes.transferInventory.title}`,
      value: 2
    }
  ];
  const renderedFrom = camelCase(routes?.transferInventory.title);
  const toastConfig = useContext(CustomToastContext);
  const [showManageTransferInventoryDialog, setShowManageTransferInventoryDialog] = useState({ open: false, isClone: false, idToClone: null });
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [isDeleting, setDeleting] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [gridApi, setGridApi] = useState(null);
  const [columns, setColumns] = useState(null);
  const [frameWorkComponent, setFrameWorkComponent] = useState({});
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, appendRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } =
    state;
  const [open, setOpen] = React.useState(false);
  const [isOpenDialog, setisOpenDialog] = useState(false);
  const history = useHistory();
  const localStorageSelectedRecords = `${renderedFrom}_selected`;
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
  }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly, selectedType]);

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource.transferInventory}`)
      .then(({ data: { data } }) => {
        let columns = [];
        let rendererNames = [];
        data.forEach((o) => {
          let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.transferInventoryDetail.path, true);
          if (currentColumn !== null) {
            columns = [...columns, currentColumn?.columnData];
          }
        });
        columns = [...columns, ...getStaticFields(), ActionsRenderer];
        setColumns([...columns]);
      });
  };

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 110,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        {permissions?.transferInventory?.isCreate && (
          <Tooltip title="Clone">
            <IconButton
              size="small"
              aria-label="Clone"
              onClick={() => {
                setShowManageTransferInventoryDialog({ open: true, isClone: true, idToClone: row.original._id });
              }}
            >
              <FileCopyIcon color="primary" />
            </IconButton>
          </Tooltip>
        )}

        {row.original?.canDelete ? (
          <Tooltip title="Delete">
            <IconButton
              size="small"
              aria-label="Delete"
              onClick={() => {
                setDeleteRecord(row.original);
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
    )
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
          // finalObject['canDelete'] =
          //   permissions?.transferInventory?.isDelete &&
          //   u?.status === TRANSFER_INVENTORY_STATUS.new &&
          //   u?.products?.length === 0 &&
          //   [...(u.collaborator || []), u.owner].some((d) => d?.optionValue === user?.user?._id);
          finalObject['canDelete'] = permissions?.transferInventory?.isDelete && u?.canDelete;
          finalObject['isChecked'] = selectedRecords.some((s) => s._id === u._id);
          finalObject['allowedToEdit'] =
            permissions?.transferInventory?.isUpdate && [...(u.collaborator || []), u.owner].some((d) => d?.optionValue === user?.user?._id);
          return finalObject;
        });
        data.data = data.data?.map((u, i) => ({
          ...prepareDataForGrid(u, user)
        }));
        if (appendRows) {
          dispatch({
            type: 'initialize',
            data: [...dataRows, ...rows],
            count: data.count
          });
        } else {
          dispatch({
            type: 'initialize',
            data: rows,
            count: data.count
          });
        }
        // dispatch({ type: 'initialize', data: rows, count: data.count });
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
    if (selectedType === 1) {
      deepFilter = deepFilter + `&myRecords=1`;
    }
    if (isExport) {
      deepFilter = `?`;
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
    dispatch({ type: 'setPage', page: 0 });
    setSelectedType(filterValues);
    history.push(`?type=${filterValues}`);
  };

  const handleFilter = (event, newFilter) => {
    if (newFilter != null) {
      setFilter(newFilter);
      handleTransferInventoryTypeSel(TransferInventoryType.find((d) => d.key === newFilter).value);
    }
  };



  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
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

  const toggleInner = TransferInventoryType && (
    <ToggleButtonGroup
      size="small"
      className="toggle-button-layout"
      value={TransferInventoryType[selectedType - 1].key}
      exclusive
      onChange={handleFilter}
    >
      {TransferInventoryType.map((k, index) => {
        return (
          <ToggleButton value={k.key} key={index}>
            {k.key}
          </ToggleButton>
        );
      })}
    </ToggleButtonGroup>
  );

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[routes.transferInventory]} />
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
            fetchTransferInventory();
          }}
          additionalParams={getQueryString(true)}
        />
      </div>
      <div className="main-container">
        <div className="header-panel">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            <div className={'d-flex flex-wrap align-items-center gap-1'}>
              <div className="d-flex align-items-center"></div>
              {isMobile && !isTablet ? (
                <div className="d-flex flex-wrap items-center justify-between w-full gap-2">
                  <div>{toggleInner}</div>
                  <div className="flex flex-wrap items-center gap-1">
                    <IconButton
                      onClick={handleClickOpen}
                      id="demo-customized-button"
                      aria-controls="demo-customized-menu"
                      aria-haspopup="true"
                      // aria-expanded={open ? 'true' : undefined}
                      className={'mobileIconButton secondary'}
                      size="small"
                    >
                      <TbArrowsSort className="rotate-90" size={16} />
                    </IconButton>
                    <MobileSortDialog
                      isOpen={open}
                      handleClose={handleClickClose}
                      contentPart={null}
                      secHeading={['Sort Transfer Inventories']}
                      columns={columns}
                      dispatch={dispatch}
                    />
                    <IconButton
                      id="demo-customized-button"
                      aria-controls="demo-customized-menu"
                      aria-haspopup="true"
                      // aria-expanded={open ? 'true' : undefined}
                      className={'mobileIconButton secondary'}
                      size="small"
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
                      title={routes?.transferInventory?.title}
                      filters={filters}
                      resource={sidebarResource.transferInventory}
                    />
                  </div>
                </div>
              ) : (
                <HideWhenOffline>
                  <div className={`align-items-center gap-1 layout-for-mobile `}>
                    {TransferInventoryType && (
                      <ToggleButtonGroup
                        size="small"
                        className="ml-2"
                        value={TransferInventoryType[selectedType - 1].key}
                        exclusive
                        onChange={handleFilter}
                      >
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
              )}
            </div>
            <div className="flex flex-wrap gap-[8px]  justify-end">
              <SearchBox onChange={handleSearch} className={styles.search_box_input} size="small" value={search} />
              <div className="flex gap-[8px] flex-wrap items-center">
                {permissions?.transferInventory?.isCreate && (
                  <Button
                    onClick={() => {
                      setShowManageTransferInventoryDialog({ open: true, isClone: false, idToClone: null });
                    }}
                    variant={'contained'}
                    size="small"
                    color="primary"
                    className={`no-shadow`}
                    startIcon={<AddIcon />}
                  >
                    Add
                  </Button>
                )}
              </div>
            </div>
            <DisplayFiltersForMobile resource={sidebarResource.transferInventory} />
          </div>
        </div>
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            onSelect={() => { }}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            isClientSideGrid={false}
            refreshGrid={fetchTransferInventory}
            showOnlyShowFilteredRecordSwitch={true}
            showFilters={true}
            resource={sidebarResource.productionOrder}
          />
        ) : (
          <Box p={2} height={500}>
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
    </section>
  );
};

export default TransferInventory;
