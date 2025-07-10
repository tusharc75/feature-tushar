import { useLocation } from 'react-router-dom';
import { replaceAllMongoIds } from 'src/constants/helpers';

export const useUrlParser = () => {
  const { pathname, search, hash } = useLocation();
  return replaceAllMongoIds(`${pathname}${search}${hash}`);
};
