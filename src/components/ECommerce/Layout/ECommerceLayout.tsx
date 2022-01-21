import React, { useRef, useEffect } from 'react'
import ECommerceHeader from '../Header/ECommerceHeader'
import ECommerceFooter from '../Footer/ECommerceFooter'
import "./ECommerce.scss"
import { useLocation, useHistory } from "react-router-dom";
import { ECommerceProvider } from './ECommerceContext/ECommerceContext';

export default function ECommerceLayout({ children }) {

    const contentRef = useRef(null);
    const { pathname } = useLocation();

    useEffect(() => {
        contentRef.current.scrollIntoView({
            behaviour: "smooth",
            block: "start",
        });
    }, [pathname]);

    return (
        <div className="ecommerce" ref={contentRef}>
            <ECommerceProvider>
                <ECommerceHeader />

                <div className='mb-3' style={{ paddingTop: "3.5rem" }}>
                    {children}
                </div>

                <ECommerceFooter />
            </ECommerceProvider>
        </div>
    )
}
