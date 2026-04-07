import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Post from '../components/post';
import ProfileAvatar from '../components/ProfileAvatar';
import { readUsers } from '../api/users';
import { readListingsByUser } from '../api/listings';
import '../styles/profile.css';
import { formatGeoLocation } from '../utils/geo';

// Memoize Post component to prevent unnecessary re-renders
const MemoizedPost = React.memo(Post);

// SVG Icons
const LocationIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 22C16 18 20 14.4183 20 10C20 5.58172 16.4183 2 12 2C7.58172 2 4 5.58172 4 10C4 14.4183 8 18 12 22Z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
);

const CalendarIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M16 2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M3 10H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);

const VerifiedIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const normalizeUsername = (value) =>
    String(value || '')
        .trim()
        .replace(/^@+/, '')
        .toLowerCase();

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const formatDateToMonthYear = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    } catch {
        return 'N/A';
    }
};

const Profile = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [listings, setListings] = useState([]);
    const [activeTab, setActiveTab] = useState('active');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const getViewerIdentity = () => ({
        username: normalizeUsername(localStorage.getItem('swapify.username')),
        email: normalizeEmail(localStorage.getItem('swapify.email')),
    });

    // Memoize filtered listings to prevent unnecessary recalculations
    const filteredListings = useMemo(
        () => listings.filter(item =>
            activeTab === 'active' ? item.status !== 'sold' : item.status === 'sold'
        ),
        [listings, activeTab]
    );

    const isOwnProfile = useMemo(
        () => {
            const viewer = getViewerIdentity();
            return Boolean(
                (viewer.username && viewer.username === normalizeUsername(user?.username)) ||
                (viewer.email && viewer.email === normalizeEmail(user?.email))
            );
        },
        [user]
    );

    useEffect(() => {
        const fetchUserData = async () => {
            if (!username) {
                setError('Username is required to view this profile.');
                setLoading(false);
                return;
            }

            setLoading(true);
            setError('');

            try {
                const usersResponse = await readUsers();

                const bucket = usersResponse?.User;
                const usersArray =
                    bucket
                        ? Object.values(bucket)
                        : [];

                const routeIdentifier = String(username || '').trim();
                const storedUsername = normalizeUsername(localStorage.getItem('swapify.username'));
                const storedEmail = normalizeEmail(localStorage.getItem('swapify.email'));
                const routeAsUsername = normalizeUsername(routeIdentifier);
                const routeAsEmail = normalizeEmail(routeIdentifier);

                // Try to find user by route identifier first
                let profileUser = usersArray.find((candidate) => {
                    const candidateUsername = normalizeUsername(candidate?.username || '');
                    const candidateEmail = normalizeEmail(candidate?.email || '');

                    return candidateUsername === routeAsUsername || candidateEmail === routeAsEmail;
                });

                // If not found and we have a logged-in user, try to match by stored credentials
                if (!profileUser && (storedUsername || storedEmail)) {
                    profileUser = usersArray.find((candidate) => {
                        const candidateUsername = normalizeUsername(candidate?.username || '');
                        const candidateEmail = normalizeEmail(candidate?.email || '');

                        return (storedUsername && candidateUsername === storedUsername) ||
                               (storedEmail && candidateEmail === storedEmail);
                    });
                }

                if (!profileUser) {
                    setUser(null);
                    setListings([]);
                    setError('User not found');
                    return;
                }

                const profileUsernameKey =
                    normalizeUsername(profileUser?.username || '') || routeAsUsername;
                const listingsResponse = await readListingsByUser(profileUsernameKey);
                const allListings = listingsResponse?.Listings
                    ? Object.values(listingsResponse.Listings)
                    : [];

                const userListings = allListings.filter(
                    (listing) => normalizeUsername(listing.owner) === profileUsernameKey
                );
                /* AXiS listing model has no `status`; treat all as active unless you add it server-side. */
                const soldCount = userListings.filter((listing) => listing.status === 'sold').length;
                const activeCount = userListings.filter((listing) => listing.status !== 'sold').length;

                const isVerified = profileUser.is_verified === true;

                const displayUsername =
                    String(profileUser.username || username || '').trim();
                const ratingNum = Number(profileUser.rating);
                const rating = Number.isFinite(ratingNum) ? ratingNum : 0;

                const normalizedUser = {
                    ...profileUser,
                    name: profileUser.name || displayUsername || username,
                    username: displayUsername,
                    location: formatGeoLocation(profileUser) || 'Unknown location',
                    memberSince: formatDateToMonthYear(profileUser.created_at),
                    rating,
                    totalReviews: 0,
                    verified: isVerified,
                    bio: profileUser.bio || 'No bio yet.',
                    stats: {
                        itemsListed: userListings.length,
                        itemsSold: soldCount,
                        activeListings: activeCount,
                    },
                };

                setUser(normalizedUser);
                setListings(userListings);
            } catch (err) {
                console.error('Failed to load profile data:', err);
                setError('');
                setUser(null);
                setListings([]);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [username]);

    const handleLogout = useCallback(() => {
        localStorage.removeItem('swapify.authenticated');
        localStorage.removeItem('swapify.username');
        localStorage.removeItem('swapify.email');
        navigate('/login', { replace: true });
    }, [navigate]);

    if (loading) {
        return (
            <>
                <Navbar
                    searchQuery={searchQuery}
                    onSearchChange={(e) => setSearchQuery(e.target.value)}
                    showLogoutButton
                    onLogout={handleLogout}
                />
                <div className="profile-loading">
                    <div className="loading-spinner"></div>
                </div>
            </>
        );
    }

    if (!user) {
        return (
            <>
                <Navbar
                    searchQuery={searchQuery}
                    onSearchChange={(e) => setSearchQuery(e.target.value)}
                    showLogoutButton
                    onLogout={handleLogout}
                />
                <div className="profile-error">
                    <h2>{error === 'User not found' ? 'User not found' : 'Unable to load profile'}</h2>
                    <p>The profile you're looking for doesn't exist or could not be loaded.</p>
                </div>
            </>
        );
    }

    const profileMessagePath = `mailto:${encodeURIComponent(user.email || '')}`;

    return (
        <>
            <Navbar
                searchQuery={searchQuery}
                onSearchChange={(e) => setSearchQuery(e.target.value)}
                showLogoutButton
                onLogout={handleLogout}
            />

            <div className="profile-container">
                {/* Profile Header */}
                <div className="profile-header">
                    <div className="profile-cover">
                        {/* Optional cover image */}
                    </div>

                    <div className="profile-info">
                        <ProfileAvatar value={user.name} className="profile-avatar-large" />

                        <div className="profile-details">
                            <div className="profile-name-section">
                                <h1 className="profile-name">
                                    {user.name}
                                    {user.verified && <VerifiedIcon />}
                                </h1>
                                <p className="profile-username">@{user.username}</p>
                            </div>

                            <p className="profile-bio">{user.bio}</p>

                            <div className="profile-meta">
                                <div className="profile-meta-item">
                                    <LocationIcon />
                                    <span>{user.location}</span>
                                </div>
                                <div className="profile-meta-item">
                                    <CalendarIcon />
                                    <span>Member since {user.memberSince}</span>
                                </div>
                            </div>

                            <div className="profile-rating">
                                <span className="rating-stars">
                                    {'★'.repeat(Math.floor(user.rating))}
                                    {'☆'.repeat(5 - Math.floor(user.rating))}
                                </span>
                                <span className="rating-number">{user.rating}</span>
                                <span className="rating-total">({user.totalReviews} reviews)</span>
                            </div>

                            {!isOwnProfile && (
                                <a href={profileMessagePath} className="profile-message-button">
                                    Message Seller
                                </a>
                            )}

                            <div className="profile-stats">
                                <div className="stat-item">
                                    <span className="stat-value">{user.stats.itemsListed}</span>
                                    <span className="stat-label">Listed</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-value">{user.stats.itemsSold}</span>
                                    <span className="stat-label">Sold</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-value">{user.stats.activeListings}</span>
                                    <span className="stat-label">Active</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="profile-tabs">
                    <button
                        className={`tab-button ${activeTab === 'active' ? 'active' : ''}`}
                        onClick={() => setActiveTab('active')}
                    >
                        Active Listings ({user.stats.activeListings})
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'sold' ? 'active' : ''}`}
                        onClick={() => setActiveTab('sold')}
                    >
                        Sold Items ({user.stats.itemsSold})
                    </button>
                </div>

                {/* Listings Grid */}
                {filteredListings.length > 0 ? (
                    <div className="profile-posts-grid">
                        {filteredListings.map((listing) => (
                            <div key={listing._id} className="post-wrapper">
                                {listing.status === 'sold' && (
                                    <div className="sold-overlay">
                                        <span>SOLD</span>
                                    </div>
                                )}
                                <MemoizedPost
                                    id={listing._id}
                                    title={listing.title}
                                    description={listing.description}
                                    imageUrls={Array.isArray(listing.images) ? listing.images : []}
                                    location={formatGeoLocation(listing)}
                                    transactionType={listing.transaction_type}
                                    price={listing.price}
                                    owner={listing.owner}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="profile-empty">
                        <p>No {activeTab} items to show.</p>
                    </div>
                )}
            </div>
        </>
    );
};

export default Profile;