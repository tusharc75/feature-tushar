import { Menu, MenuItem } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import { ExpandMore } from '@material-ui/icons';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { camelCase } from 'lodash';
import queryString from 'query-string';
import { Fragment, useContext, useEffect, useReducer, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { CiUser, FaSuitcase, IoIosCreate, TbArrowsSort } from 'react-icons/all';
import { MdOutlineFilterAlt } from 'react-icons/md';
import { useHistory, useLocation } from 'react-router-dom';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomAgGrid, { intialState, reducer } from '../../components/AgGridComponents/CustomAgGrid';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import CustomContainer from '../../components/CustomContainer';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import routes from '../../components/Helpers/Routes';
import SearchBox from '../../components/Helpers/SearchBox';
import MobileFilterDialog, { DisplayFiltersForMobile } from '../../components/MobileFilterDialog';
import MobileSortDialog from '../../components/MobileSortDialog';
import CustomSwipableList from '../../components/SwipableListComponents/CustomSwipableList';
import { gridLoadingTimeout, marketSegment, prepareDataForGrid, sidebarResource } from '../../constants/helpers';
import useColumns, { getFrameworkComponents, getStaticFields, gridFilterParser } from '../../constants/useColumns';
import styles from '../Leads/Header.module.scss';
import CreateMarketSegment from './ManageMarketSegmentDialog';

const MarketSegment = () => {
  const renderedFrom = camelCase(routes?.marketSegment.title);
  const location = useLocation();
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions }
  }: any = useData();
  const { getColumnData } = useColumns();

  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [open, setOpen] = useState({ open: false, isClone: false, idToClone: null });
  const [anchorEl, setAnchorEl] = useState(null);
  const [columns, setColumns] = useState([]);
  const [frameWorkComponent, setFrameWorkComponent] = useState({});
  const [sortOpen, setSortOpen] = useState(false);
  const [isOpenDialog, setisOpenDialog] = useState(false);
  // const [selectedCategory, setSelectedCategory] = useState([]);

  //  Grid Variables - Start
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

  const columnState = JSON.parse(localStorage.getItem(renderedFrom));
  const localStorageSelectedRecords = `${renderedFrom}_selected`;

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

  useEffect(() => {
    const parsedParams = queryString.parse(location?.search);
    if (parsedParams?.id) {
      setOpen({ open: true, isClone: false, idToClone: parsedParams?.id });
    }
  }, [location]);
  //  Grid Variables - End

  useEffect(() => {
    fetchMarketSegment();
  }, [page, limit, filters, sorting, search, showFilteredRecordsOnly]);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=Market Segment&view=true`)
      .then(({ data: { data } }) => {
        let columns = [];
        let rendererNames = [];
        data.forEach((o) => {
          let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.marketSegmentDetail.path, true);
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

        if (columnState) {
          columns.map((item) => {
            columnState.map((d) => {
              if (d.colId == item.field) {
                item.show = !d.hide;
              }
            });
          });
        }
        setColumns([...columns]);
      });
  };

  const ActionsRenderer = (params) => (
    <Fragment>
      <Tooltip
        className={permissions?.marketSegment.isCreate ? '' : 'cursor-stop'}
        title={permissions?.marketSegment.isCreate ? 'Clone' : 'You do not have permission to clone/create'}
      >
        <IconButton
          size="small"
          aria-label="Clone"
          onClick={() => {
            setOpen({ open: true, idToClone: params.data._id, isClone: true });
          }}
        >
          <FileCopyIcon fontSize="small" color="primary" />
        </IconButton>
      </Tooltip>
      {permissions?.marketSegment.isDelete ? (
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

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}`;

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

  const fetchMarketSegment = () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    if (gridApi) {
      gridApi.setRowData([]);
    }

    axiosInstance()
      .get(`${marketSegment.marketSegmentApi}${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
          let finalObject = prepareDataForGrid(u);
          finalObject['canDelete'] = permissions?.marketSegment.isDelete;
          finalObject['isChecked'] = selectedRecords.some((s) => s._id === u._id);
          finalObject['allowedToEdit'] = permissions?.marketSegment.isUpdate;
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

  const handleDelete = () => {
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords.map((m) => m._id);
    }
    axiosInstance()
      .put(`${marketSegment.marketSegmentApi}/remove`, { ids: ids })
      .then(() => {
        fetchMarketSegment();
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
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ title: routes.marketSegment.title }]} />
        <ImportExportLinks
          permissions={permissions.marketSegment}
          module="market segment"
          api={'market-segment'}
          afterImportCompleted={() => {
            fetchMarketSegment();
          }}
          isExportAllOrSomeFeature={true}
          total={rowCount}
          recordsToExport={selectedRecords.length}
          ids={selectedRecords.length ? selectedRecords.map((obj) => obj._id) : []}
          onExportToExcelSuccess={() => {
            if (gridApi) gridApi.deselectAll();
            else fetchMarketSegment();
          }}
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
                      secHeading={['Sort Market Segment']}
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
                      title={routes?.marketSegment?.title}
                      filters={filters}
                      resource={sidebarResource.marketSegment}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-[8px]  justify-end">
              <SearchBox onChange={handleSearch} className={styles.search_box_input} size="small" value={search} />

              <div className="flex gap-[8px] flex-wrap items-center">
                {permissions?.marketSegment.isCreate && (
                  <Button
                    className={`no-shadow`}
                    onClick={() => {
                      setOpen({ open: true, isClone: false, idToClone: null });
                    }}
                    variant={'contained'}
                    size="small"
                    color="primary"
                    startIcon={<AddIcon />}
                  >
                    Add
                  </Button>
                )}
                {permissions?.marketSegment.isDelete && (
                  <Button
                    className={`new-dropdown-v1`}
                    variant={'outlined'}
                    color="default"
                    size="small"
                    onClick={openActions}
                    disabled={selectedRecords.length ? false : true}
                    aria-controls="action-menu"
                    endIcon={<ExpandMore />}
                  >
                    Actions
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
              </div>
            </div>
            <DisplayFiltersForMobile resource={sidebarResource.marketSegment} />
          </div>
        </div>

        {isMobile && !isTablet ? (
          <CustomSwipableList
            allowSelection={true}
            allowSwipe={true}
            permissions={permissions.marketSegment}
            primaryField={columns?.find((d) => d.field === 'name')}
            onClick={(d) => {
              setOpen({ open: true, isClone: false, idToClone: d.id });
            }}
            dataRows={dataRows}
            selectedRecords={selectedRecords}
            dispatch={dispatch}
            onEdit={(d) => {
              setOpen({ open: true, isClone: false, idToClone: d.id });
            }}
            extraParamsToCheckDelete={true}
            onDelete={(d) => {
              setDeleteRecord(d);
              setShowDeleteConfirmBox(true);
            }}
            rowCount={rowCount}
            page={page}
            loading={loading}
            additionalDetails={[
              {
                icon: <CiUser size={18} />,
                field: 'parentMarketSegment'
              }
            ]}
            chips={[
              {
                icon: <IoIosCreate />,
                label: 'CreatedBy: ',
                field: 'createdBy'
              },
              {
                label: 'UpdatedBy: ',
                field: 'updatedBy'
              }
            ]}
            owerCollaboratorInitialsOrImages=""
            onCreate={() => setOpen({ open: true, idToClone: null, isClone: null })}
            showClone={false}
            onClone={() => {}}
            renderedFrom={renderedFrom}
          />
        ) : Object.keys(frameWorkComponent).length > 0 ? (
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
            actionWidth={100}
            loading={loading}
            renderedFrom={renderedFrom}
            refreshGrid={fetchMarketSegment}
            showOnlyShowFilteredRecordSwitch={true}
          />
        ) : null}

        {showDeleteConfirmBox && (
          <ConfirmationDialog
            open={showDeleteConfirmBox}
            message={`Are you sure you want to delete ${routes?.marketSegment?.title?.toLowerCase()} ${deleteRecord?.name || ''}?`}
            onClose={() => {
              setDeleteRecord(null);
              setShowDeleteConfirmBox(false);
            }}
            onOk={handleDelete}
          />
        )}
        {open?.open && (
          <CreateMarketSegment
            marketSegmentId={open?.idToClone}
            onClose={() => setOpen({ open: false, isClone: false, idToClone: null })}
            onSuccess={() => {
              setOpen({ open: false, isClone: false, idToClone: null });
              fetchMarketSegment();
            }}
            isClone={open.isClone}
          />
        )}
      </CustomContainer>
    </section>
  );
};

export default MarketSegment;
