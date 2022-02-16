import { useState, useEffect, Fragment, useContext, useReducer } from 'react';
import Grid from '@material-ui/core/Grid';
import { Link } from 'react-router-dom';
import Button from '@material-ui/core/Button';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import AddIcon from '@material-ui/icons/Add';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../axios/axiosInstance';
import { FaThemeisle } from 'react-icons/fa';
import styles from '../Leads/Header.module.scss';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import CustomContainer from '../../components/CustomContainer';
import CreateZone from '../zone/CreateZone';
import routes from '../../components/Helpers/Routes';
import SearchBox from '../../components/Helpers/SearchBox';
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import { gridLoadingTimeout, gridPageSizes, isObjectEmpty } from '../../constants/helpers';
import CustomAgGrid from '../../components/AgGridComponents/CustomAgGrid';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import { useData } from '../../StateProvider/Provider';
import { Box, Chip, Menu, MenuItem } from '@material-ui/core';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import NoDataCell from '../../components/Helpers/NoDataCell';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { useLocation } from 'react-router-dom';
import queryString from 'query-string';
import useColumns, { getStaticFields, getFrameworkComponents } from '../../constants/useColumns';
import { prepareDataForGrid } from '../../constants/helpers';
import { MdAccountCircle } from 'react-icons/md';
import { GiFireZone, MdAdd, MdSort, MdFilterList, AiOutlineBgColors } from 'react-icons/all';
import CustomSwipableList from '../../components/SwipableListComponents/CustomSwipableList';
import { isMobile, isTablet } from 'react-device-detect';
import { useHistory } from 'react-router-dom';
import { FaSuitcase } from 'react-icons/fa';
import MobileSortDialog from "../../components/MobileSortDialog"
import MobileFilterDialog from "../../components/MobileFilterDialog"




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

