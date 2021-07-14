import React from 'react';
import PropTypes from 'prop-types';
import Product from '../ProductCard/ProductCard';
// import { mockData } from '../../assets/mockData';
import styles from './product-list.module.scss'
import { Grid, Box } from "@material-ui/core";
import CategorySidebar from "../CategorySidebar/CategorySidebar"
import CustomBreadCrumbs from '../../CustomBreadCrumbs';
import Layout from '../../Layout';

const ProductList = ({ products }) => {
    return (
        <>
        <div className={styles.wrapper}>
          
            <CategorySidebar />
            
            <Box className="detail-container">
                <div className={`${styles.product_list_container}`}>
                    {
                        products.map((product, index: number) => (
                            <Product key={index} product={product} />
                        ))
                    }
                </div>
            </Box>
            </div>
        </>
    );
}

ProductList.propTypes = {
    products: PropTypes.array,
}

export default ProductList;