import moment from 'moment';

import { getExchangeRates, formatAmountWithCurrency } from 'src/constants/helpers';
import { ChartDataType } from './ChartTypes';

export default async (chart: ChartDataType, data: any, currencyTo: string, currencyFrom: string) => {
  if (!data) return null;

  let dataObject: any;

  if (chart.kpi === 'sales' && (chart.uniqueId === 'bookedVSBudget' || chart.uniqueId === 'revenueCard')) {
    const bookedValueData = [];
    const bookedCostData = [];
    const bookedVolumeData = [];
    const offeredVolumeData = [];
    const offeredValueData = [];
    const offeredCostData = [];
    const labels = [];
    const budget = [];
    const volumeUnit = data[0]?.volumeUnit;
    const currency = data[0]?.currency;

    data = data.sort((a, b) => {
      const aDate = new Date(a.date).getTime();
      const bDate = new Date(b.date).getTime();

      return aDate - bDate;
    });

    for (let d of data) {
      if (currencyTo && currencyFrom && currencyTo !== currencyFrom) {
        const bookedValue: any = await getExchangeRates(moment(d.date).format('YYYY-MM-DD'), d.totalBookedValue || 0, currencyFrom, currencyTo);
        const budgetData: any = await getExchangeRates(moment(d.date).format('YYYY-MM-DD'), d.budget || 0, currencyFrom, currencyTo);
        const bookedCost: any = await getExchangeRates(moment(d.date).format('YYYY-MM-DD'), d.totalBookedCost || 0, currencyFrom, currencyTo);
        const offeredValue: any = await getExchangeRates(moment(d.date).format('YYYY-MM-DD'), d.totalOfferedValue || 0, currencyFrom, currencyTo);
        const offeredCost: any = await getExchangeRates(moment(d.date).format('YYYY-MM-DD'), d.totalOfferedCost || 0, currencyFrom, currencyTo);

        bookedValueData.push(bookedValue ? bookedValue.rates[currencyTo] : d.totalBookedValue || 0);
        budget.push(budgetData ? budgetData.rates[currencyTo] : d.budget || 0);
        bookedCostData.push(bookedCost ? bookedCost.rates[currencyTo] : d.totalBookedCost || 0);
        offeredValueData.push(offeredValue ? offeredValue.rates[currencyTo] : d.totalOfferedValue || 0);
        offeredCostData.push(offeredValue ? offeredCost.rates[currencyTo] : d.totalOfferedCost || 0);
      } else {
        bookedValueData.push(d.totalBookedValue || 0);
        budget.push(d.budget);
        bookedCostData.push(d.totalBookedCost || 0);
        offeredValueData.push(d.totalOfferedValue || 0);
        offeredCostData.push(d.totalOfferedCost || 0);
      }

      bookedVolumeData.push(d.totalBookedVolume || 0);
      offeredVolumeData.push(d.totalOfferedVolume || 0);
      labels.push(moment(d.date).format('MMM/YY'));
    }

    if (labels.length === 0) return null;

    if (chart.uniqueId === 'revenueCard') {
      let totalBookedValue = bookedValueData.reduce((acc, val) => acc + val);
      let totalBookedCost = bookedCostData.reduce((acc, val) => acc + val);
      let totalBookedVolume = bookedVolumeData.reduce((acc, val) => acc + val);
      let totalOfferedValue = offeredValueData.reduce((acc, val) => acc + val);
      let totalOfferedCost = offeredCostData.reduce((acc, val) => acc + val);
      let totalOfferedVolume = offeredVolumeData.reduce((acc, val) => acc + val);

      const grossMarginPercent = totalBookedValue && totalBookedCost ? Math.floor(((totalBookedValue - totalBookedCost) / totalBookedCost) * 100) : 0;
      const offeredMarginPercent =
        totalOfferedValue && totalOfferedCost ? Math.floor(((totalOfferedValue - totalOfferedCost) / totalBookedCost) * 100) : 0;
      const grossMargin = totalBookedValue && totalBookedCost ? totalBookedValue - totalBookedCost : 0;
      const offeredMargin = totalOfferedValue && totalOfferedCost ? totalOfferedValue - totalOfferedCost : 0;
      const hitRatioValue = totalBookedValue && totalOfferedValue ? totalBookedValue / totalOfferedValue : 0;
      const hitRatioCost = totalBookedCost && totalOfferedCost ? totalBookedCost / totalOfferedCost : 0;
      const hitRatioMargin = grossMargin && offeredMargin ? grossMargin / offeredMargin : 0;
      const hitRatioVolume = totalBookedVolume && totalOfferedVolume ? totalBookedVolume / totalOfferedVolume : 0;

      dataObject = {
        addtionalData: {
          volumeUnit,
          currency,
          totalOfferedValue,
          totalOfferedCost,
          totalOfferedVolume,
          offeredMarginPercent,
          offeredMargin,
          grossMarginPercent,
          hitRatioValue: isNaN(hitRatioValue) ? 0 : hitRatioValue,
          hitRatioCost: isNaN(hitRatioCost) ? 0 : hitRatioCost,
          hitRatioMargin: isNaN(hitRatioMargin) ? 0 : hitRatioMargin,
          hitRatioVolume: isNaN(hitRatioVolume) ? 0 : hitRatioVolume
        },
        cardData: {
          ['Total Booked Value']: totalBookedValue ? formatAmountWithCurrency(currencyFrom || currencyTo, totalBookedValue).fullFormatAmount : 0,
          ['Total Booked Cost']: totalBookedCost ? formatAmountWithCurrency(currencyFrom || currencyTo, totalBookedCost).fullFormatAmount : 0,
          ['Booked Gross Margin']: `${
            grossMargin ? formatAmountWithCurrency(currencyFrom || currencyTo, grossMargin).fullFormatAmount : 0
          } (${grossMarginPercent}%)`,
          ['Total Booked Volume']: `${totalBookedVolume.toFixed(2)} ${volumeUnit}`
        }
      };
    } else {
      dataObject = {
        labels,
        datasets: [
          {
            type: 'line',
            label: 'Total booked value',
            borderColor: 'rgb(54, 162, 235)',
            borderWidth: 2,
            fill: true,
            data: bookedValueData
          },
          {
            type: 'line',
            label: 'Budget',
            borderColor: 'rgb(254, 162, 35)',
            borderWidth: 2,
            fill: false,
            data: budget
          }
        ]
      };

      if (chart.hasTableView) {
        const tableData = data.map((d) => ({
          month: moment(d.date).format('MMM/YY'),
          totalSell: d.totalBookedValue ? d.totalBookedValue : 0,
          totalCost: d.totalBookedCost ? d.totalBookedCost : 0,
          budget: d.budget ? d.budget : 0
        }));
        Object.assign(dataObject, { tableData });
      }
    }
  }

  if (chart.uniqueId === 'regionalSale') {
    data = data.sort((a: any, b: any) => b.totalSell - a.totalSell);
    let regionSalesData = [];
    for (const d of data) {
      let totalBookedValue = 0;
      if (d.totalSell && currencyTo && currencyTo !== currencyFrom) {
        const rateData: any = await getExchangeRates(moment().format('YYYY-MM-DD'), d.totalSell, currencyFrom, currencyTo);
        totalBookedValue = rateData?.rates[currencyTo] || d.totalSell;
      } else {
        totalBookedValue = d.totalSell;
      }
      regionSalesData.push({ region: d.region, totalBookedValue });
    }
    dataObject = regionSalesData;
  }

  if (chart.kpi === 'sales' && chart.uniqueId === 'offeredVsEntities') {
    const totalOfferedData = [];
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
      totalOfferedData.push(d.totalOfferedValue || 0);

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
      const entitySale = data.filter((d) => d.entityId === id);

      for (const sale of entitySale) {
        if (currencyTo && currencyTo !== currencyFrom) {
          const totalOfferedValuedata: any = await getExchangeRates(
            moment(sale.date).format('YYYY-MM-DD'),
            sale.totalOfferedValue || 0,
            currencyFrom,
            currencyTo
          );
          dataset.push(totalOfferedValuedata ? totalOfferedValuedata.rates[currencyTo] : sale.totalOfferedValue);
        } else {
          dataset.push(sale.totalOfferedValue || 0);
        }
      }
      chartObj = {
        type: 'line',
        label: entitySale[0].entity,
        borderColor: `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)})`,
        borderWidth: 2,
        data: dataset
      };

      if (chart.hasTableView) {
        obj = {
          entityName: entitySale[0].entity,
          totalOfferedCost: entitySale.map((d: any) => d.totalOfferedCost).reduce((acc: number, total: number) => acc + total),
          totalOfferedValue: entitySale.map((d: any) => d.totalOfferedValue).reduce((acc: number, total: number) => acc + total),
          budget: entitySale.map((d: any) => d.budget || 0).reduce((acc: number, total: number) => acc + total),
          period: `${moment(entitySale[0].date).format('MMM/YY')} - ${moment(entitySale[entitySale.length - 1].date).format('MMM/YY')}`
        };
        allEntities.push(obj);
      }

      allEntitiesChart.push(chartObj);
    }

    if (labels.length === 0) return null;

    dataObject = {
      labels: labels.map((d) => moment(d).format('MMM/YY')),
      datasets: allEntitiesChart
    };

    if (chart.hasTableView) {
      const tableData = allEntities.map((d: any) => ({
        period: d?.period,
        entityName: d?.entityName,
        budget: d.budget ?? 0,
        totalOfferedValue: d.totalOfferedValue ?? 0,
        totalOfferedCost: d.totalOfferedCost ?? 0
      }));
      Object.assign(dataObject, { tableData });
    }
  }

  if (chart.kpi === 'sales' && chart.uniqueId === 'offeredVsBudget') {
    const totalBookedData = [];
    const totalOfferedValueData = [];
    const labels = [];
    const budget = [];

    data = data.sort((a, b) => {
      const aDate = new Date(a.date).getTime();
      const bDate = new Date(b.date).getTime();

      return aDate - bDate;
    });

    for (let d of data) {
      if (currencyTo && currencyTo !== currencyFrom) {
        const bookedValueData: any = await getExchangeRates(moment(d.date).format('YYYY-MM-DD'), d.totalBookedValue || 0, currencyFrom, currencyTo);
        const offeredValueData: any = await getExchangeRates(moment(d.date).format('YYYY-MM-DD'), d.totalOfferedValue || 0, currencyFrom, currencyTo);
        const budgetData: any = await getExchangeRates(moment(d.date).format('YYYY-MM-DD'), d.budget || 0, currencyFrom, currencyTo);

        totalBookedData.push(bookedValueData ? bookedValueData.rates[currencyTo] : d.totalBookedValue || 0);
        totalOfferedValueData.push(offeredValueData ? offeredValueData.rates[currencyTo] : d.totalOfferedValue || 0);
        budget.push(budgetData ? budgetData.rates[currencyTo] : d.budget || 0);
      } else {
        totalBookedData.push(d.totalBookedValue || 0);
        totalOfferedValueData.push(d.totalOfferedValue || 0);
        budget.push(d.budget || 0);
      }
      labels.push(moment(d.date).format('MMM/YY'));
    }

    if (labels.length === 0) return null;

    dataObject = {
      labels,
      datasets: [
        {
          type: 'line',
          label: 'Total offered value',
          borderColor: 'rgb(54, 162, 235)',
          borderWidth: 2,
          fill: true,
          data: totalOfferedValueData
        },
        {
          type: 'line',
          label: 'Total Booked Value',
          borderColor: 'rgb(254, 162, 35)',
          borderWidth: 2,
          fill: false,
          data: totalBookedData
        }
      ]
    };

    if (chart.hasTableView) {
      const tableData = data.map((d: any) => ({
        month: moment(d.date).format('MMM/YY'),
        totalBookedValue: d.totalBookedValue ? d.totalBookedValue : 0,
        totalOfferValue: d.totalOfferedValue
      }));

      Object.assign(dataObject, { tableData });
    }
  }

  if (chart.uniqueId === 'volumeVsBudget' || chart.uniqueId === 'volume2VsBudget') {
    const totalVolumeData = [];
    const labels = [];
    const budget = [];

    data = data.sort((a: any, b: any) => {
      const aDate = new Date(a.date).getTime();
      const bDate = new Date(b.date).getTime();

      return aDate - bDate;
    });

    for (let d of data) {
      totalVolumeData.push(d.totalBookedVolume);
      budget.push(d.volumeBudget);
      labels.push(moment(d.date).format('MMM/YY'));
    }

    if (labels.length === 0) return null;

    dataObject = {
      labels,
      datasets: [
        {
          type: 'line',
          label: 'Total booked value',
          borderColor: 'rgb(54, 162, 235)',
          borderWidth: 2,
          fill: true,
          data: totalVolumeData
        },
        {
          type: 'line',
          label: 'Budget',
          borderColor: 'rgb(254, 162, 35)',
          borderWidth: 2,
          fill: false,
          data: budget
        }
      ]
    };

    if (chart.hasTableView) {
      const tableData = data.map((d: any) => ({
        month: moment(d.date).format('MMM/YY'),
        totalVolumeBooked: d.volumeBudget ? d.volumeBudget : 0,
        totalVolume: d.totalVolume
      }));

      Object.assign(dataObject, { tableData });
    }
  }

  if (chart.uniqueId === 'openOpportinityByCustomer') {
    const labels = [];
    const datasets = [];
    for (let d of data) {
      labels.push(d.customerAccount);
      datasets.push(d.count);
    }

    if (labels.length === 0) return null;

    dataObject = {
      labels,
      datasets: [
        {
          label: '',
          data: datasets,
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 206, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
            'rgba(255, 159, 64, 0.8)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)'
          ],
          borderWidth: 1
        }
      ]
    };
  }

  if (chart.uniqueId === 'openQuote') {
    const open = data.open;
    const total = data.count;
    dataObject = {
      labels: ['Open', 'Total'],
      datasets: [
        {
          label: '',
          data: [open, total],
          backgroundColor: ['rgba(22, 51, 64, 1.0)', 'rgba(0, 0, 0, 0.2)']
        }
      ]
    };
  }

  if (chart.uniqueId === 'openQuoteByRep') {
    const labels = [];
    const datasets = [];

    for (let d of data) {
      if (d?.user?.firstName && d?.user?.lastName) {
        labels.push(`${d.user.firstName} ${d.user.lastName}`);
      } else {
        labels.push('Deleted User');
      }
      datasets.push(d.count);
    }

    if (labels.length === 0) return null;

    dataObject = {
      labels,
      datasets: [
        {
          label: '',
          data: datasets,
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 206, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
            'rgba(255, 159, 64, 0.8)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)'
          ],
          borderWidth: 1
        }
      ]
    };
  }

  if (chart.uniqueId === 'topCategory') {
    data = data
      .map((d: any) => ({ ...d, productCategory: d.hasOwnProperty('productCategory') ? d.productCategory : 'Deleted Category' }))
      .sort((a: any, b: any) => b.totalSell - a.totalSell);

    let topProductsData = [];

    for (const d of data) {
      let totalSell = 0;
      let totalCost = 0;
      if (d.totalSell && d.totalCost && currencyTo && currencyTo !== currencyFrom) {
        const sellRateData: any = await getExchangeRates(moment().format('YYYY-MM-DD'), d.totalSell, currencyFrom, currencyTo);
        const costRateData: any = await getExchangeRates(moment().format('YYYY-MM-DD'), d.totalCost, currencyFrom, currencyTo);
        totalSell = sellRateData.rates[currencyTo];
        totalCost = costRateData.rates[currencyTo];
      } else {
        totalSell = d.totalSell;
        totalCost = d.totalCost;
      }
      topProductsData.push({ ...d, totalSell, totalCost });
    }

    dataObject = topProductsData.map((d) => {
      return {
        productCategory: d.productCategory,
        totalAmount: d.totalSell ?? 0
      };
    });
  }

  if (chart.uniqueId === 'opportunityTrend') {
    const won = [];
    const lost = [];
    const open = [];
    const labels = [];

    data = data.sort((a, b) => {
      const aDate = new Date(a.date).getTime();
      const bDate = new Date(b.date).getTime();

      return aDate - bDate;
    });

    for (let d of data) {
      if (d.outcome === 'Won') {
        won.push(d.count);
      }
      if (d.outcome === 'Lost') {
        lost.push(d.count);
      }
      if (d.outcome === '') {
        open.push(d.count);
      }

      if (!labels.includes(d.date)) {
        labels.push(d.date);
      }
    }

    if (labels.length === 0) return null;

    dataObject = {
      labels: labels.map((d) => moment(d).format('MMM/YY')),
      datasets: [
        {
          type: 'line',
          label: 'Won',
          borderColor: 'rgb(20, 162, 35)',
          backgroundColor: 'rgb(20, 162, 35, 0.4)',
          borderWidth: 2,
          fill: true,
          data: won
        },
        {
          type: 'line',
          label: 'Lost',
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgb(255, 99, 132, 0.4)',
          borderWidth: 2,
          fill: true,
          data: lost
        },
        {
          type: 'line',
          label: 'Open',
          borderColor: 'rgb(250, 155, 80)',
          backgroundColor: 'rgb(250, 155, 80, 0.4)',
          borderWidth: 2,
          fill: true,
          data: open
        }
      ]
    };
  }

  if (chart.uniqueId === 'createdLead') {
    data = data.sort((a: any, b: any) => {
      const aDate = new Date(a.date).getTime();
      const bDate = new Date(b.date).getTime();

      return aDate - bDate;
    });

    const dataset = [];
    const labels = [];

    for (let d of data) {
      dataset.push(d.count);
      labels.push(d.date);
    }

    if (labels.length === 0) return null;

    dataObject = {
      labels: labels.map((d) => moment(d).format('MMM/YY')),
      datasets: [
        {
          type: 'bar',
          label: 'Lead Count',
          borderColor: 'rgb(20, 162, 35)',
          backgroundColor: 'rgb(20, 162, 35, 0.4)',
          borderWidth: 2,
          fill: true,
          data: dataset
        }
      ]
    };
  }

  return dataObject;
};
