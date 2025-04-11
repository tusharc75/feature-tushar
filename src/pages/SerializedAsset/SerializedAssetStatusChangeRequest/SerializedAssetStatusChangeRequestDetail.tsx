import { Box } from '@mui/material';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import DetailsPage from '../../../components/Shared/DetailsPage';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useParams } from 'react-router-dom';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import { serializedAsset, sidebarResource } from 'src/constants/helpers';
import ShowDoa from 'src/pages/DoaSetupNew/ShowDoa';

const SerializedAssetStatusChangeRequestDetail = () => {
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();

  const {
    state: { user, resources }
  }: any = useData();

  const [fields, setFields] = useState(null);
  const [serializedAssetStatusChangeRequestData, setSerializedAssetStatusChangeRequestData] = useState(null);

  useEffect(() => {
    fetchGridColumns();
    fetchData();
  }, [id]);

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource.serializedAssetStatusChangeRequest}`)
      .then(({ data: { data } }) => {
        setFields([...data]);
      });
  };

  const fetchData = async () => {
    axiosInstance()
      .get(`${serializedAsset.api}/status-approval-process/${id}`)
      .then(({ data: { data } }) => {
        setSerializedAssetStatusChangeRequestData(data);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs
            routes={[
              { ...routes.serializedAssetStatusChangeRequest, title: resources?.serializedAssetStatusChangeRequest?.titleSingular },
              { title: serializedAssetStatusChangeRequestData?.asset?.optionLabel }
            ]}
          />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1"></Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        {serializedAssetStatusChangeRequestData && fields?.length ? (
          <div className="p-2">
            <ShowDoa status={serializedAssetStatusChangeRequestData?.doa_status} data={serializedAssetStatusChangeRequestData} />
            <DetailsPage data={serializedAssetStatusChangeRequestData} fields={fields} />
          </div>
        ) : (
          <>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </>
        )}
      </Box>
    </Box>
  );
};

export default SerializedAssetStatusChangeRequestDetail;
