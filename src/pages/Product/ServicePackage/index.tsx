import { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { Box, Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import routes from 'src/components/Helpers/Routes';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import CustomAgGrid, { reducer, intialState } from 'src/components/AgGridComponents/CustomAgGrid';
import { isObjectEmpty, gridLoadingTimeout, product, packages } from 'src/constants/helpers';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { useData } from 'src/StateProvider/Provider';
import useColumns, { getFrameworkComponents } from 'src/constants/useColumns';
import { prepareDataForGrid } from 'src/constants/helpers';
import CustomSwipableList from 'src/components/SwipableListComponents/CustomSwipableList';
import { isMobile, isTablet } from 'react-device-detect';
import { useHistory } from 'react-router-dom';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import DeleteButton from 'src/components/Helpers/DeleteButton';
import { HiBadgeCheck } from 'react-icons/hi';
import { FcApproval } from 'react-icons/fc';
import AssignPackageDialog from 'src/components/AssignRolesDialog/AssignPackageDialog';
import ImportExportMenu from 'src/components/Helpers/ImportExportMenu';
import { ExpandMore } from '@material-ui/icons';

const ServicePackage = ({ renderedFrom, productId }) => {
  const localStorageSelectedRecords = `${renderedFrom}_selected`;

  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const [gridApi, setGridApi] = useState(null);
  const [columns, setColumns] = useState([]);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [isDeleting, setDeleting] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [frameWorkComponent, setFrameWorkComponent] = useState({});
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } =
    state;

  const [anchorEl, setAnchorEl] = useState(null);

  const {
    state: { permissions, selectedEntity }
  }: any = useData();
  const { getColumnData } = useColumns();

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    fetchData();
  }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly]);

  const fetchGridColumns = () => {
    setColumns(null);
    axiosInstance()
      .get(`/field?resource=${packages.resource}`)
      .then(({ data: { data } }) => {
        let columns = [];
        let rendererNames = [];
        data.forEach((o) => {
          let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.packagesDetail.path);
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
        setColumns([...columns]);
      });
  };

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    const queryString = getQueryString();
    axiosInstance()
      .get(`${product.api}/${productId}/package${queryString}`)
      .then(({ data: { data } }) => {
        let rows = data?.map((u) => {
          let finalObject = prepareDataForGrid(u);
          let res = {
            ...finalObject
          };
          return res;
        });
        dispatch({
          type: 'initialize',
          data: rows,
          count: data.length
        });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
        fetchGridColumns();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}`;
    let filterById = [];
    if (filterById.length > 0) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterById)}`;
    }
    if (!isObjectEmpty(filters)) {
      const updatedFilters = [];
      Object.keys(filters).forEach((field) => {
        updatedFilters.push({
          field: field,
          term: filters[field].filter
        });
      });
      deepFilter = `${deepFilter}&deepFilter=${JSON.stringify(updatedFilters)}&filterType=and`;
    }
    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }
    if (search) {
      deepFilter = `${deepFilter}&search=${search}`;
    }
    if (showFilteredRecordsOnly) {
      const savedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
      deepFilter = `${deepFilter}&getById=${JSON.stringify(savedRecords.map((m) => m._id))}`;
    }
    return deepFilter;
  };


  const ActionsRenderer = (params) => (
    <>
      {permissions?.product?.isUpdate &&
        (params?.data?.default ? (
          <HtmlTooltip title={'Remove Default'}>
            <IconButton
              aria-label={'Default'}
              size="small"
              onClick={() => {
                handleUpdate({
                  ids: [params?.data?._id],
                  default: !params?.data?.default
                });
              }}
            >
              <FcApproval />
            </IconButton>
          </HtmlTooltip>
        ) : (
          <HtmlTooltip title={'Set Default'}>
            <IconButton
              aria-label={'Default'}
              size="small"
              onClick={() => {
                handleUpdate({
                  ids: [params?.data?._id],
                  default: !params?.data?.default
                });
              }}
            >
              <HiBadgeCheck />
            </IconButton>
          </HtmlTooltip>
        ))}
      {permissions?.product?.isUpdate && (
        <HtmlTooltip title="Delete">
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
        </HtmlTooltip>
      )}
    </>
  );

  const handleDelete = () => {
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
      setDeleteRecord(null);
    } else {
      ids = selectedRecords.map((d) => d._id);
    }
    setDeleting(true);
    closeActions();
    axiosInstance()
      .put(`${product.api}/${productId}/package/remove`, { ids: ids })
      .then(() => {
        fetchData();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
        setDeleting(false);
        if (ids.length) {
          let selectedArray = JSON.parse(localStorage.getItem(localStorageSelectedRecords));
          selectedArray = selectedArray.filter((item) => !ids.includes(item.id));
          localStorage.setItem(localStorageSelectedRecords, JSON.stringify(selectedArray));
        }
      })
      .catch((error) => {
        setDeleting(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleUpdate = (data: any) => {
    axiosInstance()
      .put(`${product.api}/${productId}/package`, data)
      .then(() => {
        fetchData();
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleSubmit = (rows) => {
    setSubmitting(true);
    axiosInstance()
      .post(`${product.api}/${productId}/package`, {
        package: rows?.map((e) => e?._id)
      })
      .then(() => {
        fetchData();
        setSubmitting(false);
        setOpenAddDialog(false);
      })
      .catch((err) => {
        setSubmitting(false);
        toastConfig.setToastConfig(err);
      });
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  return (
    <Fragment>
      {permissions?.product?.isUpdate && (
        <Box display="flex" justifyContent="space-between" p={1} pt={2} pb={2}>
          <Button variant="contained" color="primary" size="small" onClick={() => setOpenAddDialog(true)}>
            Add Service Packages
          </Button>
          <Box display={'flex'}>
            <Box>
              <Button
                variant={isMobile && !isTablet ? 'text' : 'outlined'}
                color="default"
                size="small"
                onClick={openActions}
                disabled={selectedRecords.length ? false : true}
                aria-controls="action-menu"
                style={{ marginLeft: '0.6rem' }}
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
                <MenuItem disabled={selectedRecords.length === 0} onClick={() => setShowDeleteConfirmBox(true)}>
                  Delete
                </MenuItem>
              </Menu>
            </Box>
            <Box ml={1}></Box>
            <Box display="flex" style={{ marginLeft: 'auto' }}>
              <ImportExportMenu
                permissions={permissions?.packages}
                module="packages-products"
                api={`${product.api}/unknown/package`}
                afterImportCompleted={() => {
                  fetchData();
                }}
                isExportAllOrSomeFeature={true}
                ids={[]}
                additionalParams={`productId=${productId}`}
              />
            </Box>
          </Box>
        </Box>
      )}
      {columns && Object.keys(frameWorkComponent).length > 0 ? (
        isMobile && !isTablet ? (
          <CustomSwipableList
            allowSelection={true}
            allowSwipe={false}
            permissions={permissions?.product}
            primaryField={columns?.find((d) => d.primaryField)}
            onClick={(data) => {
              history.push(`${routes.packagesDetail.path}/${data._id}`);
            }}
            dataRows={dataRows}
            selectedRecords={selectedRecords}
            dispatch={dispatch}
            onEdit={() => {}}
            extraParamsToCheckDelete={false}
            onDelete={() => {}}
            rowCount={rowCount}
            page={page}
            loading={loading}
            additionalDetails={[]}
            chips={[]}
            onCreate={false}
            showClone={true}
            onClone={() => {}}
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
            allowSelection={permissions?.product.isUpdate}
            allowAction={permissions?.product.isUpdate}
            actionWidth={100}
            loading={loading}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
            refreshGrid={fetchData}
            showOnlyShowFilteredRecordSwitch={false}
          />
        )
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {showDeleteConfirmBox && (
        <ConfirmationDialog
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete the ${routes.packages?.title} ? `}
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          onOk={handleDelete}
          okBtnLoading={isDeleting}
        />
      )}
      {openAddDialog && (
        <AssignPackageDialog
          referenceType="product"
          handleClose={() => setOpenAddDialog(false)}
          ids={[...dataRows?.map((e) => e._id)]}
          onSuccess={(rows) => {
            handleSubmit(rows);
          }}
          packageType={'Service'}
        />
      )}
    </Fragment>
  );
};

export default ServicePackage;
