import { Typography } from '@material-ui/core';
import { HiArrowRight } from 'react-icons/hi';
import DashBoardCardShell from 'src/components/DashBoardCardShell';
import styles from './Dashboard.module.scss';
import './style.scss';
import { getColors } from 'src/pages/Home/helpers';
import { Star } from '@material-ui/icons';

const colors = getColors(4);

export const UserFavIcon = () => (
  <div
    className="custom grid place-items-center"
    style={{ width: '50px', height: '50px', background: `linear-gradient(129deg, ${colors.icon[0]}, ${colors.icon[1]})` }}
  >
    <Star className="custom_svg text-white" />
  </div>
);

const UserFavouriteCard = ({ handleOnClick }) => {
  return (
    <DashBoardCardShell
      key={'User Favourites'}
      id={`user-favoutires-card`}
      role="button"
      className={styles.singlecard}
      background={'#fff'}
      gradientColors={colors.gradient}
      aria-label={`open User favourites`}
      onClick={() => handleOnClick()}
    >
      <div className={styles.cardContent}>
        <div className={styles.cardTop}>
          <div className={styles.cardIcon}>
            <UserFavIcon />
          </div>
          <div className={styles.cardArrow}>
            <HiArrowRight />
          </div>
        </div>
        <Typography component="h2" className={styles.cardHeading}>
          Your Favourites
        </Typography>
        <Typography component="p" className={styles.cardDesc}>
          This is a collection of your favorite items, selected by you.
        </Typography>
      </div>
    </DashBoardCardShell>
  );
};

export default UserFavouriteCard;
