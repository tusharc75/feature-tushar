import { Box, Menu, MenuItem } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { camelCase } from 'lodash';
import { useContext, useEffect, useReducer, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { MdOutlineFilterAlt, TbArrowsSort } from 'react-icons/all';
import { GiStockpiles } from 'react-icons/gi';
import { useHistory } from 'react-router-dom';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomAgGrid, { intialState, reducer } from '../../components/AgGridComponents/CustomAgGrid';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import HtmlTooltip from '../../components/CustomTooltipTitle';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import routes from '../../components/Helpers/Routes';
import SearchBox from '../../components/Helpers/SearchBox';
import MobileFilterDialog from '../../components/MobileFilterDialog';
import MobileSortDialog from '../../components/MobileSortDialog';
import CustomSwipableList from '../../components/SwipableListComponents/CustomSwipableList';
import { getLocalStorageArrayData, gridLoadingTimeout, prepareDataForGrid, removeLocalStorage, sidebarResource } from '../../constants/helpers';
import useColumns, { getFrameworkComponents, getStaticFields, gridFilterParser } from '../../constants/useColumns';
import styles from '../Leads/Header.module.scss';
import ManageWellNumber from './ManageWellNumber';

const WellNumber = () => {
  let renderedFrom = camelCase(routes.wellNumber?.title);
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
    state: { user, permissions, selectedEntity }
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
      .get(`/field?resource=${sidebarResource.wellNumber}`)
      .then(({ data: { data } }) => {
        let columns = [];
        let rendererNames = [];
        data.forEach((o) => {
          let currentColumn = getColumnData(routes.wellNumber?.title, o?.fieldData, routes.wellNumberDetail.path, true);
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
      .get(`${routes.wellNumber.path}${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data?.map((u) => {
          let finalObject = prepareDataForGrid(u);
          finalObject['isChecked'] = getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.some((s) => s._id === u._id);
          finalObject['allowedToEdit'] = permissions?.wellNumber?.isUpdate;
          finalObject['canDelete'] = permissions?.wellNumber?.isDelete;
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

  const handleDelete = () => {
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.map((d) => d._id);
    }
    axiosInstance()
      .put(`${routes.wellNumber.path}/remove`, { ids: ids })
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
      {permissions?.wellNumber?.isCreate && (
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
      {permissions?.wellNumber?.isDelete && (
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
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[routes.wellNumber]} />
        <ImportExportLinks
          permissions={permissions?.wellNumber}
          module="wellNumber"
          api={'well-number'}
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
        />
      </div>
      <div className="main-container">
        <div className="header-panel">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={'d-flex align-items-center gap-1'}>
              <div className="d-flex align-items-center">
                <GiStockpiles size={20} style={{ paddingBottom: '3px' }} className="headerLogo" />
                <span className="listingHeader">{routes.wellNumber?.title} </span>
              </div>
              {isMobile ? (
                <div className="d-flex flex-wrap items-center justify-between w-full">
                  <div></div>

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
                      secHeading={['Sort Well Number']}
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
                      title={routes?.wellNumber?.title}
                      filters={filters}
                    />
                  </div>
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-[8px]  justify-end">
              <SearchBox onChange={handleSearch} className={isMobile ? styles.search_box_input : ''} size="small" value={search} />
              <div className="flex gap-[8px] flex-wrap items-center">
                {permissions?.wellNumber?.isCreate && (
                  <Button
                    onClick={() => {
                      setShowManageDialog({ open: true, isClone: false, idToClone: null });
                    }}
                    variant={'contained'}
                    size="small"
                    color="primary"
                    className={`no-shadow`}
                    startIcon={<AddOutlined />}
                  >
                    Add
                  </Button>
                )}
                {permissions?.wellNumber?.isDelete && (
                  <>
                    <Button
                      variant={'outlined'}
                      color="default"
                      size="small"
                      onClick={openActions}
                      disabled={selectedRecords.length ? false : true}
                      aria-controls="action-menu"
                      className={`new-dropdown-v1`}
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
                      <MenuItem
                        onClick={() => {
                          closeActions();
                          if (selectedRecords.length === 1) {
                            setDeleteRecord(selectedRecords[0]);
                          }
                          setShowDeleteConfirmBox(true);
                        }}
                      >
                        Delete
                      </MenuItem>
                    </Menu>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        {columns ? (
          Object.keys(frameWorkComponent).length > 0 ? (
            isMobile && !isTablet ? (
              <CustomSwipableList
                allowSelection={true}
                allowSwipe={true}
                permissions={permissions.wellNumber}
                primaryField={columns?.find((d) => d.primaryField)}
                onClick={(data) => {
                  history.push(`${routes.wellNumberDetail.path}/${data._id}`);
                }}
                dataRows={dataRows}
                selectedRecords={getLocalStorageArrayData(`${localStorageSelectedRecords}`)}
                dispatch={dispatch}
                onEdit={(data) => {
                  history.push(`${routes.wellNumberDetail.path}/${data._id}`);
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
                resource={sidebarResource.wellNumber}
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
        <ManageWellNumber
          isClone={showManageDialog.isClone}
          id={showManageDialog.idToClone}
          onClose={() => setShowManageDialog({ open: false, isClone: false, idToClone: null })}
          onSuccess={() => {
            setShowManageDialog({ open: false, isClone: false, idToClone: null });
            fetchData();
          }}
          isRedirectToDetailPage={true}
        />
      )}
      {showDeleteConfirmBox && (
        <ConfirmationDialog
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete the ${routes.wellNumber?.title?.toLowerCase()} ${deleteRecord?.wellNumber || ''} ? `}
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

export default WellNumber;
