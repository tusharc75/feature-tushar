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

import './dashboard.scss';
import TopDashboard from './TopDasboard';
import Top2Dashboard from './Top2Dashboard';
import OpportunitiesDashboard from './OpportunitiesDashboard';

const Dashboard = () => {
  const [topProducts, setTopProducts] = useState([]);
  const [currency, setCurrency] = useState('');
  const [salesRevenue, setSalesRevenue] = useState({
    revenue: 0,
    spend: 0,
    profit: 0
  });
  const [openQuoteData, setOpenQuoteData] = useState({
    all: 0,
    open: 0,
    percent: 0
  });
  const [regionSales, setRegionSales] = useState([]);
  const [entities, setEntities] = useState([]);
  const [salesReps, setSalesReps] = useState([]);
  const [customerAccounts, setCustomerAccounts] = useState([]);
  const [productCategory, setProductCategory] = useState([]);
  const [marketSegments, setMarketSegments] = useState([]);
  const [subMarketSegments, setSubMarketSegments] = useState([]);
  const [allEntitySalesData, setAllEntitySalesData] = useState({
    labels: [],
    datasets: [],
    allData: []
  });
  const [salesData, setSalesData] = useState({
    labels: [],
    datasets: [],
    allData: []
  });
  const [oppSalesRep, setOppSalesRep] = useState({
    labels: [],
    datasets: []
  });
  const [oppAccount, setOppAccount] = useState({
    labels: [],
    datasets: []
  });
  const [oppTrends, setOppTrends] = useState({
    labels: [],
    datasets: []
  });
  const [createdLeads, setCreatedLeads] = useState({
    labels: [],
    datasets: []
  });
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

  const fetchAllEntitiesData = useCallback(() => {
    let params = {
      marketSegment: salesFilter.marketSegment ? salesFilter.marketSegment['id'] : '',
      subMarketSegment: salesFilter.subMarketSegment ? salesFilter.subMarketSegment['id'] : '',
      customerAccount: salesFilter.customerAccount ? salesFilter.customerAccount['id'] : '',
      between: JSON.stringify({
        from: new Date(salesFilter.between.from).toISOString().split('T')[0],
        to: new Date(salesFilter.between.to).toISOString().split('T')[0]
      })
    };

    let url = '?allEntity=1&';
    for (const k of Object.keys(params)) {
      if (params[k]) {
        if (k === 'between' && salesFilter.between.from && salesFilter.between.to) {
          url = `${url}${k}=${params[k]}&`;
        }
        if (k !== 'between') {
          url = `${url}${k}=${params[k]}&`;
        }
      }
    }

    axiosInstance()
      .get(`dashboard/sales${url}`)
      .then(({ data: { data } }) => {
        const saleData = [];
        const labels = [];
        const budget = [];
        const allEntitiesChart = [];
        const allEntities = [];
        const entityIds = [];

        data = data.sort((a, b) => {
          const aDate = new Date(a.date).getTime();
          const bDate = new Date(b.date).getTime();

          return aDate - bDate;
        });

        for (let d of data) {
          saleData.push(d.totalSell);

          if (!labels.includes(d.date)) {
            labels.push(d.date);
          }
          budget.push(d.budget);

          if (!entityIds.includes(d.entityId)) {
            entityIds.push(d.entityId);
          }
        }

        entityIds.forEach((id) => {
          let chartObj = {};
          let obj = {};
          const entitySale = data.filter((d) => d.entityId === id);

          console.log(entitySale);

          obj = {
            entityName: entitySale[0].entity,
            totalCost: entitySale.map((d) => d.totalCost).reduce((acc, total) => acc + total),
            totalSell: entitySale.map((d) => d.totalSell).reduce((acc, total) => acc + total),
            budget: entitySale.map((d) => d.budget || 0).reduce((acc, total) => acc + total),
            period: `${moment(entitySale[0].date).format('MMM/YY')} - ${moment(entitySale[entitySale.length - 1].date).format('MMM/YY')}`
          };
          chartObj = {
            type: 'line',
            label: entitySale[0].entity,
            borderColor: `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)})`,
            borderWidth: 2,
            data: entitySale.map((e) => e.totalSell)
          };

          allEntities.push(obj);
          allEntitiesChart.push(chartObj);
        });

        setAllEntitySalesData({
          labels: labels.map((d) => moment(d).format('MMM/YY')),
          datasets: allEntitiesChart,
          allData: allEntities
        });
      })
      .catch((err) => {});
  }, [salesFilter.customerAccount, salesFilter.subMarketSegment, salesFilter.marketSegment, salesFilter.between]);

  useEffect(() => {
    fetchAllEntitiesData();
  }, [fetchAllEntitiesData]);

  const fetchSalesData = useCallback(() => {
    let params = {
      entity: salesFilter.entity ? salesFilter.entity['id'] : '',
      marketSegment: salesFilter.marketSegment ? salesFilter.marketSegment['id'] : '',
      subMarketSegment: salesFilter.subMarketSegment ? salesFilter.subMarketSegment['id'] : '',
      productCategory: salesFilter.productCategory ? salesFilter.productCategory['id'] : '',
      salesRep: salesFilter.salesRep ? salesFilter.salesRep['id'] : '',
      customerAccount: salesFilter.customerAccount ? salesFilter.customerAccount['id'] : '',
      between: JSON.stringify({
        from: new Date(salesFilter.between.from).toISOString().split('T')[0],
        to: new Date(salesFilter.between.to).toISOString().split('T')[0]
      })
    };

    let url = '?';
    for (const k of Object.keys(params)) {
      if (params[k]) {
        if (k === 'between' && salesFilter.between.from && salesFilter.between.to) {
          url = `${url}${k}=${params[k]}&`;
        }
        if (k !== 'between') {
          url = `${url}${k}=${params[k]}&`;
        }
      }
    }

    axiosInstance()
      .get(`dashboard/sales${url}`)
      .then(({ data: { data } }) => {
        const saleData = [];
        const labels = [];
        const budget = [];

        data = data.sort((a, b) => {
          const aDate = new Date(a.date).getTime();
          const bDate = new Date(b.date).getTime();

          return aDate - bDate;
        });

        for (let d of data) {
          saleData.push(d.totalSell);
          labels.push(moment(d.date).format('MMM/YY'));
          budget.push(d.budget);
          if (d.currency) {
            setCurrency(d.currency);
          }
        }

        const revenue = data.length > 1 ? data.map((d) => d.totalSell).reduce((acc, val) => acc + val) : data[0].totalSell;
        const spend = data.length > 1 ? data.map((d) => d.totalCost).reduce((acc, val) => acc + val) : data[0].totalCost;

        const profit = revenue && spend ? Math.floor(((revenue - spend) / spend) * 100) : 0;

        setSalesRevenue({
          revenue,
          spend,
          profit
        });

        setSalesData({
          allData: data,
          labels,
          datasets: [
            {
              type: 'line',
              label: 'Total booked value',
              borderColor: 'rgb(54, 162, 235)',
              borderWidth: 2,
              fill: true,
              data: saleData
            },
            {
              type: 'line',
              label: 'Budget',
              borderColor: 'rgb(254, 162, 35)',
              borderWidth: 2,
              fill: false,
              data: budget
            }
          ]
        });
      })
      .catch((err) => {});

    return () => {
      setSalesData({
        labels: [],
        datasets: [],
        allData: []
      });
    };
  }, [salesFilter]);

  useEffect(() => {
    fetchSalesData();
  }, [fetchSalesData]);

  const fetchOpportunitySalesRep = useCallback(() => {
    let params = {
      entity: salesFilter.entity ? salesFilter.entity['id'] : '',
      status,
      between: JSON.stringify({
        from: new Date(salesFilter.between.from).toISOString().split('T')[0],
        to: new Date(salesFilter.between.to).toISOString().split('T')[0]
      })
    };

    let url = '?';
    for (const k of Object.keys(params)) {
      if (params[k]) {
        if (k === 'between' && salesFilter.between.from && salesFilter.between.to) {
          url = `${url}${k}=${params[k]}&`;
        }
        if (k !== 'between') {
          url = `${url}${k}=${params[k]}&`;
        }
      }
    }
    axiosInstance()
      .get(`/dashboard/opportunities/sales-rep${url}`)
      .then(({ data: { data } }) => {
        const labels = [];
        const datasets = [];

        for (let d of data) {
          labels.push(`${d.user.firstName} ${d.user.lastName}`);
          datasets.push(d.count);
        }

        setOppSalesRep({
          labels,
          datasets: [
            {
              label: '',
              data: datasets,
              backgroundColor: [
                'rgba(255, 99, 132, 0.8)',
                'rgba(54, 162, 235, 0.8)',
                'rgba(255, 206, 86, 0.8)',
                'rgba(75, 192, 192, 0.8)',
                'rgba(153, 102, 255, 0.8)',
                'rgba(255, 159, 64, 0.8)'
              ],
              borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)'
              ],
              borderWidth: 1
            }
          ]
        });
      })
      .catch((err) => {});
  }, [salesFilter.entity, salesFilter.between, status]);

  useEffect(() => {
    fetchOpportunitySalesRep();
  }, [fetchOpportunitySalesRep]);

  const fetchOpportunityContact = useCallback(() => {
    let params = {
      entity: salesFilter.entity ? salesFilter.entity['id'] : '',
      status,
      between: JSON.stringify({
        from: new Date(salesFilter.between.from).toISOString().split('T')[0],
        to: new Date(salesFilter.between.to).toISOString().split('T')[0]
      })
    };

    let url = '?';
    for (const k of Object.keys(params)) {
      if (params[k]) {
        if (k === 'between' && salesFilter.between.from && salesFilter.between.to) {
          url = `${url}${k}=${params[k]}&`;
        }
        if (k !== 'between') {
          url = `${url}${k}=${params[k]}&`;
        }
      }
    }
    axiosInstance()
      .get(`/dashboard/opportunities/customer-account${url}`)
      .then(({ data: { data } }) => {
        const labels = [];
        const datasets = [];

        for (let d of data) {
          labels.push(d.customerAccount);
          datasets.push(d.count);
        }

        setOppAccount({
          labels,
          datasets: [
            {
              label: '',
              data: datasets,
              backgroundColor: [
                'rgba(255, 99, 132, 0.8)',
                'rgba(54, 162, 235, 0.8)',
                'rgba(255, 206, 86, 0.8)',
                'rgba(75, 192, 192, 0.8)',
                'rgba(153, 102, 255, 0.8)',
                'rgba(255, 159, 64, 0.8)'
              ],
              borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)'
              ],
              borderWidth: 1
            }
          ]
        });
      })
      .catch((err) => {});
  }, [salesFilter.entity, salesFilter.between, status]);

  useEffect(() => {
    fetchOpportunityContact();
  }, [fetchOpportunityContact]);

  const fetchOpenQuote = useCallback(() => {
    let params = {
      status: status === 'open' || status === 'lost' ? 'open' : 'won',
      entity: salesFilter.entity ? salesFilter.entity['id'] : '',
      between: JSON.stringify({
        from: new Date(salesFilter.between.from).toISOString().split('T')[0],
        to: new Date(salesFilter.between.to).toISOString().split('T')[0]
      })
    };

    let url = '?';
    for (const k of Object.keys(params)) {
      if (params[k]) {
        if (k === 'between' && salesFilter.between.from && salesFilter.between.to) {
          url = `${url}${k}=${params[k]}&`;
        }
        if (k !== 'between') {
          url = `${url}${k}=${params[k]}&`;
        }
      }
    }

    axiosInstance()
      .get(`/dashboard/open-quote${url}`)
      .then(({ data: { data } }) => {
        setOpenQuoteData({
          all: data.count,
          open: data.open,
          percent: Math.floor((data.open / data.count) * 100)
        });
      })
      .catch((err) => {});
  }, [salesFilter.entity, salesFilter.between, status]);

  useEffect(() => {
    fetchOpenQuote();
  }, [fetchOpenQuote]);

  const fetchTopProducts = useCallback(() => {
    let params = {
      entity: salesFilter.entity ? salesFilter.entity['id'] : '',
      between: JSON.stringify({
        from: new Date(salesFilter.between.from).toISOString().split('T')[0],
        to: new Date(salesFilter.between.to).toISOString().split('T')[0]
      })
    };

    let url = '?';
    for (const k of Object.keys(params)) {
      if (params[k]) {
        if (k === 'between' && salesFilter.between.from && salesFilter.between.to) {
          url = `${url}${k}=${params[k]}&`;
        }
        if (k !== 'between') {
          url = `${url}${k}=${params[k]}&`;
        }
      }
    }
    axiosInstance()
      .get(`dashboard/products${url}`)
      .then(({ data: { data } }) => {
        data = data
          .map((d) => ({ ...d, productCategory: d.hasOwnProperty('productCategory') ? d.productCategory : 'Unknown' }))
          .sort((a, b) => b.totalSell - a.totalSell);

        setTopProducts(data);
      })
      .catch((err) => {});
  }, [salesFilter.entity, salesFilter.between]);

  useEffect(() => {
    fetchTopProducts();
  }, [fetchTopProducts]);

  const fetchRegionalSalesData = useCallback(() => {
    axiosInstance()
      .get('dashboard/regionalsales')
      .then(({ data: { data } }) => {
        data = data.sort((a, b) => b.totalSell - a.totalSell);
        setRegionSales(data.map((d) => ({ region: d.region, totalBookedValue: d.totalSell })));
      })
      .catch((err) => {});
  }, []);

  useEffect(() => {
    fetchRegionalSalesData();
  }, [fetchRegionalSalesData]);

  const fetchOppTrends = useCallback(() => {
    let params = {
      entity: salesFilter.entity ? salesFilter.entity['id'] : '',
      between: JSON.stringify({
        from: new Date(salesFilter.between.from).toISOString().split('T')[0],
        to: new Date(salesFilter.between.to).toISOString().split('T')[0]
      })
    };

    let url = '?';
    for (const k of Object.keys(params)) {
      if (params[k]) {
        if (k === 'between' && salesFilter.between.from && salesFilter.between.to) {
          url = `${url}${k}=${params[k]}&`;
        }
        if (k !== 'between') {
          url = `${url}${k}=${params[k]}&`;
        }
      }
    }
    axiosInstance()
      .get(`/dashboard/trend/opportunities${url}`)
      .then(({ data: { data } }) => {
        const won = [];
        const lost = [];
        const open = [];
        const labels = [];

        data = data.sort((a, b) => {
          const aDate = new Date(a.date).getTime();
          const bDate = new Date(b.date).getTime();

          return aDate - bDate;
        });

        for (let d of data) {
          if (d.outcome === 'Won') {
            won.push(d.count);
          }
          if (d.outcome === 'Lost') {
            lost.push(d.count);
          }
          if (d.outcome === '') {
            open.push(d.count);
          }

          if (!labels.includes(d.date)) {
            labels.push(d.date);
          }
        }

        setOppTrends({
          labels: labels.map((d) => moment(d).format('MMM/YY')),
          datasets: [
            {
              type: 'line',
              label: 'Won',
              borderColor: 'rgb(20, 162, 35)',
              backgroundColor: 'rgb(20, 162, 35, 0.4)',
              borderWidth: 2,
              fill: true,
              data: won
            },
            {
              type: 'line',
              label: 'Lost',
              borderColor: 'rgb(255, 99, 132)',
              backgroundColor: 'rgb(255, 99, 132, 0.4)',
              borderWidth: 2,
              fill: true,
              data: lost
            },
            {
              type: 'line',
              label: 'Open',
              borderColor: 'rgb(250, 155, 80)',
              backgroundColor: 'rgb(250, 155, 80, 0.4)',
              borderWidth: 2,
              fill: true,
              data: open
            }
          ]
        });
      })
      .catch((err) => {});
  }, [salesFilter.entity, salesFilter.between]);

  useEffect(() => {
    fetchOppTrends();
  }, [fetchOppTrends]);

  const fetctCreatedLeads = useCallback(() => {
    let params = {
      entity: salesFilter.entity ? salesFilter.entity['id'] : '',
      between: JSON.stringify({
        from: new Date(salesFilter.between.from).toISOString().split('T')[0],
        to: new Date(salesFilter.between.to).toISOString().split('T')[0]
      })
    };

    let url = '?';
    for (const k of Object.keys(params)) {
      if (params[k]) {
        if (k === 'between' && salesFilter.between.from && salesFilter.between.to) {
          url = `${url}${k}=${params[k]}&`;
        }
        if (k !== 'between') {
          url = `${url}${k}=${params[k]}&`;
        }
      }
    }
    axiosInstance()
      .get(`/dashboard/created/leads${url}`)
      .then(({ data: { data } }) => {
        data = data.sort((a, b) => {
          const aDate = new Date(a.date).getTime();
          const bDate = new Date(b.date).getTime();

          return aDate - bDate;
        });

        const dataset = [];
        const labels = [];

        for (let d of data) {
          dataset.push(d.count);
          labels.push(d.date);
        }

        setCreatedLeads({
          labels: labels.map((d) => moment(d).format('MMM/YY')),
          datasets: [
            {
              type: 'bar',
              label: 'Lead Count',
              borderColor: 'rgb(20, 162, 35)',
              backgroundColor: 'rgb(20, 162, 35, 0.4)',
              borderWidth: 2,
              fill: true,
              data: dataset
            }
          ]
        });
      })
      .catch((err) => {});
  }, [salesFilter.entity, salesFilter.between]);

  useEffect(() => {
    fetctCreatedLeads();
  }, [fetctCreatedLeads]);

  useEffect(() => {
    fetchTopProducts();
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
      .catch((err) => {});
  };

  const fetchProductCategory = () => {
    axiosInstance()
      .get(`product-category?limit=0`)
      .then(({ data: { data } }) => {
        setProductCategory(data.map((d) => ({ id: d._id, name: d.name })));
      })
      .catch((err) => {});
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
      .catch((err) => {});
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
      .catch((err) => {});
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
      .catch((err) => {});
  };

  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <Layout>
        <Grid container className="headerbox">
          <CustomBreadCrumbs routes={[{ title: 'Dashboard', path: '/dashboard' }]} />
        </Grid>
        <div className="detail-container">
          <Paper>
            <Container maxWidth="xl">
              <Filters
                currency={currency}
                setCurrency={setCurrency}
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
              <Box py={2}>
                <TopDashboard
                  salesFilter={salesFilter}
                  currency={currency}
                  moment={moment}
                  regionSales={regionSales}
                  salesRevenue={salesRevenue}
                  salesData={salesData}
                />

                <Top2Dashboard moment={moment} currency={currency} allEntitySalesData={allEntitySalesData} />

                <OpportunityDashboards
                  currency={currency}
                  oppTrends={oppTrends}
                  topProducts={topProducts}
                  oppAccount={oppAccount}
                  openQuoteData={openQuoteData}
                  oppSalesRep={oppSalesRep}
                  createdLeads={createdLeads}
                  status={status}
                />

                <Grid container spacing={4}>
                  <Grid item xs={6}></Grid>
                  <Grid item xs={6}></Grid>
                </Grid>

                <Box my={2}>
                  <OpportunitiesDashboard />
                </Box>
              </Box>
            </Container>
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
