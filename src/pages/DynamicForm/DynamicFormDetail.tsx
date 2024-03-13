import { Box, Button, Grid, Tab, Tabs } from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';
import _, { camelCase, startCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { useHistory, useParams } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import { DeleteButton } from 'src/components/Helpers/Buttons';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import DetailsPage from '../../components/Shared/DetailsPage';
import ManageDynamicForm from './ManageDynamicForm';
import { FaWpforms } from 'react-icons/fa';
import { BiFoodMenu } from 'react-icons/bi';
import TabPanel from 'src/components/TabPanel';
import Step from './Step';
import { getResourceLabel } from 'src/constants/helpers';
import PreviewDownload from 'src/components/PreviewDownload';
import { useColumns } from 'src/components/CustomReactTable';

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
  const [columns, setColumns] = useState([]);
  const [steps, setSteps] = useState(null);

  const [primaryFieldName, setPrimaryFieldName] = useState(null);

  const [tabValue, setTabValue] = useState(0);
  const { generateColumns } = useColumns();


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
        const fields = data?.filter((field) => field.isRead);
        setFields(fields);
        const newColumns = generateColumns(`${renderedFrom}_${resource}`, fields);
        setColumns(newColumns);
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
      setDetailData(data);
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  useEffect(() => {
    fetchSteps();
  }, [resource]);

  const fetchSteps = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/dynamic-form/step/steps`, {
        headers: {
          Resource: resource
        }
      });
      setSteps(_.sortBy(data?.steps, 'order'));
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
            routes={[{ title: resourceLabel, path: `/${route}` },
            { title: primaryFieldName && detailData && detailData[primaryFieldName] ? detailData[primaryFieldName] : resourceLabel }]}
          />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            <PreviewDownload
              fileName={`${resource}`}
              resource={resource}
              referenceId={id}
              columns={columns}
              hideDetailButton={true}
            />
            {permissions[renderedFrom]?.isUpdate && (
              <Button variant={isMobile && !isTablet ? 'text' : 'contained'} className="btn-outline-v1" onClick={handleOpenUpdateDialog}>
                {isMobile && !isTablet ? <EditIcon /> : 'Edit'}
              </Button>
            )}
            {permissions[renderedFrom]?.isDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
          </Box>
        </Box>
      </Box>
      <Box className="detail-container-v1">
        <Tabs
          className="new-tab-container-v1"
          value={tabValue}
          onChange={handleMainTabChange}
          textColor="primary"
          TabIndicatorProps={{
            style: {
              height: 0
            }
          }}
        >
          <Tab
            className={'tabLayout'}
            label={
              <div className="d-flex align-items-center tab-font">
                <FaWpforms className="mr-1" fontSize="inherit" /> Header
              </div>
            }
            value={0}
            aria-controls="a11y-tabpanel-0"
            id="a11y-tab-0"
          />
          {steps && steps?.length && (
            <Tab
              className={'tabLayout'}
              label={
                <div className="d-flex align-items-center tab-font">
                  <BiFoodMenu className="mr-1" fontSize="inherit" /> Details
                </div>
              }
              value={1}
              aria-controls="a11y-tabpanel-1"
              id="a11y-tab-1"
            />
          )}
        </Tabs>
        <TabPanel value={tabValue} index={0}>
          {loading || !fields?.length ? (
            <Grid container spacing={2} style={{ padding: '8px' }}>
              <CommonSkeleton lenArray={[...Array(7).keys()]} />
            </Grid>
          ) : (
            <DetailsPage data={detailData} fields={fields} />
          )}
        </TabPanel>
        {steps && steps?.length && (
          <TabPanel value={tabValue} index={1}>
            <Step steps={steps} resourceId={id} resource={resource} data={detailData} allowedToEdit={permissions[renderedFrom]?.isUpdate} />
          </TabPanel>
        )}
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
        />
      )}
    </Box>
  );
};

export default DynamicFormDetail;
