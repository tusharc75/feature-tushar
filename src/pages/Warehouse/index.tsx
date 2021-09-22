import React, { useState, useEffect, Fragment, useContext, useReducer } from 'react';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
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
import { gridLoadingTimeout, gridPageSizes, isObjectEmpty, sidebarResource } from '../../constants/helpers';
import { CreatedByRenderer, UpdatedByRenderer } from '../../components/AgGridComponents/CustomAgGridCellRenderers';
import CustomAgGrid from '../../components/AgGridComponents/CustomAgGrid';
import CustomRenderCell from '../../components/Helpers/CustomRenderCell';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import { useData } from '../../StateProvider/Provider';
import { entity } from "../../constants/helpers"
import EntitySelectionsDialog from "../../components/EntitySelections"
import { AiOutlineDeploymentUnit } from "react-icons/ai"
import FileCopyIcon from '@material-ui/icons/FileCopy';

function reducer(state, action) {
  switch (action.type) {
    case 'loading':
      return {
        ...state,
        loading: action.loading
      };

    case 'initialize':
      return {
        ...state,
        dataRows: action.data,
        rowCount: action.count
      };

    case 'selection':
      return {
        ...state,
        selectedRecords: action.selectedRecords
      };

    case 'update':
      return {
        ...state,
        dataRows: action.data,
        loading: false
      };

    case 'filter':
      return {
        ...state,
        loading: true,
        filters: action.filters,
        page: 0
      };

    case 'sort':
      return {
        ...state,
        sorting: action.sorting,
        loading: true
      };

    case 'search':
      return {
        ...state,
        search: action.search,
        loading: true
      };

    case 'pageChange':
      return {
        ...state,
        page: action.page
      };

    case 'pageSizeChange':
      return {
        ...state,
        limit: action.limit,
        page: 0,
        loading: true
      };

    case 'complete':
      return {
        ...state,
        loading: false
      };

    default:
      break;
  }

  return state;
}

const intialState = {
  dataRows: [],
  rowCount: 0,
  loading: false,
  page: 0,
  limit: 25,
  pageSizes: gridPageSizes,
  search: '',
  filters: {},
  sorting: [],
  selectedRecords: []
};

const AddressResource = () => {
  const { entityApi } = entity
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions, user }
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
  const [addressResourceId, setAddressResourceId] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showEntityDialog, setShowEntityDialog] = useState(false)
  const [warehouseId, setWarehouseId] = useState("")
  const [entities, setEntities] = useState([])

  // const [selectedCategory, setSelectedCategory] = useState([]);

  //  Grid Variables - Start
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

  // const [showGridFilters, setShowGridFilters] = useState(true)
  const columnState = JSON.parse(localStorage.getItem('addressResourcePage'));
  const columns = [
    { field: 'warehouseName', headerName: 'Warehouse Name', show: true, disabled: true, cellRenderer: 'nameRenderer' },
    { field: 'warehouseID', headerName: 'Warehouse ID', show: true, disabled: true, cellRenderer: 'commonRenderer' },
    { field: 'storageType', headerName: 'Storage Type', show: true, disabled: true, cellRenderer: 'commonRenderer' },
    { field: 'address', headerName: 'Address', show: true, disabled: true, cellRenderer: 'commonRenderer' },
    { field: 'createdBy', headerName: 'Created By', show: true, cellRenderer: 'createdByRenderer' },
    { field: 'updatedBy', headerName: 'Updated By', show: true, cellRenderer: 'updatedByRenderer' }
  ];
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
          const { createdBy, updatedBy, ...restProperties } = u;

          let res = {
            ...restProperties,
            id: u._id,

            createdBy: u.createdBy?.user?.concatedName,
            createdById: u.createdBy?.user?._id,
            createdByDate: u.createdBy?.date,
            updatedBy: u.updatedBy?.user?.concatedName,
            updatedByDate: u.updatedBy?.date
          };

          return res;
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
  }, [page, limit, filters, sorting, search]);

  const NameRenderer = (params) => (
    <span className="d-flex gap-2 align-items-center">
      <span
        className="link"
        onClick={() => {
          setAddressResourceId(params.data.id);
          setOpen({ open: false, isClone: false });
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
            setAddressResourceId(params.data.id);
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
        warehousePermissions.isUpdate && <Tooltip title="Clone">
          <IconButton
            size="small"
            aria-label="Entity"
            onClick={() => {
              setShowEntityDialog(true)
              setWarehouseId(params.data._id)
              if (params?.data?.entity) {
                let restEntities = params?.data?.entity.map(o => o?.optionValue)
                setEntities([...restEntities])
              }
            }}>
            <AiOutlineDeploymentUnit fontSize="small" color="primary" />
          </IconButton>
        </Tooltip>
      }
    </>
  );

  const frameworkComponents = {
    nameRenderer: NameRenderer,
    createdByRenderer: CreatedByRenderer,
    updatedByRenderer: UpdatedByRenderer,
    actionsRenderer: ActionsRenderer
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
          <CustomBreadCrumbs routes={[{ title: routes.address.title }]} />
        </Grid>
        <Grid item md={8} sm={1} xs={2}>
          <ImportExportLinks
            permissions={permissions.addressResource}
            module="warehouse"
            api={'warehouse'}
            afterImportCompleted={() => {
              fetchWarehouses();
            }}
          />
        </Grid>
      </Grid>
      <CustomContainer>
        <div className="header-panel">
          <Grid container className={styles.filter_side_container}>
            <Grid item md={6} sm={6} xs={12} className="d-flex align-items-center gap-1">
              <FaWarehouse size={20} style={{ paddingBottom: "3px" }} /> <span className="listingHeader">{routes.address.title}</span>
            </Grid>
            <Grid md={6} sm={6} xs={12} container className={styles.filter_side}>
              <Box className={styles.filter_side_header} component="div">
                <SearchBox onSearch={handleSearch} searchbox={styles.search_box_input} width="242px" size="small" value={search} />
                {warehousePermissions.isCreate && (
                  <Button
                    className={styles.add_submit_btn}
                    onClick={() => {
                      setAddressResourceId(null);
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
                {warehousePermissions.isDelete && (
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
                  <MenuItem onClick={() => setShowDeleteConfirmBox(true)}>Delete</MenuItem>
                </Menu>
              </Box>
            </Grid>
          </Grid>
        </div>

        <CustomAgGrid
          columns={columns}
          dataRows={dataRows}
          frameworkComponents={frameworkComponents}
          setGridApi={setGridApi}
          dispatch={dispatch}
          rowCount={rowCount}
          limit={limit}
          pageSizes={pageSizes}
          page={page}
          actionWidth={150}
          loading={loading}
          renderedFrom="warehousePage"
        />

        {showDeleteConfirmBox && (
          <ConfirmationDialog
            open={showDeleteConfirmBox}
            message={`Are you sure you want to delete product category  ${deleteRecord?._id ? deleteRecord?.name : ''}?`}
            onClose={() => setShowDeleteConfirmBox(false)}
            onOk={handleDelete}
          />
        )}

        {open?.open && (
          <ManageWarehouse
            addressResourceId={addressResourceId}
            onClose={() => setOpen({ open: false, isClone: false })}
            onSuccess={() => {
              setOpen({ open: false, isClone: false });
              fetchWarehouses();
            }}
            isClone={open?.isClone}
          />
        )}
        {
          showEntityDialog ?
            <EntitySelectionsDialog
              open={showEntityDialog}
              resource={sidebarResource.warehouse}
              resourceId={warehouseId}
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
