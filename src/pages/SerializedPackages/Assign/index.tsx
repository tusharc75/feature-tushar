import { Box, IconButton, MenuItem } from '@mui/material';
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
import { MATERIAL_TYPE, OTHER_MATERIAL_TYPE, rentalManagement, SERIALIZED_PACKAGE_STATUS, sidebarResource } from 'src/constants/helpers';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { Delete } from '@mui/icons-material';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import AssignSerialNumbersDialog from 'src/components/AssignRolesDialog/AssignSerialNumbersDialog';
import ReplaceAssetReason from 'src/components/RentalManagment/ReplaceAssetReason';
import SelectionConfirmationDialog from 'src/components/Helpers/SelectionConfirmationDialog';

const Assign = ({ serializedPackagesData, fetchSerializedPackagesData, fromInspection }) => {

  const renderedFrom = `${fromInspection ? camelCase(sidebarResource?.serializedPackagesInspection) :
    camelCase(sidebarResource?.serializedPackages)}_Assign`;
  const { setToastConfig } = useContext(CustomToastContext);

  const {
    state: { permissions, resources }
  }: any = useData();

  const [columns, setColumns] = useState(null);

  const [assignDialog, setAssignDialog] = useState({ open: false, type: '', replaceAsset: false, products: [] });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [serialNumbers, setSerialNumbers] = useState([]);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, selectedRecords } = state;
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [showReplaceAssetWarnings, setShowReplaceAssetWarnings] = useState({
    replaceAssetReasonDialog: false,
    replaceAssetReason: '',
    data: null,
    confirmationAddNewLineItemsDialog: false
  })

  useEffect(() => {
    if (serializedPackagesData?.status === SERIALIZED_PACKAGE_STATUS.disassembled) {
      setAllowedToEdit(false)
    }
    else if (fromInspection && permissions?.serializedPackagesInspection?.isUpdate) {
      setAllowedToEdit(serializedPackagesData?.status === SERIALIZED_PACKAGE_STATUS.reserved ? false : true)
    }
    else if (permissions?.serializedPackages?.isUpdate) {
      setAllowedToEdit(true)
    }
  }, [serializedPackagesData, fromInspection]);

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
              {[MATERIAL_TYPE.product, MATERIAL_TYPE.package, MATERIAL_TYPE.serializedAsset]?.includes(row?.original?.type) && (
                <IconButton
                  size="small"
                  onClick={() => {
                    if (row?.original?.type === MATERIAL_TYPE.product) {
                      window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                    } else if (row?.original?.type === MATERIAL_TYPE.package) {
                      window.open(`${routes.packagesDetail.path}/${row.original.materialId}`);
                    } else {
                      window.open(`${routes.serializedAssetDetail.path}/${row.original.asset}`);
                    }
                  }}
                >
                  <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                </IconButton>
              )}
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
        accessor: 'status',
        Header: 'Status',
        width: 150,
        Cell: ({ row }) => {
          return row?.original?.status ? <p className="text-truncate">{row.original.status}</p> : <NoDataCell />;
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
      },
      {
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
            {permissions?.serializedPackages?.isUpdate && !fromInspection
              && [MATERIAL_TYPE.serializedAsset, OTHER_MATERIAL_TYPE.serialNumber]?.includes(row?.original?.type) && (
                <HtmlTooltip title="Unassign">
                  <IconButton
                    size="small"
                    aria-label="Unassign"
                    onClick={() => {
                      setDeleteRecord(row.original);
                      setShowDeleteConfirmBox(true);
                    }}
                    disabled={!row?.original?.canDelete}
                  >
                    <Delete color={row?.original?.canDelete ? 'error' : 'disabled'} fontSize="small" />
                  </IconButton>
                </HtmlTooltip>
              )}
          </>
        )
      }
    ];
    setColumns(coloum);
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    const allAssetsResponse: any = await axiosInstance().get(`${routes.serializedPackages.path}/${serializedPackagesData?._id}/assets`);
    const assets = allAssetsResponse?.data?.data?.assets || [];
    const serialNumbers = allAssetsResponse?.data?.data?.serialNumbers || [];
    setSerialNumbers(JSON.parse(JSON.stringify(serialNumbers)))

    axiosInstance().get(`${routes.serializedPackages.path}/${serializedPackagesData?._id}/material`).then(({ data: { data } }) => {
      const rows = data?.filter((e) => !e.parentId);
      rows?.forEach((parent, i) => {
        parent.index = i + 1;
        parent.detail = parent?.type === MATERIAL_TYPE.product
          ? parent?.productDetail?.productName : parent?.type === MATERIAL_TYPE.package ? parent?.packageDetail?.packageName
            : '';
        parent.description = parent?.type === MATERIAL_TYPE.product
          ? parent?.productDetail?.productDescription
          : parent?.type === MATERIAL_TYPE.package
            ? parent?.packageDetail?.packageDescription
            : '';
        parent.productNumber = parent?.type === MATERIAL_TYPE.product ? parent?.productDetail?.productNumber : '';
        parent.serializedProduct = parent?.type === MATERIAL_TYPE.product ? parent?.productDetail?.serializedProduct : false;
        parent.assetQty = parent?.type === MATERIAL_TYPE.product ? (assets.filter((e) => e?._id === parent?._id && e.product === parent?.materialId)?.length + serialNumbers?.filter((e) => e?._id === parent?._id && e.product === parent?.materialId)?.length) : 0;
        parent.subRows = generateNestedData(data, assets, serialNumbers, parent);
      });
      dispatch({ type: 'initialize', data: rows, count: rows?.length });
      dispatch({ type: 'loading', loading: false });
    })
      .catch((err) => {
        setToastConfig(err);
      });
  };

  const generateNestedData = (material, assets, serialNumbers, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, j) => {
      _subRow.index = parent.index + '.' + (j + 1);
      _subRow.detail =
        _subRow.type === MATERIAL_TYPE.package
          ? _subRow?.packageDetail?.packageName
          : _subRow.type === MATERIAL_TYPE.product
            ? _subRow?.productDetail?.productName
            : '';
      _subRow.description =
        _subRow.type === MATERIAL_TYPE.package
          ? _subRow?.packageDetail?.packageDescription
          : _subRow.type === MATERIAL_TYPE.product
            ? _subRow?.productDetail?.productDescription
            : '';
      _subRow.productNumber = _subRow.type === MATERIAL_TYPE.product ? _subRow?.productDetail?.productNumber : '';
      _subRow.serializedProduct = _subRow.type === MATERIAL_TYPE.product ? _subRow?.productDetail?.serializedProduct : false;
      _subRow.assetQty =
        _subRow.type === MATERIAL_TYPE.product ? (assets.filter((e) => e.product === _subRow.materialId && e?._id === _subRow?._id)?.length + serialNumbers?.filter((e) => e?._id === parent?._id && e.product === parent?.materialId)?.length) : 0;
      _subRow.subRows = generateNestedData(material, assets, serialNumbers, _subRow);
    });

    if (assets?.length > 0) {
      const assetsSubRows = assets.filter((e) => e.product === parent.materialId && e?._id === parent?._id);
      const subRowsLength = subRows?.length || 0;
      assetsSubRows.forEach((_subRow, j) => {
        _subRow.index = parent.index + '.' + (j + 1 + subRowsLength);
        _subRow.type = MATERIAL_TYPE.serializedAsset;
        _subRow.detail = _subRow?.assetDetail?.assetNumber;
        _subRow.status = _subRow?.assetDetail?.status;
        _subRow.parentId = _subRow?.product;
        _subRow.canDelete = serializedPackagesData?.status === SERIALIZED_PACKAGE_STATUS.available;
        subRows.push(_subRow);
      });
    }
    if (serialNumbers?.length > 0) {
      const serialNumbersSubRows = serialNumbers.filter((e) => e.product === parent.materialId && e?._id === parent?._id);
      const subRowsLength = subRows?.length || 0;
      serialNumbersSubRows?.forEach((_subRow, j) => {
        _subRow.index = parent.index + '.' + (j + 1 + subRowsLength);
        _subRow.type = OTHER_MATERIAL_TYPE.serialNumber;
        _subRow.detail = _subRow?.serialNumberDetail?.serialNumber;
        _subRow.parentId = _subRow?.product;
        _subRow.canDelete = serializedPackagesData?.status === SERIALIZED_PACKAGE_STATUS.available;
        subRows.push(_subRow);
      });
    }
    return subRows;
  };

  const handleDelete = () => {
    setIsDeleting(true);
    let ids = [];
    if (deleteRecord) {
      ids.push({ _id: deleteRecord._id, asset: deleteRecord?.type === OTHER_MATERIAL_TYPE.serialNumber ? deleteRecord?.serialNumber : deleteRecord.asset, type: deleteRecord?.type });
    } else {
      ids = selectedRecords?.filter((r) => r?.canDelete && [MATERIAL_TYPE.serializedAsset, OTHER_MATERIAL_TYPE.serialNumber]?.includes(r?.type))?.map((d) => ({ _id: d?._id, asset: d?.type === OTHER_MATERIAL_TYPE.serialNumber ? d?.serialNumber : d?.asset, type: d?.type }));
    }
    axiosInstance()
      .put(`${routes.serializedPackages.path}/${serializedPackagesData?._id}/assets`, { ids: ids })
      .then(() => {
        dispatch({ type: 'selection', selectedRecords: [] });
        fetchSerializedPackagesData()
        fetchData();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
        setIsDeleting(false);
      })
      .catch((error) => {
        setToastConfig(error);
        setIsDeleting(false);
      });
  };

  const handleAssignAssets = (data) => {
    setIsSubmitting(true);
    axiosInstance()
      .post(`${routes.serializedPackages.path}/${serializedPackagesData?._id}/assets`, { assets: data })
      .then(() => {
        fetchSerializedPackagesData()
        setAssignDialog({ open: false, type: '', replaceAsset: false, products: [] });
        setIsSubmitting(false);
        fetchData();
      })
      .catch((err) => {
        setIsSubmitting(false);
        setToastConfig(err);
      });
  };

  const handleAssignSerialNumbers = (data) => {
    setIsSubmitting(true);
    axiosInstance()
      .post(`${routes.serializedPackages.path}/${serializedPackagesData?._id}/add-serial-numbers`, { serialNumbers: data })
      .then(() => {
        fetchSerializedPackagesData()
        setAssignDialog({ open: false, type: '', replaceAsset: false, products: [] });
        setIsSubmitting(false);
        fetchData();
      })
      .catch((err) => {
        setIsSubmitting(false);
        setToastConfig(err);
      });
  };

  const handleReplaceAssets = (data, replaceReason = '', replaceWithNewLineItems = false) => {
    const assets = selectedRecords?.filter(r => r?.type === MATERIAL_TYPE.serializedAsset)
    data?.forEach(d => {
      const asset = assets?.find(a => a?._id === d?._id && a?.product === d?.product && !a?.isCounted)
      if (asset) {
        d.oldAsset = asset?.asset;
        asset.isCounted = true
      }
    });
    setIsSubmitting(true);
    axiosInstance().put(`${routes.serializedPackages.path}/${serializedPackagesData?._id}/assets/replace`,
      { assets: data, reason: replaceReason, replaceWithNewLineItems })
      .then(() => {
        fetchSerializedPackagesData()
        setAssignDialog({ open: false, type: '', replaceAsset: false, products: [] });
        setIsSubmitting(false);
        fetchData();
        setToastConfig({
          open: true,
          type: 'success',
          message: `Assets Replaced Successfully`
        });
      }).catch((err) => {
        setIsSubmitting(false);
        setToastConfig(err);
      });
  }

  const handleReplaceAssetsInUse = (data, replaceReason = '', replaceWithNewLineItems = false) => {
    const selectedAssets = selectedRecords?.filter(r => r?.type === MATERIAL_TYPE.serializedAsset)
    const assets: any = []
    data?.forEach(d => {
      const asset = selectedAssets?.find(a => a?._id === d?._id && a?.product === d?.product && !a?.isCounted)
      if (asset) {
        assets.push({
          oldAsset: asset?.asset,
          asset: d?.asset
        })
        asset.isCounted = true
      }
    });

    setIsSubmitting(true);
    axiosInstance()
      .post(`${rentalManagement.api}/replace-inuse-assets`, {
        assets,
        rentalJob: serializedPackagesData?.rentalJob,
        reason: replaceReason,
        replaceWithNewLineItems: replaceWithNewLineItems
      })
      .then(() => {
        fetchSerializedPackagesData()
        setShowReplaceAssetWarnings({ replaceAssetReasonDialog: false, replaceAssetReason: '', data: null, confirmationAddNewLineItemsDialog: false })
        setAssignDialog({ open: false, type: '', replaceAsset: false, products: [] });
        setIsSubmitting(false);
        fetchData();
        setToastConfig({
          open: true,
          type: 'success',
          message: `Assets Replaced Successfully`
        });
      })
      .catch((err) => {
        setIsSubmitting(false);
        setToastConfig(err);
      });
  };

  const getProducts = (type = MATERIAL_TYPE.serializedAsset, action = '') => {
    const productsMap = new Map();

    if (action === 'replaceAsset') {
      selectedRecords?.forEach(ele => {
        if (ele?.type === MATERIAL_TYPE.serializedAsset) {
          const product = dataRows?.find(d => d?.type === MATERIAL_TYPE.product && d?.serializedProduct && d?.materialId === ele?.product && d?._id === ele?._id)
          if (product) {
            if (productsMap.has(ele.product)) {
              const existingProduct = productsMap.get(ele.product);
              existingProduct.qty += 1;
              existingProduct._id = [...existingProduct._id, product._id];
            } else {
              productsMap.set(ele.product, { product: product?.materialId, qty: 1, productName: product?.detail, _id: [product?._id] })
            }
          }
        }
      });
    } else {
      selectedRecords?.filter((r) => r?.type === MATERIAL_TYPE.product && r?.serializedProduct)?.forEach((e) => {
        let diff = e?.qty - e?.assetQty;
        if (diff > 0) {
          if (productsMap.has(e.materialId)) {
            const existingProduct = productsMap.get(e._id);
            existingProduct.qty += diff;
            existingProduct._id = [...existingProduct._id, e._id];
          } else {
            const productDetail = {
              ...(type === OTHER_MATERIAL_TYPE.serialNumber ? { id: e?.materialId } : { product: e?.materialId }),
              qty: diff,
              productName: e?.detail,
              _id: [e?._id]
            };
            productsMap.set(e.materialId, productDetail);
          }
        }
      });
    }

    return Array.from(productsMap.values())
  }

  const isVisible = () => {
    const flatArray = selectedRecords.filter((f) => f.type === MATERIAL_TYPE.product && f.qty > f.assetQty && f?.serializedProduct);
    return flatArray.length > 0;
  }

  const actionButtonMenuItems = () => {
    return (
      fromInspection ? <>
        <MenuItem
          onClick={() => {
            setAssignDialog({
              open: true,
              type: MATERIAL_TYPE.serializedAsset,
              replaceAsset: true,
              products: getProducts(MATERIAL_TYPE.serializedAsset, 'replaceAsset')
            });
          }}
        >
          {`Replace ${resources?.serializedAsset?.titlePlural}`}
        </MenuItem>
      </>
        : <>
          {isVisible() && (
            <MenuItem
              onClick={() => {
                setAssignDialog({ open: true, type: MATERIAL_TYPE.serializedAsset, replaceAsset: false, products: getProducts() });
              }}
            >
              {`Assign ${resources?.serializedAsset?.titlePlural}`}
            </MenuItem>
          )}
          {isVisible() && (
            <MenuItem
              onClick={() => {
                setAssignDialog({ open: true, type: OTHER_MATERIAL_TYPE.serialNumber, replaceAsset: false, products: getProducts(OTHER_MATERIAL_TYPE.serialNumber) });
              }}
            >
              Assign Serial Numbers
            </MenuItem>
          )}
          {permissions?.serializedPackages?.isUpdate && (
            <MenuItem
              disabled={selectedRecords?.some((e) => e?.canDelete && [MATERIAL_TYPE.serializedAsset, OTHER_MATERIAL_TYPE.serialNumber]?.includes(e.type)) ? false : true}
              onClick={() => {
                setShowDeleteConfirmBox(true);
              }}
            >
              Unassign
            </MenuItem>
          )}
        </>
    );
  };

  return (
    <>
      <DetailsPageHeader
        isAddButtonVisible={false}
        isActionButtonVisible={allowedToEdit}
        actionButtonMenuItems={actionButtonMenuItems()}
        actionButtonProps={{
          disabled: selectedRecords?.length === 0 ? true :
            fromInspection ? selectedRecords.filter((f) => f.type === MATERIAL_TYPE.serializedAsset)?.length > 0 ? false : true :
              !allowedToEdit
        }}
        hasXpadding
      />
      {columns ? (
        <CustomReactTable
          height={'calc(100vh - 200px)'}
          columns={columns}
          state={state}
          dispatch={dispatch}
          refreshGrid={fetchData}
          renderedFrom={renderedFrom}
          isClientSideGrid={true}
          expander={true}
          hideAction={!allowedToEdit}
          hideSelection={!allowedToEdit}
        />
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {assignDialog.open && assignDialog.type === MATERIAL_TYPE.serializedAsset && (
        <AssignSerializedAssetDialog
          reference={'serializedPackages'}
          ids={[]}
          handleClose={() => setAssignDialog({ open: false, type: '', replaceAsset: false, products: [] })}
          handleSucess={(rows) => {
            if (assignDialog.replaceAsset) {
              if (serializedPackagesData.status === SERIALIZED_PACKAGE_STATUS.inUse && serializedPackagesData?.rentalJob) {
                setShowReplaceAssetWarnings(prev => ({ ...prev, replaceAssetReasonDialog: true, data: rows }))
              } else {
                handleReplaceAssets(rows)
              }
            } else {
              handleAssignAssets(rows)
            }
          }}
          isAssigning={isSubmitting}
          selectedProducts={assignDialog.products}
          referenceData={{
            _id: serializedPackagesData?._id,
            warehouse: serializedPackagesData?.warehouse?.optionValue
          }}
          checkCertificateExpiry={true}
          showWarehouseFilter={true}
        />
      )}
      {assignDialog.open && assignDialog.type === OTHER_MATERIAL_TYPE.serialNumber && (
        <AssignSerialNumbersDialog
          selectedProducts={assignDialog.products}
          handleClose={() => setAssignDialog({ open: false, type: '', replaceAsset: false, products: [] })}
          handleSucess={handleAssignSerialNumbers}
          referenceType={'serializedPackages'}
          isAssigning={isSubmitting}
          filterByPlant={serializedPackagesData?.warehouse}
          ids={serialNumbers?.map((s) => s?.serialNumber)}
          showWarehouseFilter={true}
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
          okBtnLoading={isDeleting}
          onOk={handleDelete}
        />
      )}
      {showReplaceAssetWarnings.replaceAssetReasonDialog && (
        <ReplaceAssetReason
          handleClose={() => setShowReplaceAssetWarnings(prev => ({ ...prev, replaceAssetReasonDialog: false, data: null }))}
          loading={isSubmitting}
          handleSucess={(data) => {
            setShowReplaceAssetWarnings(prev => ({ ...prev, replaceAssetReasonDialog: false, replaceAssetReason: data?.reason, confirmationAddNewLineItemsDialog: true }))
          }}
        />
      )}
      {showReplaceAssetWarnings.confirmationAddNewLineItemsDialog && (
        <SelectionConfirmationDialog
          open={showReplaceAssetWarnings.confirmationAddNewLineItemsDialog}
          message={`Would you like to add the replacement assets as a new line item in ${resources?.rentalManagement?.titleSingular}? Click Yes to add it as a new line item, or No to keep it under the same line item.`}
          onOk={(type) => {
            handleReplaceAssetsInUse(showReplaceAssetWarnings.data, showReplaceAssetWarnings.replaceAssetReason, type === 'Yes' ? true : false)
          }}
          onClose={() => {
            setShowReplaceAssetWarnings(prev => ({ ...prev, confirmationAddNewLineItemsDialog: false, replaceAssetReason: '', data: null }))
          }}
          selection1={'Yes'}
          selection2={'No'}
          okBtnLoading={isSubmitting}
        />
      )}
    </>
  );
};

export default Assign;
