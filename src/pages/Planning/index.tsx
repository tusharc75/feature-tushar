import { Box, Button, Chip, IconButton } from '@material-ui/core';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomContainer from '../../components/CustomContainer';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import {
  PLANNING_STATUS,
  getLocalStorageArrayData,
  gridLoadingTimeout,
  prepareDataForGrid,
  removeLocalStorage,
  sidebarResource
} from '../../constants/helpers';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import { camelCase } from 'lodash';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTableNew';
import ManagePlanning from './ManagePlanning';
import SearchBox from 'src/components/Helpers/SearchBox';
import styles from '../Leads/Header.module.scss';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import { Menu, MenuItem } from '@material-ui/core';
import { ToggleButtonGroup, ToggleButton } from '@material-ui/lab';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import DeleteIcon from '@material-ui/icons/Delete';
import AutorenewIcon from '@material-ui/icons/Autorenew';
import VisibilityIcon from '@material-ui/icons/Visibility';
import queryString from 'query-string';
let searchTimeout;

const Planning = () => {
  const renderedFrom = camelCase(routes?.planning.title);
  const localStorageSelectedRecords = `${renderedFrom}_selected`;
  const toastConfig = useContext(CustomToastContext);

  const types = [
    {
      key: `My ${routes.planning.title}`,
      value: 1
    },
    {
      key: `All ${routes.planning.title}`,
      value: 2
    }
  ];

  const history = useHistory();
  const { state, dispatch } = useTableReducer();
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { getColumnData } = useColumns();

  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();

  // const [selectedType, setSelectedType] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState({ open: false, isClone: false, idToClone: null });
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [showConverConfirmBox, setShowConverConfirmBox] = useState({ open: false, id: null, planningNumber: '' });
  const { type }: any = queryString.parse(history.location.search);
  const [selectedPlanningType, setSelectedPlanningType] = useState(history.location.state);
  const [selectedType, setSelectedType] = useState(type ? parseInt(type) : 1);
  const [columns, setColumns] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    let millisec = Object.keys(search).length > 0 ? 600 : 5;
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    searchTimeout = setTimeout(() => {
      fetchData();
    }, millisec);
  }, [search]);

  useEffect(() => {
    fetchData();
  }, [page, limit, selectedType, filters, sorting, selectedEntity, showFilteredRecordsOnly]);

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=${sidebarResource?.planning}`);
    data = response?.data?.data;
    let columns = [];
    data.forEach((o) => {
      let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.planningDetail.path, true);
      if (currentColumn !== null) {
        columns = [...columns, currentColumn?.columnData];
      }
      return o?.fieldData;
    });
    columns = [...columns, ...getStaticFields(), ActionsRenderer];
    setColumns(columns);
  };

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 150,
    width: 150,
    sticky: 'right',
    disableFilters: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        {permissions?.planning?.isCreate ? (
          <HtmlTooltip title="Clone">
            <IconButton
              size="small"
              aria-label="Clone"
              onClick={() => {
                setShowManageDialog({ open: true, isClone: true, idToClone: row.original._id });
              }}
            >
              <FileCopyIcon fontSize="small" color="primary" />
            </IconButton>
          </HtmlTooltip>
        ) : (
          <HtmlTooltip className="cursor-stop" title="You do not have permission to clone/create">
            <IconButton aria-label="Clone" size="small">
              <FileCopyIcon fontSize="small" />
            </IconButton>
          </HtmlTooltip>
        )}
        {row?.original?.status === PLANNING_STATUS.converted ? (
          <HtmlTooltip title={`View Converted ${row?.original?.type}`}>
            <span>
              <IconButton
                aria-label="Convert"
                onClick={() => {
                  let newPath = '';
                  if (row?.original?.type === 'Rental Job') {
                    newPath = `${routes.rentalManagementDetail.path}/${row?.original?.rentalJobId}`;
                  }
                  if (row?.original?.type === 'Sales Order') {
                    newPath = `${routes.salesOrderDetail.path}/${row?.original?.salesOrderId}`;
                  }
                  if (row?.original?.type === 'Field Service Order') {
                    newPath = `${routes?.fieldServiceOrderDetail.path}/${row?.original?.fieldServiceOrderId}`;
                  }
                  if (newPath) {
                    window.open(newPath, '_blank');
                  }
                }}
              >
                <VisibilityIcon fontSize="small" color={'primary'} />
              </IconButton>
            </span>
          </HtmlTooltip>
        ) : (
          <HtmlTooltip title={permissions?.planning?.isUpdate ? 'Convert' : 'You do not have permission to convert'}>
            <span>
              <IconButton
                disabled={permissions?.planning?.isUpdate ? false : true}
                aria-label="Convert"
                onClick={() => {
                  setShowConverConfirmBox({ open: true, id: row?.original?._id, planningNumber: row?.original?.planningNumber });
                }}
              >
                <AutorenewIcon fontSize="small" color={permissions?.planning?.isUpdate ? 'primary' : 'disabled'} />
              </IconButton>
            </span>
          </HtmlTooltip>
        )}
        {row?.original?.canDelete && (
          <HtmlTooltip title="Delete">
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
          </HtmlTooltip>
        )}
      </>
    )
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

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    axiosInstance()
      .get(`${routes?.planning?.path}${queryString}`)
      .then(({ data: { data } }) => {
        let count = data?.count;
        let rows = data?.data?.map((u) => {
          let finalObject: any = prepareDataForGrid(u, user);
          finalObject['isChecked'] = selectedRecords?.some((s) => s._id === u._id);
          finalObject['allowedToEdit'] = permissions?.planning?.isUpdate;
          finalObject['canDelete'] = permissions?.planning?.isDelete && finalObject?.ownerId === user?.user?._id && u?.canDelete;
          return finalObject;
        });
        dispatch({ type: 'initialize', data: rows, count: count });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      })
      .finally(() => {
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      });
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const handleDelete = () => {
    setIsSubmitting(true);
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.map((d) => d._id);
    }
    axiosInstance()
      .put(`${routes?.planning?.path}/remove`, { ids: ids })
      .then(() => {
        removeLocalStorage(localStorageSelectedRecords);
        fetchData();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
        setAnchorEl(null);
        setIsSubmitting(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setIsSubmitting(false);
      });
  };

  const handleConvert = () => {
    axiosInstance()
      .post(`${routes?.planning?.path}/convert-planning`, { id: showConverConfirmBox?.id })
      .then(({ data }) => {
        setShowConverConfirmBox({ open: false, id: null, planningNumber: '' });
        fetchData();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
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

  const onTypeChange = (event, type) => {
    dispatch({ type: 'pageChange', page: 0 });
    const value = types.find((d) => d.key === type).value;
    setSelectedType(value);
    history.push(`?type=${value}`);
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[routes.planning]} />
        <ImportExportLinks
          permissions={permissions?.planning}
          module="planning"
          api={routes?.planning?.path}
          afterImportCompleted={() => {}}
          isExportAllOrSomeFeature={true}
          total={rowCount}
          recordsToExport={getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length}
          ids={
            getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length
              ? getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.map((obj) => obj._id)
              : []
          }
          onExportToExcelSuccess={() => {
            fetchData();
          }}
          additionalParams={getQueryString(true)}
        />
      </div>
      <CustomContainer>
        <div className="header-panel">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={'d-flex align-items-center gap-1'}>
              <ToggleButtonGroup
                size="small"
                className="align-items-center gap-1 "
                value={types[selectedType - 1].key}
                exclusive
                onChange={onTypeChange}
              >
                {types.map((k, index) => {
                  return (
                    <ToggleButton value={k.key} key={index}>
                      {k.key}
                    </ToggleButton>
                  );
                })}
              </ToggleButtonGroup>
              {permissions?.planningView?.isRead && (
                <Box ml={1}>
                  <ToggleButtonGroup size="small">
                    <ToggleButton
                      onClick={() => {
                        history.push({
                          pathname: routes.planningView.path,
                          state: {
                            resource: sidebarResource?.planning
                          }
                        });
                      }}
                    >
                      <span>{`Calendar`}</span>
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              )}
              {selectedPlanningType && (
                <Chip
                  className="ml-3"
                  color="primary"
                  label={'Type: Rental Job'}
                  onDelete={() => {
                    setSelectedPlanningType(null);
                  }}
                />
              )}
            </div>
            <div className="flex flex-wrap gap-[8px] justify-end">
              <SearchBox onChange={handleSearch} className={styles.search_box_input} value={search} size="small" />
              <div className="flex gap-[8px] flex-wrap items-center">
                <Button
                  variant={'contained'}
                  color="primary"
                  size="small"
                  className={`no-shadow`}
                  onClick={() => {
                    setShowManageDialog({ open: true, isClone: false, idToClone: null });
                  }}
                  startIcon={<AddOutlined />}
                >
                  Add
                </Button>
                {permissions?.planning?.isDelete && (
                  <>
                    <Button
                      variant={'outlined'}
                      color="default"
                      size="small"
                      onClick={openActions}
                      className={`new-dropdown-v1`}
                      aria-controls="action-menu"
                      endIcon={<ExpandMore />}
                      disabled={selectedRecords?.length ? false : true}
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
                      disabled={
                        !(
                          (selectedRecords?.length > 0 && selectedRecords?.filter((e) => e?.canDelete === true)?.length) === selectedRecords?.length
                        )
                      }
                        onClick={() => {
                          closeActions();
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
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            onSelect={() => {}}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            isClientSideGrid={false}
            refreshGrid={fetchData}
            showOnlyShowFilteredRecordSwitch={true}
            showFilters={true}
            resource={sidebarResource.planning}
          />
        ) : null}
      </CustomContainer>
      {showDeleteConfirmBox && (
        <ConfirmationDialog
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete ${routes?.planning?.title} ${deleteRecord?.planningNumber || ''} ?`}
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          okBtnLoading={isSubmitting}
          onOk={handleDelete}
        />
      )}
      {showConverConfirmBox.open && (
        <ConfirmationDialog
          open={true}
          message={`Are you sure you want to convert planning  ${showConverConfirmBox?.planningNumber} ?`}
          onClose={() => {
            setShowConverConfirmBox({ open: false, id: null, planningNumber: '' });
          }}
          onOk={handleConvert}
        />
      )}
      {showManageDialog.open && (
        <ManagePlanning
          isClone={showManageDialog.isClone}
          id={showManageDialog.idToClone}
          onClose={() => setShowManageDialog({ open: false, isClone: false, idToClone: null })}
          onSuccess={() => {
            fetchData();
            setShowManageDialog({ open: false, isClone: false, idToClone: null });
          }}
        />
      )}
    </section>
  );
};