const Zone = () => {
  const history = useHistory();
  const location = useLocation();
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions, user, selectedEntity }
  }: any = useData();
  const { getColumnData } = useColumns();

  const [productCategoryPermissions, setProductCategoryPermissions] = useState({
    isCreate: permissions.productCategory?.isCreate,
    isUpdate: permissions.productCategory?.isUpdate,
    isRead: permissions.productCategory?.isRead,
    isDelete: permissions.productCategory?.isDelete
  });

  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [open, setOpen] = useState({ open: false, isClone: false });
  const [zoneId, setZoneId] = useState(null);
  const [columns, setColumns] = useState([]);
  const [frameWorkComponent, setFrameWorkComponent] = useState({});
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows } = state;
  const columnState = JSON.parse(localStorage.getItem('productCategoryPage'));
  const [isAllChecked, setIsAllChecked] = useState(false);
  const [clonedData, setClonedData] = useState([]);
  const localStorageSelectedRecords = `${routes.productCategory.title}_selected`;
  const [isOpenDialog, setisOpenDialog] = useState(false)
  const [sortOpen, setSortOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  if (columnState) {
    columns.map((item) => {
      columnState.map((d) => {
        if (d.colId == item.field) {
          item.show = !d.hide;
        }
      });
    });
  }

  useEffect(() => {
    const parsedParams = queryString.parse(location?.search);
    if (parsedParams?.id) {
      setZoneId(parsedParams?.id);
      setOpen({ open: true, isClone: false });
    }
  }, [location]);

  useEffect(() => {
    if (permissions && permissions.productCategory) {
      setProductCategoryPermissions(permissions.productCategory);
    }
  }, [permissions]);

  useEffect(() => {
    fetchZone();
  }, [page, limit, filters, sorting, search, selectedEntity]);

  useEffect(() => {
    fetchGridColumns();
  }, []);


  const fetchGridColumns = () => {
    axiosInstance()
      .get('/field?resource=Zone')
      .then(({ data: { data } }) => {
        let columns = [];
        let rendererNames = [];
        data.forEach((o) => {
          if (['name'].find((d) => d === o?.fieldData?.fieldName)) {
            columns = [
              ...columns,
              {
                disabled: true,
                field: 'name',
                headerName: 'Zone Name',
                pivotIndex: 0,
                show: true,
                cellRenderer: 'nameRenderer',
                primaryField: true
              }
            ];
          } else {
            if (o?.fieldData?.primaryField === true) {
              columns = [
                ...columns,
                { field: o?.fieldData?.fieldName, headerName: o?.fieldData?.fieldLabel, show: true, disabled: true, cellRenderer: 'nameRenderer' }
              ];
            } else {
              let currentColumn = getColumnData(routes.zone.title, o?.fieldData, routes.zone.path);

              if (currentColumn !== null) {
                columns = [...columns, currentColumn?.columnData];
                if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
                  rendererNames.push(currentColumn?.rendererName);
                }
              }
            }
          }
        });
        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
        tempFrameworkComponent = {
          ...tempFrameworkComponent,
          nameRenderer: NameRenderer,
          actionsRenderer: ActionsRenderer
        };
        setFrameWorkComponent({ ...tempFrameworkComponent });
        columns = [...columns, ...getStaticFields()];
        setColumns([...columns]);
      });
  };

  const NameRenderer = (params) => (
    <Link className="link" title={params.value} to={`${routes.zoneDetail.path}/${params.data._id}`}>
      {params.value}
    </Link>

  )

  const ActionsRenderer = (params) => (
    <Fragment>
      <Tooltip
        className={productCategoryPermissions.isCreate ? '' : 'cursor-stop'}
        title={productCategoryPermissions.isCreate ? 'Clone' : 'You do not have permission to clone/create'}
      >
        <IconButton
          size="small"
          aria-label="Clone"
          onClick={() => {
            setZoneId(params.data.id);
            setOpen({ open: true, isClone: true });
          }}
        >
          <FileCopyIcon fontSize="small" color="primary" />
        </IconButton>
      </Tooltip>
      {productCategoryPermissions.isDelete && params?.data?.createdById == user?.user?._id ? (
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
    </Fragment>
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
    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`;
    }

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

  const fetchZone = () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    if (gridApi) {
      gridApi.setRowData([]);
    }
    axiosInstance()
      .get(`/zone${queryString}`)
      .then(({ data: { data, count } }) => {
        console.log(data, 'data');

        let rows = data.map((u: any) => {
          let finalObject = prepareDataForGrid(u);
          finalObject['canDelete'] = permissions.productCategory.isDelete;
          finalObject['isChecked'] = selectedRecords.some((s) => s._id === u._id);
          finalObject['allowedToEdit'] = permissions.productCategory.isUpdate;
          return {
            ...finalObject

          };
        });
        setIsAllChecked(false);
        setClonedData(data);
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

        if (gridApi) {
          try {
            let oldSelectedRecords = localStorage.getItem(localStorageSelectedRecords)
              ? JSON.parse(localStorage.getItem(localStorageSelectedRecords))
              : [];
            if (oldSelectedRecords.length > 0) {
              gridApi.forEachNode(function (node) {
                node.setSelected(oldSelectedRecords.some((o) => o === node.data._id));
              });
            }
          } catch (ex) {
            console.error('Error in getting selected records from local storage');
          }
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

  const handleDelete = () => {
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords.map((m) => m._id);
    }
    axiosInstance()
      .put(`/zone/remove`, { ids: ids })
      .then(() => {
        fetchZone();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

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
    <Fragment>
      <Grid container className="headerbox">
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs routes={[{ title: routes.zone.title }]} />
        </Grid>
        <Grid item md={8} sm={1} xs={2}>
          <ImportExportLinks
            permissions={permissions.productCategory}
            module="zone"
            api={'/zone'}
            afterImportCompleted={() => {
              fetchZone();
            }}
            isExportAllOrSomeFeature={true}
            total={rowCount}
            recordsToExport={selectedRecords.length}
            ids={selectedRecords.length ? selectedRecords.map((obj) => obj._id) : []}
            onExportToExcelSuccess={() => {
              if (gridApi) gridApi.deselectAll();
              else fetchZone();
            }}
          />
        </Grid>
      </Grid>
      <CustomContainer>
        <div className="header-panel">
          <Grid container className={styles.filter_side_container}>
            <Grid item xs={12} md={6} sm={12} className={isMobile ? styles.mobile_panel : "d-flex align-items-center gap-1"}>
              <div className="d-flex align-items-center">
                <GiFireZone size={20} style={{ paddingBottom: '3px' }} />
                <span className="listingHeader">{routes.zone.title}</span>
              </div>
              {isMobile && (
                <>
                  <Grid style={{ display: 'inline-flex' }}>
                    <Button
                      onClick={handleClickOpen}
                      id="demo-customized-button"
                      aria-controls="demo-customized-menu"
                      aria-haspopup="true"
                      aria-expanded={'true'}
                      color="secondary"
                      variant="text"
                      disableElevation
                      startIcon={<MdSort />}
                      className={'sort-filter-tablet'}
                      style={isTablet ? { marginLeft: '50px' } : {}}
                    >
                      Sort
                    </Button>
                    <MobileSortDialog
                      isOpen={sortOpen}
                      handleClose={handleClickClose}
                      contentPart={null}
                      secHeading={['Sort Zone']}
                      columns={columns}
                      dispatch={dispatch}
                    />

                    <Button
                      id="demo-customized-button"
                      aria-controls="demo-customized-menu"
                      aria-haspopup="true"
                      aria-expanded={'true'}
                      variant="text"
                      color="secondary"
                      disableElevation
                      className={'sort-filter-tablet'}
                      startIcon={<MdFilterList />}
                      onClick={handleOpen}
                    >
                      Filter
                    </Button>

                    <MobileFilterDialog
                      isOpen={isOpenDialog}
                      handleClose={handleFilterClose}
                      contentPart={null}
                      secHeading={['Filter Zone']}
                      columns={columns}
                      dispatch={dispatch}
                    />
                  </Grid>
                </>
              )}
            </Grid>
            <Grid md={6} sm={12} xs={12} container className={styles.filter_side}>
              <Box className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} component="div">
                <Grid style={{ width: '100%', display: 'flex' }}>
                  <SearchBox
                    onSearch={handleSearch}
                    searchbox={styles.search_box_input}
                    width={isMobile ? '200px' : '242px'}
                    style={isMobile ? { flex: 1 } : {}}
                    size="small"
                    value={search}
                  />
                </Grid>

                <Grid style={{ display: 'flex', gap: '5px' }}>
                  {productCategoryPermissions.isCreate && (
                    <Button
                      className={isMobile && !isTablet ? 'mobile_button' : styles.add_submit_btn}
                      onClick={() => {
                        setZoneId(null);
                        setOpen({ open: true, isClone: false });
                      }}
                      variant={isMobile && !isTablet ? 'text' : 'contained'}
                      size="small"
                      color="primary"
                      startIcon={isMobile && !isTablet ? null : <AddOutlined />}
                    >
                      {isMobile && !isTablet ? <MdAdd size={23} /> : 'Add'}
                    </Button>
                  )}
                  {productCategoryPermissions.isDelete && (
                    <Button
                      variant={isMobile && !isTablet ? 'text' : 'contained'}
                      color="default"
                      size="small"
                      onClick={openActions}
                      disabled={selectedRecords.length ? false : true}
                      aria-controls="action-menu"
                      className={isMobile && !isTablet ? 'mobile_button' : styles.action_submit_btn}
                    >
                      {isMobile && !isTablet ? '' : 'Actions'} <ExpandMore />
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
                    <MenuItem
                      disabled={!(productCategoryPermissions?.isDelete && !selectedRecords?.some((record) => record.createdById !== user?.user?._id))}
                      onClick={() => {
                        closeActions();
                        {
                          selectedRecords.length === 1 && setDeleteRecord(selectedRecords[0]);
                        }
                        setShowDeleteConfirmBox(true);
                      }}
                    >
                      Delete
                    </MenuItem>
                  </Menu>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </div>

        {Object.keys(frameWorkComponent).length > 0 ? (
          isMobile && !isTablet ? (
            <CustomSwipableList
              allowSelection={true}
              allowSwipe={true}
              permissions={permissions.productCategory}
              primaryField={columns?.find((d) => d.primaryField)}
              onClick={(data) => {
                setZoneId(data.id);
                setOpen({ open: true, isClone: false });
              }}
              dataRows={dataRows}
              selectedRecords={selectedRecords}
              dispatch={dispatch}
              onEdit={(data) => {
                setZoneId(data.id);
                setOpen({ open: true, isClone: false });
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
                  field: 'name'
                }
              ]}
              chips={[
               
              ]}
              owerCollaboratorInitialsOrImages=""
              onCreate={false}
              showClone={true}
              onClone={(data) => {
                setZoneId(data.id);
                setOpen({ open: true, isClone: true });
              }}
              renderedFrom={routes.productCategory.title}
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
              allowAction={true}
              loading={loading}
              renderedFrom={routes.productCategory.title}
              refreshGrid={fetchZone}
            />
          )
        ) : null}

        {showDeleteConfirmBox && (
          <ConfirmationDialog
            open={showDeleteConfirmBox}
            message={`Are you sure you want to delete zone  ${deleteRecord?._id ? deleteRecord?.name : ''}?`}
            onClose={() => setShowDeleteConfirmBox(false)}
            onOk={handleDelete}
          />
        )}

        {open?.open && (
          <CreateZone
            isUpdateDisaCreateProductCategorybled={false}
            zoneId={zoneId}
            isClone={open?.isClone}
            onClose={() => setOpen({ open: false, isClone: false })}
            onSuccess={() => {
              setOpen({ open: false, isClone: false });
              fetchZone();
            }}
          />
        )}
      </CustomContainer>
    </Fragment>
  );
};

export default Zone;