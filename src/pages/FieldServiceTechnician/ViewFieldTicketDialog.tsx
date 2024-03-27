import { Button, Dialog } from '@material-ui/core';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import routes from 'src/components/Helpers/Routes';
import { CustomDialogTransition, gridLoadingTimeout, prepareDataForGrid } from 'src/constants/helpers';
import FieldTicketTable from '../FieldServiceOrder/FieldTicket/FieldTicketTable';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useTableReducer } from 'src/components/CustomReactTable';
import axiosInstance from 'src/axios/axiosInstance';
import { useData } from 'src/StateProvider/Provider';
import ManageFieldTicket from '../FieldTicket/ManageFieldTicket';

export default function ViewFieldTicketDialog({ onClose, serviceOrderData, renderedFrom }) {
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { selectedEntity }
  }: any = useData();

  const { state, dispatch } = useTableReducer();
  const { selectedRecords } = state;

  const [openDialog, setOpenDialog] = useState({ open: false, isClone: false, id: null });

  useEffect(() => {
    fetchData();
  }, [selectedEntity, serviceOrderData]);

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });

    const queryString = getQueryString();
    axiosInstance()
      .get(`${routes.fieldTicket.path}${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data?.map((u) => {
          let finalObject = prepareDataForGrid(u);
          finalObject['isChecked'] = selectedRecords?.some((s) => s._id === u._id);
          let res = {
            ...finalObject
          };
          return res;
        });
        dispatch({
          type: 'initialize',
          data: rows,
          count: count
        });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  const getQueryString = () => {
    let deepFilter = '?';
    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`;
    }

    const filterByIds = [{ field: 'fieldServiceOrder', term: serviceOrderData?._id }];

    if (filterByIds?.length) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterByIds)}&filterType=and`;
    }

    return deepFilter;
  };

  return (
    <>
      <Dialog fullScreen={true} TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true}>
        <CustomDialogHeader
          title={`${routes.fieldServiceOrder.title} - ${serviceOrderData?.fieldServiceOrderNumber}`}
          onClose={onClose}
          showRequiredLabel={false}
        ></CustomDialogHeader>
        <CustomDialogContent>
          <FieldTicketTable
            renderedFrom={renderedFrom}
            setOpenDialog={setOpenDialog}
            state={state}
            dispatch={dispatch}
            fetchData={fetchData}
            height={'calc(100vh - 200px)'}
          />
        </CustomDialogContent>
        <CustomDialogFooter>
          <Button type="button" variant="outlined" color="primary" size="small" onClick={onClose}>
            Cancel
          </Button>
        </CustomDialogFooter>
      </Dialog>
      {openDialog.open && (
        <ManageFieldTicket
          id={openDialog?.id}
          isClone={false}
          onClose={() => setOpenDialog({ open: false, isClone: false, id: null })}
          referenceData={{
            customerAccount: serviceOrderData?.customerAccountId || '',
            billingAddress: serviceOrderData?.billingAddressId || '',
            shippingAddress: serviceOrderData?.shippingAddressId || '',
            fieldServiceOrder: serviceOrderData?._id || '',
            warehouse: serviceOrderData?.warehouseId || '',
            wellName: serviceOrderData?.wellNameId || '',
            wellNumber:
              [{ optionLabel: serviceOrderData?.wellNumber, optionValue: serviceOrderData?.wellNumberId }, ...serviceOrderData?.restwellNumber]?.map(
                (m) => m?.optionValue
              ) || [],
            numberOfWells: serviceOrderData?.numberOfWells,
            estimateStartDate: serviceOrderData?.estimateStartDate || '',
            estimateEndDate: serviceOrderData?.estimateEndDate || '',
            taxCode: serviceOrderData?.taxCodeId || '',
            pricingCondition: serviceOrderData?.pricingConditionId || '',
            collaborator:
              [
                { optionLabel: serviceOrderData?.collaborator, optionValue: serviceOrderData?.collaboratorId },
                ...serviceOrderData?.restcollaborator
              ]?.map((m) => m?.optionValue) || []
          }}
          onSuccess={() => {
            setOpenDialog({ open: false, isClone: false, id: null });
            fetchData();
          }}
          renderedFrom={renderedFrom}
        />
      )}
    </>
  );
}
