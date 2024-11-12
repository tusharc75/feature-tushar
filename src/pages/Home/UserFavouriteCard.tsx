import { Typography } from '@material-ui/core';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardModal from 'src/components/DashboardModal';
import UserFavoriteIcon from 'src/components/UserFavouriteIcon';
import { useFavorites } from 'src/hooks';
import { getAllData, handleRoutes } from 'src/pages/Home/helpers';
import { ItemData } from 'src/pages/Home/types';

import userFavoriteImage from 'src/assets/dashboard_images/sidebar/user-favorite.png';

import SideCard from 'src/pages/Home/SideCard';
import { useData } from 'src/StateProvider/Provider';
import styles from './Dashboard.module.scss';

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
      icon: <img src={userFavoriteImage} alt={'User Favourite Logo'} className="max-w-full" />
    });
  };

  const handleClose = () => {
    setModalContent(null);
  };

  return (
    <>
      {stateFavourites.length === 0 ? null : (
        <SideCard
          id={`user-favorite-card`}
          heading="Your Favorites"
          description="This is a collection of your favorite items, selected by you."
          icon={
            <div className="max-w-[60px]">
              <img src={userFavoriteImage} alt={'User Favourite Logo'} className="max-w-full" />
            </div>
          }
          className={'group mb-4'}
          gradientColors={['#6621ba', '#f98a17']}
          style={{ background: 'linear-gradient(var(--bg-gradient-colors, to bottom, #ffa800, #e35200))' }}
          aria-label={`open User Favorite`}
          onClick={() => handleFavouriteModal()}
        />
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
