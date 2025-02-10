import { Refresh } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import { camelCase, startCase } from 'lodash';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { FiExternalLink } from 'react-icons/fi';
import axiosInstance from 'src/axios/axiosInstance';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { CHILD_RESOURCE, MATERIAL_TYPE, prepareDataForGrid, purchaseOrder, sidebarResource } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

type CustomContentProps = {
  row: Row;
  height: number;
};
export type Row = {
  _id?: string;
  purchaseOrderNumber?: string;
  afeNumber?: string;
  purchaseOrderDate?: Date;
  deliveryDate?: Date;
  currency?: string;
  status?: string;
  expenseItem?: boolean;
  chartofAccount?: string;
  externalComments?: string;
  internalComments?: string;
  customerPONumber?: string;
  quoteNumber?: string;
  termsOfPayment?: string;
  collaborator?: string;
  canDelete?: boolean;
  totalPrice?: number;
  supplierAccount?: string;
  supplierAccountId?: string;
  supplierContact?: string;
  supplierContactId?: string;
  pDFTemplate?: string;
  pDFTemplateId?: string;
  warehouse?: string;
  warehouseId?: string;
  owner?: string;
  ownerId?: string;
  createdBy?: string;
  createdByDate?: Date;
  createdById?: string;
  updatedBy?: string;
  updatedByDate?: Date;
  id?: string;
  isChecked?: boolean;
};

// columnCache stores column data on the first row expansion and for subsequent row expansions, setColumns gets column data from this cache.
let columnCache = null;

// The cache stores purchaseOrderData and rowsData on the first row expansion, and for subsequent expansions of the same row, data is retrieved from the cache
const cache = {};
const setCache = (row: Row, key: string, data) => {
  if (!cache[row._id]) {
    cache[row._id] = {};
  }
  cache[row._id][key] = data;
};
const getCache = (row: Row, key) => {
  return cache[row._id]?.[key] ?? null;
};
const resetCache = (row: Row) => {
  cache[row._id] = {};
};

const renderedFrom = `${camelCase(sidebarResource.purchaseOrder)}_grid-4`;

