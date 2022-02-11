export default [
  {
    name: 'Dashboard 1',
    charts: [
      {
        col: 8,
        title: 'Total Booked value in USD vs Budget',
        kpi: 'sales',
        type: 'line',
        hasFilter: true,
        hasExport: true,
        hasTableView: true,
        filters: [
          { key: 'entity', title: 'Entity', multiple: false },
          { key: 'subMarketSegment', title: 'Sub Market Segment', multiple: true },
          { key: 'salesRep', title: 'Sales Rep', multiple: true },
          { key: 'marketSegment', title: 'Market Segment', multiple: true },
          { key: 'productCategory', title: 'Product Category', multiple: true },
          { key: 'customerAccount', title: 'Customer Account', multiple: true },
          { key: 'countrySellTo', title: 'Country Sell To', multiple: false },
          { key: 'countryBillTo', title: 'Country Bill To', multiple: false }
        ]
      },
      {
        col: 4,
        title: 'Regional Sales',
        kpi: '/sales',
        type: 'list',
        filters: [],
        hasFilter: false,
        hasExport: false,
        hasTableView: false
      },
      {
        col: 12,
        title: 'Total Booked value in USD vs Budget',
        kpi: '/sales',
        type: 'line',
        hasFilter: true,
        hasExport: false,
        hasTableView: true,
        filters: [
          { key: 'entity', title: 'Entity', multiple: false },
          { key: 'subMarketSegment', title: 'Sub Market Segment', multiple: true },
          { key: 'salesRep', title: 'Sales Rep', multiple: true },
          { key: 'marketSegment', title: 'Market Segment', multiple: true },
          { key: 'productCategory', title: 'Product Category', multiple: true },
          { key: 'customerAccount', title: 'Customer Account', multiple: true },
          { key: 'countrySellTo', title: 'Country Sell To', multiple: false },
          { key: 'countryBillTo', title: 'Country Bill To', multiple: false }
        ]
      },
      {
        col: 5,
        title: 'Sales Reps',
        kpi: '/sales',
        type: 'pie',
        hasFilter: true,
        hasExport: false,
        hasTableView: true,
        filters: [
          { key: 'entity', title: 'Entity', multiple: false },
          { key: 'subMarketSegment', title: 'Sub Market Segment', multiple: true },
          { key: 'salesRep', title: 'Sales Rep', multiple: true },
          { key: 'marketSegment', title: 'Market Segment', multiple: true },
          { key: 'productCategory', title: 'Product Category', multiple: true },
          { key: 'customerAccount', title: 'Customer Account', multiple: true },
          { key: 'countrySellTo', title: 'Country Sell To', multiple: false },
          { key: 'countryBillTo', title: 'Country Bill To', multiple: false }
        ]
      },
      {
        col: 7,
        title: 'Total Booked value in USD vs Budget',
        kpi: '/sales',
        type: 'bar',
        hasFilter: true,
        hasExport: false,
        hasTableView: true,
        filters: [
          { key: 'entity', title: 'Entity', multiple: false },
          { key: 'subMarketSegment', title: 'Sub Market Segment', multiple: true },
          { key: 'salesRep', title: 'Sales Rep', multiple: true },
          { key: 'marketSegment', title: 'Market Segment', multiple: true },
          { key: 'productCategory', title: 'Product Category', multiple: true },
          { key: 'customerAccount', title: 'Customer Account', multiple: true },
          { key: 'countrySellTo', title: 'Country Sell To', multiple: false },
          { key: 'countryBillTo', title: 'Country Bill To', multiple: false }
        ]
      },
      {
        col: 6,
        title: 'Opportunity by Accounts',
        kpi: '/sales',
        type: 'doughnut',
        hasFilter: true,
        hasExport: false,
        hasTableView: true,
        filters: [
          { key: 'entity', title: 'Entity', multiple: false },
          { key: 'subMarketSegment', title: 'Sub Market Segment', multiple: true },
          { key: 'salesRep', title: 'Sales Rep', multiple: true },
          { key: 'marketSegment', title: 'Market Segment', multiple: true },
          { key: 'productCategory', title: 'Product Category', multiple: true },
          { key: 'customerAccount', title: 'Customer Account', multiple: true },
          { key: 'countrySellTo', title: 'Country Sell To', multiple: false },
          { key: 'countryBillTo', title: 'Country Bill To', multiple: false }
        ]
      },
      {
        col: 6,
        title: 'Sales Rep by Quotes',
        kpi: '/sales',
        type: 'bar',
        hasFilter: false,
        hasExport: false,
        hasTableView: false,
        filters: []
      }
    ]
  }
];
