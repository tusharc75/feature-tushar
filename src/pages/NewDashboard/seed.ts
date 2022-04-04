export default [
  {
    name: 'CRM + Dashboard',
    charts: [
      {
        col: 12,
        title: '',
        kpi: 'sales',
        type: 'cards',
        numberOfCards: 4,
        hasFilter: false,
        uniqueId: 'bookedRevenueCard',
        axis: '',
        hasExport: false,
        hasTableView: false,
        filters: []
      },
      {
        col: 12,
        title: '',
        kpi: 'sales',
        type: 'cards',
        numberOfCards: 4,
        hasFilter: false,
        uniqueId: 'offeredRevenueCard',
        axis: '',
        hasExport: false,
        hasTableView: false,
        filters: []
      },
      {
        col: 6,
        title: 'Total Booked Value in currency vs Total Offered Value in currency vs Budget',
        kpi: 'sales',
        type: 'line',
        hasFilter: true,
        uniqueId: 'bookedVSBudget',
        axis: 'x',
        hasExport: true,
        hasTableView: true,
        filters: [
          { key: 'salesRep', title: 'Sales Reps', multiple: false },
          { key: 'customerAccount', title: 'Customer Account', multiple: false },
          { key: 'marketSegment', title: 'Market Segment', multiple: false },
          { key: 'subMarketSegment', title: 'Sub Market Segment', multiple: false },
          { key: 'productCategory', title: 'Product Category', multiple: false },
          { key: 'countrySellTo', title: 'Country Sell To', multiple: false },
          { key: 'countryBillTo', title: 'Country Bill To', multiple: false }
        ]
      },
      {
        col: 6,
        title: 'Regional Sales',
        kpi: 'regionalsales',
        type: 'list',
        hasFilter: true,
        uniqueId: 'regionalSale',
        axis: 'x',
        hasExport: true,
        hasTableView: false,
        filters: [
          { key: 'salesRep', title: 'Sales Rep', multiple: false },
          { key: 'customerAccount', title: 'Customer Account', multiple: false },
          { key: 'marketSegment', title: 'Market Segment', multiple: false },
          { key: 'subMarketSegment', title: 'Sub Market Segment', multiple: false },
          { key: 'productCategory', title: 'Product Category', multiple: false }
        ]
      },
      {
        col: 6,
        title: 'Total offered value in currency vs Entities',
        kpi: 'sales',
        type: 'line',
        hasFilter: true,
        uniqueId: 'offeredVsEntities',
        axis: 'x',
        hasExport: true,
        hasTableView: true,
        filters: [
          { key: 'salesRep', title: 'Sales Rep', multiple: false },
          { key: 'customerAccount', title: 'Customer Account', multiple: false },
          { key: 'marketSegment', title: 'Market Segment', multiple: false },
          { key: 'subMarketSegment', title: 'Sub Market Segment', multiple: false },
          { key: 'countrySellTo', title: 'Country Sell To', multiple: false },
          { key: 'countryBillTo', title: 'Country Bill To', multiple: false }
        ]
      },
      {
        col: 6,
        title: 'Total offered value in currency vs Total booked value in currency',
        kpi: 'sales',
        type: 'line',
        hasFilter: true,
        uniqueId: 'offeredVsBudget',
        axis: 'x',
        hasExport: true,
        hasTableView: true,
        filters: [
          { key: 'salesRep', title: 'Sales Rep', multiple: false },
          { key: 'customerAccount', title: 'Customer Account', multiple: false },
          { key: 'marketSegment', title: 'Market Segment', multiple: false },
          { key: 'subMarketSegment', title: 'Sub Market Segment', multiple: false },
          { key: 'countrySellTo', title: 'Country Sell To', multiple: false },
          { key: 'countryBillTo', title: 'Country Bill To', multiple: false }
        ]
      },
      {
        col: 6,
        title: 'Total Booked Volume in MT vs Total Offered Volume in MT vs Budget',
        kpi: 'sales',
        type: 'line',
        hasFilter: true,
        uniqueId: 'volumeVsBudget',
        axis: 'x',
        hasExport: true,
        hasTableView: true,
        filters: [
          { key: 'salesRep', title: 'Sales Rep', multiple: false },
          { key: 'customerAccount', title: 'Customer Account', multiple: false },
          { key: 'marketSegment', title: 'Market Segment', multiple: false },
          { key: 'subMarketSegment', title: 'Sub Market Segment', multiple: false },
          { key: 'countrySellTo', title: 'Country Sell To', multiple: false },
          { key: 'countryBillTo', title: 'Country Bill To', multiple: false }
        ]
      },
      {
        col: 6,
        title: 'Total Booked GM in currency vs Total Offered GM in currency vs Budget',
        kpi: 'sales',
        type: 'line',
        hasFilter: true,
        uniqueId: 'volume2VsBudget',
        axis: 'x',
        hasExport: true,
        hasTableView: true,
        filters: [
          { key: 'salesRep', title: 'Sales Rep', multiple: false },
          { key: 'customerAccount', title: 'Customer Account', multiple: false },
          { key: 'marketSegment', title: 'Market Segment', multiple: false },
          { key: 'subMarketSegment', title: 'Sub Market Segment', multiple: false },
          { key: 'countrySellTo', title: 'Country Sell To', multiple: false },
          { key: 'countryBillTo', title: 'Country Bill To', multiple: false }
        ]
      },
      {
        col: 5,
        title: 'Quotes Status',
        kpi: 'open-quote',
        type: 'doughnut',
        hasFilter: true,
        uniqueId: 'openQuote',
        axis: 'x',
        hasExport: false,
        hasTableView: false,
        filters: [
          { key: 'subMarketSegment', title: 'Sub Market Segment', multiple: false },
          { key: 'marketSegment', title: 'Market Segment', multiple: false },
          { key: 'countrySellTo', title: 'Country Sell To', multiple: false },
          { key: 'countryBillTo', title: 'Country Bill To', multiple: false }
        ]
      },
      {
        col: 7,
        title: 'Type Quotes by Customer Account',
        kpi: 'quote/customer-account',
        type: 'bar',
        hasFilter: true,
        uniqueId: 'openQuotesByCustomer',
        axis: 'y',
        hasExport: false,
        hasTableView: false,
        filters: [
          { key: 'status', title: 'Status', multiple: false },
          { key: 'subMarketSegment', title: 'Sub Market Segment', multiple: false },
          { key: 'marketSegment', title: 'Market Segment', multiple: false },
          { key: 'countrySellTo', title: 'Country Sell To', multiple: false },
          { key: 'countryBillTo', title: 'Country Bill To', multiple: false }
        ]
      },

      {
        col: 6,
        title: 'Type quotes by Sales Rep',
        kpi: 'quote/sales-rep',
        type: 'pie',
        hasFilter: true,
        uniqueId: 'openQuoteByRep',
        axis: 'x',
        hasExport: false,
        hasTableView: false,
        filters: [
          { key: 'status', title: 'Status', multiple: false },
          { key: 'customerAccount', title: 'Customer Account', multiple: false },
          { key: 'marketSegment', title: 'Market Segment', multiple: false },
          { key: 'subMarketSegment', title: 'Sub Market Segment', multiple: false },
          { key: 'countrySellTo', title: 'Country Sell To', multiple: false },
          { key: 'countryBillTo', title: 'Country Bill To', multiple: false }
        ]
      },
      {
        col: 6,
        title: 'Top selling product categories',
        kpi: 'products',
        type: 'list',
        hasFilter: true,
        uniqueId: 'topCategory',
        axis: 'x',
        hasExport: true,
        hasTableView: false,
        filters: [
          { key: 'salesRep', title: 'Sales Rep', multiple: false },
          { key: 'customerAccount', title: 'Customer Account', multiple: false },
          { key: 'marketSegment', title: 'Market Segment', multiple: false },
          { key: 'subMarketSegment', title: 'Sub Market Segment', multiple: false },
          { key: 'countrySellTo', title: 'Country Sell To', multiple: false },
          { key: 'countryBillTo', title: 'Country Bill To', multiple: false }
        ]
      },
      {
        col: 6,
        title: 'Opportunity trends',
        kpi: 'trend/opportunities',
        type: 'bar',
        axis: 'x',
        hasFilter: true,
        uniqueId: 'opportunityTrend',
        hasExport: false,
        hasTableView: false,
        filters: [
          { key: 'salesRep', title: 'Sales Rep', multiple: false },
          { key: 'customerAccount', title: 'Customer Account', multiple: false },
          { key: 'marketSegment', title: 'Market Segment', multiple: false },
          { key: 'subMarketSegment', title: 'Sub Market Segment', multiple: false },
          { key: 'countrySellTo', title: 'Country Sell To', multiple: false },
          { key: 'countryBillTo', title: 'Country Bill To', multiple: false }
        ]
      },
      {
        col: 6,
        title: 'Created Leads',
        kpi: 'created/leads',
        type: 'bar',
        hasFilter: true,
        uniqueId: 'createdLead',
        axis: 'x',
        hasExport: false,
        hasTableView: false,
        filters: [
          { key: 'salesRep', title: 'Sales Rep', multiple: false },
          { key: 'customerAccount', title: 'Customer Account', multiple: false },
          { key: 'marketSegment', title: 'Market Segment', multiple: false },
          { key: 'subMarketSegment', title: 'Sub Market Segment', multiple: false },
          { key: 'countrySellTo', title: 'Country Sell To', multiple: false },
          { key: 'countryBillTo', title: 'Country Bill To', multiple: false }
        ]
      }
    ]
  },
  {
    name: 'New Dashboard',
    charts: [
      {
        col: 6,
        title: 'Opportunity trends',
        kpi: 'trend/opportunities',
        type: 'bar',
        axis: 'x',
        hasFilter: true,
        uniqueId: 'opportunityTrend',
        hasExport: false,
        hasTableView: false,
        filters: [
          { key: 'salesRep', title: 'Sales Rep', multiple: false },
          { key: 'customerAccount', title: 'Customer Account', multiple: false },
          { key: 'marketSegment', title: 'Market Segment', multiple: false },
          { key: 'subMarketSegment', title: 'Sub Market Segment', multiple: false },
          { key: 'countrySellTo', title: 'Country Sell To', multiple: false },
          { key: 'countryBillTo', title: 'Country Bill To', multiple: false }
        ]
      },
      {
        col: 6,
        title: 'Created Leads',
        kpi: 'created/leads',
        type: 'bar',
        hasFilter: true,
        uniqueId: 'createdLead',
        axis: 'x',
        hasExport: false,
        hasTableView: false,
        filters: [
          { key: 'salesRep', title: 'Sales Rep', multiple: false },
          { key: 'customerAccount', title: 'Customer Account', multiple: false },
          { key: 'marketSegment', title: 'Market Segment', multiple: false },
          { key: 'subMarketSegment', title: 'Sub Market Segment', multiple: false },
          { key: 'countrySellTo', title: 'Country Sell To', multiple: false },
          { key: 'countryBillTo', title: 'Country Bill To', multiple: false }
        ]
      },
      {
        col: 5,
        title: 'Open Quotes',
        kpi: 'open-quote',
        type: 'doughnut',
        hasFilter: true,
        uniqueId: 'openQuote',
        axis: 'x',
        hasExport: false,
        hasTableView: false,
        filters: [
          { key: 'status', title: 'Status', multiple: false },
          { key: 'subMarketSegment', title: 'Sub Market Segment', multiple: false },
          { key: 'marketSegment', title: 'Market Segment', multiple: false },
          { key: 'countrySellTo', title: 'Country Sell To', multiple: false },
          { key: 'countryBillTo', title: 'Country Bill To', multiple: false }
        ]
      },
      {
        col: 7,
        title: 'Open opportunities by Customer Account',
        kpi: 'opportunities/customer-account',
        type: 'bar',
        hasFilter: true,
        uniqueId: 'openOpportinityByCustomer',
        axis: 'y',
        hasExport: false,
        hasTableView: false,
        filters: [
          { key: 'status', title: 'Status', multiple: false },
          { key: 'subMarketSegment', title: 'Sub Market Segment', multiple: false },
          { key: 'marketSegment', title: 'Market Segment', multiple: false },
          { key: 'countrySellTo', title: 'Country Sell To', multiple: false },
          { key: 'countryBillTo', title: 'Country Bill To', multiple: false }
        ]
      },

      {
        col: 6,
        title: 'Open quotes by Sales Rep',
        kpi: 'quote/sales-rep',
        type: 'pie',
        hasFilter: true,
        uniqueId: 'openQuoteByRep',
        axis: 'x',
        hasExport: false,
        hasTableView: false,
        filters: [
          { key: 'status', title: 'Status', multiple: false },
          { key: 'customerAccount', title: 'Customer Account', multiple: false },
          { key: 'marketSegment', title: 'Market Segment', multiple: false },
          { key: 'subMarketSegment', title: 'Sub Market Segment', multiple: false },
          { key: 'countrySellTo', title: 'Country Sell To', multiple: false },
          { key: 'countryBillTo', title: 'Country Bill To', multiple: false }
        ]
      },
      {
        col: 6,
        title: 'Top selling product categories',
        kpi: 'products',
        type: 'list',
        hasFilter: true,
        uniqueId: 'topCategory',
        axis: 'x',
        hasExport: true,
        hasTableView: false,
        filters: [
          { key: 'salesRep', title: 'Sales Rep', multiple: false },
          { key: 'customerAccount', title: 'Customer Account', multiple: false },
          { key: 'marketSegment', title: 'Market Segment', multiple: false },
          { key: 'subMarketSegment', title: 'Sub Market Segment', multiple: false },
          { key: 'countrySellTo', title: 'Country Sell To', multiple: false },
          { key: 'countryBillTo', title: 'Country Bill To', multiple: false }
        ]
      }
    ]
  },
  {
    name: 'Asset Dashboard',
    charts: [
      {
        col: 6,
        title: 'Asset Location Base',
        kpi: 'location-base-assets',
        type: 'map',
        hasFilter: true,
        uniqueId: 'assetsByMap',
        hasExport: false,
        hasTableView: false,
        filters: [
          { key: 'productCategory', title: 'Product Category', multiple: true },
          { key: 'productDescription', title: "Product Master", multiple: true }
        ]
      },
      {
        col: 6,
        title: 'Total Utilization',
        kpi: 'assets-total-in-use',
        type: 'pie',
        hasFilter: true,
        uniqueId: 'utilizationChart1',
        hasExport: true,
        hasTableView: false,
        filters: [
          { key: 'productCategory', title: 'Product Category', multiple: true },
          { key: 'productDescription', title: "Product Master", multiple: true }
        ]
      },
      {
        col: 6,
        title: 'Assets by Category',
        kpi: 'assets-in-use-by-category',
        type: 'bar',
        axis: 'x',
        hasFilter: true,
        uniqueId: 'utilizationChart2',
        hasExport: true,
        hasTableView: true,
        filters: [
          { key: 'productCategory', title: 'Product Category', multiple: true },
          { key: 'productDescription', title: "Product Master", multiple: true }
        ]
      },
      {
        col: 6,
        title: 'Asset Count',
        kpi: 'product-with-status-count',
        type: 'pie',
        hasFilter: true,
        uniqueId: 'assetCount',
        hasExport: true,
        hasTableView: true,
        filters: [
          { key: 'productCategory', title: 'Product Category', multiple: true },
        ]
      },
      {
        col: 6,
        title: 'Rental Job by Customers',
        kpi: 'customer-in-resource',
        type: 'pie',
        hasFilter: false,
        uniqueId: 'rentalByCustomer',
        hasExport: true,
        hasTableView: true,
        filters: []
      }
    ]
  }
];
