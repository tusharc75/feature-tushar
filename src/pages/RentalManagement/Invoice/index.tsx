import Box from '@material-ui/core/Box/Box';
import React, { useState, useEffect, useReducer, useContext, Fragment } from 'react';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import Grid from '@material-ui/core/Grid/Grid';
import { Button, IconButton } from '@material-ui/core';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { rentalManagement, RENTAL_STATUS, sidebarResource } from '../../../constants/helpers';
import { useData } from '../../../StateProvider/Provider';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import { startCase } from 'lodash';
import { CustomOfflineContext } from '../../../StateProvider/OfflineContext/OfflineContext';
import { objectStore, findOne } from '../../../constants/indexdbhelper';
import AdditionalCostDialog from '../AdditionalCost/AdditionalCostDialog';
import { fetch_rental_product_fields, fetch_rental_cost_fields } from '../../../components/RentalManagment/helper';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import moment from 'moment';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import PreviewDownload from 'src/components/PreviewDownload';
import { generateCustomTableColumns } from 'src/constants/columns';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';

const Invoice = ({ rentalManagementData, updateJobStatus, statusOptions, stepFullScreen, allowedToEdit, renderedFrom }) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();

  const { isOffline } = useContext(CustomOfflineContext);
  const [showCostDialog, setShowCostDialog] = useState(false);

  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);

  useEffect(() => {
    if (
      statusOptions.findIndex((d) => d.optionLabel === RENTAL_STATUS.readyToInvoice) >
      statusOptions.findIndex((d) => d.optionLabel === rentalManagementData?.status)
    ) {
      if (!isOffline && rentalManagementData?.status !== RENTAL_STATUS.cancelled) {
        updateJobStatus(RENTAL_STATUS.readyToInvoice);
      }
    }
  }, []);

  useEffect(() => {
    fetchFields();
  }, [isOffline]);

  const fetchFields = async () => {
    try {
      let { fields } = await fetch_rental_product_fields(rentalManagementData.currency, isOffline);

      const resultCost = await fetch_rental_cost_fields(rentalManagementData.currency, isOffline);

      fields = [...fields, ...resultCost];

      fields = [...new Map(fields.map((item) => [item['fieldName'], item])).values()];

      fields?.forEach((e) => {
        e.isColumnEditable = false;
      });
      const newColumns = generateCustomTableColumns(fields, rentalManagementData?.currency, renderedFrom);
      let qtyIndex = newColumns.findIndex((d) => d.accessor === 'qty');
      if (qtyIndex > -1) {
        newColumns[qtyIndex].accessor = 'qtyDisplay';
      }
      var column: any = [
        {
          accessor: 'srno',
          Header: 'Index',
          width: 70,
          Cell: ({ row }) => <p className="text-truncate">{row.original.srno}</p>,
          Footer: () => {
            return <>Total</>;
          }
        },
        {
          accessor: 'type',
          Header: 'Type',
          disableFilters: true,
          width: 200,
          Cell: ({ row }) =>
            row.original['type'] ? (
              <p>
                {`${startCase(row.original?.type)} `}
                {row.original['type'] === 'product'
                  ? row.original?.productDetail?.serializedProduct
                    ? '(Serialized)'
                    : '(Non-Serialized)'
                  : row.original?.type === 'package'
                  ? row.original?.packageDetail.packageType === 'Product'
                    ? '(Product)'
                    : '(Service)'
                  : row.original.type === 'service'
                  ? row?.original?.serviceDetail?.serviceType && `(${row?.original?.serviceDetail?.serviceType})`
                  : ''}
              </p>
            ) : (
              <NoDataCell />
            )
        },
        {
          accessor: 'detail',
          Header: 'Details',
          width: 300,
          Cell: ({ row }) =>
            row.original['type'] ? (
              <div className="d-flex gap-2 align-items-center">
                <p className="text-truncate">{row.original.detail}</p>
                {row.original.type !== 'Add On' && (
                  <HtmlTooltip title={`${row.original.type}`}>
                    <IconButton
                      size="small"
                      onClick={() => {
                        if (row.original.type === 'service') {
                          window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                        } else if (row.original.type === 'product') {
                          window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                        } else if (row.original.type === 'asset') {
                          window.open(`${routes.serializedAssetDetail.path}/${row.original.inventory}`);
                        } else {
                          window.open(`${routes.packagesDetail.path}/${row.original.materialId}`);
                        }
                      }}
                    >
                      <OpenInNewIcon fontSize="small" color="primary" />
                    </IconButton>
                  </HtmlTooltip>
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
            return row.original['description'] ? <p className="text-truncate">{row.original.description}</p> : <NoDataCell />;
          }
        },
        {
          accessor: 'status',
          Header: 'Status',
          width: 200,
          Cell: ({ row }) => <p className="text-truncate">{row.original.status ? row.original.status : <NoDataCell />}</p>
        }
      ];
      column = [...column, ...newColumns?.filter((e) => e.accessor !== 'description')];
      setColumns(column);
      fetchData();
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchData = async () => {
    let combinedData: any = [];
    let inventory: any = [];
    let material: any = [];
    let additionalcost: any = [];
    try {
      if (isOffline) {
        const result = await findOne(objectStore.rentalManagement, rentalManagementData._id);
        material = result?.material;
        additionalcost = result?.additionalCost;
      } else {
        const resultMaterial = await axiosInstance().get(`${rentalManagement.api}/productpackage/${rentalManagementData._id}`);
        material = resultMaterial?.data?.data?.material;
        inventory = resultMaterial?.data?.data?.inventory?.filter((e) => !e.isReplaced);

        const resultCost = await axiosInstance().get(`${rentalManagement.api}/additionalcost/${rentalManagementData._id}`);
        additionalcost = resultCost?.data?.data;
      }
      material?.forEach((item) => {
        if (!item.parentId) {
          item.detail =
            item.type === 'product'
              ? item.productDetail?.productName
              : item.type === 'service'
              ? item.serviceDetail?.serviceName
              : item.type === 'package'
              ? item.packageDetail?.packageName
              : '';
          item.type = item.type;
          combinedData.push(item);
        }
      });
      additionalcost?.forEach((e) => {
        e.type = 'Add On';
        e.detail = e.description;
        e.description = e.description;
        e.parentId = null;
      });
      combinedData = [...combinedData, ...additionalcost];
      const rows = combinedData.filter((e) => e.parentId === null);
      rows.forEach((parent, i) => {
        parent.srno = i + 1;
        parent.detail =
          parent.type === 'Add On'
            ? parent.detail
            : parent.type === 'product'
            ? parent?.productDetail?.productName
            : parent.type === 'service'
            ? parent?.serviceDetail?.serviceName
            : parent.packageDetail?.packageName;
        parent.description =
          parent?.type === 'service'
            ? parent?.serviceDetail?.serviceDescription || ''
            : parent?.type === 'product'
            ? parent?.productDetail?.productDescription || ''
            : parent?.type === 'package'
            ? parent?.packageDetail?.packageDescription || ''
            : parent.type === 'Add On'
            ? parent.description
            : '';
        parent.qty = parent.qty;
        parent.subRows = generateNestedData(material, inventory, parent);
      });
      setRowsData(rows);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const generateNestedData = (material, inventory, parent) => {
    const subRows: any = [];
    const inventory_result = inventory?.filter((e) => e._id === parent._id);

    inventory_result?.forEach((_inventory, k) => {
      subRows.push({
        _id: _inventory.inventoryDetail?._id,
        srno: `${parent.srno}.${k + 1}`,
        detail: _inventory.inventoryDetail?.assetNumber,
        status: _inventory.inventoryDetail?.status,
        description: parent?.description || '',
        actualStartDate: _inventory.startDate,
        actualEndDate: _inventory.endDate,
        type: 'Asset',
        qty: 1
      });
    });

    const childProduct: any = material.filter((e) => e.parentId === parent._id);
    childProduct.forEach((_subRow, j) => {
      _subRow.srno = parent.srno + '.' + (j + 1);
      _subRow.detail =
        _subRow?.type === 'product'
          ? _subRow?.productDetail?.productName
          : _subRow?.type === 'service'
          ? _subRow?.serviceDetail?.serviceName
          : _subRow?.packageDetail?.packageName;
      _subRow.description =
        _subRow?.type === 'service'
          ? _subRow?.serviceDetail?.serviceDescription || ''
          : _subRow?.type === 'product'
          ? _subRow?.productDetail?.productDescription || ''
          : _subRow?.type === 'package'
          ? _subRow?.packageDetail?.packageDescription || ''
          : '';
      _subRow.qty = `${parent.qty * _subRow.qty}`;
      _subRow.subRows = generateNestedData(material, inventory, _subRow);
      subRows.push(_subRow);
    });
    return subRows;
  };

  const handleAddCost = (rows) => {
    axiosInstance()
      .post(`${rentalManagement.api}/additionalcost/${rentalManagementData._id}/add`, { additionalCost: rows })
      .then(() => {
        fetchData();
        setShowCostDialog(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <>
      <Box display="flex" justifyContent="space-between" m={1}>
        <Box display="flex" alignItems="center" gridGap={'8px'}>
          {!isOffline && ![RENTAL_STATUS.invoiced, RENTAL_STATUS.closed].includes(rentalManagementData.status) && allowedToEdit && (
            <Fragment>
              <Button
                variant="outlined"
                className="btn-outline-v1"
                size="small"
                disabled={isOffline}
                onClick={() => {
                  setShowCostDialog(true);
                }}
              >
                Add
              </Button>
            </Fragment>
          )}
          <PreviewDownload
            resource={sidebarResource.rentalManagement}
            referenceId={rentalManagementData._id}
            columns={columns}
            isSendEmail={true}
            defaultColumns={[
              'index',
              'type',
              'details',
              'description',
              'qty',
              'unit',
              'inUseDays',
              'standByDays',
              `price_${rentalManagementData?.currency?.toLowerCase()}`,
              `totalPrice_${rentalManagementData?.currency?.toLowerCase()}`,
              `finalPrice_${rentalManagementData?.currency?.toLowerCase()}`
            ]}
          />
        </Box>
      </Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={12} sm={12}>
          {columns && rowsData ? (
            <Box zIndex={5} width={'100%'} height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 350px)'}>
              <CustomReactTable
                height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 365px)'}
                columns={columns}
                data={rowsData}
                setWholeRowsCellColor={() => {}}
                onSelect={() => {}}
                childrenProperty="subRows"
                uniqueKey="_id"
                hideSelection={true}
                hideAction={true}
                renderedFrom={renderedFrom}
                isClientSideGrid={true}
              />
            </Box>
          ) : (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </Grid>
      </Grid>
      {showCostDialog && (
        <AdditionalCostDialog
          onClose={() => {
            setShowCostDialog(false);
          }}
          handleAddCost={handleAddCost}
          handleUpdateCost={() => {
            return false;
          }}
          currency={rentalManagementData?.currency}
          costData={null}
        />
      )}
    </>
  );
};

export default Invoice;
