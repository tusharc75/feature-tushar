import Box from '@material-ui/core/Box/Box';
import { useState, useEffect, useReducer, useContext, Fragment } from 'react';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import CustomAgGrid, { intialState, reducer } from '../../../components/AgGridComponents/CustomAgGrid';
import CustomAgGridEditable from '../../../components/AgGridComponents/CustomAgGridEditable';
import routes from '../../../components/Helpers/Routes';
import Grid from '@material-ui/core/Grid/Grid';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { gridLoadingTimeout, INVENTORY_STATUS, serializedAsset } from '../../../constants/helpers';
import { useHistory } from 'react-router-dom';
import { isMobile, isTablet } from 'react-device-detect';
import CustomSwipableList from '../../../components/SwipableListComponents/CustomSwipableList';
import useColumns, { getStaticFields, getFrameworkComponents } from '../../../constants/useColumns';
import {
  prepareDataForGrid,
  DELIVERY_TICKET_REFERENCE_TYPE,
  DELIVERY_TICKET_TYPE,
  DELIVERY_FROM_TO_TYPE,
  sublease,
  SUBLEASE_STATUS,
  INVENTORY_OWNER_TYPE
} from '../../../constants/helpers';
// import route from '../../../constants/helpers';
import { useData } from '../../../StateProvider/Provider';
import { Button, Tooltip } from '@material-ui/core';
import { AiFillFilePdf } from 'react-icons/ai';
import ManageDeliveryTicket from '../../DeliveryTicket/ManageDeliveryTicket';
import { uniq, map } from 'lodash';
import ImportExportLinks from 'src/components/Helpers/ImportExportLinks';

const SerializedAsset = ({ subleaseData, fetchData, setNextStep, currentStep, renderedFrom, allowedToEdit, isProcessor }) => {
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();

  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;
  const { getColumnData } = useColumns();
  const [frameWorkComponent, setFrameWorkComponent] = useState({});
  const [columns, setColumns] = useState(null);
  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();

  const [showTicketDialog, setShowTicketDialog] = useState({ open: false, data: {} });
  const [isCompleteing, setIsCompleteing] = useState(false);
  const [isCompleteEnable, setIsCompleteEnable] = useState(false);

  const [downlodingFile, setDownlodingFile] = useState(false);
  const { setToastConfig } = useContext(CustomToastContext);

  useEffect(() => {
    fetchGridColumns();
  }, [currentStep]);

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=${serializedAsset.resource}`)
      .then(({ data: { data } }) => {
        let columns = [];
        let rendererNames = [];
        data.forEach((o) => {
          let currentColumn: any = getColumnData(renderedFrom, o?.fieldData, routes.serializedAssetDetail.path);
          if (currentColumn !== null) {
            if (o.fieldData.type === 'singleLine' && o.fieldData.fieldName !== 'assetNumber') {
              currentColumn.columnData.editable = true;
            }
            columns = [...columns, currentColumn?.columnData];
            if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
              rendererNames.push(currentColumn?.rendererName);
            }
          }
        });
        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
        tempFrameworkComponent = {
          ...tempFrameworkComponent
        };
        setFrameWorkComponent({ ...tempFrameworkComponent });
        columns = [...columns, ...getStaticFields()];
        setColumns([...columns]);
        fetchRecords();
      });
  };

  const fetchRecords = async () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    const response = await axiosInstance().get(`${sublease.api}/${subleaseData._id}/serialized-asset`);
    var isComplate = true;
    let rows = response?.data?.data.map((u) => {
      if (
        u?.currentOwner?.optionValue !== subleaseData?.supplierAccount?.optionValue ||
        [INVENTORY_STATUS.reserved, INVENTORY_STATUS.inUse, INVENTORY_STATUS.repair].includes(u.status)
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
    } else {
      setNextStep(false);
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
      <Box display="flex" justifyContent="flex-end" m={1} gridGap={'8px'} alignItems="center">
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
        <Box>
          {!isMobile && (
            <Button
              onClick={() => {
                setDownlodingFile(true);
                axiosInstance()
                  .get(`${sublease.api}/${subleaseData._id}/pdf`)
                  .then(({ data }) => {
                    axiosInstance()
                      .get(`user/download?fileName=${data.data.fileName}`, {
                        responseType: 'blob'
                      })
                      .then(({ data }) => {
                        const file = new Blob([data], { type: 'application/pdf' });
                        const fileURL = URL.createObjectURL(file);
                        const pdfWindow = window.open();
                        pdfWindow.location.href = fileURL;
                        toastConfig.setToastConfig({ open: true, type: 'success', message: 'Preview file downloaded successfully.' });
                        setDownlodingFile(false);
                      })
                      .catch((err) => {
                        toastConfig.setToastConfig(err);
                        setDownlodingFile(false);
                      });
                  })
                  .catch((err) => {
                    toastConfig.setToastConfig(err);
                    setDownlodingFile(false);
                  });
              }}
              variant={isMobile && !isTablet ? 'text' : 'outlined'}
              color="primary"
              type="button"
              size="small"
              disabled={downlodingFile}
              style={isMobile && !isTablet ? { color: 'var(--info-dark)' } : {}}
              startIcon={isMobile ? '' : <AiFillFilePdf />}
            >
              {isMobile && !isTablet ? (
                <AiFillFilePdf size={18} />
              ) : isMobile && !isTablet ? (
                <AiFillFilePdf size={18} />
              ) : downlodingFile ? (
                'Please wait...'
              ) : (
                'Preview'
              )}
            </Button>
          )}
        </Box>
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
                          [INVENTORY_STATUS.reserved].includes(f.status)
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
                        }
                        else {
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
          isMobile && !isTablet ? (
            <CustomSwipableList
              allowSelection={allowedToEdit || isProcessor}
              allowSwipe={true}
              permissions={true}
              primaryField={columns?.find((d) => d.field)}
              onClick={(data) => {
                history.push(`${routes.serializedAssetDetail.path}/${data._id}`);
              }}
              dataRows={dataRows}
              selectedRecords={selectedRecords}
              dispatch={dispatch}
              onEdit={false}
              extraParamsToCheckDelete={true}
              onDelete={false}
              rowCount={rowCount}
              page={page}
              loading={loading}
              additionalDetails={[]}
              chips={[
                {
                  label: 'Status : ',
                  field: 'status'
                }
              ]}
              owerCollaboratorInitialsOrImages="owerCollaboratorInitialsOrImages"
              onCreate={false}
              showClone={false}
              onClone={() => {}}
              renderedFrom={renderedFrom}
            />
          ) : (
            <CustomAgGridEditable
              columns={columns}
              dataRows={dataRows}
              frameworkComponents={frameWorkComponent}
              setGridApi={setGridApi}
              dispatch={dispatch}
              rowCount={rowCount}
              limit={limit}
              pageSizes={pageSizes}
              page={page}
              allowAction={false}
              loading={loading}
              isClientSideGrid={true}
              allowSelection={allowedToEdit || isProcessor}
              renderedFrom={renderedFrom}
              refreshGrid={fetchRecords}
              onCellValueChanged={handleValueUpdate}
            />
          )
        ) : (
          <Box p={2} height={500} bgcolor="white">
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
            fetchRecords();
          }}
        />
      )}
    </>
  );
};

export default SerializedAsset;
