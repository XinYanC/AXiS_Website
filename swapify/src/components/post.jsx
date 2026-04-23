import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { normalizeImageList } from '../utils/images';
import { toggleLike, isListingSaved } from '../utils/likeItems';
import '../styles/post.css';

// SVG Icons as components (exported for use in icon legend/help)
export const HeartIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.27 2 8.5C2 5.41 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.08C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.41 22 8.5C22 12.27 18.6 15.36 13.45 20.03L12 21.35Z" fill="currentColor" />
    </svg>
);

export const SellIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2V22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const DonationIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.84 4.61C20.3292 4.099 19.7228 3.69364 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69364 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.57831 8.50903 2.99871 7.05 2.99871C5.59096 2.99871 4.19169 3.57831 3.16 4.61C2.1283 5.64169 1.54871 7.04096 1.54871 8.5C1.54871 9.95903 2.1283 11.3583 3.16 12.39L4.22 13.45L12 21.23L19.78 13.45L20.84 12.39C21.351 11.8792 21.7564 11.2728 22.0329 10.6054C22.3095 9.93789 22.4518 9.22248 22.4518 8.5C22.4518 7.77752 22.3095 7.0621 22.0329 6.39464C21.7564 5.72718 21.351 5.12075 20.84 4.61Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const LocationIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 22C16 18 20 14.4183 20 10C20 5.58172 16.4183 2 12 2C7.58172 2 4 5.58172 4 10C4 14.4183 8 18 12 22Z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
);

const CameraIcon = () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const Post = ({
    id,
    title,
    imageUrls,
    imageUrl,
    location,
    price = 0,
    transactionType = 'sell'
}) => {
    const [liked, setLiked] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [imageErrors, setImageErrors] = useState({});
    const [isUpdating, setIsUpdating] = useState(false);
    const navigate = useNavigate();

    const resolvedImageUrls = useMemo(() => {
        const normalizedFromImages = normalizeImageList(imageUrls);
        if (normalizedFromImages.length > 0) {
            return normalizedFromImages;
        }
        return normalizeImageList(imageUrl);
    }, [imageUrls, imageUrl]);

    useEffect(() => {
        const updateCurrentImageIndex = () => {
            setCurrentImageIndex(0);
            setImageErrors({});
        }

        updateCurrentImageIndex()

    }, [id, resolvedImageUrls]);

    // Load liked state for logged in user
    useEffect(() => {
        if (!id) {
            setLiked(false);
            return;
        }

        const username = localStorage.getItem('swapify.username');
        const email = localStorage.getItem('swapify.email');
        if (!username && !email) {
            setLiked(false);
            return;
        }

        let isMounted = true;
        const loadLikedState = async () => {
            try {
                const nextLiked = await isListingSaved(id, username || '', email || '');
                if (isMounted) {
                    setLiked(nextLiked); // set liked to true if listing is saved by user, else false
                }
            } catch {
                if (isMounted) {
                    setLiked(false);
                }
            }
        };

        loadLikedState();

        return () => {
            isMounted = false;
        };
    }, [id]);

    const numericPrice = Number(price);
    const hasPrice = Number.isFinite(numericPrice) && numericPrice > 0;
    const formattedPrice = hasPrice
        ? `$${numericPrice.toLocaleString(undefined, {
            minimumFractionDigits: numericPrice % 1 === 0 ? 0 : 2,
            maximumFractionDigits: 2,
        })}`
        : null;

    const formatTransactionType = (type) => {
        const raw = String(type || '')
        const t = raw.toLowerCase()
        if (t === 'free') return 'Free'
        if (!t) return ''
        return raw.charAt(0).toUpperCase() + raw.slice(1).replace('-', ' ')
    }

    const handleLike = async (e) => {
        e.stopPropagation();

        if (!id) {
            return;
        }

        const username = localStorage.getItem('swapify.username');
        const email = localStorage.getItem('swapify.email');

        if (!username && !email) {
            navigate('/login', { state: { fromLike: true } });
            return;
        }

        setIsUpdating(true);

        try {
            const result = await toggleLike(id, username, email);
            setLiked(result.liked);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleOpenPost = () => {
        if (id) {
            navigate(`/post/${id}`);
        }
    };

    const handleImageError = () => {
        setImageErrors((prev) => ({ ...prev, [currentImageIndex]: true }));
    };

    const showPreviousImage = (e) => {
        e.stopPropagation();
        if (resolvedImageUrls.length < 2) {
            return;
        }

        setCurrentImageIndex((prev) => {
            if (prev === 0) {
                return resolvedImageUrls.length - 1;
            }
            return prev - 1;
        });
    };

    const showNextImage = (e) => {
        e.stopPropagation();
        if (resolvedImageUrls.length < 2) {
            return;
        }

        setCurrentImageIndex((prev) => (prev + 1) % resolvedImageUrls.length);
    };

    if (!title) {
        return null;
    }

    const currentImageUrl = resolvedImageUrls[currentImageIndex] || null;
    const isCurrentImageErrored = Boolean(imageErrors[currentImageIndex]);
    const hasMultipleImages = resolvedImageUrls.length > 1;

    return (
        <div onClick={handleOpenPost} className="post-container">
            <div className="post-image-container">
                {currentImageUrl && !isCurrentImageErrored ? (
                    <img
                        src={currentImageUrl}
                        alt={`${title} - image ${currentImageIndex + 1}`}
                        onError={handleImageError}
                        className="post-image"
                    />
                ) : (
                    <div className="image-placeholder">
                        <CameraIcon />
                    </div>
                )}

                {hasMultipleImages && (
                    <>
                        <button
                            type="button"
                            className="post-image-nav post-image-nav-left"
                            onClick={showPreviousImage}
                            aria-label="Previous image"
                        >
                            &lt;
                        </button>
                        <button
                            type="button"
                            className="post-image-nav post-image-nav-right"
                            onClick={showNextImage}
                            aria-label="Next image"
                        >
                            &gt;
                        </button>
                        <div className="post-image-count">
                            {currentImageIndex + 1} / {resolvedImageUrls.length}
                        </div>
                    </>
                )}

                {/* Price/Type overlay on image */}
                <div className="price-overlay">
                    {hasPrice ? formattedPrice : formatTransactionType(transactionType)}
                </div>
            </div>

            <div className="post-title">
                {title}
            </div>

            <div className="post-actions-row">
                {location && (
                    <p className="post-location">
                        <LocationIcon />
                        <span>{location}</span>
                    </p>
                )}
                <button
                    type="button"
                    onClick={handleLike}
                    disabled={isUpdating}
                    className={`like-button ${liked ? 'liked' : ''} ${isUpdating ? 'syncing' : ''}`}
                    aria-label="Like post"
                    aria-busy={isUpdating}
                >
                    <HeartIcon />
                </button>
            </div>
        </div>
    );
};

export default Post;