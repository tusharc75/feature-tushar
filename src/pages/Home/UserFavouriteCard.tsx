import { Typography } from '@material-ui/core';
import { Star } from '@material-ui/icons';
import { useEffect, useMemo, useState } from 'react';
import { HiArrowRight } from 'react-icons/hi';
import { Link } from 'react-router-dom';
import DashBoardCardShell from 'src/components/DashBoardCardShell';
import DashboardModal from 'src/components/DashboardModal';
import UserFavoriteIcon from 'src/components/UserFavouriteIcon';
import { useFavorites } from 'src/hooks';
import { getAllData, getColors, handleRoutes } from 'src/pages/Home/helpers';
import { ItemData } from 'src/pages/Home/types';

import { useData } from 'src/StateProvider/Provider';
import styles from './Dashboard.module.scss';
import './style.scss';

const colors = getColors(2);

export const UserFavIcon = () => (
  <div
    className="custom grid place-items-center"
    style={{ width: '50px', height: '50px', background: `linear-gradient(129deg, ${colors.icon[0]}, ${colors.icon[1]})` }}
  >
    <Star className="custom_svg text-white" />
  </div>
);

const UserFavouriteCard = () => {
  const {
    state: { user, selectedEntity }
  } = useData();

  const [modalContent, setModalContent] = useState(null);
  const { favorites } = useFavorites();
  const [stateFavourites, setStateFavourites] = useState<ItemData[]>([]);
  const allData = useMemo(() => getAllData(user, selectedEntity), [user, selectedEntity]);

  useEffect(() => {
    const newFavourites = [];
    allData.forEach((item) => {
      if (favorites?.[item.name]) {
        newFavourites.push(item);
      }
    });
    setStateFavourites(newFavourites);
    // setStateFavourites
  }, [favorites, allData]);

  const handleFavouriteModal = () => {
    setModalContent({
      items: stateFavourites,
      title: 'Your Favorites',
      icon: (
        <span className="[&>div]:!h-[32px] [&>div]:!w-[32px] [&>div]:rounded [&_.custom_svg]:!h-[18px] [&_.custom_svg]:!w-[18px]">
          <UserFavIcon />
        </span>
      )
    });
  };

  const handleClose = () => {
    setModalContent(null);
  };

  return (
    <>
      {stateFavourites.length === 0 ? null : (
        <DashBoardCardShell
          key={'User Favorites'}
          id={`user-favorite-card`}
          role="button"
          className={'group mb-4'}
          // background={'#fff'}
          gradientColors={colors.gradient}
          style={{ background: 'linear-gradient(var(--bg-gradient-colors, to bottom, #ffa800, #e35200))' }}
          aria-label={`open User Favorite`}
          onClick={() => handleFavouriteModal()}
        >
          <div className={'rounded-xl bg-[var(--dark-primary,white)] p-[23px_18px_18px]'}>
            <div className={'mb-[20px] flex justify-between'}>
              <div className={'overflow-hidden rounded-full'}>
                <UserFavIcon />
              </div>
              <div className={'transition-all duration-300 group-hover:[transform:translateX(-10px)]'}>
                <HiArrowRight />
              </div>
            </div>
            <h2 className={'mb-[10px] text-[16px] font-bold leading-[22px]'}>Your Favorites</h2>
            <p className={' text-[14px] font-normal leading-[22px] text-[#737373] dark:text-[#bebebe]'}>
              This is a collection of your favorite items, selected by you.
            </p>
          </div>
        </DashBoardCardShell>
      )}

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
    </>
  );
};

export default UserFavouriteCard;
