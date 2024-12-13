import { Box, Button, Grid } from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';
import { camelCase, startCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { useHistory, useParams } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import ActivityButton from 'src/components/Activity/ActivityButton';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import { DeleteButton } from 'src/components/Helpers/Buttons';
import PreviewDownload from 'src/components/PreviewDownload';
import { checkIsAllowedToEdit, getResourceLabel } from 'src/constants/helpers';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import DetailsPage from '../../components/Shared/DetailsPage';
import ManageDynamicForm from './ManageDynamicForm';
import Step from './Step';

const DynamicFormDetail = () => {
  const { route, id } = useParams();

  const {
    state: { permissions, user }
  }: any = useData();

  const resource = startCase(route?.replace(/-/g, ' '));
  const renderedFrom = camelCase(resource);
  const resourceLabel = getResourceLabel(resource, user);

  const resourcePath = `/${route}`;

  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const [detailData, setDetailData] = useState(null);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [fields, setFields] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [resourceData, setResourceData] = useState(null);
  const [primaryFieldName, setPrimaryFieldName] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [allowedToDelete, setAllowedToDelete] = useState(false);

  useEffect(() => {
    if (id) {
      fetchFields();
      fetchData();
    }
  }, [id]);

  const fetchFields = async () => {
    axiosInstance()
      .get(`/field?resource=${resource}`)
      .then(({ data: { data } }) => {
        setFields(data?.filter((field) => field.isRead));
        const primaryField = data?.find((e) => e?.fieldData?.primaryField);
        if (primaryField) {
          setPrimaryFieldName(primaryField?.fieldData?.fieldName);
        }
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/dynamic-form/${id}`, {
        headers: {
          Resource: resource
        }
      });
      let isAllowedToEdit = true;
      let isAllowedToDelete = true;
      if (data.hasOwnProperty('collaborator') || data.hasOwnProperty('owner')) {
        isAllowedToEdit = checkIsAllowedToEdit(user, resource, data);
        isAllowedToDelete = data.owner.optionValue === user?.user?._id;
      }
      setAllowedToEdit(isAllowedToEdit);
      setAllowedToDelete(isAllowedToDelete);
      setDetailData(data);
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  useEffect(() => {
    fetchPolicy();
  }, [resource]);

  const fetchPolicy = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/dynamic-form/policy?resource=${resource}`);
      if (data) {
        setResourceData(data);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleDelete = () => {
    if (id) {
      axiosInstance()
        .put(
          `/dynamic-form/remove`,
          { ids: [id] },
          {
            headers: {
              Resource: resource
            }
          }
        )
        .then(({ data }) => {
          setShowConfirmBox(false);

          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data?.message
          });
          history.goBack();
        })
        .catch((err) => {
          setShowConfirmBox(false);
        });
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
          <CustomBreadCrumbs
            routes={[
              { title: resourceLabel?.titlePlural, path: `/${route}` },
              { title: primaryFieldName && detailData && detailData[primaryFieldName] ? detailData[primaryFieldName] : resourceLabel?.titleSingular }
            ]}
          />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {detailData?.pdfTemplate && (
              <PreviewDownload fileName={`${resource}`} resource={resource} referenceId={id} columns={[]} hideDetailButton={true} hideDialog={true} />
            )}
            {permissions[renderedFrom]?.isUpdate && allowedToEdit && (
              <Button variant={isMobile && !isTablet ? 'text' : 'contained'} className="btn-outline-v1" onClick={handleOpenUpdateDialog}>
                {isMobile && !isTablet ? <EditIcon /> : 'Edit'}
              </Button>
            )}
            {permissions[renderedFrom]?.isDelete && allowedToDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
            {resourceData?.collaborateTools && detailData && (
              <ActivityButton
                referenceId={detailData?._id}
                resource={camelCase(resource)}
                resourceLabel={detailData[resourceData?.collaborateToolsField]}
              />
            )}
          </Box>
        </Box>
      </Box>
      <Box className="detail-container-v1">
        <CustomTabs value={tabValue} onChange={handleMainTabChange}>
          <CustomTab value={0}>Header</CustomTab>
          {resourceData && resourceData?.tabs?.length > 0 && resourceData?.tabs?.map((tab, i) => <CustomTab value={i + 1}>{tab?.tabName}</CustomTab>)}
        </CustomTabs>
        <TabPanel value={tabValue} index={0}>
          {loading || !fields?.length ? (
            <Grid container spacing={2} style={{ padding: '8px' }}>
              <CommonSkeleton lenArray={[...Array(7).keys()]} />
            </Grid>
          ) : (
            <DetailsPage
              data={detailData}
              fields={fields}
              resource={resourceData?.collaborateTools ? resource : null}
              referenceId={resourceData?.collaborateTools ? id : null}
            />
          )}
        </TabPanel>
        {resourceData &&
          resourceData?.tabs?.length > 0 &&
          resourceData?.tabs?.map((tab, i) => {
            return (
              <TabPanel value={tabValue} index={i + 1}>
                <Step
                  tab={tab}
                  resourcePolicyId={resourceData?._id}
                  resourceId={id}
                  resource={resource}
                  data={detailData}
                  allowedToEdit={permissions[renderedFrom]?.isUpdate ? allowedToEdit : false}
                />
              </TabPanel>
            );
          })}
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${detailData[primaryFieldName] || resource?.toLowerCase()}  ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog && (
        <ManageDynamicForm
          resource={resource}
          resourcePath={resourcePath}
          id={id}
          isClone={false}
          onClose={closeUpdateDialog}
          onSuccess={() => {
            closeUpdateDialog();
            fetchData();
          }}
          collaborateTools={resourceData?.collaborateTools}
        />
      )}
    </Box>
  );
};

export default DynamicFormDetail;
