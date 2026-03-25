import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileAvatar from './ProfileAvatar';
import { normalizeImageList } from '../utils/images';
import { readUsers, updateListing, updateUser } from '../api';
import '../styles/post.css';

// Global queue to serialize like/unlike operations and prevent race conditions
let likeQueue = Promise.resolve();

const queueLikeOperation = async (operation) => {
    likeQueue = likeQueue.then(() => operation());
    return likeQueue;
};

// SVG Icons as components (exported for use in icon legend/help)
export const HeartIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.27 2 8.5C2 5.41 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.08C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.41 22 8.5C22 12.27 18.6 15.36 13.45 20.03L12 21.35Z" fill="currentColor" />
    </svg>
);

export const PickupIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const BuyIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="9" cy="21" r="1" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="20" cy="21" r="1" stroke="currentColor" strokeWidth="1.5" />
        <path d="M1 1H5L7.68 14.39C7.77144 14.8504 8.02191 15.264 8.38755 15.5583C8.75318 15.8526 9.2107 16.009 9.68 16H19.4C19.8693 16.009 20.3268 15.8526 20.6925 15.5583C21.0581 15.264 21.3086 14.8504 21.4 14.39L23 6H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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

export const DropOffIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2V12M12 12L15 9M12 12L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 12H3C3 14.3869 3.94821 16.6761 5.63604 18.364C7.32387 20.0518 9.61305 21 12 21C14.3869 21 16.6761 20.0518 18.364 18.364C20.0518 16.6761 21 14.3869 21 12H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);

export const TradeIcon = () => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M3 7H17M17 7L13 3M17 7L13 11"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M21 17H7M7 17L11 21M7 17L11 13"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
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

const normalizeIdentifier = (value) => String(value || '').trim().toLowerCase();

const toUsersArray = (usersResponse) => {
    const bucket = usersResponse?.User;
    if (bucket) {
        return Object.values(bucket);
    }
    return [];
};

const resolveSavedPostIds = (user) => {
    if (!user) {
        return [];
    }
    const savedField = user?.saved_listings;
    if (!Array.isArray(savedField)) {
        return [];
    }
    return savedField.map((item) => String(item || '').trim()).filter(Boolean);
};

const getViewerIdentity = () => {
    const username = String(localStorage.getItem('swapify.username') || '').trim();
    const email = String(localStorage.getItem('swapify.email') || '').trim();

    return {
        username,
        email,
        normalizedUsername: normalizeIdentifier(username),
        normalizedEmail: normalizeIdentifier(email),
    };
};

const syncLikeAndSaveToBackend = async ({ listingId, nextLiked }) => {
    const normalizedListingId = String(listingId || '').trim();
    if (!normalizedListingId) {
        return;
    }

    const viewer = getViewerIdentity();
    const viewerKey = viewer.normalizedUsername || viewer.normalizedEmail;
    if (!viewerKey) {
        return;
    }

    try {
        const usersResponse = await readUsers();
        const users = toUsersArray(usersResponse);

        const matchedUser = users.find((candidate) => {
            const candidateUsername = normalizeIdentifier(candidate?.username);
            const candidateEmail = normalizeIdentifier(candidate?.email);

            return (
                (viewer.normalizedUsername && candidateUsername === viewer.normalizedUsername) ||
                (viewer.normalizedEmail && candidateEmail === viewer.normalizedEmail)
            );
        });

        if (!matchedUser) {
            return;
        }

        const currentSaved = resolveSavedPostIds(matchedUser);
        const nextSaved = nextLiked
            ? Array.from(new Set([...currentSaved, normalizedListingId]))
            : currentSaved.filter((savedId) => savedId !== normalizedListingId);

        console.log(`syncLikeAndSaveToBackend: User ${viewerKey}, nextLiked=$
                {nextLiked}, currentSaved=[${currentSaved.join(', ')}], nextSaved=[${nextSaved.join(', ')}]`);
        const userIdentifierForUpdate = matchedUser?.username;

        if (userIdentifierForUpdate) {
            // Update user's saved_listings
            console.log(`Sending to backend: user=${userIdentifierForUpdate}, saved_listings=[${nextSaved.join(', ')}]`);
            await updateUser(userIdentifierForUpdate, {
                saved_listings: nextSaved,
            });
        }

        // Calculate new like count from current users data (before the update for accuracy)
        const numLikes = users.reduce((count, candidate) => {
            const candidateSaved = resolveSavedPostIds(candidate);
            const candidateUsername = normalizeIdentifier(candidate?.username);
            const candidateEmail = normalizeIdentifier(candidate?.email);
            const matchedUsername = normalizeIdentifier(matchedUser?.username);
            const matchedEmail = normalizeIdentifier(matchedUser?.email);

            const isMatchedUser =
                (matchedUsername && candidateUsername === matchedUsername) ||
                (matchedEmail && candidateEmail === matchedEmail);

            const effectiveSaved = isMatchedUser ? nextSaved : candidateSaved;

            return effectiveSaved.includes(normalizedListingId) ? count + 1 : count;
        }, 0);

        // Update listing's num_likes
        await updateListing(normalizedListingId, {
            num_likes: numLikes,
        });
    } catch (err) {
        console.error('Error syncing like to backend:', err);
        throw err;
    }
};