export default Planning;

// import { Box, Button, Chip, Grid, IconButton, Menu, MenuItem, Tooltip } from '@material-ui/core';
// import { Fragment, useContext, useEffect, useReducer, useState } from 'react';
// import { isMobile, isTablet } from 'react-device-detect';
// import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
// import CustomContainer from 'src/components/CustomContainer';
// import ImportExportLinks from 'src/components/Helpers/ImportExportLinks';
// import routes from 'src/components/Helpers/Routes';
// import SearchBox from 'src/components/Helpers/SearchBox';
// import { camelCase } from 'lodash';
// import useColumns, { getStaticFields, getFrameworkComponents, gridFilterParser } from '../../constants/useColumns';
// import { useData } from 'src/StateProvider/Provider';
// import CustomAgGrid, { intialState, reducer } from '../../components/AgGridComponents/CustomAgGrid';
// import { AddOutlined, ExpandMore } from '@material-ui/icons';
// import { MdAdd } from 'react-icons/md';
// import CustomSwipableList from 'src/components/SwipableListComponents/CustomSwipableList';
// import axiosInstance from 'src/axios/axiosInstance';
// import {
//   PLANNING_STATUS,
//   getLocalStorageArrayData,
//   gridLoadingTimeout,
//   isObjectEmpty,
//   prepareDataForGrid,
//   removeLocalStorage,
//   sidebarResource
// } from 'src/constants/helpers';
// import { Link } from 'react-router-dom';
// import DeleteIcon from '@material-ui/icons/Delete';
// import FileCopyIcon from '@material-ui/icons/FileCopy';
// import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
// import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
// import ManagePlanning from './ManagePlanning';
// import styles from '../Leads/Header.module.scss';
// import HtmlTooltip from 'src/components/CustomTooltipTitle';
// import AutorenewIcon from '@material-ui/icons/Autorenew';
// import VisibilityIcon from '@material-ui/icons/Visibility';
// import { useHistory } from 'react-router-dom';
// import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
// import queryString from 'query-string';

