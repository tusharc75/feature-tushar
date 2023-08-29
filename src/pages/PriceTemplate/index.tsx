import { Button, IconButton, Menu, MenuItem, Tooltip } from '@material-ui/core';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { camelCase } from 'lodash';
import { FC, useContext, useEffect, useReducer, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { MdOutlineFilterAlt, TbArrowsSort } from 'react-icons/all';
import { Link, useHistory } from 'react-router-dom';
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
import { gridLoadingTimeout, isObjectEmpty, prepareDataForGrid, priceTemplate } from '../../constants/helpers';
import styles from '../Leads/Header.module.scss';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';

let priceTemplateTimeout;

const PriceTemplate: FC = () => {
  const renderedFrom = camelCase(routes?.priceTemplate.title);
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();
  const [renderCount, setRenderCount] = useState(0);
  const [priceTemplatePermissions, setpriceTemplatePermissions] = useState({
    isCreate: permissions?.priceTemplate?.isCreate,
    isUpdate: permissions?.priceTemplate?.isUpdate,
    isRead: permissions?.priceTemplate?.isRead,
    isDelete: permissions?.priceTemplate?.isDelete
  });

  const [anchorEl, setAnchorEl] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  //  Grid Variables - Start
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows } = state;
  const [isAllChecked, setIsAllChecked] = useState(false);
  const [clonedData, setClonedData] = useState([]);
  const localStorageSelectedRecords = 'productTemplatePage_selected';

  const columnState = JSON.parse(localStorage.getItem('priceTemplatePage'));

  const columns = [
    { field: 'name', headerName: 'Name', show: true, disabled: true, primaryField: true, cellRenderer: 'nameRenderer' },
    { field: 'createdBy', headerName: 'Created By', show: true, cellRenderer: 'createdByRenderer' },
    { field: 'updatedBy', headerName: 'Updated By', show: true, cellRenderer: 'updatedByRenderer' }
  ];
  if (columnState) {
    columns.map((item) => {
      columnState.map((d) => {
        if (d.colId == item.field) {
          item.show = !d.hide;
        }
      });
    });
  }
  //  Grid Variables - End

  const { priceTemplateApi } = priceTemplate;

  const [isOpenDialog, setisOpenDialog] = useState(false);

  const handleOpen = () => {
    setisOpenDialog(true);
  };

  const handleClose = () => {
    setisOpenDialog(false);
  };

  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClickClose = () => {
    setOpen(false);
  };

  useEffect(() => {
    if (permissions && permissions.priceTemplate) {
      setpriceTemplatePermissions(permissions.priceTemplate);
    }
  }, [permissions]);

  useEffect(() => {
    let millisec = Object.keys(search).length > 0 ? 600 : 5;
    if (priceTemplateTimeout) {
      clearTimeout(priceTemplateTimeout);
    }

    priceTemplateTimeout = setTimeout(() => {
      fetchpriceTemplate();
    }, millisec);
  }, [search]);

  useEffect(() => {
    if (renderCount > 0) {
      fetchpriceTemplate();
    } else setRenderCount((preCount) => preCount + 1);
  }, [page, limit, filters, sorting, selectedEntity]);

  const NameRenderer = (params) => (
    <Link className="link" to={`${routes.priceTemplate.path}/${params.data._id}`} title={params.value}>
      {params.value}
    </Link>
  );

  const ActionsRenderer = (params) => (
    <>
      {priceTemplatePermissions.isCreate && (
        <Tooltip title="Clone">
          <IconButton size="small" aria-label="Clone" onClick={() => CreateNew(params.data.id, true)}>
            <FileCopyIcon color="primary" />
          </IconButton>
        </Tooltip>
      )}
      {priceTemplatePermissions.isDelete && user?.user?._id === params.data?.owner ? (
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
      history.push(routes.priceTemplate.path + '/' + id, { isClone: true });
    } else {
      history.push(routes.priceTemplate.path + '/0', { isClone: false });
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
      .put(`${routes.priceTemplate.path}/remove`, { ids: ids })
      .then(({ data }) => {
        fetchpriceTemplate();
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
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(updatedFilters))}&filterType=and`;
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }

    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURIComponent(search)}`;
    }

    return deepFilter;
  };

  const fetchpriceTemplate = () => {
    const queryString = getQueryString();
    dispatch({ type: 'loading', loading: true });

    if (gridApi) {
      gridApi.setRowData([]);
    }

    axiosInstance()
      .get(`${priceTemplateApi}${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
          const { createdBy, updatedBy, staticData, ...restProperties } = u;

          let finalObject = prepareDataForGrid(u);
          finalObject['canDelete'] = permissions.productTemplate.isDelete && user?.user?._id === u?.owner;
          finalObject['isChecked'] = selectedRecords.some((s) => s._id === u._id);
          finalObject['allowedToEdit'] = permissions.productTemplate.isUpdate;
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
        <CustomBreadCrumbs routes={[routes.priceTemplate]} />
      </div>
      <CustomContainer>
        <div className="header-panel">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={'d-flex align-items-center gap-1'}>
              {isMobile && !isTablet && (
                <div className="d-flex flex-wrap items-center justify-between w-full">
                  <div></div>
                  <div className="flex flex-wrap items-center gap-1 ml-auto">
                    <IconButton
                      onClick={handleClickOpen}
                      id="demo-customized-button"
                      aria-controls="demo-customized-menu"
                      aria-haspopup="true"
                      // aria-expanded={open ? 'true' : undefined}
                      className={'mobileIconButton secondary'}
                      size="small"
                    >
                      <TbArrowsSort className="rotate-90" size={16} />
                    </IconButton>

                    <MobileSortDialog
                      isOpen={open}
                      handleClose={handleClickClose}
                      contentPart={null}
                      secHeading={['Sort Price Templates']}
                      columns={columns}
                      dispatch={dispatch}
                    />

                    <IconButton
                      id="demo-customized-button"
                      aria-controls="demo-customized-menu"
                      aria-haspopup="true"
                      // aria-expanded={open ? 'true' : undefined}
                      className={'mobileIconButton secondary'}
                      size="small"
                      onClick={handleOpen}
                    >
                      <MdOutlineFilterAlt size={16} />
                    </IconButton>

                    <MobileFilterDialog
                      isOpen={isOpenDialog}
                      handleClose={handleClose}
                      contentPart={null}
                      columns={columns}
                      dispatch={dispatch}
                      title={routes?.priceTemplate?.title}
                      filters={filters}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-[8px]  justify-end">
              <SearchBox onChange={handleSearch} className={styles.search_box_input} value={search} />

              <div className="flex gap-[8px] flex-wrap items-center">
                {priceTemplatePermissions.isCreate && (
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
                {priceTemplatePermissions.isDelete && (
                  <Button
                    variant={'contained'}
                    color="default"
                    size="small"
                    onClick={openActions}
                    disabled={selectedRecords.length ? false : true}
                    aria-controls="action-menu"
                    className={` new-dropdown-v1`}
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
            permissions={priceTemplatePermissions}
            primaryField={columns?.find((d) => d.primaryField)}
            onClick={(data) => {
              history.push(`${routes.priceTemplate.path}/${data._id}`);
            }}
            dataRows={dataRows}
            selectedRecords={selectedRecords}
            dispatch={dispatch}
            onEdit={(data) => {
              history.push(`${routes.priceTemplate.path}/${data._id}`);
            }}
            extraParamsToCheckDelete={true}
            onDelete={handleDelete}
            rowCount={rowCount}
            page={page}
            loading={loading}
            additionalDetails={[]}
            chips={[]}
            owerCollaboratorInitialsOrImages=""
            onCreate={false}
            showClone={true}
            onClone={(data) => {
              CreateNew(data.id, true);
            }}
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
            actionWidth={150}
            loading={loading}
            renderedFrom={renderedFrom}
            refreshGrid={fetchpriceTemplate}
          />
        )}
        {showDeleteConfirmBox && (
          <ConfirmationDialog
            open={showDeleteConfirmBox}
            message={`Are you sure, you want to delete ${routes?.priceTemplate?.title?.toLowerCase()} ${
              deleteRecord?._id ? deleteRecord?.name : ''
            } ?`}
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

export default PriceTemplate;
