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
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';

import { formatAmountWithCurrency } from '../../constants/helpers';
import axiosInstance from '../../axios/axiosInstance';
import Loader from '../../components/Loader';
import TopDashboardTable from './TopDashboardTable';
import { Skeleton } from '@material-ui/lab';

const TopDashboard = (props) => {
  const { moment, currency, filterCurrency, salesFilter, getExchangeRates, setCurrency } = props;
  const [anchorElChart, setAnchorElChart] = useState(null);

  const [tableView, setTableView] = useState(false);
  const [loadingChart, setLoadingChart] = useState(false);
  const [tableDataRaw, setTableDataRaw] = useState([]);
  const [salesRevenue, setSalesRevenue] = useState({
    revenue: 0,
    spend: 0,
    profit: 0
  });

  const [salesData, setSalesData] = useState({
    labels: [],
    datasets: [],
    allData: []
  });

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

            saleData.push(d.totalSell ? totalSelldata.rates[filterCurrency] : d.totalSell);
            costData.push(d.totalCost ? totalCostData.rates[filterCurrency] : d.totalCost);
            budget.push(d.budget ? budgetData.rates[filterCurrency] : d.budget);
          } else {
            saleData.push(d.totalSell);
            costData.push(d.totalCost);
            budget.push(d.budget);

            console.log('NO Currency Selected');
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

        if (filterCurrency !== currency) {
          revenueRate = revenue ? await getExchangeRates(moment().format('YYYY-MM-DD'), revenue) : 0;
          spendRate = spend ? await getExchangeRates(moment().format('YYYY-MM-DD'), spend) : 0;
        }

        setSalesRevenue({
          revenue: revenueRate ? revenueRate.rates[filterCurrency] : revenue,
          spend: spendRate ? spendRate.rates[filterCurrency] : spend,
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
        setLoadingChart(false);
      })
      .catch((err) => {
        setLoadingChart(false);
      });
  }, [salesFilter, filterCurrency]);

  useEffect(() => {
    fetchSalesData();
  }, [fetchSalesData]);

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
        doc.text(`Total Booked Value In ${currency}`, 60, 15);
        doc.addImage(dataUrl, 'JPEG', 10, 20, 190, 100);
        doc.save('Entity Sales Chart.pdf');
        break;
      }

      case 'excel': {
        // const canvas = document.getElementById('perEntityChart') as HTMLCanvasElement;
        // const dataUrl = canvas.toDataURL('image/png', 1.0);
        const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        const fileExtension = '.xlsx';
        const ws = XLSX.utils.json_to_sheet(tableDataRaw);
        const wb = {
          Sheets: {
            data: ws
          },
          SheetNames: ['data']
        };
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: fileType });
        FileSaver.saveAs(data, 'Entity Sales Chart' + fileExtension);
        break;
      }

      case 'json': {
        let blob = new Blob([JSON.stringify(tableDataRaw)], { type: 'text/plain;charset=utf-8' });
        FileSaver.saveAs(blob, 'Entity Sales Chart.json');
        break;
      }
      default:
        break;
    }

    setAnchorElChart(null);
  };

  return (
    <Grid container spacing={2}>
      <Grid item sm={8}>
        <Box mb={2}>
          <Grid container spacing={2} alignItems="stretch">
            <Grid item xs={4}>
              <Paper>
                <Box p={2} flexDirection="column" display="flex" alignItems="center" textAlign="center">
                  <Typography variant="h6" color="textSecondary">
                    Total Booked Value
                  </Typography>
                  {!loadingChart ? (
                    <Typography variant="h5" color="textPrimary">
                      {salesRevenue.revenue ? formatAmountWithCurrency(filterCurrency || currency, salesRevenue.revenue).fullFormatAmount : 0}
                    </Typography>
                  ) : (
                    <Skeleton variant="text" width={200} height={40} />
                  )}
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={4}>
              <Paper>
                <Box p={2} flexDirection="column" display="flex" alignItems="center" textAlign="center">
                  <Typography variant="h6" color="textSecondary">
                    Total Cost
                  </Typography>
                  {!loadingChart ? (
                    <Typography variant="h5" color="textPrimary">
                      {salesRevenue.spend ? formatAmountWithCurrency(filterCurrency || currency, salesRevenue.spend).fullFormatAmount : 0}
                    </Typography>
                  ) : (
                    <Skeleton variant="text" width={200} height={40} />
                  )}
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={4}>
              <Paper>
                <Box p={2} textAlign="center" flexDirection="column" display="flex" alignItems="center">
                  <Typography variant="h6" color="textSecondary">
                    Profits
                  </Typography>
                  {!loadingChart ? (
                    <Typography variant="h5" color="textPrimary">
                      {salesRevenue.profit}%
                    </Typography>
                  ) : (
                    <Skeleton variant="text" width={200} height={40} />
                  )}
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
              <Typography variant="h5">Total booked value in {filterCurrency || currency}</Typography>
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
      <Grid item sm={4}>
        <TopDashboardTable moment={moment} filterCurrency={filterCurrency} currency={currency} getExchangeRates={getExchangeRates} />
      </Grid>
    </Grid>
  );
};

export default TopDashboard;
