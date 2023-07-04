import React from 'react';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import { Carousel } from 'react-responsive-carousel';

import styles from './index.module.scss';
import { BellIcon } from 'src/assets/svg/svgIcons';
import image1 from './Images/authImage1.png';
import image2 from './Images/authImage2.png';
import image3 from './Images/authImage3.png';

const data = [
  {
    image: image1,
    text: 'Sales & Supply Chain Execution',
    subText: 'Remove low-value activities and time wasters',
    textIcon: <BellIcon />
  },
  {
    image: image2,
    text: 'Rental & Asset Operation',
    subText: 'Speed up order intake and manage asset lifecycle',
    textIcon: <BellIcon />
  },
  {
    image: image3,
    text: 'Field Service Execution',
    subText: 'Plan and forecast resource deployment appropriately ',
    textIcon: <BellIcon />
  }
];

interface AuthSliderProps extends React.HTMLAttributes<HTMLDivElement> {
  options?: CarouselProps;
}

const defaultOptions: CarouselProps = {
  autoPlay: true,
  swipeable: true,
  infiniteLoop: true,
  ariaLabel: 'Login Slider',
  dynamicHeight: false,
  interval: 2000,
  transitionTime: 500,
  showThumbs: false,
  showArrows: false,
  useKeyboardArrows: true
};

const AuthSlider: React.FC<AuthSliderProps> = (props) => {
  const { options = defaultOptions, ...others } = props;
  return (
    <div {...others}>
      <Carousel {...options}>
        {data.map((item) => {
          return (
            <div className={styles.singleImageContainer} key={item.text}>
              <img src={item.image} alt="" />
              <div className={styles.textContainer}>
                <div className={styles.textIcon}>{item.textIcon}</div>
                <div className={styles.textContent}>
                  <h6>{item.text}</h6>
                  <p>{item.subText}</p>
                </div>
              </div>
            </div>
          );
        })}
      </Carousel>
    </div>
  );
};

export default AuthSlider;

export interface CarouselProps {
  showArrows?: boolean;
  showStatus?: boolean;
  showIndicators?: boolean;
  infiniteLoop?: boolean;
  showThumbs?: boolean;
  useKeyboardArrows?: boolean;
  autoPlay?: boolean;
  stopOnHover?: boolean;
  swipeable?: boolean;
  dynamicHeight?: boolean;
  emulateTouch?: boolean;
  autoFocus?: boolean;
  thumbWidth?: number;
  selectedItem?: number;
  interval?: number;
  transitionTime?: number;
  swipeScrollTolerance?: number;
  ariaLabel?: string;
}
