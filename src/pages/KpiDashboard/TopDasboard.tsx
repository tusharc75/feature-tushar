import { useState, useEffect, useCallback } from 'react';
import {
  Grid,
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableContainer,
  TableRow,
  TableCell,
  TableHead,
  Button,
  Menu,
  MenuItem,
  Popover,
  TextField
} from '@material-ui/core';
import { FilterList, ImportExport, TableChart, Timeline } from '@material-ui/icons';
import { startCase } from 'lodash';
import Chart from 'react-chartjs-2';
import PptxGenJs from 'pptxgenjs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from "file-saver";
import { utils, write } from "xlsx";
import { SVG } from "../../assets";
import styles from './dashboard.module.scss';
import { formatAmountWithCurrency } from '../../constants/helpers';
import axiosInstance from '../../axios/axiosInstance';
import Loader from '../../components/Loader';
import TopDashboardTable from './TopDashboardTable';
import { Autocomplete, Skeleton } from '@material-ui/lab';
import Countries from "../../constants/Country.json"

import { useData } from '../../StateProvider/Provider';

const TopDashboard = (props) => {
  const {
    state: { selectedEntity }
  } = useData();
  const { moment, currency, filterCurrency, salesFilter, getExchangeRates, setCurrency, marketSegments,
    subMarketSegments,
    productCategory,
    setSubMarketSegments,
    salesReps,
    customerAccounts, } = props;
  const [anchorElChart, setAnchorElChart] = useState(null);
  const [currentFilter, setCurrentFilter] = useState('');

  const [filter, setFilter] = useState<any>({
    marketSegment: {},
    salesRep: {},
    customerAccount: {},
    subMarketSegment: {},
    productCategory: {},
    countrySellTo: {},
    countryBillTo: {}
  });

  const [filterBookedValue, setFilterBookedValue] = useState<any>({
    marketSegment: {},
    salesRep: {},
    customerAccount: {},
    subMarketSegment: {},
    productCategory: {},
    countrySellTo: {},
    countryBillTo: {}
  });

  const [filterAnchor, setFilterAnchor] = useState(null);
  const [openFilter, setOpenFilter] = useState(false);

  const [tableView, setTableView] = useState(false);
  const [loadingChart, setLoadingChart] = useState(false);
  const [tableDataRaw, setTableDataRaw] = useState([]);
  const [salesRevenue, setSalesRevenue] = useState({
    revenue: 0,
    spend: 0,
    profit: 0,
    profitValue: 0,
  });

  const [totalValueMT, setTotalValueMT] = useState({
    qty: 0,
    unit: "MT"
  });


  const [salesData, setSalesData] = useState({
    labels: [],
    datasets: [],
    allData: []
  });

  const getURL = () => {
    let params = {
      entity: selectedEntity || "",
      marketSegment: currentFilter==="sale"? filter.marketSegment ? filter.marketSegment['id']: '':filterBookedValue.marketSegment ? filterBookedValue.marketSegment['id'] : '',
      subMarketSegment: currentFilter==="sale"? filter.subMarketSegment ? filter.subMarketSegment['id'] : '' : filterBookedValue.subMarketSegment ? filterBookedValue.subMarketSegment['id'] : '',
      productCategory: currentFilter==="sale"? filter.productCategory ? filter.productCategory['id'] : '' : filterBookedValue.productCategory ? filterBookedValue.productCategory['id'] : '',
      salesRep: currentFilter==="sale"? filter.salesRep ? filter.salesRep['id'] : '' : filterBookedValue.salesRep ? filterBookedValue.salesRep['id'] : '',
      customerAccount: currentFilter==="sale"? filter.customerAccount ? filter.customerAccount['id'] : '' : filterBookedValue.customerAccount ? filterBookedValue.customerAccount['id'] : '',
      countrySellTo: currentFilter==="sale"? filter.countrySellTo ? filter.countrySellTo["optionValue"] : '' : filterBookedValue.countrySellTo ? filterBookedValue.countrySellTo["optionValue"] : '',
      countryBillTo: currentFilter==="sale"? filter.countryBillTo ? filter.countryBillTo["optionValue"] : '' : filterBookedValue.countryBillTo ? filterBookedValue.countryBillTo["optionValue"] : '',
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
    return url
  }

  const fetchSalesData = useCallback(() => {
    setLoadingChart(true);
    let url = getURL()
    axiosInstance()
      .get(`dashboard/sales${url}`)
      .then(async ({ data: { data } }) => {
        const saleData = [];
        const costData = [];
        const labels = [];
        const budget = [];

        data = data.sort((a, b) => {
          const aDate = new Date(a.date).getTime();
          const bDate = new Date(b.date).getTime();

          return aDate - bDate;
        });

        for (let d of data) {
          if (filterCurrency && filterCurrency !== currency) {
            const totalSelldata = await getExchangeRates(moment(d.date).format('YYYY-MM-DD'), d.totalSell);
            const totalCostData = await getExchangeRates(moment(d.date).format('YYYY-MM-DD'), d.totalCost);
            const budgetData = await getExchangeRates(moment(d.date).format('YYYY-MM-DD'), d.budget);

            saleData.push(totalSelldata ? totalSelldata.rates[filterCurrency] : d.totalSell);
            costData.push(totalCostData ? totalCostData.rates[filterCurrency] : d.totalCost);
            budget.push(budgetData ? budgetData.rates[filterCurrency] : d.budget);
          } else {
            saleData.push(d.totalSell);
            costData.push(d.totalCost);
            budget.push(d.budget);
          }
          labels.push(moment(d.date).format('MMM/YY'));

          if (d.currency) {
            setCurrency(d.currency);
          }
        }

        let revenue = saleData.reduce((acc, val) => acc + val);
        let spend = costData.reduce((acc, val) => acc + val);
        let revenueRate, spendRate;

        const profit = revenue && spend ? Math.floor(((revenue - spend) / spend) * 100) : 0;
        const profitValue = revenue && spend ? Math.floor(revenue - spend) : 0

        if (filterCurrency !== currency) {
          revenueRate = await getExchangeRates(moment().format('YYYY-MM-DD'), revenue)
          spendRate = await getExchangeRates(moment().format('YYYY-MM-DD'), spend)
        }

        setSalesRevenue({
          ...salesRevenue,
          revenue: revenueRate ? revenueRate.rates[filterCurrency] : revenue,
          spend: spendRate ? spendRate.rates[filterCurrency] : spend,
          profit: profit,
          profitValue: profitValue
        });

        setLoadingChart(false);
      })
      .catch((err) => {
        setLoadingChart(false);
      });
  }, [salesFilter, filter, filterCurrency, selectedEntity]);

  const fetchSalesDataBookedValue = useCallback(() => {
    setLoadingChart(true);
    let url = getURL()
    axiosInstance()
      .get(`dashboard/sales${url}`)
      .then(async ({ data: { data } }) => {
        const saleData = [];
        const costData = [];
        const labels = [];
        const budget = [];

        data = data.sort((a, b) => {
          const aDate = new Date(a.date).getTime();
          const bDate = new Date(b.date).getTime();

          return aDate - bDate;
        });

        for (let d of data) {
          if (filterCurrency && filterCurrency !== currency) {
            const totalSelldata = await getExchangeRates(moment(d.date).format('YYYY-MM-DD'), d.totalSell);
            const totalCostData = await getExchangeRates(moment(d.date).format('YYYY-MM-DD'), d.totalCost);
            const budgetData = await getExchangeRates(moment(d.date).format('YYYY-MM-DD'), d.budget);

            saleData.push(totalSelldata ? totalSelldata.rates[filterCurrency] : d.totalSell);
            costData.push(totalCostData ? totalCostData.rates[filterCurrency] : d.totalCost);
            budget.push(budgetData ? budgetData.rates[filterCurrency] : d.budget);
          } else {
            saleData.push(d.totalSell);
            costData.push(d.totalCost);
            budget.push(d.budget);
          }
          labels.push(moment(d.date).format('MMM/YY'));

          if (d.currency) {
            setCurrency(d.currency);
          }
        }

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
        setLoadingChart(false);
      })
      .catch((err) => {
        setLoadingChart(false);
      });
  }, [salesFilter, filterBookedValue, filterCurrency, selectedEntity]);

  useEffect(() => {
    fetchSalesData();
  }, [fetchSalesData]);

  useEffect(() => {
    fetchSalesDataBookedValue();
  }, [fetchSalesDataBookedValue]);

  useEffect(() => {
    let url = getURL()
    axiosInstance().get(`dashboard/total-weight-sold${url}`)
      .then(({ data }) => {
        setTotalValueMT({ qty: data?.data?.qty, unit: data?.data?.unit })
      })
      .catch((err) => {

      })
  }, [salesFilter, filter, filterCurrency, selectedEntity])

  useEffect(() => {
    const tableD = salesData.allData.map((d) => ({
      Month: moment(d.date).format('MMM/YY'),
      ['Total Sell']: d.totalSell ? d.totalSell : 0,
      ['Total Cost']: d.totalSell ? d.totalCost : 0,
      Budget: d.budget ? d.budget : 0
    }));
    setTableDataRaw(tableD);
  }, [salesData]);

  const handleClickChart = (event) => {
    setAnchorElChart(event.currentTarget);
  };

  const handleCloseChart = (exportType) => () => {
    switch (exportType) {
      case 'ppt': {
        const canvas = document.getElementById('perEntityChart') as HTMLCanvasElement;
        const dataUrl = canvas.toDataURL('image/png');
        const pptx = new PptxGenJs();
        const slide = pptx.addSlide();
        slide.addImage({ data: dataUrl, w: '80%', h: '80%', x: '10%', y: '15%' });
        pptx.writeFile({ fileName: 'Entity Sales Chart.pptx' });
        break;
      }

      case 'pdf': {
        const canvas = document.getElementById('perEntityChart') as HTMLCanvasElement;
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        const doc = new jsPDF('portrait');
        doc.setFontSize(20);
        doc.text(`Total offered Value In ${currency}`, 60, 15);
        doc.addImage(dataUrl, 'JPEG', 10, 20, 190, 100);
        doc.save('Entity Sales Chart.pdf');
        break;
      }

      case 'excel': {
        // const canvas = document.getElementById('perEntityChart') as HTMLCanvasElement;
        // const dataUrl = canvas.toDataURL('image/png', 1.0);
        const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        const fileExtension = '.xlsx';
        const ws = utils.json_to_sheet(tableDataRaw);
        const wb = {
          Sheets: {
            data: ws
          },
          SheetNames: ['data']
        };
        const excelBuffer = write(wb, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: fileType });
        saveAs(data, 'Entity Sales Chart' + fileExtension);
        break;
      }

      case 'json': {
        let blob = new Blob([JSON.stringify(tableDataRaw)], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, 'Entity Sales Chart.json');
        break;
      }
      default:
        break;
    }

    setAnchorElChart(null);
  };

  const handleClickFilter = (event) => {
    setFilterAnchor(event.currentTarget);
    setOpenFilter((prev) => !prev);
  };


  return (
    <Grid container spacing={2}>
      <Popover
        open={openFilter}
        anchorEl={filterAnchor}
        onClose={handleClickFilter}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center'
        }}
      >
        <Box p={2}>
          <Box width="250px">
            {/* <Autocomplete
              fullWidth
              size="small"
              disabled={salesFilter.allEntity}
              options={entities}
              autoHighlight
              value={salesFilter.entity}
              getOptionLabel={(option) => option.name || ''}
              getOptionSelected={(option, val) => (option ? option.name === val.name : false)}
              onChange={(_, val) => {
                setSalesFilter({ ...salesFilter, entity: val });
              }}
              renderInput={(params) => <TextField {...params} label="Entity" variant="outlined" />}
            /> */}
            <Box mt={1} />
            <Autocomplete
              size="small"
              fullWidth
              options={salesReps}
              autoHighlight
              value={currentFilter === "sale" ? filter.salesRep : filterBookedValue.salesRep}
              getOptionLabel={(option: any) => option.name || ''}
              getOptionSelected={(option, val) => (option ? option.name === val.name : false)}
              onChange={(_, val) => {
                currentFilter === "sale" ?
                  setFilter({ ...filter, salesRep: val })
                  : setFilterBookedValue({ ...filterBookedValue, salesRep: val });
              }}
              renderInput={(params) => <TextField {...params} label="Sales Rep" variant="outlined" />}
            />
            <Box mt={1} />
            <Autocomplete
              size="small"
              fullWidth
              options={customerAccounts}
              autoHighlight
              value={currentFilter === "sale" ? filter.customerAccount : filterBookedValue.customerAccount}
              getOptionLabel={(option: any) => option.name || ''}
              getOptionSelected={(option, val) => (option ? option.name === val.name : false)}
              onChange={(_, val) => {
                let data = currentFilter === "sale" ? { ...filter, customerAccount: val } : { ...filterBookedValue, customerAccount: val }
                if (val?.countryBillTo) {
                  let foundCountry = Countries.find(o => o.optionValue === val?.countryBillTo)
                  if (foundCountry) {
                    data.countryBillTo = foundCountry
                  }
                }
                if (val?.countrySellTo) {
                  let foundCountry = Countries.find(o => o.optionValue === val?.countrySellTo)
                  if (foundCountry) {
                    data.countrySellTo = foundCountry
                  }
                }
                currentFilter === "sale" ?
                  setFilter({ ...data })
                  : setFilterBookedValue({ ...data })
              }}
              renderInput={(params) => <TextField {...params} label="Customer Account" variant="outlined" />}
            />
            <Box mt={1} />
            <Autocomplete
              size="small"
              fullWidth
              options={marketSegments.filter(d => !d.parentSegment)}
              autoHighlight
              value={currentFilter === "sale" ? filter.marketSegment : filterBookedValue.marketSegment}
              getOptionLabel={(option: any) => option.name || ''}
              getOptionSelected={(option, val) => (option ? option.name === val.name : false)}
              onChange={(_, val) => {
                currentFilter === "sale" ?
                  setFilter({ ...filter, marketSegment: val })
                  : setFilterBookedValue({ ...filterBookedValue, marketSegment: val });
                if (val) {
                  setSubMarketSegments(marketSegments.filter((d) => d?.parentSegment === val?.id));
                } else {
                  setSubMarketSegments([]);
                }
              }}
              renderInput={(params) => <TextField {...params} label="Market Segment" variant="outlined" />}
            />
            <Box mt={1} />
            <Autocomplete
              size="small"
              fullWidth
              options={subMarketSegments}
              autoHighlight
              value={currentFilter === "sale" ? filter.subMarketSegment : filterBookedValue.subMarketSegment}
              getOptionLabel={(option: any) => option.name || ''}
              getOptionSelected={(option, val) => (option ? option.name === val.name : false)}
              onChange={(_, val) => currentFilter === "sale" ?
                setFilter({ ...filter, subMarketSegment: val })
                : setFilterBookedValue({ ...filterBookedValue, subMarketSegment: val })}
              renderInput={(params) => <TextField {...params} label="Sub-Market Segment" variant="outlined" />}
            />
            <Box mt={1} />
            <Autocomplete
              size="small"
              fullWidth
              options={productCategory}
              autoHighlight
              value={currentFilter === "sale" ? filter.productCategory : filterBookedValue.productCategory}
              getOptionLabel={(option) => option.name || ''}
              getOptionSelected={(option, val) => (option ? option.name === val.name : false)}
              onChange={(_, val) => currentFilter === "sale" ?
                setFilter({ ...filter, productCategory: val })
                : setFilterBookedValue({ ...filterBookedValue, productCategory: val })}
              renderInput={(params) => <TextField {...params} label="Product Category" variant="outlined" />}
            />
            <Box mt={1} />

            <Autocomplete
              size="small"
              fullWidth
              options={Countries}
              autoHighlight
              value={currentFilter === "sale" ? filter.countrySellTo : filterBookedValue.countrySellTo}
              getOptionLabel={(option: any) => option.optionLabel || ''}
              getOptionSelected={(option, val) => (option ? option.optionValue === val.optionValue : false)}
              onChange={(_, val) => currentFilter === "sale" ?
                setFilter({ ...filter, countrySellTo: val })
                : setFilterBookedValue({ ...filterBookedValue, countrySellTo: val })}
              renderInput={(params) => <TextField {...params} label="Country Sell To" variant="outlined" />}
            />
            <Box mt={1} />

            <Autocomplete
              size="small"
              fullWidth
              options={Countries}
              autoHighlight
              value={currentFilter === "sale" ? filter?.countryBillTo : filterBookedValue?.countryBillTo}
              getOptionLabel={(option: any) => option.optionLabel || ''}
              getOptionSelected={(option, val) => (option ? option.optionValue === val.optionValue : false)}
              onChange={(_, val) => currentFilter === "sale" ?
                setFilter({ ...filter, countryBillTo: val })
                : setFilterBookedValue({ ...filterBookedValue, countryBillTo: val })}
              renderInput={(params) => <TextField {...params} label="Country Bill To" variant="outlined" />}
            />
          </Box>
        </Box>
      </Popover>
      <Grid item xs={12} sm={12} md={12} lg={8}>
        <Grid item xs={12} sm={4} md={2}>
          <Button
            onClick={(event) => {
              handleClickFilter(event)
              setCurrentFilter("sale")
            }}
            color="primary"
            endIcon={<FilterList />}>
            Filters
          </Button>
        </Grid>
        <Box mb={2}>
          <Grid container spacing={2} alignItems="stretch">
            <Grid item md={3} sm={6} xs={12}>
              <Paper>
                <Box p={2} textAlign="center">
                  <Grid container>
                    {/* <Grid item xs={3} sm={3} md={2} className="d-flex align-items-center" justifyContent="center">
                      <img alt="image" className={styles.state_img} src={SVG("booked_value")}></img>
                    </Grid> */}
                    <Grid item xs={12} className="pull-left">
                      {!loadingChart ? (
                        <Typography className={styles.price}>
                          {salesRevenue.revenue ? formatAmountWithCurrency(filterCurrency || currency, salesRevenue.revenue).fullFormatAmount : 0}
                        </Typography>
                      ) : (
                        <Skeleton variant="text" width={100} height={40} />
                      )}
                      <Typography variant="h6" className={styles.title}>
                        Total Offered Value
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
            </Grid>
            <Grid item md={3} sm={6} xs={12}>
              <Paper>
                <Box p={2} textAlign="center">
                  <Grid container>
                    {/* <Grid item xs={3} sm={3} md={2} className="d-flex align-items-center" justifyContent="center">
                      <img alt="image" className={styles.state_img} src={SVG("total_cost")}></img>
                    </Grid> */}
                    <Grid item xs={12} className="pull-left">
                      {!loadingChart ? (
                        <Typography className={styles.price}>
                          {salesRevenue.spend ? formatAmountWithCurrency(filterCurrency || currency, salesRevenue.spend).fullFormatAmount : 0}
                        </Typography>
                      ) : (
                        <Skeleton variant="text" width={100} height={40} />
                      )}
                      <Typography variant="h6" className={styles.title}>
                        Total Cost
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
            </Grid>
            <Grid item md={3} sm={6} xs={12}>
              <Paper>
                <Box p={2} textAlign="center">
                  <Grid container>
                    {/* <Grid item xs={3} sm={3} md={2} className="d-flex align-items-center" justifyContent="center">
                      <img alt="image" className={styles.state_img} src={SVG("profit")}></img>
                    </Grid> */}
                    <Grid item xs={12} className="pull-left">
                      {!loadingChart ? (
                        <Typography className={styles.price}>
                          {`${salesRevenue?.profitValue ? formatAmountWithCurrency(filterCurrency || currency, salesRevenue?.profitValue).fullFormatAmount : 0} (${salesRevenue.profit}%)`}
                        </Typography>
                      ) : (
                        <Skeleton variant="text" width={100} height={40} />
                      )}
                      <Typography variant="h6" className={styles.title}>
                        Gross Margin
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
            </Grid>
            <Grid item md={3} sm={6} xs={12}>
              <Paper>
                <Box p={2} textAlign="center">
                  <Grid container>
                    {/* <Grid item xs={3} sm={3} md={2} className="d-flex align-items-center" justifyContent="center">
                      <img alt="image" width="30px" className={styles.state_img} src={SVG("profit")}></img>
                    </Grid> */}
                    <Grid item xs={12} className="pull-left">
                      {!loadingChart ? (
                        <Typography className={styles.price}>
                          {`${Number(totalValueMT?.qty || 0).toFixed(2)}`}
                        </Typography>
                      ) : (
                        <Skeleton variant="text" width={100} height={40} />
                      )}
                      <Typography variant="h6" className={styles.title}>
                        {`Total Booked Volume in ${totalValueMT?.unit ?? "MT"}`}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        <Paper elevation={2}>
          <Box p={2}>
            <Box display="flex" justifyContent="space-between">
              <Button
                onClick={(event) => {
                  handleClickFilter(event)
                  setCurrentFilter("bookedValue")
                }}
                color="primary"
                endIcon={<FilterList />}>
                Filters
              </Button>
              <Button onClick={handleClickChart} startIcon={<ImportExport />}>
                Export to
              </Button>
              <Button
                onClick={() => {
                  setTableView(!tableView);
                }}
                startIcon={!tableView ? <TableChart /> : <Timeline />}
              >
                {!tableView ? 'Table' : 'Chart'} View
              </Button>
              {
              <Menu id="export-chart-menu" anchorEl={anchorElChart} keepMounted open={Boolean(anchorElChart)} onClose={handleCloseChart('')}>
                {!tableView && 
                <>                
                  <MenuItem onClick={handleCloseChart('ppt')}>Powerpoint</MenuItem>
                  <MenuItem onClick={handleCloseChart('pdf')}>PDF</MenuItem>
                </>
                }
                <MenuItem onClick={handleCloseChart('excel')}>Excel</MenuItem>
                <MenuItem onClick={handleCloseChart('json')}>Raw JSON</MenuItem>
              </Menu>
              }
            </Box>
            <Box textAlign="center" mb={2}>
              <Typography variant="h5">Total Booked value in {filterCurrency || currency} vs Budget</Typography>
            </Box>
            {!loadingChart ? tableDataRaw.length === 0 ? <Box height={400}>No Data</Box> : (
              <Box>
                {!tableView ? (
                  <Chart
                    id="perEntityChart"
                    options={{
                      tooltip: {
                        mode: 'index',
                        intersect: false
                      },
                      hover: {
                        mode: 'index',
                        intersect: false
                      }
                    }}
                    type="bar"
                    data={salesData}
                  />
                ) : (
                  <TableContainer style={{ height: '400px' }} >
                    <Table stickyHeader aria-label="caption table">
                      <TableHead>
                        <TableRow>
                          {Object.keys(tableDataRaw[0]).map((label, i) => (
                            <TableCell key={label} align={i < 1 ? 'left' : 'right'}>
                              {startCase(label)}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {tableDataRaw.map((data, index) => (
                          <TableRow key={index}>
                            {Object.keys(data).map((label, i) => (
                              <TableCell key={label} align={i < 1 ? 'left' : 'right'}>
                                {(i < 1 || data[label] === 0) ? data[label] : formatAmountWithCurrency(filterCurrency || currency, data[label]).fullFormatAmount}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            ) : (
              <Loader minHeight={350} text="Loading..." />
            )}
          </Box>
        </Paper>
      </Grid>
      <Grid item xs={12} sm={12} md={12} lg={4}>
        <TopDashboardTable
          moment={moment}
          filterCurrency={filterCurrency}
          currency={currency}
          getExchangeRates={getExchangeRates}
          salesReps={salesReps}
          salesFilter={salesFilter}
          productCategory={productCategory}
          customerAccounts={customerAccounts}
          marketSegments={marketSegments} />
      </Grid>
    </Grid>
  );
};

export default TopDashboard;
