import React, { useContext, useEffect, useState } from 'react';
import { makeStyles, Theme } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import { Grid, Paper, IconButton } from '@material-ui/core';
import { ControlPoint } from '@material-ui/icons';
import { Skeleton } from '@material-ui/lab';
import BoxWithBorder from '../../components/BoxWithBorder';
import ProductBuilderInAccordion from '../../components/ProductBuilderInAccordion/ProductBuilderInAccordion';
import ProjectInAccordion from '../../components/ProjectInAccordion/ProjectInAccordion';
import QuotesInAccordion from '../../components/QuotesInAccordion/QuotesInAccordion';
import CustomerContacts from '../ProjectSales/CustomerContacts';
import OpportunityAccordianProjectSales from '../ProjectSales/OpportunityAccordingProjectSales';
import RoleEngine from '../../components/Shared/RoleEngine';
import UserRoles from './UserRoles';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: any;
  value: any;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`scrollable-auto-tabpanel-${index}`}
      aria-labelledby={`scrollable-auto-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box p={3}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: any) {
  return {
    id: `scrollable-auto-tab-${index}`,
    'aria-controls': `scrollable-auto-tabpanel-${index}`,
  };
}

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    flexGrow: 1,
    width: '100%',
    backgroundColor: theme.palette.background.paper,
  },
}));

export default function AssignedEntities({ entities, permissions, userId }) {
  const classes = useStyles();
  const [currentEntity, setCurrentEntity] = useState(entities[0]);
  const [unionRoleData, setUnionRoleData] = useState(null);
  const [currentTabIndex, setCurrentTabIndex] = useState(0);
  const toastConfig = useContext(CustomToastContext);

  useEffect(() => {
    if (currentEntity) {
      getRoleUnion()
    }
    // eslint-disable-next-line
  }, [currentEntity]);

  const handleChange = (value) => {

  };
  const handleUnassignRole = (rec) => {

  };

  const getRoleUnion = () => {
    axiosInstance()
      .get(`/user/entity-union-role/?userId=${userId}&entityId=${currentEntity?.entity._id}`)
      .then(({ data: { data } }) => {
        setUnionRoleData(data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };
  return (
    <Box width="100%">
      <>
        <Tabs
          variant="scrollable"
          scrollButtons="auto"
          className="oms-tab"
          value={currentTabIndex}
          onChange={(index, newValue) => {
            setCurrentTabIndex(newValue);
            setCurrentEntity(entities[newValue])
          }}
          indicatorColor="primary"
          textColor="primary"
          aria-label="icon tabs example"
        >
          {entities.map((c, i) => (
            <Tab
              key={i}
              tabIndex={i}
              label={c?.entity?.entityName || "No entity"}
              aria-controls={`a11y-tabpanel-${i}`}
              id={`a11y-tab-${i}`}
            />
          ))}
        </Tabs>

        <Box style={{ padding: "0px", minHeight: "300px" }}>
          <Box display="flex" padding={1} bgcolor="grey.200">
            <Grid container>
              <Grid item xs={8}>
                <Box display="flex">
                  <Box padding="5px">
                    <Typography variant="subtitle2">
                      Assigned Regional Roles ({currentEntity?.role?.length || "0"})
              </Typography>
                  </Box>
                </Box>
              </Grid>

            </Grid>
          </Box>

          <Grid container style={{ padding: "8px" }} spacing={1}>
            <Grid item xs={12} sm={12} md={4}>
              <BoxWithBorder
                style={{
                  padding: "0px",
                  height: "352px",
                }}
              >
                {
                  <Box
                    style={{
                      width: "100%",
                      height: "100%",
                      overflowY: "auto",
                    }}
                  >
                    {currentEntity.role && (
                      <UserRoles
                        permissions={permissions}
                        data={currentEntity.role}
                        unassignRole={handleUnassignRole}
                        loggedInUser={"1"}
                        currentUserId={"1"}

                      />
                    )}
                  </Box>

                }
              </BoxWithBorder>
            </Grid>
            <Grid item xs={12} sm={12} md={8} lg={8}>
              <BoxWithBorder
                style={{
                  padding: "0px",
                  height: "352px",
                }}
              >
                <RoleEngine
                  field={unionRoleData ? unionRoleData.field : []}
                  resource={unionRoleData ? unionRoleData.resource : []}
                  isDisable={true}
                />
              </BoxWithBorder>
            </Grid>
          </Grid>
        </Box>
      </>
    </Box>
  );
}
