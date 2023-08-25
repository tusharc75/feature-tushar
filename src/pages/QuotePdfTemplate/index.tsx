import { Button, IconButton, Menu, MenuItem, Tooltip } from '@material-ui/core';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import VisibilityIcon from '@material-ui/icons/Visibility';
import { camelCase } from 'lodash';
import { FC, useContext, useEffect, useReducer, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { FaSuitcase, MdOutlineFilterAlt, TbArrowsSort } from 'react-icons/all';
import { Link, useHistory } from 'react-router-dom';
import { gridFilterParser } from 'src/constants/useColumns';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomAgGrid, { intialState, reducer } from '../../components/AgGridComponents/CustomAgGrid';
import { CommonRenderer, CreatedByRenderer, UpdatedByRenderer } from '../../components/AgGridComponents/CustomAgGridCellRenderers';
import CustomContainer from '../../components/CustomContainer';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import SearchBox from '../../components/Helpers/SearchBox';
import MobileFilterDialog from '../../components/MobileFilterDialog';
import MobileSortDialog from '../../components/MobileSortDialog';
import CustomSwipableList from '../../components/SwipableListComponents/CustomSwipableList';
import { gridLoadingTimeout, prepareDataForGrid, quoteBuilder, quotePdfTemplate } from '../../constants/helpers';
import styles from '../Leads/Header.module.scss';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';

let quotePdfTemplateTimeout;

const QuotePdfTemplate: FC = () => {
  const renderedFrom = camelCase(routes?.quotePdfTemplate.title);
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const { qbApi } = quoteBuilder;

  const {
    state: { permissions, selectedEntity, user }
  }: any = useData();
  const [renderCount, setRenderCount] = useState(0);
  const [isOpenDialog, setisOpenDialog] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  //  Grid Variables - Start
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

  const columnState = JSON.parse(localStorage.getItem('quotePdfPage'));
  const localStorageSelectedRecords = `${renderedFrom}_selected`;

  const columns = [
    { field: 'name', headerName: 'Name', show: true, disabled: true, cellRenderer: 'nameRenderer' },
    { field: 'type', headerName: 'Type', show: true, disabled: true, cellRenderer: 'commonRenderer' },
    { field: 'createdBy', headerName: 'Created By', show: true, filter: false, cellRenderer: 'createdByRenderer' },
    { field: 'updatedBy', headerName: 'Updated By', show: true, filter: false, cellRenderer: 'updatedByRenderer' }
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

  //  Grid Variables - End

  const { quotePdfTemplateApi } = quotePdfTemplate;

  useEffect(() => {
    let millisec = Object.keys(search).length > 0 ? 600 : 5;
    if (quotePdfTemplateTimeout) {
      clearTimeout(quotePdfTemplateTimeout);
    }
    quotePdfTemplateTimeout = setTimeout(() => {
      fetchQuotePdfTemplate();
    }, millisec);
  }, [search]);

  useEffect(() => {
    if (renderCount > 0) {
      fetchQuotePdfTemplate();
    } else setRenderCount((preCount) => preCount + 1);
  }, [page, limit, filters, sorting, selectedEntity, showFilteredRecordsOnly]);

  const previewPdfTemplate = (templateId) => {
    toastConfig.setToastConfig({
      hideDuration: null,
      open: true,
      type: 'info',
      message: `Downloading preview file, Please wait...`
    });

    axiosInstance()
      .get(`${qbApi}/getdummy/${templateId}`, {
        responseType: 'blob'
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: 'File downloaded Successfully'
        });

        const file = new Blob([data], { type: 'application/pdf' });
        const fileURL = URL.createObjectURL(file);
        const pdfWindow = window.open();
        pdfWindow.location.href = fileURL;
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const NameRenderer = (params) => (
    <>
      <Link className="link" to={`${routes.quotePdfTemplateDetail.path}/${params.data._id}`} title={params.value}>
        {params.value}
      </Link>
    </>
  );

  const ActionsRenderer = (params) => (
    <>
      <Tooltip title="Preview">
        <IconButton size="small" aria-label="Clone" className="mr-2" onClick={() => previewPdfTemplate(params.data._id)}>
          <VisibilityIcon color="primary" />
        </IconButton>
      </Tooltip>
      {permissions?.quotePdfTemplate?.isCreate && (
        <Tooltip title="Clone">
          <IconButton size="small" aria-label="Clone" onClick={() => CreateNew(params.data.id, true)}>
            <FileCopyIcon color="primary" />
          </IconButton>
        </Tooltip>
      )}
      {permissions?.quotePdfTemplate?.isDelete ? (
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
    </>
  );

  const frameworkComponents = {
    nameRenderer: NameRenderer,
    commonRenderer: CommonRenderer,
    createdByRenderer: CreatedByRenderer,
    updatedByRenderer: UpdatedByRenderer,
    actionsRenderer: ActionsRenderer
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const CreateNew = (id, isClone) => {
    if (isClone) {
      history.push(routes.quotePdfTemplateDetail.path + '/' + id, { isClone: true });
    } else {
      history.push(routes.quotePdfTemplateDetail.path + '/0', { isClone: false });
    }
  };

  const handleDelete = () => {
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords.map((d) => d._id);
    }
    axiosInstance()
      .put(`${routes.quotePdfTemplate.path}/remove`, { ids: ids })
      .then(({ data }) => {
        fetchQuotePdfTemplate();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
        setAnchorEl(null);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}`;

    if (isExport) {
      deepFilter = `?`;
    }
    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`;
    }

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

  const fetchQuotePdfTemplate = () => {
    const queryString = getQueryString();
    dispatch({ type: 'loading', loading: true });

    if (gridApi) {
      gridApi.setRowData([]);
    }

    axiosInstance()
      .get(`${quotePdfTemplateApi}${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
          let finalObject: any = prepareDataForGrid(u);
          finalObject.type = routes[camelCase(u?.type)] ? routes[camelCase(u?.type)]?.title : u?.type;
          finalObject['canDelete'] = permissions?.quotePdfTemplate.isDelete && user?.user?._id === finalObject['owner'];
          finalObject['isChecked'] = selectedRecords.some((s) => s._id === u._id);
          finalObject['allowedToEdit'] = permissions?.quotePdfTemplate.isUpdate;
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

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[routes.quotePdfTemplate]} />
      </div>
      <CustomContainer>
        <div className="header-panel">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            <div className={'d-flex flex-wrap align-items-center gap-1 w-full'}>
              {isMobile && !isTablet && (
                <>
                  <div className="d-flex flex-wrap items-center justify-between w-full">
                    <div></div>
                    <div className="flex flex-wrap items-center gap-1">
                      <IconButton
                        onClick={handleClickOpen}
                        id="demo-customized-button"
                        aria-controls="demo-customized-menu"
                        aria-haspopup="true"
                        aria-expanded={'true'}
                        size="small"
                        className={'mobileIconButton secondary'}
                      >
                        <TbArrowsSort className="rotate-90" size={16} />
                      </IconButton>
                      <MobileSortDialog
                        isOpen={sortOpen}
                        handleClose={handleClickClose}
                        contentPart={null}
                        secHeading={['Sort PDF Templates']}
                        columns={columns}
                        dispatch={dispatch}
                      />

                      <IconButton
                        id="demo-customized-button"
                        aria-controls="demo-customized-menu"
                        aria-haspopup="true"
                        aria-expanded={'true'}
                        size="small"
                        className={'mobileIconButton secondary'}
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
                        title={routes?.quotePdfTemplate?.title}
                        filters={filters}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-[8px]  justify-end">
              <SearchBox onChange={handleSearch} className={styles.search_box_input} value={search} />

              <div className="flex gap-[8px] flex-wrap items-center">
                {permissions?.quotePdfTemplate?.isCreate && (
                  <Button
                    onClick={() => CreateNew('0', false)}
                    variant={'contained'}
                    size="small"
                    color="primary"
                    className={`no-shadow`}
                    startIcon={<AddOutlined />}
                  >
                    Add
                  </Button>
                )}
                {permissions?.quotePdfTemplate?.isDelete && (
                  <Button
                    className={` new-dropdown-v1`}
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
          </div>
        </div>

        {isMobile && !isTablet ? (
          <CustomSwipableList
            allowSelection={true}
            allowSwipe={true}
            permissions={permissions.quotePdfTemplate}
            primaryField={columns?.find((d) => d.field === 'name')}
            onClick={(d) => {
              history.push(`${routes.quotePdfTemplateDetail.path}/${d._id}`);
            }}
            dataRows={dataRows}
            selectedRecords={selectedRecords}
            dispatch={dispatch}
            onEdit={(d) => {
              history.push(`${routes.quotePdfTemplateDetail.path}/${d._id}`);
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
                icon: <FaSuitcase size={18} />,
                field: 'createdBy'
              }
            ]}
            chips={[]}
            owerCollaboratorInitialsOrImages=""
            onCreate={false}
            showClone={false}
            onClone={() => {}}
            renderedFrom={renderedFrom}
          />
        ) : (
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
            actionWidth={200}
            loading={loading}
            renderedFrom={renderedFrom}
            refreshGrid={fetchQuotePdfTemplate}
            showOnlyShowFilteredRecordSwitch={true}
          />
        )}

        {showDeleteConfirmBox && (
          <ConfirmationDialog
            open={showDeleteConfirmBox}
            message={`Are you sure, you want to delete ${routes?.quotePdfTemplate?.title?.toLowerCase()} ${deleteRecord?.name || ''} ?`}
            onClose={() => {
              setDeleteRecord(null);
              setShowDeleteConfirmBox(false);
            }}
            onOk={handleDelete}
          />
        )}
      </CustomContainer>
    </section>
  );
};

export default QuotePdfTemplate;