// const Planning = () => {
//   const PlanningType = [
//     {
//       key: `My ${routes?.planning.title}`,
//       value: 1
//     },
//     {
//       key: `All ${routes?.planning.title}`,
//       value: 2
//     }
//   ];

//   const renderedFrom = camelCase(routes?.planning.title);
//   const localStorageSelectedRecords = `${renderedFrom}_selected`;

//   const toastConfig = useContext(CustomToastContext);
//   const history = useHistory();

//   const {
//     state: { permissions, selectedEntity, user }
//   }: any = useData();
//   const [state, dispatch] = useReducer(reducer, intialState);
//   const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } =
//     state;
//   const { type }: any = queryString.parse(history.location.search);

//   const [selectedPlanningType, setSelectedPlanningType] = useState(history.location.state);
//   const [planningId, setPlanningId] = useState(null);
//   const [open, setOpen] = useState({ open: false, isClone: false });
//   const [anchorEl, setAnchorEl] = useState(null);
//   const [deleteRecord, setDeleteRecord] = useState(null);
//   const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
//   const [showConverConfirmBox, setShowConverConfirmBox] = useState({ open: false, id: null, planningNumber: '' });
//   const [frameWorkComponent, setFrameWorkComponent] = useState({});
//   const [columns, setColumns] = useState([]);
//   const [gridApi, setGridApi] = useState(null);
//   const [selectedType, setSelectedType] = useState(type ? parseInt(type) : 1);
//   const { getColumnData } = useColumns();

