import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { Edit } from '@mui/icons-material';
import queryString from 'query-string';
import React, { Fragment, useContext, useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { DeleteButton, ThemeButton } from 'src/components/Helpers/Buttons';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import routes from '../../components/Helpers/Routes';
import DetailsPage from '../../components/Shared/DetailsPage';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import { ACTIVITY_RESOURCE, costBooks, sidebarResource } from '../../constants/helpers';
import { getResourcePolicy } from 'src/pages/DynamicForm/helper';
import { fetch_resource_view_fields } from 'src/components/ResourceFields';
import ActivityButton from 'src/components/Activity/ActivityButton';
import ManageCostBooks from 'src/pages/CostBooks/ManageCostBooks';

const CostBooksDetail = () => {
  const toastConfig = useContext(CustomToastContext);

  const { id } = useParams();
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { tab }: any = parsed;

  const {
    state: { user, permissions, resources }
  }: any = useData();
  const [costBookData, setCostBookData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);
  const [locationKeys, setLocationKeys] = useState([]);
  const [allowedToDelete, setAllowedToDelete] = useState(false);
  const [resourcePolicyData, setResourcePolicyData] = useState(null);
  const [fields, setFields] = useState(null);

  useEffect(() => {
    return history.listen((location) => {
      const { tab }: any = queryString.parse(history.location.search);
      if (history.action === 'PUSH') {
        setLocationKeys([location.key]);
      }
      if (history.action === 'POP') {
        if (locationKeys[1] === location.key) {
          setLocationKeys(([_, ...keys]) => keys);
          setTabValue(tab ? parseInt(tab) : 0);
        } else {
          setLocationKeys((keys) => [location.key, ...keys]);
          setTabValue(tab ? parseInt(tab) : 0);
        }
      }
    });
  }, [locationKeys]);

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
    history.push(`?tab=${newValue}`);
  };

  useEffect(() => {
    if (id) {
      fetchFields();
      fetchData();
      fetchPolicy();
    }
  }, [id]);

  const fetchFields = async () => {
    const { fieldsDataForRead } = await fetch_resource_view_fields(sidebarResource.costBooks, permissions?.costBooks?.isUpdate);
    setFields(fieldsDataForRead);
  };

  const fetchData = async () => {
    axiosInstance()
      .get(`${costBooks.api}/${id}`)
      .then(({ data: { data } }) => {
        setAllowedToEdit(permissions?.costBooks?.isUpdate);
        setAllowedToDelete(permissions?.costBooks?.isDelete);
        setCostBookData(data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchPolicy = async () => {
    const data = await getResourcePolicy(user, permissions, sidebarResource.costBooks);
    setResourcePolicyData(data);
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${costBooks.api}/remove`, { ids: [costBookData._id] })
      .then(() => {
        setShowConfirmBox(false);
        history.push(`${routes?.costBooks?.path}`);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setShowConfirmBox(false);
      });
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs
            routes={[
              { ...routes?.costBooks, title: resources?.costBooks?.titlePlural },
              { title: `${costBookData ? costBookData?.costBookName : ''}` }
            ]}
          />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            <Fragment>
              <ThemeButton
                iconForMobile={<Edit />}
                disabled={!allowedToEdit}
                onClick={() => {
                  setOpenUpdateDialog(true);
                }}
                mobileTooltip={'Edit'}
              >
                Edit
              </ThemeButton>
            </Fragment>
            {allowedToDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
            <ActivityButton
              referenceId={null}
              resource={ACTIVITY_RESOURCE.costBooks}
              resourceLabel={resources?.costBooks?.titlePlural}
              resourceData={null}
            />
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <CustomTabs value={tabValue} onChange={handleMainTabChange}>
          <CustomTab value={0}>Header</CustomTab>
          {resourcePolicyData &&
            resourcePolicyData?.tabs?.length > 0 &&
            resourcePolicyData?.tabs?.map((tab, i) => <CustomTab value={i + 1}>{tab?.tabName}</CustomTab>)}
        </CustomTabs>
        <TabPanel value={tabValue} index={0}>
          <Box>
            {costBookData && fields ? (
              <DetailsPage
                data={costBookData}
                fields={fields}
                resource={sidebarResource?.costBooks}
                referenceId={costBookData?._id}
              />
            ) : (
              <div className="p-2">
                <CommonSkeleton lenArray={[...Array(10).keys()]} />
              </div>
            )}
          </Box>
        </TabPanel>
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${resources?.costBooks?.titleSingular?.toLowerCase()} : ${costBookData?.costBookName} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog && (
        <ManageCostBooks
          isClone={false}
          costBookId={id}
          onClose={() => setOpenUpdateDialog(false)}
          onSuccess={() => {
            setOpenUpdateDialog(false);
            fetchData();
          }}
        />
      )}
    </Box>
  );
};

export default CostBooksDetail;
