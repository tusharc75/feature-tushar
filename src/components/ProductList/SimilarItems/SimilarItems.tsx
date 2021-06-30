import React from 'react'
import { Rating } from '@material-ui/lab';
import styles from './similar-items.module.scss';

export default function SimilarItems({ similarItems }) {

    return (
        <>
            <div className={styles.similar_items_outer}>
                <div className="section_title">Compare with similar items</div>

                <div className={styles.similar_items_inner}>
                    <div className={styles.similar_items_child}>
                        <div></div>
                        <div className={styles.item_details}>
                            <h3></h3>
                            <h3 className="item_alt p-1 d-flex align-items-center justify-content-start border border-bottom-0">
                                Ratings
                            </h3>
                            <h3 className="d-flex p-1 align-items-center justify-content-start border">
                                Price
                            </h3>
                            <h3 className="item_alt p-1 d-flex align-items-center justify-content-start border border-bottom-0">
                                Sold By
                            </h3>
                        </div>
                    </div>

                    {
                        similarItems.slice(0, similarItems.length).map((product, index: number) => (
                            <div key={index} className={styles.similar_items_child}>
                                <div className="text-center d-flex align-items-center justify-content-center">
                                    <img src={product.productImage} alt={product.productName} width="50%" />
                                </div>
                                <div className={styles.item_details}>
                                    <div className="mb-3 product_name_link pr-2">
                                        <strong>{product.productName}, </strong>
                                        <span>{product.productCategory.optionLabel}, </span>
                                        <span>{product.description}</span>
                                    </div>
                                    <span className="item_alt p-1 d-flex justify-content-center flex-column border border-bottom-0 p-2">
                                        <div className="d-flex align-items-center"><Rating name="size-small" value={product.rating} readOnly size="small" /> <span className="ml-2 mt-1">({product.reviews})</span></div>
                                    </span>
                                    <span className="d-flex p-1 align-items-center justify-content-start border">
                                        <span className={styles.price}>{product.mrp} {product.currency}</span>
                                    </span>
                                    <span className="item_alt p-1 d-flex align-items-center justify-content-start border border-bottom-0">
                                        <strong className="pt-1 font-size-3">{product.vendor}</strong>
                                    </span>
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>
        </>
    )
}
