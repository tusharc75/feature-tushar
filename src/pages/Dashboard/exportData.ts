import PptxGenJs from 'pptxgenjs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';
import { utils, write } from 'xlsx';
import { formatAmountWithCurrency } from '../../constants/helpers';
import { startCase } from 'lodash';
import { ChartDataType } from './ChartTypes';

export default async (type: string, currency: string, tableData: any[], chart: ChartDataType, isTableView: boolean, isCurrency: boolean) => {

  const { uniqueId, graphType, chartTitle } = chart;

  const { title, fileName } = { title: chartTitle.replaceAll('CUR', currency), fileName: chartTitle.replaceAll('CUR', currency) };


  const columns = Object.keys(tableData[0])
    .map((k) => {
      let b = tableData[0];
      return {
        colName: k,
        order: b[k].order
      };
    })
    .sort((a, b) => a.order - b.order)
    .map((d) => d.colName);
  let newData = tableData.map((data) => {
    let obj: any = {};
    columns.forEach((key) => {
      obj[key] = data[key].value;
    });

    return obj;
  });

  if (graphType !== 'Table' && !isTableView) {
    switch (type) {
      case 'ppt': {
        const canvas = document.getElementById(uniqueId) as HTMLCanvasElement;
        const dataUrl = canvas.toDataURL('image/png');
        const pptx = new PptxGenJs();
        const slide = pptx.addSlide();
        slide.addText(title, {
          fontSize: 15,
          color: '363636',
          x: '12%',
          y: '4%',
          fill: { color: 'F1F1F1' },
          align: pptx.AlignH.center
        });
        slide.addImage({ data: dataUrl, w: '80%', h: '80%', x: '10%', y: '10%' });
        pptx.writeFile({ fileName: fileName + '.pptx' });
        break;
      }

      case 'pdf': {
        const canvas = document.getElementById(uniqueId) as HTMLCanvasElement;
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        const doc = new jsPDF('portrait');
        doc.setFontSize(12);
        doc.text(title, 105, 10, { align: 'center' });
        doc.addImage(dataUrl, 'JPEG', 10, 20, 190, 140);
        doc.save(fileName + '.pdf');
        break;
      }

      case 'excel': {
        // const canvas = document.getElementById(uniqueId) as HTMLCanvasElement;
        // const dataUrl = canvas.toDataURL('image/png', 1.0);
        const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        const ws = utils.json_to_sheet(newData);
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
        let blob = new Blob([JSON.stringify(newData)], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, fileName + '.json');
        break;
      }
      default:
        break;
    }
  }

  if (graphType === 'Table' || graphType === "Chart" && isTableView) {

    switch (type) {
      case 'ppt': {
        const pptx = new PptxGenJs();
        pptx.tableToSlides('table_' + uniqueId, {
          x: 0.5, y: 0.5, w: 10, addText: {
            text: title as any, options: {
              fontSize: 15,
              color: '363636',
              x: '12%',
              y: '4%',
              fill: { color: 'F1F1F1' },
              align: pptx.AlignH.center
            }
          }
        });
        pptx.writeFile({ fileName: fileName + '.pptx' });
        break;
      }
      case 'pdf': {
        const doc = new jsPDF('portrait');
        doc.setFontSize(12);
        doc.text(title, 105, 10, { align: 'center' });
        let col = columns.map((s: string) => startCase(s))
        let row = [];
        if (newData && newData.length) {
          row = newData.map((data) =>
            columns.map((key) =>
              isNaN(Number(data[key]))
                ? data[key] : key.includes("MT") || key.includes("GM") ? Number(data[key]) ? data[key].toFixed(2) : '00'
                  : isCurrency ? formatAmountWithCurrency(currency, Number(data[key]) ? data[key].toFixed(2) : '00').fullFormatAmount
                    : Number(data[key])
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
        const ws = utils.json_to_sheet(newData);
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
        let blob = new Blob([JSON.stringify(newData)], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, fileName + '.json');
        break;
      }
      default:
        break;
    }
  }
};
