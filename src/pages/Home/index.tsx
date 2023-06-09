import React, { useEffect, useState, useContext, Fragment } from 'react';
import { Typography, List, ListItem, ListItemText, Box } from '@material-ui/core';
import { Link, useHistory } from 'react-router-dom';
import { useData } from '../../StateProvider/Provider';
import { kebabCase } from 'lodash';
import styles from './Dashboard.module.scss';
import './style.scss';
import { SVGImages, IconConst } from '../../assets/dashboard_images';
import { FiExternalLink } from 'react-icons/fi';

import routes from 'src/components/Helpers/Routes';
import { withStyles } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import MuiDialogContent from '@material-ui/core/DialogContent';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import { HiArrowRight } from 'react-icons/hi';
import { groupByKey, assignIconAndText } from './helpers';
import Chart from './Chart';
import { useAppTheme } from 'src/constants/AppConfig';
import DashBoardCardShell from 'src/components/DashBoardCardShell';
import DashboardModal from 'src/components/DashboardModal';

export const userManual = {
  description: 'View our user manual in just a click.',
  link: 'https://docs.equip-t.com/'
};

function Dashboard() {
  const history = useHistory();
  const { dispatch }: any = useData();
  const {
    state: { user, selectedEntity }
  } = useData();
  const [sections, setSections] = useState([]);
  const [search, setSearch] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [objBySectionName, setObjBySectionName] = useState(null);

  useEffect(() => {
    let arr = [];
    let allData = [];
    // let allData = user && [...user?.role.sideBar];
    let entityData;
    if (user?.entity && user.entity.length) {
      entityData = user.entity.find((curEntity) => curEntity._id === selectedEntity);
    }
    if (entityData?.resource) {
      allData = entityData.resource;
    }
    allData?.forEach((u) => {
      u['resourceLabel'] = u?.homePageLabel || u?.resourceLabel || u?.name;
      u['sectionNameLowerCase'] = u.sectionName?.toLowerCase();
      u['resourceLabelLowerCase'] = u?.homePageLabel?.toLowerCase() || u?.resourceLabel?.toLowerCase() || u?.name?.toLowerCase();
      !arr.includes(u.sectionName) && arr.push(u.sectionName);
    });

    const groupedData = groupByKey(allData, (section) => section.sectionName);
    setObjBySectionName(groupedData);
    const data = assignIconAndText(groupedData);
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
            <Chart />
          </div>
          <div className={styles.rightContainer}>
            <DisplaySideCard objBySectionName={objBySectionName} handleRoutes={handleRoutes} mode="Collaboration Tools" />
            <DisplaySideCard objBySectionName={objBySectionName} handleRoutes={handleRoutes} mode="Setups & Administration" />
            <a title="open equipt documentation" href={userManual.link} target="_blank">
              <DisplaySideCard objBySectionName={objBySectionName} handleRoutes={handleRoutes} mode="User Manual" />
            </a>
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
        {sections.map((section) => {
          if (
            section.head === 'Setups' ||
            section.head === 'Setups & Administration' ||
            section.head === 'Collaboration Tools' ||
            section.head === 'Activities'
          ) {
            return <></>;
          }
          return (
            <DashBoardCardShell
              key={section.head}
              role="button"
              className={styles.singlecard}
              background={section.color}
              gradientColors={section.gradient}
              aria-label={`open ${section.head}`}
              onClick={() => section.items.length > 0 && setModalContent({ items: section.items, title: section.head, icon: section.icon })}
            >
              <div className={styles.cardContent}>
                <div className={styles.cardTop}>
                  <div className={styles.cardIcon}>{section.icon}</div>
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
        modalContent={modalContent}
        style={{ width: 'min(468px, calc(100vw - 64px))' }}
        handleClose={handleClose}
        handleRoutes={handleRoutes}
      />
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
          onClick={() => setModalContent({ items: colabData, title: mode, icon: <img src={SVGImages(mode)} alt={`${mode} Logo`} /> })}
          {...others}
        >
          <img src={SVGImages(mode)} alt={`${mode} Logo`} className={styles.colabLogo} />
          <Typography component={'h2'}>{mode}</Typography>
          <Typography component={'p'}>{mode !== 'User Manual' ? description : userManual.description}</Typography>
          {mode === 'Setups & Administration' && (
            <>
              {/* <ul className={styles.linkList}>
                {colabData
                  ?.filter((item) => !item?.isHidden && checkLinkAvailability.includes(item.resourceLabel || item.name))
                  .map((item) => (
                    <li key={item.name}>
                      <Link to={handleRoutes(item)} className={styles.dialogLinks}>
                        <Typography component="span">{item.resourceLabel || item.name}</Typography>
                      </Link>
                    </li>
                  ))}
              </ul> */}
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
              <a title="open equipt documentation" href={userManual.link} target="_blank" className={styles.viewAll}>
                <Typography component="span">Equipt - User Manual</Typography>
                <FiExternalLink size={20} style={{ marginBottom: 4 }} />
              </a>
            </Box>
          )}
        </div>
      ) : null}
      {mode !== 'User Manual' && (
        <DashboardModal
          style={{ width: 'min(468px, calc(100vw - 64px))' }}
          modalContent={modalContent}
          handleClose={handleClose}
          handleRoutes={handleRoutes}
        />
      )}
    </>
  );
};
