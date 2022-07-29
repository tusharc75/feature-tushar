import { GoogleLogin } from 'react-google-login';
import { useState } from 'react';

const Login = () => {
  const [loginData, setLoginData] = useState(localStorage.getItem('loginData') ? JSON.parse(localStorage.getItem('loginData')) : null);

  const handleLogin = async (googleData) => {
    const res = await fetch('http://localhost:4000/user/api/google-login', {
      method: 'POST',
      body: JSON.stringify({
        token: googleData.tokenId
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    }); 
    const data = await res.json();
    setLoginData(data);
    localStorage.setItem('loginData', JSON.stringify(data));
  };

  const handleLogout = () => {
    localStorage.removeItem('loginData');
    setLoginData(null);
  };

  const handleFailure = (result) => {
    alert(result);
  };

  return (
    <>
      <GoogleLogin
        clientId="982563739155-pahjra9o61n1fd3ptjp3sggdmkp6um28.apps.googleusercontent.com"
        buttonText="Log In with Google"
        onSuccess={handleLogin}
        onFailure={handleLogin}
        // cookiePolicy={'single_host_origin'}
      />
    </>
  );
};

export default Login;
