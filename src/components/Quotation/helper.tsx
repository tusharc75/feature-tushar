
import { CHILD_RESOURCE } from '../../constants/helpers';
import { objectStore, findOne } from '../../constants/indexdbhelper';
import axiosInstance from '../../axios/axiosInstance';
import { CURReplaceByCurrencySingle } from '../../constants/formulaUtility';

export const fetch_quotation_product_fields = async (currency) => {
    var data;
    const response = await axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.quotationProduct}`);
    data = response?.data?.data;
    data = CURReplaceByCurrencySingle(data, currency ? currency : "USD");
    // var isRateRequired = false
    // data.forEach(element => {
    //     if (element.fieldName === "price" && element.required) {
    //         isRateRequired = true;
    //     }
    // });
    // if (!isRateRequired) {
    //     data = data.filter((e) => e.sectionName !== "Pricing Information")
    // }
    return data;
}

export const fetch_quotation_cost_fields = async (currency) => {
    var data;
    const response = await axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.quotationCost}`);
    data = response?.data?.data;
    data = CURReplaceByCurrencySingle(data, currency ? currency : "USD");
    // var isRateRequired = false
    // data.forEach(element => {
    //     if (element.fieldName === "price" && element.required) {
    //         isRateRequired = true;
    //     }
    // });
    // if (!isRateRequired) {
    //     data = data.filter((e) => e.sectionName !== "Pricing Information")
    // }
    return data;
}

