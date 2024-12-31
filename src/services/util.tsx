export const validateEmail = (value) => {
  var reg = /^([A-Za-z0-9_\-.])+([A-Za-z0-9_\-.])+([A-Za-z]{2,4})$/;

  if (reg.test(value) === false) {
    return false;
  }

  return true;
};
export const getSearchQuery = (url, params) => {
  if (params && Object.keys(params).length > 0) {
    url = url.indexOf('?') >= 0 ? url + '&' : url + '?';
    Object.keys(params).forEach((k, i) => {
      url = url + `${k}=${params[k]}`;
      if (i < Object.keys(params).length - 1) {
        url = url + '&';
      }
    });
  }
  return url;
};
export const getErrorMessage = (err) => {
  if (err?.response?.data) {
    if (err.response.data.message) {
      return err.response.data.message;
    } else if (err.response.data.error) {
      return err.response.data.error;
    }
  }
  return '';
};

export const getBordActionUrl = (type) => {
  switch (type.toLowerCase()) {
    case 'task':
      return { update: 'task/', delete: 'task/' };
    default:
      return { update: 'activity/field/', delete: '' };
  }
};

export const setCssVariable = ({ name = null, value = null }: { name: string; value: string }) => {
  if (!name || value) return false;
  const root = document.querySelector(':root') as HTMLElement;
  if (!root) return false;
  root.style.setProperty(name, value);
  return true;
};
