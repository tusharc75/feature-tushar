import Box from '@material-ui/core/Box/Box';
import { useState, useEffect, useContext, Fragment } from 'react';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import routes from '../../../components/Helpers/Routes';
import Grid from '@material-ui/core/Grid/Grid';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { gridLoadingTimeout, ASSET_STATUS, serializedAsset, sidebarResource } from '../../../constants/helpers';
import { useHistory } from 'react-router-dom';
import {
  prepareDataForGrid,
  DELIVERY_TICKET_REFERENCE_TYPE,
  DELIVERY_TICKET_TYPE,
  DELIVERY_FROM_TO_TYPE,
  sublease,
  SUBLEASE_STATUS,
  INVENTORY_OWNER_TYPE
} from '../../../constants/helpers';
import { useData } from '../../../StateProvider/Provider';
import { Button, Tooltip } from '@material-ui/core';
import ManageDeliveryTicket from '../../DeliveryTicket/ManageDeliveryTicket';
import { uniq, map } from 'lodash';
import ImportExportLinks from 'src/components/Helpers/ImportExportLinks';
import PreviewDownload from 'src/components/PreviewDownload';
import { Link } from 'react-router-dom';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { subleaseMessage } from 'src/constants/messageHelpers';
import { fetch_sublease_product_fields } from 'src/components/Sublease/helper';
import { generateCustomTableColumns } from 'src/constants/columns';
import CustomReactTable, { getStaticFields, useColumns, useTableReducer, } from 'src/components/CustomReactTableNew';

