import { Box, Menu, MenuItem } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { useContext, useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import { DeleteButton, ThemeButton } from 'src/components/Helpers/Buttons';
import routes from 'src/components/Helpers/Routes';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import DetailsPage from 'src/components/Shared/DetailsPage';
import ManageContentPostPlanning from './ManageContentPostPlanning';
import { fetch_resource_view_fields } from 'src/components/ResourceFields';
import { ACTIVITY_RESOURCE, CONTENT_POST_PLANNING_STATUS, sidebarResource } from 'src/constants/helpers';
import ActivityButton from 'src/components/Activity/ActivityButton';
import { ExpandMore } from '@mui/icons-material';
import { RiExchange2Line } from 'react-icons/ri';

const ContentPostPlanningDetail = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const [postData, setPostData] = useState<any>(null);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [fields, setFields] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [statusOptions, setStatusOptions] = useState([]);

  const {
    state: { user, permissions, resources }
  }: any = useData();
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([
    { ...routes.contentPostPlanning, title: resources?.contentPostPlanning?.titlePlural }
  ]);

  useEffect(() => {
    if (id) {
      fetchFields();
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchFields = async () => {
    try {
      const { fieldsDataForRead } = await fetch_resource_view_fields(
        sidebarResource?.contentPostPlanning,
        permissions?.contentPostPlanning?.isUpdate
      );
      fieldsDataForRead?.some((o) => {
        if (o?.fieldData?.fieldName === 'status') {
          setStatusOptions([...o.fieldData.option?.filter((e) => e.optionValue)]);
          return true;
        }
      });
      setFields(fieldsDataForRead);
    } catch (err) {
      toastConfig.setToastConfig(err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`${routes.contentPostPlanning.path}/${id}`);
      setPostData(data);
      setCustomizedRoutes([{ ...routes.contentPostPlanning, title: resources?.contentPostPlanning?.titlePlural }, { title: data?.title }]);
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      toastConfig.setToastConfig(error);
    }
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };
  const validateStatus = (status) => {
    if (!postData?.status || !statusOptions?.length) return true;

    const nextAllowedStatus =
      postData.status === CONTENT_POST_PLANNING_STATUS.pendingApproval
        ? CONTENT_POST_PLANNING_STATUS.scheduled
        : CONTENT_POST_PLANNING_STATUS.published;

    return nextAllowedStatus !== status;
  };

  const handleChangeStatus = (status) => {
    const ids = [id]
    axiosInstance()
      .put('content-post-planning/update-status', { _id: ids, status: status })
      .then(({ data: { data } }) => {
        fetchData();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: `Status changed to ${status}`
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleDelete = () => {
    if (id) {
      axiosInstance()
        .put(`${routes?.contentPostPlanning?.path}/remove`, { ids: [id] })
        .then(({ data }) => {
          setShowConfirmBox(false);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data?.message
          });
          history.push(`${routes.contentPostPlanning.path}`);
        })
        .catch((err) => {
          setShowConfirmBox(false);
          toastConfig.setToastConfig(err);
        });
    } else {
      setShowConfirmBox(false);
    }
  };

  const handleOpenUpdateDialog = () => setOpenUpdateDialog(true);
  const closeUpdateDialog = () => setOpenUpdateDialog(false);

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            <>
              {permissions?.contentPostPlanning?.isUpdate && postData?.status !== CONTENT_POST_PLANNING_STATUS.published && (
                <ThemeButton
                  onClick={() => handleChangeStatus(postData?.status === CONTENT_POST_PLANNING_STATUS.pendingApproval ? CONTENT_POST_PLANNING_STATUS.scheduled : CONTENT_POST_PLANNING_STATUS.published)}
                  mobileTooltip={postData?.status === CONTENT_POST_PLANNING_STATUS.pendingApproval ? 'Approve' : 'Publish'}
                  iconForMobile={<RiExchange2Line size={24} style={{ color: 'var(--primary-text)' }} />}
                  disabled={!(postData?.owner?.optionValue === user?.user?._id || postData?.collaborators.some(c => c.optionValue === user?.user?._id))}
                >
                  {postData?.status === CONTENT_POST_PLANNING_STATUS.pendingApproval ? 'Approve' : 'Published'}
                </ThemeButton>
              )}
              {permissions?.contentPostPlanning?.isUpdate && postData?.status !== CONTENT_POST_PLANNING_STATUS.published && (
                <ThemeButton iconForMobile={<EditIcon />} onClick={handleOpenUpdateDialog} mobileTooltip={'Edit'}>
                  {'Edit'}
                </ThemeButton>
              )}
              {permissions?.contentPostPlanning?.isDelete && postData?.status !== CONTENT_POST_PLANNING_STATUS.published && (
                <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />
              )}
              <ActivityButton
                referenceId={id}
                resource={ACTIVITY_RESOURCE.contentPostPlanning}
                resourceLabel={postData?.title}
                resourceData={postData}
              />
            </>
          </Box>
        </Box>
      </Box>

      <Box className="detail-container-v1">
        <Box>
          {loading || !fields?.length ? (
            <div className="p-2">
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </div>
          ) : (
            <DetailsPage data={postData} fields={fields} />
          )}
        </Box>
      </Box>

      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${resources?.contentPostPlanning?.titleSingular?.toLowerCase()} : ${postData?.title} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}

      {openUpdateDialog && (
        <ManageContentPostPlanning
          open={openUpdateDialog}
          isEdit={true}
          idToEdit={id}
          onClose={closeUpdateDialog}
          onSuccess={() => {
            closeUpdateDialog();
            fetchData();
          }}
        />
      )}
    </Box>
  );
};

export default ContentPostPlanningDetail;
