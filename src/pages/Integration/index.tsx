import { useContext } from "react"
import { Box, Typography } from '@material-ui/core';
import { HiArrowRight } from 'react-icons/hi';
import { ReportIcon } from 'src/assets/svg/svgIcons';
import DashBoardCardShell from 'src/components/DashBoardCardShell';
import { getColors } from '../Home/helpers';
import styles from '../ReportMaster/index.module.scss';
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import { useData } from "src/StateProvider/Provider";
import { backendApi, SLACK_APP_CLIENT_ID, SLACK_APP_SCOPES } from "src/config";


const Integration = () => {

  const toastConfig = useContext(CustomToastContext);

  const { state: { user } } = useData();


  // const SLACK_APP_REDIRECT_URI = 'https://e5b6-110-226-207-215.ngrok-free.app/integration/slack/oauth/callback'; // This is for demo purpose, below will be the actual REDIRECT_URI
  const SLACK_APP_REDIRECT_URI = `${backendApi}/integration/slack/oauth/callback`;


  const integrationList = [
    {
      title: 'Slack',
      key: 'slack',
    }
  ];

  const handleIntegrationClick = async (integrationKey) => {
    if (integrationKey === 'slack') {
      try {

        const SLACK_APP_OAUTH_URL = `https://slack.com/oauth/v2/authorize?client_id=${SLACK_APP_CLIENT_ID}&scope=${SLACK_APP_SCOPES}&redirect_uri=${SLACK_APP_REDIRECT_URI}&state=${user?.user?.brand}`;

        window.location.href = SLACK_APP_OAUTH_URL;

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
                    <ReportIcon colors={colors.iconGradient} className={styles.floatIcon} />
                    <Typography variant="h6">{integration.title}</Typography>
                    Click here to integrate <HiArrowRight className={styles.arrow} onClick={() => handleIntegrationClick(integration.key)} />
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
