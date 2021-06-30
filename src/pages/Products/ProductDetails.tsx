import React, { useState, useEffect, useContext } from 'react'
import { useParams } from "react-router-dom";
import axiosInstance from '../../axios/axiosInstance';
import Layout from '../../components/Layout';
import { product } from '../../constants/helpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { Rating } from '@material-ui/lab';
import styles from './product-detail-page.module.scss'
import { Button } from '@material-ui/core';
import FrequentlyBought from '../../components/ProductList/FrequentlyBought/FrequentlyBought';
import SimilarItems from '../../components/ProductList/SimilarItems/SimilarItems';

export default function ProductDetails() {

    const [productDetails, setProductDetails] = useState(null);
    const [similarItems, setSimilarItems] = useState([]);
    const toastConfig = useContext(CustomToastContext);
    let { id } = useParams();

    useEffect(() => {
        axiosInstance().get(`/product/` + id).then(({ data: { data } }) => {
            setProductDetails(data.productData);


        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    }, []);

    useEffect(() => {
        if (productDetails) {
            axiosInstance()
                .get(`${product.api}?filterById=[{"field":"productCategory", "term": "${productDetails.productCategory}"}]&limit=3`)
                .then(({ data: { data } }) => {
                    setSimilarItems(data);
                }).catch((error) => {
                    toastConfig.setToastConfig(error);
                });
        }
    }, [productDetails])

    const calculateNetPrice = (price: number, discount: any) => {
        let netPrice = price;
        netPrice = (price * discount) / 100;
        return netPrice + " " + productDetails.currency;

    }

    const amountOfDiscount = (price: number, discount: any) => {
        return (price * discount / discount) + " " + productDetails.currency;
    }

    return (
        <Layout>
            <>
                {
                    productDetails ? <div>
                        <div>
                            <h2>Home {`>`} Product {`>`} Item </h2>
                            <div className={styles.grid_container}>
                                <div className={styles.left_side}>
                                    <div className="productImage">
                                        <img src={productDetails.productImage} alt={productDetails.productName} />
                                    </div>
                                </div>
                                <div className={styles.right_side}>
                                    <div className={styles.name}>{productDetails.productName}</div>
                                    <div className={styles.availability}>Availability: <span>{productDetails.availability ? "In Stock" : "Out of Stock"}</span></div>
                                    <div className={styles.seller}>Sold By: {productDetails.sellerName}</div>
                                    <hr />
                                    <div className={styles.description}>
                                        <div className={styles.listItem}>
                                            <ul>
                                                <li>Material class DD</li>
                                                <li>7 1/6 run</li>
                                                <li>10,000 rpm</li>
                                                <li>Temperature proof</li>
                                            </ul>
                                        </div>
                                        <div className={styles.price}>{calculateNetPrice(parseInt(productDetails.mrp), productDetails.discount)}<span className={styles.originalPrice}>{productDetails.mrp}</span></div>
                                        <h4>You Save: <span>{amountOfDiscount(parseInt(productDetails.mrp), productDetails.discount)}</span> </h4>
                                        <div className={styles.rating}>
                                            <Rating name="half-rating-read" defaultValue={2.5} precision={0.5} value={productDetails.rating} readOnly size="small" />
                                            <span className={styles.ml_2}>{productDetails.rating}</span>
                                        </div>
                                        <div className={styles.buttons}>
                                            <div>
                                                <Button
                                                    variant="outlined"
                                                    color="primary"
                                                    size="small"
                                                    className="mr-2"
                                                >
                                                    Add to Cart
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    color="primary"
                                                    size="small"
                                                >
                                                    Check Out
                                                </Button>
                                            </div>
                                            <div>
                                                <Button
                                                    variant="outlined"
                                                    color="primary"
                                                    size="small"
                                                    className="mr-2"
                                                >
                                                    Add to Configure
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    color="primary"
                                                    size="small"
                                                    className="mr-2"
                                                >
                                                    Add to Planner
                                                </Button>
                                            </div>

                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                        <div className="a-divider a-divider-section"><div className={styles.a_divider_inner}></div></div>
                        <FrequentlyBought />
                        <div className="a-divider a-divider-section"><div className={styles.a_divider_inner}></div></div>
                        <SimilarItems similarItems={similarItems} />
                    </div> : <span>Loading...</span>
                }
            </>

        </Layout>
    )
}
