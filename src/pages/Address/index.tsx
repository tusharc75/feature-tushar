import React, { useState, useEffect, Fragment, useContext, useReducer } from 'react';
import { Link } from 'react-router-dom';
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
import ManageAddressDialog from '../../components/Address/ManageAddressDialog';
import routes from '../../components/Helpers/Routes';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import { Box, Menu, MenuItem } from '@material-ui/core';
import SearchBox from '../../components/Helpers/SearchBox';
import { gridLoadingTimeout, isObjectEmpty, sidebarResource } from '../../constants/helpers';
import CustomAgGrid, { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';
import CustomRenderCell from '../../components/Helpers/CustomRenderCell';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import { useData } from '../../StateProvider/Provider';
import EntitySelectionsDialog from '../../components/EntitySelections';
import { AiOutlineDeploymentUnit } from 'react-icons/ai';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import Chip from '@material-ui/core/Chip';
import useColumns, { getStaticFields, getFrameworkComponents } from '../../constants/useColumns';
import { prepareDataForGrid } from '../../constants/helpers';
import { useLocation } from 'react-router-dom';
import queryString from 'query-string';
import { MdAccountCircle } from 'react-icons/md';
import { AiFillCrown, MdAdd } from 'react-icons/all';
import CustomSwipableList from '../../components/SwipableListComponents/CustomSwipableList';
import { isMobile, isTablet } from 'react-device-detect';
import { useHistory } from 'react-router-dom';
import { camelCase } from 'lodash';

const Address = () => {
  const renderedFrom = camelCase(routes?.address.title)
  const location = useLocation();
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions, user, selectedEntity }
  }: any = useData();
  const { getColumnData } = useColumns();

  const [addressPermissions] = useState({
    isCreate: permissions?.address?.isCreate,
    isUpdate: permissions?.address?.isUpdate,
    isRead: permissions?.address?.isRead,
    isDelete: permissions?.address?.isDelete
  });

  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [open, setOpen] = useState({ title: '', open: false, isClone: false, edit: false });
  const [addressResource, setAddressResource] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showEntityDialog, setShowEntityDialog] = useState(false);
  const [addressId, setAddressId] = useState('');
  const [entities, setEntities] = useState([]);
  const [showUpdateWarningConfirmBox, setShowUpdateWarningConfirmBox] = useState(false);
  const [columns, setColumns] = useState([]);
  const [frameWorkComponent, setFrameWorkComponent] = useState({});

  //  Grid Variables - Start
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows } = state;
  const [isAllChecked, setIsAllChecked] = useState(false);
  const [clonedData, setClonedData] = useState([]);
  const localStorageSelectedRecords = `${renderedFrom}_selected`;

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

  const storedRoutes = localStorage.getItem('routes') ? JSON.parse(localStorage.getItem('routes')) : null;

  // useEffect(() => {
  //   const parsedParams = queryString.parse(location?.search);
  //   if (parsedParams?.id) {
  //     setAddressResource({ id: parsedParams?.id });
  //     setOpen({ open: true, isClone: false });
  //   }
  // }, [location])

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = () => {
    axiosInstance()
      .get('/field?resource=Address')
      .then(({ data: { data } }) => {
        let columns = [];
        let rendererNames = [];
        data.forEach((o) => {
          if (o?.fieldData?.primaryField === true) {
            columns = [
              ...columns,
              {
                field: o?.fieldData?.fieldName,
                headerName: o?.fieldData?.fieldLabel,
                primaryField: true,
                show: true,
                disabled: true,
                cellRenderer: 'nameRenderer'
              }
            ];
          } else {
            let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.address.path);

            if (currentColumn !== null) {
              columns = [...columns, currentColumn?.columnData];
              if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
                rendererNames.push(currentColumn?.rendererName);
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

  const fetchAddresses = () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    if (gridApi) {
      gridApi.setRowData([]);
    }

    axiosInstance()
      .get(`/address${queryString}`)
      .then(
        ({
          data: {
            data: { data, count }
          }
        }) => {
          let rows = data.map((u) => {
            let finalObject = prepareDataForGrid(u, user);
            finalObject['canDelete'] = addressPermissions.isDelete;
            finalObject['allowedToEdit'] = addressPermissions.isUpdate;
            finalObject['isChecked'] = false;

            return finalObject;
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

          dispatch({ type: 'initialize', data: rows, count: count });
          setTimeout(() => {
            dispatch({ type: 'loading', loading: false });
          }, gridLoadingTimeout);
        }
      )
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  useEffect(() => {
    fetchAddresses();
  }, [page, limit, filters, sorting, search, selectedEntity]);

  const NameRenderer = (params) => (
    <span className="d-flex gap-2 align-items-center">
      <Link to={`${routes.addressDetail.path}/${params.data._id}`}>
        <span
          className="link"
          onClick={() => {
            if (params.data?.isAllowedToUpdate) {
              setAddressResource(params.data);
              setOpen({ title: `Edit Address`, open: true, edit: true, isClone: false });
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
        className={addressPermissions.isCreate ? '' : 'cursor-stop'}
        title={addressPermissions.isCreate ? 'Clone' : 'You do not have permission to clone/create'}
      >
        <span>
          <IconButton
            disabled={!addressPermissions.isCreate}
            size="small"
            aria-label="Clone"
            onClick={() => {
              setAddressResource(params.data);
              setOpen({ title: 'Clone Address', open: true, edit: false, isClone: true });
            }}
          >
            <FileCopyIcon fontSize="small" color="primary" />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip
        className={addressPermissions.isDelete && params?.data?.createdById === user?.user?._id ? '' : 'cursor-stop'}
        title={addressPermissions.isDelete && params?.data?.createdById === user?.user?._id ? 'Delete' : "You don't have permission to delete"}
      >
        <span>
          <IconButton
            disabled={!addressPermissions.isDelete && params?.dataa?.createdById !== user?.user?._id}
            aria-label="Delete"
            onClick={() => {
              setDeleteRecord(params.data);
              setShowDeleteConfirmBox(true);
            }}
          >
            <DeleteIcon fontSize="small" color="error" />
          </IconButton>
        </span>
      </Tooltip>
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
      .put(`/address/remove`, { ids: ids })
      .then(() => {
        fetchAddresses();
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
        {/* <Grid item md={8} sm={1} xs={2}>
          <ImportExportLinks
            permissions={addressPermissions}
            module="address"
            api={'address'}
            afterImportCompleted={() => {
              fetchAddresses();
            }}
            isExportAllOrSomeFeature={true}
            total={rowCount}
            recordsToExport={selectedRecords.length}
            ids={selectedRecords.length ? selectedRecords.map((obj) => obj._id) : []}
            onExportToExcelSuccess={() => {
              if (gridApi) gridApi.deselectAll();
              else fetchAddresses();
            }}
          />
        </Grid> */}
      </Grid>
      <CustomContainer>
        <div className="header-panel">
          <Grid container className={styles.filter_side_container}>
            <Grid item md={6} sm={6} xs={12} className="d-flex align-items-center gap-1">
              <FaWarehouse size={20} style={{ paddingBottom: '3px' }} /> <span className="listingHeader">Address</span>
            </Grid>
            <Grid
              item
              md={6}
              sm={12}
              xs={12}
              className={`d-flex align-items-center gap-1 ${styles.filter_side}`}
              justify={isMobile ? 'flex-start' : 'flex-end'}
            >
              <Box className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} component="div">
                <Grid style={{ display: 'flex', flex: 1 }}>
                  <SearchBox
                    onSearch={handleSearch}
                    searchbox={styles.search_box_input}
                    width={isMobile ? '200px' : '242px'}
                    style={isMobile ? { flex: 1 } : {}}
                    size="small"
                    value={search}
                    placeholder={`Search ${routes.address.title}`}
                  />
                </Grid>

                <Grid style={{ display: 'flex', gap: '5px' }}>
                  {addressPermissions.isCreate && (
                    <Button
                      onClick={() => {
                        setAddressResource(null);
                        setOpen({ title: 'Add New Address', open: true, edit: false, isClone: false });
                      }}
                      variant={isMobile && !isTablet ? 'text' : 'contained'}
                      size="small"
                      color="primary"
                      className={isMobile && !isTablet ? 'mobile_button' : styles.add_submit_btn}
                      startIcon={isMobile && !isTablet ? null : <AddOutlined />}
                    >
                      {isMobile && !isTablet ? <MdAdd size={23} /> : 'Add'}
                    </Button>
                  )}

                  {addressPermissions.isDelete && (
                    <>
                      {' '}
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
                      </Menu>{' '}
                    </>
                  )}
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
              permissions={permissions.address}
              primaryField={columns?.find((d) => d.field)}
              onClick={(data) => {
                history.push(`${routes.warehouseDetail.path}/${data._id}`);
              }}
              dataRows={dataRows}
              selectedRecords={selectedRecords}
              dispatch={dispatch}
              onEdit={(data) => {
                history.push(`${routes.address.path}/${data._id}?openEdit=true`);
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
              owerCollaboratorInitialsOrImages=""
              onCreate={false}
              showClone={false}
              onClone={() => { }}
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
              actionWidth={110}
              loading={loading}
              renderedFrom={renderedFrom}
              refreshGrid={fetchAddresses}
            />
          )
        ) : null}

        {showDeleteConfirmBox && (
          <ConfirmationDialog
            open={showDeleteConfirmBox}
            message={`Are you sure you want to delete Address ?`}
            onClose={() => {
              setDeleteRecord(null);
              setShowDeleteConfirmBox(false);
            }}
            onOk={handleDelete}
          />
        )}

        {open?.open && (
          <ManageAddressDialog
            onClose={() => setOpen({ title: '', open: false, edit: false, isClone: false })}
            onSuccess={() => {
              setOpen({ title: '', open: false, edit: false, isClone: false });
              fetchAddresses();
            }}
          />
        )}
        {showUpdateWarningConfirmBox ? (
          <MessageDialog
            open={showUpdateWarningConfirmBox}
            message={`You are trying to update records which you do not have permission to update, Please remove those records from selection and try again.`}
            onClose={() => setShowUpdateWarningConfirmBox(false)}
          />
        ) : null}
      </CustomContainer>
    </Fragment>
  );
};

export default Address;
