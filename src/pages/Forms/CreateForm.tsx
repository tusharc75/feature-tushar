import { Box, Tab, Tabs } from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { BiFoodMenu } from 'react-icons/bi';
import { FaWpforms } from 'react-icons/fa';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import TabPanel from 'src/components/TabPanel';
import Information from './Information';
import Fields from './Fields';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const CreateForm = () => {
  const toastConfig = useContext(CustomToastContext);

  const { id } = useParams();

  const [formsData, setFormsData] = useState(null);
  const [_id, setId] = useState(id);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (formsData) {
      setId(formsData?._id);
    }
  }, [formsData]);

  useEffect(() => {
    if (_id !== '0') {
      fetchData();
    }
  }, [id]);

  const fetchData = () => {
    if (_id !== '0') {
      axiosInstance()
        .get(`${routes.forms.path}/${_id}`)
        .then(({ data: { data } }) => {
          setFormsData(data);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[routes.forms, { title: _id === '0' ? 'New' : formsData?.formName }]} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1"></Box>
        </Box>
      </Box>
      <Box className="detail-container-v1">
        <Tabs
          className="new-tab-container-v1"
          value={tabValue}
          onChange={handleTabChange}
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
                <FaWpforms className="mr-1" fontSize="inherit" /> Information
              </div>
            }
            value={0}
            aria-controls="a11y-tabpanel-0"
            id="a11y-tab-0"
          />
          <Tab
            className={'tabLayout'}
            label={
              <div className="d-flex align-items-center tab-font">
                <BiFoodMenu className="mr-1" fontSize="inherit" /> Fields
              </div>
            }
            value={1}
            aria-controls="a11y-tabpanel-1"
            id="a11y-tab-1"
          />
          <Tab
            className={'tabLayout'}
            label={
              <div className="d-flex align-items-center tab-font">
                <BiFoodMenu className="mr-1" fontSize="inherit" /> Steps
              </div>
            }
            value={2}
            aria-controls="a11y-tabpanel-2"
            id="a11y-tab-2"
          />
        </Tabs>
        <TabPanel value={tabValue} index={0}>
          <Information id={_id} fetchData={fetchData} formsData={formsData} setFormsData={setFormsData} />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <Fields id={_id} fetchData={fetchData} formsData={formsData} />
        </TabPanel>
      </Box>
    </Box>
  );
};

export default CreateForm;