const SerializedAsset = ({ subleaseData, fetchData, setNextStep, setNextStepToolTip, currentStep, renderedFrom, allowedToEdit, isProcessor, stepFullScreen }) => {
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer();
  const { dataRows, rowCount, selectedRecords } = state;
  const { getColumnData } = useColumns();
  const [columns, setColumns] = useState(null);
  const {
    state: { user, permissions }
  }: any = useData();

  const [showTicketDialog, setShowTicketDialog] = useState({ open: false, data: {} });
  const [isCompleteing, setIsCompleteing] = useState(false);
  const [isCompleteEnable, setIsCompleteEnable] = useState(false);

  const { setToastConfig } = useContext(CustomToastContext);

  useEffect(() => {
    fetchGridColumns();
  }, [currentStep]);

  const [pdfColumns, setPdfColumns] = useState([]);

  useEffect(() => {
    fetchFields()
  }, []);

  const fetchFields = async () => {
    var data = await fetch_sublease_product_fields(subleaseData?.currency);
    const newColumns = generateCustomTableColumns(data, subleaseData?.currency);
    let coloum: any = [
      {
        accessor: 'index',
        Header: 'Index',
      },
      {
        accessor: 'type',
        Header: 'Type',
      },
      {
        accessor: 'detail',
        Header: 'Details',
      },
      {
        accessor: 'description',
        Header: 'Description',
      }
    ];
    setPdfColumns([...coloum, ...newColumns])
  }

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=${serializedAsset.resource}`)
      .then(({ data: { data } }) => {
        let columns = [];
        data.forEach((o) => {
          let currentColumn: any = getColumnData(renderedFrom, o?.fieldData, routes.serializedAssetDetail.path);
          if (currentColumn !== null) {
            if (o.fieldData.type === 'singleLine' && o.fieldData.fieldName !== 'assetNumber') {
              currentColumn.columnData.editable = true;
            }
            columns = [...columns, currentColumn?.columnData];
          }
        });

        const extraColoums = [
          {
            accessor: 'rentalJob', Header: 'Rental Job', show: true,
            Cell: ({ row }) => (
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
            )
          },
          {
            accessor: 'wellName', Header: 'Well Name', show: true,
            Cell: ({ row }) => (
              row.original?.wellName ? (
                <Link className="link text-truncate" target="_blank" title={row.original?.wellName} to={`${routes.wellMasterDetail.path}/${row.original?.wellNameId}`}>
                  {row.original?.wellName}
                </Link>
              ) : (
                <NoDataCell />
              )
            )
          },
          { accessor: 'remainingJobDays', Header: 'Remaining Job Days', show: true, Cell: ({ row }) => (row.original?.remainingJobDays ? row.original?.wellName : <NoDataCell />) }
        ];

        columns = [...columns.slice(0, 1), ...extraColoums, ...columns.slice(1), ...getStaticFields()];
        setColumns([...columns]);
        fetchRecords();
      });
  };

  const fetchRecords = async () => {
    dispatch({ type: 'loading', loading: true });
    const response = await axiosInstance().get(`${sublease.api}/${subleaseData._id}/serialized-asset`);
    var isComplate = true;
    let rows = response?.data?.data.map((u) => {
      if (
        u?.currentOwner?.optionValue !== subleaseData?.supplierAccount?.optionValue ||
        [ASSET_STATUS.reserved, ASSET_STATUS.inUse, ASSET_STATUS.repair].includes(u.status)
      ) {
        isComplate = false;
      }
      let res = {
        ...prepareDataForGrid(u, user)
      };
      res['isChecked'] = false;
      return res;
    });
    setIsCompleteEnable(isComplate);
    if (isComplate) {
      setNextStep(true);
      setNextStepToolTip(null)
    } else {
      setNextStep(false);
      setNextStepToolTip(subleaseMessage.subleaseProcessStep)
    }
    dispatch({ type: 'initialize', data: rows, count: rows.length });
    setTimeout(() => {
      dispatch({ type: 'loading', loading: false });
    }, gridLoadingTimeout);
  };

  const completeSublease = () => {
    setIsCompleteing(true);
    axiosInstance()
      .put(`${sublease.api}/${subleaseData._id}/complete-sublease`)
      .then(() => {
        setIsCompleteing(false);
        dispatch({ type: 'selection', selectedRecords: [] });
        fetchData();
        fetchRecords();
      })
      .catch((error) => {
        setIsCompleteing(false);
        toastConfig.setToastConfig(error);
      });
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

  return (
    <>
      <Box display="flex" justifyContent="flex-end" my={1} className="px-2" gridGap={'8px'} alignItems="center">
        {allowedToEdit && (
          <Box>
            <ImportExportLinks
              permissions={permissions?.packages}
              module="packages-products"
              api={`${serializedAsset.api}/custom-template`}
              afterImportCompleted={() => {
                fetchRecords();
              }}
              isExportAllOrSomeFeature={true}
              total={rowCount}
              recordsToExport={selectedRecords.length ? selectedRecords.length : dataRows.length}
              ids={selectedRecords.length ? selectedRecords?.map((d: any) => d._id) : dataRows?.map((d: any) => d._id)}
              isDownloadExcel={false}
              isBackgroundWhite={true}
            />
          </Box>
        )}
        {columns && pdfColumns &&
          <PreviewDownload
            fileName={`${routes.sublease.title}-${subleaseData?.subleaseName}`}
            resource={sidebarResource.sublease}
            referenceId={subleaseData?._id}
            columns={[...pdfColumns, ...columns?.filter((e) => ['serialNumber', 'supplierSerialNumber']?.includes(e.field))]}
            defaultColumns={[
              'index',
              'type',
              'detail',
              'description',
              'qty',
            ]}
          />
        }
        {SUBLEASE_STATUS.completed != subleaseData?.status && (allowedToEdit || isProcessor) && (
          <Fragment>
            {/* {currentStep === 1 && (
              <Fragment>
                <Tooltip title="Transfer to Plant">
                  <Button
                    variant={'contained'}
                    color="primary"
                    size="small"
                    onClick={() => {
                      const data = {};
                      data['ticketName'] = subleaseData.subleaseName;
                      data['referenceId'] = subleaseData._id;
                      data['pickupFromType'] = DELIVERY_FROM_TO_TYPE.supplier;
                      data['pickupFrom'] = subleaseData?.supplierAccount?.optionValue;
                      data['pickupFromAddress'] = subleaseData?.shippingAddress?.optionValue;
                      data['deliveryToType'] = DELIVERY_FROM_TO_TYPE.plant;
                      data['isPickupFromDisable'] = true;
                      setShowTicketDialog({ open: true, data: data });
                    }}
                    disabled={
                      selectedRecords.length === 0 ||
                      selectedRecords.some(
                        (f) =>
                          f.hasOwnProperty('warehouse') ||
                          f.currentOwnerType !== INVENTORY_OWNER_TYPE.supplierAccount ||
                          [ASSET_STATUS.reserved].includes(f.status)
                      )
                    }
                  >
                    Receiving to Plant
                  </Button>
                </Tooltip>
                <Box mx={1} />
              </Fragment>
            )} */}
            {selectedRecords.length > 0 &&
              selectedRecords.filter((e) => e.currentOwnerType === INVENTORY_OWNER_TYPE.brand).length === selectedRecords.length &&
              checkUniqWarehouse() &&
              currentStep === 1 ? (
              <Fragment>
                <Tooltip title="Send to Supplier">
                  <Button
                    variant={'contained'}
                    color="primary"
                    size="small"
                    onClick={() => {
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
                      setShowTicketDialog({ open: true, data: data });
                    }}
                  >
                    Send to Supplier
                  </Button>
                </Tooltip>
              </Fragment>
            ) : null}
            {currentStep === 2 && allowedToEdit && (
              <Fragment>
                <Button
                  variant={'contained'}
                  color="primary"
                  size="small"
                  disabled={!isCompleteEnable || isCompleteing}
                  onClick={() => {
                    completeSublease();
                  }}
                >
                  End Sublease
                </Button>
              </Fragment>
            )}
          </Fragment>
        )}
      </Box>
      <Grid item xs={12} md={12} sm={12}>
        {columns ? (
          <CustomReactTable
            height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            isClientSideGrid={false}
            refreshGrid={fetchData}
            allowPagination={false}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Grid>
      {showTicketDialog.open && (
        <ManageDeliveryTicket
          ticketType={DELIVERY_TICKET_TYPE.delivery}
          referenceType={DELIVERY_TICKET_REFERENCE_TYPE.sublease}
          referenceData={showTicketDialog.data}
          productInventory={selectedRecords}
          onClose={() => setShowTicketDialog({ open: false, data: {} })}
          onSuccess={() => {
            setShowTicketDialog({ open: false, data: {} });
            dispatch({ type: 'selection', selectedRecords: [] });
            fetchRecords();
          }}
        />
      )}
    </>
  );
};

export default SerializedAsset;
