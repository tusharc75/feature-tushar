import React from "react";
import PropTypes from "prop-types";
import { Avatar, Box, CardHeader, CircularProgress, CircularProgressProps, IconButton, LinearProgress, makeStyles, Typography } from "@material-ui/core";
import { Rating } from "@material-ui/lab";
import styles from './rating-and-review-chart.module.scss';
import StarIcon from '@material-ui/icons/Star';

const green = "#1fb31f"
const yellow = "#1fb31f"
const red = "#1fb31f"

const getColorOfRating = (value) => {
    const color = value > 40 ? value > 70 ? green : yellow : red
    return color
}

function CircularProgressWithLabel(props: CircularProgressProps & { value: number, comment: string }) {
    return (
        <>
            <Box display="flex"
                alignItems="center"
                justifyContent="center"
                flexDirection="column"
                className="gap-2">
                <CircularProgress style={{ color: getColorOfRating(props.value) }} variant="determinate" {...props} />
                {props.comment}({props.value / 20})
            </Box>

        </>
    );
}

function CustomLinearProgressBar(props: { value: number, index: number }) {

    return (
        <div className={styles.custom_linear_progress_bar}>
            <Rating name="size-small" value={props.index} readOnly size="small" className="d-flex align-items-center" />
            <div className={styles.progress}>
                <div className={styles.bar} style={{ width: `${props.value}%`, background: getColorOfRating(props.value) }}>
                </div>
            </div>
            <Typography variant="caption" color="primary" className={styles.reviews}>
                {props.value}
            </Typography>
        </div>
    );
}

function ReviewsComponent(props: { rating: number, review: string }) {
    return (
        <>
            <div className="mb-4">
                <Box className="pr-2">
                    <Avatar
                        style={{ height: 30, width: 30 }}
                    ></Avatar>
                    <div className="d-flex align-items-center"><Rating name="size-small" value={props.rating} readOnly size="small" /></div>
                </Box>
                <Typography variant="caption">
                    Frac tree high pressure flow control. Ordered it on first sale.
                    Reduces fracturing service footprint
                    Integrated cross for flowback and pumpdown
                    Reducing number of connections and potential leak paths
                    Protects wellhead integrity through lower tree profile
                </Typography>
            </div>
        </>
    );
}

const RatingAndReviewChart = () => {
    return (
        <>
            <h2 className="text-align-center" >Feedback</h2>
            <div className={styles.rating_and_review_chart_outer}>
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
                    <div className={styles.rating_category} >
                        <CircularProgressWithLabel variant="determinate" size={120} thickness={6} value={50} comment={"Easy to Use"} />
                        <CircularProgressWithLabel variant="determinate" size={120} thickness={6} value={75} comment={"Value for Money"} />
                    </div>
                    <div className={styles.user_reviews}>

                    </div>
                </div>
                <div className={styles.reviews}>
                    <ReviewsComponent rating={3} review={""} />
                    <ReviewsComponent rating={2} review={""} />
                    <ReviewsComponent rating={1} review={""} />
                    <ReviewsComponent rating={4} review={""} />
                    <ReviewsComponent rating={5} review={""} />
                    <ReviewsComponent rating={3} review={""} />
                </div>
            </div>
        </>
    );
}



export default RatingAndReviewChart;
