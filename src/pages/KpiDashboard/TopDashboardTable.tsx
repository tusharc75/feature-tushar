import { useState, useEffect } from 'react';
import { Box, Paper, Typography, Table, TableBody, TableContainer, TableRow, TableCell, TableHead, Button, Menu, MenuItem, Popover, TextField, FormControl, Grid, InputLabel, Select } from '@material-ui/core';
import { FilterList, ImportExport } from '@material-ui/icons';
import { filter, startCase } from 'lodash';
import PptxGenJs from 'pptxgenjs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';
import { utils, write } from 'xlsx';

import axiosInstance from '../../axios/axiosInstance';
import { dateFormatForInputControl, formatAmountWithCurrency } from '../../constants/helpers';
import { makeStyles } from '@material-ui/core/styles';
import { Autocomplete, Skeleton } from '@material-ui/lab';
import { useData } from '../../StateProvider/Provider';
import { KeyboardDatePicker } from 'formik-material-ui-pickers';

const useStyles = makeStyles((theme) => ({
  regionTable: {
    width: "100%",
    height: '625px',
    [theme.breakpoints.down('xs')]: {
      height: 'auto'
    }
  }
}));

const TopDashboardTable = ({ moment, filterCurrency, currency, getExchangeRates, productCategory, salesReps, customerAccounts, marketSegments }) => {
  const {
    state: { selectedEntity }
  } = useData();
  const classes = useStyles();
  const [anchorElTable, setAnchorElTable] = useState(null);
  const [regionSales, setRegionSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [openFilter, setOpenFilter] = useState(false);
  const [filter, setFilter] = useState({
    marketSegment: {},
    salesRep: {},
    customerAccount: {},
    subMarketSegment: {},
    productCategory: {},
    between: {
      from: new Date(moment().subtract(1, 'year').calendar()),
      to: new Date()
    },
    countrySellTo: {},
    countryBillTo: {}
  });
  const [subMarketSegments, setSubMarketSegments] = useState([]);

  const getURL = () => {
    let params = {
      entity: selectedEntity || "",
      marketSegment: filter.marketSegment ? filter.marketSegment['id'] : '',
      subMarketSegment: filter.subMarketSegment ? filter.subMarketSegment['id'] : '',
      productCategory: filter.productCategory ? filter.productCategory['id'] : '',
      salesRep: filter.salesRep ? filter.salesRep['id'] : '',
      customerAccount: filter.customerAccount ? filter.customerAccount['id'] : '',
      between: JSON.stringify({
        from: new Date(filter.between.from).toISOString().split('T')[0],
        to: new Date(filter.between.to).toISOString().split('T')[0]
      })
    };

    let url = '?';

    for (const k of Object.keys(params)) {
      if (params[k]) {
        if (k === 'between' && filter.between.from && filter.between.to) {
          url = `${url}${k}=${params[k]}&`;
        }
        if (k !== 'between') {
          url = `${url}${k}=${params[k]}&`;
        }
      }
    }
    return url
  }

  const fetchRegionalSalesData = () => {
    setLoading(true);
    let url = getURL()
    axiosInstance()
      .get(`dashboard/regionalsales${url}`)
      .then(async ({ data: { data } }) => {
        data = data.sort((a, b) => b.totalSell - a.totalSell);
        let regionSalesData = [];

        for (const d of data) {
          let totalBookedValue = 0;
          if (d.totalSell && filterCurrency !== currency) {
            const rateData = await getExchangeRates(moment().format('YYYY-MM-DD'), d.totalSell);
            totalBookedValue = rateData?.rates[filterCurrency] || d.totalSell;
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
  }, [filterCurrency, filter, selectedEntity]);

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

        let col = ['Region', 'Total Booked value By Region'];
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


  const handleClickFilter = (event) => {
    setFilterAnchor(event.currentTarget);
    setOpenFilter((prev) => !prev);
  };

  return (
    <div>
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
              disabled={filter.allEntity}
              options={entities}
              autoHighlight
              value={filter.entity}
              getOptionLabel={(option) => option.name || ''}
              getOptionSelected={(option, val) => (option ? option.name === val.name : false)}
              onChange={(_, val) => {
                setFilter({ ...filter, entity: val });
              }}
              renderInput={(params) => <TextField {...params} label="Entity" variant="outlined" />}
            /> */}
            <Box mt={1} />
            <Autocomplete
              size="small"
              fullWidth
              options={salesReps}
              autoHighlight
              value={filter.salesRep}
              getOptionLabel={(option: any) => option.name || ''}
              getOptionSelected={(option, val) => (option ? option.name === val.name : false)}
              onChange={(_, val) => {
                setFilter({ ...filter, salesRep: val });
              }}
              renderInput={(params) => <TextField {...params} label="Sales Rep" variant="outlined" />}
            />
            <Box mt={1} />
            <Autocomplete
              size="small"
              fullWidth
              options={customerAccounts}
              autoHighlight
              value={filter.customerAccount}
              getOptionLabel={(option: any) => option.name || ''}
              getOptionSelected={(option, val) => (option ? option.name === val.name : false)}
              onChange={(_, val) => {
                let data = { ...filter, customerAccount: val }
                setFilter({ ...data });
              }}
              renderInput={(params) => <TextField {...params} label="Customer Account" variant="outlined" />}
            />
            <Box mt={1} />
            <Autocomplete
              size="small"
              fullWidth
              options={marketSegments}
              autoHighlight
              value={filter.marketSegment}
              getOptionLabel={(option: any) => option.name || ''}
              getOptionSelected={(option, val) => (option ? option.name === val.name : false)}
              onChange={(_, val) => {
                setFilter({ ...filter, marketSegment: val });
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
              value={filter.subMarketSegment}
              getOptionLabel={(option: any) => option.name || ''}
              getOptionSelected={(option, val) => (option ? option.name === val.name : false)}
              onChange={(_, val) => setFilter({ ...filter, subMarketSegment: val })}
              renderInput={(params) => <TextField {...params} label="Sub-Market Segment" variant="outlined" />}
            />
            <Box mt={1} />
            <Autocomplete
              size="small"
              fullWidth
              options={productCategory}
              autoHighlight
              value={filter.productCategory}
              getOptionLabel={(option: any) => option.name || ''}
              getOptionSelected={(option, val) => (option ? option.name === val.name : false)}
              onChange={(_, val) => setFilter({ ...filter, productCategory: val })}
              renderInput={(params) => <TextField {...params} label="Product Category" variant="outlined" />}
            />
            <Box mt={1} />
          </Box>
        </Box>
      </Popover>
      <Button onClick={handleClickFilter} color="primary" endIcon={<FilterList />}>
        Filters
      </Button>
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
