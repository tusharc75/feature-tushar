import React, { useState, useEffect, Fragment, useContext, useReducer } from 'react';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import MessageDialog from '../../components/Helpers/MessageDialog';
import AddIcon from '@material-ui/icons/Add';
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../axios/axiosInstance';
import { FaWarehouse } from 'react-icons/fa';
import styles from '../Leads/Header.module.scss';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import CustomContainer from '../../components/CustomContainer';
import ManageWarehouse from './ManageWarehouse';
import routes from '../../components/Helpers/Routes';
import { ExpandMore } from '@material-ui/icons';
import { Box, Menu, MenuItem } from '@material-ui/core';
import SearchBox from '../../components/Helpers/SearchBox';
import { gridLoadingTimeout, isObjectEmpty, sidebarResource } from '../../constants/helpers';
import CustomAgGrid, { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';
import CustomRenderCell from '../../components/Helpers/CustomRenderCell';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import { useData } from '../../StateProvider/Provider';
import EntitySelectionsDialog from "../../components/EntitySelections"
import { AiOutlineDeploymentUnit } from "react-icons/ai"
import FileCopyIcon from '@material-ui/icons/FileCopy';
import Chip from "@material-ui/core/Chip"
import { getColumnData, getStaticFields, getFrameworkComponents } from "../../constants/columns"
import { prepareDataForGrid } from "../../constants/helpers"
import { useLocation } from "react-router-dom";
import queryString from "query-string";

const AddressResource = () => {
  const location = useLocation()
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions, user, selectedEntity }
  }: any = useData();

  const [warehousePermissions, setWarehousePermissions] = useState({
    isCreate: permissions?.warehouse?.isCreate,
    isUpdate: permissions?.warehouse?.isUpdate,
    isRead: permissions?.warehouse?.isRead,
    isDelete: permissions?.warehouse?.isDelete,
  });

  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [open, setOpen] = useState({ open: false, isClone: false });
  const [addressResource, setAddressResource] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showEntityDialog, setShowEntityDialog] = useState(false)
  const [warehouseId, setWarehouseId] = useState("")
  const [entities, setEntities] = useState([])
  const [showUpdateWarningConfirmBox, setShowUpdateWarningConfirmBox] = useState(false)
  const [columns, setColumns] = useState([])
  const [frameWorkComponent, setFrameWorkComponent] = useState({})

  // const [selectedCategory, setSelectedCategory] = useState([]);

  //  Grid Variables - Start
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

  // const [showGridFilters, setShowGridFilters] = useState(true)
  const columnState = JSON.parse(localStorage.getItem('addressResourcePage'));
  if (columnState) {
    columns.forEach((item) => {
      columnState.forEach((d) => {
        if (d.colId === item.field) {
          item.show = !d.hide;
        }
      });
    });
  }
  //  Grid Variables - End

  const storedRoutes = localStorage.getItem("routes") ? JSON.parse(localStorage.getItem("routes")) : null;

  useEffect(() => {
    if (permissions && permissions.warehouse) {
      setWarehousePermissions(permissions.warehouse);
    }
  }, [permissions]);

  useEffect(() => {
    const parsedParams = queryString.parse(location?.search);
    if (parsedParams?.id) {
      setAddressResource({ id: parsedParams?.id });
      setOpen({ open: true, isClone: false });
    }
  }, [location])

  useEffect(() => {
    fetchGridColumns()
  }, [])

  const fetchGridColumns = () => {
    axiosInstance()
      .get("/field?resource=Warehouse")
      .then(({ data: { data } }) => {
        let columns = []
        let rendererNames = []
        data.forEach(o => {
          if (o?.fieldData?.primaryField === true) {
            columns = [...columns,
            { field: o?.fieldData?.fieldName, headerName: o?.fieldData?.fieldLabel, show: true, disabled: true, cellRenderer: 'nameRenderer' }]
          }
          else {
            let currentColumn = getColumnData(routes.warehouse.title, o?.fieldData, routes.warehouse.path)

            if (currentColumn !== null) {
              columns = [...columns, currentColumn?.columnData]
              if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
                rendererNames.push(currentColumn?.rendererName)
              }
            }
          }
        })
        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true)
        tempFrameworkComponent = {
          ...tempFrameworkComponent,
          nameRenderer: NameRenderer,
          actionsRenderer: ActionsRenderer
        }
        setFrameWorkComponent({ ...tempFrameworkComponent })
        columns = [...columns, ...getStaticFields()]
        setColumns([...columns])
      })
  }


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
          return prepareDataForGrid(u, user);
        });

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
  }, [page, limit, filters, sorting, search, selectedEntity]);

  const NameRenderer = (params) => (
    <span className="d-flex gap-2 align-items-center">
      <span
        className="link"
        onClick={() => {
          if (params.data?.isAllowedToUpdate) {
            setAddressResource(params.data);
            setOpen({ open: true, isClone: false });
          }
        }}
      >
        <CustomRenderCell value={params.value} />
      </span>
    </span>
  );

  const ActionsRenderer = (params) => (
    <>
      <Tooltip
        className={warehousePermissions.isCreate ? "" : "cursor-stop"}
        title={warehousePermissions.isCreate ? "Clone" : "You do not have permission to clone/create"} >
        <IconButton
          size="small"
          aria-label="Clone"
          onClick={() => {
            setAddressResource(params.data);
            setOpen({ open: true, isClone: true })
          }}>
          <FileCopyIcon fontSize="small" color="primary" />
        </IconButton>
      </Tooltip>
      {warehousePermissions.isDelete && params?.data?.createdById === user?.user?._id ? (
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
      {
        warehousePermissions.isUpdate && params.data?.isAllowedToUpdate ?
          <Tooltip title="Entity">
            <IconButton
              size="small"
              aria-label="Entity"
              onClick={() => {
                setShowEntityDialog(true)
                setWarehouseId(params.data._id)
                if (params?.data?.entity) {
                  let entities = []
                  if (params?.data?.entityId) {
                    entities.push(params?.data?.entityId)
                  }
                  if (params?.data?.restentity) {
                    let restEntities = params?.data?.restentity.map(o => o.optionValue)
                    entities = [...entities, ...restEntities]
                  }
                  setEntities([...entities])
                }
              }}>
              <AiOutlineDeploymentUnit fontSize="15" color="primary" />
            </IconButton>
          </Tooltip> : (
            <Tooltip className="cursor-stop" title="You do not have permission to update entity">
              <IconButton aria-label="Clone" size="small">
                <AiOutlineDeploymentUnit fontSize="15" />
              </IconButton>
            </Tooltip>
          )
      }
    </>
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

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}`;

    if (!isObjectEmpty(filters)) {
      const updatedFilters = [];

      Object.keys(filters).forEach((field) => {
        updatedFilters.push({
          field: replaceFieldName(field),
          term: filters[field].filter
        });
      });
      deepFilter = `${deepFilter}&deepFilter=${JSON.stringify(updatedFilters)}&filterType=and`;
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${replaceFieldName(sorting[0].colId)}&orderBy=${sorting[0].sort}`;
    }

    if (search) {
      deepFilter = `${deepFilter}&search=${search}`;
    }

    return deepFilter;
  };

  const handleDelete = () => {
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords.map((m) => m._id);
    }
    axiosInstance()
      .put(`/warehouse/remove`, { ids: ids })
      .then(() => {
        fetchWarehouses();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
        // setSelectedCategory([])
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

  return (
    <Fragment>
      <Grid container className="headerbox">
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs routes={[{ title: routes.warehouse.title }]} />
        </Grid>
        <Grid item md={8} sm={1} xs={2}>
          <ImportExportLinks
            permissions={warehousePermissions}
            module="warehouse"
            api={'warehouse'}

            afterImportCompleted={() => {
              fetchWarehouses();
            }}
            isExportAllOrSomeFeature={true}
            total={rowCount}
            recordsToExport={selectedRecords.length}
            ids={selectedRecords.length ? selectedRecords.map((obj) => obj._id) : []}
            onExportToExcelSuccess={() => {
              if (gridApi) gridApi.deselectAll()
              else fetchWarehouses()
            }}
          />
        </Grid>
      </Grid>
      <CustomContainer>
        <div className="header-panel">
          <Grid container className={styles.filter_side_container}>
            <Grid item md={6} sm={6} xs={12} className="d-flex align-items-center gap-1">
              <FaWarehouse size={20} style={{ paddingBottom: "3px" }} /> <span className="listingHeader">{routes.warehouse.title}</span>
            </Grid>
            <Grid md={6} sm={6} xs={12} container className={styles.filter_side}>
              <Box className={styles.filter_side_header} component="div">
                <SearchBox onSearch={handleSearch} searchbox={styles.search_box_input} width="242px" size="small" value={search} placeholder={`Search ${routes.warehouse.title}`} />
                {warehousePermissions.isCreate && (
                  <Button
                    className={styles.add_submit_btn}
                    onClick={() => {
                      setAddressResource(null);
                      setOpen({ open: true, isClone: false });
                    }}
                    variant="contained"
                    size="small"
                    color="primary"
                    startIcon={<AddIcon />}
                  >
                    Add
                  </Button>
                )}
                <Button
                  className={styles.action_submit_btn}
                  variant="outlined"
                  color="default"
                  size="small"
                  onClick={openActions}
                  disabled={selectedRecords.length ? false : true}
                  aria-controls="action-menu"
                >
                  Actions <ExpandMore />
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
                  {warehousePermissions.isDelete ?
                    <MenuItem onClick={() => setShowDeleteConfirmBox(true)}>Delete</MenuItem>
                    : null}
                  {warehousePermissions.isUpdate && (
                    <MenuItem
                      disabled={selectedRecords.length === 0}
                      onClick={() => {
                        if (selectedRecords.some((d) => d.isUpdate === false)) {
                          closeActions();
                          setShowUpdateWarningConfirmBox(true)
                        } else {
                          closeActions();
                          if (selectedRecords.length) {
                            let entities = []
                            selectedRecords.map(current => {
                              if (current?.entity) {
                                if (current?.entityId) {
                                  entities.push(current?.entityId)
                                }
                                if (current?.restentity) {
                                  let restEntities = current?.restentity.map(o => o.optionValue)
                                  entities = [...entities, ...restEntities]
                                }
                              }
                            })
                            setEntities([...entities])
                          }
                          setShowEntityDialog(true)
                        }
                      }}
                    >
                      Assign Entity &nbsp; <Chip size="small" label={selectedRecords.length} />
                    </MenuItem>
                  )}
                </Menu>
              </Box>
            </Grid>
          </Grid>
        </div>

        {
          Object.keys(frameWorkComponent).length > 0 ?
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
              renderedFrom={routes.warehouse.title}
              refreshGrid={fetchWarehouses}
            /> : null}

        {showDeleteConfirmBox && (
          <ConfirmationDialog
            open={showDeleteConfirmBox}
            message={`Are you sure you want to delete ${routes.warehouse.title.toLowerCase()} ${deleteRecord ? deleteRecord?._id ? deleteRecord?.warehouseName : "" : ""}?`}
            onClose={() => {
              setDeleteRecord(null);
              setShowDeleteConfirmBox(false)
            }}
            onOk={handleDelete}
          />
        )}

        {open?.open && (
          <ManageWarehouse
            addressResource={addressResource}
            onClose={() => setOpen({ open: false, isClone: false })}
            onSuccess={() => {
              setOpen({ open: false, isClone: false });
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
        {
          showEntityDialog ?
            <EntitySelectionsDialog
              open={showEntityDialog}
              resource={sidebarResource.warehouse}
              resourceIds={selectedRecords.length ? selectedRecords.map(o => o._id) : [warehouseId]}
              onClose={() => {
                setShowEntityDialog(false)
                setWarehouseId("")
              }}
              onSuccess={fetchWarehouses}
              entities={entities}
            /> : null
        }
      </CustomContainer>
    </Fragment>
  );
};

export default AddressResource;
