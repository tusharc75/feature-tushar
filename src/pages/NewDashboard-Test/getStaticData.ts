import moment from 'moment';
import { getExchangeRates, formatAmountWithCurrency } from 'src/constants/helpers';
import { ChartDataType } from './ChartTypes'

export default async function (chart: ChartDataType, data: any, currencyTo: string, currencyFrom: string,) {


    let dataObject: any;

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


    let totalBookedValue = bookedValueData.reduce((acc, val) => acc + val);
    let totalBookedCost = bookedCostData.reduce((acc, val) => acc + val);
    let totalBookedVolume = bookedVolumeData.reduce((acc, val) => acc + val);
    let totalOfferedValue = offeredValueData.reduce((acc, val) => acc + val);
    let totalOfferedCost = offeredCostData.reduce((acc, val) => acc + val);
    let totalOfferedVolume = offeredVolumeData.reduce((acc, val) => acc + val);

    const grossMargin = totalBookedValue === 0 && totalBookedCost === 0 ? 0 : totalBookedValue - totalBookedCost;
    const offeredMargin = totalOfferedValue === 0 && totalOfferedCost === 0 ? 0 : totalOfferedValue - totalOfferedCost;
    const hitRatioValue = totalBookedValue && totalOfferedValue ? totalBookedValue / totalOfferedValue : 0;
    const hitRatioCost = totalBookedCost && totalOfferedCost ? totalBookedCost / totalOfferedCost : 0;
    const hitRatioMargin = grossMargin && offeredMargin ? grossMargin / offeredMargin : 0;
    const hitRatioVolume = totalBookedVolume && totalOfferedVolume ? totalBookedVolume / totalOfferedVolume : 0;
    const grossMarginPercent =
        totalBookedValue !== 0 && totalBookedCost !== 0 ? ((totalBookedValue - totalBookedCost) / totalBookedValue) * 100 : 0;
    const offeredMarginPercent =
        totalOfferedValue !== 0 && totalOfferedCost !== 0 ? ((totalOfferedValue - totalOfferedCost) / totalOfferedValue) * 100 : 0;


    const cardData = {
        additionalData: {
            ['Total Booked Volume']: isNaN(hitRatioVolume) ? 0 : hitRatioVolume * 100,
            ['Total Booked Value']: isNaN(hitRatioValue) ? 0 : hitRatioValue * 100,
            ['Total Booked Cost']: isNaN(hitRatioCost) ? 0 : hitRatioCost * 100,
            ['Booked Gross Margin']: isNaN(hitRatioMargin) ? 0 : hitRatioMargin * 100
        },
        bookedData: {
            ['Total Booked Volume']: `${totalBookedVolume.toFixed(2)} ${volumeUnit}`,
            ['Total Booked Value']: totalBookedValue
                ? formatAmountWithCurrency(currencyTo ? currencyTo : currencyFrom, totalBookedValue).fullFormatAmount
                : 0,
            ['Total Booked Cost']: totalBookedCost
                ? formatAmountWithCurrency(currencyTo ? currencyTo : currencyFrom, totalBookedCost).fullFormatAmount
                : 0,
            ['Booked Gross Margin']: `${grossMargin ? formatAmountWithCurrency(currencyTo ? currencyTo : currencyFrom, grossMargin).fullFormatAmount : 0
                } (${grossMarginPercent > 0 ? grossMarginPercent.toFixed(2) : 0}%)`
        },
        offeredData: {
            ['Total Offered Volume']: `${totalOfferedVolume.toFixed(2)} ${volumeUnit}`,
            ['Total Offered Value']: totalOfferedValue
                ? formatAmountWithCurrency(currencyTo ? currencyTo : currencyFrom, totalOfferedValue).fullFormatAmount
                : 0,
            ['Total Offered Cost']: totalOfferedCost
                ? formatAmountWithCurrency(currencyTo ? currencyTo : currencyFrom, totalOfferedCost).fullFormatAmount
                : 0,
            ['Offered Gross Margin']: `${offeredMargin ? formatAmountWithCurrency(currencyTo ? currencyTo : currencyFrom, offeredMargin).fullFormatAmount : 0
                } (${offeredMarginPercent > 0 ? offeredMarginPercent.toFixed(2) : 0}%)`
        }
    };

    dataObject = {
        ...cardData
    };


    return dataObject
}