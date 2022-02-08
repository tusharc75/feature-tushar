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
import { FaWpforms } from "react-icons/fa";
import { BiFoodMenu } from "react-icons/bi";
import { pricingCondition } from "../../constants/helpers";
import { startCase } from 'lodash';
import AddConditions from './AddConditionsNew';

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

function a11yProps(index: any) {
  return {
    id: `main-tab-${index}`,
    'aria-controls': `main-tabpanel-${index}`
  };
}

const PricingConditionsDetails = () => {

  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const history = useHistory();
  const { state: { user, permissions } }: any = useData();
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
    axiosInstance().get(`/field?resource=${startCase(pricingCondition.resource)}`).then(({ data: { data } }) => {
      setFields(data);
    }).catch((err) => {
      toastConfig.setToastConfig(err);
    });
  };

  const fetchDetails = () => {
    axiosInstance().get(`${pricingCondition.api}/${id}`).then(({ data: { data } }) => {
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
    axiosInstance().put(`${pricingCondition.api}/remove`, { ids: [id] }).then(() => {
      setShowConfirmBox(false);
      history.goBack();
    })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setShowConfirmBox(false);
      });
  };

  return (
    <>
      <Grid container className="headerbox">
        <CustomBreadCrumbs routes={customizedRoutes} />
      </Grid>
      <Grid container spacing={1} className="detail-container">
        <Grid item xs={12} sm={12} md={12} lg={12}>
          <Paper>
            {!detailData ? (
              <div>
                <Skeleton variant="text" width="150px" height="40px" />
                <Box display="flex">
                  <Skeleton style={{ borderRadius: 6 }} width="120px" height="80px" />
                  <Box marginX={1} />
                  <Skeleton style={{ borderRadius: 6 }} width="120px" height="80px" />
                </Box>
              </div>
            ) : (
              <DetailsPageHeader heading={headingLabel} mainPoints={mainPoints} showHeading={true}>
                {permissions?.pricingCondition?.isUpdate && (
                  <Button variant="contained" color="primary" size="small" onClick={() => setOpen(true)}>
                    Edit
                  </Button>
                )}
                {permissions?.pricingCondition?.isDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
              </DetailsPageHeader>
            )}
            <Box>
              {!fields.length ? (
                <Grid container spacing={2} style={{ padding: '8px' }}>
                  <CommonSkeleton lenArray={[...Array(7).keys()]} />
                </Grid>
              ) : (
                <>
                  <Tabs
                    className="quote-tab"
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
                      style={{
                        background: tabValue === 1 ? 'white' : '',
                        color: tabValue === 1 ? '#163340' : '#163340'
                      }}
                      label={
                        <div className="d-flex align-items-center tab-font">
                          <FaWpforms className="mr-1" fontSize="inherit" /> Header
                        </div>
                      }
                      {...a11yProps(0)}
                    />
                    <Tab
                      className={'tabLayout'}
                      style={{
                        background: tabValue === 2 ? 'white' : '',
                        color: tabValue === 2 ? 'blue' : '#163340'
                      }}
                      label={
                        <div className="d-flex align-items-center tab-font">
                          <BiFoodMenu className="mr-1" fontSize="inherit" /> Details
                        </div>
                      }
                      {...a11yProps(1)}
                    />
                    <div className={'uio'}> </div>
                  </Tabs>
                  <TabPanel value={tabValue} index={0}>
                    <DetailsPage data={detailData} fields={fields} />
                  </TabPanel>
                  <TabPanel value={tabValue} index={1}>
                    <AddConditions
                      pricingConditionId={id}
                      detailData={detailData}
                      />
                  </TabPanel>
                </>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
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
    </>
  );
};

export default PricingConditionsDetails;
