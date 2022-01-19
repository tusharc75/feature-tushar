import React from 'react'
import ECommerceHeader from '../Header/ECommerceHeader'
import ECommerceFooter from '../Footer/ECommerceFooter'
import "./ECommerce.scss"

export default function ECommerceLayout({ children }) {
    return (
        <div className="ecommerce">
            <ECommerceHeader />

            <div className='mb-3'>
                {children}
            </div>
            
            <ECommerceFooter />
        </div>
    )
}