//   const fetchGridColumns = () => {
//     axiosInstance()
//       .get(`/field?resource=${sidebarResource?.planning}`)
//       .then(({ data: { data } }) => {
//         let columns = [];
//         let rendererNames = [];
//         data.forEach((o) => {
//           let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.planningDetail.path, true);
//           if (currentColumn !== null) {
//             columns = [...columns, currentColumn?.columnData];
//             if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
//               rendererNames.push(currentColumn?.rendererName);
//             }
//           }
//         });
//         let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
//         tempFrameworkComponent = {
//           ...tempFrameworkComponent,
//           actionsRenderer: ActionsRenderer
//         };
//         setFrameWorkComponent({ ...tempFrameworkComponent });
//         columns = [...columns, ...getStaticFields()];
//         setColumns([...columns]);
//       });
//   };

//   const fetchData = () => {
//     dispatch({ type: 'loading', loading: true });
//     const queryString = getQueryString();

//     if (gridApi) {
//       gridApi.setRowData([]);
//     }
//     axiosInstance()
//       .get(`${routes?.planning.path}${queryString}`)
//       .then(({ data: { data } }) => {
//         let count = data?.count;
//         let rows = data?.data?.map((u: any) => {
//           let finalObject: any = prepareDataForGrid(u);
//           finalObject['canDelete'] = permissions?.planning?.isDelete && finalObject?.ownerId === user?.user?._id && u?.canDelete;
//           finalObject['isChecked'] = selectedRecords?.some((s) => s._id === u._id);
//           finalObject['allowedToEdit'] = permissions?.planning?.isUpdate;
//           return {
//             ...finalObject
//           };
//         });
//         if (appendRows) {
//           dispatch({
//             type: 'initialize',
//             data: [...dataRows, ...rows],
//             count: count,
//             selectedRecords: [...dataRows, ...rows].filter((f) => f.isChecked === true)
//           });
//         } else {
//           dispatch({
//             type: 'initialize',
//             data: rows,
//             count: count,
//             selectedRecords: rows.filter((f) => f.isChecked === true)
//           });
//         }
//         dispatch({ type: 'initialize', data: rows, count: count });
//         setTimeout(() => {
//           dispatch({ type: 'loading', loading: false });
//         }, gridLoadingTimeout);
//       });
//   };

//   const getQueryString = (isExport = false) => {
//     let deepFilter = `?page=${page}&limit=${limit}`;

//     if (isExport) {
//       deepFilter = `?`;
//     }

//     if (selectedType === 1) {
//       deepFilter = deepFilter + `&myRecords=1`;
//     }

//     if (selectedEntity) {
//       deepFilter = `${deepFilter}&entity=${selectedEntity}`;
//     }

//     const { filterByIds, deepFilters } = gridFilterParser(filters);

//     if (selectedPlanningType) {
//       deepFilters.push({
//         field: 'type',
//         term: selectedPlanningType
//       });
//     }

