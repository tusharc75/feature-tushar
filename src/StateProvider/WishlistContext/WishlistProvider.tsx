import React, { useState, createContext, useEffect, useReducer } from 'react'
import axiosInstance from '../../axios/axiosInstance';
import { eProduct } from '../../constants/helpers';
import { wishlistInitialState, wishlistReducer } from './WishlistReducer';

const WishlistContext = createContext(null);

const WishlistProvider = ({ children }) => {

    const [wishlistState, wishlistDispatch] = useReducer(wishlistReducer, wishlistInitialState);

    return (
        <WishlistContext.Provider value={{
            wishlistState,
            wishlistDispatch
        }}>
            {children}
        </WishlistContext.Provider>
    )
}

export { WishlistContext, WishlistProvider }
