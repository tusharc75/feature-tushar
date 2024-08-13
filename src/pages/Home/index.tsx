import { Box, Typography } from '@material-ui/core';
import { kebabCase } from 'lodash';
import React, { Fragment, useContext, useEffect, useState } from 'react';
import { FiExternalLink } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useData } from '../../StateProvider/Provider';
import { SVGImages } from '../../assets/dashboard_images';
import styles from './Dashboard.module.scss';
import './style.scss';

import { HiArrowRight } from 'react-icons/hi';
import DashBoardCardShell from 'src/components/DashBoardCardShell';
import DashboardModal from 'src/components/DashboardModal';
import routes from 'src/components/Helpers/Routes';
import { isSectionVisible } from 'src/components/Sidebar/utils';
import Chart from './Chart';
import { assignIconAndText, getColors, groupByKey } from './helpers';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import { DynamicIcon } from 'src/assets/IconGenerator';

export const userManual = {
  description: 'View our user manual in just a click.',
  // link: 'https://docs.equip-t.com/auth/login',
   link: 'https://docs.equip-t.com'
};

function Dashboard() {
  const {
    state: { user, selectedEntity }
  } = useData();
  const [sections, setSections] = useState([]);
  const [objBySectionName, setObjBySectionName] = useState(null);
  const { isOffline } = useContext(CustomOfflineContext);
  useEffect(() => {
    let allData = [];

    let entityData;
    if (user?.entity && user.entity.length) {
      entityData = user.entity.find((curEntity) => curEntity._id === selectedEntity);
    }
    if (entityData?.resource) {
      allData = entityData.resource;
    }

    allData = allData?.filter((e) => isSectionVisible(e));
    allData?.forEach((u) => {
      u['resourceLabel'] = u?.homePageLabel || u?.resourceLabel || u?.name;
      u['sectionNameLowerCase'] = u.sectionName?.toLowerCase();
      u['resourceLabelLowerCase'] = u?.homePageLabel?.toLowerCase() || u?.resourceLabel?.toLowerCase() || u?.name?.toLowerCase();
    });

    const groupedData = groupByKey(allData, (section) => section.sectionName);
    setObjBySectionName(groupedData);
    const data = assignIconAndText(groupedData, user?.role?.brandSectionMaster || []);
    setSections(data);
  }, [user, selectedEntity]);

  const handleRoutes = (item) => {
    switch (item.name) {
      case 'Pos':
        return routes.pos.path;
      default:
        return `/${kebabCase(item.name)}`;
    }
  };
  return (
    <Fragment>
      <div className={` ${styles.contentWrapper}`}>
        <div className={styles.main}>
          <div className={styles.leftContainer}>
            <DisplayCardGrid sections={sections} handleRoutes={handleRoutes} />
            {!isOffline && <Chart />}
          </div>
          <div className={styles.rightContainer}>
            <DisplaySideCard objBySectionName={objBySectionName} handleRoutes={handleRoutes} mode="Collaboration Tools"/>
            <DisplaySideCard objBySectionName={objBySectionName} handleRoutes={handleRoutes} mode="Setups & Administration"/>
            <DisplaySideCard objBySectionName={objBySectionName} handleRoutes={handleRoutes} mode="User Manual"/>
          </div>
        </div>
      </div>
    </Fragment>
  );
}

export default Dashboard;

const DisplayCardGrid = ({ sections, handleRoutes }) => {
  const [modalContent, setModalContent] = useState(null);

  const handleClose = () => {
    setModalContent(null);
  };

  return (
    <div className={styles.cardSection}>
      <div className={styles.cardContainer}>
        {sections.map((section, index) => {
          if (
            section.head === 'Setups' ||
            section.head === 'Setups & Administration' ||
            section.head === 'Collaboration Tools' ||
            section.head === 'Activities'
          ) {
            return <Fragment key={section.head}></Fragment>;
          }
          let icon = section.icon;
          const iconColors = getColors(index).icon;
          if (typeof icon === 'string' && icon) {
            icon = (
              <span
                className=" as custom flex aspect-square h-full items-center justify-center rounded-md text-white"
                style={{
                  background: `linear-gradient(129deg, ${iconColors[0]} 0%, ${iconColors[1]} 100%)`
                }}
              >
                {DynamicIcon(icon, { size: 28 })}
              </span>
            );
          }
          return (
            <DashBoardCardShell
              key={section.head}
              id={`dashboard-card-${section.head.split(' ').join('-')}`}
              role="button"
              className={styles.singlecard}
              background={section.color}
              gradientColors={section.gradient}
              aria-label={`open ${section.head}`}
              onClick={() =>
                section.items.length > 0 &&
                setModalContent({ items: section.items, title: section.head, icon: <span className="[&_.custom_svg]:!size-[15px]">{icon}</span> })
              }
            >
              <div className={styles.cardContent}>
                <div className={styles.cardTop}>
                  <div className={styles.cardIcon}>{icon}</div>
                  <div className={styles.cardArrow}>
                    <HiArrowRight />
                  </div>
                </div>
                <Typography component="h2" className={styles.cardHeading}>
                  {section.head}
                </Typography>
                <Typography component="p" className={styles.cardDesc}>
                  {section.items.length > 0 ? section.text : 'Coming Soon.'}
                </Typography>
              </div>
            </DashBoardCardShell>
          );
        })}
      </div>
      <DashboardModal
        modalHead={modalContent}
        style={{ width: 'min(468px, calc(100vw - 64px))' }}
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
    </div>
  );
};

interface sidecardInterface extends React.HTMLAttributes<HTMLDivElement> {
  objBySectionName: any;
  handleRoutes: any;
  mode: 'Collaboration Tools' | 'Setups & Administration' | 'User Manual';
}

const DisplaySideCard = ({ objBySectionName, handleRoutes, mode = 'Collaboration Tools', ...others }: sidecardInterface) => {
  const [modalContent, setModalContent] = useState(null);
  const [colabData, setColabData] = useState(null);
  const style = { '--sideCardBg': '#FFFFFF' } as React.CSSProperties;
  const description =
    (mode === 'Collaboration Tools' && `By using Collaboration tools, collaborate with or within team members easily`) ||
    (mode === 'Setups & Administration' && `List of all product and category setups`);

  const checkLinkAvailability = ['Product Master', 'Pricing Setup', 'Product Categories'];

  useEffect(() => {
    if (objBySectionName) {
      if (mode === 'Collaboration Tools') setColabData(objBySectionName['Collaboration Tools'] || objBySectionName['Activities'] || null);
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
          {mode === 'Collaboration Tools' && (
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
