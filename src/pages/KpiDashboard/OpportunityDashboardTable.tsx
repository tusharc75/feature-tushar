import { useState, useCallback, useEffect } from 'react';
import { Box, Paper, Typography, List, ListItem, ListItemText, ListItemSecondaryAction, MenuItem, Menu, Button } from '@material-ui/core';
import { ToggleButtonGroup, ToggleButton } from '@material-ui/lab';
import { ImportExport } from '@material-ui/icons';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';
import { utils, write } from 'xlsx';

import { formatAmountWithCurrency } from '../../constants/helpers';
import axiosInstance from '../../axios/axiosInstance';

const OpportunityTable = ({ filterCurrency, currency, salesFilter, selectedEntity, getExchangeRates, moment }) => {
  const [toggleButtonValue, setToggleButtonValue] = useState('totalSell');
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [anchorElTable, setAnchorElTable] = useState(null);

  const fetchTopProducts = useCallback(() => {
    let params = {
      entity: selectedEntity ? selectedEntity : '',
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
          if (d.totalSell && d.totalCost && filterCurrency !== currency) {
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
  }, [selectedEntity, salesFilter.between, filterCurrency]);

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

  return (
    <div>
      <Paper>
        <Box p={2}>
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
          <ToggleButtonGroup value={toggleButtonValue} exclusive onChange={(e, val) => setToggleButtonValue(val)} size="small">
            <ToggleButton value="totalSell">Total Sell</ToggleButton>
            <ToggleButton value="totalCost">Total Cost</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <List style={{ overflow: 'auto', height: "100%" }}>
          {topProducts.length && !loading ? (
            topProducts.map((product, i) => (
              <ListItem divider key={i}>
                <ListItemText primary={product.productCategory} />
                <ListItemSecondaryAction>
                  <Typography>
                    {product[toggleButtonValue]
                      ? formatAmountWithCurrency(filterCurrency || currency, product[toggleButtonValue].toFixed(2)).fullFormatAmount
                      : 0}
                  </Typography>
                </ListItemSecondaryAction>
              </ListItem>
            ))
          ) : (
            <ListItem>
              <ListItemText primary={loading ? 'Loading Data...' : 'No Data'} />
            </ListItem>
          )}
        </List>
      </Paper>
    </div>
  );
};

export default OpportunityTable;