//     if (filterByIds?.length) {
//       deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterByIds)}`;
//     }
//     if (deepFilters?.length) {
//       deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(deepFilters))}`;
//     }
//     if (filterByIds?.length || deepFilters?.length) {
//       deepFilter = `${deepFilter}&filterType=and`;
//     }

//     if (sorting.length > 0) {
//       deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
//     }

//     if (search) {
//       deepFilter = `${deepFilter}&search=${encodeURIComponent(search)}`;
//     }
//     if (showFilteredRecordsOnly) {
//       const savedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
//       deepFilter = `${deepFilter}&getById=${JSON.stringify(savedRecords.map((m) => m._id))}`;
//     }
//     return deepFilter;
//   };

//   const openActions = (event) => {
//     setAnchorEl(event.currentTarget);
//   };

//   const closeActions = () => {
//     setAnchorEl(null);
//   };

//   const handleSearch = (e) => {
//     dispatch({ type: 'search', search: e.target.value });
//   };

//   const handleConvert = () => {
//     axiosInstance()
//       .post(`${routes?.planning?.path}/convert-planning`, { id: showConverConfirmBox?.id })
//       .then(({ data }) => {
//         setShowConverConfirmBox({ open: false, id: null, planningNumber: '' });
//         fetchData();
//         toastConfig.setToastConfig({
//           open: true,
//           type: 'success',
//           message: data?.message
//         });
//       })
//       .catch((error) => {
//         toastConfig.setToastConfig(error);
//       });
//   };

//   const ActionsRenderer = (params) => (
//     <Fragment>
//       <HtmlTooltip title={permissions?.planning?.isCreate ? 'Clone' : 'You do not have permission to clone/create'}>
//         <span>
//           <IconButton
//             disabled={permissions?.planning?.isCreate ? false : true}
//             aria-label="Clone"
//             size="small"
//             onClick={() => {
//               setPlanningId(params.data.id);
//               setOpen({ open: true, isClone: true });
//             }}
//           >
//             <FileCopyIcon fontSize="small" color={permissions?.planning?.isCreate ? 'primary' : 'disabled'} />
//           </IconButton>
//         </span>
//       </HtmlTooltip>
//       {params?.data?.status === PLANNING_STATUS.converted ? (
//         <HtmlTooltip title={`View Converted ${params?.data?.type}`}>
//           <span>
//             <IconButton
//               aria-label="Convert"
//               onClick={() => {
//                 let newPath = '';
//                 if (params?.data?.type === 'Rental Job') {
//                   newPath = `${routes.rentalManagementDetail.path}/${params?.data?.rentalJobId}`;
//                 }
//                 if (params?.data?.type === 'Sales Order') {
//                   newPath = `${routes.salesOrderDetail.path}/${params?.data?.salesOrderId}`;
//                 }
//                 if (params?.data?.type === 'Field Service Order') {
//                   newPath = `${routes?.fieldServiceOrderDetail.path}/${params?.data?.fieldServiceOrderId}`;
//                 }
//                 if (newPath) {
//                   window.open(newPath, '_blank');
//                 }
//               }}
//             >
//               <VisibilityIcon fontSize="small" color={'primary'} />
//             </IconButton>
//           </span>
//         </HtmlTooltip>
//       ) : (
//         <HtmlTooltip title={permissions?.planning?.isUpdate ? 'Convert' : 'You do not have permission to convert'}>
//           <span>
//             <IconButton
//               disabled={permissions?.planning?.isUpdate ? false : true}
//               aria-label="Convert"
//               onClick={() => {
//                 setShowConverConfirmBox({ open: true, id: params?.data?._id, planningNumber: params?.data?.planningNumber });
//               }}
//             >
//               <AutorenewIcon fontSize="small" color={permissions?.planning?.isUpdate ? 'primary' : 'disabled'} />
//             </IconButton>
//           </span>
//         </HtmlTooltip>
//       )}
//       <HtmlTooltip title={params?.data?.canDelete ? 'Delete' : 'You do not have permission to delete'}>
//         <span>
//           <IconButton
//             disabled={params?.data?.canDelete ? false : true}
//             aria-label="Delete"
//             size="small"
//             onClick={() => {
//               setDeleteRecord(params.data);
//               setShowDeleteConfirmBox(true);
//             }}
//           >
//             <DeleteIcon fontSize="small" color={params?.data?.canDelete ? 'error' : 'disabled'} />
//           </IconButton>
//         </span>
//       </HtmlTooltip>
//     </Fragment>
//   );

