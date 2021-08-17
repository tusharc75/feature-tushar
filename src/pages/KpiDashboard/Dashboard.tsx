import { Fragment, useState, useCallback, useEffect } from 'react';
import { Box, Grid, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableRow, TableHead, Container } from '@material-ui/core';
import { MuiPickersUtilsProvider, DatePicker } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';
import { startCase } from 'lodash';
import Chart from 'react-chartjs-2';
import moment from 'moment';

import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import Layout from '../../components/Layout';
import axiosInstance from '../../axios/axiosInstance';
import { entity, marketSegment } from '../../constants/helpers';
import OpportunitiesDashboard from './OpportunitiesDashboard';
import ConvertedLeads from './ConvertedLeads';
import Filters from './Filters';

const Dashboard = () => {
  const [regionSales, setRegionSales] = useState([]);
  const [entities, setEntities] = useState([]);
  const [productCategory, setProductCategory] = useState([]);
  const [marketSegments, setMarketSegments] = useState([]);
  const [subMarketSegments, setSubMarketSegments] = useState([]);
  const [salesData, setSalesData] = useState({
    labels: [],
    datasets: []
  });
  const [salesFilter, setSalesFilter] = useState({
    allEntity: true,
    byMonth: false,
    entity: {},
    marketSegment: {},
    subMarketSegment: {},
    productCategory: {},
    between: {
      from: new Date(moment().subtract(3, 'months').calendar()),
      to: new Date()
    }
  });

  const fetchSalesData = useCallback(() => {
    let params = {
      allEntity: salesFilter.allEntity ? 1 : 0,
      entity: salesFilter.entity ? salesFilter.entity['id'] : '',
      marketSegment: salesFilter.marketSegment ? salesFilter.marketSegment['id'] : '',
      subMarketSegment: salesFilter.subMarketSegment ? salesFilter.subMarketSegment['id'] : '',
      productCategory: salesFilter.productCategory ? salesFilter.productCategory['id'] : '',
      byMonth: salesFilter.byMonth ? 1 : 0,
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

        for (let d of data) {
          saleData.push(d.totalSell);
          labels.push(moment(d.date).format('MMM/YY'));
          budget.push(d.budget);
        }

        setSalesData({
          labels,
          datasets: [
            {
              type: 'line',
              label: 'Budget',
              borderColor: 'rgb(54, 162, 235)',
              borderWidth: 2,
              fill: false,
              data: budget
            },
            {
              type: 'line',
              label: 'Total booked value',
              borderColor: 'rgb(54, 162, 235, 0.1)',
              backgroundColor: 'rgb(255, 99, 132, 0.8)',
              borderWidth: 2,
              fill: true,
              data: saleData
            }
          ]
        });
      })
      .catch((err) => {});

    return () => {
      setSalesData({
        labels: [],
        datasets: []
      });
    };
  }, [salesFilter]);

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
    fetchSalesData();
  }, [fetchSalesData]);

  useEffect(() => {
    fetchRegionalSalesData();
    fetchEntities();
    fetchMarketSegment();
    fetchProductCategory();
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

  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <Layout>
        <Grid container className="headerbox">
          <CustomBreadCrumbs routes={[{ title: 'Dashboard', path: '/dashboard' }]} />
        </Grid>
        <div className="detail-container">
          <Paper>
            <Container maxWidth="xl">
              <Box py={2}>
                <Filters
                  entities={entities}
                  marketSegments={marketSegments}
                  subMarketSegments={subMarketSegments}
                  productCategory={productCategory}
                  setSubMarketSegment={setSubMarketSegments}
                  salesFilter={salesFilter}
                  setSalesFilter={setSalesFilter}
                />
                <Grid container spacing={2}>
                  <Grid item sm={8}>
                    <Box mb={2}>
                      <Grid container spacing={2}>
                        <Grid item xs={4}>
                          <Paper>
                            <Box p={3} textAlign="center">
                              <Typography variant="h6" color="textSecondary">
                                Revenue
                              </Typography>
                              <Typography variant="h5" color="textPrimary">
                                $95,879.00
                              </Typography>
                            </Box>
                          </Paper>
                        </Grid>
                        <Grid item xs={4}>
                          <Paper>
                            <Box p={3} textAlign="center">
                              <Typography variant="h6" color="textSecondary">
                                Spend
                              </Typography>
                              <Typography variant="h5" color="textPrimary">
                                $55,879.00
                              </Typography>
                            </Box>
                          </Paper>
                        </Grid>
                        <Grid item xs={4}>
                          <Paper>
                            <Box p={3} textAlign="center">
                              <Typography variant="h6" color="textSecondary">
                                Profits
                              </Typography>
                              <Typography variant="h5" color="textPrimary">
                                25%
                              </Typography>
                            </Box>
                          </Paper>
                        </Grid>
                      </Grid>
                    </Box>

                    <Paper elevation={2}>
                      <Box p={2}>
                        <Box textAlign="center">
                          <Typography variant="h5">Total booked value in USD</Typography>
                        </Box>

                        <Chart type="bar" data={salesData} />
                      </Box>
                    </Paper>
                  </Grid>
                  <Grid item sm={4}>
                    {/* <Box mt={2}>
                      <TableContainer style={{ maxHeight: 450 }} component={Paper}>
                        <Table stickyHeader size="small">
                          <TableHead>
                            <TableRow>
                              {regionSales.length > 0 &&
                                Object.keys(regionSales[0]).map((label, i) => (
                                  <TableCell key={label} align={i < 1 ? 'left' : 'right'}>
                                    {startCase(label)}
                                  </TableCell>
                                ))}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {regionSales.length > 0 ? (
                              regionSales.map((data) => (
                                <TableRow key={data.region}>
                                  {Object.keys(data).map((label, i) => (
                                    <TableCell key={label} align={i < 1 ? 'left' : 'right'}>
                                      {data[label]}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))
                            ) : (
                              <Typography>No Data</Typography>
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box> */}
                    <Paper>
                      <Box p={2}>
                        <Typography variant="h6" color="textSecondary">
                          Top Selling Product
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>

                <Grid container spacing={4}>
                  <Grid item xs={6}>
                    <Paper elevation={2}>
                      <Box p={4}>
                        <Typography variant="h6">Open Opportunities - Amount by Sales Rep</Typography>
                        <Chart
                          style={{ height: '100%' }}
                          type="pie"
                          data={{
                            labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
                            datasets: [
                              {
                                label: '# of Votes',
                                data: [12, 19, 3, 5, 2, 3],
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
                          }}
                        />
                      </Box>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper elevation={2}>
                      <Box p={4}>
                        <Typography variant="h6">Open Opportunities - Amount by Account</Typography>
                        <Chart
                          style={{ height: '100%' }}
                          type="pie"
                          data={{
                            labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
                            datasets: [
                              {
                                label: '# of Votes',
                                data: [12, 19, 3, 5, 2, 3],
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
                          }}
                        />
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>

                <Box my={2}>
                  <OpportunitiesDashboard />
                </Box>
              </Box>
            </Container>
            <Box p={2} display="flex" alignItems="center" flexDirection="column">
              <Box my={2} p={2} width="100%" maxWidth="800px" textAlign="center"></Box>

              <Box my={2}>
                <ConvertedLeads Chart={Chart} />
              </Box>
            </Box>
          </Paper>
        </div>
      </Layout>
    </MuiPickersUtilsProvider>
  );
};

export default Dashboard;
