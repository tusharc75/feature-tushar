import React from 'react';
import { Typography, Button } from '@material-ui/core';
import styles from './error.module.scss';
import errorImage from './assets/line-item.png';
import { VITE_APP_ENV } from 'src/config';

class ErrorBoundary extends React.Component<any, any> {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  componentDidCatch(error, errorInfo) {
    if (VITE_APP_ENV !== 'local') {
      if (error instanceof TypeError || error instanceof ReferenceError) {
        this.setState({
          error: error,
          errorInfo: errorInfo
        });
      }
    } else {
      this.setState({
        error: error,
        errorInfo: errorInfo
      });
    }
  }

  render() {
    if (this.state.errorInfo) {
      return (
        <div className={styles.main}>
          <div style={{ textAlign: 'center' }} className={styles.submain}>
            <div className={styles.vector}>
              {/* tesing */}
              <img src={errorImage} className="mx-auto max-w-[200px] sm:max-w-[250px] md:max-w-[300px] xl:max-w-full " alt="Something Went Wrong " />
            </div>
            <Typography style={{ fontWeight: 600 }} variant="h2" component="h2" className={styles.error}>
              Something went wrong!
            </Typography>
            <Typography variant="h4" className={styles.message}>
              Our team has been notified. If the problem persists, please contact Equipt support.
            </Typography>
            <Button variant="contained" color="primary" className={styles.reload} onClick={() => (window.location.href = '/')}>
              Try again
            </Button>
            {['local', 'master', 'development'].includes(VITE_APP_ENV) ? (
              <Typography variant="body1">
                <details style={{ whiteSpace: 'pre-wrap' }} className={styles.detailScreen}>
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo.componentStack}
                </details>
              </Typography>
            ) : null}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
export default ErrorBoundary;
