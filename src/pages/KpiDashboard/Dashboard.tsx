import { useState, useEffect } from 'react';
import { Box, Grid, Paper, Typography, CircularProgress } from '@material-ui/core';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';
import moment from 'moment';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import axiosInstance from '../../axios/axiosInstance';
import { marketSegment, customerAccount } from '../../constants/helpers';
import OpportunityDashboards from './OpportunityDashboards';
import Filters from './Filters';
import styles from './dashboard.module.scss';
import placeholder_img from '../../assets/PerformanceTuning.png';

import AssetDashboard from './AssetDashboard/AssetDashboard';
import TopDashboard from './TopDasboard';
import Top2Dashboard from './Top2Dashboard';
import OpportunitiesDashboard from './OpportunitiesDashboard';
import OpportunityTrends from './OpportunityTrends';
import { useData } from '../../StateProvider/Provider';

const Dashboard = () => {
  const {
    state: { userLoading, user }
  } = useData();
  const [currency, setCurrency] = useState('');
  const [filterCurrency, setFilterCurrency] = useState('');
  const [salesReps, setSalesReps] = useState([]);
  const [customerAccounts, setCustomerAccounts] = useState([]);
  const [productCategory, setProductCategory] = useState([]);
  const [marketSegments, setMarketSegments] = useState([]);
  const [subMarketSegments, setSubMarketSegments] = useState([]);
  const [dashboardType, setDashboardType] = useState('');

  const [salesFilter, setSalesFilter] = useState({
    marketSegment: {},
    salesRep: {},
    customerAccount: {},
    subMarketSegment: {},
    productCategory: {},
    between: {
      from: new Date(moment().subtract(1, 'year').calendar()),
      to: new Date()
    },
    countrySellTo: {},
    countryBillTo: {}
  });
  const getExchangeRates = async (date, amount) => {
    if (filterCurrency && filterCurrency !== currency) {
      if (amount > 0) {
        try {
          const host = 'api.frankfurter.app';
          const res = await fetch(`https://${host}/${date}?amount=${amount}&from=${currency}&to=${filterCurrency}`);
          const data = await res.json();

          return data;
        } catch (error) {
          console.error(error);
        }
      } else {
        return 0;
      }
    }
  };

  useEffect(() => {
    if (dashboardType && dashboardType.includes('CRM')) {
      fetchMarketSegment();
      fetchProductCategory();
      fetchSalesReps();
      fetchCustomerAccount();
    }
  }, [dashboardType]);

  useEffect(() => {
    if (user && user?.user) {
      setDashboardType(user.user?.dashboards[0])
    }
  }, [user])

  const fetchProductCategory = () => {
    axiosInstance()
      .get(`product-category?limit=0`)
      .then(({ data: { data } }) => {
        setProductCategory(data.map((d) => ({ id: d._id, name: d.name })));
      })
      .catch((err) => { });
  };

  const fetchMarketSegment = () => {
    axiosInstance()
      .get(`${marketSegment.marketSegmentApi}?limit=0`)
      .then(({ data: { data } }) => {
        data = data.map((d) => ({
          id: d.id,
          name: d.name,
          parentSegment: d?.parentMarketSegment?.optionValue
        }));
        setMarketSegments(data);
      })
      .catch((err) => { });
  };

  const fetchSalesReps = () => {
    axiosInstance()
      .get(`/user?limit=0`)
      .then(({ data: { data } }) => {
        data = data.map((d) => ({
          id: d._id,
          name: d.concatedName
        }));
        setSalesReps(data);
      })
      .catch((err) => { });
  };
  const fetchCustomerAccount = () => {
    axiosInstance()
      .get(`${customerAccount.accountApi}?limit=0`)
      .then(({ data: { data } }) => {
        data = data.map((d) => ({
          id: d._id,
          name: d.accountName
        }));
        setCustomerAccounts(data);
      })
      .catch((err) => { });
  };



  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <Grid container className="headerbox">
        <CustomBreadCrumbs routes={[{ title: 'Dashboard' }]} />
      </Grid>
      <div className="detail-container">
        <Paper>
          {userLoading && (
            <Box
              style={{ height: 'calc(100vh - 110px)', minHeight: '400px' }}
              width={'100%'}
              display={'flex'}
              flexDirection="column"
              justifyContent={'center'}
              alignItems={'center'}
              bgcolor={'rgba(255, 255, 255, 0.7)'}
            >
              <CircularProgress size={28} color="primary" />
            </Box>
          )}
          {!dashboardType && (
            <Box
              style={{ height: 'calc(100vh - 110px)', minHeight: '400px' }}
              width={'100%'}
              display={'flex'}
              flexDirection="column"
              justifyContent={'center'}
              alignItems={'center'}
              bgcolor={'rgba(255, 255, 255, 0.7)'}
            >
              <img width={400} height={340} src={placeholder_img} alt="dashboard" />
              <Typography color="textSecondary" variant="h5">
                You don't have access to any dashboard
              </Typography>
            </Box>
          )}
          {dashboardType && (
            <div>
              <Filters
                currency={filterCurrency}
                setCurrency={setFilterCurrency}
                moment={moment}
                salesReps={salesReps}
                customerAccounts={customerAccounts}
                marketSegments={marketSegments}
                subMarketSegments={subMarketSegments}
                productCategory={productCategory}
                setSubMarketSegment={setSubMarketSegments}
                salesFilter={salesFilter}
                setSalesFilter={setSalesFilter}
                setDashboardType={setDashboardType}
                dashboardType={dashboardType}
              />

              {dashboardType && dashboardType.includes('CRM') && (
                <Box className={styles.dashboard_container}>
                  <TopDashboard
                    filterCurrency={filterCurrency}
                    salesFilter={salesFilter}
                    currency={currency}
                    setCurrency={setCurrency}
                    moment={moment}
                    getExchangeRates={getExchangeRates}
                    salesReps={salesReps}
                    customerAccounts={customerAccounts}
                    marketSegments={marketSegments}
                    subMarketSegments={subMarketSegments}
                    productCategory={productCategory}
                    setSubMarketSegment={setSubMarketSegments}
                    setSalesFilter={setSalesFilter}
                  />

                  <Top2Dashboard
                    getExchangeRates={getExchangeRates}
                    salesFilter={salesFilter}
                    currency={currency}
                    setCurrency={setCurrency}
                    moment={moment}
                    salesReps={salesReps}
                    customerAccounts={customerAccounts}
                    marketSegments={marketSegments}
                    subMarketSegments={subMarketSegments}
                    productCategory={productCategory}
                    setSubMarketSegment={setSubMarketSegments}
                    setSalesFilter={setSalesFilter}
                  />

                  <OpportunityDashboards
                    getExchangeRates={getExchangeRates}
                    salesFilter={salesFilter}
                    currency={currency}
                    setCurrency={setCurrency}
                    moment={moment}
                    salesReps={salesReps}
                    customerAccounts={customerAccounts}
                    marketSegments={marketSegments}
                    subMarketSegments={subMarketSegments}
                    productCategory={productCategory}
                    setSubMarketSegment={setSubMarketSegments}
                    setSalesFilter={setSalesFilter}
                  />

                  <OpportunityTrends
                    getExchangeRates={getExchangeRates}
                    salesFilter={salesFilter}
                    currency={currency}
                    setCurrency={setCurrency}
                    moment={moment}
                    salesReps={salesReps}
                    customerAccounts={customerAccounts}
                    marketSegments={marketSegments}
                    subMarketSegments={subMarketSegments}
                    productCategory={productCategory}
                    setSubMarketSegment={setSubMarketSegments}
                    setSalesFilter={setSalesFilter}
                  />

                  {/* <Box my={2}>
                    <OpportunitiesDashboard />
                  </Box> */}
                </Box>
              )}
              {dashboardType && dashboardType.includes('Asset') && (
                <Box p={1} style={{backgroundColor:"#F5F5F5"}}>
                  <AssetDashboard salesFilter={salesFilter} />
                </Box>
              )}
            </div>
          )}
        </Paper>
      </div>
    </MuiPickersUtilsProvider>
  );
};

export default Dashboard;
