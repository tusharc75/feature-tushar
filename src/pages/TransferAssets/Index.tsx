import { Box, Chip, Tooltip } from '@material-ui/core';
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
import { MdOutlineFilterAlt, TbArrowsSort } from 'react-icons/all';
import { useHistory } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import { intialState, reducer } from 'src/components/AgGridComponents/CustomAgGrid';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import ImportExportLinks from 'src/components/Helpers/ImportExportLinks';
import routes from 'src/components/Helpers/Routes';
import SearchBox from 'src/components/Helpers/SearchBox';
import HideWhenOffline from 'src/components/HideWhenOffline';
import MobileFilterDialog, { DisplayFiltersForMobile } from 'src/components/MobileFilterDialog';
import MobileSortDialog from 'src/components/MobileSortDialog';
import { gridLoadingTimeout, prepareDataForGrid, sidebarResource, transferAsset } from 'src/constants/helpers';
import styles from '../Leads/Header.module.scss';
import ManageTransferAsset from './ManageTransferAsset';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns } from 'src/components/CustomReactTableNew';

const TransferAsset = () => {
  const TransferAssetType = [
    {
      key: `My ${routes.transferAsset.title}`,
      value: 1
    },
    {
      key: `All ${routes.transferAsset.title}`,
      value: 2
    }
  ];
  let renderedFrom = camelCase(routes?.transferAsset.title);
  const toastConfig = useContext(CustomToastContext);
  const [showManageTransferAssetDialog, setShowManageTransferAssetDialog] = useState({ open: false, isClone: false, idToClone: null });
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [isDeleting, setDeleting] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [columns, setColumns] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, appendRows, rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } =
    state;
  const [open, setOpen] = React.useState(false);
  const [isOpenDialog, setisOpenDialog] = useState(false);
  const history = useHistory();
  let { type, referenceId, referenceType }: any = queryString.parse(history.location.search);
  const [selectedType, setSelectedType] = useState(type ? parseInt(type) : 1);
  const [filter, setFilter] = useState(`All ${routes.transferAsset.title}`);

  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();
  const { getColumnData } = useColumns();

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    fetchTransferAsset();
  }, [page, limit, filters, sorting, search, selectedEntity, selectedType, showFilteredRecordsOnly]);

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource.transferAsset}`)
      .then(({ data: { data } }) => {
        let columns = [];
        data.forEach((o) => {
          let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.transferAssetDetail.path, true);
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
        {permissions?.transferAsset?.isCreate && (
          <HtmlTooltip title="Clone">
            <IconButton
              size="small"
              aria-label="Clone"
              onClick={() => {
                setShowManageTransferAssetDialog({ open: true, isClone: true, idToClone: row.original._id });
              }}
            >
              <FileCopyIcon color="primary" />
            </IconButton>
          </HtmlTooltip>
        )}
        {permissions?.transferAsset?.isDelete && row.original.status === 'New' ? (
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

  const fetchTransferAsset = () => {
    dispatch({ type: 'loading', loading: true });

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

    if (isExport) {
      deepFilter = `?`;
    }

    if (selectedType === 1) {
      deepFilter = deepFilter + `&myRecords=1`;
    }

    const { filterByIds, deepFilters } = gridFilterParser(filters);

    if (referenceId) {
      filterByIds.push({ field: 'rentalJob', term: referenceId });
    }

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
      deepFilter = `${deepFilter}&getById=${JSON.stringify(selectedRecords.map((m) => m._id))}`;
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
        setDeleting(false);
      })
      .catch((error) => {
        setDeleting(false);
        toastConfig.setToastConfig(error);
      });
  };
  const handleTransferAssetTypeSel = (filterValues) => {
    dispatch({ type: 'setPage', page: 0 });
    setSelectedType(filterValues);
    if (referenceId && referenceType) {
      history.push(`?type=${filterValues}&referenceType=${referenceType}&referenceId=${referenceId}`);
    } else {
      history.push(`?type=${filterValues}`);
    }
  };

  const handleFilter = (event, newFilter) => {
    if (newFilter != null) {
      dispatch({ type: 'setPage', page: 0 });
      setFilter(newFilter);
      handleTransferAssetTypeSel(TransferAssetType.find((d) => d.key === newFilter).value);
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

  const updateQueryParams = () => {
    const queryParams = new URLSearchParams(history.location.search);
    queryParams.delete('referenceId');
    queryParams.delete('referenceType');
    referenceId = queryParams.get('referenceId');
    referenceType = queryParams.get('referenceType');
    history.replace({
      search: queryParams.toString()
    });
    fetchTransferAsset();
  };

  const toggleInner = TransferAssetType && (
    <ToggleButtonGroup size="small" value={TransferAssetType[selectedType - 1].key} exclusive onChange={handleFilter}>
      {TransferAssetType.map((k, index) => {
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
        <CustomBreadCrumbs routes={[routes.transferAsset]} />
        <ImportExportLinks
          permissions={permissions?.transferAsset}
          module="purchase order"
          api={transferAsset.api}
          afterImportCompleted={() => {
            fetchTransferAsset();
          }}
          isExportAllOrSomeFeature={true}
          total={rowCount}
          recordsToExport={selectedRecords?.length}
          ids={selectedRecords?.map((obj) => obj._id)}
          onExportToExcelSuccess={() => {
            fetchTransferAsset();
          }}
          additionalParams={getQueryString(true)}
        />
      </div>
      <div className="main-container">
        <div className="header-panel">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={'d-flex align-items-center gap-1 w-full'}>
              {isMobile && !isTablet ? (
                <div className="d-flex flex-wrap items-center justify-between w-full gap-2">
                  <div>
                    <HideWhenOffline>{toggleInner}</HideWhenOffline>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 justify-end">
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
                      secHeading={['Sort Transfer Assests']}
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
                      title={routes?.transferAsset?.title}
                      filters={filters}
                      resource={sidebarResource.transferAsset}
                    />
                  </div>
                </div>
              ) : null}
              {!isMobile && <HideWhenOffline>{toggleInner}</HideWhenOffline>}
              {referenceType && <Chip className="ml-3" color="primary" label={`Rental Job : ${referenceType}`} onDelete={updateQueryParams} />}
            </div>
            <div className="flex flex-wrap gap-[8px]  justify-end">
              <SearchBox onChange={handleSearch} className={styles.search_box_input} size="small" value={search} />
              <div className="flex gap-[8px] flex-wrap items-center">
                {permissions?.transferAsset?.isCreate && (
                  <Button
                    onClick={() => {
                      setShowManageTransferAssetDialog({ open: true, isClone: false, idToClone: null });
                    }}
                    variant={'contained'}
                    size="small"
                    color="primary"
                    className={'no-shadow'}
                    startIcon={<AddIcon />}
                  >
                    Add
                  </Button>
                )}
              </div>
            </div>
            <DisplayFiltersForMobile resource={sidebarResource.transferAsset} />
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
            refreshGrid={fetchTransferAsset}
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
          message={`Are you sure you want to delete the ${routes?.transferAsset?.title?.toLowerCase()} ${deleteRecord?._id ? deleteRecord?.transferAssetNumber : ''
            } ? `}
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

export default TransferAsset;
