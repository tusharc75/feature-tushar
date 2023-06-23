import { useContext, useEffect, useState, useReducer, Fragment } from 'react';
import { useData } from '../../StateProvider/Provider';
import { Box, Button, Menu, MenuItem, Tooltip, IconButton, Grid } from '@material-ui/core';
import { ExpandMore, AddOutlined } from '@material-ui/icons';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import SearchBox from '../../components/Helpers/SearchBox';
import DeleteIcon from '@material-ui/icons/Delete';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import axiosInstance from '../../axios/axiosInstance';
import CustomContainer from '../../components/CustomContainer';
import styles from '../Leads/Header.module.scss';
import CustomRenderCell from '../../components/Helpers/CustomRenderCell';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { termsAndCondition, isObjectEmpty, gridLoadingTimeout, sidebarResource, prepareDataForGrid } from '../../constants/helpers';
import useColumns, { getStaticFields, getFrameworkComponents, gridFilterParser } from '../../constants/useColumns';
import ManageTermsAndCondition from './ManageTermsAndCondition';
import { cloneDeep } from 'lodash';
import { IoDocumentTextOutline } from 'react-icons/io5';
import CustomAgGrid, { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';
import routes from '../../components/Helpers/Routes';
import { camelCase } from 'lodash';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { isMobile, isTablet } from 'react-device-detect';
import { useHistory } from 'react-router-dom';
import CustomSwipableList from '../../components/SwipableListComponents/CustomSwipableList';
import { MdAdd, MdSort, MdFilterList } from 'react-icons/md';
import MobileSortDialog from '../../components/MobileSortDialog';
import MobileFilterDialog from '../../components/MobileFilterDialog';
import { useLocation } from 'react-router-dom';
import queryString from 'query-string';
import { urlEncode } from '@sentry/utils';

let termsTimeout;
export default function TermsAndCondition(props) {
  const renderedFrom = camelCase(routes?.termsAndConditions.title);
  const localStorageSelectedRecords = `${renderedFrom}_selected`;
  const { termsAndConditionBreadcrumb } = props;
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions, user, selectedEntity }
  }: any = useData();
  const [showCreateDialog, setShowCreateDialog] = useState({ open: false, isClone: false });
  const [anchorEl, setAnchorEl] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [frameWorkComponent, setFrameWorkComponent] = useState({});
  const [columns, setColumns] = useState([]);
  const [deleteRec, setDeleteRec] = useState<any>({});
  const [sortOpen, setSortOpen] = useState(false);
  const [isOpenDialog, setisOpenDialog] = useState(false);
  const [gridApi, setGridApi] = useState(null);
  const [termsAndConditionsId, setTermsAndConditionsId] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, appendRows, filters, sorting, selectedRecords } = state;
  const { getColumnData } = useColumns();

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=${encodeURIComponent(sidebarResource?.termsAndConditions)}`)
      .then(({ data: { data } }) => {
        let columns = [];
        let rendererNames = [];
        data.forEach((o) => {
          let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.termsAndConditionsDetails.path);
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

  useEffect(() => {
    fetchGridColumns();
  }, []);
 
  useEffect(() => {
    fetchTermsAndConditions();
  }, [page, limit, filters, sorting, search, selectedEntity]);

  const ActionsRenderer = (params) => (
    <>
      <Tooltip
        className={permissions?.termsAndConditions?.isCreate ? '' : 'cursor-stop'}
        title={permissions?.termsAndConditions?.isCreate ? 'Clone' : 'You do not have permission to clone/create'}
      >
        <IconButton
          size="small"
          aria-label="Clone"
          onClick={() => {
            setTermsAndConditionsId(params.data.id);
            setShowCreateDialog({ open: true, isClone: true });
          }}
        >
          <FileCopyIcon fontSize="small" color="primary" />
        </IconButton>
      </Tooltip>
      {params?.data?.canDelete ? (
        <Tooltip title="Delete">
          <IconButton
            aria-label="Delete"
            onClick={() => {
              setDeleteRec(params.data);
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
    </>
  );

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const fetchTermsAndConditions = () => {
    if (termsTimeout) {
      clearTimeout(termsTimeout);
    }

    termsTimeout = setTimeout(() => {
      if (gridApi) {
        gridApi.setRowData([]);
      }
      const queryString = getQueryString();
      dispatch({ type: 'loading', loading: true });
      axiosInstance()
        .get(`${termsAndCondition.api}${queryString}`)
        .then(({ data: { data } }) => {
          let count = data?.count;
          let rows = data?.data.map((u: any) => {
            let finalObject: any = prepareDataForGrid(u);
            finalObject['canDelete'] = permissions?.padMaster?.isDelete;
            finalObject['isChecked'] = selectedRecords?.some((s) => s._id === u._id);
            finalObject['allowedToEdit'] = permissions?.padMaster?.isUpdate;

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
        })
        .catch((err) => {
          toastConfig.setToastConfig(err);
          dispatch({ type: 'loading', loading: false });
        });
    }, 600);
  };

  // ****** ACTIONS BUTTON STUFF *********
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

  const handleDeleteTermsAndConditions = async () => {
    if (deleteRec?._id || selectedRecords.length > 0) {
      axiosInstance()
        .put(`${termsAndCondition.api}/remove`, { ids: deleteRec.id ? [deleteRec.id] : selectedRecords.map((d) => d._id) })
        .then(({ data }) => {
          toastConfig.setToastConfig({ open: true, type: 'success', message: data.message });
          setShowDeleteConfirmBox(false);
          if (deleteRec) setDeleteRec({});
          fetchTermsAndConditions();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setShowDeleteConfirmBox(false);
        });
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
          field: field,
          term: filters[field].filter
        });
      });
      deepFilter = `${deepFilter}&deepFilter=${encodeURI(JSON.stringify(updatedFilters))}&filterType=and`;
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }

    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURI(search)}`;
    }

    return deepFilter;
  };

  return (
    <Fragment>
      <Grid container className="headerbox">
        <Grid item xs={12}>
          <CustomBreadCrumbs routes={[termsAndConditionBreadcrumb]} />
        </Grid>
      </Grid>
      <CustomContainer>
        <div className="header-panel">
          <Grid container className={styles.filter_side_container}>
            <Grid item xs={12} md={6} sm={12} className={isMobile ? styles.mobile_panel : 'd-flex align-items-center gap-1'}>
              <div className="d-flex align-items-center">
                <IoDocumentTextOutline className="headerLogo" /> <span className="listingHeader">{routes.termsAndConditions.title}</span>
              </div>
              {isMobile && !isTablet && (
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
                      secHeading={['Sort TermsAndCondition']}
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
                      columns={columns}
                      dispatch={dispatch}
                      title={routes?.termsAndConditions?.title}
                      filters={filters}
                    />
                  </Grid>
                </>
              )}
            </Grid>

            <Grid item xs={12} sm={12} md={6} className={styles.filter_side}>
              <Box className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} component="div">
                <SearchBox
                  onSearch={handleSearch}
                  searchbox={styles.search_box_input}
                  width={isMobile && !isTablet ? '200px' : '242px'}
                  style={isMobile && !isTablet ? { flex: 1 } : {}}
                  value={search}
                />

                <Grid style={{ display: 'flex', gap: '5px' }}>
                  {permissions?.termsAndConditions?.isCreate && (
                    <Button
                      variant={isMobile && !isTablet ? 'text' : 'contained'}
                      color="primary"
                      size="small"
                      className={isMobile && !isTablet ? 'mobile_button' : styles.add_submit_btn}
                      onClick={() => setShowCreateDialog({ open: true, isClone: false })}
                      startIcon={isMobile && !isTablet ? null : <AddOutlined />}
                    >
                      {isMobile && !isTablet ? <MdAdd size={23} /> : 'Add'}
                    </Button>
                  )}

                  <Button
                    disabled={selectedRecords.length === 0}
                    variant={isMobile && !isTablet ? 'text' : 'outlined'}
                    color="default"
                    size="small"
                    className={isMobile && !isTablet ? 'mobile_button' : styles.action_submit_btn}
                    onClick={openActions}
                    aria-controls="action-menu"
                    endIcon={<ExpandMore />}
                  >
                    {isMobile && !isTablet ? '' : 'Actions'}
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
                    {permissions?.termsAndConditions?.isDelete && (
                      <MenuItem
                        onClick={() => {
                          closeActions();
                          setShowDeleteConfirmBox(true);
                        }}
                        disabled={
                          !(
                            (selectedRecords?.length > 0 && selectedRecords?.filter((e) => e?.canDelete === true)?.length) === selectedRecords?.length
                          )
                        }
                      >
                        Delete
                      </MenuItem>
                    )}
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
              permissions={permissions?.termsAndConditions}
              primaryField={columns?.find((d) => d.field === 'TACName')}
              onClick={(d) => {
                setTermsAndConditionsId(d.id);
                setShowCreateDialog({ open: true, isClone: false });
              }}
              dataRows={dataRows}
              selectedRecords={selectedRecords}
              dispatch={dispatch}
              onEdit={(d) => {
                setTermsAndConditionsId(d.id);
                setShowCreateDialog({ open: true, isClone: false });
              }}
              extraParamsToCheckDelete={false}
              onDelete={(d) => {}}
              rowCount={rowCount}
              page={page}
              loading={loading}
              additionalDetails={[]}
              chips={[]}
              owerCollaboratorInitialsOrImages=""
              onCreate={() => {}}
              showClone={false}
              onClone={() => {}}
              renderedFrom={'termsAndConditions'}
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
              refreshGrid={fetchTermsAndConditions}
              renderedFrom={routes.termsAndConditions.title}
              isClientSideGrid={true}
              showFilters={true}
              showOnlyShowFilteredRecordSwitch={true}
              resource={sidebarResource.termsAndConditions}
            />
          )
        ) : null}

        {showDeleteConfirmBox ? (
          <ConfirmationDialog
            open={showDeleteConfirmBox}
            message={`Are you sure you want to delete the selected Terms & Conditions ?`}
            onClose={() => setShowDeleteConfirmBox(false)}
            onOk={handleDeleteTermsAndConditions}
          />
        ) : null}
        {showCreateDialog?.open ? (
          <ManageTermsAndCondition
            id={termsAndConditionsId}
            isClone={showCreateDialog?.isClone}
            onClose={() => setShowCreateDialog({ open: false, isClone: false })}
            onSuccess={() => {
              setShowCreateDialog({ open: false, isClone: false });
              fetchTermsAndConditions();
            }}
          />
        ) : null}
      </CustomContainer>
    </Fragment>
  );
}