//   const handleDelete = () => {
//     let ids = [];
//     if (deleteRecord) {
//       ids.push(deleteRecord._id);
//     } else {
//       ids = selectedRecords.map((m) => m._id);
//     }
//     axiosInstance()
//       .put(`${routes?.planning?.path}/remove`, { ids: ids })
//       .then(({ data }) => {
//         removeLocalStorage(localStorageSelectedRecords);
//         fetchData();
//         setShowDeleteConfirmBox(false);
//         setDeleteRecord(null);
//         toastConfig.setToastConfig({
//           open: true,
//           type: 'success',
//           message: data?.message
//         });
//       })
//       .catch((error) => {
//         toastConfig.setToastConfig(error);
//       });
//   };

//   useEffect(() => {
//     fetchGridColumns();
//   }, []);

//   const onTypeChange = (event, type) => {
//     dispatch({ type: 'setPage', page: 0 });
//     const value = PlanningType.find((d) => d.key === type).value;
//     setSelectedType(value);
//     history.push(`?type=${value}`);
//   };

//   useEffect(() => {
//     fetchData();
//   }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly, selectedType, selectedPlanningType]);

//   return (
//     <section className="main-container-v1">
//       <div className="headerbox-v1">
//         <CustomBreadCrumbs routes={[{ title: routes.planning.title }]} />
//         <ImportExportLinks
//           permissions={permissions?.planning}
//           module="planning"
//           api={'planning'}
//           afterImportCompleted={() => {
//             fetchData();
//           }}
//           isExportAllOrSomeFeature={true}
//           total={rowCount}
//           recordsToExport={getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length}
//           ids={
//             getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length
//               ? getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.map((obj) => obj._id)
//               : []
//           }
//           onExportToExcelSuccess={() => {
//             if (gridApi) gridApi.deselectAll();
//             else fetchData();
//           }}
//           additionalParams={getQueryString(true)}
//         />
//       </div>
//       <CustomContainer>
//         <div className="header-panel">
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
//             <div className={'d-flex align-items-center gap-1'}>
//               <ToggleButtonGroup
//                 size="small"
//                 className="align-items-center gap-1"
//                 value={PlanningType[selectedType - 1].key}
//                 exclusive
//                 onChange={onTypeChange}
//               >
//                 {PlanningType.map((k, index) => {
//                   return (
//                     <ToggleButton value={k.key} key={index}>
//                       {k.key}
//                     </ToggleButton>
//                   );
//                 })}
//               </ToggleButtonGroup>
//               {permissions?.planningView?.isRead && (
//                 <Box ml={1}>
//                   <ToggleButtonGroup size="small">
//                     <ToggleButton
//                       onClick={() => {
//                         history.push({
//                           pathname: routes.planningView.path,
//                           state: {
//                             resource: sidebarResource?.planning
//                           }
//                         });
//                       }}
//                     >
//                       <span>{`Calendar`}</span>
//                     </ToggleButton>
//                   </ToggleButtonGroup>
//                 </Box>
//               )}
//               {selectedPlanningType && (
//                 <Chip
//                   className="ml-3"
//                   color="primary"
//                   label={'Type: Rental Job'}
//                   onDelete={() => {
//                     setSelectedPlanningType(null);
//                   }}
//                 />
//               )}
//             </div>
//             <div className="flex flex-wrap gap-[8px]  justify-end">
//               <SearchBox onChange={handleSearch} className={styles.search_box_input} size="small" value={search} />
//               <div className="flex gap-[8px] flex-wrap items-center">
//                 {permissions?.planning?.isCreate && (
//                   <Button
//                     className={'no-shadow'}
//                     onClick={() => {
//                       setPlanningId(null);
//                       setOpen({ open: true, isClone: false });
//                     }}
//                     variant={'contained'}
//                     size="small"
//                     color="primary"
//                     startIcon={<AddOutlined />}
//                   >
//                     Add
//                   </Button>
//                 )}
//                 {permissions?.planning?.isDelete && (
//                   <>
//                     <Button
//                       variant={'outlined'}
//                       color="default"
//                       size="small"
//                       onClick={openActions}
//                       disabled={selectedRecords.length ? false : true}
//                       aria-controls="action-menu"
//                       className={`new-dropdown-v1`}
//                       endIcon={<ExpandMore />}
//                     >
//                       Actions
//                     </Button>
//                     <Menu
//                       anchorEl={anchorEl}
//                       keepMounted
//                       getContentAnchorEl={null}
//                       anchorOrigin={{
//                         vertical: 'bottom',
//                         horizontal: 'left'
//                       }}
//                       id="action-menu"
//                       open={Boolean(anchorEl)}
//                       onClose={closeActions}
//                     >
//                       <MenuItem
//                         disabled={
//                           !(
//                             (selectedRecords?.length > 0 && selectedRecords?.filter((e) => e?.canDelete === true)?.length) === selectedRecords?.length
//                           )
//                         }
//                         onClick={() => {
//                           closeActions();
//                           if (selectedRecords.length === 1) {
//                             setDeleteRecord(selectedRecords[0]);
//                           }
//                           setShowDeleteConfirmBox(true);
//                         }}
//                       >
//                         Delete
//                       </MenuItem>
//                     </Menu>
//                   </>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//         {Object.keys(frameWorkComponent).length > 0 ? (
//           isMobile && !isTablet ? (
//             <CustomSwipableList
//               key={selectedType}
//               allowSelection={true}
//               allowSwipe={true}
//               permissions={permissions?.planning}
//               primaryField={columns?.find((d) => d.primaryField)}
//               onClick={(data) => {
//                 setPlanningId(data.id);
//                 setOpen({ open: true, isClone: false });
//               }}
//               dataRows={dataRows}
//               selectedRecords={selectedRecords}
//               dispatch={dispatch}
//               onEdit={(data) => {
//                 setPlanningId(data.id);
//                 setOpen({ open: true, isClone: false });
//               }}
//               extraParamsToCheckDelete={true}
//               onDelete={(data) => {
//                 setDeleteRecord(data);
//                 setShowDeleteConfirmBox(true);
//               }}
//               rowCount={rowCount}
//               page={page}
//               loading={loading}
//               additionalDetails={[]}
//               owerCollaboratorInitialsOrImages=""
//               onCreate={false}
//               showClone={true}
//               onClone={(data) => {
//                 setPlanningId(data.id);
//                 setOpen({ open: true, isClone: true });
//               }}
//               chips={[]}
//               renderedFrom={renderedFrom}
//             />
//           ) : (
//             <CustomAgGrid
//               columns={columns}
//               dataRows={dataRows}
//               frameworkComponents={frameWorkComponent}
//               setGridApi={setGridApi}
//               dispatch={dispatch}
//               rowCount={rowCount}
//               limit={limit}
//               pageSizes={pageSizes}
//               page={page}
//               allowAction={true}
//               loading={loading}
//               renderedFrom={renderedFrom}
//               refreshGrid={fetchData}
//               showOnlyShowFilteredRecordSwitch={true}
//               showFilters={true}
//               resource={sidebarResource.planning}
//             />
//           )
//         ) : null}
//         {showDeleteConfirmBox && (
//           <ConfirmationDialog
//             open={showDeleteConfirmBox}
//             message={`Are you sure you want to delete planning  ${deleteRecord?.planningNumber || ''} ?`}
//             onClose={() => {
//               setDeleteRecord(null);
//               setShowDeleteConfirmBox(false);
//             }}
//             onOk={handleDelete}
//           />
//         )}
//         {showConverConfirmBox.open && (
//           <ConfirmationDialog
//             open={true}
//             message={`Are you sure you want to convert planning  ${showConverConfirmBox?.planningNumber} ?`}
//             onClose={() => {
//               setShowConverConfirmBox({ open: false, id: null, planningNumber: '' });
//             }}
//             onOk={handleConvert}
//           />
//         )}
//         {open?.open && (
//           <ManagePlanning
//             id={planningId}
//             isClone={open?.isClone}
//             onClose={() => setOpen({ open: false, isClone: false })}
//             onSuccess={() => {
//               setOpen({ open: false, isClone: false });
//               fetchData();
//             }}
//           />
//         )}
//       </CustomContainer>
//     </section>
//   );
// };

// export default Planning;
