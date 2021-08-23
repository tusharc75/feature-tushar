import { useState } from 'react';
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
import { ImportExport } from '@material-ui/icons';
import { startCase } from 'lodash';
import Chart from 'react-chartjs-2';
import PptxGenJs from 'pptxgenjs';
import jsPDF from 'jspdf';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';
import moment from 'moment';

const TopDashboard = (props) => {
  const { salesRevenue, salesData, regionSales } = props;
  const [anchorEl, setAnchorEl] = useState(null);

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
        doc.text('Total Booked Value In USD', 60, 15);
        doc.addImage(dataUrl, 'JPEG', 10, 20, 190, 100);
        doc.save('sales-chart.pdf');
        break;
      }

      case 'excel': {
        const canvas = document.getElementById('perEntityChart') as HTMLCanvasElement;
        const dataUrl = canvas.toDataURL('image/png', 1.0);
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
                    ${salesRevenue.revenue?.toLocaleString()}
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
                    ${salesRevenue.spend?.toLocaleString()}
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
            <Button onClick={handleClick} startIcon={<ImportExport />}>
              Export to
            </Button>
            <Menu id="export-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleClose('')}>
              <MenuItem onClick={handleClose('ppt')}>Powerpoint</MenuItem>
              <MenuItem onClick={handleClose('pdf')}>PDF</MenuItem>
              <MenuItem onClick={handleClose('excel')}>Excel</MenuItem>
            </Menu>
            <Box textAlign="center">
              <Typography variant="h5">Total booked value in USD</Typography>
            </Box>
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
          </Box>
        </Paper>
      </Grid>
      <Grid item sm={4}>
        <Box>
          <TableContainer style={{ height: '500px' }} component={Paper}>
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
