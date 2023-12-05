import { isEmpty } from 'lodash';
import axiosInstance from 'src/axios/axiosInstance';

export const gridFilterParser = (filters) => {
  const filterByIds: any = [];
  const deepFilters: any = [];

  if (!isEmpty(filters)) {
    Object.keys(filters).forEach((field) => {
      if (filters[field].operator && filters[field].condition1) {
        filterByIds.push({
          field: field,
          term: { $in: filters[field].condition1?.filter?.map((e) => e.optionValue) }
        });
      } else {
        deepFilters.push({
          field: field,
          term: Array.isArray(filters[field].filter) ? filters[field].filter : filters[field].filter
        });
      }
    });
  }

  return { filterByIds, deepFilters };
};

let timeout;
export const updateGridHiddenColumns = ({
  hiddenColumns = [],
  columnOrder = [],
  renderedFrom,
  user,
  callback
}: {
  hiddenColumns?: string[];
  columnOrder?: string[];
  renderedFrom: string;
  user: any;
  callback?: (data) => void;
}) => {
  if (timeout) clearTimeout(timeout);
  timeout = setTimeout(function () {
    let data = localStorage.getItem('gridMetaData');
    let request = data === 'undefined' ? {} : { ...JSON.parse(data) };

    if (request[renderedFrom]) {
      request[renderedFrom].order = columnOrder.length > 0 ? columnOrder : request[renderedFrom].order;
      request[renderedFrom].hide = hiddenColumns.length > 0 ? hiddenColumns : request[renderedFrom].hide;
    } else {
      request[renderedFrom] = {
        order: columnOrder,
        hide: hiddenColumns
      };
    }
    if (callback) callback(request[renderedFrom]);
    postGridMetadata(request, user, callback);
  }, 300);
};

const postGridMetadata = (request, user, callback) => {
  axiosInstance()
    .post(`user/meta-grid`, {
      _id: user?.user?._id,
      gridMetaData: { ...request }
    })
    .then((data) => {
      fetchGridMetaData(user);
    });
};

const fetchGridMetaData = (user) => {
  axiosInstance()
    .get(`user/meta-grid/${user?.user?._id}`)
    .then(({ data: { data } }) => {
      let tempMetaData = JSON.stringify(data?.gridMetaData);
      localStorage.setItem('gridMetaData', tempMetaData);
    });
};


