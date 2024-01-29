import { useContext, useEffect, useReducer, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { Box, Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { packages } from 'src/constants/helpers';
import ImportExportMenu from 'src/components/Helpers/ImportExportMenu';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import { useData } from 'src/StateProvider/Provider';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import DeleteIcon from '@material-ui/icons/Delete';
import { camelCase, startCase } from 'lodash';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import AssignSerializedAssetDialog from 'src/components/AssignRolesDialog/AssignSerializedAssetDialog';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { flattenArray } from 'src/constants/columns';

const Products = ({ packageId, packageData }) => {
  const renderedFrom = `${camelCase(routes?.packages.title)}_${packageData?.packageType || 'product'}`;
  const { setToastConfig } = useContext(CustomToastContext);

  const {
    state: { permissions }
  }: any = useData();

  const [columns, setColumns] = useState(null);
  const [showProductConfirmBox, setShowProductConfirmBox] = useState({ open: false, data: null });
  const [showProductAssignDialog, setShowProductAssignDialog] = useState(false);
  const [isRemovingProducts, setRemovingProducts] = useState(false);
  const [anchorActionEl, setAnchorActionEl] = useState(null);

  const [assignAssetDialog, setAssignAssetDialog] = useState({ open: false, products: [] });
  const [isAssetAdding, setIsAssetAdding] = useState(false);

  const [isSubmitting, setSubmitting] = useState(false);
  const { state, dispatch } = useTableReducer();
  const { dataRows, selectedRecords } = state;

  useEffect(() => {
    fetchColumns();
    fetchData();
  }, []);

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    const allAssetsResponce: any = await axiosInstance().get(`${packages.api}/${packageId}/products/assets`);
    const assets = allAssetsResponce?.data?.data || [];

    axiosInstance()
      .get(`${packages.api}/${packageId}/products`)
      .then(({ data: { data } }) => {
        let rows = data;
        rows.forEach((parent, i) => {
          parent.index = i + 1;
          parent.type = 'product';
          parent.detail = parent?.productName;
          parent.description = parent?.productDescription;
          parent.productNumber = parent?.productNumber;
          parent.productCategory = parent?.productCategory?.optionLabel;
          parent.parentId = null;
          parent.qty = parent.qty;
          parent.assetQty = assets?.filter((i) => i.product === parent._id)?.length;
          parent.subRows = generateNestedData(assets, parent);
        });
        dispatch({ type: 'initialize', data: rows, count: rows?.length });
        dispatch({ type: 'loading', loading: false });
      })
      .catch((err) => {
        setToastConfig(err);
      });
  };

  const generateNestedData = (material, parent) => {
    const subRows: any = material.filter((e) => e.product === parent._id);
    subRows.forEach((_subRow, j) => {
      _subRow.index = parent.index + '.' + (j + 1);
      _subRow.type = 'asset';
      _subRow.detail = _subRow?.assetNumber;
      _subRow.description = parent?.description;
      _subRow.productCategory = _subRow?.productCategory?.optionLabel;
      _subRow.parentId = _subRow.product;
      _subRow.qty = 1;
    });
    return subRows;
  };

  const fetchColumns = async () => {
    const {
      data: { data }
    } = await axiosInstance().put(`/field/find-field-labels`, {
      fields: [
        {
          resource: 'Product',
          fieldNames: ['productName', 'productNumber', 'productDescription', 'serializedProduct']
        }
      ]
    });

    const productFields = data?.find((e) => e.resource === 'Product')?.fieldNames || [];

    let coloum: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
        Footer: () => {
          return <>Total</>;
        }
      },
      {
        accessor: 'type',
        Header: 'Type',
        sticky: isMobile ? 'none' : 'left',
        width: 100,
        Cell: ({ row }) => (row.original['type'] ? <p>{`${startCase(row.original?.type)} `}</p> : <NoDataCell />)
      },
      {
        accessor: 'detail',
        Header: 'Details',
        width: 200,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) =>
          row?.original?.type ? (
            <div className="d-flex gap-2 align-items-center">
              <p className="text-truncate">{row.original.detail}</p>
              <IconButton
                size='small'
                onClick={() => {
                  if (row?.original?.type === 'product') {
                    window.open(`${routes.productDetail.path}/${row.original._id}`);
                  } else {
                    window.open(`${routes.serializedAssetDetail.path}/${row.original._id}`)
                  }
                }}
              >
                <OpenInNewIcon fontSize="small" color="primary" />
              </IconButton>
            </div>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'description',
        Header: 'Description',
        width: 200,
        Cell: ({ row }) => {
          return row.original['description'] ? <p className="text-truncate">{row.original.description}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'productNumber',
        Header: productFields?.find((e) => e.fieldName === 'productNumber')?.fieldLabel || 'Product Number',
        width: 200,
        Cell: ({ row }) => {
          return row.original['productNumber'] ? <p className="text-truncate">{row.original.productNumber}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'productCategory',
        Header: 'Product Category',
        width: 200,
        Cell: ({ row }) => {
          return row.original['productCategory'] ? <p className="text-truncate">{row.original.productCategory}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'qty',
        Header: 'Qty',
        width: 150,
        editable: true,
        Cell: ({ row }) => {
          return row.original['qty'] ? <p className="text-truncate">{row.original.qty}</p> : <NoDataCell />;
        }
      }
    ];
    coloum.push({
      accessor: 'action',
      Header: 'Actions',
      minWidth: 100,
      width: 100,
      sticky: 'right',
      disableFilters: true,
      disableSortBy: true,
      canDrag: false,
      Cell: ({ row }) => {
        return (
          <HtmlTooltip title={'Delete'}>
            <span>
              <IconButton
                size="small"
                aria-label="Details"
                disabled={row.original.hideSelection}
                onClick={() => {
                  setShowProductConfirmBox({ open: true, data: [row.original] });
                }}
              >
                <DeleteIcon fontSize="small" color={'error'} />
              </IconButton>
            </span>
          </HtmlTooltip>
        );
      }
    });
    setColumns([...coloum]);
  };

  const onSaveInlineEdit = (inputField, updatedData) => {
    handleUpdateQuantity(updatedData);
  };

  const handleUpdateQuantity = (row) => {
    if (row.type === 'product') {
      axiosInstance()
        .put(`${packages.api}/${packageId}/products`, {
          ids: [row._id],
          qty: Number(row.qty)
        })
        .then(({ data }) => {
          setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          fetchData();
        })
        .catch((err) => setToastConfig(err));
    }
  };

  const handleClick = (event) => {
    setAnchorActionEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorActionEl(null);
  };

  const removeProducts = () => {
    setRemovingProducts(true);
    const allRecords = [...showProductConfirmBox?.data];
    selectedRecords?.forEach((record) => {
      for (let i = 0; i < (record?.subRows || [])?.length; i++) {
        allRecords.push(record.subRows[i]);
      }
    });
    const productIds = allRecords?.filter((d) => d.type === 'product')?.map((d) => d._id) || [];
    const assetIds = allRecords?.filter((d) => d.type === 'asset')?.map((d) => d.id) || [];
    if (productIds?.length) {
      axiosInstance()
        .put(`${packages.api}/${packageId}/products/remove`, { ids: productIds })
        .then(({ data }) => {
          setRemovingProducts(false);
          setShowProductConfirmBox({ open: false, data: null });
          fetchData();
          setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
        })
        .catch((err) => {
          setRemovingProducts(false);
          setShowProductConfirmBox({ open: false, data: null });
          setToastConfig(err);
        });
    }
    if (assetIds?.length) {
      axiosInstance()
        .put(`${packages.api}/${packageId}/products/asset/remove`, { ids: assetIds })
        .then(({ data }) => {
          setRemovingProducts(false);
          setShowProductConfirmBox({ open: false, data: null });
          fetchData();
          setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
        })
        .catch((err) => {
          setRemovingProducts(false);
          setShowProductConfirmBox({ open: false, data: null });
          setToastConfig(err);
        });
    }
  };

  const handleAssignAssets = (data) => {
    setIsAssetAdding(true);
    axiosInstance()
      .post(`${packages.api}/${packageId}/products/assign-assets`, {
        packageId,
        assets: data?.map((e) => {
          return { product: e.product, asset: e.asset };
        })
      })
      .then(() => {
        setAssignAssetDialog({ open: false, products: [] });
        setIsAssetAdding(false);
        fetchData();
      })
      .catch((err) => {
        setIsAssetAdding(false);
        setToastConfig(err);
      });
  };

  const handleAdd = async (rows) => {
    setSubmitting(true)
    axiosInstance()
      .post(`${packages.api}/material`, {
        ids: [packageId],
        products: rows.map((d: any) => ({ product: d.id, qty: Number(d.qty) }))
      })
      .then(({ data }) => {
        fetchData();
        setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setShowProductAssignDialog(false);
        setSubmitting(false)
      })
      .catch((err) => {
        setToastConfig(err);
        setSubmitting(false)
      });
  }

  const disableAssignSerializedAssets = () => {
    if (selectedRecords.length === 0) return true;
    const flatArray = selectedRecords.filter((f) => f.type === 'product' && f.serializedProduct && f.qty > f.assetQty);
    return flatArray.length === 0;
  };

  return (
    <Box>
      <Box mb={2} mt={1} display="flex" justifyContent="space-between">
        <Box display="flex">
          {permissions?.packages?.isUpdate && (
            <Button variant="contained" color="primary" size="small" onClick={() => setShowProductAssignDialog(true)}>
              {`Add Products`}
            </Button>
          )}
        </Box>
        <Box display="flex">
          <Button
            variant={'outlined'}
            color="primary"
            aria-controls="simple-menu"
            aria-haspopup="true"
            disabled={!Boolean(selectedRecords && selectedRecords.filter((e) => !e.hideSelection).length)}
            size="small"
            onClick={handleClick}
            endIcon={<ArrowDropDownIcon />}
            className="new-dropdown-v1"
          >
            {'Actions'}
          </Button>
          <Menu
            anchorEl={anchorActionEl}
            keepMounted
            open={Boolean(anchorActionEl)}
            onClose={handleClose}
            getContentAnchorEl={null}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right'
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right'
            }}
          >
            <MenuItem
              disabled={disableAssignSerializedAssets()}
              onClick={() => {
                const products = [];
                selectedRecords
                  .filter((i) => i.type === 'product' && i.serializedProduct)
                  ?.forEach((e) => {
                    if (e?.qty - e?.assetQty > 0) {
                      products.push({ _id: e._id, product: e._id, qty: e?.qty - e?.assetQty, productName: e?.detail });
                    }
                  });
                setAssignAssetDialog({ open: true, products: products });
                handleClose();
              }}
            >
              {`Assign ${routes.serializedAsset.title}`}
            </MenuItem>
            <MenuItem
              disabled={permissions?.packages?.isUpdate && (selectedRecords.length === 0 || isRemovingProducts)}
              onClick={() => {
                setShowProductConfirmBox({ open: true, data: selectedRecords });
                handleClose();
              }}
            >
              Delete
            </MenuItem>
          </Menu>
          <Box ml={1} />
          <ImportExportMenu
            permissions={permissions?.packages}
            module="products"
            api={`${packages.api}/${packageId}/products`}
            afterImportCompleted={() => {
              fetchData();
            }}
            isExportAllOrSomeFeature={true}
            ids={[]}
            additionalParams={`refrenceId=${packageId}`}
          />
        </Box>
      </Box>
      {columns ? (
        <CustomReactTable
          height={'calc(100vh - 393px)'}
          columns={columns}
          state={state}
          dispatch={dispatch}
          refreshGrid={fetchData}
          renderedFrom={renderedFrom}
          isClientSideGrid={true}
          onSaveEdit={onSaveInlineEdit}
          expander={true}
        />
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {showProductAssignDialog && (
        <AssignProductDialog
          serialized={packageData?.packageType === 'Service' ? false : null}
          handleCloseDialog={() => setShowProductAssignDialog(false)}
          ids={[...dataRows?.map((e) => e._id)]}
          onSuccess={(rows) => {
            handleAdd(rows);
          }}
          isSubmitting={isSubmitting}
        />
      )}
      {showProductConfirmBox.open && (
        <ConfirmationDialog
          open={true}
          message={`Are you sure you want to delete ?`}
          onClose={() => {
            setShowProductConfirmBox({ open: false, data: null });
          }}
          okBtnLoading={isRemovingProducts}
          onOk={removeProducts}
        />
      )}
      {assignAssetDialog.open && (
        <AssignSerializedAssetDialog
          reference={'package'}
          ids={flattenArray(dataRows)
            ?.filter((e) => e.type === 'asset')
            ?.map((e) => e._id)}
          handleClose={() => setAssignAssetDialog({ open: false, products: [] })}
          handleSucess={handleAssignAssets}
          isAssigning={isAssetAdding}
          selectedProducts={assignAssetDialog.products}
        />
      )}
    </Box>
  );
};

export default Products;
