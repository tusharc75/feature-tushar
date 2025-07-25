import { Box, IconButton, MenuItem } from '@mui/material';
import { map, startCase, uniq } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { FiExternalLink } from 'react-icons/fi';
import axiosInstance from 'src/axios/axiosInstance';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import CustomMessageDialog from 'src/components/MessageDialog';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { CHILD_RESOURCE, dateFormatToSend, DELIVERY_FROM_TO_TYPE, DELIVERY_TICKET_REFERENCE_TYPE, DELIVERY_TICKET_STATUS, DELIVERY_TICKET_TYPE, deliveryTicket, MATERIAL_TYPE, SERIALIZED_PACKAGE_OWNER_TYPE, sidebarResource } from 'src/constants/helpers';
import { actionDisable, assemblyOrderActions, assemblyOrderMessage } from 'src/constants/messageHelpers';
import ExistingRentalJob from 'src/pages/AssemblyOrder/Loading/ExistingRentalJob';
import ManageDeliveryTicket from 'src/pages/DeliveryTicket/ManageDeliveryTicket';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';

const Loading = ({ allowedToEdit, assemblyOrderData, setNextStep, renderedFrom, stepFullScreen }) => {
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { user, permissions, resources }
  }: any = useData();

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { selectedRecords } = state;

  const { generateColumns } = useColumns();

  const [columns, setColumns] = useState(null);
  const [existingRentalJobDialog, setExistingRentalJobDialog] = useState(false);
  const [assetPolicyData, setAssetPolicyData] = useState(null);
  const [showTicketDialog, setShowTicketDialog] = useState({ open: false, data: {} });
  const [hideDeliveryTicketDelivered, setHideDeliveryTicketDelivered] = useState(false);
  const [openMessageDialog, setOpenMessageDialog] = useState({ open: false, errorMessages: [] });

  useEffect(() => {
    fetchFields();
    fetchPolicy();
  }, [assemblyOrderData]);

  const fetchFields = async () => {
    const response = await fetch_child_resource_fields(CHILD_RESOURCE.assemblyOrderMaterial, assemblyOrderData?.currency || 'USD', allowedToEdit);
    const data = response;
    let newColumns = generateColumns(renderedFrom, data?.filter((e) => !['detail', 'description']?.includes(e?.fieldName)), null, false, assemblyOrderData?.currency || 'USD');

    const {
      data: { data: serializedPackageFieldData }
    } = await axiosInstance().put(`/field/find-field-labels`, {
      fields: [
        {
          resource: sidebarResource.serializedPackages,
          fieldNames: ['serializedPackageNumber']
        }
      ]
    });

    const serializedPackageField = serializedPackageFieldData?.find((d) => d.resource === sidebarResource.serializedPackages)?.fieldNames || [];

    let coloum: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: 'left',
        Cell: ({ row }) => <h5 className="text-truncate">{row.original.index}</h5>,
        Footer: () => {
          return <>Total</>;
        }
      },
      {
        accessor: 'type',
        Header: 'Type',
        width: 150,
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row }) => (row.original['type'] ? <h5>{`${startCase(row.original?.type)} `}</h5> : <NoDataCell />)
      },
      {
        accessor: 'detail',
        Header: 'Details',
        disabled: true,
        minWidth: 200,
        width: 200,
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <h5 className="text-truncate">{row.original?.detail}</h5>{' '}
            <Box>
              <IconButton
                size="small"
                onClick={() => {
                  if (row.original.type === MATERIAL_TYPE.product) {
                    window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                  } else if (row.original.type === MATERIAL_TYPE.package) {
                    window.open(`${routes.packagesDetail.path}/${row.original.materialId}`);
                  } else if (row.original.type === MATERIAL_TYPE.serializedAsset) {
                    window.open(`${routes.serializedAssetDetail.path}/${row.original.materialId}`);
                  }
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
            </Box>
          </div>
        )
      },
      {
        accessor: 'description',
        Header: 'Description',
        width: 200,
        show: false,
        Cell: ({ row }) => {
          return row.original['description'] ? <div>
            <h5 className="text-truncate" title={row.original.description}>{row.original.description}</h5>
          </div> : <NoDataCell />;
        }
      },
      {
        accessor: 'serializedPackageNumber',
        Header: serializedPackageField[0]?.fieldLabel || 'Serialized Package Number',
        width: 200,
        show: false,
        Cell: ({ row }) => {
          return row.original?.serializedPackageNumber ? (
            <div className="flex items-center gap-2">
              <h5 className="text-truncate" title={row.original?.serializedPackageNumber}>{row.original?.serializedPackageNumber}</h5>{' '}
              <Box>
                <IconButton
                  size="small"
                  onClick={() => {
                    window.open(`${routes.serializedPackagesDetail.path}/${row.original.serializedPackageId}`);
                  }}
                >
                  <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                </IconButton>
              </Box>
            </div>
          ) : (
            <NoDataCell />
          );
        }
      },
      {
        accessor: 'status',
        Header: `${resources?.serializedPackages?.titleSingular} Status`,
        cell: ({ row }) => (row?.original?.status ? <h5 className="text-truncate">{row?.original?.status}</h5> : <NoDataCell />)
      },
      {
        accessor: 'loadingTicket',
        Header: 'Loading Ticket',
        cell: ({ row }) =>
          row?.original?.loadingTicket ? (
            <div className="flex items-center gap-2">
              <h5 className="text-truncate">{row?.original?.loadingTicket}</h5>
              <IconButton
                size="small"
                onClick={() => {
                  window.open(`${routes.deliveryTicketDetail.path}/${row?.original?.loadingTicketId}`);
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
        accessor: 'loadingTicketStatus',
        Header: 'Loading Ticket Status',
        cell: ({ row }) =>
          (row?.original?.loadingTicketStatus ? <h5 className="text-truncate">{row?.original?.loadingTicketStatus}</h5> : <NoDataCell />)
      },
    ];
    coloum = [...coloum, ...newColumns];
    coloum.push({
      accessor: 'action',
      Header: 'Actions',
      minWidth: 100,
      width: 100,
      sticky: 'right',
      Cell: ({ row, table }) => <></>
    });
    setColumns(coloum);
  };

  const fetchPolicy = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.serializedAsset}`);
      if (data) {
        setAssetPolicyData(data);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    setNextStep(false);

    const {
      data: { data: { data, defaultDeliveryTicketStatus } }
    } = await axiosInstance().get(`${routes.assemblyOrder.path}/loading/${assemblyOrderData?._id}`);

    const { data: { data: deliveryTicketList } } = await axiosInstance().get(
      `${deliveryTicket.api}/typewise?referenceType=${DELIVERY_TICKET_REFERENCE_TYPE.assemblyOrder}&referenceId=${assemblyOrderData?._id}&ticketType=${DELIVERY_TICKET_TYPE.loading}`
    );

    const loadingTicketSerializedPackages = [];

    deliveryTicketList?.forEach((element) => {
      if (element.ticketType === DELIVERY_TICKET_TYPE.loading) {
        if (element?.serializedPackages?.length) {
          element?.serializedPackages?.forEach((ele) => {
            loadingTicketSerializedPackages.push({
              ...ele,
              loadingTicketId: element._id,
              loadingTicket: element?.ticketName,
              loadingTicketStatus: element?.status,
              warehouse: element?.pickupFrom,
              storageLocation: element?.pickupFromStorageLocation
            });
          });
        }
      }
    });

    setHideDeliveryTicketDelivered(defaultDeliveryTicketStatus === DELIVERY_TICKET_STATUS.delivered ? true : false);
    const rows = data?.filter((e) => e.parentId === null);

    rows.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail = parent?.detail || parent?.packageDetail?.packageName || '';
      parent.description = parent?.description || parent?.packageDetail?.packageDescription || '';
      parent.qtyDisplay = parent.qty;
      parent.serializedPackageId = parent?.serializedPackageDetail?._id;
      parent.serializedPackageNumber = parent?.serializedPackageDetail?.serializedPackageNumber;
      parent.status = parent?.serializedPackageDetail?.status;
      const loading = loadingTicketSerializedPackages?.find((e) => e?.serializedPackage === parent?.serializedPackageId && e?.uniqueId === parent?._id);
      if (loading) {
        parent.loadingTicket = loading?.loadingTicket;
        parent.loadingTicketId = loading?.loadingTicketId;
        parent.loadingTicketStatus = loading?.loadingTicketStatus;
      }
      parent.subRows = generateNestedData(data, parent);
    });

    if (rows?.every((r) => r?.isValid && r?.serializedPackageId)) {
      setNextStep(true);
    }
    dispatch({ type: 'initialize', data: rows, count: rows?.length });
    dispatch({ type: 'loading', loading: false });
  };

  const generateNestedData = (material, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, index) => {
      _subRow.index = parent.index + '.' + `${index + 1}`;
      _subRow.detail =
        _subRow?.detail || (_subRow.type === MATERIAL_TYPE.product
          ? _subRow.productDetail?.productName
          : _subRow?.type === MATERIAL_TYPE.serializedAsset
            ? _subRow?.assetDetail?.assetNumber
            : _subRow?.type === MATERIAL_TYPE.package
              ? _subRow?.packageDetail?.packageName
              : '');
      _subRow.description = _subRow?.description || (_subRow.type === MATERIAL_TYPE.product
        ? _subRow?.productDetail?.productDescription
        : _subRow.type === MATERIAL_TYPE.package
          ? _subRow?.packageDetail?.packageDescription
          : '');
      if (_subRow.type === MATERIAL_TYPE.package) {
        _subRow.serializedPackageId = _subRow?.serializedPackageDetail?._id;
        _subRow.serializedPackageNumber = _subRow?.serializedPackageDetail?.serializedPackageNumber;
      }
      _subRow.qty = _subRow.qty || 1;
      _subRow.qtyDisplay = _subRow.qty || 1;
      _subRow.subRows = generateNestedData(material, _subRow);
    });
    const subPackages = subRows?.filter((s) => s.type === MATERIAL_TYPE.package);
    parent.isValid = subPackages?.length > 0 ? subPackages?.every((s) => s?.serializedPackageId) : true;
    return subRows;
  };

  const validateAction = (action) => {
    const errorMessages = [];
    var records = [...selectedRecords?.filter(r => !r?.parentId)];
    records?.forEach((e) => {
      if (action === assemblyOrderActions.createLoadingTicket) {
        if (e.hasOwnProperty('loadingTicketId')) {
          errorMessages.push({ index: e.index, message: assemblyOrderMessage.loadingAlreadyCreated });
        } else if (uniq(map(records, 'serializedPackageDetail.warehouse.optionValue')).length !== 1) {
          errorMessages.push({
            index: e.index,
            message: assemblyOrderMessage.repairSameWarehouse?.replace(sidebarResource?.warehouse, resources?.warehouse?.titleSingular)
          });
        } else if (user?.user?.brandPolicy?.storageLocation && records?.find((e) => e?.serializedPackageDetail?.storageLocation?.optionValue)) {
          if (uniq(map(records, 'serializedPackageDetail.warehouse.optionValue')).length !== 1) {
            errorMessages.push({
              index: e.index,
              message: assemblyOrderMessage.loadSameStorageLocation?.replace(sidebarResource?.storageLocation, resources?.storageLocation?.titleSingular)
            });
          }
        }
      } else if (action === assemblyOrderActions.deliveredToCustomer) {
        if (!e.hasOwnProperty('loadingTicketId')) {
          errorMessages.push({ index: e.index, message: assemblyOrderMessage.loadingNotCreated });
        } else if (e?.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered) {
          errorMessages.push({ index: e.index, message: assemblyOrderMessage.loadingAlreadyDelivered });
        }
      }
    });
    if (errorMessages?.length) {
      setOpenMessageDialog({ open: true, errorMessages: errorMessages });
      return true;
    }
    return false;
  };

  const handleDeliveryTicketDialog = () => {
    const records = selectedRecords?.filter(r => !r?.parentId && r?.serializedPackageId)
    if (records.length) {
      const data = {};
      data['ticketName'] = assemblyOrderData?.assemblyOrderNumber;
      data['referenceId'] = assemblyOrderData._id;

      if (records[0]?.serializedPackageDetail?.warehouse) {
        data['pickupFromType'] = DELIVERY_FROM_TO_TYPE.plant;
        data['pickupFrom'] = records[0]?.serializedPackageDetail?.warehouse;
        if (records?.find((e) => e?.serializedPackageDetail?.storageLocation)) {
          data['pickupFromStorageLocation'] = records?.find((e) => e?.serializedPackageDetail?.storageLocation)?.serializedPackageDetail?.storageLocation;
          data['isPickupFromStorageLocationDisable'] = true;
          data['pickupFromStorageLocationDisableMessage'] = `Changes to the ${resources.storageLocation.titleSingular} are not allowed because inventory or asset assignments.`;
        }
      } else if (records[0]?.serializedPackageDetail?.currentOwnerType === SERIALIZED_PACKAGE_OWNER_TYPE.customerAccount) {
        data['pickupFromType'] = DELIVERY_FROM_TO_TYPE.customer;
        data['pickupFrom'] = records[0]?.serializedPackageDetail?.currentOwner;
      } else if (records[0]?.serializedPackageDetail?.currentOwnerType === SERIALIZED_PACKAGE_OWNER_TYPE.supplierAccount) {
        data['pickupFromType'] = DELIVERY_FROM_TO_TYPE.supplier;
        data['pickupFrom'] = records[0]?.serializedPackageDetail?.currentOwner;
      }

      if (records[0]?.serializedPackageDetail?.currentLocation) {
        data['pickupFromAddress'] = records[0]?.serializedPackageDetail?.currentLocation;
      }

      data['deliveryToType'] = DELIVERY_FROM_TO_TYPE.customer;
      data['deliveryTo'] = assemblyOrderData?.customerAccount?.optionValue;
      data['deliveryToAddress'] = assemblyOrderData.shippingAddress?.optionValue;

      data['startDate'] = assemblyOrderData?.createDate;
      data['endDate'] = assemblyOrderData?.estimateCompleteDate;
      data['isPickupFromDisable'] = true;
      data['pickupDisableMessage'] = `Changes to the ${resources.warehouse.titleSingular} are not allowed because inventory or asset assignments.`;

      data['isDeliveryToDisable'] = true;

      setShowTicketDialog({ open: true, data: data });
    }
  };

  const handelProcessTickets = () => {
    let data = {};
    const loadingTicketIds = uniq(
      map(
        selectedRecords?.filter((e) => e?.loadingTicketId),
        'loadingTicketId'
      )
    );
    if (loadingTicketIds.length) {
      data['_ids'] = loadingTicketIds?.map((e) => e);
      data['status'] = DELIVERY_TICKET_STATUS.delivered;
      data['signatures'] = [];
      data['warehouse'] = assemblyOrderData?.warehouse?.optionValue;
      data['receiveDate'] = dateFormatToSend(new Date());
      axiosInstance()
        .post(`${deliveryTicket.api}/updatebulk`, data)
        .then(({ data: { data } }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: `Delivered Successfully`
          });
          fetchData();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const actionButtonMenuItems = () => {
    return (
      <>
        {permissions?.rentalManagement?.isRead && (
          <MenuItem
            disabled={selectedRecords?.filter((r) => r?.serializedPackageId)?.length > 0 ? false : true}
            onClick={() => {
              setExistingRentalJobDialog(true);
            }}
          >
            Add In Rental Job
          </MenuItem>
        )}
        <HtmlTooltip title={!permissions?.deliveryTicket?.isCreate ? actionDisable : ''}>
          <MenuItem
            disabled={!permissions?.deliveryTicket?.isCreate || selectedRecords?.filter((r) => r?.serializedPackageId)?.length === 0}
            onClick={() => {
              if (!validateAction(assemblyOrderActions.createLoadingTicket)) {
                handleDeliveryTicketDialog()
              }
            }}
          >
            Send to Customer
          </MenuItem>
        </HtmlTooltip>
        {!hideDeliveryTicketDelivered && (
          <HtmlTooltip title={!permissions?.deliveryTicket?.isUpdate ? actionDisable : ''}>
            <MenuItem
              disabled={!permissions?.deliveryTicket?.isUpdate || selectedRecords?.filter((r) => r?.serializedPackageId)?.length === 0}
              onClick={() => {
                if (!validateAction(assemblyOrderActions.deliveredToCustomer)) {
                  handelProcessTickets()
                }
              }}
              id={'delivered-to-customer-menu-item'}
            >
              Delivered to Customer
            </MenuItem>
          </HtmlTooltip>
        )}
      </>
    );
  };

  return (
    <>
      {allowedToEdit && (
        <>
          <DetailsPageHeader
            isAddButtonVisible={false}
            isActionButtonVisible={true}
            actionButtonMenuItems={actionButtonMenuItems()}
            actionButtonProps={{ disabled: selectedRecords?.filter((e) => !e.hideSelection)?.length > 0 ? false : true }}
            hasXpadding
          />
        </>
      )}
      {columns ? (
        <>
          <Box zIndex={5} width={'100%'}>
            <CustomReactTable
              height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 395px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              renderedFrom={renderedFrom}
              refreshGrid={fetchData}
              hideSelection={!allowedToEdit}
              hideAction={!allowedToEdit}
              isClientSideGrid={true}
              expander={true}
            />
          </Box>
        </>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}

      {existingRentalJobDialog && (
        <ExistingRentalJob
          onClose={() => {
            setExistingRentalJobDialog(false);
          }}
          referenceData={assemblyOrderData}
          serializedPackageIds={selectedRecords?.filter((r) => r?.serializedPackageId)?.map((m) => m?.serializedPackageId)}
          inventory={selectedRecords
            ?.filter((r) => r?.type === MATERIAL_TYPE.serializedAsset)
            ?.map((a) => ({
              _id: a?.materialId,
              productId: a?.assetDetail?.product
            }))}
          assetPolicyData={assetPolicyData}
        />
      )}
      {showTicketDialog.open && (
        <ManageDeliveryTicket
          ticketType={DELIVERY_TICKET_TYPE.loading}
          referenceType={DELIVERY_TICKET_REFERENCE_TYPE.assemblyOrder}
          referenceData={showTicketDialog.data}
          onClose={() => setShowTicketDialog({ open: false, data: {} })}
          serializedPackages={selectedRecords?.filter(r => r?.serializedPackageId)}
          onSuccess={() => {
            setShowTicketDialog({ open: false, data: {} });
            fetchData();
          }}
        />
      )}
      {openMessageDialog.open && (
        <CustomMessageDialog
          open={openMessageDialog.open}
          errorMessages={openMessageDialog.errorMessages}
          onClose={() => {
            setOpenMessageDialog({ open: false, errorMessages: [] });
          }}
        />
      )}
    </>
  );
};

export default Loading;
