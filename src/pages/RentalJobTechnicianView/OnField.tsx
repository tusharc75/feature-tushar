import { Box } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import {
  ASSET_STATUS,
  RENTAL_STEPS,
  rentalManagement,
  serializedAsset,
  sidebarResource
} from 'src/constants/helpers';
import { findOne, objectStore } from 'src/constants/indexdbhelper';
import { getMultipleResourcePolicy } from 'src/pages/DynamicForm/helper';
import ReceivingTicket from 'src/pages/RentalManagement/ReceivingTicket';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import { useData } from 'src/StateProvider/Provider';

const OnField = ({ rentalJob, referenceFrom }) => {

  const toastConfig = useContext(CustomToastContext);
  const { isOffline } = useContext(CustomOfflineContext);
  const renderedFrom = `${referenceFrom}_onField`;
  const {
    state: { user, permissions },
  }: any = useData();
  const [loading, setLoading] = useState(true);
  const [rentalManagementData, setRentalManagementData] = useState(null);
  const [allowUpdateStatus, setAllowUpdateStatus] = useState(false);
  const [rentalPolicyData, setRentalPolicyData] = useState(null);
  const [assetStatusOptions, setAssetStatusOptions] = useState([])
  const [assetPolicyData, setAssetPolicyData] = useState(null);
  const [isProcessor, setIsProcessor] = useState(false);
  const [fleetDispatchPolicyData, setFleetDispatchPolicyData] = useState(null);

  useEffect(() => {
    fetchPolicy();
    fetchAssetStatusRights();
  }, []);

  useEffect(() => {
    if (rentalJob) {
      fetchRentalManagementData();
    }
  }, [rentalJob]);

  const fetchPolicy = async () => {
    try {
      const data = await getMultipleResourcePolicy(user, permissions, `${sidebarResource.rentalManagement},${sidebarResource.serializedAsset},${sidebarResource.fleetDispatch}`)
      const rentalPolicy = data?.find((e) => e.resource === sidebarResource.rentalManagement)
      setRentalPolicyData(rentalPolicy);
      if (data?.find((e) => e.resource === sidebarResource.serializedAsset)) {
        setAssetPolicyData(data?.find((e) => e.resource === sidebarResource.serializedAsset));
      }
      if (data?.find((e) => e.resource === sidebarResource.fleetDispatch)) {
        setFleetDispatchPolicyData(data?.find((e) => e.resource === sidebarResource.fleetDispatch));
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchAssetStatusRights = () => {
    axiosInstance()
      .get(`/field?resource=${serializedAsset.resource}&view=true`)
      .then(({ data }) => {
        if (data.data && data.data.length) {
          data.data.some((o) => {
            if (o?.fieldData?.fieldName === 'status') {
              setAllowUpdateStatus(o?.isUpdate);
              let options = o?.fieldData?.option?.filter(_o => [ASSET_STATUS.available, ASSET_STATUS.scrap, ASSET_STATUS.needRecert, ASSET_STATUS.needRepair, ASSET_STATUS.lost]?.includes(_o?.optionValue))
              if (user?.user?.brandPolicy?.serializedAssetScrapApproval) {
                options = options?.filter(_o => _o?.optionValue != ASSET_STATUS.scrap)
              }
              setAssetStatusOptions([...options])
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
        const response: any = await axiosInstance().get(`${rentalManagement.api}/${rentalJob}`);
        data = response?.data?.data;
      } else {
        data = await findOne(objectStore.rentalManagement, rentalJob);
      }
      setLoading(false);
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
          currentStep={user?.user?.brandPolicy?.rentalOnFieldStep ? RENTAL_STEPS.onField : RENTAL_STEPS.receiving}
          setNextStep={() => { }}
          setNextStepToolTip={() => { }}
          renderedFrom={`${renderedFrom}`}
          allowedToEdit={true}
          isProcessor={isProcessor}
          stepFullScreen={false}
          allowUpdateStatus={allowUpdateStatus}
          rentalPolicyData={rentalPolicyData?.policy}
          assetStatusOptions={assetStatusOptions}
          setAssetStatusOptions={setAssetStatusOptions}
          assetPolicyData={assetPolicyData}
          fleetDispatchPolicyData={fleetDispatchPolicyData}
          resource={sidebarResource.rentalJobTechnicianView}
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
