import { Box, Button, Menu, MenuItem } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import DeleteIcon from '@material-ui/icons/Delete';
import { camelCase, startCase } from 'lodash';
import { useContext, useEffect, useReducer, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { CiUser, TbArrowsSort } from 'react-icons/all';
import { MdOutlineFilterAlt } from 'react-icons/md';
import { useHistory } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomAgGrid, { intialState, reducer } from 'src/components/AgGridComponents/CustomAgGrid';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import ImportExportLinks from 'src/components/Helpers/ImportExportLinks';
import routes from 'src/components/Helpers/Routes';
import SearchBox from 'src/components/Helpers/SearchBox';
import MobileFilterDialog, { DisplayFiltersForMobile } from 'src/components/MobileFilterDialog';
import MobileSortDialog from 'src/components/MobileSortDialog';
import CustomSwipableList from 'src/components/SwipableListComponents/CustomSwipableList';
import { gridLoadingTimeout, prepareDataForGrid, pricingCondition, sidebarResource } from 'src/constants/helpers';
import useColumns, { getFrameworkComponents, getStaticFields, gridFilterParser } from 'src/constants/useColumns';
import styles from '../Leads/Header.module.scss';
import PricingConditionsDialog from './PricingConditionsDialog';

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
    let deepFilter = !isExport ? `?page=${page}&limit=${limit}` : '';

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
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ title: routes.pricingCondition.title }]} />
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
              api: `${pricingCondition.api}/template?materialType=product`,
              type: 'download'
            },
            {
              title: 'Product Export',
              api: `${pricingCondition.api}/template?export=true${getQueryString(true) ? `&${getQueryString(true)}` : ''}&materialType=product`,
              type: 'export'
            },
            {
              title: 'Product Import',
              api: `${pricingCondition.api}/import?materialType=product`,
              type: 'import'
            },
            {
              title: 'Package Template',
              api: `${pricingCondition.api}/template?materialType=package`,
              type: 'download'
            },
            {
              title: 'Package Export',
              api: `${pricingCondition.api}/template?export=true${getQueryString(true) ? `&${getQueryString(true)}` : ''}&materialType=package`,
              type: 'export'
            },
            {
              title: 'Package Import',
              api: `${pricingCondition.api}/import?materialType=package`,
              type: 'import'
            },
            {
              title: 'Service Template',
              api: `${pricingCondition.api}/template?materialType=service`,
              type: 'download'
            },
            {
              title: 'Service Export',
              api: `${pricingCondition.api}/template?export=true${getQueryString(true) ? `&${getQueryString(true)}` : ''}&materialType=service`,
              type: 'export'
            },
            {
              title: 'Service Import',
              api: `${pricingCondition.api}/import?materialType=service`,
              type: 'import'
            }
          ]}
        />
      </div>
      <CustomContainer>
        <div className="header-panel">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={'d-flex align-items-center gap-1'}>
              {isMobile && (
                <div className="d-flex flex-wrap items-center justify-between w-full">
                  <div></div>
                  <div className="flex flex-wrap items-center gap-1 ml-auto">
                    <IconButton
                      onClick={handleClickOpen}
                      id="demo-customized-button"
                      aria-controls="demo-customized-menu"
                      aria-haspopup="true"
                      aria-expanded={'true'}
                      className={'mobileIconButton secondary'}
                      size="small"
                    >
                      <TbArrowsSort className="rotate-90" size={16} />
                    </IconButton>
                    <MobileSortDialog
                      isOpen={sortOpen}
                      handleClose={handleClickClose}
                      contentPart={null}
                      secHeading={['Sort Pricing Setup']}
                      columns={columns}
                      dispatch={dispatch}
                    />

                    <IconButton
                      id="demo-customized-button"
                      aria-controls="demo-customized-menu"
                      aria-haspopup="true"
                      aria-expanded={'true'}
                      className={'mobileIconButton secondary'}
                      size="small"
                      onClick={handleOpen}
                    >
                      <MdOutlineFilterAlt size={16} />
                    </IconButton>

                    <MobileFilterDialog
                      isOpen={isOpenDialog}
                      handleClose={handleFilterClose}
                      contentPart={null}
                      columns={columns}
                      dispatch={dispatch}
                      title={routes?.pricingCondition?.title}
                      filters={filters}
                      resource={sidebarResource.pricingCondition}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-[8px]  justify-end">
              <SearchBox onChange={onSearch} className={styles.search_box_input} value={search} size="small" />
              <div className="flex gap-[8px] flex-wrap items-center">
                <Button
                  variant={'contained'}
                  color="primary"
                  size="small"
                  className={`no-shadow`}
                  startIcon={<AddOutlined />}
                  onClick={() => {
                    setPricingConditionId(null);
                    setOpen({ open: true, isClone: false });
                  }}
                >
                  Add
                </Button>
                <Button
                  variant={'outlined'}
                  color="default"
                  size="small"
                  className={`new-dropdown-v1`}
                  onClick={openActions}
                  disabled={selectedRecords.length ? false : true}
                  aria-controls="action-menu"
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
                  <MenuItem onClick={() => setShowDeleteConfirmBox(true)}>Delete</MenuItem>
                </Menu>
              </div>
            </div>
            <DisplayFiltersForMobile resource={sidebarResource.pricingCondition} />
          </div>
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
                  icon: <CiUser size={18} />,
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
    </section>
  );
};

export default PricingConditions;
