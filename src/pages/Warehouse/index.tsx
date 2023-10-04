import { Menu, MenuItem } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Chip from '@material-ui/core/Chip';
import IconButton from '@material-ui/core/IconButton';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { camelCase } from 'lodash';
import React, { useContext, useEffect, useReducer, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { AiOutlineDeploymentUnit } from 'react-icons/ai';
import { TbArrowsSort } from 'react-icons/all';
import { MdOutlineFilterAlt } from 'react-icons/md';
import { useHistory, useLocation } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomAgGrid, { intialState, reducer } from 'src/components/AgGridComponents/CustomAgGrid';
import AssignUserDialog from 'src/components/AssignRolesDialog/NewAssignUserDialog';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import EntitySelectionsDialog from 'src/components/EntitySelections';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import ImportExportLinks from 'src/components/Helpers/ImportExportLinks';
import MessageDialog from 'src/components/Helpers/MessageDialog';
import routes from 'src/components/Helpers/Routes';
import SearchBox from 'src/components/Helpers/SearchBox';
import MobileFilterDialog, { DisplayFiltersForMobile } from 'src/components/MobileFilterDialog';
import MobileSortDialog from 'src/components/MobileSortDialog';
import CustomSwipableList from 'src/components/SwipableListComponents/CustomSwipableList';
import { getLocalStorageArrayData, gridLoadingTimeout, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import useColumns, { getFrameworkComponents, getStaticFields, gridFilterParser } from 'src/constants/useColumns';
import styles from '../Leads/Header.module.scss';
import ManageWarehouse from './ManageWarehouse';
const Warehouse = () => {
  const renderedFrom = camelCase(routes?.warehouse.title);
  const localStorageSelectedRecords = `${renderedFrom}_selected`;

  const location = useLocation();
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions, user, selectedEntity }
  }: any = useData();
  const { getColumnData } = useColumns();

  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [open, setOpen] = useState({ open: false, isClone: false, id: null });
  const [anchorEl, setAnchorEl] = useState(null);
  const [showEntityDialog, setShowEntityDialog] = useState(false);
  const [warehouseId, setWarehouseId] = useState('');
  const [entities, setEntities] = useState([]);
  const [showUpdateWarningConfirmBox, setShowUpdateWarningConfirmBox] = useState(false);
  const [columns, setColumns] = useState([]);
  const [frameWorkComponent, setFrameWorkComponent] = useState({});

  //  Grid Variables - Start
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } =
    state;
  const [sortOpen, setSortOpen] = React.useState(false);
  const [isOpenDialog, setisOpenDialog] = useState(false);

  const [isAssigning, setIsAssigning] = useState(false);
  const [userAssignDialog, setUserAssignDialog] = useState(false);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = () => {
    axiosInstance()
      .get('/field?resource=Warehouse')
      .then(({ data: { data } }) => {
        let columns = [];
        let rendererNames = [];
        data.forEach((o) => {
          let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.warehouseDetail.path, true);
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

  const fetchWarehouses = () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    if (gridApi) {
      gridApi.setRowData([]);
    }

    axiosInstance()
      .get(`/warehouse${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
          let finalObject = prepareDataForGrid(u, user);
          finalObject['canDelete'] = permissions?.warehouse?.isDelete;
          finalObject['isChecked'] = getLocalStorageArrayData(localStorageSelectedRecords)?.some((s) => s._id === u._id);
          finalObject['allowedToEdit'] = permissions?.warehouse?.isUpdate;
          return finalObject;
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

  useEffect(() => {
    fetchWarehouses();
  }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly]);

  const ActionsRenderer = (params) => (
    <>
      <HtmlTooltip
        className={permissions?.warehouse?.isCreate ? '' : 'cursor-stop'}
        title={permissions?.warehouse?.isCreate ? 'Clone' : 'You do not have permission to clone/create'}
      >
        <span>
          <IconButton
            size="small"
            aria-label="Clone"
            disabled={!permissions?.warehouse?.isCreate}
            onClick={() => {
              setOpen({ open: true, isClone: true, id: params.data._id });
            }}
          >
            <FileCopyIcon fontSize="small" color={permissions?.warehouse?.isCreate ? 'primary' : 'inherit'} />
          </IconButton>
        </span>
      </HtmlTooltip>
      {permissions?.warehouse?.isDelete ? (
        <HtmlTooltip title="Delete">
          <IconButton
            aria-label="Delete"
            onClick={() => {
              setDeleteRecord(params.data);
              setShowDeleteConfirmBox(true);
            }}
          >
            <DeleteIcon fontSize="small" color="error" />
          </IconButton>
        </HtmlTooltip>
      ) : (
        <HtmlTooltip className="cursor-stop" title={`You do not have permission to delete `}>
          <IconButton aria-label="Delete">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </HtmlTooltip>
      )}
      {permissions?.warehouse?.isUpdate && params.data?.isAllowedToUpdate ? (
        <HtmlTooltip title="Entity">
          <IconButton
            size="small"
            aria-label="Entity"
            onClick={() => {
              setShowEntityDialog(true);
              setWarehouseId(params.data._id);
              if (params?.data?.entity) {
                let entities = [];
                if (params?.data?.entityId) {
                  entities.push(params?.data?.entityId);
                }
                if (params?.data?.restentity) {
                  let restEntities = params?.data?.restentity.map((o) => o.optionValue);
                  entities = [...entities, ...restEntities];
                }
                setEntities([...entities]);
              }
            }}
          >
            <AiOutlineDeploymentUnit fontSize="15" color="primary" />
          </IconButton>
        </HtmlTooltip>
      ) : (
        <HtmlTooltip className="cursor-stop" title="You do not have permission to update entity">
          <IconButton aria-label="Clone" size="small">
            <AiOutlineDeploymentUnit fontSize="15" />
          </IconButton>
        </HtmlTooltip>
      )}
    </>
  );

  const handleAssignUser = (data) => {
    setIsAssigning(true);
    const user = data?.map((e) => e?._id);
    const warehouse = getLocalStorageArrayData(localStorageSelectedRecords)?.map((m) => m._id);
    axiosInstance()
      .post(`${routes.warehouse.path}/user/assign`, { warehouse, user })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        localStorage.removeItem(localStorageSelectedRecords);
        fetchWarehouses();
        setUserAssignDialog(false);
        setIsAssigning(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setIsAssigning(false);
      });
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = !isExport ? `?page=${page}&limit=${limit}` : '?';

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
      ids = getLocalStorageArrayData(localStorageSelectedRecords)?.map((m) => m._id);
    }
    axiosInstance()
      .put(`/warehouse/remove`, { ids: ids })
      .then(() => {
        fetchWarehouses();
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
    setSortOpen(true);
  };

  const handleClickClose = () => {
    setSortOpen(false);
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ title: routes.warehouse.title }]} />
        <ImportExportLinks
          permissions={permissions?.warehouse}
          module="warehouse"
          api={'warehouse'}
          afterImportCompleted={() => {
            fetchWarehouses();
          }}
          isExportAllOrSomeFeature={true}
          total={rowCount}
          recordsToExport={getLocalStorageArrayData(localStorageSelectedRecords)?.length}
          ids={
            getLocalStorageArrayData(localStorageSelectedRecords)?.length
              ? getLocalStorageArrayData(localStorageSelectedRecords)?.map((obj) => obj._id)
              : []
          }
          onExportToExcelSuccess={() => {
            if (gridApi) gridApi.deselectAll();
            else fetchWarehouses();
          }}
          additionalParams={getQueryString(true)}
          extraImportExportLinks={
            user?.user?.brandPolicy?.warehouseAccessByUser
              ? [
                  {
                    title: 'Assign Users Template',
                    api: `warehouse/user/template`,
                    type: 'download'
                  },
                  {
                    title: 'Assign Users Export',
                    api: `warehouse/user/template?export=true${
                      getLocalStorageArrayData(`${localStorageSelectedRecords}`).length
                        ? `&ids=${JSON.stringify(getLocalStorageArrayData(`${localStorageSelectedRecords}`).map((obj) => obj._id))}`
                        : ''
                    }`,
                    type: 'export'
                  },
                  {
                    title: 'Assign Users Import',
                    api: `warehouse/user/import`,
                    type: 'import'
                  }
                ]
              : []
          }
          title={routes.warehouse.title}
        />
      </div>
      <CustomContainer>
        <div className="header-panel">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={'d-flex align-items-center gap-1'}>
              {isMobile && !isTablet && (
                <div className="d-flex flex-wrap items-center justify-between w-full">
                  <div></div>
                  <div className="flex flex-wrap items-center gap-1 ml-auto">
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
                      isOpen={sortOpen}
                      handleClose={handleClickClose}
                      contentPart={null}
                      secHeading={['Sort Plants']}
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
                      title={routes?.warehouse?.title}
                      filters={filters}
                      resource={sidebarResource.warehouse}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-[8px]  justify-end">
              <SearchBox onChange={handleSearch} className={styles.search_box_input} size="small" value={search} />

              <div className="flex gap-[8px] flex-wrap items-center">
                {permissions?.warehouse?.isCreate && (
                  <Button
                    onClick={() => {
                      setOpen({ open: true, isClone: false, id: null });
                    }}
                    variant={'contained'}
                    className="no-shadow"
                    color="primary"
                    size="small"
                    startIcon={<AddOutlined />}
                  >
                    Add
                  </Button>
                )}

                <Button
                  variant={'outlined'}
                  color="default"
                  size="small"
                  onClick={openActions}
                  disabled={getLocalStorageArrayData(localStorageSelectedRecords)?.length ? false : true}
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
                  {permissions?.warehouse?.isDelete ? <MenuItem onClick={() => setShowDeleteConfirmBox(true)}>Delete</MenuItem> : null}
                  {permissions?.warehouse?.isUpdate && (
                    <MenuItem
                      onClick={() => {
                        if (selectedRecords.some((d) => d.isUpdate === false)) {
                          closeActions();
                          setShowUpdateWarningConfirmBox(true);
                        } else {
                          closeActions();
                          if (selectedRecords.length) {
                            let entities = [];
                            selectedRecords.map((current) => {
                              if (current?.entity) {
                                if (current?.entityId) {
                                  entities.push(current?.entityId);
                                }
                                if (current?.restentity) {
                                  let restEntities = current?.restentity.map((o) => o.optionValue);
                                  entities = [...entities, ...restEntities];
                                }
                              }
                            });
                            setEntities([...entities]);
                          }
                          setShowEntityDialog(true);
                        }
                      }}
                    >
                      Assign Entity &nbsp; <Chip size="small" label={selectedRecords.length} />
                    </MenuItem>
                  )}
                  {permissions?.warehouse?.isUpdate && user?.user?.brandPolicy?.warehouseAccessByUser && (
                    <MenuItem
                      onClick={() => {
                        closeActions();
                        setUserAssignDialog(true);
                      }}
                    >
                      Assign Users &nbsp; <Chip size="small" label={selectedRecords.length} />
                    </MenuItem>
                  )}
                </Menu>
              </div>
            </div>
            <DisplayFiltersForMobile resource={sidebarResource.warehouse} />
          </div>
        </div>

        {Object.keys(frameWorkComponent).length > 0 ? (
          isMobile && !isTablet ? (
            <CustomSwipableList
              allowSelection={true}
              allowSwipe={true}
              permissions={permissions?.warehouse}
              primaryField={columns?.find((d) => d.field)}
              onClick={(data) => {
                history.push(`${routes.warehouseDetail.path}/${data._id}`);
              }}
              dataRows={dataRows}
              selectedRecords={selectedRecords}
              dispatch={dispatch}
              onEdit={(data) => {
                history.push(`${routes.warehouseDetail.path}/${data._id}`);
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
              chips={[
                {
                  label: 'Storage Type',
                  field: 'storageType'
                }
              ]}
              owerCollaboratorInitialsOrImages=""
              onCreate={false}
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
              actionWidth={150}
              loading={loading}
              renderedFrom={renderedFrom}
              refreshGrid={fetchWarehouses}
              showOnlyShowFilteredRecordSwitch={true}
              showFilters={true}
              resource={sidebarResource.warehouse}
            />
          )
        ) : null}
        {userAssignDialog && (
          <AssignUserDialog
            handleClose={() => {
              setUserAssignDialog(false);
            }}
            onSuccess={(data) => {
              handleAssignUser(data);
            }}
            reference={'warehouse'}
            isAssigning={isAssigning}
            ignoreUsers={[]}
          />
        )}
        {showDeleteConfirmBox && (
          <ConfirmationDialog
            open={showDeleteConfirmBox}
            message={`Are you sure you want to delete ${routes?.warehouse?.title?.toLowerCase()} 
            ${deleteRecord ? (deleteRecord?._id ? deleteRecord?.warehouseName : '') : ''}?`}
            onClose={() => {
              setDeleteRecord(null);
              setShowDeleteConfirmBox(false);
            }}
            onOk={handleDelete}
          />
        )}
        {open?.open && (
          <ManageWarehouse
            warehouseId={open.id}
            open={open?.open}
            close={() => setOpen({ open: false, isClone: false, id: null })}
            onSuccess={() => {
              setOpen({ open: false, isClone: false, id: null });
              fetchWarehouses();
            }}
            isClone={open?.isClone}
          />
        )}
        {showUpdateWarningConfirmBox ? (
          <MessageDialog
            open={showUpdateWarningConfirmBox}
            message={`You are trying to update records which you do not have permission to update, Please remove those records from selection and try again.`}
            onClose={() => setShowUpdateWarningConfirmBox(false)}
          />
        ) : null}
        {showEntityDialog ? (
          <EntitySelectionsDialog
            open={showEntityDialog}
            resource={sidebarResource.warehouse}
            resourceIds={selectedRecords.length ? selectedRecords.map((o) => o._id) : [warehouseId]}
            onClose={() => {
              setShowEntityDialog(false);
              setWarehouseId('');
            }}
            onSuccess={fetchWarehouses}
            entities={entities}
          />
        ) : null}
      </CustomContainer>
    </section>
  );
};

export default Warehouse;
