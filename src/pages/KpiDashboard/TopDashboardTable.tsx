import { useState, useEffect } from 'react';
import { Box, Paper, Typography, Table, TableBody, TableContainer, TableRow, TableCell, TableHead, Button, Menu, MenuItem } from '@material-ui/core';
import { ImportExport } from '@material-ui/icons';
import { startCase } from 'lodash';
import PptxGenJs from 'pptxgenjs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';
import { utils, write } from 'xlsx';

import axiosInstance from '../../axios/axiosInstance';
import { formatAmountWithCurrency } from '../../constants/helpers';
import { makeStyles } from '@material-ui/core/styles';
import { Skeleton } from '@material-ui/lab';
import { useData } from '../../StateProvider/Provider';

const useStyles = makeStyles((theme) => ({
  regionTable: {
    width: "100%",
    height: '625px',
    [theme.breakpoints.down('xs')]: {
      height: 'auto'
    }
  }
}));

const TopDashboardTable = ({ moment, filterCurrency, currency, getExchangeRates }) => {
  const {
    state: { selectedEntity }
  } = useData();
  const classes = useStyles();
  const [anchorElTable, setAnchorElTable] = useState(null);
  const [regionSales, setRegionSales] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRegionalSalesData = () => {
    setLoading(true);
    axiosInstance()
      .get('dashboard/regionalsales')
      .then(async ({ data: { data } }) => {    
        data = data.sort((a, b) => b.totalSell - a.totalSell);
        let regionSalesData = [];
        for (const d of data) {
          let totalBookedValue = 0;
          if (d.totalSell && filterCurrency && filterCurrency !== currency) {
            const rateData = await getExchangeRates(moment().format('YYYY-MM-DD'), d.totalSell);
            totalBookedValue = rateData.rates[filterCurrency];
          } else {
            totalBookedValue = d.totalSell;
          }
          regionSalesData.push({ region: d.region, totalBookedValue });
        }
        setRegionSales(regionSalesData);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRegionalSalesData();
  }, [filterCurrency, selectedEntity]);

  const handleClickTable = (event) => {
    setAnchorElTable(event.currentTarget);
  };

  const handleCloseTable = (exportType) => () => {
    switch (exportType) {
      case 'ppt': {
        const pptx = new PptxGenJs();
        let cell1 = regionSales.map((r) => ({
          text: `${r.region}\n`
          // options: {color: "#333"}
        }));
        let cell2 = regionSales.map((r) => ({
          text: `${r.totalBookedValue}\n`
          // options: {color: "#333"}
        }));
        const slide = pptx.addSlide();
        slide.addTable([[{ text: cell1 }, { text: cell2 }]], {
          x: 0.5,
          y: 0.5,
          w: 6,
          h: 3,
          fontSize: 14,
          border: { pt: 1 },
          fill: { color: 'f1f1f1' }
        });

        pptx.writeFile({ fileName: 'Regional Sales.pptx' });
        break;
      }

      case 'pdf': {
        const doc = new jsPDF('portrait');

        doc.setFontSize(16);
        doc.text(`Sales Data By Region`, 70, 10);

        let col = ['Region', 'Total Offered Value'];
        let row = [];

        if (regionSales && regionSales.length) {
          regionSales.forEach((el) => {
            let bookedValue = el.totalBookedValue ? formatAmountWithCurrency(filterCurrency || currency, el.totalBookedValue).fullFormatAmount : 0;
            let temp = [el.region, bookedValue];

            row.push(temp);
          });

          //@ts-ignore
          doc.autoTable(col, row, { startY: 20 });
        } else {
          doc.setFontSize(16);
          doc.text(`No Data`, 60, 15);
        }
        doc.save('Regional Sales.pdf');
        break;
      }

      case 'excel': {
        const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        const fileExtension = '.xlsx';
        const ws = utils.json_to_sheet(regionSales);
        const wb = {
          Sheets: {
            data: ws
          },
          SheetNames: ['data']
        };
        const excelBuffer = write(wb, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: fileType });
        saveAs(data, 'Regional Sales' + fileExtension);
        break;
      }

      case 'json': {
        let blob = new Blob([JSON.stringify(regionSales)], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, 'Regional Sales.json');
        break;
      }
      default:
        break;
    }

    setAnchorElTable(null);
  };

  return (
    <div>
      <Button onClick={handleClickTable} startIcon={<ImportExport />}>
        Export to
      </Button>
      <Menu id="export-table-menu" anchorEl={anchorElTable} keepMounted open={Boolean(anchorElTable)} onClose={handleCloseTable('')}>
        <MenuItem onClick={handleCloseTable('ppt')}>Powerpoint</MenuItem>
        <MenuItem onClick={handleCloseTable('pdf')}>PDF</MenuItem>
        <MenuItem onClick={handleCloseTable('excel')}>Excel</MenuItem>
        <MenuItem onClick={handleCloseTable('json')}>Raw JSON</MenuItem>
      </Menu>
      <Box>
        <TableContainer className={classes.regionTable} component={Paper}>
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
              {regionSales.length > 0 && !loading ? (
                regionSales.map((data) => (
                  <TableRow key={data.region}>
                    {Object.keys(data).map((label, i) => (
                      <TableCell key={label} align={i < 1 ? 'left' : 'right'}>
                        {i < 1 ? data[label] : formatAmountWithCurrency(filterCurrency || currency, data[label].toFixed(2)).fullFormatAmount}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <Box p={2}>
                  {loading ? (
                    [...Array(10).keys()].map((_, i) => (
                      <Box component="span" m={1} key={i}>
                        <Skeleton variant="text" width="300px" />
                      </Box>
                    ))
                  ) : (
                    <Typography>No Data for regional sales</Typography>
                  )}
                </Box>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </div>
  );
};

export default TopDashboardTable;
