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
import { ACTIVITY_RESOURCE, EXPENSE_STATUS, expenses, formatAmountWithCurrency, sidebarResource } from '../../constants/helpers';
import Step from '../DynamicForm/Step';
import ManageExpenses from 'src/pages/Expenses/ManageExpenses';
import Grid from '@mui/material/Grid2';
import ActivityButton from 'src/components/Activity/ActivityButton';

const ExpenseDetail = () => {
  const toastConfig = useContext(CustomToastContext);

  const { id } = useParams();
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { tab }: any = parsed;

  const {
    state: { permissions, resources }
  }: any = useData();
  const [expensesData, setExpensesData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);
  const [locationKeys, setLocationKeys] = useState([]);
  const [allowedToDelete, setAllowedToDelete] = useState(false);
  const [resourceData, setResourceData] = useState(null);
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
    axiosInstance()
      .get(`/field?resource=${sidebarResource?.expenses}`)
      .then(({ data }) => {
        setFields(data.data?.filter((field) => field.isRead));
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchData = async () => {
    axiosInstance()
      .get(`${expenses.api}/${id}`)
      .then(({ data: { data } }) => {
        setAllowedToEdit(permissions?.expenses?.isUpdate);
        setAllowedToDelete(permissions?.expenses?.isDelete && data.status === EXPENSE_STATUS.unreported);
        setExpensesData(data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchPolicy = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.expenses}`);
      if (data) {
        setResourceData(data);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${expenses.api}/remove`, { ids: [expensesData._id] })
      .then(() => {
        setShowConfirmBox(false);
        history.push(`${routes?.expenses?.path}`);
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
              { ...routes?.expenses, title: resources?.expenses?.titlePlural },
              { title: `${expensesData ? expensesData?.expenseNumber : ''}` }
            ]}
          />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            <Fragment>
              {expensesData?.status !== EXPENSE_STATUS.approved && expensesData?.status !== EXPENSE_STATUS.awaitingApproval && expensesData?.status !== EXPENSE_STATUS.reimbursed && (
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
              )}
            </Fragment>
            {allowedToDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
            <ActivityButton
              referenceId={expensesData?._id}
              resource={ACTIVITY_RESOURCE.expenses}
              resourceLabel={expensesData?.expenseNumber}
            />
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <CustomTabs value={tabValue} onChange={handleMainTabChange}>
          <CustomTab value={0}>Header</CustomTab>
          {resourceData && resourceData?.tabs?.length > 0 && resourceData?.tabs?.map((tab, i) => <CustomTab value={i + 1}>{tab?.tabName}</CustomTab>)}
        </CustomTabs>
        <TabPanel value={tabValue} index={0}>
          <Box>
            {expensesData && fields ? (
              <DetailsPage data={expensesData} fields={fields} />
            ) : (
              <div className="p-2">
                <CommonSkeleton lenArray={[...Array(10).keys()]} />
              </div>
            )}
            {expensesData ? (
              expensesData.type === 'Mileage' ? (
                <Box className={`single-form-v1 mt-4`} style={{ overflow: 'hidden' }}>
                  <Box className={'form-head-v1'} justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2">Mileage</Typography>
                  </Box>
                  <Box className="formdata-v1">
                    <Grid
                      container
                      direction="column"
                      sx={{
                        overflow: 'hidden'
                      }}
                    >
                      <Grid container direction="row">
                        <Grid size={{ xs: 3 }}>
                          <Typography className="table-head-v1  br-0 text-truncate" style={{ width: '100%' }} variant="body1">
                            From
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 3 }}>
                          <Typography className="table-head-v1  br-0 text-truncate" style={{ width: '100%' }} variant="body1">
                            To
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 2 }} sx={{ textAlign: 'right' }}>
                          <Typography className="table-head-v1  br-0 text-truncate" style={{ width: '100%' }} variant="body1">
                            {`Distance (${expensesData?.distanceUnit})`}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 2 }} sx={{ textAlign: 'right' }}>
                          <Typography className="table-head-v1  br-0 text-truncate" style={{ width: '100%' }} variant="body1">
                            Rate
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 2 }} sx={{ textAlign: 'right' }}>
                          <Typography className="table-head-v1 text-truncate" style={{ width: '100%' }} variant="body1">
                            Amount
                          </Typography>
                        </Grid>
                      </Grid>
                      {expensesData?.lineItems?.map((row) => (
                        <Grid container direction="row" key={row.id}>
                          <Grid size={{ xs: 3 }}>
                            <Typography className="table-body-v1 bt-0 br-0 text-truncate" style={{ width: '100%' }} variant="body2">
                              {row.fromLocation?.description}
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 3 }}>
                            <Typography className="table-body-v1 bt-0 br-0 text-truncate" style={{ width: '100%' }} variant="body2">
                              {row.toLocation?.description}
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 2 }} sx={{ textAlign: 'right' }}>
                            <Typography className="table-body-v1 bt-0 br-0" style={{ width: '100%' }} variant="body2">
                              {row.distance}
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 2 }} sx={{ textAlign: 'right' }}>
                            <Typography className="table-body-v1 bt-0 br-0" style={{ width: '100%' }} variant="body2">
                              {formatAmountWithCurrency(expensesData?.currency, row?.rate)?.fullFormatAmountWithoutSpace || '-'}
                            </Typography>{' '}
                          </Grid>
                          <Grid size={{ xs: 2 }} sx={{ textAlign: 'right' }}>
                            <Typography className="table-body-v1 bt-0" style={{ width: '100%' }} variant="body2">
                              {formatAmountWithCurrency(expensesData?.currency, row?.amount)?.fullFormatAmountWithoutSpace || '-'}
                            </Typography>
                          </Grid>
                        </Grid>
                      ))}
                      <Grid container direction="row">
                        <Grid size={{ xs: 6 }}>
                          <Typography className="table-head-v1  bt-0 br-0" style={{ width: '100%' }}>
                            Total
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 2 }} sx={{ textAlign: 'right' }}>
                          <Typography className="table-head-v1  bt-0 br-0" style={{ width: '100%' }}>
                            {expensesData?.totalDistance || '-'}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 2 }}>
                          <Typography className="table-head-v1  bt-0 br-0" style={{ width: '100%', height: '100%' }}></Typography>
                        </Grid>
                        <Grid size={{ xs: 2 }} sx={{ textAlign: 'right' }}>
                          <Typography className="table-head-v1  bt-0" style={{ width: '100%' }}>
                            {formatAmountWithCurrency(expensesData?.currency, expensesData?.totalAmount)?.fullFormatAmountWithoutSpace || '-'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Box>
                </Box>
              ) : (
                <Box className={`single-form-v1 mt-4`} style={{ overflow: 'hidden' }}>
                  <Box className={'form-head-v1'} justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2">Expense</Typography>
                  </Box>
                  <Box className="formdata-v1">
                    <Grid
                      container
                      direction="column"
                      sx={{
                        overflow: 'hidden'
                      }}
                    >
                      {expensesData?.lineItems?.length > 0 && (
                        <Grid container direction="row">
                          <Grid size={{ xs: 6 }}>
                            <Typography className="table-head-v1  br-0 text-truncate" style={{ width: '100%' }} variant="body1">
                              Description
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 6 }} sx={{ textAlign: 'right' }}>
                            <Typography className="table-head-v1 text-truncate" style={{ width: '100%' }} variant="body1">
                              Amount
                            </Typography>
                          </Grid>
                        </Grid>
                      )}
                      {expensesData?.lineItems?.map((row) => (
                        <Grid container direction="row" key={row.id}>
                          <Grid size={{ xs: 6 }}>
                            <Typography className="table-body-v1 bt-0 br-0 text-truncate" style={{ width: '100%' }} variant="body2">
                              {row.description}
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 6 }} sx={{ textAlign: 'right' }}>
                            <Typography className="table-body-v1 bt-0 text-truncate" style={{ width: '100%' }} variant="body2">
                              {formatAmountWithCurrency(expensesData?.currency, row?.amount)?.fullFormatAmountWithoutSpace || '-'}
                            </Typography>
                          </Grid>
                        </Grid>
                      ))}
                      <Grid container direction="row">
                        <Grid size={{ xs: 6 }}>
                          <Typography className={`table-head-v1 br-0 text-truncate ${expensesData?.lineItems?.length > 0 ? 'bt-0' : ''}`} style={{ width: '100%' }}>
                            Total Amount
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }} sx={{ textAlign: 'right' }}>
                          <Typography className={`table-head-v1 text-truncate ${expensesData?.lineItems?.length > 0 ? 'bt-0' : ''}`} style={{ width: '100%' }}>
                            {formatAmountWithCurrency(expensesData?.currency, expensesData?.totalAmount)?.fullFormatAmountWithoutSpace || '-'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Box>
                </Box>
              )
            ) : (
              <div className="p-2">
                <CommonSkeleton lenArray={[...Array(10).keys()]} />
              </div>
            )}
          </Box>
        </TabPanel>
        {resourceData &&
          resourceData?.tabs?.length > 0 &&
          resourceData?.tabs?.map((tab, i) => {
            return (
              <TabPanel value={tabValue} index={i + 3}>
                <Step
                  tab={tab}
                  resourcePolicyId={resourceData?._id}
                  resourceId={id}
                  resource={sidebarResource.expenses}
                  data={expensesData}
                  allowedToEdit={permissions?.expenses?.isUpdate}
                />
              </TabPanel>
            );
          })}
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${resources?.expenses?.titleSingular?.toLowerCase()} : ${expensesData?.expenseNumber} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog && (
        <ManageExpenses
          isClone={false}
          expenseId={id}
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

export default ExpenseDetail;
