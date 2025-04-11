import { Box } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import { DOA_STATUS, sidebarResource } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import { useParams, useHistory } from 'react-router-dom';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import DetailsPage from '../../components/Shared/DetailsPage';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';

const ResourceDoaRequestDetail = () => {
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const history = useHistory();

  const resource = history.location?.state?.resource;
  const {
    state: { user, resources }
  }: any = useData();

  const [doaData, setDoaData] = useState(null);
  const [fields, setFields] = useState(null);
  const [title, setTitle] = useState('');

  useEffect(() => {
    fetchGridColumns();
    fetchData();
  }, [id, resource]);

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=${resource}`)
      .then(({ data: { data } }) => {
        setFields([...data]);
      });
  };

  const fetchData = async () => {
    const doaResponse: any = await axiosInstance().get(`${routes.resourceDoaRequest.path}/detail/${id}?resource=${resource}`);
    if (doaResponse?.data?.data) {
      const _data = doaResponse?.data?.data;
      const title = resource === sidebarResource.serializedAssetStatusChangeRequest
        ? _data?.serializedAssetStatusChangeRequest?.asset?.optionLabel : resource === sidebarResource?.purchaseRequisition
          ? _data?.purchaseRequisition?.optionLabel
          : '';
      setTitle(title);
      const resourceData =
        resource === sidebarResource.serializedAssetStatusChangeRequest
          ? _data?.serializedAssetStatusChangeRequest
          : resource === sidebarResource?.purchaseRequisition
            ? _data?.purchaseRequisition
            : {};
      setDoaData({
        ...resourceData,
        _id: _data?._id,
        resource: _data?.resource,
        doaStatus: _data?.status,
        userDOAstatus: _data?.doaUsers?.find((u) => u?.users?.map((d) => d?._id)?.includes(user?.user?._id))?.status,
        canPerform: _data?.doaUsers?.find((u) => u?.users?.map((d) => d?._id)?.includes(user?.user?._id))?.isUpdate ? true : false,
        referenceId: _data?.referenceId,
        entity: _data?.entity
      });
    }
  };

  const handleApproveReject = (status) => {
    axiosInstance().put(`${routes.resourceDoaRequest.path}`, {
      _id: doaData._id,
      status: status,
      entity: doaData?.entity,
      referenceId: doaData?.referenceId,
      resource: doaData?.resource
    }).then(({ data }) => {
      toastConfig.setToastConfig({
        message: data.message,
        open: true,
        type: 'success'
      });
      fetchData();
    }).catch((error) => {
      toastConfig.setToastConfig(error);
    });
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[{ ...routes.resourceDoaRequest, title: resources?.resourceDoaRequest?.titleSingular }, { title: title }]} />
        </Box>
        <Box className="controls-v1">
          {doaData?.userDOAstatus === DOA_STATUS.pending &&
            <Box className="control-buttons-v1">
              <ThemeButton
                onClick={() => {
                  handleApproveReject(DOA_STATUS.approved);
                }}
                disabled={!doaData?.canPerform}
                startIcon={<ThumbUpIcon />}
                buttonType='themeBorder'
              >
                {'Accept'}
              </ThemeButton>
              <ThemeButton
                onClick={() => {
                  handleApproveReject(DOA_STATUS.rejected);
                }}
                disabled={!doaData?.canPerform}
                startIcon={<ThumbDownIcon />}
                buttonType='red'
              >
                {'Reject'}
              </ThemeButton>
            </Box>}
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        {doaData && fields?.length ? (
          <div className="p-2">
            <DetailsPage data={doaData} fields={fields} />
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

export default ResourceDoaRequestDetail;
