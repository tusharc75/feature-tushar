import React from 'react';
import { ChartData } from 'chart.js';
import Chart from 'react-chartjs-2';
import { Autocomplete } from '@material-ui/lab';
import {
  Box,
  TextField,
  Checkbox,
  Typography,
  Button,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableContainer,
  TableRow,
  TableCell,
  TableHead
} from '@material-ui/core';
import { ImportExport, TableChart, Timeline, CheckBoxOutlineBlank, CheckBox } from '@material-ui/icons';
import PptxGenJs from 'pptxgenjs';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';
import { utils, write } from 'xlsx';

import axiosInstance from '../../../axios/axiosInstance';

const AssetStatusChart = ({ productCategories, loadingProductCategory }) => {
  const [pieData, setPieData] = React.useState<ChartData>(null);
  const [selectedProductCategories, setSelectedProductCategories] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [tableView, setTableView] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [tableDataRaw, setTableDataRaw] = React.useState([]);

  React.useEffect(() => {
    productWithStatus();
  }, [selectedProductCategories]);

  const getSum = (array, column) => {
    let values = array.map((item) => parseInt(item[column]) || 0);
    return values.reduce((a, b) => a + b);
  };
  const ignoreId = ['productName', '_id'];
  const productWithStatus = () => {
    let filterById = [];
    selectedProductCategories.forEach((d) => {
      filterById.push(d.id);
    });

    let query = filterById.length > 0 ? `?productCategory=${JSON.stringify(filterById)}` : '';

    // setLoading(true)
    // axiosInstance()
    //   .get(`/dashboard/product-with-status-count${query}`)
    //   .then(({ data: { data } }) => {
    //     setLoading(false);
    //     let labels = [];
    //     let values = [];
    //     if (data.data.length > 0) {
    //       Object.keys(data.data[0]).map((label: any) => {
    //         if (!ignoreId.includes(label)) {
    //           values.push(getSum(data.data, label));
    //           labels.push(label);
    //         }
    //       });
    //     }
    //     setPieData({
    //       labels: labels,
    //       datasets: [
    //         {
    //           label: '(%) Utilization',
    //           data: values,
    //           backgroundColor: [
    //             'rgba(255, 99, 132, 1)',
    //             'rgba(54, 162, 235, 1)',
    //             'rgba(255, 99, 132, 0.6)',
    //             'rgba(54, 162, 235, 0.6)',
    //             'rgba(255, 206, 86, 0.6)',
    //             'rgba(75, 192, 192, 0.6)',
    //             'rgba(153, 102, 255, 0.6)',
    //             'rgba(255, 159, 64, 0.6)',
    //             'rgba(255, 99, 132, 0.6)'
    //           ],
    //           fill: true
    //         }
    //       ]
    //     });
    //   })
    //   .catch((err) => {
    //     setLoading(false);
    //   });
  };

  // Exporting data into sheet
  const handleClose = (exportType) => () => {
    switch (exportType) {
      case 'ppt': {
        const canvas = document.getElementById('data-by-count') as HTMLCanvasElement;
        const dataUrl = canvas.toDataURL('image/png');
        const pptx = new PptxGenJs();
        const slide = pptx.addSlide();
        slide.addText('Product By Count', {
          fontSize: 15,
          color: '363636',
          x: '12%',
          y: '2%',
          fill: { color: 'F1F1F1' },
          align: pptx.AlignH.center
        });
        slide.addImage({ data: dataUrl, w: '70%', h: '90%', x: '15%', y: '5%' });
        pptx.writeFile({ fileName: 'Product By Count.pptx' });
        break;
      }

      case 'pdf': {
        const canvas = document.getElementById('data-by-count') as HTMLCanvasElement;
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        const doc = new jsPDF('portrait');
        doc.setFontSize(20);
        doc.text(`Product By Count`, 60, 15);
        doc.addImage(dataUrl, 'JPEG', 10, 20, 190, 100);
        doc.save('Product By Count.pdf');
        break;
      }

      case 'excel': {
        // const canvas = document.getElementById('data-by-count') as HTMLCanvasElement;
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
        saveAs(data, 'Rental by customer' + fileExtension);
        break;
      }

      case 'json': {
        let blob = new Blob([JSON.stringify(tableDataRaw)], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, 'Rental by customer.json');
        break;
      }
      default:
        break;
    }

    setAnchorEl(null);
  };

  return (
    <div>
      <Box width={200} mb={1}>
        <Autocomplete
          disabled={loadingProductCategory}
          fullWidth
          disableListWrap
          loading={loadingProductCategory}
          loadingText={'Loading...'}
          multiple={true}
          value={selectedProductCategories}
          options={productCategories}
          disableCloseOnSelect
          limitTags={2}
          onChange={(_, newVal) => setSelectedProductCategories(newVal)}
          getOptionSelected={(option, value) => option.id === value.id}
          getOptionLabel={(option) => option.title}
          renderOption={(option, { selected }) => (
            <React.Fragment>
              <Checkbox
                icon={<CheckBoxOutlineBlank fontSize="small" />}
                checkedIcon={<CheckBox fontSize="small" />}
                style={{ marginRight: 8 }}
                checked={selected}
              />
              {option.title}
            </React.Fragment>
          )}
          renderInput={(params) => <TextField {...params} variant="outlined" label="Product Category" size="small" />}
        />
      </Box>

      {tableDataRaw.length > 0 && <Box display={'flex'} justifyContent={'space-between'}>
        <div>
          <Button disabled={loading} onClick={(event) => setAnchorEl(event.currentTarget)} startIcon={<ImportExport />}>
            Export to
          </Button>
          <Menu id="export-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleClose('')}>
            <MenuItem onClick={handleClose('ppt')}>Powerpoint</MenuItem>
            <MenuItem onClick={handleClose('pdf')}>PDF</MenuItem>
            <MenuItem onClick={handleClose('excel')}>Excel</MenuItem>
            <MenuItem onClick={handleClose('json')}>Raw JSON</MenuItem>
          </Menu>
        </div>
        <Button disabled={loading} onClick={() => setTableView((prevState) => !prevState)} startIcon={!tableView ? <TableChart /> : <Timeline />}>
          {!tableView ? 'Table' : 'Chart'} View
        </Button>
      </Box>}
      <Box height={400}>
        {loading && <Typography>Loading...</Typography>}
        {tableDataRaw.length > 0 ? (
          tableView ? (
            <TableContainer style={{ height: '400px' }}>
              <Table stickyHeader aria-label="caption table">
                <TableHead>
                  <TableRow>
                    {Object.keys(tableDataRaw[0]).map((label, i) => (
                      <TableCell key={label} align={i < 1 ? 'left' : 'right'}>
                        {label}
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
          ) : (
            <Chart
              id="data-by-count"
              options={{
                maintainAspectRatio: false
              }}
              type="pie"
              data={pieData}
            />
          )
        ) : (
          !loading && <div>No Data</div>
        )}
      </Box>
    </div>
  );
};

export default AssetStatusChart;
