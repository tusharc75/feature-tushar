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
  MenuItem
} from '@material-ui/core';
import { ImportExport, TableChart, Timeline } from '@material-ui/icons';
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
import { Skeleton } from '@material-ui/lab';


const TopDashboard = (props) => {
  const { moment, currency, filterCurrency, selectedEntity, salesFilter, getExchangeRates, setCurrency } = props;
  const [anchorElChart, setAnchorElChart] = useState(null);

  const [tableView, setTableView] = useState(false);
  const [loadingChart, setLoadingChart] = useState(false);
  const [tableDataRaw, setTableDataRaw] = useState([]);
  const [salesRevenue, setSalesRevenue] = useState({
    revenue: 0,
    spend: 0,
    profit: 0,
    profitValue: 0,
    totalValueMT: 0
  });

  const [salesData, setSalesData] = useState({
    labels: [],
    datasets: [],
    allData: []
  });

  const fetchSalesData = useCallback(() => {
    let params = {
      entity: selectedEntity || "",
      marketSegment: salesFilter.marketSegment ? salesFilter.marketSegment['id'] : '',
      subMarketSegment: salesFilter.subMarketSegment ? salesFilter.subMarketSegment['id'] : '',
      productCategory: salesFilter.productCategory ? salesFilter.productCategory['id'] : '',
      salesRep: salesFilter.salesRep ? salesFilter.salesRep['id'] : '',
      customerAccount: salesFilter.customerAccount ? salesFilter.customerAccount['id'] : '',
      country: salesFilter.country ? salesFilter.country["optionValue"] : '',
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

    setLoadingChart(true);

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

        setSalesData({
          allData: data,
          labels,
          datasets: [
            {
              type: 'line',
              label: 'Total offered value',
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
  }, [salesFilter, filterCurrency, selectedEntity]);

  useEffect(() => {
    fetchSalesData();
  }, [fetchSalesData]);

  useEffect(() => {
    axiosInstance().get("dashboard/total-weight-sold")
      .then(({ data }) => {
        setSalesRevenue({ ...salesRevenue, totalValueMT: data?.data.qty })
      })
      .catch((err) => {

      })
  }, [selectedEntity])

  useEffect(() => {
    const tableD = salesData.allData.map((d) => ({
      Month: moment(d.date).format('MMM/YY'),
      ['Total Sell']: d.totalSell ? d.totalSell.toLocaleString() : 0,
      ['Total Cost']: d.totalSell ? d.totalCost.toLocaleString() : 0,
      Budget: d.budget ? d.budget.toLocaleString() : 0
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

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={12} md={12} lg={8}>
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
                          {`${salesRevenue?.totalValueMT.toFixed(2)}`}
                        </Typography>
                      ) : (
                        <Skeleton variant="text" width={100} height={40} />
                      )}
                      <Typography variant="h6" className={styles.title}>
                        Total Offered Value in MT
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
              <Menu id="export-chart-menu" anchorEl={anchorElChart} keepMounted open={Boolean(anchorElChart)} onClose={handleCloseChart('')}>
                <MenuItem onClick={handleCloseChart('ppt')}>Powerpoint</MenuItem>
                <MenuItem onClick={handleCloseChart('pdf')}>PDF</MenuItem>
                <MenuItem onClick={handleCloseChart('excel')}>Excel</MenuItem>
                <MenuItem onClick={handleCloseChart('json')}>Raw JSON</MenuItem>
              </Menu>
            </Box>
            <Box textAlign="center" mb={2}>
              <Typography variant="h5">Total offered value in {filterCurrency || currency} vs Budget</Typography>
            </Box>
            {!loadingChart ? (
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
                  <TableContainer style={{ height: '400px' }}>
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
                                {data[label].toLocaleString()}
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
        <TopDashboardTable moment={moment} filterCurrency={filterCurrency} currency={currency} getExchangeRates={getExchangeRates} />
      </Grid>
    </Grid>
  );
};

export default TopDashboard;
