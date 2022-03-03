import React, { useState, useEffect, Fragment, useContext, useReducer } from 'react';
import { Link } from "react-router-dom";
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import MessageDialog from 'src/components/Helpers/MessageDialog';
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { FaWarehouse } from 'react-icons/fa';
import styles from '../Leads/Header.module.scss';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import CustomContainer from 'src/components/CustomContainer';
import ManageWarehouse from './ManageWarehouse';
import routes from 'src/components/Helpers/Routes';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import { Box, Menu, MenuItem } from '@material-ui/core';
import SearchBox from 'src/components/Helpers/SearchBox';
import { gridLoadingTimeout, isObjectEmpty, sidebarResource } from 'src/constants/helpers';
import CustomAgGrid, { reducer, intialState } from 'src/components/AgGridComponents/CustomAgGrid';
import CustomRenderCell from 'src/components/Helpers/CustomRenderCell';
import ImportExportLinks from 'src/components/Helpers/ImportExportLinks';
import { useData } from 'src/StateProvider/Provider';
import EntitySelectionsDialog from "src/components/EntitySelections"
import { AiOutlineDeploymentUnit } from "react-icons/ai"
import FileCopyIcon from '@material-ui/icons/FileCopy';
import Chip from "@material-ui/core/Chip"
import useColumns, { getStaticFields, getFrameworkComponents } from "src/constants/useColumns"
import { prepareDataForGrid } from "src/constants/helpers"
import { useLocation } from "react-router-dom";
import queryString from "query-string";
import { MdSort, MdFilterList } from "react-icons/md";
import { MdAdd } from "react-icons/all";
import CustomSwipableList from "src/components/SwipableListComponents/CustomSwipableList";
import { isMobile, isTablet } from 'react-device-detect';
import { useHistory } from 'react-router-dom';
import MobileSortDialog from "src/components/MobileSortDialog"
import MobileFilterDialog from "src/components/MobileFilterDialog"
import {camelCase} from 'lodash'

const AddressResource = () => {
  const renderedFrom = camelCase(routes?.warehouse.title)
  const location = useLocation();
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions, user, selectedEntity }
  }: any = useData();
  const { getColumnData } = useColumns();

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
  const [columns, setColumns] = useState([

  ])
  const [frameWorkComponent, setFrameWorkComponent] = useState({})



  //  Grid Variables - Start
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows } = state;
  const [isAllChecked, setIsAllChecked] = useState(false);
  const [clonedData, setClonedData] = useState([])
  const localStorageSelectedRecords = `${renderedFrom}_selected`;
  const [sortOpen, setSortOpen] = React.useState(false);
  const [isOpenDialog, setisOpenDialog] = useState(false)




  // const [showGridFilters, setShowGridFilters] = useState(true)
  const columnState = JSON.parse(localStorage.getItem(renderedFrom));
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
            { field: o?.fieldData?.fieldName, headerName: o?.fieldData?.fieldLabel, primaryField: true, show: true, disabled: true, cellRenderer: 'nameRenderer' }]
          }
          else {
            let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.warehouse.path)

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
          let finalObject = prepareDataForGrid(u, user);
          finalObject["canDelete"] = warehousePermissions.isDelete;
          finalObject["isChecked"] = selectedRecords.some(s => s._id === u._id);
          finalObject["allowedToEdit"] = warehousePermissions.isUpdate;

          return finalObject
        });

        setIsAllChecked(false);
        setClonedData(data);
        if (appendRows) {
          dispatch({
            type: "initialize", data: [...dataRows, ...rows],
            count: count, selectedRecords: [...dataRows, ...rows].filter(f => f.isChecked === true)
          });
        } else {
          dispatch({
            type: "initialize", data: rows, count: count,
            selectedRecords: rows.filter(f => f.isChecked === true)
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
  }, [page, limit, filters, sorting, search, selectedEntity]);

  const NameRenderer = (params) => (
    <span className="d-flex gap-2 align-items-center">
      <Link to={`${routes.warehouseDetail.path}/${params.data._id}`} title={params.value}>
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
      </Link>
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
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(updatedFilters))}&filterType=and`;
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
            <Grid item xs={12} md={6} sm={12} className={isMobile ? styles.mobile_panel : "d-flex align-items-center gap-1"}>
              <div className="d-flex align-items-center">
                <FaWarehouse size={20} style={{ paddingBottom: "3px" }} /> <span className="listingHeader">{routes.warehouse.title}</span>
              </div>
              {isMobile && !isTablet &&
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
                    isOpen={sortOpen}
                    handleClose={handleClickClose}
                    contentPart={null}
                    secHeading={["Sort Plants"]}
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
                    secHeading={["Filter Plants"]}
                    columns={columns}
                    dispatch={dispatch}
                  />
                </div>}
            </Grid>
            <Grid md={6} sm={12} xs={12} container className={styles.filter_side}>
              <Box className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} component="div">

                <Grid style={{ display: "flex", flex: 1 }}>
                  <SearchBox
                    onSearch={handleSearch}
                    searchbox={styles.search_box_input}
                    width={isMobile && !isTablet ? "200px" : "242px"}
                    style={isMobile && !isTablet ? { flex: 1 } : {}}
                    size="small"
                    value={search}
                    placeholder={`Search ${routes.warehouse.title}`}
                  />
                </Grid>

                <Grid style={{ display: "flex", gap: "5px" }}>
                  {warehousePermissions.isCreate && (
                    <Button
                      onClick={() => {
                        setAddressResource(null);
                        setOpen({ open: true, isClone: false });
                      }}
                      variant={isMobile && !isTablet ? "text" : "contained"}
                      size="small"
                      color="primary"
                      className={isMobile && !isTablet ? "mobile_button" : styles.add_submit_btn}
                      startIcon={isMobile && !isTablet ? null : <AddOutlined />}
                    >
                      {isMobile && !isTablet ? <MdAdd size={23} /> : "Add"}
                    </Button>
                  )}


                  <Button
                    variant={isMobile && !isTablet ? "text" : "outlined"}
                    color="default"
                    size="small"
                    onClick={openActions}
                    disabled={selectedRecords.length ? false : true}
                    aria-controls="action-menu"
                    className={isMobile && !isTablet ? "mobile_button" : styles.action_submit_btn}
                  >
                    {isMobile && !isTablet ? "" : "Actions"} <ExpandMore />
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
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </div>

        {
          Object.keys(frameWorkComponent).length > 0 ?
            isMobile && !isTablet ? <CustomSwipableList
              allowSelection={true}
              allowSwipe={true}
              permissions={permissions.warehouse}
              primaryField={columns?.find(d => d.field)}
              onClick={(data) => {
                history.push(`${routes.warehouseDetail.path}/${data._id}`)
              }}
              dataRows={dataRows}
              selectedRecords={selectedRecords}
              dispatch={dispatch}
              onEdit={(data) => {
                history.push(`${routes.warehouseDetail.path}/${data._id}?openEdit=true`)
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

              ]}
              chips={[
                {
                  label: "Storage Type",
                  field: "storageType",
                },

              ]}
              owerCollaboratorInitialsOrImages=""
              onCreate={false}
              showClone={false}
              onClone={() => { }}
              renderedFrom={renderedFrom}
            /> : <CustomAgGrid
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
            open={open?.open}
            close={() => setOpen({ open: false, isClone: false })}
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
