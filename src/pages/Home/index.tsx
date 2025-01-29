import { kebabCase } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { useData } from '../../StateProvider/Provider';
import styles from './Dashboard.module.scss';
import routes from 'src/components/Helpers/Routes';
import { cn } from 'src/constants/helpers';
import DisplayCardGrid from 'src/pages/Home/DisplayCardGrid';
import DisplaySideCard from 'src/pages/Home/DisplaySideCard';
import UserFavouriteCard from 'src/pages/Home/UserFavouriteCard';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import Chart from './Chart';
import { assignIconAndText, getAllData, groupByKey } from './helpers';
import SideCard from 'src/pages/Home/SideCard';
import equiptGenieImage from 'src/assets/dashboard_images/sidebar/genie.svg';
import dynamicFormImage from 'src/assets/dashboard_images/sidebar/dynamic-form.png';
import WorkspaceCard from 'src/pages/Home/WorkspaceCard';
import { VITE_APP_ENV } from 'src/config';
import { SVG } from 'src/assets';

export const userManual = {
  description: 'View our user manual in just a click.',
  link: ['uat', 'local']?.includes(VITE_APP_ENV) ? '/user-manual' : 'https://docs.equip-t.com'
};

function Dashboard() {
  const {
    state: { user, selectedEntity, permissions }
  } = useData();
  const formPermission = permissions?.formBuilder;
  const aiPermission = permissions?.equiptAi;

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
          <div>
            <div className={'grid gap-5 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1'}>
              {aiPermission && (
                <SideCard
                  heading={
                    <div className="flex items-center gap-1">
                      <img src={SVG('LogoNewShort')} alt="E" className="max-h-[18px]" /> Genie
                    </div>
                  }
                  href={routes.equiptAi.path}
                  icon={
                    <div className="max-w-[60px]">
                      <img src={equiptGenieImage} alt={'Equipt AI Logo'} className="h-auto w-full" />
                    </div>
                  }
                  description="Enhances productivity by automating tasks and providing insights through advanced machine learning."
                  gradientColors={['#3e7fff', '#65b9ff']}
                />
              )}
              <UserFavouriteCard />
              <WorkspaceCard objBySectionName={objBySectionName} handleRoutes={handleRoutes} />
              {formPermission && (
                <SideCard
                  heading="Dynamic Forms"
                  href={`${routes.formBuilder.path}`}
                  icon={
                    <div className="max-w-[60px]">
                      <img src={dynamicFormImage} alt={'Setup & Administration Logo'} className="max-w-full" />
                    </div>
                  }
                  description="Design and customize forms effortlessly, capturing data dynamically."
                  gradientColors={['#ffd064', '#f4fbff']}
                />
              )}
              <DisplaySideCard objBySectionName={objBySectionName} handleRoutes={handleRoutes} mode="Setup & Administration" />
              <DisplaySideCard objBySectionName={objBySectionName} handleRoutes={handleRoutes} mode="User Manual" />
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
}

export default Dashboard;