const CustomContent = React.memo(
  ({ row, height }: CustomContentProps) => {
    const toastConfig = useContext(CustomToastContext);
    const { generateColumns } = useColumns();
    const { state, dispatch } = useTableReducer({ renderedFrom });
    const { loading, initialDataLoaded } = state;
    const [purchaseOrderData, setPurchaseOrderData] = useState(getCache(row, 'purchaseOrderData'));
    const [columns, setColumns] = useState(columnCache);

    const fetchPurchaseOrderData = useCallback(
      async (callback?: (purchaseOrderData: any) => Promise<void> | void) => {
        if (getCache(row, 'purchaseOrderData')) return;
        dispatch({ type: 'loading', loading: true });
        try {
          const {
            data: { data }
          } = await axiosInstance().get(`${purchaseOrder.api}/${row?._id}`);
          setPurchaseOrderData(data);
          setCache(row, 'purchaseOrderData', data);
          if (typeof callback === 'function') callback(data);
        } catch (error) {
          toastConfig.setToastConfig(error);
        }
      },
      [dispatch, row, toastConfig]
    );

    const fetchColumns = useCallback(
      async (purchaseOrderData) => {
        if (columnCache) return null;
        setColumns(null);
        var column = [];

        const productResult = await axiosInstance().get('/field?resource=Product&view=true');
        const productFields = productResult?.data?.data?.filter((e) =>
          ['productCategory', 'productNumber', 'serializedProduct', 'chartOfAccount'].includes(e?.fieldData?.fieldName)
        );
        column.push({
          accessor: 'index',
          sticky: 'left',
          Header: 'Index',
          width: 70,
          primaryField: true,
          Cell: ({ row }) => {
            return row.original['index'] ? <p className="text-truncate">{row.original.index}</p> : <NoDataCell />;
          },
          Footer: () => {
            return <>Total</>;
          }
        });
        column.push({
          accessor: 'type',
          sticky: 'left',
          Header: 'Type',
          width: 100,
          primaryField: true,
          disabled: true,
          Cell: ({ row }) => {
            return row.original['type'] ? (
              <div>
                <p className="text-truncate" title={startCase(row.original.type)}>
                  {startCase(row.original.type)}
                </p>
              </div>
            ) : (
              <NoDataCell />
            );
          }
        });
        column.push({
          accessor: 'detail',
          Header: 'Detail',
          width: 200,
          disabled: true,
          Cell: ({ row }) => (
            <div className="flex items-center gap-2">
              <p className="text-truncate">{row.original.detail}</p>
              {[MATERIAL_TYPE.product, MATERIAL_TYPE.service, MATERIAL_TYPE.serializedAsset].includes(row.original.type) && (
                <IconButton
                  size="small"
                  onClick={() => {
                    if (row.original.type === MATERIAL_TYPE.product) {
                      window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                    } else if (row.original.type === MATERIAL_TYPE.service) {
                      window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                    } else if (row.original.type === MATERIAL_TYPE.serializedAsset) {
                      window.open(`${routes.serializedAssetDetail.path}/${row.original.assetId}`);
                    }
                  }}
                >
                  <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                </IconButton>
              )}
            </div>
          )
        });
        column.push({
          accessor: 'description',
          Header: 'Description',
          width: 200,
          Cell: ({ row }) => {
            return row.original['description'] ? <p className="text-truncate">{row?.original?.description}</p> : <NoDataCell />;
          }
        });

        const productFieldsColumns = generateColumns(renderedFrom, productFields);
        productFieldsColumns?.forEach((e) => {
          column.push(e);
        });

        let fields = await fetch_child_resource_fields(CHILD_RESOURCE.purchaseOrderProduct, purchaseOrderData?.currency, false);

        const newColumns = generateColumns(renderedFrom, fields, null, false, purchaseOrderData?.currency);
        column = [...column, ...newColumns];
        column.push({
          accessor: 'assetQty',
          Header: 'Received Assets',
          width: 150,
          Cell: ({ row }) => (row.original['assetQty'] ? <p>{row.original['assetQty']}</p> : <NoDataCell />),
          Footer: (info) => {
            let rows = info.table.getExpandedRowModel().rows;
            return rows
              ?.filter((f) => f.original.hasOwnProperty('assetQty') && !isNaN(f.original['assetQty']))
              .reduce((sum, row) => row.original['assetQty'] + sum, 0);
          }
        });
        column.push({
          accessor: 'inventoryQty',
          Header: 'Received Quantity',
          width: 150,
          Cell: ({ row }) => (row.original['inventoryQty'] ? <p>{row.original['inventoryQty']}</p> : <NoDataCell />),
          Footer: (info) => {
            let rows = info.table.getExpandedRowModel().rows;
            return rows
              ?.filter((f) => f.original.hasOwnProperty('inventoryQty') && !isNaN(f.original['inventoryQty']))
              .reduce((sum, row) => row.original['inventoryQty'] + sum, 0);
          }
        });
        setColumns([...column]);
        columnCache = [...column];
      },
      [generateColumns]
    );

    const fetchProduct = useCallback(async () => {
      const cachedData = getCache(row, 'rows');
      if (cachedData) {
        dispatch({ type: 'initialize', data: cachedData, count: cachedData?.length });
        dispatch({ type: 'loading', loading: false });
        return;
      }
      dispatch({ type: 'loading', loading: true });
      dispatch({ type: 'selection', selectedRecords: [] });
      try {
        const result = await axiosInstance().get(`${purchaseOrder.api}/product/${purchaseOrderData?._id}`);
        const assets: any = await axiosInstance().get(`${purchaseOrder.api}/${purchaseOrderData?._id}/assets`);
        const serializedAsset = assets?.data?.data?.serializedAsset;
        const productSerialNumber = assets?.data?.data?.productSerialNumber;

        const serviceResponse: any = await axiosInstance().get(`${purchaseOrder.api}/service/${purchaseOrderData?._id}`);
        const costResponce: any = await axiosInstance().get(`${purchaseOrder.api}/cost/${purchaseOrderData?._id}`);

        const tempMaterialserializedAssets: any = {};
        const tempMaterialSerialNumbers: any = {};

        let rows = result?.data?.data?.map((item, index) => {
          let finalObject = prepareDataForGrid(item);

          let res: any = {
            ...finalObject,
            index: index + 1,
            type: MATERIAL_TYPE.product,
            materialId: item?.productDetail?._id,
            detail: item?.productDetail?.productName,
            description: item?.productDetail?.productDescription,
            productNumber: item?.productDetail?.productNumber,
            serializedProduct: item?.productDetail?.serializedProduct,
            productCategory: item.productDetail?.productCategory,
            chartOfAccount: item.productDetail?.chartOfAccount
          };
          const subRows = [];
          serializedAsset
            ?.filter((e) => e?.product?.optionValue === res?.materialId && e?.uniqueId === res?._id)
            ?.forEach((e) => {
              subRows.push({
                index: `${res.index}.${subRows?.length + 1}`,
                _id: e?._id,
                detail: e.assetNumber,
                type: MATERIAL_TYPE.serializedAsset,
                assetId: e?._id,
                hideSelection: true
              });
            });
          productSerialNumber
            ?.filter((e) => e?.product === res?.materialId && e?.uniqueId === res?._id)
            ?.forEach((e) => {
              subRows.push({
                index: `${res.index}.${subRows?.length + 1}`,
                _id: e?._id,
                detail: e.serialNumber,
                type: 'Serial Number',
                assetId: e?._id,
                hideSelection: true
              });
            });
          res.subRows = subRows;
          res['assetQty'] = res?.subRows?.filter((e) => e.type === MATERIAL_TYPE.serializedAsset)?.length;
          res['inventoryQty'] = item?.actualReceived
            ? (item?.actualReceived || 0) - res?.subRows?.filter((e) => e.type === MATERIAL_TYPE.serializedAsset)?.length
            : 0;
          tempMaterialserializedAssets[res?._id] = res?.subRows
            ?.filter((e) => e.type === MATERIAL_TYPE.serializedAsset)
            ?.map((e) => {
              return { optionValue: e?._id, optionLabel: e?.detail };
            });
          tempMaterialSerialNumbers[res?._id] = res?.subRows
            ?.filter((e) => e.type === 'Serial Number')
            ?.map((e) => {
              return { optionValue: e?._id, optionLabel: e?.detail };
            });
          return res;
        });

        if (serviceResponse?.data?.data?.length) {
          serviceResponse?.data?.data?.forEach((ele) => {
            ele.detail = ele?.serviceDetail?.serviceName;
            ele.description = ele?.serviceDescription?.serviceDescription;
            ele.materialId = ele?.serviceDetail?._id;
            rows.push({ ...ele, index: rows?.length + 1, type: MATERIAL_TYPE.service });
          });
        }
        if (costResponce?.data?.data?.length) {
          costResponce?.data?.data?.forEach((ele) => {
            ele.detail = ele?.description;
            ele.materialId = ele?._id;
            rows.push({ ...ele, index: rows?.length + 1, type: MATERIAL_TYPE.manualEntry });
          });
        }

        dispatch({ type: 'initialize', data: rows, count: rows?.length });
        dispatch({ type: 'loading', loading: false });
        setCache(row, 'rows', rows);
      } catch (error) {
        toastConfig.setToastConfig(error);
      }
    }, [dispatch, purchaseOrderData?._id, row, toastConfig]);

    useEffect(() => {
      fetchPurchaseOrderData(fetchColumns);
    }, [row?._id]);

    useEffect(() => {
      if (purchaseOrderData) fetchProduct();
    }, [purchaseOrderData]);

    const refresh = useCallback(() => {
      resetCache(row);
      fetchPurchaseOrderData();
    }, [fetchPurchaseOrderData, row]);

    const isLoading = loading || !initialDataLoaded;

    return (
      <>
        <div className="absolute left-[19px] size-[24px]">
          <HtmlTooltip title={isLoading ? 'Loading' : 'Refresh'}>
            <IconButton disabled={isLoading} size="small" onClick={refresh} sx={{ background: 'var(--dark-primary, white)' }}>
              <Refresh style={{ fontSize: '20px' }} className={`${isLoading ? 'animate-spin' : ''}`} />
            </IconButton>
          </HtmlTooltip>
        </div>
        <div className="max-w-full">
          {columns ? (
            <CustomReactTable
              showTableHead={false}
              height={`${height}px`}
              columns={columns}
              state={state}
              dispatch={dispatch}
              renderedFrom={renderedFrom}
              isClientSideGrid={true}
              hideSelection={true}
              expander={true}
            />
          ) : (
            <div>
              <CommonSkeleton lenArray={[...Array(3).keys()]} xs={12} sm={12} md={12} lg={12} />
            </div>
          )}
        </div>
      </>
    );
  },
  (prev, next) => prev.row?._id === next.row?._id
);

export default CustomContent;
