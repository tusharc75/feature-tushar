import { Box, Button, Grid, Tab, Tabs } from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import { useData } from 'src/StateProvider/Provider';
import { useParams, useHistory } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import TabPanel from '../../components/TabPanel';
import { FaWpforms } from 'react-icons/fa';
import DataListItems from './DataListItems';

const DataListDetail = () => {

  const { id } = useParams();
  const [tabValue, setTabValue] = useState(0);


  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[routes.dataList, { title: "Data List Items"}]} />
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
                <FaWpforms className="mr-1" fontSize="inherit" /> DataList Items
              </div>
            }
            value={0}
            aria-controls="a11y-tabpanel-0"
            id="a11y-tab-0"
          />
        </Tabs>
        <TabPanel value={tabValue} index={0}>
           <DataListItems dataListId = {id}/>
        </TabPanel>
      </Box>
      {/* {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${routes?.payrollPolicy?.title?.toLowerCase()} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )} */}

      {/* {openUpdateDialog && (
        <ManagePayrollPolicy
          isClone={false}
          id={id}
          onClose={closeUpdateDialog}
          onSuccess={() => {
            closeUpdateDialog();
            fetchData();
          }}
        />
      )} */}
    </Box>
  );
};

export default DataListDetail;
