import { Box, Button, Grid } from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
import { camelCase } from 'lodash';
import React, { useContext, useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { Edit } from '@material-ui/icons';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import ActivityButton from 'src/components/Activity/ActivityButton';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { DeleteButton } from 'src/components/Helpers/Buttons';
import routes from 'src/components/Helpers/Routes';
import DetailsPage from 'src/components/Shared/DetailsPage';
import { ACTIVITY_RESOURCE, MATERIAL_TYPE, packages } from 'src/constants/helpers';
import ManagePackageDialog from './ManagePackageDialog';
import Packages from './Packages';
import Products from './Products';
import Services from './Services';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import LeadTime from 'src/components/LeadTime';

const PackageDetails = () => {
  const toastConfig = useContext(CustomToastContext);

  const { id } = useParams();
  const history = useHistory();
  const {
    state: { permissions, resources }
  }: any = useData();
  const [headingLabel, setHeadingLabel] = useState('');
  const [packagesLoading, setPackagesLoading] = useState(false);

  const [packageData, setPackageData] = useState(null);

  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [packageFields, setPackageFields] = useState([]);
  const [mainPoints, setMainPoints] = useState(null);
  const [customizedRoutes, setCustomizedRoutes] = useState([]);

  const [tabValue, setTabValue] = useState(0);

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
    newValue === 1 && fetchPackage();
  };

  useEffect(() => {
    if (id) {
      fetchPackage();
    }
  }, [id]);

  const fetchFields = () => {
    setPackagesLoading(true);
    axiosInstance()
      .get('/field?resource=Packages')
      .then(({ data: { data } }) => {
        setPackageFields(data);
        setPackagesLoading(false);
      })
      .catch((err) => {
        setPackagesLoading(false);
        toastConfig.setToastConfig(err);
      });
  };

  const fetchPackage = () => {
    setPackagesLoading(true);
    axiosInstance()
      .get(`${packages.api}/${id}`)
      .then(({ data: { data } }) => {
        setPackageData(data);
        setHeadingLabel(data.packageName);
        setCustomizedRoutes([{ ...routes?.packages, title: resources?.packages?.titleSingular }, { title: data.packageName }]);
        fetchFields();
      })
      .catch((err) => {
        setPackagesLoading(false);
        toastConfig.setToastConfig(err);
      });
  };

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${packages.api}/remove`, { ids: [id] })
      .then(() => {
        setShowConfirmBox(false);
        history.push(`${routes.packages.path}`);
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
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {packageData ? (
              <>
                {permissions?.packages?.isUpdate && (
                  <Button
                    variant={isMobile && !isTablet ? 'text' : 'contained'}
                    className={'btn-outline-v1'}
                    size="small"
                    onClick={handleOpenUpdateDialog}
                  >
                    {isMobile && !isTablet ? <Edit /> : 'Edit'}
                  </Button>
                )}
                {permissions?.packages?.isDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
              </>
            ) : (
              <Skeleton variant="text" width="150px" height="32px" />
            )}
            <ActivityButton referenceId={packageData?._id} resource={ACTIVITY_RESOURCE.packages} resourceLabel={packageData?.packageName} />
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <CustomTabs value={tabValue} onChange={handleMainTabChange}>
          <CustomTab value={0}>Header</CustomTab>
          <CustomTab value={1}>Individual Services</CustomTab>
          <CustomTab value={2}>Individual Products</CustomTab>
          <CustomTab value={3}>Sub Packages</CustomTab>
        </CustomTabs>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={12} md={12}>
            <TabPanel value={tabValue} index={0}>
              <DetailsPage data={packageData} fields={packageFields} />
              <Box mb={2} mt={2}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={6}>
                    <LeadTime referenceType={MATERIAL_TYPE.package} referenceId={id} referenceLabel={packageData?.packageName} />
                  </Grid>
                </Grid>
              </Box>
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              {tabValue === 1 && <Services packageData={packageData} packageId={id} allowedToEdit={permissions?.packages?.isUpdate} />}
            </TabPanel>
            <TabPanel value={tabValue} index={2}>
              {tabValue === 2 && <Products packageData={packageData} packageId={id} allowedToEdit={permissions?.packages?.isUpdate} />}
            </TabPanel>
            <TabPanel value={tabValue} index={3}>
              {tabValue === 3 && <Packages packageData={packageData} packageId={id} allowedToEdit={permissions?.packages?.isUpdate} />}
            </TabPanel>
          </Grid>
        </Grid>
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this ${resources?.packages?.titleSingular}: ${headingLabel} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog && (
        <ManagePackageDialog
          open={openUpdateDialog}
          isClone={false}
          packageId={id}
          onClose={() => {
            setOpenUpdateDialog(false);
          }}
          onSuccess={() => {
            fetchPackage();
            setOpenUpdateDialog(false);
          }}
        />
      )}
    </Box>
  );
};

export default PackageDetails;
