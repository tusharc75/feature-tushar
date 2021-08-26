import { useState, useEffect } from 'react';
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
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';

import { formatAmountWithCurrency } from '../../constants/helpers';

const TopDashboard = (props) => {
  const { salesRevenue, salesData, regionSales, moment, currency } = props;
  const [anchorEl, setAnchorEl] = useState(null);
  const [tableView, setTableView] = useState(false);
  const [tableDataRaw, setTableDataRaw] = useState([]);

  useEffect(() => {
    const tableD = salesData.allData.map((d) => ({
      Month: moment(d.date).format('MMM/YY'),
      ['Total Sell']: d.totalSell.toLocaleString(),
      ['Total Cost']: d.totalCost.toLocaleString(),
      Budget: d.budget
    }));
    setTableDataRaw(tableD);
  }, [salesData]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (exportType) => () => {
    switch (exportType) {
      case 'ppt': {
        const canvas = document.getElementById('perEntityChart') as HTMLCanvasElement;
        const dataUrl = canvas.toDataURL('image/png');
        const pptx = new PptxGenJs();
        const slide = pptx.addSlide();
        slide.addImage({ data: dataUrl, w: '80%', h: '80%', x: '10%', y: '15%' });
        pptx.writeFile();
        break;
      }

      case 'pdf': {
        const canvas = document.getElementById('perEntityChart') as HTMLCanvasElement;
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        const doc = new jsPDF('portrait');
        doc.setFontSize(20);
        doc.text(`Total Booked Value In ${currency}`, 60, 15);
        doc.addImage(dataUrl, 'JPEG', 10, 20, 190, 100);
        doc.save('sales-chart.pdf');
        break;
      }

      case 'excel': {
        // const canvas = document.getElementById('perEntityChart') as HTMLCanvasElement;
        // const dataUrl = canvas.toDataURL('image/png', 1.0);
        const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        const fileExtension = '.xlsx';
        const wData = salesData.allData.map((d) => ({
          Month: moment(d.date).format('MMM/YY'),
          ['Total Sell']: d.totalSell.toLocaleString(),
          ['Total Cost']: d.totalCost.toLocaleString(),
          Budget: d.budget
        }));
        const ws = XLSX.utils.json_to_sheet(wData);
        const wb = {
          Sheets: {
            data: ws
          },
          SheetNames: ['data']
        };
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: fileType });
        FileSaver.saveAs(data, 'sales-data' + fileExtension);
        break;
      }

      case 'json': {
        let blob = new Blob([JSON.stringify(tableDataRaw)], { type: 'text/plain;charset=utf-8' });
        FileSaver.saveAs(blob, 'sales.json');
        break;
      }
      default:
        break;
    }

    setAnchorEl(null);
  };

  return (
    <Grid container spacing={2}>
      <Grid item sm={8}>
        <Box mb={2}>
          <Grid container spacing={2} alignItems="stretch">
            <Grid item xs={4}>
              <Paper>
                <Box p={2} textAlign="center">
                  <Typography variant="h6" color="textSecondary">
                    Total Booked Value
                  </Typography>
                  <Typography variant="h5" color="textPrimary">
                    {salesRevenue.revenue ? formatAmountWithCurrency(currency, salesRevenue.revenue).fullFormatAmount : 0}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={4}>
              <Paper>
                <Box p={2} textAlign="center">
                  <Typography variant="h6" color="textSecondary">
                    Total Cost
                  </Typography>
                  <Typography variant="h5" color="textPrimary">
                    {salesRevenue.spend ? formatAmountWithCurrency(currency, salesRevenue.spend).fullFormatAmount : 0}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={4}>
              <Paper>
                <Box p={2} textAlign="center">
                  <Typography variant="h6" color="textSecondary">
                    Profits
                  </Typography>
                  <Typography variant="h5" color="textPrimary">
                    {salesRevenue.profit}%
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        <Paper elevation={2}>
          <Box p={2}>
            <Box display="flex" justifyContent="space-between">
              <Button onClick={handleClick} startIcon={<ImportExport />}>
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
              <Menu id="export-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleClose('')}>
                <MenuItem onClick={handleClose('ppt')}>Powerpoint</MenuItem>
                <MenuItem onClick={handleClose('pdf')}>PDF</MenuItem>
                <MenuItem onClick={handleClose('excel')}>Excel</MenuItem>
                <MenuItem onClick={handleClose('json')}>Raw JSON</MenuItem>
              </Menu>
            </Box>
            <Box textAlign="center" mb={2}>
              <Typography variant="h5">Total booked value in {currency}</Typography>
            </Box>
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
              <TableContainer style={{ height: '400px' }} component={Paper}>
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
        </Paper>
      </Grid>
      <Grid item sm={4}>
        <Box>
          <TableContainer style={{ height: '625px' }} component={Paper}>
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
                          {i < 1 ? data[label] : formatAmountWithCurrency(currency, data[label]).fullFormatAmount}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <Box p={2}>
                    <Typography>No Data for regional sales</Typography>
                  </Box>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Grid>
    </Grid>
  );
};

export default TopDashboard;
