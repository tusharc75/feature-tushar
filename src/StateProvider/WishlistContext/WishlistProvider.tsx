import { createContext, useReducer } from 'react'
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
