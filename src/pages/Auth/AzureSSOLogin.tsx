import { useEffect } from 'react';
import { useData } from 'src/StateProvider/Provider';
import { useHistory } from 'react-router-dom';

const AzureSSOLogin = () => {
  const history = useHistory();
  useEffect(() => {
    const searchParams = new URLSearchParams(document.location.search);
    const token = searchParams.get('token');
    (async () => {
      if (token) {
        history.push({ pathname: '/login/mfa', search: '?token=' + token });
      } else {
        window.location.href = '/sso-login-error';
      }
    })();
  }, []);

  return <></>;
};

export default AzureSSOLogin;
