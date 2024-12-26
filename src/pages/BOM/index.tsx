import { useState, useEffect, useContext } from 'react';
import { Box, Button, Menu, MenuItem } from '@mui/material';
import { useParams } from 'react-router-dom';
import { product, prepareDataForGrid, gridLoadingTimeout, sidebarResource } from '../../constants/helpers';
import axiosInstance from '../../axios/axiosInstance';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import routes from '../../components/Helpers/Routes';
import { AiOutlineApartment } from 'react-icons/ai';
import { AddOutlined, ExpandMore } from '@mui/icons-material';
import { Delete } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import { useData } from '../../StateProvider/Provider';
import CustomReactTable, { getStaticFields, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import AssignProductDialog from '../../components/AssignRolesDialog/AssignProductDialog';
import ConfirmationDialogRaw from '../../components/Helpers/ConfirmationDialog';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { camelCase } from 'lodash';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

const BOMTable = () => {
  const { id } = useParams();

  const renderedFrom = `${camelCase(sidebarResource.product)}_bom`;
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, filters, sorting, selectedRecords } = state;
  const { generateColumns } = useColumns();

  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);

  const {
    state: { permissions, selectedEntity, resources }
  }: any = useData();

  const [customizedRoutes, setCustomizedRoutes] = useState([]);
  const [showConfirmBox, setShowConfirmBox] = useState({ open: false, data: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [columns, setColumns] = useState(null);
  const [openAssignProductDialog, setOpenAssignProductDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [parts, setParts] = useState([]);
  const [isSubmitting, setSubmitting] = useState(false);

  const defaultColumns = [
    {
      accessor: 'qty',
      Header: 'Qty',
      minWidth: 180,
      width: 180,
      editable: true,
      Cell: ({ row }) => <h5 className="text-truncate">{row?.original?.qty || <NoDataCell />}</h5>
    }
  ];

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = () => {
    axiosInstance()
      .get('/field?resource=Product&view=true')
      .then(({ data: { data } }) => {
        let columns = [];
        const newColumns = generateColumns(renderedFrom, data, routes.productDetail.path, true);
        columns = [...newColumns, ...getStaticFields(), ActionsRenderer];
        setColumns([...defaultColumns, ...columns]);
      });
  };

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 100,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        <HtmlTooltip title="Delete">
          <IconButton
            size="small"
            aria-label="Delete"
            onClick={() => {
              setDeleteRecord(row.original);
              setShowDeleteConfirmBox(true);
            }}
          >
            <Delete fontSize="small" color="error" />
          </IconButton>
        </HtmlTooltip>
      </>
    )
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
          { title: resources?.product?.titlePlural, path: routes.product.path },
          { title: productData?.productName, path: `${routes.productDetail.path}/${id}` },
          { title: 'Child Product' }
        ]);
      });
  };

  const fetchBOMData = () => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .get(`/product/${id}/bom`)
      .then(({ data: { data } }) => {
        data = data.map((o: any) => {
          let finalObject = {
            ...o?.childProductDetail,
            ...o
          };
          return prepareDataForGrid(finalObject);
        });
        dispatch({ type: 'initialize', data: data, count: data?.length });
        setParts([...data]);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      })
      .finally(() => {
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
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
            toastConfig.setToastConfig(err);
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
          toastConfig.setToastConfig(err);
          setIsDeleting(false);
        });
    }
    dispatch({ type: 'selection', selectedRecords: [] });
  };

  const handleValueUpdate = (data, row) => {
    if (!data || !data?.qty) return;
    const bomId = row?._id;

    axiosInstance()
      .put(`${product.api}/${id}/bom/${bomId}`, {
        qty: Number(data?.qty)
      })
      .then(() => {
        fetchBOMData();
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleAdd = async (rows) => {
    setSubmitting(true);
    const dataObj = rows
      .filter((d) => d.qty > 0)
      .map((d) => {
        return { childProduct: d.id, qty: Number(d.qty) };
      });
    await axiosInstance()
      .post(`/product/${id}/bom`, dataObj)
      .then(({ data }) => {
        if (permissions?.serializedAsset) fetchBOMData();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setOpenAssignProductDialog(false);
        setSubmitting(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setSubmitting(false);
      });
  };

  return (
    <div>
      <div className="headerbox">
        <CustomBreadCrumbs routes={customizedRoutes} />
      </div>
      <div className="main-container">
        <div className="header-panel">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className={'align-items-center flex w-full justify-between gap-1'}>
              <AiOutlineApartment className="headerLogo" />
              <span className="listingHeader">Child Product</span>
            </div>
            <div className="flex flex-wrap justify-end gap-[8px]">
              <div className="flex flex-wrap items-center gap-[8px]">
                <Button
                  variant={'contained'}
                  color="primary"
                  size="small"
                  className={`no-shadow`}
                  onClick={() => {
                    setOpenAssignProductDialog(true);
                  }}
                  startIcon={<AddOutlined />}
                >
                  Add
                </Button>
                <Button
                  variant={'outlined'}
                  color="default"
                  size="small"
                  onClick={openActions}
                  className={`new-dropdown-v1`}
                  aria-controls="action-menu"
                  endIcon={<ExpandMore />}
                  disabled={selectedRecords?.length ? false : true}
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
                  <MenuItem
                    disabled={selectedRecords?.every((e) => !e.canDelete) ? true : false}
                    onClick={() => {
                      if (selectedRecords.length === 1) {
                        setDeleteRecord(selectedRecords[0]);
                      } else {
                        setDeleteRecord(null);
                      }
                      setShowDeleteConfirmBox(true);
                    }}
                  >
                    {`Delete (${selectedRecords?.length})`}
                  </MenuItem>
                </Menu>
              </div>
            </div>
          </div>
        </div>
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 350px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            onSaveEdit={handleValueUpdate}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
            refreshGrid={fetchBOMData}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </div>
      {showDeleteConfirmBox && (
        <ConfirmationDialogRaw
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete ${deleteRecord
              ? `${resources?.product?.titleSingular?.toLowerCase()} :
            ${deleteRecord?.productName || ''}`
              : resources?.product?.titlePlural?.toLowerCase()
            } ?`}
          okBtnLoading={isDeleting}
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          onOk={handleRemove}
        />
      )}
      {openAssignProductDialog && (
        <AssignProductDialog
          handleCloseDialog={() => setOpenAssignProductDialog(false)}
          ids={[...parts?.map((p) => p.childProduct), id]}
          onSuccess={(rows) => {
            handleAdd(rows);
          }}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};

export default BOMTable;
