import { Button, MenuItem } from '@material-ui/core';
import Box from '@material-ui/core/Box/Box';
import { map, uniq } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CustomReactTable, { getStaticFields, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { subleaseMessage } from 'src/constants/messageHelpers';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../../StateProvider/Provider';
import axiosInstance from '../../../axios/axiosInstance';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import routes from '../../../components/Helpers/Routes';
import {
  ASSET_STATUS,
  CHILD_RESOURCE,
  DELIVERY_FROM_TO_TYPE,
  DELIVERY_TICKET_REFERENCE_TYPE,
  DELIVERY_TICKET_STATUS,
  DELIVERY_TICKET_TYPE,
  INVENTORY_OWNER_TYPE,
  prepareDataForGrid,
  serializedAsset,
  sidebarResource,
  sublease
} from '../../../constants/helpers';
import ManageDeliveryTicket from '../../DeliveryTicket/ManageDeliveryTicket';
import ImportExportMenu from 'src/components/Helpers/ImportExportMenu';
import CustomMessageDialog from 'src/components/MessageDialog';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import { generateStepSendToSupplier } from 'src/pages/Sublease/walkmeSteps';
import { useSetWalkmeData } from 'src/components/CustomIntro';

const SerializedAsset = ({ subleaseData, fetchData, currentStep, renderedFrom, allowedToEdit, isProcessor, stepFullScreen }) => {
  const { setWalkmeData } = useSetWalkmeData();
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, selectedRecords } = state;
  const { generateColumns } = useColumns();
  const [columns, setColumns] = useState(null);
  const {
    state: { user, permissions, resources }
  }: any = useData();

  const [showTicketDialog, setShowTicketDialog] = useState({ open: false, data: {} });
  const [openMessageDialog, setOpenMessageDialog] = useState({ open: false, errorMessages: [] });

  const { setToastConfig } = useContext(CustomToastContext);

  useEffect(() => {
    fetchGridColumns();
  }, [currentStep]);

  const [pdfColumns, setPdfColumns] = useState([]);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    var data = await fetch_child_resource_fields(CHILD_RESOURCE.subleaseProduct, subleaseData?.currency, allowedToEdit);
    const newColumns = generateColumns(null, data, null, false, subleaseData?.currency);
    let coloum: any = [
      {
        accessor: 'index',
        Header: 'Index'
      },
      {
        accessor: 'type',
        Header: 'Type'
      },
      {
        accessor: 'detail',
        Header: 'Details'
      },
      {
        accessor: 'description',
        Header: 'Description'
      }
    ];
    setPdfColumns([...coloum, ...newColumns]);
  };

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=${serializedAsset.resource}`)
      .then(({ data: { data } }) => {
        const newColumns = generateColumns(renderedFrom, data, routes.serializedAssetDetail.path);
        newColumns?.forEach((o) => {
          if (data?.find((d) => d?.fieldData?.fieldName === o?.accessor)?.type === 'singleLine' && o?.accessor !== 'assetNumber') {
            o.editable = true;
          }
        });
        const extraColoums = [
          {
            accessor: 'rentalJob',
            Header: 'Rental Job',
            show: true,
            Cell: ({ row }) =>
              row.original?.rentalJob ? (
                <Link
                  className="link text-truncate"
                  target="_blank"
                  title={row.original?.rentalJob}
                  to={`${routes.rentalManagementDetail.path}/${row.original?.rentalJobId}`}
                >
                  {row.original?.rentalJob}
                </Link>
              ) : (
                <NoDataCell />
              )
          },
          {
            accessor: 'wellName',
            Header: 'Well Name',
            show: true,
            Cell: ({ row }) =>
              row.original?.wellName ? (
                <Link
                  className="link text-truncate"
                  target="_blank"
                  title={row.original?.wellName}
                  to={`${routes.wellMasterDetail.path}/${row.original?.wellNameId}`}
                >
                  {row.original?.wellName}
                </Link>
              ) : (
                <NoDataCell />
              )
          },
          {
            accessor: 'remainingJobDays',
            Header: 'Remaining Job Days',
            show: true,
            Cell: ({ row }) => <div>{row.original?.remainingJobDays ? row.original?.remainingJobDays : <NoDataCell />}</div>
          }
        ];
        setColumns([
          {
            accessor: 'index',
            Header: 'Index',
            minWidth: 100,
            width: 100,
            disabled: true,
            Cell: ({ row }) => (row?.original?.index ? <h5 className="text-truncate">{row?.original?.index}</h5> : <NoDataCell />)
          },
          ...newColumns.slice(0, 1),
          ...extraColoums,
          ...newColumns.slice(1),
          ...getStaticFields()
        ]);
        fetchRecords();
      });
  };

  const handleAddWalkmeData = (rows: any[]) => {
    if (rows.length > 0) {
      setWalkmeData([generateStepSendToSupplier(0)]);
    } else {
      setWalkmeData([]);
    }
  };

  const fetchRecords = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    const response = await axiosInstance().get(`${sublease.api}/asset/${subleaseData._id}`);
    let rows = response?.data?.data.map((u, i) => {
      let res = {
        ...prepareDataForGrid(u, user)
      };
      res['index'] = i + 1;
      res['isChecked'] = false;
      return res;
    });
    handleAddWalkmeData(rows);
    dispatch({ type: 'initialize', data: rows, count: rows.length });
    dispatch({ type: 'loading', loading: false });
  };

  const checkUniqWarehouse = () => {
    if (selectedRecords.length === 0) {
      return false;
    } else if (uniq(map(selectedRecords, 'warehouseId')).length === 1) {
      return true;
    } else {
      return false;
    }
  };

  const handleValueUpdate = async (row) => {
    if (!row || !row?.data) return;
    const assetId = row.data._id;
    const data = [
      {
        _id: assetId,
        [row.column.colId]: row.newValue
      }
    ];
    try {
      await axiosInstance()
        .post(`${routes.serializedAsset.path}/update-assets`, data)
        .then(() => {
          fetchGridColumns();
        });
    } catch (err) {
      setToastConfig(err);
    }
  };

  const previewDownloadProps =
    columns && pdfColumns
      ? {
        fileName: `${resources?.sublease?.titleSingular}-${subleaseData?.subleaseName}`,
        resource: sidebarResource.sublease,
        referenceId: subleaseData?._id,
        columns: [...pdfColumns, ...columns?.filter((e) => ['serialNumber', 'supplierSerialNumber']?.includes(e.field))],
        defaultColumns: ['index', 'type', 'detail', 'description', 'qty']
      }
      : null;

  const rightSideContents = () => {
    return (
      <>
        {allowedToEdit && (
          <ImportExportMenu
            permissions={permissions?.serializedAsset}
            module={resources?.serializedAsset?.titlePlural}
            api={`${serializedAsset.api}/custom-template`}
            afterImportCompleted={() => {
              fetchRecords();
            }}
            isExportAllOrSomeFeature={true}
            isDownloadExcel={false}
            recordsToExport={selectedRecords.length ? selectedRecords.length : dataRows?.length}
            ids={selectedRecords.length ? selectedRecords?.map((d: any) => d._id) : dataRows?.map((d: any) => d._id)}
          />
        )}
        {allowedToEdit && (
          <Button
            variant={'contained'}
            color="primary"
            size="small"
            id="send-to-supplier-button"
            disabled={checkUniqWarehouse() && (allowedToEdit || isProcessor) ? false : true}
            onClick={() => {
              if (!validateAction()) {
                const data = {};
                data['ticketName'] = subleaseData.subleaseName;
                data['referenceId'] = subleaseData._id;
                data['pickupFromType'] = DELIVERY_FROM_TO_TYPE.plant;
                data['pickupFrom'] = selectedRecords[0]?.warehouseId;
                data['pickupFromAddress'] = selectedRecords[0]?.currentLocationId;
                data['deliveryToType'] = DELIVERY_FROM_TO_TYPE.supplier;
                data['deliveryTo'] = subleaseData?.supplierAccount?.optionValue;
                data['deliveryToAddress'] = subleaseData?.shippingAddress?.optionValue;
                data['isPickupFromDisable'] = true;
                data['isDeliveryToDisable'] = true;
                if (subleaseData?.wellName?.optionValue) {
                  data['wellName'] = subleaseData?.wellName?.optionValue;
                }
                if (subleaseData?.wellNumber) {
                  if (subleaseData?.wellNumber?.optionValue) {
                    data['wellNumber'] = subleaseData?.wellNumber?.optionValue;
                  } else {
                    data['wellNumber'] = subleaseData?.wellNumber?.map((e) => e?.optionValue);
                  }
                }
                if (subleaseData?.afeNumber) {
                  data['afeNumber'] = subleaseData?.afeNumber;
                }
                if (subleaseData?.processor?.optionValue) {
                  data['processor'] = subleaseData?.processor?.optionValue;
                }
                data['status'] = DELIVERY_TICKET_STATUS.delivered;
                setShowTicketDialog({ open: true, data: data });
              }
            }}
          >
            Send to Supplier
          </Button>
        )}
      </>
    );
  };

  const validateAction = () => {
    const errorMessages = [];
    selectedRecords?.forEach((e, i) => {
      if (e.currentOwnerType === INVENTORY_OWNER_TYPE.supplierAccount) {
        errorMessages.push({ index: e.index, message: subleaseMessage.assetsAlradyReturned });
      } else if (e.currentOwnerType === INVENTORY_OWNER_TYPE.customerAccount) {
        errorMessages.push({ index: e.index, message: subleaseMessage.assetsIsWithCustomer });
      } else if (![ASSET_STATUS.new, ASSET_STATUS.available, ASSET_STATUS.underReview]?.includes(e.status)) {
        errorMessages.push({ index: e.index, message: subleaseMessage.assetStatusSendSupplier });
      }
    });
    if (errorMessages?.length) {
      setOpenMessageDialog({ open: true, errorMessages: errorMessages });
      return true;
    }
    return false;
  };

  return (
    <>
      <DetailsPageHeader
        isAddButtonVisible={false}
        isActionButtonVisible={false}
        previewDownloadProps={previewDownloadProps}
        rightSideContents={rightSideContents()}
        hasXpadding
      />
      {columns ? (
        <CustomReactTable
          height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}
          columns={columns}
          state={state}
          dispatch={dispatch}
          renderedFrom={renderedFrom}
          refreshGrid={fetchRecords}
          isClientSideGrid={true}
          hideExportTable={true}
          hideSelection={!allowedToEdit}
        />
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {showTicketDialog.open && (
        <ManageDeliveryTicket
          ticketType={DELIVERY_TICKET_TYPE.delivery}
          referenceType={DELIVERY_TICKET_REFERENCE_TYPE.sublease}
          referenceData={showTicketDialog.data}
          assets={selectedRecords}
          onClose={() => setShowTicketDialog({ open: false, data: {} })}
          onSuccess={() => {
            setShowTicketDialog({ open: false, data: {} });
            fetchRecords();
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

export default SerializedAsset;
