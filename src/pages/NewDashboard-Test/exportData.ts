import PptxGenJs from 'pptxgenjs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';
import { utils, write } from 'xlsx';
import { formatAmountWithCurrency } from '../../constants/helpers';
import { startCase } from 'lodash';
import { ChartDataType } from './ChartTypes';

// const getTitle = (uniqueId: string, currency: string): { fileName: string; title: string } => {
//   switch (uniqueId) {
//     case 'bookedVSBudget':
//       return {
//         fileName: 'Entity Sales Chart',
//         title: `Total offered Value In ${currency}`
//       };

//     case 'offeredVsEntities':
//       return {
//         fileName: 'Sales Chart',
//         title: `Total offered value in ${currency} vs Entities`
//       };

//     case 'offeredVsBudget':
//       return {
//         fileName: 'Sales Chart',
//         title: `Total offered value in ${currency} vs Total booked value in ${currency}`
//       };

//     case 'regionalSale':
//       return {
//         fileName: 'Regional Sales',
//         title: `Regional Sales Data`
//       };

//     case 'topCategory':
//       return {
//         fileName: 'Top Category',
//         title: 'Top Selling Product Category'
//       };

//     case 'volumeVsBudget':
//       return {
//         fileName: 'Total Booked Volume',
//         title: 'Total Booked Volume in MT vs Budget'
//       };

//     case 'volume2VsBudget':
//       return {
//         fileName: 'Total Booked Margin',
//         title: `Total Booked GM in ${currency} vs Budget`
//       };

//     default:
//       return;
//   }
// };

export default async (type: string, currency: string, tableData: any[], chart: ChartDataType) => {
  const { uniqueId, chartType, chartTitle } = chart;
  const { title, fileName } = { title: chartTitle.replaceAll('currency', currency), fileName: chartTitle.replaceAll('currency', currency) };

  if (chartType !== 'list') {
    switch (type) {
      case 'ppt': {
        const canvas = document.getElementById(uniqueId) as HTMLCanvasElement;
        const dataUrl = canvas.toDataURL('image/png');
        const pptx = new PptxGenJs();
        const slide = pptx.addSlide();
        slide.addText(title, {
          fontSize: 20,
          color: '363636',
          x: '12%',
          y: '4%',
          fill: { color: 'F1F1F1' },
          align: pptx.AlignH.center
        });
        slide.addImage({ data: dataUrl, w: '80%', h: '80%', x: '10%', y: '15%' });
        pptx.writeFile({ fileName: fileName + '.pptx' });
        break;
      }

      case 'pdf': {
        const canvas = document.getElementById(uniqueId) as HTMLCanvasElement;
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        const doc = new jsPDF('portrait');
        doc.setFontSize(10);
        doc.text(title, 60, 15);
        doc.addImage(dataUrl, 'JPEG', 10, 20, 190, 100);
        doc.save(fileName + '.pdf');
        break;
      }

      case 'excel': {
        // const canvas = document.getElementById(uniqueId) as HTMLCanvasElement;
        // const dataUrl = canvas.toDataURL('image/png', 1.0);
        const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        const ws = utils.json_to_sheet(tableData);
        const wb = {
          Sheets: {
            data: ws
          },
          SheetNames: ['data']
        };
        const excelBuffer = write(wb, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: fileType });
        saveAs(data, fileName + '.xlsx');
        break;
      }

      case 'json': {
        let blob = new Blob([JSON.stringify(tableData)], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, fileName + '.json');
        break;
      }
      default:
        break;
    }
  }

  if (chartType === 'list') {
    tableData = tableData.map((d) => {
      for (const key in d) {
        let upper = startCase(key);
        if (upper !== key) {
          d[upper] = d[key];
          delete d[key];
        }
      }
      return d;
    });
    switch (type) {
      case 'ppt': {
        const pptx = new PptxGenJs();
        pptx.tableToSlides('table_' + uniqueId, { x: 0.5, y: 0.2, w: 10 });
        pptx.writeFile({ fileName: fileName + '.pptx' });
        break;
      }

      case 'pdf': {
        const doc = new jsPDF('portrait');
        doc.setFontSize(16);
        doc.text(title, 70, 10);
        let col = Object.keys(tableData[0]).map((_c: string) => _c);
        let row = [];
        if (tableData && tableData.length) {
          row = tableData.map((data) =>
            Object.keys(data).map((key) =>
              isNaN(Number(data[key]))
                ? data[key]
                : formatAmountWithCurrency(currency, Number(data[key]) ? data[key].toFixed(2) : '00').fullFormatAmount
            )
          );
          //@ts-ignore
          doc.autoTable(col, row, { startY: 20 });
        } else {
          doc.setFontSize(16);
          doc.text(`No Data`, 60, 15);
        }
        doc.save(fileName + '.pdf');
        break;
      }

      case 'excel': {
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
        saveAs(data, fileName + fileExtension);
        break;
      }

      case 'json': {
        let blob = new Blob([JSON.stringify(tableData)], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, fileName + '.json');
        break;
      }
      default:
        break;
    }
  }
};
