import { Typography } from '@material-ui/core';
import { kebabCase } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../../StateProvider/Provider';
import styles from './Dashboard.module.scss';
import './style.scss';

import { HiArrowRight } from 'react-icons/hi';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import { DynamicIcon } from 'src/assets/IconGenerator';
import DashBoardCardShell from 'src/components/DashBoardCardShell';
import DashboardModal from 'src/components/DashboardModal';
import routes from 'src/components/Helpers/Routes';
import { isSectionVisible } from 'src/components/Sidebar/utils';
import Chart from './Chart';
import { assignIconAndText, getAllData, getColors, groupByKey } from './helpers';
import DisplaySideCard from 'src/pages/Home/DisplaySideCard';
import FeatureCard from 'src/pages/Home/FeatureCards';
import DisplayCardGrid from 'src/pages/Home/DisplayCardGrid';
import { ItemData } from 'src/pages/Home/types';
import UserFavouriteCard from 'src/pages/Home/UserFavouriteCard';

export const userManual = {
  description: 'View our user manual in just a click.',
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
    const allData = getAllData(user, selectedEntity);
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
            <FeatureCard />
            <DisplaySideCard objBySectionName={objBySectionName} handleRoutes={handleRoutes} mode="Workspace" />
            <DisplaySideCard objBySectionName={objBySectionName} handleRoutes={handleRoutes} mode="Setups & Administration" />
            <DisplaySideCard objBySectionName={objBySectionName} handleRoutes={handleRoutes} mode="User Manual" />
          </div>
        </div>
      </div>
    </Fragment>
  );
}

export default Dashboard;
