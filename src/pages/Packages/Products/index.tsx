import { useContext, useEffect, useReducer, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { useHistory } from 'react-router-dom';
import { Box, Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import CustomAgGrid from 'src/components/AgGridComponents/CustomAgGridEditable';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { reducer, intialState } from 'src/components/AgGridComponents/CustomAgGrid';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { prepareDataForGrid, packages } from 'src/constants/helpers';
import useColumns, { getFrameworkComponents } from 'src/constants/useColumns';
import CustomSwipableList from 'src/components/SwipableListComponents/CustomSwipableList';
import ImportExportLinks from 'src/components/Helpers/ImportExportLinks';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import { useData } from 'src/StateProvider/Provider';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import DeleteIcon from '@material-ui/icons/Delete';
import Loader from 'src/components/Loader';
import { camelCase, startCase } from 'lodash';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import { BiChevronDown } from 'react-icons/bi';
import AssignSerializedAssetDialog from 'src/components/AssignRolesDialog/AssignSerializedAssetDialog';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';

const ProductsTable = ({ packageId, packageData }) => {
  const renderedFrom = `${camelCase(routes?.packages.title)}_${packageData?.packageType || 'product'}`;

  const { setToastConfig } = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { permissions }
  }: any = useData();

  const [columns, setColumns] = useState([]);
  const [showProductConfirmBox, setShowProductConfirmBox] = useState(false);
  const [gridApi, setGridApi] = useState(null);
  const [showProductAssignDialog, setShowProductAssignDialog] = useState(false);
  const [isRemovingProducts, setRemovingProducts] = useState(false);
  const [frameWorkComponent, setFrameWorkComponent] = useState({});
  const { getColumnData } = useColumns();
  const [state, dispatch] = useReducer(reducer, intialState);
  const [arrangeView, setArrangeView] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  // const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [rowsData, setRowsData] = useState(null);
  const { isOffline } = useContext(CustomOfflineContext);
  const [anchorActionEl, setAnchorActionEl] = useState(null);
  const [assignAssetDialog, setAssignAssetDialog] = useState(false);

  useEffect(() => {
    fetchGridColumns();
    fetchData();
  }, []);

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    const allAssets: any = await axiosInstance().get(`${packages.api}/${packageId}/products/assets`);
    axiosInstance()
      .get(`${packages.api}/${packageId}/products`)
      .then(({ data: { data } }) => {
        let rows = data;
        rows.forEach((parent, i) => {
          parent.srno = i + 1;
          parent.type = 'product';
          parent.detail = parent.productName;
          parent.description = parent.productDescription;
          parent.productCategory = parent.productCategory?.optionLabel;
          parent.parentId = null;
          parent.qty = parent.qty;
          parent.subRows = generateNestedData(allAssets.data.data || [], parent);
        });
        setRowsData(rows);
      })
      .catch((err) => {
        setToastConfig(err);
      });
  };
  const generateNestedData = (material, parent) => {
    const subRows: any = material.filter((e) => e.product === parent._id);
    subRows.forEach((_subRow, j) => {
      _subRow.srno = parent.srno + '.' + (j + 1);
      _subRow.type = 'asset';
      _subRow.detail = _subRow?.assetNumber;
      _subRow.description = _subRow?.productDescription?.optionLabel;
      _subRow.productCategory = _subRow?.productCategory?.optionLabel;
      _subRow.parentId = _subRow.product;
      _subRow.qty = _subRow?.qty || 0;
    });
    if (subRows.length === 0 && parent.type === 'package') {
      parent.isValid = false;
    }
    if (parent.type === 'package') {
      parent.hideSelection = subRows.filter((e) => e.hideSelection).length ? true : false;
    }
    // setNextStep(true)
    return subRows;
  };

  // needed in future
  // const defaultColumns = [{ field: 'order', headerName: 'Order', show: true, cellRenderer: 'commonRenderer' }];

  const fetchGridColumns = () => {
    // axiosInstance()
    //   .get(`/field?resource=Product`)
    //   .then(({ data: { data } }) => {
    //     let columns = [];
    //     let rendererNames = [];
    //     data.forEach((o) => {
    //       let currentColumn = getColumnData(routes.product.title, o?.fieldData, routes.productDetail.path);
    //       if (currentColumn !== null) {
    //         columns = [...columns, currentColumn?.columnData];
    //         if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
    //           rendererNames.push(currentColumn?.rendererName);
    //         }
    //       }
    //     });
    //     let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
    //     tempFrameworkComponent = {
    //       ...tempFrameworkComponent
    //     };
    //     setFrameWorkComponent({
    //       ...tempFrameworkComponent,
    //       actionsRenderer: ActionsRenderer
    //     });
    let coloum: any = [
      {
        accessor: 'srno',
        Header: 'Index',
        width: 70,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.srno}</p>,
        Footer: () => {
          return <>Total</>;
        }
      },
      {
        accessor: 'type',
        Header: 'Type',
        sticky: isMobile ? 'none' : 'left',
        disableFilters: true,
        width: 100,
        Cell: ({ row }) => (row.original['type'] ? <p>{`${startCase(row.original?.type)} `}</p> : <NoDataCell />)
      },
      {
        accessor: 'detail',
        Header: 'Details',
        width: 200,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (
          <div className="d-flex gap-2 align-items-center">
            <p className="text-truncate" title={row.original.detail}>
              {row.original.detail}
              {
                <IconButton
                  size="small"
                  onClick={() => {
                    if (row.original.type === 'product') {
                      window.open(`${routes.productDetail.path}/${row.original._id}`);
                    } else if (row.original.type === 'asset') {
                      window.open(`${routes.serializedAssetDetail.path}/${row.original._id}`);
                    }
                  }}
                >
                  <OpenInNewIcon fontSize="small" color="primary" />
                </IconButton>
              }
            </p>
          </div>
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
        width: 200,
        editable: true,
        Cell: ({ row }) => {
          return row.original['qty'] ? <p className="text-truncate">{row.original.qty}</p> : <NoDataCell />;
        }
      }
    ];
    coloum.push({
      accessor: 'action',
      Header: '',
      minWidth: 50,
      width: 50,
      sticky: 'right',
      disableFilters: true,
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
                  setSelectedRecords([row.original]);
                  setShowProductConfirmBox(true);
                }}
              >
                <DeleteIcon fontSize="small" color={'error'} />
              </IconButton>
            </span>
          </HtmlTooltip>
        );
      }
    });
    coloum.forEach((element) => {
      if (element.accessor === 'qty') {
        element['Footer'] = (info) => {
          const qtyTotal = info.rows
            .filter((f) => f.original.parentId === null && f.values.hasOwnProperty(element.accessor) && !isNaN(f.values[element.accessor]))
            .reduce((sum, row) => row.values[element.accessor] + sum, 0);
          return <>{qtyTotal}</>;
        };
      }
    });
    setColumns([...coloum]);
  };
  const onSaveInlineEdit = (inputField, updatedData) => {
    handleUpdateQuantity(updatedData);
    // setIsInlineEdit(true);
    // const currency = rentalManagementData?.currency.toLowerCase();
    // const requiredItems = [];
    // allFields.forEach(({ fieldName, required, type }) => {
    //   fieldName = type === 'currencyAmount' ? `${fieldName}_${currency}` : fieldName;
    //   if (required) {
    //     if (isNaN(updatedData[fieldName]) && !updatedData[fieldName]) {
    //       requiredItems.push(fieldName);
    //     } else if (!isNaN(updatedData[fieldName]) && updatedData[fieldName] <= 0) {
    //       requiredItems.push(fieldName);
    //     }
    //   }
    // });

    // if (requiredItems.length > 0) {
    //   handleOpen({
    //     ...updatedData,
    //     detail: updatedData.type === 'product' ? updatedData?.productDetail?.productName : updatedData?.packageDetail?.packageName
    //   });
    // } else {
    //   onConfirmSave(inputField, updatedData);
    // }
  };

  const handleUpdateQuantity = (row) => {
    if (row.type === 'product') {
      axiosInstance()
        .put(`${packages.api}/${packageId}/products`, {
          ids: [row._id],
          qty: Number(row.qty)
        })
        .then(() => {
          fetchData();
        })
        .catch((err) => setToastConfig(err));
    } else if (row.type === 'asset') {
      console.log(row);
      axiosInstance()
        .put(`${packages.api}/${packageId}/products/asset`, {
          ids: [row.id],
          qty: Number(row.qty)
        })
        .then(() => {
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
    const allRecords = [...selectedRecords];

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
        .then(() => {
          setRemovingProducts(false);
          setShowProductConfirmBox(false);
          fetchData();
        })
        .catch((err) => {
          setRemovingProducts(false);
          setShowProductConfirmBox(false);
          setToastConfig(err);
        });
    }
    if (assetIds?.length) {
      axiosInstance()
        .put(`${packages.api}/${packageId}/products/asset/remove`, { ids: assetIds })
        .then(() => {
          setRemovingProducts(false);
          setShowProductConfirmBox(false);
          fetchData();
        })
        .catch((err) => {
          setRemovingProducts(false);
          setShowProductConfirmBox(false);
          setToastConfig(err);
        });
    }
  };

  const assignAssets = (data) => {
    const assets = data.map((d) => d._id);
    const products = selectedRecords?.filter((d) => d.type === 'product')?.map((d) => d._id);
    axiosInstance()
      .post(`${packages.api}/${packageId}/products/assign-assets`, {
        packageId,
        products,
        assets
      })
      .then(() => {
        setAssignAssetDialog(false);
        fetchData();
      })
      .catch((err) => {
        setRemovingProducts(false);
        setShowProductConfirmBox(false);
        setToastConfig(err);
      });
  };
  // const ActionsRenderer = (params) => <span>{params?.data?.qty}</span>;

  return (
    <Box mt={2} className="bg-white">
      <Box mb={1} p={1} display="flex" justifyContent="space-between">
        <Box display="flex">
          {permissions?.packages?.isUpdate && (
            <Button variant="contained" color="primary" size="small" onClick={() => setShowProductAssignDialog(true)}>
              {`Add Products`}
            </Button>
          )}
        </Box>
        <Box display="flex">
          <ImportExportLinks
            permissions={permissions?.packages}
            module="packages-products"
            api={`${packages.api}/${packageId}/products`}
            afterImportCompleted={() => {
              fetchData();
            }}
            isExportAllOrSomeFeature={true}
            // total={rowCount}
            recordsToExport={selectedRecords.length}
            ids={[]}
            additionalParams={`refrenceId=${packageId}`}
            isBackgroundWhite={true}
          />
          <Box ml={1} />

          <Button
            variant="outlined"
            color="primary"
            size="small"
            id="demo-positioned-button"
            onClick={handleClick}
            disabled={!Boolean(selectedRecords && selectedRecords.filter((e) => !e.hideSelection).length)}
            endIcon={<BiChevronDown />}
          >
            Actions
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
            <HtmlTooltip title={'Assign Asstes'}>
              <MenuItem
                disabled={selectedRecords?.some((d) => !d.serializedProduct)}
                onClick={() => {
                  setAssignAssetDialog(true);
                  handleClose();
                }}
              >
                Assign Assets
              </MenuItem>
            </HtmlTooltip>
            <HtmlTooltip title={'Delete'}>
              <MenuItem
                disabled={permissions?.packages?.isUpdate && (selectedRecords.length === 0 || isRemovingProducts)}
                onClick={() => {
                  setShowProductConfirmBox(true);
                }}
              >
                Delete
              </MenuItem>
            </HtmlTooltip>
          </Menu>
          {/* {permissions?.packages?.isUpdate && (
            <DeleteButton
              disabled={selectedRecords.length === 0 || isRemovingProducts}
              text={'Delete'}
              onClick={() => {
                setShowProductConfirmBox(true);
              }}
            />
          )} */}
        </Box>
      </Box>
      {columns && rowsData ? (
        <CustomReactTable
          height={'calc(100vh - 393px)'}
          columns={columns}
          data={rowsData}
          onSelect={setSelectedRecords}
          childrenProperty="subRows"
          uniqueKey="_id"
          hideSelection={false}
          hideAction={false}
          renderedFrom="package_product_serialized_asset"
          isClientSideGrid={true}
          onSaveEdit={onSaveInlineEdit}
        />
      ) : (
        <Loader noLoader={false} minHeight={'400px'} text="Loading..." />
      )}
      {showProductAssignDialog && (
        <AssignProductDialog
          reference="package"
          serialized={packageData?.packageType === 'Service' ? false : null}
          productsDialogOpen={true}
          productId={packageId}
          handleCloseDialog={() => setShowProductAssignDialog(false)}
          assignedProducts={[...rowsData?.map((e) => e._id)]}
          renderedFrom={`${renderedFrom}_sub-1`}
          onSuccess={() => {
            fetchData();
            setShowProductAssignDialog(false);
          }}
        />
      )}
      {showProductConfirmBox && (
        <ConfirmationDialog
          open={showProductConfirmBox}
          message={`Are you sure you want to delete ?`}
          onClose={() => {
            setShowProductConfirmBox(false);
          }}
          okBtnLoading={isRemovingProducts}
          onOk={removeProducts}
        />
      )}
      {assignAssetDialog && (
        <AssignSerializedAssetDialog
          reference={'package'}
          referenceData={packageData}
          referenceId={packageId}
          ids={[]}
          handleClose={() => setAssignAssetDialog(false)}
          handleSucess={assignAssets}
        />
      )}
    </Box>
  );
};

export default ProductsTable;
