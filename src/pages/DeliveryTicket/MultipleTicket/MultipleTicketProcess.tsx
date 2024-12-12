import { Box, Button, Grid } from '@material-ui/core';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import CustomReactTable, { getStaticFields, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { CustomOfflineContext } from '../../../StateProvider/OfflineContext/OfflineContext';
import { useData } from '../../../StateProvider/Provider';
import axiosInstance from '../../../axios/axiosInstance';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import SignatureDialog from '../../../components/Helpers/SignatureDialog';
import {
  DELIVERY_TICKET_MAPPED_STATUS,
  DELIVERY_TICKET_STATUS,
  deliveryTicket,
  gridLoadingTimeout,
  prepareDataForGrid,
  sidebarResource
} from '../../../constants/helpers';
import { findAll, findOne, objectStore } from '../../../constants/indexdbhelper';
import routes from '.././../../components/Helpers/Routes';

const MultipleTicketProcess = ({ referenceData, ticketType, referenceType }) => {
  const renderedFrom = `${camelCase(sidebarResource?.deliveryTicket)}_grid-2`;
  const {
    state: { user, selectedEntity }
  }: any = useData();
  const { generateColumns } = useColumns();
  const toastConfig = useContext(CustomToastContext);

  //  Grid Variables - Start
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { selectedRecords } = state;
  const { isOffline } = useContext(CustomOfflineContext);

  const [columns, setColumns] = useState(null);
  const [openSignatureDialog, setOpenSignatureDialog] = useState({ label: '', open: false });
  const [signaturesToSend, setSignaturesToSend] = useState([]);
  const [isUpdating, setUpdating] = useState(false);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    fetchDeliveryTicket();
  }, []);

  const fetchGridColumns = async () => {
    let data;
    if (isOffline) {
      data = await findOne(objectStore.resource, sidebarResource.deliveryTicket);
    } else {
      const response = await axiosInstance().get(
        `/field?resource=${sidebarResource.deliveryTicket}&entity=${selectedEntity}&view=true&showHiddenFields=true`
      );
      data = response?.data?.data;
    }
    data = data.filter((e) => e?.fieldData?.fieldName !== 'productInventory');
    const newColumns = generateColumns(renderedFrom, data, routes.deliveryTicket.path, true);
    setColumns([...newColumns, ...getStaticFields()]);
  };

  const fetchDeliveryTicket = async () => {
    try {
      if (selectedEntity) {
        dispatch({ type: 'loading', loading: true });
        let data: any = [],
          count;
        if (!isOffline) {
          const response = await axiosInstance().get(
            `${deliveryTicket.api}/typewise?referenceType=${referenceType}&referenceId=${referenceData._id}&ticketType=${ticketType?.toString()}`
          );
          data = response?.data?.data;
          count = data?.length;
        } else {
          data = await findAll(objectStore.deliveryTicket);
          count = data?.length || 0;
        }
        let rows = data.map((u) => {
          let res: any = {
            ...prepareDataForGrid(u, user)
          };
          res['hideSelection'] = [DELIVERY_TICKET_STATUS.delivered].includes(res.status);
          return res;
        });
        dispatch({ type: 'initialize', data: rows, count: count });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      }
    } catch (error) {
      dispatch({ type: 'loading', loading: false });
      toastConfig.setToastConfig(error);
    }
  };

  const handleSignature = async (signedData) => {
    const status = openSignatureDialog.label === 'Sign-off - Dispatch' ? 'Start Delivery' : 'Sign-Off';
    const indexOfExistingSignature = signaturesToSend.findIndex((sign) => sign.type === signedData.type && sign.status === status);
    let signatures: any = [];
    if (indexOfExistingSignature === -1) {
      signatures = [...signaturesToSend, { type: signedData.type, signature: signedData.sign, name: signedData?.name, status: status }];
    } else {
      signatures[indexOfExistingSignature] = {
        ...signatures[indexOfExistingSignature],
        type: signedData.type,
        signature: signedData.sign,
        status: status,
        name: signedData?.name
      };
    }
    setSignaturesToSend(signatures);
    if (signatures.length === 2) {
      setUpdating(true);
      let data = {};
      data['_ids'] = selectedRecords.map((d) => d._id);
      data['status'] = DELIVERY_TICKET_MAPPED_STATUS[openSignatureDialog.label];
      data['signatures'] = signatures;
      axiosInstance()
        .post(`${deliveryTicket.api}/updatebulk`, data)
        .then(({ data: { data } }) => {
          setUpdating(false);
          setOpenSignatureDialog({ open: false, label: '' });
          setSignaturesToSend([]);
          fetchDeliveryTicket();
        })
        .catch((error) => {
          setUpdating(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  return (
    <>
      <Box display="flex" justifyContent="flex-end" pt={1}>
        <Box display="flex" alignItems="center">
          <HtmlTooltip title="Sign-off - Dispatch">
            <Button
              variant="outlined"
              color="primary"
              size="small"
              onClick={() => {
                setOpenSignatureDialog({ label: 'Sign-off - Dispatch', open: true });
              }}
              disabled={selectedRecords.length === 0 || selectedRecords.some((f) => f.status !== DELIVERY_TICKET_STATUS.new)}
            >
              Sign-off - Dispatch
            </Button>
          </HtmlTooltip>
          <Box mx={1} />
          <HtmlTooltip title="Sign-off - Delivery">
            <Button
              variant="outlined"
              color="primary"
              size="small"
              onClick={() => {
                setOpenSignatureDialog({ label: 'Sign-off - Delivery', open: true });
              }}
              disabled={selectedRecords.length === 0 || selectedRecords.some((f) => f.status !== DELIVERY_TICKET_STATUS.inTransit)}
            >
              Sign-off - Delivery
            </Button>
          </HtmlTooltip>
          <Box mx={1} />
        </Box>
      </Box>
      <Grid item xs={12} md={12} sm={12} className="mt-3">
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
            refreshGrid={fetchDeliveryTicket}
            hideAction={true}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Grid>
      {openSignatureDialog.open && (
        <SignatureDialog
          submitting={isUpdating}
          label={openSignatureDialog.label}
          steps={openSignatureDialog.label === 'Sign-off - Dispatch' ? ['Supervisor', 'Delivery Person'] : ['Delivery Person', 'Receiver']}
          forDelivery={true}
          open={true}
          onClose={() => {
            setOpenSignatureDialog({ open: false, label: '' });
          }}
          onSigned={handleSignature}
        />
      )}
    </>
  );
};

export default MultipleTicketProcess;
