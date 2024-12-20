import { useContext, useEffect, useState } from 'react';
import { Box, IconButton, Typography } from '@material-ui/core';
import { HiArrowRight } from 'react-icons/hi';
import { getColors } from '../Home/helpers';
import styles from './index.module.scss';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { FaSlack } from 'react-icons/fa';
import axiosInstance from 'src/axios/axiosInstance';
import { backendApi } from 'src/config';
import { useData } from 'src/StateProvider/Provider';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import IntegrationCardShell from 'src/pages/Integration/IntegrationCardShell';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { Delete, CheckBox } from '@material-ui/icons';
import slackLogo from 'src/assets/slack-logo.png';

const Integration = () => {
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { user, resources }
  } = useData();

  const [integratedApps, setIntegratedApps] = useState(null);

  // const REDIRECT_URI = 'https://348c-2401-4900-5a5f-9e02-97ff-2d8-6bc6-b7d2.ngrok-free.app/integration/slack/oauth/callback'; //This is for demo purpose, below will be the actual REDIRECT_URI
  const REDIRECT_URI = `${backendApi}/integration/slack/oauth/callback`;

  const integrationList = [
    {
      title: 'Slack',
      key: 'slack'
    }
  ];

  const handleIntegration = async (integrationKey) => {
    if (integrationKey === 'slack') {
      try {
        const response = await axiosInstance().get('/integration/slack');
        const slackAppClientId = response.data.data.slackAppClientId;
        const scopes = encodeURIComponent('channels:read,chat:write,users:read'); // update this as needed
        const state = encodeURIComponent(JSON.stringify({ brand: user?.user?.brand, frontendUrl: window.location.origin }));
        const authorizationUrl = `https://slack.com/oauth/v2/authorize?client_id=${slackAppClientId}&scope=${scopes}&redirect_uri=${REDIRECT_URI}&state=${state}`;
        window.location.href = authorizationUrl;
      } catch (error) {
        toastConfig.setToastConfig(error);
      }
    }
  };

  const handleRemoveIntegration = async (integratedId) => {
    try {
      const response = await axiosInstance().delete('/integration', { data: { _ids: [integratedId] } });
      toastConfig.setToastConfig(response);
      fetchIntegratedApps();
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchIntegratedApps = async () => {
    try {
      const response = await axiosInstance().get('/integration');
      setIntegratedApps(response.data.data || []);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  useEffect(() => {
    fetchIntegratedApps();
  }, []);

  return (
    <div className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ title: resources?.integration?.titlePlural }]} />
      </div>
      <div className="detail-container-v1">
        {integratedApps !== null ? (
          <>
            <Box className={styles.reportGrid}>
              {integrationList.map((integration: any, index: any) => {
                const integratedApp = integratedApps.find((app) => app.type === integration.key);
                const isIntegrated = Boolean(integratedApp);
                const colors = getColors(index);
                return (
                  <div key={index} className={styles.singleCard}>
                    <IntegrationCardShell
                      darkThemeBackgroundColor="var(--dark-secondary)"
                      background={'#fff'}
                      gradientColors={colors.gradient}
                      className={styles.cardInner}
                      minHeight={false}
                    >
                      {/* <FaSlack className={styles.floatIcon} size={"60"} /> */}
                      <img src={slackLogo} alt="Slack" className={styles.floatIcon} style={{ width: '60px', height: '60px' }} />
                      <Typography variant="h5">{integration.title}</Typography>
                      {isIntegrated ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>Integrated</span> <CheckBox />
                        </div>
                      ) : (
                        <div className={styles.integrateText} onClick={() => handleIntegration(integration.key)}>
                          <span>Click here to integrate</span> <HiArrowRight className={styles.arrow} />
                        </div>
                      )}
                      <HtmlTooltip title="Remove Integration" style={{ position: 'absolute', top: 1, right: 10 }}>
                        <IconButton
                          disabled={!isIntegrated}
                          aria-label="Delete"
                          onClick={() => {
                            handleRemoveIntegration(integratedApp._id);
                          }}
                        >
                          <Delete fontSize="small" color={isIntegrated ? 'error' : 'disabled'} />
                        </IconButton>
                      </HtmlTooltip>
                    </IntegrationCardShell>
                  </div>
                );
              })}
            </Box>
          </>
        ) : (
          <>
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          </>
        )}
      </div>
    </div>
  );
};

export default Integration;
