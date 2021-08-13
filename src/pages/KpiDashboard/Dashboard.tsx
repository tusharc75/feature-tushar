import { Fragment, useState, useCallback, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TableHead,
  TextField,
  FormControlLabel,
  Checkbox,
  Container
} from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
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

const linChartData = {
  labels: ['1', '2', '3', '4', '5', '6'],
  datasets: [
    {
      label: '# of Votes',
      data: [12, 19, 3, 5, 2, 3],
      fill: false,
      backgroundColor: 'rgb(255, 99, 132)',
      borderColor: 'rgba(255, 99, 132, 0.2)'
    },
    {
      label: '# of No Votes',
      data: [5, 1, 3, 7, 12, 15],
      fill: false,
      backgroundColor: 'rgb(23, 99, 132)',
      borderColor: 'rgba(23, 99, 132, 0.2)'
    },
    {
      label: '# More Votes',
      data: [5, 3, 8, 4, 7, 12],
      fill: false,
      backgroundColor: 'rgb(200, 204, 140)',
      borderColor: 'rgba(200, 204, 140, 0.2)'
    }
  ]
};

const Dashboard = () => {
  const [selectedDate, handleDateChange] = useState(new Date());
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
      from: null,
      to: null
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
        if (k === "between" && salesFilter.between.from && salesFilter.between.to) {
          url = `${url}${k}=${params[k]}&`;
        }
        if (k !== "between") {
          url = `${url}${k}=${params[k]}&`;
        }
  
      }


    }

    axiosInstance()
      .get(`dashboard/sales${url}`)
      .then(({ data: { data } }) => {
        const saleData = []
        const labels = [];
        const budget = []

        for (let d of data) {
          saleData.push(d.totalSell);
          labels.push(moment(d.date).format('MMM/YY'));
          budget.push(d.budget)
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
              label: 'Total Sales',
              borderColor: 'rgb(54, 162, 235, 0.1)',
              backgroundColor: 'rgb(255, 99, 132, 0.8)',
              borderWidth: 2,
              fill: true,
              data: saleData
            },
           
          ]
        });
      })
      .catch((err) => {});

    return () => {
      setSalesData({
        labels: [],
        datasets: []
        })
      }
  }, [salesFilter]);

  const fetchRegionalSalesData = useCallback(() => {
    axiosInstance()
      .get('dashboard/regionalsales')
      .then(({ data: { data } }) => {
        data = data.sort((a, b) => b.totalSell - a.totalSell);
        setRegionSales(data.map((d) => ({ region: d.region, sales: d.totalSell })));
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
            <Container maxWidth="lg">
              <Box py={2}>
                <Grid container spacing={2}>
                  <Grid item sm={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={salesFilter.allEntity}
                          onChange={(e) => setSalesFilter({ ...salesFilter, allEntity: e.target.checked })}
                          color="primary"
                        />
                      }
                      label="All Entity"
                    />
                  </Grid>
                  <Grid item sm={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={salesFilter.byMonth}
                          onChange={(e) => setSalesFilter({ ...salesFilter, byMonth: e.target.checked })}
                          color="primary"
                        />
                      }
                      label="By Month"
                    />
                  </Grid>
                  <Grid item sm={6}>
                    <Autocomplete
                      size="small"
                      disabled={salesFilter.allEntity}
                      fullWidth
                      options={entities}
                      autoHighlight
                      value={salesFilter.entity}
                      getOptionLabel={(option) => option.name || ''}
                      getOptionSelected={(option, val) => (option ? option.name === val.name : false)}
                      onChange={(_, val) => {
                        setSalesFilter({ ...salesFilter, entity: val });
                      }}
                      renderInput={(params) => <TextField {...params} label="Entity" variant="outlined" />}
                    />
                  </Grid>
                  <Grid item sm={6}>
                    <Autocomplete
                      size="small"
                      fullWidth
                      options={marketSegments}
                      autoHighlight
                      value={salesFilter.marketSegment}
                      getOptionLabel={(option) => option.name || ''}
                      getOptionSelected={(option, val) => (option ? option.name === val.name : false)}
                      onChange={(_, val) => {
                        setSalesFilter({ ...salesFilter, marketSegment: val });
                        if (val) {
                          setSubMarketSegments(marketSegments.filter((d) => d?.parentSegment === val?.id));
                        } else {
                          setSubMarketSegments([]);
                        }
                      }}
                      renderInput={(params) => <TextField {...params} label="Market Segment" variant="outlined" />}
                    />
                  </Grid>
                  {salesFilter.marketSegment && (
                    <Grid item sm={6}>
                      <Autocomplete
                        size="small"
                        fullWidth
                        options={subMarketSegments}
                        autoHighlight
                        value={salesFilter.subMarketSegment}
                        getOptionLabel={(option) => option.name || ''}
                        getOptionSelected={(option, val) => (option ? option.name === val.name : false)}
                        onChange={(_, val) => setSalesFilter({ ...salesFilter, subMarketSegment: val })}
                        renderInput={(params) => <TextField {...params} label="Sub-Market Segment" variant="outlined" />}
                      />
                    </Grid>
                  )}
                  <Grid item sm={6}>
                    <Autocomplete
                      size="small"
                      fullWidth
                      options={productCategory}
                      autoHighlight
                      value={salesFilter.productCategory}
                      getOptionLabel={(option) => option.name || ''}
                      getOptionSelected={(option, val) => (option ? option.name === val.name : false)}
                      onChange={(_, val) => setSalesFilter({ ...salesFilter, productCategory: val })}
                      renderInput={(params) => <TextField {...params} label="Product Category" variant="outlined" />}
                    />
                  </Grid>
                </Grid>

                <Grid container spacing={2} className="mt-2">
                  <Grid item xs={6}>
                    <DatePicker
                      inputVariant="outlined"
                      fullWidth
                      size="small"
                      disableFuture
                      openTo="year"
                      format="dd/MM/yyyy"
                      label="From"
                      views={['year', 'month', 'date']}
                      value={salesFilter.between.from}
                      onChange={(date) => {
                        setSalesFilter({ ...salesFilter, between: { from: date, to: salesFilter.between.to } });
                      }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <DatePicker
                      inputVariant="outlined"
                      fullWidth
                      size="small"
                      disableFuture
                      openTo="year"
                      format="dd/MM/yyyy"
                      label="To"
                      views={['year', 'month', 'date']}
                      value={salesFilter.between.to}
                      onChange={(date) => {
                        setSalesFilter({ ...salesFilter, between: { to: date, from: salesFilter.between.from } });
                      }}
                    />
                  </Grid>
                </Grid>
                <Grid container spacing={2}>
                  <Grid item sm={8}>
                    <Box textAlign="center">
                      <Typography variant="h5">Sales by Month</Typography>
                    </Box>

                    <Chart type="bar" data={salesData} />
                  </Grid>
                  <Grid item sm={4}>
                    <Box mt={2}>
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
                            {regionSales.length > 0 &&
                              regionSales.map((data) => (
                                <TableRow key={data.region}>
                                  {Object.keys(data).map((label, i) => (
                                    <TableCell key={label} align={i < 1 ? 'left' : 'right'}>
                                      {data[label]}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
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
                <Box width="800px">
                  <Grid container spacing={4}>
                    <Grid xs={12} sm={4} item>
                      <Autocomplete
                        size="small"
                        fullWidth
                        options={['All opportunities', 'All Leads']}
                        autoHighlight
                        getOptionLabel={(option) => option}
                        renderInput={(params) => <TextField {...params} label="Graphs" variant="outlined" />}
                      />
                    </Grid>
                    <Grid xs={12} sm={4} item>
                      <DatePicker
                        inputVariant="outlined"
                        fullWidth
                        size="small"
                        disableFuture
                        openTo="year"
                        format="dd/MM/yyyy"
                        label="Date Created By"
                        views={['year', 'month', 'date']}
                        value={selectedDate}
                        onChange={handleDateChange}
                      />
                    </Grid>
                    <Grid xs={12} sm={4} item>
                      <Autocomplete
                        size="small"
                        fullWidth
                        options={['Active', 'Inactive']}
                        autoHighlight
                        getOptionLabel={(option) => option}
                        renderInput={(params) => <TextField {...params} label="Status" variant="outlined" />}
                      />
                    </Grid>
                  </Grid>
                  <Chart type="line" data={linChartData} />
                </Box>
              </Box>
            </Box>
          </Paper>
        </div>
      </Layout>
    </MuiPickersUtilsProvider>
  );
};

export default Dashboard;
