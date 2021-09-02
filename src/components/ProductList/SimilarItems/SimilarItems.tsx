import React from 'react';
import { Rating } from '@material-ui/lab';
import styles from './similar-items.module.scss';
import { BsImage } from 'react-icons/bs';

export default function SimilarItems({ similarItems }) {
  return (
    <>
      <div className={styles.similar_items_outer}>
        <div className={styles.similar_items_middle}>
          <h2 className="text-align-center" color="textSecondary">
            Compare with similar items
          </h2>
          <div className={styles.similar_items_inner}>
            {/* <div className={styles.similar_items_child}>
                        <div></div>
                        <div className={styles.item_details}>
                            <h3></h3>
                            <h3 className={`${styles.item_alt} pl-2 d-flex align-items-center justify-content-start border border-bottom-0`}>
                                Ratings
                            </h3>
                            <h3 className="d-flex pl-2 align-items-center justify-content-start border">
                                Price
                            </h3>
                            <h3 className={`${styles.item_alt} pl-2 d-flex align-items-center justify-content-start border`}>
                                Vendor
                            </h3>
                        </div>
                    </div> */}
            {similarItems.slice(0, similarItems.length).map((product, index: number) => (
              <div key={index} className={styles.similar_items_child}>
                <div className={"text-center d-flex justify-content-center " && styles.set_img_size}>
                  {product.productImage ? (
                    <img src={product.productImage} alt={product.productName} width="90%" />
                  ) : (
                    <BsImage className={styles.no_image} />
                  )}
                </div>
                <div className={styles.item_details}>
                  <div className="product_name_link p-2">
                    <strong>{product.productName}, </strong>
                    <span>{product?.productCategory?.optionLabel}, </span>
                    <span>{product.description}</span>
                  </div>
                  <span className="d-flex pl-2 align-items-center">
                    <span className={styles.price}>
                    {product.currency} {product.mrp} 
                    </span>
                  </span>
                  <span className={`${styles.item_alt} pl-2 d-flex justify-content-center flex-column `}>
                    <div className="d-flex align-items-center">
                      <Rating name="size-small" value={product.rating || 5} readOnly size="small" /> <span className="ml-2 mt-1">({product.reviews || 134})</span>
                    </div>
                  </span>
                  
                  <span className={`${styles.item_alt} pl-2 d-flex align-items-center `}>
                    <strong className="pt-1 font-size-3">{product.vendor} <h3>Sold by:</h3><p>Cactus Wellhead</p></strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
