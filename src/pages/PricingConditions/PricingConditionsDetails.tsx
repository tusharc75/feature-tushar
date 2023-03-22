import React, { useState, useEffect, useContext, Fragment, useReducer } from 'react';
import { Grid, Box, Button, Paper, Tabs, Tab } from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
import { useParams, useHistory } from 'react-router-dom';
import axiosInstance from '../../axios/axiosInstance';
import routes from '../../components/Helpers/Routes';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import DetailsPageHeader from '../../components/DetailsPageHeader';
import DetailsPage from '../../components/Shared/DetailsPage';
import { useData } from '../../StateProvider/Provider';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import PricingConditionsDialog from './PricingConditionsDialog';
import DeleteButton from '../../components/Helpers/DeleteButton';
import { FaWpforms } from 'react-icons/fa';
import { BiFoodMenu } from 'react-icons/bi';
import { ACTIVITY_RESOURCE, pricingCondition } from '../../constants/helpers';
import { startCase } from 'lodash';
import AddConditions from './AddConditions';
import ActivityButton from 'src/components/Activity/ActivityButton';

interface TabPanelProps {
  children?: React.ReactNode;
  index: any;
  value: any;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div role="tabpanel" hidden={value !== index} id={`main-tabpanel-${index}`} aria-labelledby={`main-tab-${index}`} {...other}>
      {children}
    </div>
  );
}

const PricingConditionsDetails = () => {
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const history = useHistory();
  const {
    state: { user, permissions }
  }: any = useData();
  const [headingLabel, setHeadingLabel] = useState('');
  const [detailData, setDetailData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [open, setOpen] = useState(false);
  const [fields, setFields] = useState([]);
  const [mainPoints, setMainPoints] = useState(null);
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
        setCustomizedRoutes([routes.pricingCondition, { title: data.conditionName }]);
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
        history.goBack();
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
                  <Button variant="contained" className={'btn-outline-v1'} size="small" onClick={() => setOpen(true)}>
                    Edit
                  </Button>
                )}
                {permissions?.pricingCondition?.isDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
              </>
              <ActivityButton referenceId={detailData?._id} resource={ACTIVITY_RESOURCE.pricingCondition} />
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
              <Tabs
               className="new-tab-container-v1"
                value={tabValue}
                onChange={handleMainTabChange}
                textColor="primary"
                TabIndicatorProps={{
                  style: {
                    display: 'none'
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
          
                />
                <Tab
                  className={'tabLayout'}
                  label={
                    <div className="d-flex align-items-center tab-font">
                      <BiFoodMenu className="mr-1" fontSize="inherit" /> Details
                    </div>
                  }
             
                />
              </Tabs>
              <TabPanel value={tabValue} index={0}>
                <DetailsPage data={detailData} fields={fields} />
              </TabPanel>
              <TabPanel value={tabValue} index={1}>
                <AddConditions pricingConditionId={id} detailData={detailData} />
              </TabPanel>
            </>
          )}
        </Box>
      {
        showConfirmBox && (
          <ConfirmationDialog
            open={showConfirmBox}
            message={`Are you sure you want to delete this : ${headingLabel} ?`}
            onClose={() => {
              setShowConfirmBox(false);
            }}
            onOk={handleDelete}
          />
        )
      }
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
      )
      }
    </Box>
  );
};

export default PricingConditionsDetails;
