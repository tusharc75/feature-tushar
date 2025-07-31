import { Box } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import {
  ASSET_STATUS,
  RENTAL_STEPS,
  rentalJobTechnicianView,
  serializedAsset,
  sidebarResource
} from 'src/constants/helpers';
import { findOne, objectStore } from 'src/constants/indexdbhelper';
import ReceivingTicket from 'src/pages/RentalManagement/ReceivingTicket';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import { useData } from 'src/StateProvider/Provider';

const OnField = ({ rentalJob, referenceFrom, referenceData }) => {

  const toastConfig = useContext(CustomToastContext);
  const { isOffline } = useContext(CustomOfflineContext);
  const renderedFrom = `${referenceFrom}_onField`;
  const {
    state: { user },
  }: any = useData();
  const [loading, setLoading] = useState(true);
  const [rentalManagementData, setRentalManagementData] = useState(null);
  const [allowUpdateStatus, setAllowUpdateStatus] = useState(false);
  const [resourceData, setResourceData] = useState(null);
  const [assetStatusOptions, setAssetStatusOptions] = useState([])
  const [assetPolicyData, setAssetPolicyData] = useState(null);
  const [isProcessor, setIsProcessor] = useState(false);

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
      const {
        data: { data }
      } = await axiosInstance().get(`/dynamic-form/multiple-resource-policy?resources=${sidebarResource.rentalManagement},${sidebarResource.serializedAsset}`);
      if (data?.find((e) => e.resource === sidebarResource.rentalManagement)) {
        setResourceData(data?.find((e) => e.resource === sidebarResource.rentalManagement));
      }
      if (data?.find((e) => e.resource === sidebarResource.serializedAsset)) {
        setAssetPolicyData(data?.find((e) => e.resource === sidebarResource.serializedAsset));
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
        const response: any = await axiosInstance().get(`${rentalJobTechnicianView.api}/${rentalJob}`);
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
          rentalPolicyData={resourceData?.policy}
          assetStatusOptions={assetStatusOptions}
          setAssetStatusOptions={setAssetStatusOptions}
          assetPolicyData={assetPolicyData}
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
