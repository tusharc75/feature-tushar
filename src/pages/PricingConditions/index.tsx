import { useContext, useEffect, useState, useReducer, Fragment } from 'react';
import { Box, Button, Menu, MenuItem, Grid } from '@material-ui/core';
import { useData } from 'src/StateProvider/Provider';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import SearchBox from 'src/components/Helpers/SearchBox';
import CustomContainer from 'src/components/CustomContainer';
import styles from '../Leads/Header.module.scss';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { MdContacts, MdSort, MdFilterList } from 'react-icons/md';
import axiosInstance from 'src/axios/axiosInstance';
import { isObjectEmpty, gridLoadingTimeout, pricingCondition, sidebarResource } from 'src/constants/helpers';
import routes from 'src/components/Helpers/Routes';
import CustomAgGrid, { reducer, intialState } from 'src/components/AgGridComponents/CustomAgGrid';
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import ImportExportLinks from 'src/components/Helpers/ImportExportLinks';
import { Link, useHistory } from 'react-router-dom';
import { isMobile, isTablet } from 'react-device-detect';
import { MdAdd, FaSuitcase } from 'react-icons/all';
import PricingConditionsDialog from './PricingConditionsDialog';
import CustomSwipableList from 'src/components/SwipableListComponents/CustomSwipableList';
import useColumns, { getFrameworkComponents, getStaticFields, gridFilterParser } from 'src/constants/useColumns';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { prepareDataForGrid } from 'src/constants/helpers';
import { startCase } from 'lodash';
import EditIcon from '@material-ui/icons/Edit';
import MobileSortDialog from 'src/components/MobileSortDialog';
import MobileFilterDialog from 'src/components/MobileFilterDialog';
import { camelCase } from 'lodash';

let timeout;

