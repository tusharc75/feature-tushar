import { Box, Chip, Menu, MenuItem } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import { AddOutlined } from '@material-ui/icons';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import { camelCase } from 'lodash';
import queryString from 'query-string';
import { useContext, useEffect, useReducer, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { MdOutlineFilterAlt, TbArrowsSort } from 'react-icons/all';
import { FaSuitcase } from 'react-icons/fa';
import { GiStockpiles } from 'react-icons/gi';
import { useHistory } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomAgGrid, { intialState, reducer } from 'src/components/AgGridComponents/CustomAgGrid';
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
import CustomSwipableList from 'src/components/SwipableListComponents/CustomSwipableList';
import { bulkAssetCreation, getLocalStorageArrayData, gridLoadingTimeout, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import useColumns, { getFrameworkComponents, getStaticFields, gridFilterParser } from 'src/constants/useColumns';
import styles from '../Leads/Header.module.scss';
import ManageBulkAssetCreation from './ManageBulkAssetCreation';

const BulkAssetCreation = () => {
  const BulkAssetCreationType = [
    {
      key: `My ${routes.bulkAssetCreation.title}`,
      value: 1
    },
    {
      key: `All ${routes.bulkAssetCreation.title}`,
      value: 2
    }
  ];
  let renderedFrom = camelCase(routes.bulkAssetCreation?.title);
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const [showManageBulkAssetCreationDialog, setShowManageBulkAssetCreationDialog] = useState({ open: false, isClone: false, idToClone: null });
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
  const localStorageSelectedRecords = `${renderedFrom}_selected`;
  const [isOpenDialog, setisOpenDialog] = useState(false);
  let { type, referenceId, referenceType }: any = queryString.parse(history.location.search);
  const [selectedType, setSelectedType] = useState(type ? parseInt(type) : 1);

  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();
  const { getColumnData } = useColumns();

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    fetchBulkAssetCreation();
  }, [page, limit, filters, sorting, search, selectedEntity, selectedType, showFilteredRecordsOnly]);

  const fetchGridColumns = () => {
    axiosInstance()
      .get('/field?resource=Bulk Asset Creation')
      .then(({ data: { data } }) => {
        let columns = [];
        let rendererNames = [];
        data.forEach((o) => {
          let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.bulkAssetCreationDetail.path, true);

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

  const fetchBulkAssetCreation = () => {
    dispatch({ type: 'loading', loading: true });

    if (gridApi) {
      gridApi.setRowData([]);
    }

    const queryString = getQueryString();
    axiosInstance()
      .get(`${bulkAssetCreation.api}${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data?.map((u) => {
          let finalObject = prepareDataForGrid(u);
          finalObject['isChecked'] = selectedRecords.some((s) => s._id === u._id);
          finalObject['allowedToEdit'] = [...(u.collaborator ?? []), u.owner].some((d) => d?.optionValue === user?.user?._id);
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

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}`;
    if (selectedType === 1) {
      deepFilter = deepFilter + `&myRecords=1`;
    }
    if (isExport) {
      deepFilter = `?`;
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
      const savedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
      deepFilter = `${deepFilter}&getById=${JSON.stringify(savedRecords.map((m) => m._id))}`;
    }
    return deepFilter;
  };

  const columnState = JSON.parse(localStorage.getItem(renderedFrom));

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
    axiosInstance()
      .put(`${bulkAssetCreation.api}/remove`, { ids: ids })
      .then(() => {
        fetchBulkAssetCreation();
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
      {permissions?.bulkAssetCreation?.isCreate && (
        <HtmlTooltip title="Clone">
          <IconButton
            size="small"
            aria-label="Clone"
            onClick={() => {
              setShowManageBulkAssetCreationDialog({ open: true, isClone: true, idToClone: params.data._id });
            }}
          >
            <FileCopyIcon color="primary" />
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

  const handleBulkAssetCreationType = (filterValues) => {
    setSelectedType(filterValues);
    if (referenceId && referenceType) {
      history.push(`?type=${filterValues}&referenceType=${referenceType}&referenceId=${referenceId}`);
    } else {
      history.push(`?type=${filterValues}`);
    }
  };

  const handleFilter = (event, newFilter) => {
    if (newFilter != null) {
      handleBulkAssetCreationType(BulkAssetCreationType.find((d) => d.key === newFilter).value);
    }
  };

  const updateQueryParams = () => {
    const queryParams = new URLSearchParams(history.location.search)
    queryParams.delete('referenceId')
    queryParams.delete('referenceType')
    referenceId = queryParams.get('referenceId');
    referenceType = queryParams.get('referenceType');
    history.replace({
      search: queryParams.toString(),
    })
    fetchBulkAssetCreation();
  }

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[routes.bulkAssetCreation]} />
        <ImportExportLinks
          permissions={permissions?.bulkAssetCreation}
          module="bulk assets creation "
          api={bulkAssetCreation.api}
          afterImportCompleted={() => {
            fetchBulkAssetCreation();
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
            else fetchBulkAssetCreation();
          }}
          additionalParams={getQueryString(true)}
        />
      </div>
      <div className="main-container">
        <div className="header-panel">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={'d-flex align-items-center gap-1'}>
              <div className="d-flex align-items-center">
                <GiStockpiles size={20} style={{ paddingBottom: '3px' }} className="headerLogo" />
                <span className="listingHeader">{routes.bulkAssetCreation?.title} </span>
              </div>
              {isMobile && !isTablet ? (
                <>
                  <div className="flex flex-wrap items-center gap-1 ml-auto">
                    <IconButton
                      onClick={handleClickOpen}
                      id="demo-customized-button"
                      aria-controls="demo-customized-menu"
                      aria-haspopup="true"
                      aria-expanded={'true'}
                      className={'mobileIconButton secondary'}
                      size="small"
                    >
                      <TbArrowsSort className="rotate-90" size={16} />
                    </IconButton>
                    <MobileSortDialog
                      isOpen={sortOpen}
                      handleClose={handleClickClose}
                      contentPart={null}
                      secHeading={['Sort Purchase Order']}
                      columns={columns}
                      dispatch={dispatch}
                    />

                    <IconButton
                      id="demo-customized-button"
                      aria-controls="demo-customized-menu"
                      aria-haspopup="true"
                      aria-expanded={'true'}
                      className={'mobileIconButton secondary'}
                      size="small"
                      onClick={handleOpen}
                    >
                      <MdOutlineFilterAlt size={16} />
                    </IconButton>

                    <MobileFilterDialog
                      isOpen={isOpenDialog}
                      handleClose={handleFilterClose}
                      contentPart={null}
                      columns={columns}
                      dispatch={dispatch}
                      title={routes?.bulkAssetCreation?.title}
                      filters={filters}
                      resource={sidebarResource.bulkAssetCreation}
                    />
                  </div>
                </>
              ) : (
                <HideWhenOffline>
                  <div className={`align-items-center gap-1 layout-for-mobile `}>
                    {BulkAssetCreationType && (
                      <ToggleButtonGroup
                        size="small"
                        className="ml-2"
                        value={BulkAssetCreationType[selectedType - 1].key}
                        exclusive
                        onChange={handleFilter}
                      >
                        {BulkAssetCreationType.map((k, index) => {
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
              {referenceType && (
                <Chip
                  className="ml-3"
                  color="primary"
                  label={`Rental Job : ${referenceType}`}
                  onDelete={updateQueryParams}
                />
              )}
            </div>
            <div className="flex flex-wrap gap-[8px]  justify-end">
              <SearchBox onChange={handleSearch} className={isMobile ? styles.search_box_input : ''} size="small" value={search} />
              <div className="flex gap-[8px] flex-wrap items-center">
                {permissions?.bulkAssetCreation?.isCreate && (
                  <Button
                    onClick={() => {
                      setShowManageBulkAssetCreationDialog({ open: true, isClone: false, idToClone: null });
                    }}
                    variant={'contained'}
                    size="small"
                    color="primary"
                    className={'no-shadow'}
                    startIcon={<AddOutlined />}
                  >
                    Add
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
                  {permissions?.bulkAssetCreation?.isDelete && (
                    <MenuItem
                      onClick={() => {
                        closeActions();
                        setShowDeleteConfirmBox(true);
                      }}
                    >
                      Delete
                    </MenuItem>
                  )}
                </Menu>
              </div>
            </div>
            <DisplayFiltersForMobile resource={sidebarResource.bulkAssetCreation} />
          </div>
        </div>
        {columns ? (
          Object.keys(frameWorkComponent).length > 0 ? (
            isMobile && !isTablet ? (
              <CustomSwipableList
                allowSelection={true}
                allowSwipe={true}
                permissions={permissions.bulkAssetCreation}
                primaryField={columns?.find((d) => d.primaryField)}
                onClick={(data) => {
                  history.push(`${routes.bulkAssetCreationDetail.path}/${data._id}`);
                }}
                dataRows={dataRows}
                selectedRecords={selectedRecords}
                dispatch={dispatch}
                onEdit={(data) => {
                  history.push(`${routes.bulkAssetCreationDetail.path}/${data._id}`);
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
                    field: 'supplierAccount'
                  }
                ]}
                chips={[
                  {
                    label: 'Status: ',
                    field: 'status'
                  }
                ]}
                onCreate={false}
                showClone={true}
                onClone={(data) => {
                  setShowManageBulkAssetCreationDialog({ open: true, isClone: true, idToClone: data._id });
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
                refreshGrid={fetchBulkAssetCreation}
                showOnlyShowFilteredRecordSwitch={true}
                showFilters={true}
                resource={sidebarResource.bulkAssetCreation}
              />
            )
          ) : null
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </div>
      {showManageBulkAssetCreationDialog.open && (
        <ManageBulkAssetCreation
          isClone={showManageBulkAssetCreationDialog.isClone}
          bulkAssetCreationId={showManageBulkAssetCreationDialog.idToClone}
          onClose={() => setShowManageBulkAssetCreationDialog({ open: false, isClone: false, idToClone: null })}
          onSuccess={() => {
            setShowManageBulkAssetCreationDialog({ open: false, isClone: false, idToClone: null });
            fetchBulkAssetCreation();
          }}
        />
      )}
      {showDeleteConfirmBox && (
        <ConfirmationDialog
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete the ${routes?.bulkAssetCreation?.title?.toLowerCase()} ${deleteRecord?._id ? deleteRecord?.assetNumber : ''
            } ? `}
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
    </section>
  );
};

export default BulkAssetCreation;
