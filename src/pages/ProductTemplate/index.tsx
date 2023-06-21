import { useState, FC, useEffect, useContext, useReducer, Fragment } from 'react';
import { Box, Button, Grid, IconButton, Menu, MenuItem, Tooltip } from '@material-ui/core';
import { Link, useHistory } from 'react-router-dom';
import { productTemplate, isObjectEmpty, gridLoadingTimeout } from '../../constants/helpers';
import axiosInstance from '../../axios/axiosInstance';
import Layout from '../../components/Layout';
import routes from './../../components/Helpers/Routes';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import styles from '../Leads/Header.module.scss';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import AddIcon from '@material-ui/icons/Add';
import { useData } from '../../StateProvider/Provider';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { CommonRenderer, CreatedByRenderer, UpdatedByRenderer } from '../../components/AgGridComponents/CustomAgGridCellRenderers';
import CustomAgGrid, { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';
import CustomContainer from '../../components/CustomContainer';
import DeleteIcon from '@material-ui/icons/Delete';
import { ImInsertTemplate } from 'react-icons/im';
import SearchBox from '../../components/Helpers/SearchBox';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { MdAccountCircle } from 'react-icons/md';
import { AiFillCrown, MdAdd, MdSort, MdFilterList } from 'react-icons/all';
import CustomSwipableList from '../../components/SwipableListComponents/CustomSwipableList';
import { isMobile, isTablet } from 'react-device-detect';
import { prepareDataForGrid } from '../../constants/helpers';
import MobileFilterDialog from '../../components/MobileFilterDialog';
import MobileSortDialog from '../../components/MobileSortDialog';
import { camelCase } from 'lodash';

let productTemplateTimeout;

const ProductTemplate: FC = () => {
  const renderedFrom = camelCase(routes?.productTemplate.title);
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();
  const [renderCount, setRenderCount] = useState(0);
  const [productTemplatePermissions, setProductTemplatePermissions] = useState({
    isCreate: permissions?.productTemplate?.isCreate,
    isUpdate: permissions?.productTemplate?.isUpdate,
    isRead: permissions?.productTemplate?.isRead,
    isDelete: permissions?.productTemplate?.isDelete
  });

  const [anchorEl, setAnchorEl] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  //  Grid Variables - Start
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } =
    state;
  const [isAllChecked, setIsAllChecked] = useState(false);
  const [clonedData, setClonedData] = useState([]);
  const localStorageSelectedRecords = `${renderedFrom}_selected`;
  const [open, setOpen] = useState(false);
  const [isOpenDialog, setisOpenDialog] = useState(false);
  const columnState = JSON.parse(localStorage.getItem('productTemplatePage'));
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
  const { productTemplateApi } = productTemplate;

  useEffect(() => {
    if (permissions && permissions.productTemplate) {
      setProductTemplatePermissions(permissions.productTemplate);
    }
  }, [permissions]);

  useEffect(() => {
    let millisec = Object.keys(search).length > 0 ? 600 : 5;
    if (productTemplateTimeout) {
      clearTimeout(productTemplateTimeout);
    }

    productTemplateTimeout = setTimeout(() => {
      fetchProductTemplate();
    }, millisec);
  }, [search]);

  useEffect(() => {
    if (renderCount > 0) {
      fetchProductTemplate();
    } else setRenderCount((preCount) => preCount + 1);
  }, [page, limit, filters, sorting, selectedEntity, showFilteredRecordsOnly]);

  const NameRenderer = (params) => (
    <Link className="link" to={`${routes.productTemplate.path}/${params.data._id}`} title={params.value}>
      {params.value}
    </Link>
  );

  const ActionsRenderer = (params) => (
    <>
      {productTemplatePermissions.isCreate && (
        <Tooltip title="Clone">
          <IconButton size="small" aria-label="Clone" onClick={() => CreateNew(params.data.id, true)}>
            <FileCopyIcon color="primary" />
          </IconButton>
        </Tooltip>
      )}
      {productTemplatePermissions.isDelete && user?.user?._id === params.data?.owner ? (
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

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const CreateNew = (id, isClone) => {
    if (isClone) {
      history.push(routes.productTemplate.path + '/' + id, { isClone: true });
    } else {
      history.push(routes.productTemplate.path + '/0', { isClone: false });
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
      .put(`${routes.productTemplate.path}/remove`, { ids: ids })
      .then(({ data }) => {
        fetchProductTemplate();
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
          field: replaceFieldName(field),
          term: filters[field].filter
        });
      });
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

  const fetchProductTemplate = () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    if (gridApi) {
      gridApi.setRowData([]);
    }

    axiosInstance()
      .get(`${productTemplateApi}${queryString}`)
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

          // let res = {
          //     ...restProperties,
          //     id: u._id,
          //     createdBy: u.createdBy?.user?.concatedName,
          //     createdByDate: u.createdBy?.date,
          //     updatedBy: u.updatedBy?.user?.concatedName,
          //     updatedByDate: u.updatedBy?.date,
          // };

          // return res;
        });
        setIsAllChecked(false);
        setClonedData(data);
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

  const handleOpen = () => {
    setisOpenDialog(true);
  };

  const handleClose = () => {
    setisOpenDialog(false);
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClickClose = () => {
    setOpen(false);
  };

  return (
    <Fragment>
      <Grid container className="headerbox">
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs routes={[routes.productTemplate]} />
        </Grid>
      </Grid>
      <CustomContainer>
        <div className="header-panel">
          <Grid container className={styles.filter_side_container}>
            <Grid item xs={12} md={6} sm={12} className={isMobile ? styles.mobile_panel : 'd-flex align-items-center gap-1'}>
              {isMobile && !isTablet && (
                <div className="d-flex ">
                  <Button
                    onClick={handleClickOpen}
                    id="demo-customized-button"
                    aria-controls="demo-customized-menu"
                    aria-haspopup="true"
                    // aria-expanded={open ? 'true' : undefined}
                    color="secondary"
                    variant="text"
                    disableElevation
                    startIcon={<MdSort />}
                  >
                    Sort
                  </Button>

                  <MobileSortDialog
                    isOpen={open}
                    handleClose={handleClickClose}
                    contentPart={null}
                    secHeading={['Sort Product Template']}
                    columns={columns}
                    dispatch={dispatch}
                  />

                  <Button
                    id="demo-customized-button"
                    aria-controls="demo-customized-menu"
                    aria-haspopup="true"
                    // aria-expanded={open ? 'true' : undefined}
                    variant="text"
                    color="secondary"
                    disableElevation
                    startIcon={<MdFilterList />}
                    onClick={handleOpen}
                  >
                    Filter
                  </Button>
                  <MobileFilterDialog
                    isOpen={isOpenDialog}
                    handleClose={handleClose}
                    contentPart={null}
                    columns={columns}
                    dispatch={dispatch}
                    title={routes?.productTemplate?.title}
                    filters={filters}
                  />
                </div>
              )}
            </Grid>
            <Grid md={6} sm={12} xs={12} container className={styles.filter_side}>
              <Box className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} component="div">
                <Grid style={{ display: 'flex', flex: 1 }}>
                  <SearchBox
                    onChange={handleSearch}
                    className={styles.search_box_input}
                    width={isMobile ? '200px' : '242px'}
                    style={isMobile ? { flex: 1 } : {}}
                    value={search}
                  />
                </Grid>

                <Grid style={{ display: 'flex', gap: '5px' }}>
                  {productTemplatePermissions.isCreate && (
                    <Button
                      onClick={() => CreateNew('0', false)}
                      variant={isMobile && !isTablet ? 'text' : 'contained'}
                      size="small"
                      color="primary"
                      className={isMobile && !isTablet ? 'mobile_button' : styles.add_submit_btn}
                      startIcon={isMobile && !isTablet ? null : <AddOutlined />}
                    >
                      {isMobile && !isTablet ? <MdAdd size={23} /> : 'Add'}
                    </Button>
                  )}
                  {productTemplatePermissions.isDelete && (
                    <Button
                      variant={isMobile && !isTablet ? 'text' : 'outlined'}
                      color="default"
                      size="small"
                      onClick={openActions}
                      disabled={selectedRecords.length ? false : true}
                      aria-controls="action-menu"
                      className={isMobile && !isTablet ? 'mobile_button' : styles.action_submit_btn}
                      endIcon={<ExpandMore />}
                    >
                      {isMobile && !isTablet ? '' : 'Actions'}
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
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </div>
        {isMobile && !isTablet ? (
          <CustomSwipableList
            allowSelection={true}
            allowSwipe={true}
            permissions={productTemplatePermissions}
            primaryField={columns?.find((d) => d.primaryField)}
            onClick={(data) => {
              history.push(`${routes.productTemplate.path}/${data._id}`);
            }}
            dataRows={dataRows}
            selectedRecords={selectedRecords}
            dispatch={dispatch}
            onEdit={(data) => {
              history.push(`${routes.productTemplate.path}/${data._id}`);
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
            refreshGrid={fetchProductTemplate}
            showOnlyShowFilteredRecordSwitch={true}
          />
        )}
        {showDeleteConfirmBox && (
          <ConfirmationDialog
            open={showDeleteConfirmBox}
            message={`Are you sure you want to delete ${routes?.productTemplate?.title?.toLowerCase()} ${deleteRecord?.name || ''} ?`}
            onClose={() => {
              setDeleteRecord(null);
              setShowDeleteConfirmBox(false);
            }}
            onOk={handleDelete}
          />
        )}
      </CustomContainer>
    </Fragment>
  );
};

export default ProductTemplate;
