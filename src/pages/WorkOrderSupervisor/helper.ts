export const queryStringPlanned = (queryString) => {
  const queryParams = queryString.startsWith('&') ? queryString.slice(1).split('&') : queryString.split('&');
  const params = queryParams.reduce((acc, pair) => {
    const [key, value] = pair.split('=');
    acc[key] = value;
    return acc;
  }, {});
  const filterByIds: any = [];
  const nIn = params['nIn'];
  Object.keys(params)?.map((_k) => {
    if (['service']?.includes(_k)) {
      if (nIn && nIn?.length > 0 && nIn?.includes(_k)) {
        filterByIds.push({ field: _k, term: { $nin: params[_k]?.split(',') } });
      } else {
        filterByIds.push({ field: _k, term: { $in: params[_k]?.split(',') } });
      }
    }
  });

  return filterByIds;
};
