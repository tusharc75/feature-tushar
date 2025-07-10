import { useLocation } from 'react-router-dom';
import { replaceAllMongoIds } from 'src/constants/helpers';

export const useUrlWithoutMongoId = () => {
  const { pathname, search, hash } = useLocation();
  const location = window.location;
  const pathNameWithoutId = replaceAllMongoIds(pathname);

  return {
    ...location,
    pathname: pathNameWithoutId,
    href: `${location.origin}${pathNameWithoutId}`,
    fullUrl: `${location.origin}${pathNameWithoutId}${search}${hash}`
  };
};
