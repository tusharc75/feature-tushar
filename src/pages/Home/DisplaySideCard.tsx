import { Typography } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import adminSetupImage from 'src/assets/dashboard_images/sidebar/admin-setup.png';
import userManualImage from 'src/assets/dashboard_images/sidebar/user-manual.png';
import workspaceImage from 'src/assets/dashboard_images/sidebar/workspace.png';
import styles from './Dashboard.module.scss';

import DashboardModal from 'src/components/DashboardModal';
import { userManual } from 'src/pages/Home';
import SideCard, { SideCardProps } from 'src/pages/Home/SideCard';

interface sidecardInterface extends React.HTMLAttributes<HTMLDivElement> {
  objBySectionName: any;
  handleRoutes: any;
  mode: 'Workspace' | 'Setup & Administration' | 'User Manual';
}

const getProps = (mode: 'Workspace' | 'Setup & Administration' | 'User Manual', handleClick: () => void): SideCardProps => {
  switch (mode) {
    case 'Workspace': {
      return {
        heading: 'Workspace',
        description: 'By using Equipt Workspace, collaborate with your team members easily',
        icon: (
          <div className="max-w-[60px]">
            <img src={workspaceImage} alt={'Workspace Logo'} className="max-w-full" />
          </div>
        ),
        onClick: handleClick,
        gradientColors: ['#925cb4', '#64b9fc']
      };
    }
    case 'Setup & Administration': {
      return {
        heading: 'Setup & Administration',
        description: 'List of all product and category setups',
        icon: (
          <div className="max-w-[60px]">
            <img src={adminSetupImage} alt={'Setup & Administration Logo'} className="max-w-full" />
          </div>
        ),
        onClick: handleClick,
        gradientColors: ['#a274bf', '#feb237']
      };
    }
    default: {
      const token = localStorage.getItem('token');
      const href = `${userManual.link}`;
      return {
        heading: 'User Manual',
        description: 'View our user manual in just a click.',
        icon: (
          <div className="max-w-[60px]">
            <img src={userManualImage} className="max-w-full" alt={'User Manual Logo'} />
          </div>
        ),
        href,
        external: true,
        gradientColors: ['#ffca6b', '#f6fafd']
      };
    }
  }
};

const DisplaySideCard = ({ objBySectionName, handleRoutes, mode = 'Workspace', ...others }: sidecardInterface) => {
  const [modalContent, setModalContent] = useState(null);
  const [colabData, setColabData] = useState(null);

  useEffect(() => {
    if (objBySectionName) {
      if (mode === 'Workspace')
        setColabData(objBySectionName['Collaboration Tools'] || objBySectionName['Activities'] || objBySectionName['Workspace'] || null);
      else setColabData(objBySectionName['Setup & Administration'] || objBySectionName['Setups'] || objBySectionName['Product Setup'] || null);
    }
  }, [mode, objBySectionName]);

  const handleClick = () => {
    setModalContent({ items: colabData, title: mode, icon: propsForCard.icon });
  };

  const propsForCard = getProps(mode, handleClick);

  const handleClose = () => {
    setModalContent(null);
  };
  return (
    <>
      {colabData ? (
        <>
          <SideCard {...propsForCard} />
        </>
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
