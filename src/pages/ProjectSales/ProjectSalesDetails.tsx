import { Box, Button, Grid, IconButton, Paper, Typography } from '@material-ui/core';
import { ControlPoint } from '@material-ui/icons';
import { Skeleton } from '@material-ui/lab';
import React, { useContext, useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';

import { Edit } from '@material-ui/icons';
import queryString from 'query-string';
import { isMobile, isTablet } from 'react-device-detect';
import { MdDelete } from 'react-icons/md';
import ActivityButton from 'src/components/Activity/ActivityButton';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import { DeleteButton } from 'src/components/Helpers/Buttons';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import BoxWithBorder from '../../components/BoxWithBorder';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import CustomNodalStructure from '../../components/CustomNodalStructure/CustomNodalStructure';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import routes from '../../components/Helpers/Routes';
import DetailsPage from '../../components/Shared/DetailsPage';
import { checkSuperAdminAccess, displayCardDate, formatAmountWithCurrency, projectSales, sidebarResource } from '../../constants/helpers';
import Step from '../DynamicForm/Step';
import AssignDataDialog from './AssignDataDialog';
import CreateProjectSales from './CreateProjectSales';
import CustomerAccounts from './CustomerAccounts';
import TeamUsers from './TeamUsers';

const ProjectSalesDetails = () => {
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const {
    state: { user, permissions }
  }: any = useData();
  const [loading, setLoading] = useState(false);
  const [copyOfProjectSalesData, setCopyOfProjectSalesData] = useState(null);
  const [projectSalesData, setProjectSalesData] = useState(null);
  const [projectSalesFields, setProjectSalesFields] = useState([]);
  const [teamUsers, setTeamUsers] = useState([]);
  const [customerAccounts, setCustomerAccounts] = useState([]);
  const [customerContacts, setCustomerContacts] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [currentAccountId, setCurrentAccountId] = useState('');
  const [mainPoints, setMainPoints] = useState(null);
  const [deleteRec, setDeleteRec] = useState(null);
  const [removeUserRec, setRemoveUserRec] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([routes?.projectSales]);
  const [currentTabIndex, setCurrentTabIndex] = useState<any>(0);
  const [loadingGraphData, setLoadingGraphData] = useState(false);
  const [resourceData, setResourceData] = useState(null);
  const [graphData, setGraphData] = useState({
    edges: [],
    nodes: [],
    colorPalette: null
  });
  const [allowedToEdit, setAllowedToEdit] = useState(false);

  const [tabValue, setTabValue] = useState(0);

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    //  When it is nodal structure tab
    initializeGraphData();

    return () => {
      setGraphData({ edges: [], nodes: [], colorPalette: null });
    };
  }, [currentTabIndex]);

  const initializeGraphData = () => {
    if (currentTabIndex === 1) {
      setLoadingGraphData(true);
      axiosInstance()
        .get(`${projectSales.projectSalesApi}/nodal-structure/${id}`)
        .then(({ data }) => {
          setLoadingGraphData(false);
          setGraphData({
            nodes: [...data.data.nodes],
            edges: [...data.data.edges],
            colorPalette: data.colorPalette
          });
        })
        .catch((error) => {
          setLoadingGraphData(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  /**
   * Get sales strategy data for paticular ID
   */
  const getSalesData = async () => {
    setLoading(true);
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`${projectSales.projectSalesApi}/${id}`);

      let modifiedData: any = {};
      Object.assign(modifiedData, data);

      modifiedData['amount'] = formatAmountWithCurrency(modifiedData.currency, modifiedData.amount).fullFormatAmount;

      var isAllowedToEdit = data.projectManager.optionValue === user?.user?._id;
      if (checkSuperAdminAccess(user, sidebarResource.projectSales)) {
        isAllowedToEdit = true;
      }
      setAllowedToEdit(isAllowedToEdit);
      setCopyOfProjectSalesData(modifiedData);
      setProjectSalesData(data);
      currentTabIndex === 0 && setCurrentTabIndex(0);
      handleMainPoints(data);
      const name = data.projectName;
      setCustomizedRoutes([routes.projectSales, { title: data.projectName }]);
      setTeamUsers(data.staticData?.user);
      setCustomerAccounts(data.staticData?.customerAccount);
      setOpportunities(data.staticData?.opportunity);
      setQuotes(data.staticData?.quoteBuilder);
      setQuotations(data.staticData?.quotation || []);
      setCustomerContacts(data.staticData?.customerContact);
      initializeGraphData();
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  useEffect(() => {
    getSalesData();
    getProjectFields();
    fetchPolicy();
  }, [id]);

  const fetchPolicy = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.projectSales}`);
      if (data) {
        setResourceData(data);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const getProjectFields = () => {
    axiosInstance()
      .get('/field?resource=Project Sales')
      .then(({ data: { data } }) => {
        setProjectSalesFields(data);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleMainPoints = (data) => {
    let tempMp = {
      'Project Name': data.projectName || '',
      Amount: formatAmountWithCurrency(data.currency, data.amount).fullFormatAmount || '',
      'End Date': data.endDate ? displayCardDate(data.endDate) : '',
      'Project Probability': data?.projectProbability ? `${data.projectProbability}%` : '',
      'Opportunity Owner': data.opportunityOwner?.optionLabel || ''
    };
    setMainPoints(tempMp);
  };

  /**
   * Update Dialog For Sales Data
   */
  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const closeUpdateDIalog = () => {
    setOpenUpdateDialog(false);
  };

  /**
   * Handle Delete Sales Data
   * @param id
   */
  const handleDeleteProject = (id) => {
    setDeleteRec(id);
    setShowConfirmBox(true);
  };

  const DeleteProject = () => {
    if (deleteRec) {
      setDeleting(true);
      axiosInstance()
        .put(`${projectSales.projectSalesApi}/remove`, { ids: [deleteRec] })
        .then(() => {
          setDeleting(false);
          setShowConfirmBox(false);
          history.push(`${routes.projectSales.path}`);
        })
        .catch(() => {
          setDeleting(false);
          setShowConfirmBox(false);
        });
    } else {
      setShowConfirmBox(false);
    }
  };

  /**
   * Handle Remove Users
   */
  const handleRemoveUser = (rec) => {
    setRemoveUserRec(rec);
    setShowConfirmBox(true);
  };

  const RemoveUser = () => {
    if (removeUserRec) {
      const dataObj = {
        user: teamUsers.filter((user) => user._id !== removeUserRec._id).map((user) => user._id),
        _id: id
      };
      setDeleting(true);
      axiosInstance()
        .put(`${projectSales.projectSalesApi}/add-user`, dataObj)
        .then(() => {
          getSalesData();
          setDeleting(false);
          setShowConfirmBox(false);
        })
        .catch((error) => {
          setDeleting(false);
          setShowConfirmBox(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  /**
   * Handle Open Users Dialog For Teams
   */
  const handleOpenDialog = (type: string, id: string = '') => {
    setOpenDialog(true);
    setDialogType(type);
    setCurrentAccountId(id);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setDialogType('');
  };

  const getExisitingData = () => {
    switch (dialogType) {
      case 'user':
        return teamUsers.length ? teamUsers.map((t) => t._id) : [];
      case 'customer-account':
        return customerAccounts.length ? customerAccounts.map((t) => t._id) : [];
      case 'customer-contact':
        return customerContacts.length ? customerContacts.map((t) => t._id) : [];
      case 'opportunity':
        return opportunities.length ? opportunities.map((t) => t._id) : [];
      case 'quote-builder':
        return quotes.length ? quotes.map((t) => t._id) : [];
      case 'quotation':
        return quotations.length ? quotations.map((t) => t._id) : [];

      default:
        return [];
    }
  };

  const isTeamMember = Boolean(teamUsers.find((u) => u._id === user.user._id));
  const isManager = user.user._id === projectSalesData?.projectManager?.optionValue;
  const fiteredFieldForUpdate = projectSalesFields.filter((obj) => obj.isUpdate);
  const fiteredFieldToShow = projectSalesFields.filter((obj) => obj.isRead);

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {!projectSalesData ? (
              <Box padding={1}>
                <Skeleton variant="text" width="150px" height="30px" />
              </Box>
            ) : (
              <>
                {(permissions?.projectSales?.isUpdate && isTeamMember) || isManager ? (
                  <Button
                    variant={isMobile && !isTablet ? 'text' : 'contained'}
                    size="small"
                    className={'btn-outline-v1'}
                    onClick={handleOpenUpdateDialog}
                  >
                    {isMobile && !isTablet ? <Edit /> : 'Edit'}
                  </Button>
                ) : null}
                {permissions?.projectSales?.isDelete && isManager ? (
                  <DeleteButton
                    text={isMobile && !isTablet ? <MdDelete size={20} /> : 'Delete'}
                    onClick={() => {
                      handleDeleteProject(id);
                    }}
                  />
                ) : null}
                <ActivityButton
                  referenceId={projectSalesData?._id}
                  resource={projectSales?.projectSalesResource}
                  resourceLabel={projectSalesData?.projectName}
                />
              </>
            )}
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        {loading || !projectSalesFields.length || !projectSalesData ? (
          <Grid container spacing={2} style={{ padding: '16px' }}>
            <CommonSkeleton lenArray={[...Array(7).keys()]} />
          </Grid>
        ) : (
          <>
            <CustomTabs
              value={currentTabIndex}
              onChange={(index, newValue) => {
                setCurrentTabIndex(newValue);
              }}
            >
              <CustomTab value={0}>Header</CustomTab>
              <CustomTab value={1}>OM-Neurons</CustomTab>
              <CustomTab value={2}>Project Team</CustomTab>
              <CustomTab value={3}>{routes.customerAccount.title}</CustomTab>
              {resourceData && resourceData?.tabs?.length && resourceData?.tabs?.map((tab, i) => <CustomTab value={i + 4}>{tab?.tabName}</CustomTab>)}
            </CustomTabs>
            <TabPanel value={currentTabIndex} index={0}>
              <Box>
                <DetailsPage data={copyOfProjectSalesData} fields={fiteredFieldToShow} />
              </Box>
            </TabPanel>
            <TabPanel value={currentTabIndex} index={1}>
              <Box>
                <CustomNodalStructure
                  id={id}
                  graphData={graphData}
                  loadingGraphData={loadingGraphData}
                  onClick={(node) => {
                    if (node && routes[node.route]) {
                      history.push({
                        pathname: `${routes[node.route].path}/${node.redirectId}`
                      });
                    }
                  }}
                />
              </Box>
            </TabPanel>
            <TabPanel value={currentTabIndex} index={2}>
              <Box className="form-v1">
                <Box className="single-form-v1">
                  <Box className="form-head-v1">
                    <Typography component={'h3'}>Project Team</Typography>
                    {(permissions?.projectSales?.isUpdate && isTeamMember) || isManager ? (
                      <IconButton color="primary" size="small" className="float-right-button-v1 " onClick={() => handleOpenDialog('user')}>
                        <ControlPoint />
                      </IconButton>
                    ) : null}
                  </Box>
                  <Box className="formdata-v1">
                    {loading ? (
                      [1, 2].map((i) => (
                        <BoxWithBorder key={i} style={{ marginBottom: '8px' }}>
                          <Box padding={1}>
                            <Skeleton variant="text" width="100px" height="20px" />
                            <Box marginTop={1} />
                            <Skeleton variant="text" width="100%" height="15px" />
                          </Box>
                        </BoxWithBorder>
                      ))
                    ) : teamUsers.length ? (
                      <Box>
                        <TeamUsers
                          managerId={projectSalesData.projectManager?.optionValue}
                          permissions={permissions}
                          data={teamUsers}
                          removeUser={handleRemoveUser}
                        />
                        <Box marginY={1} />
                      </Box>
                    ) : (
                      <Box textAlign="center" padding={2}>
                        No Users
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            </TabPanel>
            <TabPanel value={currentTabIndex} index={3}>
              <Box>
                <CustomerAccounts
                  isTeamMember={isTeamMember}
                  isManager={isManager}
                  ownerId={projectSalesData?.projectManager?.optionValue}
                  loading={loading}
                  handleOpenDialog={handleOpenDialog}
                  customerAccounts={customerAccounts}
                  customerContacts={customerContacts}
                  opportunities={opportunities}
                  quotes={quotes}
                  quotations={quotations}
                  currency={projectSalesData?.currency}
                  estimatedAmount={projectSalesData?.amount}
                  marketSegmentId={projectSalesData?.marketSegment?.optionValue}
                  subMarketSegmentId={projectSalesData?.subMarketSegment?.optionValue}
                  permissions={permissions}
                  fetchProjectData={getSalesData}
                  projectId={id}
                  users={teamUsers}
                />
              </Box>
            </TabPanel>
            {resourceData &&
              resourceData?.tabs?.length > 0 &&
              resourceData?.tabs?.map((tab, i) => {
                return (
                  <TabPanel value={currentTabIndex} index={i + 4}>
                    <Step
                      tab={tab}
                      resourcePolicyId={resourceData?._id}
                      resourceId={id}
                      resource={sidebarResource.projectSales}
                      data={projectSalesData}
                      allowedToEdit={permissions?.projectSales?.isUpdate}
                    />
                  </TabPanel>
                );
              })}
          </>
        )}
        <TabPanel value={tabValue} index={1}>
          <Paper>
            <Box style={{ padding: '0px', maxHeight: '450px' }}>
              <Box width="100%" padding={1} bgcolor="grey.200" display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle2">Project Team</Typography>
                {(permissions?.projectSales?.isUpdate && isTeamMember) || isManager ? (
                  <IconButton color="primary" size="small" onClick={() => handleOpenDialog('user')}>
                    <ControlPoint />
                  </IconButton>
                ) : null}
              </Box>
              <Box padding={1}>
                {loading ? (
                  [1, 2].map((i) => (
                    <BoxWithBorder key={i} style={{ marginBottom: '8px' }}>
                      <Box padding={1}>
                        <Skeleton variant="text" width="100px" height="20px" />
                        <Box marginTop={1} />
                        <Skeleton variant="text" width="100%" height="15px" />
                      </Box>
                    </BoxWithBorder>
                  ))
                ) : teamUsers.length ? (
                  <Box>
                    <TeamUsers
                      managerId={projectSalesData.projectManager?.optionValue}
                      permissions={permissions}
                      data={teamUsers}
                      removeUser={handleRemoveUser}
                    />
                    <Box marginY={1} />
                  </Box>
                ) : (
                  <Box textAlign="center" padding={2}>
                    No Users
                  </Box>
                )}
              </Box>
            </Box>
          </Paper>
        </TabPanel>
      </Box>
      {showConfirmBox ? (
        <ConfirmationDialog
          open={showConfirmBox}
          message={
            deleteRec
              ? `Are you sure you want to delete this ${projectSalesData.projectName} ?`
              : removeUserRec
                ? `Are you sure you want to remove ${removeUserRec.firstName} ${removeUserRec.lastName} ?`
                : ''
          }
          onClose={() => {
            setShowConfirmBox(false);
            if (deleteRec) setDeleteRec(null);
            if (removeUserRec) setRemoveUserRec(null);
          }}
          onOk={deleteRec ? DeleteProject : removeUserRec ? RemoveUser : null}
          okBtnLoading={isDeleting}
        />
      ) : null}
      {openUpdateDialog && (
        <CreateProjectSales
          open={openUpdateDialog}
          close={closeUpdateDIalog}
          fetchData={() => {
            getSalesData();
            getProjectFields();
          }}
          projectSalesId={projectSalesData._id}
        />

        // <UpdateDetailsDialog
        //   title={`Update ${projectSalesData?.projectName}`}
        //   openDialog={openUpdateDialog}
        //   onClose={closeUpdateDIalog}
        //   data={projectSalesData}
        //   fields={fiteredFieldForUpdate}
        //   isUpdating={isUpdating}
        //   handleUpdate={handleUpdateProject}
        //   isProjectSales={true}
        // />
      )}
      {openDialog && (
        <AssignDataDialog
          dialogOpen={openDialog}
          onSuccess={() => {
            handleCloseDialog();
            getSalesData();
          }}
          handleCloseDialog={handleCloseDialog}
          projectID={id}
          type={dialogType}
          existingData={getExisitingData}
          accountId={currentAccountId}
          entityIds={projectSalesData?.entity?.map((m) => m.optionValue) || []}
          users={teamUsers}
        />
      )}
    </Box>
  );
};

export default ProjectSalesDetails;
