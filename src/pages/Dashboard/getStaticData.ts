import { formatAmountWithCurrency, displayDateTime } from 'src/constants/helpers';

async function getStaticData(data: any, currency: any) {
  let dataObject: any;

  const bookedValueData = [];
  const bookedCostData = [];
  const bookedVolumeData = [];
  const offeredVolumeData = [];
  const offeredValueData = [];
  const offeredCostData = [];
  const labels = [];
  const budget = [];
  const volumeBudgetData = [];
  const marginBudgetData = [];
  const bookedMarginData = [];
  const volumeUnit = data[0]?.volumeUnit;

  data = data.sort((a, b) => {
    const aDate = new Date(a.date).getTime();
    const bDate = new Date(b.date).getTime();

    return aDate - bDate;
  });

  for (let d of data) {
    bookedValueData.push(d.totalBookedValue || 0);
    bookedCostData.push(d.totalBookedCost || 0);
    offeredValueData.push(d.totalOfferedValue || 0);
    offeredCostData.push(d.totalOfferedCost || 0);
    budget.push(d.budget || 0);
    marginBudgetData.push(d.marginBudget || 0);
    bookedMarginData.push(d.totalBookedMargin || 0);
    bookedVolumeData.push(d.totalBookedVolume || 0);
    volumeBudgetData.push(d.volumeBudget || 0);
    offeredVolumeData.push(d.totalOfferedVolume || 0);
    labels.push(displayDateTime(d.date, 'MMM/YY'));
  }

  if (labels.length === 0) return null;

  let totalBookedValue = bookedValueData.reduce((acc, val) => acc + val);
  let totalBookedCost = bookedCostData.reduce((acc, val) => acc + val);
  let totalBookedVolume = bookedVolumeData.reduce((acc, val) => acc + val);
  let totalOfferedValue = offeredValueData.reduce((acc, val) => acc + val);
  let totalOfferedCost = offeredCostData.reduce((acc, val) => acc + val);
  let totalOfferedVolume = offeredVolumeData.reduce((acc, val) => acc + val);
  let totalBudget = budget.reduce((acc, val) => acc + val);
  let volumeBudget = volumeBudgetData.reduce((acc, val) => acc + val);
  let marginBudget = marginBudgetData.reduce((acc, val) => acc + val);

  const grossMargin = totalBookedValue === 0 && totalBookedCost === 0 ? 0 : totalBookedValue - totalBookedCost;
  const offeredMargin = totalOfferedValue === 0 && totalOfferedCost === 0 ? 0 : totalOfferedValue - totalOfferedCost;
  const grossMarginPercent = totalBookedValue !== 0 && totalBookedCost !== 0 ? ((totalBookedValue - totalBookedCost) / totalBookedValue) * 100 : 0;
  const offeredMarginPercent =
    totalOfferedValue !== 0 && totalOfferedCost !== 0 ? ((totalOfferedValue - totalOfferedCost) / totalOfferedValue) * 100 : 0;
  const grossMarginPercentBudget = marginBudget !== 0 && totalBudget !== 0 ? (marginBudget / totalBudget) * 100 : 0;

  const cardData = {
    offeredData: [
      {
        ['Total Booked Volume']: `${totalBookedVolume.toFixed(2)} ${volumeUnit || 'MT'}`,
        ['Hit Ratio']:
          totalBookedVolume && totalOfferedVolume
            ? isNaN(totalBookedVolume / totalOfferedVolume)
              ? 0
              : (totalBookedVolume / totalOfferedVolume) * 100
            : 0,
        ['Total Offered Volume']: `${totalOfferedVolume.toFixed(2)} ${volumeUnit || 'MT'}`
      },
      {
        ['Total Booked Value']: totalBookedValue
          ? formatAmountWithCurrency(currency, totalBookedValue).fullFormatAmount
          : 0,
        ['Hit Ratio']:
          totalBookedValue && totalOfferedValue
            ? isNaN(totalBookedValue / totalOfferedValue)
              ? 0
              : (totalBookedValue / totalOfferedValue) * 100
            : 0,
        ['Total Offered Value']: totalOfferedValue
          ? formatAmountWithCurrency(currency, totalOfferedValue).fullFormatAmount
          : 0
      },
      {
        ['Booked Gross Margin']: `${grossMargin ? formatAmountWithCurrency(currency, grossMargin).fullFormatAmount : 0
          } (${grossMarginPercent > 0 ? grossMarginPercent.toFixed(2) : 0}%)`,
        ['Hit Ratio']: grossMargin && offeredMargin ? (isNaN(grossMargin / offeredMargin) ? 0 : (grossMargin / offeredMargin) * 100) : 0,
        ['Offered Gross Margin']: `${offeredMargin ? formatAmountWithCurrency(currency, offeredMargin).fullFormatAmount : 0
          } (${offeredMarginPercent > 0 ? offeredMarginPercent.toFixed(2) : 0}%)`
      }
    ],
    budgetData: [
      {
        ['Total Booked Volume']: `${totalBookedVolume.toFixed(2)} ${volumeUnit || 'MT'}`,
        ['Hit Ratio']:
          totalBookedVolume && volumeBudget ? (isNaN(totalBookedVolume / volumeBudget) ? 0 : (totalBookedVolume / volumeBudget) * 100) : 0,
        ['Total Budget Volume']: `${volumeBudget.toFixed(2)} ${volumeUnit || 'MT'}`
      },
      {
        ['Total Booked Value']: totalBookedValue
          ? formatAmountWithCurrency(currency, totalBookedValue).fullFormatAmount
          : 0,
        ['Hit Ratio']: totalBookedValue && totalBudget ? (isNaN(totalBookedValue / totalBudget) ? 0 : (totalBookedValue / totalBudget) * 100) : 0,
        ['Total Budget']: totalBudget ? formatAmountWithCurrency(currency, totalBudget).fullFormatAmount : 0
      },
      {
        ['Booked Gross Margin']: `${grossMargin ? formatAmountWithCurrency(currency, grossMargin).fullFormatAmount : 0
          } (${grossMarginPercent > 0 ? grossMarginPercent.toFixed(2) : 0}%)`,
        ['Hit Ratio']: grossMargin && marginBudget ? (isNaN(grossMargin / marginBudget) ? 0 : (grossMargin / marginBudget) * 100) : 0,
        ['Total Budget Gross Margin']: `${marginBudget ? formatAmountWithCurrency(currency, marginBudget).fullFormatAmount : 0} (${grossMarginPercentBudget > 0 ? grossMarginPercentBudget.toFixed(2) : 0}%)`
      }
    ]
  };

  dataObject = {
    ...cardData
  };

  return dataObject;
}

export default getStaticData;
