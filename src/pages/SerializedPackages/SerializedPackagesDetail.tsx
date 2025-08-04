import { Box } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useContext, useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import routes from 'src/components/Helpers/Routes';
import { ACTIVITY_RESOURCE, sidebarResource } from 'src/constants/helpers';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import DetailsPage from '../../components/Shared/DetailsPage';
import { isMobile, isTablet } from 'react-device-detect';
import EditIcon from '@mui/icons-material/Edit';
import { DeleteButton, ThemeButton } from 'src/components/Helpers/Buttons';
import Assign from './Assign';
import ActivityButton from 'src/components/Activity/ActivityButton';
import History from 'src/pages/SerializedPackages/History';
import ManageSerializedPackages from 'src/pages/SerializedPackages/ManageSerializedPackages';
import SerializedPackagesView from 'src/pages/SerializedPackages/View';
import { fetch_resource_view_fields } from 'src/components/ResourceFields';

const SerializedPackagesDetail = () => {
  const { id } = useParams();
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([routes.serializedPackages]);
  const [serializedPackagesData, setSerializedPackagesData] = useState(null);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [fields, setFields] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const {
    state: { permissions, resources }
  }: any = useData();

  useEffect(() => {
    if (id) {
      fetchFields();
      fetchData();
    }
  }, [id]);

  const fetchFields = async () => {
    const { fieldsDataForRead } = await fetch_resource_view_fields(sidebarResource?.serializedPackages, permissions?.serializedPackages?.isUpdate);
    fieldsDataForRead.forEach((element) => {
      if (element?.fieldData?.fieldName === 'currentOwner') {
        element.fieldData.type = 'singleLine';
      }
    });
    setFields(fieldsDataForRead);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`${routes.serializedPackages.path}/${id}`);
      setSerializedPackagesData({ ...data, currentOwner: data?.currentOwner?.optionLabel });
      setCustomizedRoutes([
        { ...routes.serializedPackages, title: resources?.serializedPackages?.titlePlural },
        { title: data?.serializedPackageNumber }
      ]);
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleDelete = () => {
    if (id) {
      if (permissions?.serializedPackages?.isDelete) {
        axiosInstance()
          .put(`${routes.serializedPackages.path}/remove`, { ids: [id] })
          .then(({ data }) => {
            setShowConfirmBox(false);
            toastConfig.setToastConfig({
              open: true,
              type: 'success',
              message: data?.message
            });
            history.push(`${routes.serializedPackages.path}`);
          })
          .catch((err) => {
            setShowConfirmBox(false);
          });
      }
    } else {
      setShowConfirmBox(false);
    }
  };

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const closeUpdateDialog = () => {
    setOpenUpdateDialog(false);
  };

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            <>
              {permissions?.serializedPackages?.isUpdate && (
                <ThemeButton iconForMobile={<EditIcon />} onClick={handleOpenUpdateDialog} mobileTooltip={'Edit'}>
                  {'Edit'}
                </ThemeButton>
              )}
              {permissions?.serializedPackages?.isDelete && serializedPackagesData?.canDelete && (
                <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />
              )}
              <ActivityButton
                referenceId={serializedPackagesData?._id}
                resource={ACTIVITY_RESOURCE.serializedPackages}
                resourceLabel={serializedPackagesData?.serializedPackageNumber}
                resourceData={serializedPackagesData}
              />
            </>
          </Box>
        </Box>
      </Box>
      <Box className="detail-container-v1">
        <CustomTabs value={tabValue} onChange={handleMainTabChange}>
          <CustomTab value={0} label={'Details'} />
          <CustomTab value={1} label={'Products'} />
          <CustomTab value={2} label={'History'} />
          {!(isMobile && !isTablet) && <CustomTab value={3} label={'Views'} />}
        </CustomTabs>
        <TabPanel value={tabValue} index={0}>
          <Box>
            {loading || !fields?.length ? (
              <div className="p-2">
                <CommonSkeleton lenArray={[...Array(10).keys()]} />
              </div>
            ) : (
              <DetailsPage
                data={serializedPackagesData}
                fields={fields}
                resource={sidebarResource?.serializedPackages}
                referenceId={serializedPackagesData?._id}
              />
            )}
          </Box>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <Assign serializedPackagesData={serializedPackagesData} fetchSerializedPackagesData={fetchData} />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <History id={serializedPackagesData?._id} />
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          {serializedPackagesData && <SerializedPackagesView serializedPackagesData={serializedPackagesData} />}
        </TabPanel>
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${resources?.serializedPackages?.titleSingular?.toLowerCase()} : ${serializedPackagesData?.serializedPackageNumber} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog && (
        <ManageSerializedPackages
          id={id}
          isClone={false}
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

export default SerializedPackagesDetail;
