import { Box, Button, Grid } from '@material-ui/core';
import { Edit } from '@material-ui/icons';
import { startCase } from 'lodash';
import React, { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { useHistory, useParams } from 'react-router-dom';
import ActivityButton from 'src/components/Activity/ActivityButton';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import { DeleteButton } from 'src/components/Helpers/Buttons';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import routes from '../../components/Helpers/Routes';
import DetailsPage from '../../components/Shared/DetailsPage';
import { ACTIVITY_RESOURCE, pricingCondition } from '../../constants/helpers';
import AddConditions from './AddConditions';
import PricingConditionsDialog from './PricingConditionsDialog';

const PricingConditionsDetails = () => {
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const history = useHistory();
  const {
    state: { user, permissions, resources }
  }: any = useData();
  const [headingLabel, setHeadingLabel] = useState('');
  const [detailData, setDetailData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [open, setOpen] = useState(false);
  const [fields, setFields] = useState([]);
  const [customizedRoutes, setCustomizedRoutes] = useState([]);
  const [tabValue, setTabValue] = useState(0);

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    if (id) {
      fetchDetails();
    }
  }, [id]);

  const getResourceFields = () => {
    axiosInstance()
      .get(`/field?resource=${startCase(pricingCondition.resource)}`)
      .then(({ data: { data } }) => {
        setFields(data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchDetails = () => {
    axiosInstance()
      .get(`${pricingCondition.api}/${id}`)
      .then(({ data: { data } }) => {
        setDetailData(data);
        setHeadingLabel(data.conditionName);
        setCustomizedRoutes([{ ...routes.pricingCondition, title: resources?.pricingCondition?.titleSingular }, { title: data.conditionName }]);
        getResourceFields();
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${pricingCondition.api}/remove`, { ids: [id] })
      .then(() => {
        setShowConfirmBox(false);
        history.push(`${routes.pricingCondition.path}`);
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
            <>
              {permissions?.pricingCondition?.isUpdate && (
                <Button
                  variant={isMobile && !isTablet ? 'text' : 'contained'}
                  className={'btn-outline-v1'}
                  size="small"
                  onClick={() => setOpen(true)}
                >
                  {isMobile && !isTablet ? <Edit /> : 'Edit'}
                </Button>
              )}
              {permissions?.pricingCondition?.isDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
            </>
            <ActivityButton referenceId={detailData?._id} resource={ACTIVITY_RESOURCE.pricingCondition} resourceLabel={detailData?.conditionName} />
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        {!fields.length ? (
          <Grid container spacing={2} style={{ padding: '8px' }}>
            <CommonSkeleton lenArray={[...Array(7).keys()]} />
          </Grid>
        ) : (
          <>
            <CustomTabs value={tabValue} onChange={handleMainTabChange}>
              <CustomTab value={0}>Header</CustomTab>
              <CustomTab value={1}>Details</CustomTab>
            </CustomTabs>
            <TabPanel value={tabValue} index={0}>
              <DetailsPage data={detailData} fields={fields} />
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              <AddConditions pricingConditionId={id} detailData={detailData} />
            </TabPanel>
          </>
        )}
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this : ${headingLabel} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {open && (
        <PricingConditionsDialog
          pricingConditionId={id}
          isClone={false}
          onClose={() => {
            setOpen(false);
          }}
          onSuccess={() => {
            fetchDetails();
            setOpen(false);
          }}
        />
      )}
    </Box>
  );
};

export default PricingConditionsDetails;
