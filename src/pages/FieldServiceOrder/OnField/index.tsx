import { Box } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import {
  checkIsAllowedToEdit,
  RENTAL_STEPS,
  rentalManagement,
  serializedAsset,
  sidebarResource
} from 'src/constants/helpers';
import { findOne, objectStore } from 'src/constants/indexdbhelper';
import ReceivingTicket from 'src/pages/RentalManagement/ReceivingTicket';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import { useData } from 'src/StateProvider/Provider';


const OnField = ({ rentalId, referenceFrom }) => {

  const toastConfig = useContext(CustomToastContext);
  const { isOffline } = useContext(CustomOfflineContext);
  const renderedFrom = `${referenceFrom}_onField`;
  const {
    state: { user, resourceData },
  }: any = useData();
  const [loading, setLoading] = useState(true);
  const [rentalManagementData, setRentalManagementData] = useState(null);
  const [isProcessor, setIsProcessor] = useState(false);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [allowUpdateStatus, setAllowUpdateStatus] = useState(false);

  useEffect(() => {
    if (rentalId) {
      fetchRentalManagementData();
      if (serializedAsset?.resource) {
        fetchAssetStatusRights();
      }
    }
  }, [rentalId]);

  const fetchAssetStatusRights = () => {
    axiosInstance()
      .get(`/field?resource=${serializedAsset.resource}&view=true`)
      .then(({ data }) => {
        if (data.data && data.data.length) {
          data.data.some((o) => {
            if (o?.fieldData?.fieldName === 'status') {
              setAllowUpdateStatus(o?.isUpdate);
              return true;
            }
          });
        }
      })
      .catch((err) => { });
  };


  const fetchRentalManagementData = async () => {
    try {
      let data;
      if (!isOffline) {
        const response: any = await axiosInstance().get(`${rentalManagement.api}/${rentalId}`);
        data = response?.data?.data;
      } else {
        data = await findOne(objectStore.rentalManagement, rentalId);
      }
      setLoading(false);
      setAllowedToEdit(checkIsAllowedToEdit(user, sidebarResource.rentalManagement, data));
      const isProcessor = [data.processor].some((d) => d?.optionValue === user?.user?._id);
      setIsProcessor(isProcessor);
      setRentalManagementData(data);
    } catch (error) {
      setLoading(false);
      toastConfig.setToastConfig(error);
    }
  };

  return (
    <>
      {!loading ? (
        <ReceivingTicket
          fetchRentalData={fetchRentalManagementData}
          rentalManagementData={rentalManagementData}
          currentStep={RENTAL_STEPS.onField}
          setNextStep={() => { }}
          setNextStepToolTip={() => { }}
          renderedFrom={`${renderedFrom}_grid-4`}
          allowedToEdit={allowedToEdit}
          isProcessor={isProcessor}
          stepFullScreen={false}
          allowUpdateStatus={allowUpdateStatus}
          rentalPolicyData={resourceData?.policy}
        />
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </>
  );
};

export default OnField;
