import { Box, CssBaseline } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import styles from './index.module.scss';

const AzureSSOError = () => {
  const [error, setError] = useState('Something went wrong');

  useEffect(() => {
    const searchParams = new URLSearchParams(document.location.search);
    const errorMessage = searchParams.get('message');
    if (errorMessage) setError(errorMessage);
  }, []);

  return (
    <>
      <CssBaseline />
      <div className={styles.main} style={{ '--custom-grid-cols': '1fr 1fr' } as React.CSSProperties}>
        <div className={styles.bg}>
          <div className={styles.contentContainer}>
              <p>{error}</p>
              <Link to="/login" className={`${'cursor-pointer'} ${'setLink'}`}>Login</Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default AzureSSOError;
