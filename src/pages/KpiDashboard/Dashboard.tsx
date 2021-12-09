import { useState, useEffect } from 'react';
import { Box, Grid, Paper } from '@material-ui/core';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';
import moment from 'moment';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import Layout from '../../components/Layout';
import axiosInstance from '../../axios/axiosInstance';
import { marketSegment, customerAccount } from '../../constants/helpers';
import OpportunityDashboards from './OpportunityDashboards';
import Filters from './Filters';
import styles from './dashboard.module.scss';

import TopDashboard from './TopDasboard';
import Top2Dashboard from './Top2Dashboard';
import OpportunitiesDashboard from './OpportunitiesDashboard';
import OpportunityTrends from './OpportunityTrends';
import { useData } from '../../StateProvider/Provider'

const Dashboard = () => {
  const { state: { selectedEntity } } = useData()
  const [currency, setCurrency] = useState('');
  const [filterCurrency, setFilterCurrency] = useState('');
  const [salesReps, setSalesReps] = useState([]);
  const [customerAccounts, setCustomerAccounts] = useState([]);
  const [productCategory, setProductCategory] = useState([]);
  const [marketSegments, setMarketSegments] = useState([]);
  const [subMarketSegments, setSubMarketSegments] = useState([]);


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
    country: {}
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
    fetchMarketSegment();
    fetchProductCategory();
    fetchSalesReps();
    fetchCustomerAccount();
  }, []);

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
                salesReps={salesReps}
                customerAccounts={customerAccounts}
                marketSegments={marketSegments}
                subMarketSegments={subMarketSegments}
                productCategory={productCategory}
                setSubMarketSegment={setSubMarketSegments}
                salesFilter={salesFilter}
                setSalesFilter={setSalesFilter}
              />
              <Box className={styles.dashboard_container}>
                <TopDashboard
                  selectedEntity={selectedEntity}
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
                  selectedEntity={selectedEntity}
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
                  selectedEntity={selectedEntity}
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
                  selectedEntity={selectedEntity}
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
