const wishlistInitialState = {
    wishlist: []
}

const wishlistReducer = (state = wishlistInitialState, action) => {

    switch (action.type) {

        case "INITIALIZE":
            return { wishlist: [...action.payload] }

        case "ADD":
            return { wishlist: [...state.wishlist, { ...action.payload }] }

        case "REMOVE":
            return { wishlist: [...state.wishlist.filter(d => d._id !== action.payload)] }

        default:
            return state;

    }

}

export { wishlistInitialState, wishlistReducer };