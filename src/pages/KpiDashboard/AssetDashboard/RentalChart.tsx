import React from 'react';
import { Box, Typography, Button, Menu, MenuItem, Table, TableBody, TableContainer, TableRow, TableCell, TableHead } from '@material-ui/core';
import { ImportExport, TableChart, Timeline } from '@material-ui/icons';

import { ChartData } from 'chart.js';
import Chart from 'react-chartjs-2';
import PptxGenJs from 'pptxgenjs';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';
import { utils, write } from 'xlsx';

import axiosInstance from '../../../axios/axiosInstance';
import { determineLightOrDark } from '../../../constants/helpers';

const RentalChart = () => {
  const [customerRentalData, setCustomerRentalData] = React.useState<ChartData>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [tableDataRaw, setTableDataRaw] = React.useState([]);
  const [tableView, setTableView] = React.useState(false);

  const generateRgbColor = () => {
    const red = Math.floor(Math.random() * 256);
    const blue = Math.floor(Math.random() * 256);
    const green = Math.floor(Math.random() * 256);

    const rgbColor = `rgb(${red}, ${blue}, ${green})`;

    return new Promise((resolve, reject) => {
      const contrast = determineLightOrDark(rgbColor);

      if (contrast === 'light') {
        resolve(rgbColor);
      } else {
        generateRgbColor();
      }
    });
  };

  React.useEffect(() => {
    //  axiosInstance().get('dashboard/rental-receiving')
    //  .then(({data: {data}}) => {
    //    console.log(data)
    //  })

    setLoading(true);
    axiosInstance()
      .get('dashboard/customer-in-resource')
      .then(({ data: { data } }) => {
        let labels = [];
        let dataset = [];
        let bgColors = [];

        setTableDataRaw(
          data.map((d) => ({
            ['Account Name']: d?.accountName,
            ['No. Rental Jobs']:
              d?.rentalJob.length === 0 ? 0 : d?.rentalJob.map((c: { count: boolean; status: string }) => c.count).reduce((acc, val) => acc + val)
          }))
        );

        data.forEach(async (_d: any) => {
          if (_d?.rentalJob.length > 0) {
            labels.push(_d.accountName);
            let totalCount = _d.rentalJob.map((c: { count: boolean; status: string }) => c.count).reduce((acc, val) => acc + val);
            dataset.push(totalCount);
            const color = await generateRgbColor();
            bgColors.push(color);
          }
        });
        setCustomerRentalData({
          labels: labels,
          datasets: [
            {
              label: '(%) Utilization',
              data: dataset,
              backgroundColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 99, 132, 0.6)',
                'rgba(54, 162, 235, 0.6)',
                'rgba(255, 206, 86, 0.6)',
                'rgba(75, 192, 192, 0.6)',
                'rgba(153, 102, 255, 0.6)',
                'rgba(255, 159, 64, 0.6)',
                'rgba(255, 99, 132, 0.6)',
                'rgba(178,34,34, 1)',
                'rgba(255,127,80, 1)',
                'rgba(184,134,11, 1)',
                'rgba(0,128,0, 1)',
                'rgba(32,178,170, 1)',
                'rgba(0,139,139, 1)',
                'rgba(100,149,237, 1)',
                'rgba(65,105,225, 1)',
                'rgba(138,43,226, 1)',
                'rgba(106,90,205, 1)',
                'rgba(147,112,219, 1)',
                'rgba(153,50,204, 1)',
                'rgba(255,20,147, 1)',
                'rgba(210,105,30, 1)',
                'rgba(205,133,63, 1)',
                'rgba(119,136,153, 1)',
                'rgba(176,196,222, 1)'
              ],
              fill: true
            }
          ]
        });
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });

    return () => {
      setLoading(false);
    };
  }, []);

  const handleClose = (exportType) => () => {
    switch (exportType) {
      case 'ppt': {
        const canvas = document.getElementById('rental-by-customer') as HTMLCanvasElement;
        const dataUrl = canvas.toDataURL('image/png');
        const pptx = new PptxGenJs();
        const slide = pptx.addSlide();
        slide.addText('Rental Jobs by Customer', {
          fontSize: 15,
          color: '363636',
          x: '12%',
          y: '2%',
          fill: { color: 'F1F1F1' },
          align: pptx.AlignH.center
        });
        slide.addImage({ data: dataUrl, w: '70%', h: '90%', x: '15%', y: '5%' });
        pptx.writeFile({ fileName: 'Rental by customer.pptx' });
        break;
      }

      case 'pdf': {
        const canvas = document.getElementById('rental-by-customer') as HTMLCanvasElement;
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        const doc = new jsPDF('portrait');
        doc.setFontSize(20);
        doc.text(`Rental Jobs by Customer`, 60, 15);
        doc.addImage(dataUrl, 'JPEG', 10, 20, 190, 100);
        doc.save('Rental Jobs by customer.pdf');
        break;
      }

      case 'excel': {
        // const canvas = document.getElementById('rental-by-customer') as HTMLCanvasElement;
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
        saveAs(data, 'Rental Jobs by customer' + fileExtension);
        break;
      }

      case 'json': {
        let blob = new Blob([JSON.stringify(tableDataRaw)], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, 'Rental Jobs by customer.json');
        break;
      }
      default:
        break;
    }

    setAnchorEl(null);
  };

  return (
    <Box>
      <Box textAlign={'center'}>
        <Typography variant="h6">Rental Jobs by Customer</Typography>
      </Box>
      <Box display={'flex'} justifyContent={'space-between'}>
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
      </Box>

      <Box height={450}>
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
              id="rental-by-customer"
              options={{
                maintainAspectRatio: false
              }}
              type="pie"
              data={customerRentalData}
            />
          )
        ) : (
          !loading && <div>No Data</div>
        )}
      </Box>
    </Box>
  );
};

export default RentalChart;
