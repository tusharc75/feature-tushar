import { useState, useCallback, useEffect } from 'react';
import { Box, Paper, Typography, List, ListItem, ListItemText, ListItemSecondaryAction, MenuItem, Menu, Button, FormControl, InputLabel, Popover, Select, TextField, TableContainer, Table, TableBody, TableCell, TableHead, TableRow } from '@material-ui/core';
import { ToggleButtonGroup, ToggleButton, Autocomplete } from '@material-ui/lab';
import { ImportExport } from '@material-ui/icons';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';
import { utils, write } from 'xlsx';

import { formatAmountWithCurrency } from '../../constants/helpers';
import axiosInstance from '../../axios/axiosInstance';
import { FilterList } from '@material-ui/icons';
import Countries from "../../constants/Country.json"

const OpportunityTable = ({ filterCurrency, currency, salesReps, customerAccounts, marketSegments, selectedEntity, getExchangeRates, moment }) => {
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [anchorElTable, setAnchorElTable] = useState(null);
  const [salesFilterAnchor, setFilterAnchor] = useState(null);
  const [openFilter, setOpenFilter] = useState(false);
  const [subMarketSegments, setSubMarketSegments] = useState([]);

  const [salesFilter, setSalesFilter] = useState({
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

  const fetchTopProducts = useCallback(() => {
    let params = {
      entity: selectedEntity ? selectedEntity : '',
      salesRep: salesFilter.salesRep ? salesFilter.salesRep['id'] : '',
      marketSegment: salesFilter.marketSegment ? salesFilter.marketSegment['id'] : '',
      subMarketSegment: salesFilter.subMarketSegment ? salesFilter.subMarketSegment['id'] : '',
      customerAccount: salesFilter.customerAccount ? salesFilter.customerAccount['id'] : '',
      countrySellTo: salesFilter.countrySellTo ? salesFilter.countrySellTo["optionValue"] : '',
      countryBillTo: salesFilter.countryBillTo ? salesFilter.countryBillTo["optionValue"] : '',
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
    setLoading(true);
    axiosInstance()
      .get(`dashboard/products${url}`)
      .then(async ({ data: { data } }) => {
        data = data
          .map((d) => ({ ...d, productCategory: d.hasOwnProperty('productCategory') ? d.productCategory : 'Unknown' }))
          .sort((a, b) => b.totalSell - a.totalSell);

        let topProductsData = [];

        for (const d of data) {
          let totalSell = 0;
          let totalCost = 0;
          if (d.totalSell && d.totalCost && filterCurrency && filterCurrency !== currency) {
            const sellRateData = await getExchangeRates(moment().format('YYYY-MM-DD'), d.totalSell);
            const costRateData = await getExchangeRates(moment().format('YYYY-MM-DD'), d.totalCost);
            totalSell = sellRateData.rates[filterCurrency];
            totalCost = costRateData.rates[filterCurrency];
          } else {
            totalSell = d.totalSell;
            totalCost = d.totalCost;
          }
          topProductsData.push({ ...d, totalSell, totalCost });
        }

        setTopProducts(topProductsData);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
      });
  }, [selectedEntity, salesFilter, filterCurrency]);

  useEffect(() => {
    fetchTopProducts();
  }, [fetchTopProducts]);

  const handleClickTable = (event) => {
    setAnchorElTable(event.currentTarget);
  };

  const handleCloseTable = (exportType) => () => {
    switch (exportType) {
      case 'ppt': {
        // const pptx = new PptxGenJs();
        // let cell1 = regionSales.map((r) => ({
        //   text: `${r.region}\n`
        //   // options: {color: "#333"}
        // }));
        // let cell2 = regionSales.map((r) => ({
        //   text: `${r.totalBookedValue}\n`
        //   // options: {color: "#333"}
        // }));
        // const slide = pptx.addSlide();
        // slide.addTable([[{ text: cell1 }, { text: cell2 }]], {
        //   x: 0.5,
        //   y: 0.5,
        //   w: 6,
        //   h: 3,
        //   fontSize: 14,
        //   border: { pt: 1 },
        //   fill: { color: 'f1f1f1' }
        // });

        // pptx.writeFile({ fileName: 'Top Selling Products.pptx' });
        break;
      }

      case 'pdf': {
        const doc = new jsPDF('portrait');

        doc.setFontSize(16);
        doc.text(`Top Selling Product Category`, 65, 10);

        let col = ['Product Category', 'Total Sell', 'Total Sell'];
        let row = [];

        if (topProducts && topProducts.length) {
          topProducts.forEach((el) => {
            let totalSell = el.totalSell ? formatAmountWithCurrency(filterCurrency || currency, el.totalSell).fullFormatAmount : 0;
            let totalCost = el.totalCost ? formatAmountWithCurrency(filterCurrency || currency, el.totalCost).fullFormatAmount : 0;
            let temp = [el.productCategory, totalSell, totalCost];

            row.push(temp);
          });

          //@ts-ignore
          doc.autoTable(col, row, { startY: 20 });
        } else {
          doc.setFontSize(16);
          doc.text(`No Data`, 60, 15);
        }
        doc.save('Top Selling Products.pdf');
        break;
      }

      case 'excel': {
        const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        const fileExtension = '.xlsx';
        const ws = utils.json_to_sheet(
          topProducts.map((p) => ({ 'Product Category': p.productCategory, 'Total Sell': p.totalSell, 'Total Cost': p.totalCost }))
        );
        const wb = {
          Sheets: {
            data: ws
          },
          SheetNames: ['data']
        };
        const excelBuffer = write(wb, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: fileType });
        saveAs(data, 'Top Selling Products' + fileExtension);
        break;
      }

      case 'json': {
        let blob = new Blob([JSON.stringify(topProducts)], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, 'Top Selling Products.json');
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
      <Paper>
        <Popover
          open={openFilter}
          anchorEl={salesFilterAnchor}
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
              <Autocomplete
                size="small"
                fullWidth
                options={salesReps}
                autoHighlight
                value={salesFilter.salesRep}
                getOptionLabel={(option: any) => option.name || ''}
                getOptionSelected={(option, val) => (option ? option.name === val.name : false)}
                onChange={(_, val) => {
                  setSalesFilter({ ...salesFilter, salesRep: val });
                }}
                renderInput={(params) => <TextField {...params} label="Sales Rep" variant="outlined" />}
              />
              <Box mt={1} />
              <Autocomplete
                size="small"
                fullWidth
                options={customerAccounts}
                autoHighlight
                value={salesFilter.customerAccount}
                getOptionLabel={(option: any) => option.name || ''}
                getOptionSelected={(option, val) => (option ? option.name === val.name : false)}
                onChange={(_, val) => {
                  let data = { ...salesFilter, customerAccount: val }
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
                  setSalesFilter({ ...data });
                }}
                renderInput={(params) => <TextField {...params} label="Customer Account" variant="outlined" />}
              />
              <Box mt={1} />
              <Autocomplete
                size="small"
                fullWidth
                options={marketSegments}
                autoHighlight
                value={salesFilter.marketSegment}
                getOptionLabel={(option: any) => option.name || ''}
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
              <Box mt={1} />
              <Autocomplete
                size="small"
                fullWidth
                options={subMarketSegments}
                autoHighlight
                value={salesFilter.subMarketSegment}
                getOptionLabel={(option: any) => option.name || ''}
                getOptionSelected={(option, val) => (option ? option.name === val.name : false)}
                onChange={(_, val) => setSalesFilter({ ...salesFilter, subMarketSegment: val })}
                renderInput={(params) => <TextField {...params} label="Sub-Market Segment" variant="outlined" />}
              />
              <Box mt={1} />
              <Autocomplete
                size="small"
                fullWidth
                options={Countries}
                autoHighlight
                value={salesFilter.countrySellTo}
                getOptionLabel={(option: any) => option.optionLabel || ''}
                getOptionSelected={(option, val) => (option ? option.optionValue === val.optionValue : false)}
                onChange={(_, val) => setSalesFilter({ ...salesFilter, countrySellTo: val })}
                renderInput={(params) => <TextField {...params} label="Country Sell To" variant="outlined" />}
              />
              <Box mt={1} />

              <Autocomplete
                size="small"
                fullWidth
                options={Countries}
                autoHighlight
                value={salesFilter?.countryBillTo}
                getOptionLabel={(option: any) => option.optionLabel || ''}
                getOptionSelected={(option, val) => (option ? option.optionValue === val.optionValue : false)}
                onChange={(_, val) => setSalesFilter({ ...salesFilter, countryBillTo: val })}
                renderInput={(params) => <TextField {...params} label="Country Bill To" variant="outlined" />}
              />
            </Box>
          </Box>
        </Popover>
        <Box p={2}>
          <Button
            onClick={handleClickFilter}
            color="primary"
            endIcon={<FilterList />}>
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
          <Box mt={1} />
          <Typography variant="h6" color="textSecondary">
            Top Selling Product Category
          </Typography>
          <Box mt={1} />
        </Box>
        {topProducts.length && !loading ? (
          <TableContainer style={{ height: '400px' }}>
            <Table stickyHeader aria-label="caption table">
              <TableHead>
                <TableRow>
                  {Object.keys(topProducts[0]).reverse().map((label, i) => (
                    <TableCell key={label} align={i < 1 ? 'left' : 'right'}>
                      {label.toUpperCase()}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {topProducts.map((data, index) => (
                  <TableRow key={index}>
                    {Object.keys(data).reverse().map((label, i) => (
                      <TableCell key={label} align={i < 1 ? 'left' : 'right'}>
                        {data[label].toLocaleString()}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>)
          : (
            <Typography variant="h6" color="textSecondary">
              {loading ? 'Loading Data...' : 'No Data'}
            </Typography>
          )}
      </Paper>
    </div>
  );
};

export default OpportunityTable;
