import { Box, Button, Chip, Grid, IconButton, Menu, MenuItem, Tooltip } from '@material-ui/core';
import { Fragment, useContext, useEffect, useReducer, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import ImportExportLinks from 'src/components/Helpers/ImportExportLinks';
import routes from 'src/components/Helpers/Routes';
import SearchBox from 'src/components/Helpers/SearchBox';
import { camelCase } from 'lodash';
import useColumns, { getStaticFields, getFrameworkComponents } from '../../constants/useColumns';
import { useData } from 'src/StateProvider/Provider';
import CustomAgGrid, { intialState, reducer } from '../../components/AgGridComponents/CustomAgGrid';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import { MdAdd } from 'react-icons/md';
import CustomSwipableList from 'src/components/SwipableListComponents/CustomSwipableList';
import axiosInstance from 'src/axios/axiosInstance';
import {
  getLocalStorageArrayData,
  gridLoadingTimeout,
  isObjectEmpty,
  prepareDataForGrid,
  removeLocalStorage,
  sidebarResource
} from 'src/constants/helpers';
import { Link } from 'react-router-dom';
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import ManagePlanning from './ManagePlanning';
import styles from '../Leads/Header.module.scss';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import AutorenewIcon from '@material-ui/icons/Autorenew';
import VisibilityIcon from '@material-ui/icons/Visibility';
import { useHistory } from 'react-router-dom';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import queryString from 'query-string';

const Planning = () => {

  const PlanningType = [
    {
      key: `All ${routes?.planning.title}`,
      value: 1
    },
    {
      key: `My ${routes?.planning.title}`,
      value: 2
    }
  ];

  const renderedFrom = camelCase(routes?.planning.title);
  const localStorageSelectedRecords = `${renderedFrom}_selected`;

  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();

  const {
    state: { permissions, selectedEntity, user }
  }: any = useData();
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } = state;
  const { type }: any = queryString.parse(history.location.search);

  const [selectedPlanningType, setSelectedPlanningType] = useState(history.location.state)
  const [planningId, setPlanningId] = useState(null);
  const [open, setOpen] = useState({ open: false, isClone: false });
  const [anchorEl, setAnchorEl] = useState(null);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [showConverConfirmBox, setShowConverConfirmBox] = useState({ open: false, id: null, planningNumber: "" });
  const [frameWorkComponent, setFrameWorkComponent] = useState({});
  const [columns, setColumns] = useState([]);
  const [gridApi, setGridApi] = useState(null);
  const [selectedType, setSelectedType] = useState(type ? parseInt(type) : 1);
  const { getColumnData } = useColumns();

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource?.planning}`)
      .then(({ data: { data } }) => {
        let columns = [];
        let rendererNames = [];
        data.forEach((o) => {
          let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.planningDetail.path);
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
    const queryString = getQueryString();

    if (gridApi) {
      gridApi.setRowData([]);
    }
    axiosInstance()
      .get(`${routes?.planning.path}${queryString}`)
      .then(({ data: { data } }) => {
        let count = data?.count;
        let rows = data?.data?.map((u: any) => {
          let finalObject: any = prepareDataForGrid(u);
          finalObject['canDelete'] = permissions?.planning?.isDelete && finalObject?.ownerId === user?.user?._id;
          finalObject['isChecked'] = selectedRecords?.some((s) => s._id === u._id);
          finalObject['allowedToEdit'] = permissions?.planning?.isUpdate;
          return {
            ...finalObject
          };
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
      });
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

  const getQueryString = (isExport = false) => {
    let deepFilter = !isExport ? `?page=${page}&limit=${limit}&filterPlanning=${selectedType}` : `?filterPlanning=${selectedType}`;
    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`;
    }

    const updatedFilters = [];

    if (selectedPlanningType) {
      updatedFilters.push({
        field: replaceFieldName('type'),
        term: selectedPlanningType
      });
    }

    if (!isObjectEmpty(filters)) {
      Object.keys(filters).forEach((field) => {
        updatedFilters.push({
          field: replaceFieldName(field),
          term: filters[field].filter
        });
      });
    }

    if (updatedFilters.length > 0) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURI(JSON.stringify(updatedFilters))}&filterType=and`;
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${replaceFieldName(sorting[0].colId)}&orderBy=${sorting[0].sort}`;
    }

    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURI(search)}`;
    }
    if (showFilteredRecordsOnly) {
      const savedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
      deepFilter = `${deepFilter}&getById=${JSON.stringify(savedRecords.map((m) => m._id))}`;
    }
    return deepFilter;
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

  const handleConvert = () => {
    axiosInstance().post(`${routes?.planning?.path}/convert-planning`, { id: showConverConfirmBox?.id })
      .then(({ data }) => {
        setShowConverConfirmBox({ open: false, id: null, planningNumber: "" });
        fetchData()
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }

  const ActionsRenderer = (params) => (
    <Fragment>
      <HtmlTooltip title={permissions?.planning?.isCreate ? "Clone" : "You do not have permission to clone/create"}>
        <span>
          <IconButton
            disabled={permissions?.planning?.isCreate ? false : true}
            aria-label="Clone"
            size="small"
            onClick={() => {
              setPlanningId(params.data.id);
              setOpen({ open: true, isClone: true });
            }}
          >
            <FileCopyIcon fontSize="small" color={permissions?.planning?.isCreate ? "primary" : "disabled"} />
          </IconButton>
        </span>
      </HtmlTooltip>
      {params?.data?.status === "Closed" ?
        <HtmlTooltip title={`View Converted ${params?.data?.type}`}>
          <span>
            <IconButton
              aria-label="Convert"
              onClick={() => {
                if (params?.data?.type === "Rental Job") {
                  history.push(`${routes.rentalManagementDetail.path}/${params?.data?.rentalJobId}`)
                }
                if (params?.data?.type === "Sales Order") {
                  history.push(`${routes.salesOrderDetail.path}/${params?.data?.salesOrderId}`)
                }
                if (params?.data?.type === "Field Service Order") {
                  history.push(`${routes.serviceOrderDetail.path}/${params?.data?.serviceOrderId}`)
                }
              }}
            >
              <VisibilityIcon fontSize="small" color={"primary"} />
            </IconButton>
          </span>
        </HtmlTooltip>
        : <HtmlTooltip title={permissions?.planning?.isUpdate ? "Convert" : "You do not have permission to convert"}>
          <span>
            <IconButton
              disabled={permissions?.planning?.isUpdate ? false : true}
              aria-label="Convert"
              onClick={() => {
                setShowConverConfirmBox({ open: true, id: params?.data?._id, planningNumber: params?.data?.planningNumber })
              }}
            >
              <AutorenewIcon fontSize="small" color={permissions?.planning?.isUpdate ? "primary" : "disabled"} />
            </IconButton>
          </span>
        </HtmlTooltip>}
      <HtmlTooltip title={params?.data?.canDelete ? "Delete" : "You do not have permission to delete"}>
        <span>
          <IconButton
            disabled={params?.data?.canDelete ? false : true}
            aria-label="Delete"
            size="small"
            onClick={() => {
              setDeleteRecord(params.data);
              setShowDeleteConfirmBox(true);
            }}
          >
            <DeleteIcon fontSize="small" color={params?.data?.canDelete ? "error" : "disabled"} />
          </IconButton>
        </span>
      </HtmlTooltip>
    </Fragment>
  );

  const handleDelete = () => {
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords.map((m) => m._id);
    }
    axiosInstance()
      .put(`${routes?.planning?.path}/remove`, { ids: ids })
      .then(({ data }) => {
        removeLocalStorage(localStorageSelectedRecords);
        fetchData();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
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

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const onTypeChange = (event, type) => {
    const value = PlanningType.find((d) => d.key === type).value;
    setSelectedType(value)
    history.push(`?type=${value}`);
  }

  useEffect(() => {
    fetchData();
  }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly, selectedType, selectedPlanningType]);

  return (
    <Fragment>
      <Grid container className="headerbox">
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs routes={[{ title: routes.planning.title }]} />
        </Grid>
        <Grid item md={8} sm={1} xs={2}>
          <ImportExportLinks
            permissions={permissions.planning}
            module="planning"
            api={'planning'}
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
            additionalParams={getQueryString(true)}
          />
        </Grid>
      </Grid>
      <CustomContainer>
        <div className="header-panel">
          <Grid container className={styles.filter_side_container}>
            <Grid item xs={12} md={6} sm={12} className={isMobile ? styles.mobile_panel : 'd-flex align-items-center gap-1'}>
              <ToggleButtonGroup
                size="small"
                className="align-items-center gap-1 layout-for-mobile "
                value={PlanningType[selectedType - 1].key}
                exclusive
                onChange={onTypeChange}
              >
                {PlanningType.map((k, index) => {
                  return (
                    <ToggleButton value={k.key} key={index}>
                      {k.key}
                    </ToggleButton>
                  );
                })}
              </ToggleButtonGroup>
              <Box ml={1}>
                <ToggleButtonGroup size="small" >
                  <ToggleButton onClick={() => {
                    history.push(`${routes.rentalPlanningCalendar.path}`)
                  }}>
                    <span>{`Calander`}</span>
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
              {selectedPlanningType &&
                <Chip
                  className="ml-3"
                  color="primary"
                  label={'Type: Rental Job'}
                  onDelete={() => {
                    setSelectedPlanningType(null)
                  }}
                />
              }
            </Grid>
            <Grid md={6} sm={12} xs={12} container className={styles.filter_side}>
              <Box className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} component="div">
                <Grid>
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
                  {permissions.planning.isCreate && (
                    <Button
                      className={isMobile && !isTablet ? 'mobile_button' : styles.add_submit_btn}
                      onClick={() => {
                        setPlanningId(null);
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
                  {permissions?.planning?.isDelete && (
                    <>
                      <Button
                        variant={isMobile && !isTablet ? 'text' : 'outlined'}
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
                        <MenuItem
                          disabled={
                            !(
                              (selectedRecords?.length > 0 && selectedRecords?.filter((e) => e?.canDelete === true)?.length) ===
                              selectedRecords?.length
                            )
                          }
                          onClick={() => {
                            closeActions();
                            // eslint-disable-next-line no-lone-blocks
                            {
                              selectedRecords.length === 1 && setDeleteRecord(selectedRecords[0]);
                            }
                            setShowDeleteConfirmBox(true);
                          }}
                        >
                          Delete
                        </MenuItem>
                      </Menu>
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
              permissions={permissions.planning}
              primaryField={columns?.find((d) => d.primaryField)}
              onClick={(data) => {
                setPlanningId(data.id);
                setOpen({ open: true, isClone: false });
              }}
              dataRows={dataRows}
              selectedRecords={selectedRecords}
              dispatch={dispatch}
              onEdit={(data) => {
                setPlanningId(data.id);
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
              additionalDetails={[]}
              owerCollaboratorInitialsOrImages=""
              onCreate={false}
              showClone={true}
              onClone={(data) => {
                setPlanningId(data.id);
                setOpen({ open: true, isClone: true });
              }}
              chips={[]}
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
              allowAction={true}
              loading={loading}
              renderedFrom={renderedFrom}
              refreshGrid={fetchData}
              showOnlyShowFilteredRecordSwitch={true}
            />
          )
        ) : null}
        {showDeleteConfirmBox && (
          <ConfirmationDialog
            open={showDeleteConfirmBox}
            message={`Are you sure you want to delete planning  ${deleteRecord?.planningNumber || ''} ?`}
            onClose={() => {
              setDeleteRecord(null);
              setShowDeleteConfirmBox(false);
            }}
            onOk={handleDelete}
          />
        )}
        {showConverConfirmBox.open && (
          <ConfirmationDialog
            open={true}
            message={`Are you sure you want to convert planning  ${showConverConfirmBox?.planningNumber} ?`}
            onClose={() => {
              setShowConverConfirmBox({ open: false, id: null, planningNumber: "" })
            }}
            onOk={handleConvert}
          />
        )}
        {open?.open && (
          <ManagePlanning
            id={planningId}
            isClone={open?.isClone}
            onClose={() => setOpen({ open: false, isClone: false })}
            onSuccess={() => {
              setOpen({ open: false, isClone: false });
              fetchData();
            }}
          />
        )}
      </CustomContainer>
    </Fragment>
  );
};

export default Planning;
