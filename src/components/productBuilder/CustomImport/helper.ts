import { isEmpty } from 'lodash';
import { read, utils, write } from 'xlsx';

const charToNum = (char) => {
  let num = 0;
  for (let i = 0; i < char?.length; i++) {
    num = num * 26 + (char?.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
  }
  return num;
};

const getDataHeaderRowWise = (headerRow = 1, header: any, fromCol = 0, toCol = 0, fromRow = 0, newHeaders: any, jsonData: any) => {
  if (headerRow === 1) {
    header?.forEach((h, i) => {
      if (i >= fromCol && i <= toCol) {
        const cleanedString = h?.replace(/\r\n/, '');
        newHeaders.push({
          header: cleanedString,
          column: i
        });
      }
    });
  } else if (headerRow === 2) {
    const headers2: any = jsonData[fromRow + 1];
    let j;
    header.forEach((h, i) => {
      if (i >= fromCol && i <= toCol) {
        let name = headers2[i] ? h + ' ' + headers2[i] : h;
        let index = i;

        const diff = i - j;
        if (diff != 1) {
          for (let k = j + 1; k < i; k++) {
            if (headers2[k]) {
              newHeaders.push({
                header: header[j] + ' ' + headers2[k],
                column: k
              });
            }
          }
        }
        j = index;

        newHeaders.push({
          header: name,
          column: index
        });
      }
    });
  }
};

// export const handleFileImport = (file, values) => {
//   if (values?.length > 0) {
//     const reader = new FileReader();
//     reader.onload = (e) => {
//       const data = e.target.result;
//       let readedData = read(data, { type: 'array' });
//       const newData: any = [];

//       values?.forEach((value: any) => {
//         const ws = readedData.Sheets[value?.sheetName || readedData.SheetNames[0]];
//         const jsonData = utils.sheet_to_json(ws, { header: 1 });

//         const newHeaders: any = [];

//         const headerRow = +value?.headerRow;
//         if (value?.startRowCell && value?.endRowCell) {
//           const startRowCell = value?.startRowCell?.match(/^(\D+)(\d+)$/);
//           const endRowCell = value?.endRowCell?.match(/^(\D+)(\d+)$/);
//           const fromCol = charToNum(startRowCell[1]) - 1;
//           const fromRow = +startRowCell[2] - 1;
//           const toCol = charToNum(endRowCell[1]) - 1;
//           const toRow = +endRowCell[2] - 1;

//           const header: any = jsonData[fromRow];

//           getDataHeaderRowWise(headerRow, header, fromCol, toCol, fromRow, newHeaders, jsonData);
//           newData.push({
//             header: newHeaders,
//             data: jsonData,
//             fromRow: headerRow === 1 ? fromRow + 1 : fromRow + 2,
//             toRow: toRow
//           });
//         } else {
//           const header: any = jsonData[0];
//           getDataHeaderRowWise(headerRow, header, 0, header?.length - 1, 0, newHeaders, jsonData);
//           newData.push({
//             header: newHeaders,
//             data: jsonData,
//             fromRow: headerRow === 1 ? 1 : 2,
//             toRow: jsonData?.filter((d) => !isEmpty(d))?.length - 1
//           });
//         }
//       });

//       const newJsonData: any = [];

//       const noOfRow = Math.max(...newData?.map((obj) => obj.toRow - obj.fromRow));
//       for (let i = 0; i <= noOfRow; i++) {
//         const obj: any = {};
//         newData?.forEach((_data) => {
//           _data?.header.forEach((_header) => {
//             obj[_header.header.toUpperCase()] = _data?.data[_data?.fromRow][_header?.column] || '';
//           });
//           _data.fromRow = _data.fromRow + 1;
//         });
//         newJsonData.push(obj);
//       }

//       const worksheet = utils.json_to_sheet(newJsonData);
//       const workbook = utils.book_new();
//       utils.book_append_sheet(workbook, worksheet, 'Sheet1');

//       const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
//       const excelBuffer = write(workbook, { bookType: 'xlsx', type: 'array' });
//       const blob = new Blob([excelBuffer], { type: fileType });
//       return blob;
//     };
//     reader.readAsArrayBuffer(file);
//   } else {
//     return file;
//   }
// };

export const handleFileImport = async (file, values) => {
  if (values?.length > 0) {
    const readFileAsync = (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (err) => reject(err);
        reader.readAsArrayBuffer(file);
      });
    };

    const data = await readFileAsync(file);
    let readedData = read(data, { type: 'array' });
    const newData: any = [];

    values?.forEach((value: any) => {
      const ws = readedData.Sheets[value?.sheetName || readedData.SheetNames[0]];
      const jsonData = utils.sheet_to_json(ws, { header: 1 });

      const newHeaders: any = [];

      const headerRow = +value?.headerRow;
      if (value?.startRowCell && value?.endRowCell) {
        const startRowCell = value?.startRowCell?.match(/^(\D+)(\d+)$/);
        const endRowCell = value?.endRowCell?.match(/^(\D+)(\d+)$/);
        const fromCol = charToNum(startRowCell[1]) - 1;
        const fromRow = +startRowCell[2] - 1;
        const toCol = charToNum(endRowCell[1]) - 1;
        const toRow = +endRowCell[2] - 1;

        const header: any = jsonData[fromRow];

        getDataHeaderRowWise(headerRow, header, fromCol, toCol, fromRow, newHeaders, jsonData);
        newData.push({
          header: newHeaders,
          data: jsonData,
          fromRow: headerRow === 1 ? fromRow + 1 : fromRow + 2,
          toRow: toRow
        });
      } else {
        const header: any = jsonData[0];
        getDataHeaderRowWise(headerRow, header, 0, header?.length - 1, 0, newHeaders, jsonData);
        newData.push({
          header: newHeaders,
          data: jsonData,
          fromRow: headerRow === 1 ? 1 : 2,
          toRow: jsonData?.filter((d) => !isEmpty(d))?.length - 1
        });
      }
    });

    const newJsonData: any = [];

    const noOfRow = Math.max(...newData?.map((obj) => obj.toRow - obj.fromRow));
    for (let i = 0; i <= noOfRow; i++) {
      const obj: any = {};
      newData?.forEach((_data) => {
        _data?.header.forEach((_header) => {
          obj[_header.header.toUpperCase()] = _data?.data[_data?.fromRow][_header?.column] || '';
        });
        _data.fromRow = _data.fromRow + 1;
      });
      newJsonData.push(obj);
    }

    const worksheet = utils.json_to_sheet(newJsonData);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const excelBuffer = write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: fileType });
    return blob;
  } else {
    return file;
  }
};
