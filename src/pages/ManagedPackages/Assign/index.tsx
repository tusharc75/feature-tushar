import { Box, IconButton, MenuItem } from '@material-ui/core';
import { camelCase, isEmpty, startCase } from 'lodash';
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
import { flattenArray } from 'src/constants/columns';
import { MATERIAL_TYPE } from 'src/constants/helpers';
import { Link } from 'react-router-dom';

const Assign = ({ managedPackagesData }) => {

  const renderedFrom = `${camelCase(routes?.managedPackages.title)}_${managedPackagesData?.package?.optionLabel}`;
  const { setToastConfig } = useContext(CustomToastContext);

  const {
    state: { permissions }
  }: any = useData();

  const [columns, setColumns] = useState(null);

  const [assignAssetDialog, setAssignAssetDialog] = useState({ open: false, products: [] });
  const [isAssetAdding, setIsAssetAdding] = useState(false);
  const { state, dispatch } = useTableReducer();
  const { dataRows, selectedRecords } = state;

  useEffect(() => {
    fetchColumns();
    fetchData();
  }, []);

  console.log(assignAssetDialog.products);

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    const allAssetsResponse: any = await axiosInstance().get(`/managed-packages/${managedPackagesData?._id}/assets`);
    const assets = allAssetsResponse?.data?.data || [];

    axiosInstance()
      .get(`/managed-packages/${managedPackagesData?.package?.optionValue}/serialized-products`)
      .then(({ data: { data } }) => {
        let rows = data;
        rows.forEach((parent, i) => {
          parent.index = i + 1;
          parent.type = MATERIAL_TYPE.product;
          parent.detail = parent?.productName;
          parent.description = parent?.productDescription;
          parent.productNumber = parent?.productNumber;
          parent.productCategory = parent?.productCategory?.optionLabel;
          parent.parentId = null;
          parent.qty = parent.qty;
          parent.assetQty = assets?.filter((i: any) => {
            if (i?.package) {
              return i.product.optionValue === parent._id && i.package === parent?.package?.optionValue;
            } else {
              return i.product.optionValue === parent._id; 
            }
          }).length || 0;
          parent.subRows = generateNestedData(assets, parent);
        });
        dispatch({ type: 'initialize', data: rows, count: rows?.length });
        dispatch({ type: 'loading', loading: false });
      })
      .catch((err) => {
        setToastConfig(err);
      });
  };

  console.log(selectedRecords);

  const generateNestedData = (material, parent) => {
    const subRows: any = material.filter((e) => {
      if(e?.package) {
        return e.product.optionValue === parent._id && e?.package === parent?.package?.optionValue
      } else {
        return e.product.optionValue === parent._id;
      }
    });
    subRows.forEach((_subRow, j) => {
      _subRow.index = parent.index + '.' + (j + 1);
      _subRow.type = 'asset';
      _subRow.detail = _subRow?.assetNumber;
      _subRow.description = _subRow?.description;
      _subRow.productCategory = _subRow?.productCategory?.optionLabel;
      _subRow.position = _subRow?.position;
      _subRow.parentId = _subRow?.product?.optionValue;
      _subRow.qty = parent.qty;
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
            <div className="flex items-center gap-2">
              <p className="text-truncate">{row.original.detail}</p>
              <IconButton
                size="small"
                onClick={() => {
                  if (row?.original?.type === MATERIAL_TYPE.product) {
                    window.open(`${routes.productDetail.path}/${row.original._id}`);
                  } else {
                    window.open(`${routes.serializedAssetDetail.path}/${row.original._id}`);
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
          return row.original['description'] ? <div>
            <p className="text-truncate">{row.original.description}</p>
          </div> : <NoDataCell />;
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
      ...(productFields?.find((e) => e.fieldName === 'position') ? [{
        accessor: 'position',
        Header: productFields?.find((e) => e.fieldName === 'position')?.fieldLabel,
        width: 200,
        Cell: ({ row }) => {
          return row.original['position'] ? <div>
            <p className="text-truncate">{row.original.position}</p>
          </div> : <NoDataCell />;
        }
      }] : []),
      {
        accessor: 'qty',
        Header: 'Qty',
        width: 150,
        Cell: ({ row }) => {
          return row.original['qty'] ? <p className="text-truncate">{row.original.qty}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'package',
        Header: 'Parent Package',
        width: 200,
        Cell: ({ row }) => {
          return (
            <>
              {row.original.type === MATERIAL_TYPE.product ? row.original['package'] ?
                <Link className="link text-truncate" title={row?.original?.package?.optionLabel} to={`${routes.packagesDetail.path}/${row?.original?.package?.optionValue}`}>
                  {row?.original?.package?.optionLabel}
                </Link>
                :
                <Link className="link text-truncate" title={managedPackagesData?.package?.optionLabel} to={`${routes.packagesDetail.path}/${managedPackagesData?.package?.optionValue}`}>
                  {managedPackagesData?.package?.optionLabel}
                </Link> :
                <NoDataCell />
              }
            </>
          );
        }
      }
    ];
    setColumns([...coloum]);
  };

  const handleAssignAssets = (data) => {
    setIsAssetAdding(true);
    axiosInstance()
      .post(`managed-packages/${managedPackagesData?._id}/assign-assets`, {
        assets: data?.map((e) => {
          return { product: e.product, asset: e.asset, ...(e?.package ? { package: e?.package } : {}) };
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

  const disableAssignSerializedAssets = () => {
    if (selectedRecords.length === 0) return true;
    const flatArray = selectedRecords.filter((f) => f.type === MATERIAL_TYPE.product && f.qty > f.assetQty);
    return flatArray.length === 0;
  };


  const actionButtonMenuItems = () => {
    return (
      <>
        {permissions?.serializedAsset?.isRead &&
          <MenuItem
            disabled={disableAssignSerializedAssets()}
            onClick={() => {
              const products = [];
              selectedRecords
                .filter((i) => i.type === MATERIAL_TYPE.product)
                ?.forEach((e) => {
                  if (e?.qty - e?.assetQty > 0) {
                    products.push({ _id: e._id, product: e._id, qty: e?.qty - e?.assetQty, productName: e?.detail, ...(!isEmpty(e?.package) ? { package: e?.package?.optionValue } : {}) });
                  }
                });
              setAssignAssetDialog({ open: true, products: products });
            }}
          >
            {`Assign ${routes.serializedAsset.title}`}
          </MenuItem>
        }
      </>
    );
  };

  return (
    <>
      <DetailsPageHeader
        isAddButtonVisible={false}
        isActionButtonVisible={true}
        actionButtonMenuItems={actionButtonMenuItems()}
        actionButtonProps={{ disabled: !Boolean(selectedRecords && selectedRecords.filter((e) => !e.hideSelection).length) }}
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
          ids={flattenArray(dataRows)?.filter((e) => e.type === 'asset')?.map((e) => e._id)}
          handleClose={() => setAssignAssetDialog({ open: false, products: [] })}
          handleSucess={handleAssignAssets}
          isAssigning={isAssetAdding}
          selectedProducts={assignAssetDialog.products}
        />
      )}
    </>
  );
};

export default Assign;