const Post = ({
    id,
    title,
    description,
    imageUrls,
    imageUrl,
    location,
    price = 0,
    transactionType = 'pickup',
    owner,
    sellerRating = 4.8
}) => {
    const [liked, setLiked] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [imageErrors, setImageErrors] = useState({});
    const [isUpdating, setIsUpdating] = useState(false);
    const pendingLikedRef = useRef(null);
    const isSyncingRef = useRef(false);
    const navigate = useNavigate();

    const resolvedImageUrls = useMemo(() => {
        const normalizedFromImages = normalizeImageList(imageUrls);
        if (normalizedFromImages.length > 0) {
            return normalizedFromImages;
        }
        return normalizeImageList(imageUrl);
    }, [imageUrls, imageUrl]);

    useEffect(() => {
        setCurrentImageIndex(0);
        setImageErrors({});
    }, [id, resolvedImageUrls]);

    // Fetch liked state from backend on mount
    useEffect(() => {
        const fetchLikedState = async () => {
            if (!id) {
                console.warn('Post mount: no id provided');
                setLiked(false);
                return;
            }

            console.log(`Post ${id}: Fetching liked state...`);

            try {
                const viewer = getViewerIdentity();
                const viewerKey = viewer.normalizedUsername || viewer.normalizedEmail;
                if (!viewerKey) {
                    console.warn(`Post ${id}: No viewer identity found`);
                    setLiked(false);
                    return;
                }

                console.log(`Post ${id}: Viewer is`, viewerKey);
                const usersResponse = await readUsers();
                console.log(`Post ${id}: Fetched users:`, usersResponse);
                const users = toUsersArray(usersResponse);
                console.log(`Post ${id}: Users array has ${users.length} users`);

                const matchedUser = users.find((candidate) => {
                    const candidateUsername = normalizeIdentifier(candidate?.username);
                    const candidateEmail = normalizeIdentifier(candidate?.email);

                    return (
                        (viewer.normalizedUsername && candidateUsername === viewer.normalizedUsername) ||
                        (viewer.normalizedEmail && candidateEmail === viewer.normalizedEmail)
                    );
                });

                if (!matchedUser) {
                    console.warn(`Post ${id}: No matched user found for viewer`, viewerKey);
                    setLiked(false);
                    return;
                }

                console.log(`Post ${id}: Matched user object:`, matchedUser);
                const savedIds = resolveSavedPostIds(matchedUser);
                const normalizedId = String(id).trim();
                const isLiked = savedIds.includes(normalizedId);

                console.log(`Post ${id}: Checking if liked - normalizedId="${normalizedId}", savedIds=[${savedIds.join(', ')}], result=${isLiked}`);
                setLiked(isLiked);
            } catch (err) {
                console.error(`Post ${id}: Error fetching liked state:`, err);
                setLiked(false);
            }
        };

        fetchLikedState();
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
        return type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ');
    };

    const displayOwner = owner || 'Unknown User';

    const processPendingLikeSync = useCallback(async () => {
        if (isSyncingRef.current || !id) {
            return;
        }

        isSyncingRef.current = true;
        setIsUpdating(true);

        try {
            while (pendingLikedRef.current !== null) {
                const targetLiked = pendingLikedRef.current;
                pendingLikedRef.current = null;

                const listingId = String(id);

                try {
                    await queueLikeOperation(async () => {
                        await syncLikeAndSaveToBackend({ listingId, nextLiked: targetLiked });
                    });
                } catch (backendErr) {
                    console.error('Failed to sync save/like with backend:', backendErr);
                    if (pendingLikedRef.current === null) {
                        setLiked(!targetLiked);
                    }
                }
            }
        } finally {
            isSyncingRef.current = false;
            setIsUpdating(false);
        }
    }, [id]);

    useEffect(() => {
        const flushPendingLikeSync = () => {
            if (pendingLikedRef.current !== null) {
                void processPendingLikeSync();
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                flushPendingLikeSync();
            }
        };

        window.addEventListener('pagehide', flushPendingLikeSync);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('pagehide', flushPendingLikeSync);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [processPendingLikeSync]);

    const handleLike = (e) => {
        e.stopPropagation();

        if (!id) {
            return;
        }

        const viewer = getViewerIdentity();
        const viewerKey = viewer.normalizedUsername || viewer.normalizedEmail;
        if (!viewerKey) {
            return;
        }

        const nextLiked = !liked;

        setLiked(nextLiked);
        pendingLikedRef.current = nextLiked;
        void processPendingLikeSync();
    };

    const handleOpenPost = () => {
        if (id) {
            navigate(`/post/${id}`);
        }
    };

    const handleSellerClick = (e) => {
        e.stopPropagation();
        if (owner) {
            navigate(`/profile/${encodeURIComponent(owner)}`);
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

    const getTransactionIcon = (type) => {
        switch (type.toLowerCase()) {
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
                    onClick={handleLike}
                    className={`like-button ${liked ? 'liked' : ''} ${isUpdating ? 'syncing' : ''}`}
                    aria-label="Like post"
                    aria-busy={isUpdating}
                >
                    <HeartIcon />
                </button>
            </div>

            <div className="post-seller" onClick={handleSellerClick}>
                <div className="seller-info">
                    <ProfileAvatar value={displayOwner} className="seller-avatar" />
                    <div className="seller-details">
                        <span className="seller-name">{displayOwner}</span>
                        <span className="seller-rating">
                            <span className="star-icon">★</span>
                            {sellerRating}
                        </span>
                    </div>
                </div>

                <div className={`transaction-icon ${transactionType}`}>
                    {getTransactionIcon(transactionType)}
                </div>
            </div>
        </div>
    );
};

export default Post;