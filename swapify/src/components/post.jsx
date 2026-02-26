import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/post.css';

// SVG Icons as components
const HeartIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.27 2 8.5C2 5.41 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.08C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.41 22 8.5C22 12.27 18.6 15.36 13.45 20.03L12 21.35Z" fill="currentColor"/>
    </svg>
);

const PickupIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const BuyIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="9" cy="21" r="1" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="20" cy="21" r="1" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M1 1H5L7.68 14.39C7.77144 14.8504 8.02191 15.264 8.38755 15.5583C8.75318 15.8526 9.2107 16.009 9.68 16H19.4C19.8693 16.009 20.3268 15.8526 20.6925 15.5583C21.0581 15.264 21.3086 14.8504 21.4 14.39L23 6H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const SellIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2V22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const DonationIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.84 4.61C20.3292 4.099 19.7228 3.69364 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69364 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.57831 8.50903 2.99871 7.05 2.99871C5.59096 2.99871 4.19169 3.57831 3.16 4.61C2.1283 5.64169 1.54871 7.04096 1.54871 8.5C1.54871 9.95903 2.1283 11.3583 3.16 12.39L4.22 13.45L12 21.23L19.78 13.45L20.84 12.39C21.351 11.8792 21.7564 11.2728 22.0329 10.6054C22.3095 9.93789 22.4518 9.22248 22.4518 8.5C22.4518 7.77752 22.3095 7.0621 22.0329 6.39464C21.7564 5.72718 21.351 5.12075 20.84 4.61Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const DropOffIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2V12M12 12L15 9M12 12L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M5 12H3C3 14.3869 3.94821 16.6761 5.63604 18.364C7.32387 20.0518 9.61305 21 12 21C14.3869 21 16.6761 20.0518 18.364 18.364C20.0518 16.6761 21 14.3869 21 12H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
);

const TradeIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 10L3 6L7 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M17 14L21 18L17 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3 6H15C16.0609 6 17.0783 6.42143 17.8284 7.17157C18.5786 7.92172 19 8.93913 19 10V18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const LocationIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M12 22C16 18 20 14.4183 20 10C20 5.58172 16.4183 2 12 2C7.58172 2 4 5.58172 4 10C4 14.4183 8 18 12 22Z" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
);

const Post = ({ 
    id, 
    title, 
    description, 
    imageUrl, 
    location, 
    initialLikes = 0, 
    price = 0, 
    transactionType = 'pickup',
    sellerId = '1', // Add sellerId prop
    sellerName = 'Sarah Chen',
    sellerRating = 4.8
}) => {
    const [liked, setLiked] = useState(false);
    const navigate = useNavigate();

    const numericPrice = Number(price);
    const hasPrice = Number.isFinite(numericPrice) && numericPrice > 0;
    const formattedPrice = hasPrice
        ? `$${numericPrice.toLocaleString(undefined, {
            minimumFractionDigits: numericPrice % 1 === 0 ? 0 : 2,
            maximumFractionDigits: 2,
        })}`
        : null;

    const handleLike = (e) => {
        e.stopPropagation(); // Prevent triggering post click
        setLiked(!liked);
    };

    const handleOpenPost = () => {
        if (id) {
            navigate(`/post/${id}`);
        }
    };

    const handleSellerClick = (e) => {
        e.stopPropagation(); // Prevent triggering post click
        if (sellerId) {
            navigate(`/profile/${sellerId}`);
        }
    };

    // Get transaction icon based on type
    const getTransactionIcon = (type) => {
        switch(type.toLowerCase()) {
            case 'pickup':
                return <PickupIcon />;
            case 'buy':
                return <BuyIcon />;
            case 'sell':
                return <SellIcon />;
            case 'donation':
                return <DonationIcon />;
            case 'drop-off':
                return <DropOffIcon />;
            case 'trade':
                return <TradeIcon />;
            default:
                return <PickupIcon />;
        }
    };

    // Get seller initials for avatar
    const getSellerInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    // Don't render if there's no title
    if (!title) {
        return null;
    }

    return (
        <div onClick={handleOpenPost} className="post-container">
            {imageUrl && <img src={imageUrl} alt={title} />}
            <div className="post-title">
                {title}
            </div>
            {hasPrice && <p className="post-price-tag">{formattedPrice}</p>}
            {description && <p className="post-description">{description}</p>}
            {location && (
                <p className="post-location">
                    <LocationIcon />
                    <span>{location}</span>
                </p>
            )}
            
            {/* Like button - just heart icon, no count */}
            <button 
                onClick={handleLike} 
                className={`like-button ${liked ? 'liked' : ''}`}
            >
                <HeartIcon />
            </button>

            {/* Seller Info Section - Clickable to profile */}
            <div className="post-seller" onClick={handleSellerClick}>
                <div className="seller-info">
                    <div className="seller-avatar">
                        {getSellerInitials(sellerName)}
                    </div>
                    <div className="seller-details">
                        <span className="seller-name">{sellerName}</span>
                        <span className="seller-rating">
                            <span className="star-icon">★</span>
                            {sellerRating}
                        </span>
                    </div>
                </div>
                
                {/* Transaction Icon */}
                <div className={`transaction-icon ${transactionType}`}>
                    {getTransactionIcon(transactionType)}
                </div>
            </div>
        </div>
    );
};

export default Post;