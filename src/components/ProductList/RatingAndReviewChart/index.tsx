import React from "react";
import PropTypes from "prop-types";
import { Avatar, Box, CardHeader, CircularProgress, CircularProgressProps, IconButton, LinearProgress, makeStyles, Typography } from "@material-ui/core";
import { Rating } from "@material-ui/lab";
import styles from './rating-and-review-chart.module.scss';
import StarIcon from '@material-ui/icons/Star';

const green = "green" 
const yellow = "yellow" 
const red =  "red"

const getColorOfRating =(value) => {
    const color = value > 40 ? value > 70 ? green : yellow : red
    return color
}

function CircularProgressWithLabel(props: CircularProgressProps & { value: number, comment: string }) {


    return (
        <>
            <Box position="relative" display="inline-flex">
                <CircularProgress style={{ color: getColorOfRating(props.value) }} variant="determinate" {...props} />
                <Box
                    top={0}
                    left={0}
                    bottom={0}
                    right={0}
                    position="absolute"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                >
                    <Typography variant="h6" component="div" color="textSecondary">{props.value / 20}</Typography>
                </Box>
            </Box>
            {props.comment}

        </>
    );
}

function CustomLinearProgressBar(props: { value: number, index: number }) {

    return (
        <div className={styles.custom_linear_progress_bar}>
            <Typography variant="body1" color="primary" >
                {props.index}
            </Typography>
            <StarIcon />
            <div className={styles.progress}>
                <div className={styles.bar} style={{ width: `${props.value}%`, background:  getColorOfRating(props.value) }}>
                </div>
            </div>
            <Typography variant="caption" color="primary" >
                {props.value}
            </Typography>
        </div>
    );
}

function ReviewsComponent(props: { rating: number, review: string }) {
    return (
        <>
            <Typography variant="body1"  >
                {props.rating}<StarIcon />
            </Typography>
            <Typography variant="caption"  >
                <li>Frac tree high pressure flow control. Ordered it on first sale.</li>

                <li>1. Reduces fracturing service footprint</li>
                <li>2. Integrated cross for flowback and pumpdown</li>
                <li>3. Reducing number of connections and potential leak paths</li>
                <li>4. Protects wellhead integrity through lower tree profile</li>
            </Typography>
        </>
    );
}

const RatingAndReviewChart = () => {
    return (
        <>
            <div className={styles.rating_and_review_chart_outer}>
                <h1>Ratings &amp; Reviews</h1>
                <div className={styles.rating_chart}>
                    <div className={styles.total_rating}>
                        <Typography variant="h4" color="primary">
                            4.2<StarIcon fontSize="large" />
                        </Typography>

                        <Typography variant="body2" color="primary">
                            469 Ratings &amp;
                        </Typography>
                        <Typography variant="body2" color="primary" >
                            39 Reviews
                        </Typography>

                    </div>
                    <div className={styles.five_rating}>
                        <CustomLinearProgressBar value={100} index={5} />
                        <CustomLinearProgressBar value={70} index={4} />
                        <CustomLinearProgressBar value={80} index={3} />
                        <CustomLinearProgressBar value={30} index={2} />
                        <CustomLinearProgressBar value={10} index={1} />
                    </div>
                    <div className={styles.rating_category}>
                        <CircularProgressWithLabel variant="determinate" size={120} thickness={6} value={50} comment={"Easy to Use"} />
                        <CircularProgressWithLabel variant="determinate" size={120} thickness={6} value={75} comment={"Value for Money"} />

                    </div>
                    <div className={styles.user_reviews}>

                    </div>
                </div>
                <div className={styles.reviews}>
                    <ReviewsComponent rating={3} review={""} />
                </div>
            </div>
        </>
    );
}



export default RatingAndReviewChart;
