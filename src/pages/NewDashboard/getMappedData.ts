import moment from 'moment';

import { getExchangeRates, formatAmountWithCurrency } from 'src/constants/helpers';
import { ChartDataType } from './ChartTypes';

export default async (chart: ChartDataType, data: any, currencyTo: string, currencyFrom: string, status: string = 'Open') => {
  if (!data || (Array.isArray(data) && data.length === 0)) return null;

  let dataObject: any;
  let cardsId = ['bookedRevenueCard', 'offeredRevenueCard'];

  if (chart.kpi === 'sales' && (chart.uniqueId === 'bookedVSBudget' || cardsId.includes(chart.uniqueId))) {
    const bookedValueData = [];
    const bookedCostData = [];
    const bookedVolumeData = [];
    const offeredVolumeData = [];
    const offeredValueData = [];
    const offeredCostData = [];
    const labels = [];
    const budget = [];
    const volumeUnit = data[0]?.volumeUnit;

    data = data.sort((a, b) => {
      const aDate = new Date(a.date).getTime();
      const bDate = new Date(b.date).getTime();

      return aDate - bDate;
    });

    for (let d of data) {
      if (currencyTo && currencyFrom && currencyTo !== currencyFrom) {
        const salesData: any = await Promise.all([
          getExchangeRates(moment(d.date).format('YYYY-MM-DD'), d.totalBookedValue || 0, currencyFrom, currencyTo),
          getExchangeRates(moment(d.date).format('YYYY-MM-DD'), d.totalBookedCost || 0, currencyFrom, currencyTo),
          getExchangeRates(moment(d.date).format('YYYY-MM-DD'), d.totalOfferedValue || 0, currencyFrom, currencyTo),
          getExchangeRates(moment(d.date).format('YYYY-MM-DD'), d.totalOfferedCost || 0, currencyFrom, currencyTo),
          getExchangeRates(moment(d.date).format('YYYY-MM-DD'), d.budget || 0, currencyFrom, currencyTo)
        ]);
        const bookedValue: any = salesData[0]?.rates[currencyTo];
        const bookedCost: any = salesData[1]?.rates[currencyTo];
        const offeredValue: any = salesData[2]?.rates[currencyTo];
        const offeredCost: any = salesData[3]?.rates[currencyTo];
        const budgetData: any = salesData[4]?.rates[currencyTo];

        bookedValueData.push(bookedValue || 0);
        bookedCostData.push(bookedCost || 0);
        offeredValueData.push(offeredValue || 0);
        offeredCostData.push(offeredCost || 0);
        budget.push(budgetData || 0);
      } else {
        bookedValueData.push(d.totalBookedValue || 0);
        bookedCostData.push(d.totalBookedCost || 0);
        offeredValueData.push(d.totalOfferedValue || 0);
        offeredCostData.push(d.totalOfferedCost || 0);
        budget.push(d.budget || 0);
      }

      bookedVolumeData.push(d.totalBookedVolume || 0);
      offeredVolumeData.push(d.totalOfferedVolume || 0);
      labels.push(moment(d.date).format('MMM/YY'));
    }

    if (labels.length === 0) return null;

    if (cardsId.includes(chart.uniqueId)) {
      let totalBookedValue = bookedValueData.reduce((acc, val) => acc + val);
      let totalBookedCost = bookedCostData.reduce((acc, val) => acc + val);
      let totalBookedVolume = bookedVolumeData.reduce((acc, val) => acc + val);
      let totalOfferedValue = offeredValueData.reduce((acc, val) => acc + val);
      let totalOfferedCost = offeredCostData.reduce((acc, val) => acc + val);
      let totalOfferedVolume = offeredVolumeData.reduce((acc, val) => acc + val);

      const grossMarginPercent = totalBookedCost && totalBookedValue ? ((totalBookedValue - totalBookedCost) / totalBookedValue) * 100 : 0;
      const offeredMarginPercent = totalOfferedCost && totalOfferedValue ? ((totalOfferedValue - totalOfferedCost) / totalOfferedValue) * 100 : 0;
      const grossMargin = totalBookedValue && totalBookedCost ? totalBookedValue - totalBookedCost : 0;
      const offeredMargin = totalOfferedCost && totalOfferedValue ? totalOfferedValue - totalOfferedCost : 0;
      const hitRatioValue = totalBookedValue && totalOfferedValue ? totalBookedValue / totalOfferedValue : 0;
      const hitRatioCost = totalBookedCost && totalOfferedCost ? totalBookedCost / totalOfferedCost : 0;
      const hitRatioMargin = grossMargin && offeredMargin ? grossMargin / offeredMargin : 0;
      const hitRatioVolume = totalBookedVolume && totalOfferedVolume ? totalBookedVolume / totalOfferedVolume : 0;

      if (chart.uniqueId === 'bookedRevenueCard') {
        const cardData = {
          ['Total Booked Volume']: `${totalBookedVolume.toFixed(2)} ${volumeUnit}`,
          ['Total Booked Value']: totalBookedValue
            ? formatAmountWithCurrency(currencyTo ? currencyTo : currencyFrom, totalBookedValue).fullFormatAmount
            : 0,
          ['Total Booked Cost']: totalBookedCost
            ? formatAmountWithCurrency(currencyTo ? currencyTo : currencyFrom, totalBookedCost).fullFormatAmount
            : 0,
          ['Booked Gross Margin']: `${
            grossMargin ? formatAmountWithCurrency(currencyTo ? currencyTo : currencyFrom, grossMargin).fullFormatAmount : 0
          } (${grossMarginPercent > 0 ? grossMarginPercent.toFixed(2) : 0}%)`
        };

        dataObject = {
          additionalData: {
            volumeUnit,
            currencyTo,
            ['Total Booked Volume']: isNaN(hitRatioVolume) ? 0 : hitRatioVolume * 100,
            ['Total Booked Value']: isNaN(hitRatioValue) ? 0 : hitRatioValue * 100,
            ['Total Booked Cost']: isNaN(hitRatioCost) ? 0 : hitRatioCost * 100,
            ['Booked Gross Margin']: isNaN(hitRatioMargin) ? 0 : hitRatioMargin * 100
          },
          cardData
        };
      }

      if (chart.uniqueId === 'offeredRevenueCard') {
        const cardData = {
          ['Total Offered Volume']: `${totalOfferedVolume.toFixed(2)} ${volumeUnit}`,
          ['Total Offered Value']: totalOfferedValue
            ? formatAmountWithCurrency(currencyTo ? currencyTo : currencyFrom, totalOfferedValue).fullFormatAmount
            : 0,
          ['Total Offered Cost']: totalOfferedCost
            ? formatAmountWithCurrency(currencyTo ? currencyTo : currencyFrom, totalOfferedCost).fullFormatAmount
            : 0,
          ['Offered Gross Margin']: `${
            offeredMargin ? formatAmountWithCurrency(currencyTo ? currencyTo : currencyFrom, offeredMargin).fullFormatAmount : 0
          } (${offeredMarginPercent > 0 ? offeredMarginPercent.toFixed(2) : 0}%)`
        };

        dataObject = {
          cardData
        };
      }
    }

    if (!cardsId.includes(chart.uniqueId)) {
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
            label: 'Total offered value',
            borderColor: 'rgb(253, 126, 20)',
            borderWidth: 2,
            fill: true,
            data: offeredValueData
          },
          {
            type: 'line',
            label: 'Budget',
            borderColor: 'rgb(254, 97, 104)',
            borderWidth: 2,
            fill: false,
            data: budget
          }
        ]
      };

      if (chart.hasTableView) {
        const tableData = data.map((d) => ({
          month: moment(d.date).format('MMM/YY'),
          totalBookedValue: d.totalBookedValue ? d.totalBookedValue : 0,
          totalOfferedValue: d.totalOfferedValue ? d.totalOfferedValue : 0,
          budget: d.budget ? d.budget : 0
        }));
        Object.assign(dataObject, { tableData });
      }
    }
  }

  if (chart.uniqueId === 'regionalSale') {
    data = data.sort((a: any, b: any) => b.totalSell - a.totalSell);
    // Total Booked Volume, Total Offered Volume, Total Booked Value, Total Offered Value, Total Booked GM, Total Offered GM
    let regionSalesData = [];

    for (const d of data) {
      let totalBookedValue = 0;
      let totalOfferedValue = 0;
      let totalBookedMargin = 0;
      let totalOfferedMargin = 0;
      let totalBookedVolume = d?.totalBookedVolume || 0;
      let totalOfferedVolume = d?.totalOfferedVolume || 0;

      if (currencyTo && currencyTo !== currencyFrom) {
        const salesData: any = await Promise.all([
          getExchangeRates(moment().format('YYYY-MM-DD'), d?.totalBookedValue || 0, currencyFrom, currencyTo),
          getExchangeRates(moment().format('YYYY-MM-DD'), d?.totalOfferedValue || 0, currencyFrom, currencyTo),
          getExchangeRates(moment().format('YYYY-MM-DD'), d?.totalBookedMargin || 0, currencyFrom, currencyTo),
          getExchangeRates(moment().format('YYYY-MM-DD'), d?.totalOfferedMargin || 0, currencyFrom, currencyTo)
        ]);
        totalBookedValue = salesData[0]?.rates[currencyTo] || 0;
        totalOfferedValue = salesData[1]?.rates[currencyTo] || 0;
        totalBookedMargin = salesData[2]?.rates[currencyTo] || 0;
        totalOfferedMargin = salesData[3]?.rates[currencyTo] || 0;
      } else {
        totalBookedValue = d?.totalBookedValue || 0;
        totalOfferedValue = d?.totalOfferedValue || 0;
        totalBookedMargin = d?.totalBookedMargin || 0;
        totalOfferedMargin = d?.totalOfferedMargin || 0;
      }

      regionSalesData.push({
        region: d.region,
        ['totalOfferedVolume MT']: totalOfferedVolume,
        totalOfferedValue,
        ['totalOffered GM']: totalOfferedMargin,
        ['totalBookedVolume MT']: totalBookedVolume,
        totalBookedValue,
        ['totalBooked GM']: totalBookedMargin
      });
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
        const totalOfferedCost = entitySale.map((d: any) => d.totalOfferedCost).reduce((acc: number, total: number) => acc + total);
        const totalOfferedValue = entitySale.map((d: any) => d.totalOfferedValue).reduce((acc: number, total: number) => acc + total);
        obj = {
          entityName: entitySale[0].entity,
          totalOfferedCost: !isNaN(totalOfferedCost) ? totalOfferedCost : 0,
          totalOfferedValue: !isNaN(totalOfferedValue) ? totalOfferedValue : 0,
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
        const salesData: any[] = await Promise.all([
          getExchangeRates(moment(d.date).format('YYYY-MM-DD'), d.totalBookedValue || 0, currencyFrom, currencyTo),
          getExchangeRates(moment(d.date).format('YYYY-MM-DD'), d.totalOfferedValue || 0, currencyFrom, currencyTo),
          getExchangeRates(moment(d.date).format('YYYY-MM-DD'), d.budget || 0, currencyFrom, currencyTo)
        ]);
        const bookedValueData: any = salesData[0]?.rates[currencyTo];
        const offeredValueData: any = salesData[1]?.rates[currencyTo];
        const budgetData: any = salesData[2]?.rates[currencyTo];

        totalBookedData.push(bookedValueData || 0);
        totalOfferedValueData.push(offeredValueData || 0);
        budget.push(budgetData || 0);
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
    let bookedData = [];
    let offeredData = [];
    let budget = [];
    let labels = [];
    let volumeUnit = '';

    data = data.sort((a: any, b: any) => {
      const aDate = new Date(a.date).getTime();
      const bDate = new Date(b.date).getTime();

      return aDate - bDate;
    });

    for (let d of data) {
      volumeUnit = d.volumeUnit;

      if (chart.uniqueId === 'volumeVsBudget') {
        bookedData.push(d?.totalBookedVolume || 0);
        offeredData.push(d?.totalOfferedVolume || 0);
        budget.push(d?.volumeBudget || 0);
      } else {
        if (currencyTo && currencyTo !== currencyFrom) {
          const salesData: any = await Promise.all([
            getExchangeRates(moment().format('YYYY-MM-DD'), d?.totalBookedMargin || 0, currencyFrom, currencyTo),
            getExchangeRates(moment().format('YYYY-MM-DD'), d?.totalOfferedMargin || 0, currencyFrom, currencyTo),
            getExchangeRates(moment().format('YYYY-MM-DD'), d?.marginBudget || 0, currencyFrom, currencyTo)
          ]);
          bookedData.push(salesData[0]?.rates[currencyTo] || 0);
          offeredData.push(salesData[1]?.rates[currencyTo] || 0);
          budget.push(salesData[2]?.rates[currencyTo] || 0);
        } else {
          bookedData.push(d?.totalBookedMargin || 0);
          offeredData.push(d?.totalOfferedMargin || 0);
          budget.push(d.volumeBudget || 0);
        }
      }
      labels.push(moment(d.date).format('MMM/YY'));
    }

    if (labels.length === 0) return null;

    dataObject = {
      labels,
      datasets: [
        {
          type: 'line',
          label: chart.uniqueId === 'volumeVsBudget' ? `Total booked volume (${volumeUnit})` : `Total booked (${volumeUnit})`,
          borderColor: 'rgb(54, 162, 235)',
          borderWidth: 2,
          fill: true,
          data: bookedData
        },
        {
          type: 'line',
          label: chart.uniqueId === 'volumeVsBudget' ? `Total Offered volume (${volumeUnit})` : `Total Offered (${volumeUnit})`,
          borderColor: 'rgb(254, 97, 104)',
          borderWidth: 2,
          fill: true,
          data: offeredData
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
        [chart.uniqueId === 'volumeVsBudget' ? 'totalBookedVolume MT' : 'totalBooked GM']:
          chart.uniqueId === 'volumeVsBudget' ? d.totalBookedVolume : d.totalBookedMargin,
        [chart.uniqueId === 'volumeVsBudget' ? 'totalOfferedVolume MT' : 'totalOffered GM']:
          chart.uniqueId === 'volumeVsBudget' ? d.totalOfferedVolume : d.totalOfferedMargin,
        ['totalBudget']: d.volumeBudget ? d.volumeBudget : 0
      }));

      Object.assign(dataObject, { tableData });
    }
  }

  if (chart.uniqueId === 'openQuotesByCustomer') {
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
    const won = data.won;
    dataObject = {
      labels: [`Open (${open})`, `Won (${won})`],
      datasets: [
        {
          label: `Total (${data.count})`,
          data: [open, won],
          backgroundColor: ['rgb(54, 162, 235)', 'rgba(253, 126, 20, 0.7)']
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
      topProductsData.push({ ...d, totalSell, totalCost, totalVolume: d.totalBookedVolume });
    }

    dataObject = topProductsData.map((d) => {
      return {
        productCategory: d.productCategory,
        'totalVolume (MT)': d.totalVolume ?? 0
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

  if (chart.uniqueId === 'assetsByMap') {
    dataObject = data;
  }

  if (chart.uniqueId === 'utilizationChart1') {
    const length = data.length;
    let total = data.map((_d: any) => _d?.inUsePercentage).reduce((acc: number, val: number) => acc + val) / length ?? 0;
    total = total !== 0 ? parseFloat(total.toFixed(4)) : total;
    dataObject = {
      labels: [`In Use (${total} %)`, 'Total Utilization (%)'],
      datasets: [
        {
          label: '(%) Utilization',
          data: [total, 100],
          backgroundColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)'],
          fill: true
        }
      ]
    };
  }

  if (chart.uniqueId === 'utilizationChart2') {
    const msToH = (msTime: number, isDay = false) => {
      if (!msTime || msTime === 0) return 0;
      msTime = msTime / (1000 * 60 * 60);

      if (msTime > 60 * 24 && isDay) msTime = msTime / (60 * 24);

      return msTime;
    };

    const labels = data.map((_d: any) => _d?.categoryName);
    const dataSet = data.map((_d: any) => msToH(_d?.totalUseTime));

    dataObject = {
      labels,
      datasets: [
        {
          label: 'Utilization in hours',
          data: dataSet,
          backgroundColor: 'rgb(54, 162, 235)'
        }
      ]
    };
    if (chart.hasTableView) {
      const tableData = data.map((_d) => {
        let dayInMs = 60 * 24 * 60 * 1000;
        let totalTime = _d?.totalUseTime > dayInMs ? Math.floor(msToH(_d?.totalUseTime, true)) : msToH(_d?.totalUseTime, false).toFixed(2);
        return {
          ['Category Name']: _d?.categoryName,
          [`Use Time (${_d?.totalUseTime > dayInMs ? 'In Days' : 'In Hours'})`]: totalTime
        };
      });

      Object.assign(dataObject, { tableData });
    }
  }

  if (chart.uniqueId === 'assetCount') {
    const getSum = (array, column) => {
      let values = array.map((item) => parseInt(item[column]) || 0);
      return values.reduce((a, b) => a + b);
    };

    const ignoreId = ['productName', '_id'];
    let labels = [];
    let values = [];

    Object.keys(data.data[0]).forEach((label: any) => {
      if (!ignoreId.includes(label)) {
        const val = getSum(data.data, label);
        if (val) {
          values.push(val);
          labels.push(label);
        }
      }
    });

    dataObject = {
      labels: labels,
      datasets: [
        {
          label: '(%) Utilization',
          data: values,
          backgroundColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)',
            'rgba(255, 99, 132, 0.6)'
          ],
          fill: true
        }
      ]
    };

    if (chart.hasTableView) {
      const tableData = data.data.map((d: any) => {
        const oldData = { ...d };
        delete oldData.productName;
        delete oldData._id;

        const total = Object.values(oldData).reduce((acc: number, val: number) => acc + val);

        return {
          ['Product']: d.productName,
          ['Total Assets']: total
        };
      });
      Object.assign(dataObject, { tableData });
    }
  }

  if (chart.uniqueId === 'rentalByCustomer') {
    let labels = [];
    let dataset = [];

    data.forEach(async (_d: any) => {
      if (_d?.rentalJob.length > 0) {
        labels.push(_d.accountName);
        let totalCount = _d.rentalJob.map((c: { count: boolean; status: string }) => c.count).reduce((acc, val) => acc + val);
        dataset.push(totalCount);
      }
    });

    dataObject = {
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
    };

    if (chart.hasTableView) {
      const tableData = data.map((d: any) => ({
        ['Account Name']: d?.accountName,
        ['No. Rental Jobs']:
          d?.rentalJob.length === 0
            ? 0
            : d?.rentalJob.map((c: { count: boolean; status: string }) => c.count).reduce((acc: number, val: number) => acc + val)
      }));

      Object.assign(dataObject, { tableData });
    }
  }

  return dataObject;
};
