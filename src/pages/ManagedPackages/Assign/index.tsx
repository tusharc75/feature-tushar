import { Box, IconButton, MenuItem } from '@material-ui/core';
import { camelCase, startCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { FiExternalLink } from 'react-icons/fi';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import AssignSerializedAssetDialog from 'src/components/AssignRolesDialog/AssignSerializedAssetDialog';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { MATERIAL_TYPE } from 'src/constants/helpers';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { Delete } from '@material-ui/icons';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';

const Assign = ({ managedPackagesData }) => {
  const renderedFrom = `${camelCase(routes?.managedPackages.title)}_${managedPackagesData?.package?.optionLabel}`;
  const { setToastConfig } = useContext(CustomToastContext);

  const {
    state: { permissions }
  }: any = useData();

  const [columns, setColumns] = useState(null);

  const [assignAssetDialog, setAssignAssetDialog] = useState({ open: false, products: [] });
  const [isAssetAdding, setIsAssetAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const { state, dispatch } = useTableReducer();
  const { selectedRecords } = state;

  useEffect(() => {
    fetchColumns();
    fetchData();
  }, []);

  const fetchColumns = async () => {
    const {
      data: { data }
    } = await axiosInstance().put(`/field/find-field-labels`, {
      fields: [
        {
          resource: 'Product',
          fieldNames: ['productName', 'productNumber', 'productDescription', 'serializedProduct', 'position']
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
        width: 200,
        Cell: ({ row }) =>
          row.original['type'] ? (
            <p>
              {`${startCase(row.original?.type)} `}
              {row.original['type'] === MATERIAL_TYPE.product && (row.original?.serializedProduct ? '(Serialized)' : '(Non-Serialized)')}
            </p>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'detail',
        Header: 'Details',
        width: 200,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) =>
          row?.original?.type ? (
            <div className="flex items-center gap-2">
              <p className="text-truncate">{row.original.detail}</p>
              <IconButton
                size="small"
                onClick={() => {
                  if (row?.original?.type === MATERIAL_TYPE.product) {
                    window.open(`${routes.productDetail.path}/${row.original.productId}`);
                  } else if (row?.original?.type === MATERIAL_TYPE.package) {
                    window.open(`${routes.packagesDetail.path}/${row.original._id}`);
                  } else {
                    window.open(`${routes.serializedAssetDetail.path}/${row.original.asset}`);
                  }
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
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
          return row.original['description'] ? (
            <div>
              <p className="text-truncate">{row.original.description}</p>
            </div>
          ) : (
            <NoDataCell />
          );
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
      ...(productFields?.find((e) => e.fieldName === 'position')
        ? [
            {
              accessor: 'position',
              Header: productFields?.find((e) => e.fieldName === 'position')?.fieldLabel,
              width: 200,
              Cell: ({ row }) => {
                return row.original['position'] ? (
                  <div>
                    <p className="text-truncate">{row.original.position}</p>
                  </div>
                ) : (
                  <NoDataCell />
                );
              }
            }
          ]
        : []),
      {
        accessor: 'qty',
        Header: 'Qty',
        width: 150,
        Cell: ({ row }) => {
          return row.original['qty'] ? <p className="text-truncate">{row.original.qty}</p> : <NoDataCell />;
        }
      }
    ];
    setColumns([...coloum, ActionsRenderer]);
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
        {permissions?.managedPackages?.isUpdate && row?.original?.type === MATERIAL_TYPE.serializedAsset && (
          <HtmlTooltip title="Delete">
            <IconButton
              size="small"
              aria-label="Delete"
              onClick={() => {
                setDeleteRecord(row.original);
                setShowDeleteConfirmBox(true);
              }}
            >
              <Delete color="error" />
            </IconButton>
          </HtmlTooltip>
        )}
      </>
    )
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    const allAssetsResponse: any = await axiosInstance().get(`/managed-packages/${managedPackagesData?._id}/assets`);
    const assets = allAssetsResponse?.data?.data || [];

    axiosInstance()
      .get(`/managed-packages/${managedPackagesData?.package?.optionValue}/serialized-products`)
      .then(({ data: { data } }) => {
        const rows = [];
        const packages = new Set();
        let index = 1;
        data?.forEach((parent) => {
          let row: any = {};
          if (parent?.package?.optionValue) {
            if (!packages.has(parent?.package?.optionValue)) {
              row.index = index;
              row._id = parent?.package?.optionValue;
              row.type = MATERIAL_TYPE.package;
              row.detail = parent.package.optionLabel;
              row.qty = parent?.package?.qty;
              row.subRows = generateNestedData(data, assets, row);
              packages.add(row._id);
              row.parentId = null;
              rows.push(row);
              index++;
            }
          } else {
            row = { ...parent };
            row.index = index;
            row.productId = parent?._id;
            row.type = MATERIAL_TYPE.product;
            row.detail = parent?.productName;
            row.description = parent?.productDescription;
            row.productNumber = parent?.productNumber;
            row.productCategory = parent?.productCategory?.optionLabel;
            row.qty = parent?.qty;
            row.assetQty =
              assets?.filter((i: any) => {
                if (i?.package) {
                  return i.product.optionValue === row.productId && i.package === row?.package?.optionValue;
                } else {
                  return i.product.optionValue === row.productId && !row?.package;
                }
              })?.length || 0;
            row.subRows = generateNestedData([], assets, row);
            row.parentId = null;
            rows.push(row);
            index++;
          }
        });
        dispatch({ type: 'initialize', data: rows, count: rows?.length });
        dispatch({ type: 'loading', loading: false });
      })
      .catch((err) => {
        setToastConfig(err);
      });
  };

  const generateNestedData = (material, assets, parent) => {
    let subRows: any;
    if (parent.type === MATERIAL_TYPE.package) {
      subRows = material?.filter((e) => e?.package?.optionValue === parent?._id);
      subRows.forEach((_subRow, j) => {
        _subRow.index = parent.index + '.' + (j + 1);
        _subRow.productId = _subRow._id;
        _subRow._id = parent._id + _subRow._id;
        _subRow.type = MATERIAL_TYPE.product;
        _subRow.detail = _subRow?.productName;
        _subRow.description = _subRow?.productDescription;
        _subRow.productNumber = _subRow?.productNumber;
        _subRow.productCategory = _subRow?.productCategory?.optionLabel;
        _subRow.qty = parent.qty * _subRow.qty;
        _subRow.parentId = parent?._id;
        _subRow.assetQty =
          assets?.filter((i: any) => {
            if (i?.package) {
              return i.product.optionValue === _subRow.productId && i.package === _subRow?.package?.optionValue;
            } else {
              return i.product.optionValue === _subRow.productId && !_subRow?.package;
            }
          })?.length || 0;
        _subRow.subRows = generateNestedData([], assets, _subRow);
      });
    } else {
      subRows = assets.filter((e) => {
        if (e?.package) {
          return e.product.optionValue === parent.productId && e?.package?.optionValue === parent?.package?.optionValue;
        } else {
          return e.product.optionValue === parent.productId && !parent?.package;
        }
      });
      subRows.forEach((_subRow, j) => {
        _subRow.index = parent.index + '.' + (j + 1);
        _subRow.type = MATERIAL_TYPE.serializedAsset;
        _subRow.detail = _subRow?.assetNumber;
        _subRow.description = _subRow?.description;
        _subRow.productCategory = _subRow?.productCategory?.optionLabel;
        _subRow.position = _subRow?.position;
        _subRow.parentId = _subRow?.product?.optionValue;
        _subRow.qty = parent.qty;
      });
    }
    return subRows;
  };

  const handleDelete = () => {
    setIsSubmitting(true);
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords?.filter((r) => r?.type === MATERIAL_TYPE.serializedAsset)?.map((d) => d._id);
    }
    axiosInstance()
      .put(`/managed-packages/${managedPackagesData?._id}/assets`, { ids: ids })
      .then(() => {
        dispatch({ type: 'selection', selectedRecords: [] });
        fetchData();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
        setIsSubmitting(false);
      })
      .catch((error) => {
        setToastConfig(error);
        setIsSubmitting(false);
      });
  };

  const handleAssignAssets = (data) => {
    setIsAssetAdding(true);
    axiosInstance()
      .post(`managed-packages/${managedPackagesData?._id}/assets`, { assets: data })
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

  const disableAssignSerializedAssets = () => {
    if (selectedRecords.length === 0) return true;
    const flatArray = selectedRecords.filter((f) => f.type === MATERIAL_TYPE.product && f.qty > f.assetQty);
    return flatArray.length === 0;
  };

  const actionButtonMenuItems = () => {
    return (
      <>
        {permissions?.managedPackages?.isUpdate && (
          <MenuItem
            disabled={disableAssignSerializedAssets()}
            onClick={() => {
              const productsMap = new Map();
              selectedRecords
                .filter((i) => i.type === MATERIAL_TYPE.product)
                ?.forEach((e) => {
                  let diff = e?.qty - e?.assetQty;
                  if (diff > 0) {
                    if (productsMap.has(e.productId)) {
                      const existingProduct = productsMap.get(e.productId);
                      existingProduct.qty += diff;
                      if (e?.package?.optionValue) {
                        existingProduct.packages = [...existingProduct.packages, e.package.optionValue];
                      }
                    } else {
                      const productDetail = {
                        product: e.productId,
                        qty: diff,
                        productName: e?.detail,
                        packages: e?.package?.optionValue ? [e?.package?.optionValue] : []
                      };
                      productsMap.set(e.productId, productDetail);
                    }
                  }
                });
              const products = Array.from(productsMap.values());
              setAssignAssetDialog({ open: true, products: products });
            }}
          >
            {`Assign ${routes.serializedAsset.title}`}
          </MenuItem>
        )}
        {permissions?.managedPackages?.isUpdate && (
          <MenuItem
            disabled={!selectedRecords?.some((e) => e.type === MATERIAL_TYPE.serializedAsset)}
            onClick={() => {
              setShowDeleteConfirmBox(true);
            }}
          >
            Delete
          </MenuItem>
        )}
      </>
    );
  };

  return (
    <>
      <DetailsPageHeader
        isAddButtonVisible={false}
        isActionButtonVisible={true}
        actionButtonMenuItems={actionButtonMenuItems()}
        actionButtonProps={{ disabled: !selectedRecords.length }}
        hasXpadding
      />
      {columns ? (
        <CustomReactTable
          height={'calc(100vh - 393px)'}
          columns={columns}
          state={state}
          dispatch={dispatch}
          refreshGrid={fetchData}
          renderedFrom={renderedFrom}
          isClientSideGrid={true}
          expander={true}
        />
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {assignAssetDialog.open && (
        <AssignSerializedAssetDialog
          reference={'managedPackages'}
          ids={[]}
          handleClose={() => setAssignAssetDialog({ open: false, products: [] })}
          handleSucess={handleAssignAssets}
          isAssigning={isAssetAdding}
          selectedProducts={assignAssetDialog.products}
          referenceData={{ warehouse: managedPackagesData?.warehouse?.optionValue }}
        />
      )}
      {showDeleteConfirmBox && (
        <ConfirmationDialog
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete asset(s) ${deleteRecord?.detail || ''} ?`}
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          okBtnLoading={isSubmitting}
          onOk={handleDelete}
        />
      )}
    </>
  );
};

export default Assign;
