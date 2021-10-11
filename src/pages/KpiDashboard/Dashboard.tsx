import { useState, useCallback, useEffect } from 'react';
import { Box, Grid, Paper, Container } from '@material-ui/core';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';
import moment from 'moment';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import Layout from '../../components/Layout';
import axiosInstance from '../../axios/axiosInstance';
import { entity, marketSegment, customerAccount } from '../../constants/helpers';
import OpportunityDashboards from './OpportunityDashboards';
import Filters from './Filters';
import styles from './dashboard.module.scss';

import TopDashboard from './TopDasboard';
import Top2Dashboard from './Top2Dashboard';
import OpportunitiesDashboard from './OpportunitiesDashboard';
import OpportunityTrends from './OpportunityTrends';

const Dashboard = () => {
  const [currency, setCurrency] = useState('');
  const [filterCurrency, setFilterCurrency] = useState('');
  const [entities, setEntities] = useState([]);
  const [salesReps, setSalesReps] = useState([]);
  const [customerAccounts, setCustomerAccounts] = useState([]);
  const [productCategory, setProductCategory] = useState([]);
  const [marketSegments, setMarketSegments] = useState([]);
  const [subMarketSegments, setSubMarketSegments] = useState([]);
  const [status, setStatus] = useState('open');

  const [salesFilter, setSalesFilter] = useState({
    entity: {},
    marketSegment: {},
    salesRep: {},
    customerAccount: {},
    subMarketSegment: {},
    productCategory: {},
    between: {
      from: new Date(moment().subtract(1, 'year').calendar()),
      to: new Date()
    }
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
        return 0
      }
    }
  };

  useEffect(() => {
    fetchEntities();
    fetchMarketSegment();
    fetchProductCategory();
    fetchSalesReps();
    fetchCustomerAccount();
  }, []);

  const fetchEntities = () => {
    axiosInstance()
      .get(`${entity.entityApi}?limit=0`)
      .then(({ data: { data } }) => {
        setEntities(data.map((d) => ({ id: d._id, name: d.entityName })));
      })
      .catch((err) => { });
  };

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
      <Layout>
        <Grid container className="headerbox">
          <CustomBreadCrumbs routes={[{ title: 'Dashboard', path: '/dashboard' }]} />
        </Grid>
        <div className="detail-container">
          <Paper>
            <div>
              <Filters
                currency={filterCurrency}
                setCurrency={setFilterCurrency}
                moment={moment}
                entities={entities}
                salesReps={salesReps}
                customerAccounts={customerAccounts}
                marketSegments={marketSegments}
                subMarketSegments={subMarketSegments}
                productCategory={productCategory}
                setSubMarketSegment={setSubMarketSegments}
                salesFilter={salesFilter}
                setSalesFilter={setSalesFilter}
                status={status}
                setStatus={setStatus}
              />
              <Box className={styles.dashboard_container}>
                <TopDashboard
                  filterCurrency={filterCurrency}
                  salesFilter={salesFilter}
                  currency={currency}
                  setCurrency={setCurrency}
                  moment={moment}
                  getExchangeRates={getExchangeRates}
                />

                <Top2Dashboard
                  getExchangeRates={getExchangeRates}
                  salesFilter={salesFilter}
                  filterCurrency={filterCurrency}
                  moment={moment}
                  currency={currency}
                />

                <OpportunityDashboards
                  moment={moment}
                  getExchangeRates={getExchangeRates}
                  filterCurrency={filterCurrency}
                  currency={currency}
                  salesFilter={salesFilter}
                  status={status}
                />

                <OpportunityTrends moment={moment} salesFilter={salesFilter} />

                <Box my={2}>
                  <OpportunitiesDashboard />
                </Box>
              </Box>
            </div>
            <Box p={2} display="flex" alignItems="center" flexDirection="column">
              <Box my={2} p={2} width="100%" maxWidth="800px" textAlign="center"></Box>
            </Box>
          </Paper>
        </div>
      </Layout>
    </MuiPickersUtilsProvider>
  );
};

export default Dashboard;
