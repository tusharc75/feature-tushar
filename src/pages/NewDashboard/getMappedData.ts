import moment from 'moment';

import { getExchangeRates } from '../../constants/helpers';
import { ChartDataType } from './ChartTypes';

export default async (chart: ChartDataType, data: any, currencyTo: string, currencyFrom: string) => {
  if (!data) return null;

  let dataObject: any;

  if (chart.kpi === 'sales' && (chart.uniqueId === 'bookedVSBudget' || chart.uniqueId === 'revenueCard')) {
    const saleData = [];
    const costData = [];
    const labels = [];
    const budget = [];

    data = data.sort((a, b) => {
      const aDate = new Date(a.date).getTime();
      const bDate = new Date(b.date).getTime();

      return aDate - bDate;
    });

    for (let d of data) {
      if (currencyTo && currencyFrom && currencyTo !== currencyFrom) {
        const totalSelldata: any = await getExchangeRates(moment(d.date).format('YYYY-MM-DD'), d.totalSell, currencyFrom, currencyTo);
        const totalCostData: any = await getExchangeRates(moment(d.date).format('YYYY-MM-DD'), d.totalCost, currencyFrom, currencyTo);
        const budgetData: any = await getExchangeRates(moment(d.date).format('YYYY-MM-DD'), d.budget, currencyFrom, currencyTo);

        saleData.push(totalSelldata ? totalSelldata.rates[currencyTo] : d.totalSell);
        costData.push(totalCostData ? totalCostData.rates[currencyTo] : d.totalCost);
        budget.push(budgetData ? budgetData.rates[currencyTo] : d.budget);
      } else {
        saleData.push(d.totalSell);
        costData.push(d.totalCost);
        budget.push(d.budget);
      }
      labels.push(moment(d.date).format('MMM/YY'));
    }

    if (labels.length === 0) return null;

    if (chart.uniqueId === 'revenueCard') {
      let revenue = saleData.reduce((acc, val) => acc + val);
      let spend = costData.reduce((acc, val) => acc + val);
      let revenueRate: any, spendRate: any;

      const profit = revenue && spend ? Math.floor(((revenue - spend) / spend) * 100) : 0;
      const profitValue = revenue && spend ? Math.floor(revenue - spend) : 0;

      if (currencyTo !== currencyFrom) {
        revenueRate = await getExchangeRates(moment().format('YYYY-MM-DD'), revenue, currencyFrom, currencyTo);
        spendRate = await getExchangeRates(moment().format('YYYY-MM-DD'), spend, currencyFrom, currencyTo);
      }

      dataObject = {
        ['Total Offered Value']: revenueRate ? revenueRate.rates[currencyTo] : revenue,
        ['Total Cost']: spendRate ? spendRate.rates[currencyTo] : spend,
        ['Gross Margin']: profit,
        ['Total Booked Volume in MT']: profitValue
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
            data: saleData
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
          totalSell: d.totalSell ? d.totalSell : 0,
          totalCost: d.totalSell ? d.totalCost : 0,
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
      const entitySale = data.filter((d) => d.entityId === id);

      for (const sale of entitySale) {
        if (currencyTo && currencyTo !== currencyFrom) {
          const totalOfferValuedata: any = await getExchangeRates(
            moment(sale.date).format('YYYY-MM-DD'),
            sale.totalOfferValue,
            currencyFrom,
            currencyTo
          );
          dataset.push(totalOfferValuedata ? totalOfferValuedata.rates[currencyTo] : sale.totalOfferValue);
        } else {
          dataset.push(sale.totalOfferValue);
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
          totalCost: entitySale.map((d: any) => d.totalCost).reduce((acc: number, total: number) => acc + total),
          totalOfferValue: entitySale.map((d: any) => d.totalOfferValue).reduce((acc: number, total: number) => acc + total),
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
        totalOfferValue: d.totalOfferValue ?? 0,
        totalCost: d.totalCost ?? 0
      }));
      Object.assign(dataObject, { tableData });
    }
  }

  if (chart.kpi === 'sales' && chart.uniqueId === 'offeredVsBudget') {
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
      if (currencyTo && currencyTo !== currencyFrom) {
        const totalSelldata: any = await getExchangeRates(moment(d.date).format('YYYY-MM-DD'), d.totalSell, currencyFrom, currencyTo);
        const totalOfferValueData: any = await getExchangeRates(moment(d.date).format('YYYY-MM-DD'), d.totalOfferValue, currencyFrom, currencyTo);
        const budgetData: any = await getExchangeRates(moment(d.date).format('YYYY-MM-DD'), d.budget, currencyFrom, currencyTo);

        saleData.push(totalSelldata ? totalSelldata.rates[currencyTo] : d.totalSell);
        OfferValueData.push(totalOfferValueData ? totalOfferValueData.rates[currencyTo] : d.totalOfferValue);
        budget.push(budgetData ? budgetData.rates[currencyTo] : d.budget);
      } else {
        saleData.push(d.totalSell);
        OfferValueData.push(d.totalOfferValue);
        budget.push(d.budget);
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
    };

    if (chart.hasTableView) {
      const tableData = data.map((d: any) => ({
        month: moment(d.date).format('MMM/YY'),
        totalBookedValue: d.totalSell ? d.totalSell : 0,
        totalOfferValue: d.totalOfferValue
      }));

      Object.assign(dataObject, { tableData });
    }
  }

  if (chart.uniqueId === 'volumeVsBudget' || chart.uniqueId === 'volume2VsBudget') {
    const volumeData = [];
    const labels = [];
    const budget = [];

    data = data.sort((a: any, b: any) => {
      const aDate = new Date(a.date).getTime();
      const bDate = new Date(b.date).getTime();

      return aDate - bDate;
    });

    for (let d of data) {
      if (currencyTo && currencyFrom && currencyTo !== currencyFrom) {
        const totalVolumeData: any = await getExchangeRates(moment(d.date).format('YYYY-MM-DD'), d.totalVolume, currencyFrom, currencyTo);
        const budgetData: any = await getExchangeRates(moment(d.date).format('YYYY-MM-DD'), d.volumeBudget, currencyFrom, currencyTo);

        volumeData.push(totalVolumeData ? totalVolumeData.rates[currencyTo] : d.totalVolume ? d.totalVolume : 0);
        budget.push(budgetData ? budgetData.rates[currencyTo] : d.volumeBudget ? d.volumeBudget : 0);
      } else {
        volumeData.push(d.totalVolume);
        budget.push(d.budget);
      }
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
          data: volumeData
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
