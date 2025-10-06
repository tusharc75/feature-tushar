import { Fragment, useContext, useEffect, useState } from 'react';
import dynamicFormImage from 'src/assets/dashboard_images/sidebar/dynamic-form.png';
import equiptGenieImage from 'src/assets/dashboard_images/sidebar/genie.svg';
import GenieText from 'src/assets/svg/GenieText';
import routes from 'src/components/Helpers/Routes';
import { cn } from 'src/constants/helpers';
import DisplayCardGrid from 'src/pages/Home/DisplayCardGrid';
import DisplaySideCard from 'src/pages/Home/DisplaySideCard';
import SideCard from 'src/pages/Home/SideCard';
import UserFavouriteCard from 'src/pages/Home/UserFavouriteCard';
import WorkspaceCard from 'src/pages/Home/WorkspaceCard';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import { useData } from '../../StateProvider/Provider';
import Chart from './Chart';
import styles from './Dashboard.module.scss';
import { assignIconAndText, getAllData, groupByKey } from './helpers';

export const userManual = {
  description: 'View our user manual in just a click.',
  link: '/user-manual'
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

  return (
    <Fragment>
      <div className={` ${styles.contentWrapper}`}>
        <div className={cn(styles.main, '[--gap:25px]')}>
          <div className={styles.leftContainer}>
            <DisplayCardGrid sections={sections} />
            {!isOffline && <Chart />}
          </div>
          <div>
            <div className={'grid gap-5 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1'}>
              {aiPermission && (
                <SideCard
                  heading={
                    <>
                      <GenieText className="h-[16px]" />
                    </>
                  }
                  href={routes.equiptAi.path}
                  icon={
                    <div className="max-w-[60px]">
                      <img src={equiptGenieImage} alt={'Equipt AI Logo'} className="h-auto w-[60px]" />
                    </div>
                  }
                  description="Enhances productivity by automating tasks and providing insights through advanced machine learning."
                  gradientColors={['#3e7fff', '#65b9ff']}
                />
              )}
              <UserFavouriteCard />
              <WorkspaceCard objBySectionName={objBySectionName} />
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
              <DisplaySideCard objBySectionName={objBySectionName} mode="Setup & Administration" />
              <DisplaySideCard objBySectionName={objBySectionName} mode="User Manual" />
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
}

export default Dashboard;
