import React, { useState, useContext, useEffect, Fragment } from 'react';
import { Grid, Paper, Box, Button, Typography, IconButton, useMediaQuery } from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
import { ControlPoint, PhotoCamera } from '@material-ui/icons';
import { useParams, useHistory } from 'react-router-dom';

import TeamUsers from './TeamUsers';
import axiosInstance from '../../axios/axiosInstance';
import { useData } from '../../StateProvider/Provider';
import routes from '../../components/Helpers/Routes';
import BoxWithBorder from '../../components/BoxWithBorder';
import DetailsPage from '../../components/Shared/DetailsPage';
import DeleteButton from '../../components/Helpers/DeleteButton';
import DetailsPageHeader from '../../components/DetailsPageHeader';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import AssignDataDialog from './AssignDataDialog';
import CustomerAccounts from './CustomerAccounts';
import CustomNodalStructure from '../../components/CustomNodalStructure/CustomNodalStructure';
import {
  customerAccount,
  customerContact,
  displayCardDate,
  formatAmountWithCurrency,
  opportunity,
  projectSales,
  quote
} from '../../constants/helpers';
import CreateProjectSales from './CreateProjectSales';
import { isMobile, isTablet } from 'react-device-detect';
import { IoIosArrowDropright, IoIosArrowDropleft } from 'react-icons/io';
import queryString from 'query-string';
import { MdDelete, MdEdit } from 'react-icons/md';
import { BiEdit, BiFoodMenu } from 'react-icons/bi';
import { FaWpforms } from 'react-icons/fa';
import ActivityButton from 'src/components/Activity/ActivityButton';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';

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
  const [currentAccountId, setCurrentAccountId] = useState('');
  const [headingLbl, setHeadingLbl] = useState('');
  const [mainPoints, setMainPoints] = useState(null);
  const [deleteRec, setDeleteRec] = useState(null);
  const [removeUserRec, setRemoveUserRec] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([routes?.projectSales]);
  const [currentTabIndex, setCurrentTabIndex] = useState(0);
  const [loadingGraphData, setLoadingGraphData] = useState(false);
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

      // data.amount = formatAmountWithCurrency(data.currency, data.amount).fullFormatAmount;
      // data.value = formatAmountWithCurrency(data.currency, data.value).fullFormatAmount;
      let modifiedData: any = {};
      Object.assign(modifiedData, data);

      modifiedData['amount'] = formatAmountWithCurrency(modifiedData.currency, modifiedData.amount).fullFormatAmount;

      const isAllowedToEdit = data.projectManager.optionValue === user?.user?._id;
      setAllowedToEdit(isAllowedToEdit);

      setCopyOfProjectSalesData(modifiedData);

      setProjectSalesData(data);
      currentTabIndex === 0 && setCurrentTabIndex(0);
      handleMainPoints(data);
      const name = data.projectName;

      setHeadingLbl(name);
      setCustomizedRoutes([routes.projectSales, { title: data.projectName }]);
      setTeamUsers(data.staticData?.user);
      setCustomerAccounts(data.staticData?.customerAccount);
      setOpportunities(data.staticData?.opportunity);
      setQuotes(data.staticData?.quoteBuilder);
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
  }, [id]);

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
          history.goBack();
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
                    {isMobile && !isTablet ? <BiEdit size={20} /> : 'Edit'}
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
                <ActivityButton referenceId={projectSalesData?._id} resource={projectSales?.projectSalesResource} />
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
              <CustomTab index={0} aria-controls="a11y-tabpanel-0" id="a11y-tab-0">
                Header
              </CustomTab>
              <CustomTab index={1} aria-controls="a11y-tabpanel-1" id="a11y-tab-1">
                OM-Neurons
              </CustomTab>
              <CustomTab index={2} aria-controls="a11y-tabpanel-2" id="a11y-tab-2">
                Project Team
              </CustomTab>
              <CustomTab index={3} aria-controls="a11y-tabpanel-2" id="a11y-tab-2">
                Customer Account
              </CustomTab>
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
                  currency={projectSalesData?.currency}
                  estimatedAmount={projectSalesData?.amount}
                  marketSegmentId={projectSalesData?.marketSegment?.optionValue}
                  subMarketSegmentId={projectSalesData?.subMarketSegment?.optionValue}
                  permissions={permissions?.projectSales}
                  fetchProjectData={getSalesData}
                  projectId={id}
                  users={teamUsers}
                />
              </Box>
            </TabPanel>
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
        />
      )}
    </Box>
  );
};

export default ProjectSalesDetails;
