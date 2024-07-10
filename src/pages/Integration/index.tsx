import { useContext } from "react"
import { Box, Typography } from '@material-ui/core';
import { HiArrowRight } from 'react-icons/hi';
import DashBoardCardShell from 'src/components/DashBoardCardShell';
import { getColors } from '../Home/helpers';
import styles from '../ReportMaster/index.module.scss';
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import { FaSlack } from 'react-icons/fa';
import axiosInstance from "src/axios/axiosInstance";
import { backendApi } from "src/config";
import { useData } from "src/StateProvider/Provider";


const Integration = () => {

  const toastConfig = useContext(CustomToastContext);

  const { state: { user } } = useData();

  // const REDIRECT_URI = 'https://7e9e-2401-4900-826d-d47c-5eba-20b7-66e5-2e04.ngrok-free.app/integration/slack/oauth/callback'; //This is for demo purpose, below will be the actual REDIRECT_URI
  const REDIRECT_URI = `${backendApi}/integration/slack/oauth/callback`;

  const integrationList = [
    {
      title: 'Slack',
      key: 'slack',
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

  return (
    <div className="main-container-v1">
      <div className="detail-container-v1">
        <Box className={styles.reportGrid}>
          <>
            {integrationList.map((integration: any, index: any) => {
              const colors = getColors(index);
              return (
                <div key={index} className={styles.singleCard}>
                  <DashBoardCardShell
                    darkThemeBackgroundColor="var(--dark-secondary)"
                    background={'#fff'}
                    gradientColors={colors.gradient}
                    className={styles.cardInner}
                    minHeight={false}
                  >
                    <FaSlack className={styles.floatIcon} size={"60"} />
                    <Typography variant="h5">{integration.title}</Typography>
                    <div className={styles.integrateText}>
                      <span>Click here to integrate</span> <HiArrowRight className={styles.arrow} onClick={() => handleIntegration(integration.key)} />
                    </div>
                  </DashBoardCardShell>
                </div>
              );
            })}
          </>
        </Box>
      </div>
    </div>
  );
};

export default Integration;
