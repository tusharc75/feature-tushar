import { useState, useEffect } from 'react';
import { Avatar, Box, CircularProgress, CircularProgressProps, Typography } from '@mui/material';
import { Rating } from '@mui/material';
import styles from './rating-and-review-chart.module.scss';
import StarIcon from '@mui/icons-material/Star';

const green = '#1fb31f';
const yellow = '#1fb31f';
const red = '#1fb31f';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const getDateFormated = (date) => {
  if (date) {
    let current_datetime = new Date(date);
    return current_datetime.getDate() + '  ' + months[current_datetime.getMonth() + 1] + '  ' + current_datetime.getFullYear();
  }
  return '';
};
const getColorOfRating = (value) => {
  const color = value > 40 ? (value > 70 ? green : yellow) : red;
  return color;
};

function CircularProgressWithLabel(props: CircularProgressProps & { value: number; comment: string }) {
  return (
    <>
      <Box display="flex" alignItems="center" flexDirection="column" className={styles.box_size} fontSize={'0.8rem'}>
        <CircularProgress style={{ color: getColorOfRating(props.value), marginBottom: '10px' }} variant="determinate" {...props} />
        {props.comment}({props.value / 20})
      </Box>
    </>
  );
}

function CustomLinearProgressBar(props: { value: number; index: number }) {
  return (
    <div className={styles.custom_linear_progress_bar}>
      <Rating name="size-small" value={props.index} readOnly size="small" className="d-flex align-items-center" />
      <div className={styles.progress}>
        <div className={styles.bar} style={{ width: `${props.value}%`, background: getColorOfRating(props.value) }}></div>
      </div>
      <Typography variant="caption" color="primary" className={styles.reviews}>
        {props.value}
      </Typography>
    </div>
  );
}

function ReviewsComponent({ review }) {
  return (
    <>
      <div className="mb-4">
        <Box className="pr-2">
          <div style={{ display: 'flex' }}>
            <Avatar className="mr-3" style={{ height: 30, width: 30 }}></Avatar>
            <Typography variant="body1">Doe John</Typography>
          </div>

          <div className="d-flex align-items-center">
            <Rating name="size-small" value={review?.rating} readOnly size="small" className="mr-3" />
            {review?.commentTitle}
          </div>
          <div className="d-flex align-items-center">
            <Typography variant="body1" style={{ color: 'darkgray' }}>
              {`Reviewed on ${getDateFormated(review?.date)}`}
            </Typography>
          </div>
        </Box>
        <Typography variant="body1">{review?.commentDescription}</Typography>
      </div>
    </>
  );
}

const RatingAndReviewChart = ({ id, reviews, averageRating }) => {
  const [ratings, setRatings] = useState({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0
  });

  useEffect(() => {
    let tempRating = { ...ratings };
    reviews.forEach((o) => {
      if (o?.rating) {
        tempRating[o?.rating] = tempRating[o?.rating] ? tempRating[o?.rating] + 1 : 1;
      }
    });
    setRatings({ ...tempRating });
  }, [reviews]);

  return (
    <>
      <h2 className="text-align-center">Feedback</h2>
      <div className={styles.rating_and_review_chart_outer}>
        <div className={styles.rating_chart}>
          <div className={styles.total_rating}>
            <Typography variant="h4" color="primary">
              {averageRating}
              <StarIcon fontSize="large" />
            </Typography>
            {/* <Typography variant="body2" color="primary">
              {reviews ? reviews.length : 0} Ratings &amp;
            </Typography> */}
            <Typography variant="body2" color="primary">
              {reviews ? reviews.length : 0} Reviews
            </Typography>
          </div>
          <div className={styles.five_rating}>
            <CustomLinearProgressBar value={ratings[5]} index={5} />
            <CustomLinearProgressBar value={ratings[4]} index={4} />
            <CustomLinearProgressBar value={ratings[3]} index={3} />
            <CustomLinearProgressBar value={ratings[2]} index={2} />
            <CustomLinearProgressBar value={ratings[1]} index={1} />
          </div>
          <div className={styles.rating_category}>
            <CircularProgressWithLabel variant="determinate" size={120} thickness={6} value={50} comment={'Easy to Use'} />
            <CircularProgressWithLabel variant="determinate" size={120} thickness={6} value={75} comment={'Value for Money'} />
          </div>
        </div>
        <div className={styles.reviews}>
          {reviews && reviews.length
            ? reviews.map((currentReview) => {
                return <ReviewsComponent review={currentReview} />;
              })
            : null}
        </div>
      </div>
    </>
  );
};

export default RatingAndReviewChart;
