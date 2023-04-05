import { useState, useEffect, useContext, Fragment, useReducer } from 'react';
import MaterialTable from 'material-table';
import { Avatar, Box, Chip, Grid, Button, Menu, MenuItem } from '@material-ui/core';
import { Link, useParams, useLocation } from 'react-router-dom';
import { materialTableIcons, product, isObjectEmpty, prepareDataForGrid } from '../../constants/helpers';
import axiosInstance from '../../axios/axiosInstance';
import styles from '../Leads/Header.module.scss';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import routes from '../../components/Helpers/Routes';
import { AiOutlineApartment } from 'react-icons/ai';
import { MdAdd } from 'react-icons/md';
import { isMobile, isTablet } from 'react-device-detect';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import { Delete } from '@material-ui/icons';
import { IconButton, Tooltip } from '@material-ui/core';
import { useData } from '../../StateProvider/Provider';
import CustomAgGridEditable from '../../components/AgGridComponents/CustomAgGridEditable';
import AssignProductDialog from '../../components/AssignRolesDialog/AssignProductDialog';
import ConfirmationDialogRaw from '../../components/Helpers/ConfirmationDialog';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { camelCase } from 'lodash';
import useColumns, { getStaticFields, getFrameworkComponents } from '../../constants/useColumns';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';

const BOMTable = () => {
  const { id } = useParams();

  const renderedFrom = `${camelCase(routes?.product.title)}_bom`;
  const localStorageSelectedRecords = `${routes.product.title}_selected`;

  const { setToastConfig } = useContext(CustomToastContext);
  const [customizedRoutes, setCustomizedRoutes] = useState([]);
  const [showConfirmBox, setShowConfirmBox] = useState({ open: false, data: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [gridApi, setGridApi] = useState(null);
  const {
    state: { permissions, user, selectedEntity }
  }: any = useData();
  const [state, dispatch] = useReducer(reducer, intialState);
  const [columns, setColumns] = useState([]);
  const [openAssignProductDialog, setOpenAssignProductDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const { dataRows, rowCount, loading: gridLoading, page, pageSizes, search, filters, sorting, selectedRecords, limit, appendRows } = state;
  const [parts, setParts] = useState([]);
  const [frameWorkComponent, setFrameWorkComponent] = useState(null);
  const { getColumnData } = useColumns();

  const defaultColumns = [
    { field: 'qty', headerName: 'Qty', show: true, cellRenderer: 'commonRenderer', cellEditor: 'numericCellEditor', editable: true }
  ];

  useEffect(() => {
    fetchGridColumns();
  }, []);

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
        setFrameWorkComponent({ ...tempFrameworkComponent, actionsRenderer: ActionsRenderer });
        columns = [...columns, ...getStaticFields()];
        setColumns([...defaultColumns, ...columns]);
      });
  };

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchBOMData();
    }
  }, [page, limit, filters, sorting, selectedEntity]);

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const fetchProduct = () => {
    axiosInstance()
      .get(`${routes.product.path}/` + id)
      .then(({ data: { data } }) => {
        const { productData } = data;
        setCustomizedRoutes([
          { title: 'Product Master', path: routes.product.path },
          { title: productData?.productName, path: `${routes.productDetail.path}/${id}` },
          { title: 'Child Product' }
        ]);
      });
  };

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

  const handleRemove = () => {
    setIsDeleting(true);
    const { data } = showConfirmBox;
    if (data.length > 1) {
      data.forEach((p: any) => {
        axiosInstance()
          .put(`${product.api}/${p.product}/bom/remove`, {
            ids: [p._id]
          })
          .then(() => {
            setIsDeleting(false);
            setShowConfirmBox({ open: false, data: null });
            fetchBOMData();
            closeActions();
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
          ids: [d._id]
        })
        .then(() => {
          setIsDeleting(false);
          setShowConfirmBox({ open: false, data: null });
          fetchBOMData();
          closeActions();
        })
        .catch((err) => {
          setToastConfig(err);
          setIsDeleting(false);
        });
    }
  };

  const ActionsRenderer = (params) => (
    <Tooltip title="Delete">
      <IconButton
        onClick={() => {
          setShowConfirmBox({ open: true, data: [params.data] });
        }}
      >
        <Delete fontSize="small" color="error" />
      </IconButton>
    </Tooltip>
  );

  const handleValueUpdate = (row) => {
    if (!row || !row?.data) return;
    const bomId = row.data._id;

    axiosInstance()
      .put(`${product.api}/${id}/bom/${bomId}`, {
        qty: Number(row.data.qty)
      })
      .then(() => {
        fetchBOMData();
      })
      .catch((err) => {
        setToastConfig(err);
      });
  };

  return (
    <div>
      <div className="headerbox">
        <CustomBreadCrumbs routes={customizedRoutes} />
      </div>
      <div className="main-container">
        <div className="header-panel">
          <Grid className={styles.filter_side_container} container justify="space-between">
            <Grid item xs={12} md={6} sm={12} className={isMobile ? styles.mobile_panel : 'd-flex align-items-center gap-1'}>
              <div className="d-flex align-items-center">
                <AiOutlineApartment className="headerLogo" />
                <span className="listingHeader">Child Product</span>
              </div>
            </Grid>
            <Grid className={styles.filter_side} item md={6} sm={12} xs={12}>
              <Box className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} component="div">
                <Grid style={{ display: 'flex', gap: '5px' }}>
                  <Button
                    variant={isMobile && !isTablet ? 'text' : 'contained'}
                    color="primary"
                    size="small"
                    startIcon={isMobile && !isTablet ? null : <AddOutlined />}
                    className={isMobile && !isTablet ? 'mobile_button' : styles.add_submit_btn}
                    onClick={() => {
                      setOpenAssignProductDialog(true);
                    }}
                  >
                    {isMobile && !isTablet ? <MdAdd size={23} /> : 'Add'}
                  </Button>
                  <Button
                    variant={isMobile && !isTablet ? 'text' : 'outlined'}
                    color="default"
                    size="small"
                    className={isMobile && !isTablet ? 'mobile_button' : `${styles.add_submit_btn} ${styles.action_new_submit_btn}`}
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
                    <MenuItem onClick={() => setShowConfirmBox({ open: true, data: selectedRecords })}>Delete</MenuItem>
                  </Menu>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </div>
        <Box component="div">
          {frameWorkComponent ? (
            <CustomAgGridEditable
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
              onCellValueChanged={handleValueUpdate}
            />
          ) : (
            <Box p={2} height={500} bgcolor="white">
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </Box>
      </div>
      {showConfirmBox.open && (
        <ConfirmationDialogRaw
          open={true}
          message={`Are you sure you want to delete this product?`}
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
          renderedFrom={`${renderedFrom}_grid-sub-1`}
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
};

export default BOMTable;
