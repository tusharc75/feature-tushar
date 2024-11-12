import { Typography } from '@material-ui/core';
import { Fragment, useState } from 'react';
import { HiArrowRight } from 'react-icons/hi';
import { Link } from 'react-router-dom';
import { DynamicIcon } from 'src/assets/IconGenerator';
import DashBoardCardShell from 'src/components/DashBoardCardShell';
import DashboardModal from 'src/components/DashboardModal';
import UserFavoriteIcon from 'src/components/UserFavouriteIcon';
import { Item, Section } from 'src/pages/Home/types';
import styles from './Dashboard.module.scss';
import { getColors } from './helpers';

type DisplayCardGridProps = {
  sections: Section[];
  handleRoutes: (item: Item) => string;
};

const DisplayCardGrid = ({ sections, handleRoutes }: DisplayCardGridProps) => {
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
            section.head === 'Workspace' ||
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
                setModalContent({
                  items: section.items,
                  title: section.head,
                  icon: (
                    <span className="[&>div]:!h-[32px] [&>div]:!w-[32px] [&>div]:rounded [&_.custom_svg]:!h-[18px] [&_.custom_svg]:!w-[18px]">
                      {icon}
                    </span>
                  )
                })
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
                  <div className="flex justify-between gap-2">
                    <Link to={handleRoutes(item)} className={styles.dialogLinks}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 13 13" fill="none">
                        <path
                          d="M6.50049 0H13.0005V6.5H12.188V1.39014L0.59082 12.981L0.0195312 12.4097L11.6104 0.8125H6.50049V0Z"
                          fill="currentcolor"
                          stroke="currentcolor"
                        ></path>
                      </svg>
                      <span className="line-clamp-1" title={item.resourceLabel || item.name}>
                        {item.resourceLabel || item.name}
                      </span>
                    </Link>
                    <UserFavoriteIcon item={item} />
                  </div>
                </Typography>
              </li>
            ))}
        </ul>
      </DashboardModal>
    </div>
  );
};

export default DisplayCardGrid;
