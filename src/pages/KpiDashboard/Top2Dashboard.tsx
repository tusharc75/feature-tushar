import { useState, useEffect, useCallback } from 'react';
import Chart from 'react-chartjs-2';
import { Box, Paper, Typography, Button, Menu, MenuItem, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Popover, TextField, Grid } from '@material-ui/core';
import { FilterList, ImportExport, TableChart, Timeline } from '@material-ui/icons';
import PptxGenJs from 'pptxgenjs';
import jsPDF from 'jspdf';
import { saveAs } from "file-saver";
import { utils, write } from "xlsx";
import axiosInstance from '../../axios/axiosInstance';
import Loader from '../../components/Loader';
import { Autocomplete } from '@material-ui/lab';
import Countries from "../../constants/Country.json"
import { useData } from '../../StateProvider/Provider';
import { formatAmountWithCurrency } from '../../constants/helpers';

const Top2Dashboard = (props) => {
  const { currency,
    salesFilter,
    moment,
    filterCurrency,
    getExchangeRates,
    marketSegments,
    subMarketSegments,
    productCategory,
    setSubMarketSegments,
    salesReps,
    customerAccounts, } = props;
  const {
    state: { selectedEntity }
  } = useData();
  const [anchorEl, setAnchorEl] = useState(null);
  const [tableView, setTableView] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tableDataRawEntity, setTableDataRawEntity] = useState([]);
  const [tableDataRawBookedValue, setTableDataRawBookedValue] = useState([]);
  const [allEntitySalesData, setAllEntitySalesData] = useState({
    labels: [],
    datasets: [],
    allData: []
  });

  const [allBookedValueSalesData, setAllBookedValueSalesData] = useState({
    labels: [],
    datasets: [],
    allData: []
  });
  const [entityFilter, setEntityFilter] = useState<any>({
    marketSegment: {},
    salesRep: {},
    customerAccount: {},
    subMarketSegment: {},
    productCategory: {},
    countrySellTo: {},
    countryBillTo: {}
  });

  const [bookedfilter, setBookedFilter] = useState<any>({
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
  const [currentFilter, setCurrentFilter] = useState('');

  const fetchAllEntitiesData = useCallback(() => {
    let params = {
      entity: selectedEntity || "",
      marketSegment: entityFilter.marketSegment ? entityFilter.marketSegment['id'] : '',
      subMarketSegment: entityFilter.subMarketSegment ? entityFilter.subMarketSegment['id'] : '',
      customerAccount: entityFilter.customerAccount ? entityFilter.customerAccount['id'] : '',
      countrySellTo: entityFilter.countrySellTo ? entityFilter.countrySellTo["optionValue"] : '',
      countryBillTo: entityFilter.countryBillTo ? entityFilter.countryBillTo["optionValue"] : '',
      between: JSON.stringify({
        from: new Date(salesFilter.between.from).toISOString().split('T')[0],
        to: new Date(salesFilter.between.to).toISOString().split('T')[0]
      })
    };

    let url = '?allEntity=1&';
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
      .get(`dashboard/sales${url}`)
      .then(async ({ data: { data } }) => {
        const saleData = [];
        const labels = [];
        const budget = [];
        const allEntitiesChart = [];
        const allEntities = [];
        const entityIds = [];

        data = data.sort((a, b) => {
          const aDate = new Date(a.date).getTime();
          const bDate = new Date(b.date).getTime();

          return aDate - bDate;
        });

        for (let d of data) {
          saleData.push(d.totalOfferValue);

          if (!labels.includes(d.date)) {
            labels.push(d.date);
          }
          budget.push(d.budget);

          if (!entityIds.includes(d.entityId)) {
            entityIds.push(d.entityId);
          }
        }

        for (const id of entityIds) {
          let chartObj = {};
          let obj = {};
          let dataset = [];
          const entitySale = await data.filter((d) => d.entityId === id);

          for (const sale of entitySale) {
            if (filterCurrency && filterCurrency !== currency) {
              const totalOfferValuedata = await getExchangeRates(moment(sale.date).format('YYYY-MM-DD'), sale.totalOfferValue);
              dataset.push(totalOfferValuedata ? totalOfferValuedata.rates[filterCurrency] : sale.totalOfferValue);
            } else {
              dataset.push(sale.totalOfferValue);
            }
          }

          obj = {
            entityName: entitySale[0].entity,
            totalCost: entitySale.map((d) => d.totalCost).reduce((acc, total) => acc + total),
            totalOfferValue: entitySale.map((d) => d.totalOfferValue).reduce((acc, total) => acc + total),
            budget: entitySale.map((d) => d.budget || 0).reduce((acc, total) => acc + total),
            period: `${moment(entitySale[0].date).format('MMM/YY')} - ${moment(entitySale[entitySale.length - 1].date).format('MMM/YY')}`
          };
          chartObj = {
            type: 'line',
            label: entitySale[0].entity,
            borderColor: `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)})`,
            borderWidth: 2,
            data: dataset
          };

          allEntities.push(obj);
          allEntitiesChart.push(chartObj);
        }

        setAllEntitySalesData({
          labels: labels.map((d) => moment(d).format('MMM/YY')),
          datasets: allEntitiesChart,
          allData: allEntities
        });
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
      });
  }, [entityFilter, salesFilter, filterCurrency]);

  useEffect(() => {
    fetchAllEntitiesData();
  }, [fetchAllEntitiesData]);

  useEffect(() => {
    const tableD = allEntitySalesData.allData.map((d) => ({
      ['Period']: d?.period,
      ['Entity Name']: d?.entityName,
      ['Budget']: d.budget ?? 0,
      ['Total Offer Value']: d.totalOfferValue ?? 0,
      ['Total Cost']: d.totalCost ?? 0
    }));
    setTableDataRawEntity(tableD);
  }, [allEntitySalesData]);


  const fetchBookedValueData = useCallback(() => {
    let params = {
      entity: selectedEntity || "",
      marketSegment: bookedfilter.marketSegment ? bookedfilter.marketSegment['id'] : '',
      subMarketSegment: bookedfilter.subMarketSegment ? bookedfilter.subMarketSegment['id'] : '',
      productCategory: bookedfilter.productCategory ? bookedfilter.productCategory['id'] : '',
      salesRep: bookedfilter.salesRep ? bookedfilter.salesRep['id'] : '',
      customerAccount: bookedfilter.customerAccount ? bookedfilter.customerAccount['id'] : '',
      countrySellTo: bookedfilter.countrySellTo ? bookedfilter.countrySellTo["optionValue"] : '',
      countryBillTo: bookedfilter.countryBillTo ? bookedfilter.countryBillTo["optionValue"] : '',
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
    axiosInstance()
      .get(`dashboard/sales${url}`)
      .then(async ({ data: { data } }) => {
        const saleData = [];
        const OfferValueData = [];
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
            const totalOfferValueData = await getExchangeRates(moment(d.date).format('YYYY-MM-DD'), d.totalOfferValue);
            const budgetData = await getExchangeRates(moment(d.date).format('YYYY-MM-DD'), d.budget);

            saleData.push(totalSelldata ? totalSelldata.rates[filterCurrency] : d.totalSell);
            OfferValueData.push(totalOfferValueData ? totalOfferValueData.rates[filterCurrency] : d.totalOfferValue);
            budget.push(budgetData ? budgetData.rates[filterCurrency] : d.budget);
          } else {
            saleData.push(d.totalSell);
            OfferValueData.push(d.totalOfferValue);
            budget.push(d.budget);
          }
          labels.push(moment(d.date).format('MMM/YY'));

        }

        setAllBookedValueSalesData({
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
              label: 'Total Booked Value',
              borderColor: 'rgb(254, 162, 35)',
              borderWidth: 2,
              fill: false,
              data: saleData
            }
          ]
        });
      })
  }, [bookedfilter, filterCurrency]);

  useEffect(() => {
    fetchBookedValueData();
  }, [fetchBookedValueData]);

  useEffect(() => {
    const tableD = allBookedValueSalesData.allData.map((d) => ({
      Month: moment(d.date).format('MMM/YY'),
      ['Total Booked Value']: d.totalSell ? d.totalSell.toLocaleString() : 0,
      ['Total Offer Value']: d.totalOfferValue.toLocaleString(),
    }));
    setTableDataRawBookedValue(tableD);
  }, [allBookedValueSalesData]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (exportType, tableData, id = "") => () => {
    switch (exportType) {
      case 'ppt': {
        const canvas = document.getElementById(id) as HTMLCanvasElement;
        const dataUrl = canvas.toDataURL('image/png');
        const pptx = new PptxGenJs();
        const slide = pptx.addSlide();
        slide.addImage({ data: dataUrl, w: '80%', h: '80%', x: '10%', y: '15%' });
        pptx.writeFile({ fileName: 'Chart.pptx' });
        break;
      }

      case 'pdf': {
        const canvas = document.getElementById(id) as HTMLCanvasElement;
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        const doc = new jsPDF('portrait');
        doc.setFontSize(20);
        doc.text(`Total offered Value In ${currency}`, 60, 15);
        doc.addImage(dataUrl, 'JPEG', 10, 20, 190, 100);
        doc.save('Chart.pdf');
        break;
      }

      case 'excel': {
        // const canvas = document.getElementById('allEntityChart') as HTMLCanvasElement;
        // const dataUrl = canvas.toDataURL('image/png', 1.0);
        const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        const fileExtension = '.xlsx';
        const ws = utils.json_to_sheet(tableData);
        const wb = {
          Sheets: {
            data: ws
          },
          SheetNames: ['data']
        };
        const excelBuffer = write(wb, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: fileType });
        saveAs(data, 'Chart' + fileExtension);
        break;
      }

      case 'json': {
        let blob = new Blob([JSON.stringify(tableData)], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, 'Chart.json');
        break;
      }
      default:
        break;
    }

    setAnchorEl(null);
  };

  const handleClickFilter = (event) => {
    setFilterAnchor(event.currentTarget);
    setOpenFilter((prev) => !prev);
  };

  return allEntitySalesData.labels.length > 0 && (
    <Paper elevation={2}>
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
              value={currentFilter === "entity" ? entityFilter.salesRep : bookedfilter.salesRep}
              getOptionLabel={(option: any) => option.name || ''}
              getOptionSelected={(option, val) => (option ? option.name === val.name : false)}
              onChange={(_, val) => {
                currentFilter === "entity" ?
                  setEntityFilter({ ...entityFilter, salesRep: val })
                  : setBookedFilter({ ...bookedfilter, salesRep: val });
              }}
              renderInput={(params) => <TextField {...params} label="Sales Rep" variant="outlined" />}
            />
            <Box mt={1} />
            <Autocomplete
              size="small"
              fullWidth
              options={customerAccounts}
              autoHighlight
              value={currentFilter === "entity" ? entityFilter.customerAccount : bookedfilter.customerAccount}
              getOptionLabel={(option: any) => option.name || ''}
              getOptionSelected={(option, val) => (option ? option.name === val.name : false)}
              onChange={(_, val) => {
                let data = currentFilter === "entity" ? { ...entityFilter, customerAccount: val } : { ...bookedfilter, customerAccount: val }
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
                currentFilter === "entity" ?
                  setEntityFilter({ ...data })
                  : setBookedFilter({ ...data })
              }}
              renderInput={(params) => <TextField {...params} label="Customer Account" variant="outlined" />}
            />
            <Box mt={1} />
            <Autocomplete
              size="small"
              fullWidth
              options={marketSegments}
              autoHighlight
              value={currentFilter === "entity" ? entityFilter.marketSegment : bookedfilter.marketSegment}
              getOptionLabel={(option: any) => option.name || ''}
              getOptionSelected={(option, val) => (option ? option.name === val.name : false)}
              onChange={(_, val) => {
                currentFilter === "entity" ?
                  setEntityFilter({ ...entityFilter, marketSegment: val })
                  : setBookedFilter({ ...bookedfilter, marketSegment: val });
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
              value={currentFilter === "entity" ? entityFilter.subMarketSegment : bookedfilter.subMarketSegment}
              getOptionLabel={(option: any) => option.name || ''}
              getOptionSelected={(option, val) => (option ? option.name === val.name : false)}
              onChange={(_, val) => currentFilter === "entity" ?
                setEntityFilter({ ...entityFilter, subMarketSegment: val })
                : setBookedFilter({ ...bookedfilter, subMarketSegment: val })}
              renderInput={(params) => <TextField {...params} label="Sub-Market Segment" variant="outlined" />}
            />
            <Box mt={1} />
            <Autocomplete
              size="small"
              fullWidth
              options={Countries}
              autoHighlight
              value={currentFilter === "entity" ? entityFilter.countrySellTo : bookedfilter.countrySellTo}
              getOptionLabel={(option: any) => option.optionLabel || ''}
              getOptionSelected={(option, val) => (option ? option.optionValue === val.optionValue : false)}
              onChange={(_, val) => currentFilter === "entity" ?
                setEntityFilter({ ...entityFilter, countrySellTo: val })
                : setBookedFilter({ ...bookedfilter, countrySellTo: val })}
              renderInput={(params) => <TextField {...params} label="Country Sell To" variant="outlined" />}
            />
            <Box mt={1} />

            <Autocomplete
              size="small"
              fullWidth
              options={Countries}
              autoHighlight
              value={currentFilter === "entity" ? entityFilter?.countryBillTo : bookedfilter?.countryBillTo}
              getOptionLabel={(option: any) => option.optionLabel || ''}
              getOptionSelected={(option, val) => (option ? option.optionValue === val.optionValue : false)}
              onChange={(_, val) => currentFilter === "entity" ?
                setEntityFilter({ ...entityFilter, countryBillTo: val })
                : setBookedFilter({ ...bookedfilter, countryBillTo: val })}
              renderInput={(params) => <TextField {...params} label="Country Bill To" variant="outlined" />}
            />
          </Box>
        </Box>
      </Popover>
      <Box my={2} p={2}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={6}>
            <Box display="flex" justifyContent="space-between">
              <Button onClick={(event) => {
                handleClickFilter(event)
                setCurrentFilter("entity")
              }}
                color="primary"
                endIcon={<FilterList />}>
                Filters
              </Button>
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
              <Menu id="export-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleClose('', "")}>
                <MenuItem onClick={handleClose('ppt', tableDataRawEntity, "allEntityChart")}>Powerpoint</MenuItem>
                <MenuItem onClick={handleClose('pdf', tableDataRawEntity, "allEntityChart")}>PDF</MenuItem>
                <MenuItem onClick={handleClose('excel', tableDataRawEntity)}>Excel</MenuItem>
                <MenuItem onClick={handleClose('json', tableDataRawEntity)}>Raw JSON</MenuItem>
              </Menu>
            </Box>
            <Box textAlign="center">
              <Typography variant="h5">Total offered value in {filterCurrency || currency} vs Entities</Typography>
            </Box>

            {!loading ? tableDataRawEntity.length === 0 ? <Box height={400}>No Data</Box> : (
              <Box>
                {!tableView ? (
                  <Chart id="allEntityChart" type="bar" data={allEntitySalesData} />
                ) : (
                  <TableContainer style={{ height: '400px' }}>
                    <Table stickyHeader aria-label="caption table">
                      <TableHead>
                        <TableRow>
                          {Object.keys(tableDataRawEntity[0]).map((label, i) => (
                            <TableCell key={label} align={i < 1 ? 'left' : 'right'}>
                              {label}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {tableDataRawEntity.map((data, index) => (
                          <TableRow key={index}>
                            {Object.keys(data).map((label, i) => (
                              <TableCell key={label} align={i < 1 ? 'left' : 'right'}>
                                {(i < 2 || data[label] === 0) ? data[label] : formatAmountWithCurrency(filterCurrency || currency, data[label]).fullFormatAmount}
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
              <Loader minHeight={400} text="Loading Data..." />
            )}
          </Grid>
          <Grid item xs={12} sm={6} md={6}>
            <Box display="flex" justifyContent="space-between">
              <Button onClick={(event) => {
                handleClickFilter(event)
                setCurrentFilter("bookedValue")
              }}
                color="primary"
                endIcon={<FilterList />}>
                Filters
              </Button>
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
              <Menu id="export-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleClose('', "")}>
                <MenuItem onClick={handleClose('ppt', tableDataRawBookedValue, "allBookedValueChart")}>Powerpoint</MenuItem>
                <MenuItem onClick={handleClose('pdf', tableDataRawBookedValue, "allBookedValueChart")}>PDF</MenuItem>
                <MenuItem onClick={handleClose('excel', tableDataRawBookedValue)}>Excel</MenuItem>
                <MenuItem onClick={handleClose('json', tableDataRawBookedValue)}>Raw JSON</MenuItem>
              </Menu>
            </Box>
            <Box textAlign="center">
              <Typography variant="h5">Total Offered Value {filterCurrency || currency} VS Total Booked Value {filterCurrency || currency} </Typography>
            </Box>

            {!loading ? tableDataRawBookedValue.length === 0 ? <Box height={400}>No Data</Box> : (
              <Box>
                {!tableView ? (
                  <Chart id="allBookedValueChart" type="bar" data={allBookedValueSalesData} />
                ) : (
                  <TableContainer style={{ height: '400px' }}>
                    <Table stickyHeader aria-label="caption table">
                      <TableHead>
                        <TableRow>
                          {Object.keys(tableDataRawBookedValue[0]).map((label, i) => (
                            <TableCell key={label} align={i < 1 ? 'left' : 'right'}>
                              {label}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {tableDataRawBookedValue.map((data, index) => (
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
              <Loader minHeight={400} text="Loading Data..." />
            )}
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default Top2Dashboard;
