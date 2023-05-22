import { useState, useEffect, useContext, Fragment, useReducer } from 'react';
import { Box, Grid, Button, Menu, MenuItem } from '@material-ui/core';
import { product, prepareDataForGrid } from '../../../constants/helpers';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import { Delete, ExpandMore } from '@material-ui/icons';
import { IconButton, Tooltip } from '@material-ui/core';
import { useData } from '../../../StateProvider/Provider';
import CustomAgGrid, { reducer, intialState } from '../../../components/AgGridComponents/CustomAgGrid';
import AssignProductDialog from '../../../components/AssignRolesDialog/AssignProductDialog';
import ConfirmationDialogRaw from '../../../components/Helpers/ConfirmationDialog';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { camelCase } from 'lodash';
import useColumns, { getFrameworkComponents } from '../../../constants/useColumns';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ImportExportMenu from 'src/components/Helpers/ImportExportMenu';
import { isMobile, isTablet } from 'react-device-detect';

function Parts({ id }) {
  const renderedFrom = `${camelCase(routes?.product.title)}_bom`;
  const localStorageSelectedRecords = `${renderedFrom}_selected`;

  const {
    state: { permissions, user, selectedEntity }
  }: any = useData();
  const hasPermissions = permissions && permissions[product.permission]?.isUpdate;
  const { setToastConfig } = useContext(CustomToastContext);

  const [parts, setParts] = useState([]);
  const [showConfirmBox, setShowConfirmBox] = useState({ open: false, data: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [openAssignProductDialog, setOpenAssignProductDialog] = useState(false);
  const { getColumnData } = useColumns();

  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const [columns, setColumns] = useState([]);
  const [frameWorkComponent, setFrameWorkComponent] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const { dataRows, rowCount, loading: gridLoading, page, pageSizes, search, filters, sorting, selectedRecords, limit, appendRows } = state;

  const defaultColumns = [
    { field: 'qty', headerName: 'Qty', show: true, cellRenderer: 'commonRenderer', cellEditor: 'numericCellEditor', editable: true }
  ];

  useEffect(() => {
    if (id) {
      fetchBOMData();
    }
  }, [id, page, limit, search, filters, sorting, selectedEntity]);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchBOMData = () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    axiosInstance()
      .get(`/product/${id}/bom`)
      .then(({ data: { data } }) => {
        data = data.map((o: any) => {
          let finalObject = {
            ...o,
            ...o?.childProductDetail
          };
          return prepareDataForGrid(finalObject);
        });
        if (appendRows) {
          dispatch({
            type: 'initialize',
            data: [...dataRows, ...data],
            count: data.length,
            selectedRecords: [...dataRows, ...data].filter((f) => f.isChecked === true)
          });
        } else {
          dispatch({
            type: 'initialize',
            data: data,
            count: data.length,
            selectedRecords: data.filter((f) => f.isChecked === true)
          });
        }
        if (gridApi) {
          try {
            let oldSelectedRecords = localStorage.getItem(localStorageSelectedRecords)
              ? JSON.parse(localStorage.getItem(localStorageSelectedRecords))
              : [];
            if (oldSelectedRecords.length > 0) {
              gridApi.forEachNode(function (node) {
                node.setSelected(oldSelectedRecords.some((o) => o === node.data._id));
              });
            }
          } catch (ex) {
            console.error('Error in getting selected records from local storage');
          }
        }
        setParts([...data]);
        dispatch({ type: 'loading', loading: false });
      })
      .catch((err) => {
        dispatch({ type: 'loading', loading: false });
      });
  };

  const fetchGridColumns = () => {
    axiosInstance()
      .get('/field?resource=Product&view=true')
      .then(({ data: { data } }) => {
        let columns = [];
        let rendererNames = [];
        data.forEach((o) => {
          let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.productDetail.path);
          if (currentColumn !== null) {
            columns = [...columns, currentColumn?.columnData];
            if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
              rendererNames.push(currentColumn?.rendererName);
            }
          }
        });
        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
        tempFrameworkComponent = {
          ...tempFrameworkComponent
        };
        setFrameWorkComponent({
          ...tempFrameworkComponent,
          actionsRenderer: ActionsRenderer
        });
        setColumns([...defaultColumns, ...columns]);
      });
  };

  const handleRemove = () => {
    setIsDeleting(true);
    closeActions();
    const { data } = showConfirmBox;
    if (data.length > 1) {
      data.forEach((p: any) => {
        axiosInstance()
          .put(`${product.api}/${p.product}/bom/remove`, {
            ids: [p.id]
          })
          .then(() => {
            setIsDeleting(false);
            setShowConfirmBox({ open: false, data: null });
            fetchBOMData();
          })
          .catch((err) => {
            setToastConfig(err);
            setIsDeleting(false);
          });
      });
    } else {
      let d = data[0];
      axiosInstance()
        .put(`${product.api}/${d.product}/bom/remove`, {
          ids: [d.id]
        })
        .then(() => {
          setIsDeleting(false);
          setShowConfirmBox({ open: false, data: null });
          fetchBOMData();
        })
        .catch((err) => {
          setToastConfig(err);
          setIsDeleting(false);
        });
    }
  };

  const ActionsRenderer = (params) =>
    hasPermissions && (
      <Tooltip title="Delete">
        <IconButton
          size="small"
          onClick={() => {
            setShowConfirmBox({ open: true, data: [params.data] });
          }}
        >
          <Delete fontSize="small" color="error" />
        </IconButton>
      </Tooltip>
    );

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      {hasPermissions && (
        <Box display="flex" justifyContent="space-between" p={1} pt={2} pb={2}>
          <Button variant="contained" color="primary" size="small" onClick={() => setOpenAssignProductDialog(true)}>
            Add Products
          </Button>
          <Box display={'flex'}>
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
              <MenuItem disabled={selectedRecords.length === 0} onClick={() => setShowConfirmBox({ open: true, data: selectedRecords })}>
                Delete
              </MenuItem>
            </Menu>
            <Box ml={1} />
            <Box display="flex" style={{ marginLeft: 'auto' }}>
              <ImportExportMenu
                permissions={permissions?.packages}
                module="packages-products"
                api={`${product.api}/unknown/bom`}
                afterImportCompleted={() => {
                  fetchBOMData();
                }}
                isExportAllOrSomeFeature={true}
                ids={[]}
                additionalParams={`productId=${id}`}
              />
            </Box>
          </Box>
        </Box>
      )}
      {frameWorkComponent ? (
        <CustomAgGrid
          allowSelection={hasPermissions}
          allowAction={hasPermissions}
          columns={columns}
          dataRows={dataRows}
          isClientSideGrid={true}
          frameworkComponents={frameWorkComponent}
          setGridApi={setGridApi}
          dispatch={dispatch}
          rowCount={rowCount}
          limit={limit}
          pageSizes={pageSizes}
          page={page}
          actionWidth={150}
          loading={gridLoading}
          renderedFrom={renderedFrom}
          refreshGrid={fetchBOMData}
        />
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {showConfirmBox.open && (
        <ConfirmationDialogRaw
          open={true}
          message={`Are you sure you want to delete this product(s)?`}
          okBtnLoading={isDeleting}
          onClose={() => {
            setShowConfirmBox({ open: false, data: null });
          }}
          onOk={handleRemove}
        />
      )}
      {openAssignProductDialog && (
        <AssignProductDialog
          productsDialogOpen={openAssignProductDialog}
          productId={id}
          handleCloseDialog={() => setOpenAssignProductDialog(false)}
          assignedProducts={[...parts?.map((p) => p.childProduct), id]}
          onSuccess={() => {
            if (permissions?.serializedAsset) {
              fetchBOMData();
            }
            setOpenAssignProductDialog(false);
          }}
        />
      )}
    </div>
  );
}

export default Parts;
