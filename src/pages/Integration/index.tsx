import { useContext, useEffect, useState } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { HiArrowRight } from 'react-icons/hi';
import { getColors } from '../Home/helpers';
import styles from './index.module.scss';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { backendApi } from 'src/config';
import { useData } from 'src/StateProvider/Provider';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import IntegrationCardShell from 'src/pages/Integration/IntegrationCardShell';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { Delete, CheckBox } from '@mui/icons-material';
import slackLogo from 'src/assets/slack-logo.png';
import quickbooksLogo from 'src/assets/quickBooks-logo.png';
import ExtensionIcon from '@mui/icons-material/Extension';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const Integration = () => {
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { user }
  } = useData();

  const [integratedApps, setIntegratedApps] = useState<any[] | null>(null);

  const logoMap: Record<string, string> = {
    "slack": slackLogo,
    "quickBooks": quickbooksLogo,
  };

  const handleIntegration = async (integrationKey: string) => {
    if (integrationKey === 'slack') {
      try {
        const response = await axiosInstance().get('/integration/slack');
        const slackAppClientId = response.data.data.slackAppClientId;
        const scopes = encodeURIComponent('channels:read,chat:write,users:read');
        const state = encodeURIComponent(JSON.stringify({ brand: user?.user?.brand, frontendUrl: window.location.origin }));
        const authorizationUrl = `https://slack.com/oauth/v2/authorize?client_id=${slackAppClientId}&scope=${scopes}&redirect_uri=${REDIRECT_URI}&state=${state}`;
        window.location.href = authorizationUrl;
      } catch (error) {
        toastConfig.setToastConfig(error);
      }
    } else if (integrationKey === "quickBooks") {
      try {
        const res = await axiosInstance().post('/integration/quick-books/login', {
          backendUrl: backendApi,
          frontendUrl: window.location.href
        });
        window.location.href = res.data.loginUrl;
      } catch (error) {
        toastConfig.setToastConfig(error);
      }
    }
  };

  const handleRemoveIntegration = async (id: string) => {
    try {
      const response = await axiosInstance().delete('/integration', { data: { ids: [id] } });
      toastConfig.setToastConfig(response);
      fetchIntegratedApps();
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchIntegratedApps = async () => {
    try {
      const response = await axiosInstance().get('/integration/list');
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
        <CustomBreadCrumbs routes={[{ title: 'Integrations' }]} />
      </div>
      <div className="detail-container-v1">
        {integratedApps !== null ? (
          <Box className={styles.reportGrid} >
            {integratedApps.map((integration, index) => {
              const colors = getColors(index);
              const isIntegrated = integration.isActive;
              const logo = logoMap[integration.type];

              return (
                <div key={integration.type} className={styles.singleCard}>
                  <IntegrationCardShell
                    darkThemeBackgroundColor="var(--dark-secondary)"
                    background={'#efefefff'}
                    gradientColors={colors.gradient}
                    className={styles.cardInner}
                    minHeight={false}
                  >
                    {logo ? (
                      <img
                        src={logo}
                        alt={integration.type}
                        className={styles.floatIcon}
                        style={{ width: '60px', height: '60px', padding: '2px 2px' }}
                      />
                    ) : (
                      <ExtensionIcon
                        className={styles.floatIcon}
                        style={{ width: '60px', height: '60px', padding: '2px 2px' }}
                      />
                    )}

                    <Typography variant="h5">{integration.title}</Typography>

                    {!isIntegrated && (
                      <div
                        className={styles.integrateText}
                        onClick={() => handleIntegration(integration.type)}
                      >
                        <span>Click here to integrate</span>{' '}
                        <HiArrowRight className={styles.arrow} />
                      </div>
                    )}

                    {isIntegrated && (
                      <HtmlTooltip title="Integrated" style={{ position: 'absolute', top: 8, right: 16 }}>
                        <CheckCircleOutlineIcon color="success" />
                      </HtmlTooltip>
                    )}

                    {isIntegrated && (
                      <HtmlTooltip title="Remove Integration" style={{ position: 'absolute', bottom: 8, right: 10 }}>
                        <IconButton
                          disabled={!isIntegrated}
                          aria-label="Delete"
                          onClick={() => handleRemoveIntegration(integration.id)}
                        >
                          <Delete fontSize="small" color={isIntegrated ? 'error' : 'disabled'} />
                        </IconButton>
                      </HtmlTooltip>
                    )}
                  </IntegrationCardShell>
                </div>
              );
            })}

          </Box>
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </div>
    </div>
  );
};

export default Integration;