const PricingConditions = () => {
  const renderedFrom = camelCase(routes?.pricingCondition.title);
  const {
    state: { permissions }
  }: any = useData();
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [isOpenDialog, setisOpenDialog] = useState(false);
  const [pricingConditionId, setPricingConditionId] = useState(null);
  const [open, setOpen] = useState({ open: false, isClone: false });
  const [sortOpen, setSortOpen] = useState(false);
  const history = useHistory();
  const [gridApi, setGridApi] = useState(null);
  const toastConfig = useContext(CustomToastContext);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { getColumnData } = useColumns();
  const [frameworkComponent, setFrameworkComponent] = useState(null);
  const [columns, setColumns] = useState([]);
  const localStorageSelectedRecords = `${renderedFrom}_selected`;

  useEffect(() => {
    fetchGridMetadata();
  }, []);

  useEffect(() => {
    fetchPriceConditionList();
  }, [page, limit, filters, sorting, search, showFilteredRecordsOnly]);

  const fetchGridMetadata = () => {
    axiosInstance()
      .get(`/field?resource=${startCase(pricingCondition.resource)}`)
      .then(({ data: { data } }) => {
        let columns = [];
        let rendererNames = [];
        data.forEach((o: any) => {
          if (o?.fieldData?.fieldName === 'conditionName') {
            o.fieldData.primaryField = true;
          }
          let currentColumn = getColumnData(renderedFrom, o?.fieldData, `${pricingCondition.route}/detail`, true);
          if (currentColumn !== null) {
            columns = [...columns, currentColumn?.columnData];
            if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
              rendererNames.push(currentColumn?.rendererName);
            }
          }
          return o?.fieldData;
        });
        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
        tempFrameworkComponent = {
          ...tempFrameworkComponent,
          actionsRenderer: ActionsRenderer
        };
        setFrameworkComponent({ ...tempFrameworkComponent });
        columns = [...columns, ...getStaticFields()];
        setColumns([...columns]);
      });
  };

  const fetchPriceConditionList = () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    const queryString = getQueryString();
    axiosInstance()
      .get(`${pricingCondition.api}${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
          let finalObject = prepareDataForGrid(u);
          finalObject['canDelete'] = permissions?.pricingCondition.isDelete;
          finalObject['isChecked'] = selectedRecords.some((s) => s._id === u._id);
          finalObject['allowedToEdit'] = permissions?.pricingCondition.isUpdate;
          return {
            ...finalObject
          };
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

  const ActionsRenderer = (params) => (
    <>
      {permissions?.pricingCondition?.isDelete && (
        <Tooltip title="Delete">
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
        </Tooltip>
      )}
    </>
  );

  const getQueryString = (isExport = false) => {
    let deepFilter = !isExport ? `?page=${page}&limit=${limit}` : '?';

    const { filterByIds, deepFilters } = gridFilterParser(filters);

    if (filterByIds?.length) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterByIds)}`;
    }
    if (deepFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURI(JSON.stringify(deepFilters))}`;
    }

    if (filterByIds?.length || deepFilters?.length) {
      deepFilter = `${deepFilter}&filterType=and`;
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
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

  const handleDelete = () => {
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords.map((d) => d._id);
    }
    axiosInstance()
      .put(`${pricingCondition.api}/remove`, { ids: ids })
      .then(() => {
        fetchPriceConditionList();
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

  const onSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  return (
    <Fragment>
      <Grid container className="headerbox">
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs routes={[{ title: routes.pricingCondition.title }]} />
        </Grid>
        <Grid item md={8} sm={1} xs={2}>
          <ImportExportLinks
            permissions={permissions.pricingCondition}
            module="pricingCondition(s)"
            api={pricingCondition.api}
            afterImportCompleted={() => {
              fetchPriceConditionList();
            }}
            isExportAllOrSomeFeature={true}
            total={rowCount}
            recordsToExport={selectedRecords.length}
            ids={selectedRecords.length ? selectedRecords.map((obj) => obj._id) : []}
            onExportToExcelSuccess={() => {
              if (gridApi) gridApi.deselectAll();
              else fetchPriceConditionList();
            }}
            additionalParams={getQueryString(true)}
            extraImportExportLinks={[
              {
                title: 'Product Template',
                api: `${pricingCondition.api}/template?conditionType=product`,
                type: 'download'
              },
              {
                title: 'Product Export',
                api: `${pricingCondition.api}/template?export=true${getQueryString(true) ? `&${getQueryString(true)}` : ""}&conditionType=product`,
                type: 'export'
              },
              {
                title: 'Product Import',
                api: `${pricingCondition.api}/import&conditionType=product`,
                type: 'import'
              },
              {
                title: 'Package Template',
                api: `${pricingCondition.api}/template?conditionType=package`,
                type: 'download'
              },
              {
                title: 'Package Export',
                api: `${pricingCondition.api}/template?export=true${getQueryString(true) ? `&${getQueryString(true)}` : ""}&conditionType=package`,
                type: 'export'
              },
              {
                title: 'Package Import',
                api: `${pricingCondition.api}/import&conditionType=package`,
                type: 'import'
              },
              {
                title: 'Service Template',
                api: `${pricingCondition.api}/template?conditionType=service`,
                type: 'download'
              },
              {
                title: 'Service Export',
                api: `${pricingCondition.api}/template?export=true${getQueryString(true) ? `&${getQueryString(true)}` : ""}&conditionType=service`,
                type: 'export'
              },
              {
                title: 'Service Import',
                api: `${pricingCondition.api}/import&conditionType=service`,
                type: 'import'
              },
            ]}
          />
        </Grid>
      </Grid>
      <CustomContainer>
        <div className="header-panel">
          <Grid className={styles.filter_side_container} container justify="space-between">
            <Grid item xs={12} md={6} sm={12} className={isMobile ? styles.mobile_panel : 'd-flex align-items-center gap-1'}>
              <div className="d-flex align-items-center">
                <MdContacts className="headerLogo" />
                <span className="listingHeader">{routes.pricingCondition.title}</span>
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
                      secHeading={['Sort Pricing Setup']}
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
                      title={routes?.pricingCondition?.title}
                      filters={filters}
                    />
                  </Grid>
                </>
              )}
            </Grid>
            <Grid className={styles.filter_side} item md={6} sm={12} xs={12}>
              <Box className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} component="div">
                <Grid style={{ display: 'flex', flex: 1 }}>
                  <SearchBox
                    onChange={onSearch}
                    className={styles.search_box_input}
                    value={search}
                    size="small"
                    placeholder="Search"
                    width={isMobile ? '200px' : '242px'}
                    style={isMobile ? { flex: 1 } : {}}
                  />
                </Grid>
                <Grid style={{ display: 'flex', gap: '5px' }}>
                  <Button
                    variant={isMobile && !isTablet ? 'text' : 'contained'}
                    color="primary"
                    size="small"
                    className={isMobile && !isTablet ? 'mobile_button' : styles.add_submit_btn}
                    startIcon={isMobile && !isTablet ? null : <AddOutlined />}
                    onClick={() => {
                      setPricingConditionId(null);
                      setOpen({ open: true, isClone: false });
                    }}
                  >
                    {isMobile && !isTablet ? <MdAdd size={23} /> : 'Add'}
                  </Button>
                  <Button
                    variant={isMobile && !isTablet ? 'text' : 'outlined'}
                    color="default"
                    size="small"
                    className={`${isMobile && !isTablet ? 'mobile_button' : styles.action_submit_btn} new-dropdown-v1`}
                    onClick={openActions}
                    disabled={selectedRecords.length ? false : true}
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
                    <MenuItem onClick={() => setShowDeleteConfirmBox(true)}>Delete</MenuItem>
                  </Menu>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </div>
        {columns && frameworkComponent ? (
          isMobile && !isTablet ? (
            <CustomSwipableList
              allowSelection={true}
              allowSwipe={true}
              permissions={permissions.pricingCondition}
              primaryField={columns?.find((d) => d.field)}
              onClick={(data) => {
                history.push(`${routes.pricingConditionDetail.path}/${data._id}`);
              }}
              dataRows={dataRows}
              selectedRecords={selectedRecords}
              dispatch={dispatch}
              onEdit={(data) => {
                history.push(`${routes.pricingConditionDetail.path}/${data._id}`);
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
                  field: 'conditionName'
                }
              ]}
              chips={[]}
              owerCollaboratorInitialsOrImages="owerCollaboratorInitialsOrImages"
              onCreate={false}
              showClone={true}
              onClone={(data) => { }}
              renderedFrom={renderedFrom}
            />
          ) : (
            <Box component="div">
              <CustomAgGrid
                columns={columns}
                dataRows={dataRows}
                frameworkComponents={frameworkComponent}
                setGridApi={setGridApi}
                dispatch={dispatch}
                rowCount={rowCount}
                limit={limit}
                pageSizes={pageSizes}
                page={page}
                actionWidth={100}
                loading={loading}
                renderedFrom={renderedFrom}
                refreshGrid={fetchPriceConditionList}
                showOnlyShowFilteredRecordSwitch={true}
                showFilters={true}
                resource={sidebarResource.pricingCondition}
              />
            </Box>
          )
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomContainer>
      {showDeleteConfirmBox && (
        <ConfirmationDialog
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete ${routes?.pricingCondition?.title?.toLowerCase()}  ${deleteRecord?.conditionName || ''} ?`}
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {open?.open && (
        <PricingConditionsDialog
          pricingConditionId={pricingConditionId}
          isClone={open?.isClone}
          onClose={() => setOpen({ open: false, isClone: false })}
          onSuccess={() => {
            setOpen({ open: false, isClone: false });
            fetchPriceConditionList();
          }}
        />
      )}
    </Fragment>
  );
};

export default PricingConditions;