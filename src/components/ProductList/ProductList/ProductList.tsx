import React from 'react';
import PropTypes from 'prop-types';
import Product from '../ProductCard/ProductCard';
// import { mockData } from '../../assets/mockData';
import styles from './product-list.module.scss'

const ProductList = ({ products }) => {
    return (
        <div className={`${styles.product_list_container}`}>
            {
                products.map((product, index: number) => (
                    <Product key={index} product={product} />
                ))
            }
        </div>
    );
}

ProductList.propTypes = {
    products: PropTypes.array,
}

export default ProductList;