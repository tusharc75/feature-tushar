import { Box, Typography } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { FiExternalLink } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { SVGImages } from '../../assets/dashboard_images';
import styles from './Dashboard.module.scss';
import './style.scss';

import { HiArrowRight } from 'react-icons/hi';
import DashboardModal from 'src/components/DashboardModal';
import { userManual } from 'src/pages/Home';

interface sidecardInterface extends React.HTMLAttributes<HTMLDivElement> {
  objBySectionName: any;
  handleRoutes: any;
  mode: 'Workspace' | 'Setups & Administration' | 'User Manual';
}

const DisplaySideCard = ({ objBySectionName, handleRoutes, mode = 'Workspace', ...others }: sidecardInterface) => {
  const [modalContent, setModalContent] = useState(null);
  const [colabData, setColabData] = useState(null);
  const style = { '--sideCardBg': '#FFFFFF' } as React.CSSProperties;
  const description =
    (mode === 'Workspace' && `By using Equipt Workspace, collaborate with your team members easily`) ||
    (mode === 'Setups & Administration' && `List of all product and category setups`);

  useEffect(() => {
    if (objBySectionName) {
      if (mode === 'Workspace') setColabData(objBySectionName['Collaboration Tools'] || objBySectionName['Activities'] || objBySectionName['Workspace'] || null);
      else setColabData(objBySectionName['Setups & Administration'] || objBySectionName['Setups'] || objBySectionName['Product Setup'] || null);
    }
  }, [objBySectionName]);

  const handleClose = () => {
    setModalContent(null);
  };
  return (
    <>
      {colabData ? (
        <div
          role="button"
          style={style}
          className={`${styles.rightInner} `}
          aria-label={`open ${mode}`}
          onClick={() => {
            if (mode === 'User Manual') {
              const token = localStorage.getItem('token');
              window.open(`${userManual.link}/?token=${encodeURIComponent(token)}`);
            } else {
              setModalContent({ items: colabData, title: mode, icon: <img src={SVGImages(mode)} alt={`${mode} Logo`} /> });
            }
          }}
          {...others}
        >
          <img src={SVGImages(mode)} alt={`${mode} Logo`} className={styles.colabLogo} />
          <Typography component={'h2'}>{mode}</Typography>
          <Typography component={'p'}>{mode !== 'User Manual' ? description : userManual.description}</Typography>
          {mode === 'Setups & Administration' && (
            <>
              <Box
                pb={1}
                pt={5}
                className={styles.viewAll}
                onClick={() => colabData.length > 0 && setModalContent({ items: colabData, title: mode })}
              >
                <Typography component="span">View All</Typography>
                <HiArrowRight />
              </Box>
            </>
          )}
          {mode === 'Workspace' && (
            <button className={styles.colabButton} onClick={() => setModalContent({ items: colabData, title: mode })}>
              <Typography component="span">Start Collaborating</Typography>
            </button>
          )}
          {mode === 'User Manual' && (
            <Box pb={1} pt={5}>
              <span title="open equipt documentation" className={styles.viewAll}>
                <Typography component="span">Equipt - User Manual</Typography>
                <FiExternalLink size={20} style={{ marginBottom: 4 }} />
              </span>
            </Box>
          )}
        </div>
      ) : null}
      {mode !== 'User Manual' && (
        <DashboardModal
          style={{ width: 'min(468px, calc(100vw - 64px))' }}
          modalHead={modalContent}
          handleClose={handleClose}
          handleRoutes={handleRoutes}
        >
          <ul className={styles.linkList}>
            {modalContent?.items
              ?.filter((item) => !item?.isHidden)
              .map((item) => (
                <li key={item.name}>
                  <Typography component="span">
                    <Link to={handleRoutes(item)} className={styles.dialogLinks}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 13 13" fill="none">
                        <path
                          d="M6.50049 0H13.0005V6.5H12.188V1.39014L0.59082 12.981L0.0195312 12.4097L11.6104 0.8125H6.50049V0Z"
                          fill="currentcolor"
                          stroke="currentcolor"
                        ></path>
                      </svg>
                      {item.resourceLabel || item.name}
                    </Link>
                  </Typography>
                </li>
              ))}
          </ul>
        </DashboardModal>
      )}
    </>
  );
};

export default DisplaySideCard;
