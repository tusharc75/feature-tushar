import { IconButton } from '@material-ui/core';
import Box from '@material-ui/core/Box/Box';
import { startCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { CustomOfflineContext } from '../../../StateProvider/OfflineContext/OfflineContext';
import { useData } from '../../../StateProvider/Provider';
import axiosInstance from '../../../axios/axiosInstance';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import routes from '../../../components/Helpers/Routes';
import { fetch_rental_cost_fields, fetch_rental_product_fields } from '../../../components/RentalManagment/helper';
import { MATERIAL_TYPE, RENTAL_STATUS, rentalManagement, sidebarResource } from '../../../constants/helpers';
import { findOne, objectStore } from '../../../constants/indexdbhelper';
import AdditionalCostDialog from '../Productpackage/AdditionalCostDialog';
import { FiExternalLink } from 'react-icons/fi';
import { createCloseStep, createSendEmailStep } from 'src/pages/RentalManagement/walkmeSteps';
import { useGetWalkmeInstance, useSetWalkmeData } from 'src/components/CustomIntro';

const Invoice = ({ rentalManagementData, updateJobStatus, statusOptions, stepFullScreen, allowedToEdit, renderedFrom }) => {
  const walkmeInstance = useGetWalkmeInstance();
  const { setWalkmeData } = useSetWalkmeData();
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();

  const { isOffline } = useContext(CustomOfflineContext);
  const [showCostDialog, setShowCostDialog] = useState(false);
  const [columns, setColumns] = useState(null);

  const { state, dispatch } = useTableReducer();
  const { generateColumns } = useColumns();

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
    if (!isOffline) {
      addWalkmeData();
    }
  }, [isOffline]);

  const addWalkmeData = () => {
    const sendEmailSteps = createSendEmailStep();
    const closeSteps = createCloseStep(routes.rentalManagement.title);
    const stepData = [sendEmailSteps];

    if (
      permissions?.rentalManagement?.isUpdate &&
      !isOffline &&
      [RENTAL_STATUS.readyToInvoice, RENTAL_STATUS.invoiced].includes(rentalManagementData?.status) &&
      allowedToEdit
    ) {
      stepData.push(closeSteps);
    }
    setWalkmeData(stepData);
    if (walkmeInstance) {
      walkmeInstance?.instance.push(stepData.map((d) => d.steps).flat());
      walkmeInstance?.handleNext();
    }
  };

  const fetchFields = async () => {
    try {
      let fields = await fetch_rental_product_fields(rentalManagementData.currency, isOffline);

      const resultCost = await fetch_rental_cost_fields(rentalManagementData.currency, isOffline);

      fields = [...fields, ...resultCost]?.filter((f) => f?.isRead);

      fields = [...new Map(fields.map((item) => [item['fieldName'], item])).values()];

      fields?.forEach((e) => {
        e.isColumnEditable = false;
      });
      const newColumns = generateColumns(renderedFrom, fields, null, false, rentalManagementData?.currency);
      var column: any = [
        {
          accessor: 'index',
          Header: 'Index',
          width: 70,
          sticky: 'left',
          Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
          Footer: () => {
            return <>Total</>;
          }
        },
        {
          accessor: 'type',
          Header: 'Type',
          disableFilters: true,
          width: 200,
          disabled: true,
          sticky: isMobile || isTablet ? 'none' : 'left',
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
          disabled: true,
          sticky: isMobile || isTablet ? 'none' : 'left',
          Cell: ({ row }) =>
            row.original['type'] ? (
              <div className="flex items-center gap-2">
                <p className="text-truncate">{row.original.detail}</p>
                {row.original.type !== MATERIAL_TYPE.manualEntry && (
                  <IconButton
                    size="small"
                    onClick={() => {
                      if (row.original.type === 'service') {
                        window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                      } else if (row.original.type === 'product') {
                        window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                      } else if (row.original.type === 'asset') {
                        window.open(`${routes.serializedAssetDetail.path}/${row.original._id}`);
                      } else {
                        window.open(`${routes.packagesDetail.path}/${row.original.materialId}`);
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
      column = [...column, ...newColumns?.filter((e) => !['detail', 'description']?.includes(e.accessor))];
      setColumns(column);
      fetchData();
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });

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
        e.type = MATERIAL_TYPE.manualEntry;
        e.parentId = null;
      });
      combinedData = [...combinedData, ...additionalcost];
      const rows = combinedData.filter((e) => e.parentId === null);
      rows.forEach((parent, i) => {
        parent.index = i + 1;
        parent.detail =
          parent.type === MATERIAL_TYPE.manualEntry
            ? parent.detail
            : parent.type === MATERIAL_TYPE.product
              ? parent?.productDetail?.productName
              : parent.type === MATERIAL_TYPE.service
                ? parent?.serviceDetail?.serviceName
                : parent.packageDetail?.packageName;
        parent.description =
          parent?.type === MATERIAL_TYPE.service
            ? parent?.serviceDetail?.serviceDescription || ''
            : parent?.type === MATERIAL_TYPE.product
              ? parent?.productDetail?.productDescription || ''
              : parent?.type === MATERIAL_TYPE.package
                ? parent?.packageDetail?.packageDescription || ''
                : parent.type === MATERIAL_TYPE.manualEntry
                  ? parent.description
                  : '';
        parent.qty = parent.qty;
        parent.status = parent?.productDetail?.serializedProduct ? parent.status : '';
        parent.subRows = generateNestedData(material, inventory, parent);
      });
      dispatch({ type: 'initialize', data: rows, count: rows?.length });
      dispatch({ type: 'loading', loading: false });
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const generateNestedData = (material, inventory, parent) => {
    const subRows: any = [];
    const inventory_result = inventory?.filter((e) => e._id === parent._id);

    inventory_result?.forEach((_inventory) => {
      subRows.push({
        ..._inventory,
        _id: _inventory.inventoryDetail?._id,
        index: `${parent.index}.${subRows?.length + 1}`,
        detail: _inventory.inventoryDetail?.assetNumber,
        status: _inventory.inventoryDetail?.status,
        description: parent?.description || '',
        actualStartDate: _inventory.startDate,
        actualEndDate: _inventory.endDate,
        type: 'asset',
        qty: 1
      });
    });

    const childProduct: any = material.filter((e) => e.parentId === parent._id);
    childProduct.forEach((_subRow) => {
      _subRow.index = parent.index + '.' + (subRows?.length + 1);
      _subRow.detail =
        _subRow?.type === MATERIAL_TYPE.product
          ? _subRow?.productDetail?.productName
          : _subRow?.type === MATERIAL_TYPE.service
            ? _subRow?.serviceDetail?.serviceName
            : _subRow?.packageDetail?.packageName;
      _subRow.description =
        _subRow?.type === MATERIAL_TYPE.service
          ? _subRow?.serviceDetail?.serviceDescription || ''
          : _subRow?.type === MATERIAL_TYPE.product
            ? _subRow?.productDetail?.productDescription || ''
            : _subRow?.type === MATERIAL_TYPE.package
              ? _subRow?.packageDetail?.packageDescription || ''
              : '';
      _subRow.qty = `${parent.qty * _subRow.qty}`;
      _subRow.status = _subRow?.productDetail?.serializedProduct ? parent.status : '';
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

  const previewDownloadProps = {
    fileName: `${routes.rentalManagement.title}-${rentalManagementData?.rentalJobName}`,
    resource: sidebarResource.rentalManagement,
    referenceId: rentalManagementData._id,
    columns: columns,
    isSendEmail: true,
    defaultColumns: [
      'index',
      'type',
      'detail',
      'description',
      'qty',
      'unit',
      'inUseDays',
      'standByDays',
      'standByDaysNotChargeable',
      `price_${rentalManagementData?.currency?.toLowerCase()}`,
      `totalPrice_${rentalManagementData?.currency?.toLowerCase()}`,
      `finalPrice_${rentalManagementData?.currency?.toLowerCase()}`
    ]
  };
  return (
    <>
      <DetailsPageHeader
        isActionButtonVisible={false}
        isAddButtonVisible={!isOffline && ![RENTAL_STATUS.invoiced, RENTAL_STATUS.closed].includes(rentalManagementData.status) && allowedToEdit}
        addButtonProps={{
          onClick: () => {
            setShowCostDialog(true);
          }
        }}
        previewDownloadProps={previewDownloadProps}
      />

      {columns ? (
        <Box zIndex={5} width={'100%'}>
          <CustomReactTable
            height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            setWholeRowsCellColor={() => {}}
            refreshGrid={fetchData}
            hideSelection={true}
            hideAction={true}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
            expander={true}
          />
        </Box>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
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