export const fetch_quotation_service_fields = async (currency) => {
    var data;
    const response = await axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.quotationService}`);
    data = response?.data?.data;
    data = CURReplaceByCurrencySingle(data, currency ? currency : "USD");
    var isRateRequired = false
    data.forEach(element => {
        if (element.fieldName === "price" && element.required) {
            isRateRequired = true;
        }
    });
    if (!isRateRequired) {
        data = data.filter((e) => e.sectionName !== "Pricing Information")
    }
    return data;
}

export const handleViewPdf = (view = false, download = false) => {
    // setViewDownloadLoading(true);
    // let body = {
    //   acceptedColumns: visibleColumns,
    //   status: versionStatus,
    //   TNC: state.selectedRecords
    // };
    // axiosInstance()
    //   .post(`quote-builder/updateVersion/${quoteData._id}?version=${currentVersion}`, body)
    //   .then(() => {
    //     axiosInstance()
    //       .post(`/quote-builder/generate-quote-pdf/${quoteData._id}/${currentVersion}`)
    //       .then(({ data }) => {
    //         if (view && data.data.fileName) {
    //           axiosInstance()
    //             .get(`user/download?fileName=${data.data.fileName}`, {
    //               responseType: 'blob'
    //             })
    //             .then(({ data }) => {
    //               const file = new Blob([data], { type: 'application/pdf' });
    //               const fileURL = URL.createObjectURL(file);
    //               const pdfWindow = window.open();
    //               pdfWindow.location.href = fileURL;
    //               setViewDownloadLoading(false);
    //             })
    //             .catch((err) => {
    //               setViewDownloadLoading(false);
    //               toastConfig.setToastConfig(err);
    //             });
    //         } else if (download && data.data.fileName) {
    //           axiosInstance()
    //             .get(`user/download?fileName=${data.data.fileName}`, {
    //               responseType: 'blob'
    //             })
    //             .then(({ data }) => {
    //               const url = window.URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
    //               const link = document.createElement('a');
    //               link.href = url;
    //               link.setAttribute('download', `Quotation-${quoteData.quoteName}-v${currentVersion}.pdf`);
    //               document.body.appendChild(link);
    //               link.click();
    //               setViewDownloadLoading(false);
    //             })
    //             .catch((err) => {
    //               toastConfig.setToastConfig(err);
    //               setViewDownloadLoading(false);
    //             });
    //         } else {
    //           setViewDownloadLoading(false);
    //         }
    //       })
    //       .catch((err) => {
    //         toastConfig.setToastConfig(err);
    //         setViewDownloadLoading(false);
    //       });
    //   })
    //   .catch((err) => {
    //     toastConfig.setToastConfig(err);
    //     setViewDownloadLoading(false);
    //   });
};


export const exportToCSV = (send = false) => {
    const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const fileExtension = '.xlsx';

    // if (dynamicTableData.length) {
    //   let newTable = [];
    //   dynamicTableData.forEach((d, i) => {
    //     let obj = {};
    //     visibleColumnsExcel.forEach((col) => {
    //       if (Array.isArray(d[col]) && d[col].length > 0) {
    //         if (d[col][0]?.hasOwnProperty('optionLabel')) {
    //           obj[col] = d[col]?.map((d) => d.optionLabel).join() || '';
    //         } else {
    //           obj[col] = d[col]?.join() || '';
    //         }
    //       } else if (d[col]?.hasOwnProperty('optionLabel')) {
    //         obj[col] = d[col]?.optionLabel || '';
    //       } else {
    //         obj[col] = d[col] || '';
    //       }
    //     });

    //     newTable.push(obj);
    //   });

    //   newTable = newTable.map((row, i) => {
    //     return {
    //       'SR No.': i + 1,
    //       ...row
    //     };
    //   });

    //   const res = newTable.reduce(
    //     (result, item) => {
    //       const keys = Object?.keys(item);
    //       keys.forEach((key) => {
    //         if (!key.includes(quoteCurrency)) {
    //           return;
    //         }
    //         result[key] = result[key] ? result[key] + item[key] : item[key];
    //       });
    //       return result;
    //     },
    //     { ['SR No.']: 'Total' }
    //   );

    //   Object?.keys(res).forEach((k) => {
    //     if (k.includes(quoteCurrency)) {
    //       res[k] =
    //         res[k] && res[k].toString().split('.')[1] !== undefined && res[k].toString().split('.')[1].length > 4
    //           ? parseFloat(res[k]).toFixed(4)
    //           : res[k];
    //     }
    //   });

    //   newTable.push(res);

    //   const wb = utils.book_new();
    //   const ws = utils.json_to_sheet(newTable);
    //   const range = utils.decode_range(ws['!ref']);
    //   let cs,
    //     rs: number = range.s.r;
    //   let ce,
    //     re: number = range.e.r;

    //   let wscols = [];

    //   for (cs = range.s.r; cs <= range.e.c; ++cs) {
    //     let sCell = utils.encode_cell({ c: cs, r: rs });

    //     ws[sCell].s = {
    //       font: {
    //         name: 'Calibri',
    //         sz: 12,
    //         bold: true,
    //         color: { rgb: 'ffffff' }
    //       },
    //       fill: {
    //         fgColor: { rgb: '02617d' }
    //       }
    //     };

    //     if (sCell !== 'A1') {
    //       wscols.push({ wch: 20 });
    //     } else {
    //       wscols.push({ wch: 6 });
    //     }
    //   }

    //   for (ce = range.e.c; ce >= range.s.r; --ce) {
    //     let cell = utils.encode_cell({ c: ce, r: re });

    //     if (ws[cell])
    //       ws[cell].s = {
    //         font: {
    //           name: 'Calibri',
    //           sz: 12,
    //           bold: true,
    //           color: { rgb: 'ffffff' }
    //         },
    //         fill: {
    //           fgColor: { rgb: 'ff6666' }
    //         }
    //       };
    //   }

    //   Object.keys(ws).forEach((key, i) => {
    //     if (key === '!cols' || key === '!ref') return;

    //     if (ws[key]?.s) {
    //       ws[key].s = {
    //         ...ws[key]?.s,
    //         alignment: {
    //           horizontal: 'left'
    //         }
    //       };
    //     } else {
    //       if (key.includes('A')) {
    //         ws[key].s = {
    //           font: {
    //             name: 'Calibri',
    //             sz: 12,
    //             bold: false,
    //             color: { rgb: 'ffffff' }
    //           },
    //           fill: {
    //             fgColor: { rgb: '02617d' }
    //           },
    //           alignment: {
    //             horizontal: 'left'
    //           }
    //         };
    //       } else {
    //         ws[key].s = {
    //           alignment: {
    //             horizontal: 'left'
    //           }
    //         };
    //       }
    //     }
    //   });

    //   ws['!cols'] = wscols;
    //   utils.book_append_sheet(wb, ws);
    //   const excelBuffer = write(wb, {
    //     bookType: 'xlsx',
    //     type: 'array'
    //   });
    //   const data = new Blob([excelBuffer], { type: fileType });

    //   if (send) {
    //     generateBase64forFile(data, 'excel');
    //   } else {
    //     saveAs(data, `Quotation - v${currentVersion}` + fileExtension);
    //   }
    // }
};
