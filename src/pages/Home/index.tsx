import { kebabCase } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { useData } from '../../StateProvider/Provider';
import styles from './Dashboard.module.scss';
import './style.scss';

import routes from 'src/components/Helpers/Routes';
import { cn } from 'src/constants/helpers';
import DisplayCardGrid from 'src/pages/Home/DisplayCardGrid';
import DisplaySideCard from 'src/pages/Home/DisplaySideCard';
import FeatureCard from 'src/pages/Home/FeatureCards';
import UserFavouriteCard from 'src/pages/Home/UserFavouriteCard';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import Chart from './Chart';
import { assignIconAndText, getAllData, groupByKey } from './helpers';

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
        <div className={cn(styles.main, '[--gap:25px]')}>
          <div className={styles.leftContainer}>
            <DisplayCardGrid sections={sections} handleRoutes={handleRoutes} />
            {!isOffline && <Chart />}
          </div>
          <div className={styles.rightContainer}>
            <FeatureCard />
            <UserFavouriteCard />
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
