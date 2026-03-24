import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Post from '../components/post'
import { readListings, readUsers } from '../api'
import { getListingImageUrls } from '../utils/images'
import '../styles/savedItems.css';

const normalizeIdentifier = (value) => String(value || '').trim().toLowerCase();

const toUsersArray = (usersResponse) => {
  if (usersResponse && (usersResponse.Users || usersResponse.User)) {
    return Object.values(usersResponse.Users || usersResponse.User);
  }

  return Array.isArray(usersResponse) ? usersResponse : [];
};

const resolveSavedPostIds = (user) => {
  const savedField =
    user?.saved_listings ||
    user?.savedListings ||
    user?.saved_posts ||
    user?.savedPosts ||
    user?.saved_items ||
    user?.savedItems ||
    user?.favorites ||
    [];

  if (Array.isArray(savedField)) {
    return savedField.map((item) => String(item || '').trim()).filter(Boolean);
  }

  if (savedField && typeof savedField === 'object') {
    return Object.values(savedField)
      .map((item) => String(item || '').trim())
      .filter(Boolean);
  }

  return [];
};

const SavedItems = () => {
  const { username: routeIdentifier } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [savedListings, setSavedListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const viewerIdentifier = useMemo(() => {
    const routeValue = normalizeIdentifier(routeIdentifier);
    const storedUsername = normalizeIdentifier(localStorage.getItem('swapify.username'));
    const storedEmail = normalizeIdentifier(localStorage.getItem('swapify.email'));

    if (routeValue) {
      return routeValue;
    }

    return storedUsername || storedEmail || '';
  }, [routeIdentifier]);

  const filteredSavedListings = useMemo(() => {
    const needle = String(searchQuery || '').trim().toLowerCase();
    if (!needle) {
      return savedListings;
    }

    return savedListings.filter((listing) => {
      const title = String(listing?.title || '').toLowerCase();
      const description = String(listing?.description || '').toLowerCase();
      const location = String(listing?.meetup_location || listing?.location || '').toLowerCase();

      return title.includes(needle) || description.includes(needle) || location.includes(needle);
    });
  }, [savedListings, searchQuery]);

  useEffect(() => {
    if (!viewerIdentifier) {
      navigate('/login', { replace: true });
      return;
    }

    const loadSavedListings = async () => {
      setLoading(true);
      setError('');

      try {
        const usersResponse = await readUsers();
        const users = toUsersArray(usersResponse);

        const matchedUser = users.find((candidate) => {
          const candidateUsername = normalizeIdentifier(candidate?.username || candidate?.Username || candidate?.user_name);
          const candidateEmail = normalizeIdentifier(candidate?.email || candidate?.Email || candidate?.user_email);

          return candidateUsername === viewerIdentifier || candidateEmail === viewerIdentifier;
        });

        const backendSavedIds = matchedUser ? resolveSavedPostIds(matchedUser) : [];

        if (!matchedUser || backendSavedIds.length === 0) {
          setSavedListings([]);
          return;
        }

        const savedListingIds = backendSavedIds;

        const listingsResponse = await readListings();
        const listingsArray = listingsResponse && listingsResponse.Listings
          ? Object.values(listingsResponse.Listings)
          : Array.isArray(listingsResponse)
            ? listingsResponse
            : [];

        const savedIdSet = new Set(savedListingIds.map((id) => String(id)));
        const matchingSavedListings = listingsArray.filter((listing) =>
          savedIdSet.has(String(listing?._id || listing?.id || ''))
        );

        setSavedListings(matchingSavedListings);
      } catch (loadErr) {
        setError(loadErr instanceof Error ? loadErr.message : 'Failed to load saved items.');
      } finally {
        setLoading(false);
      }
    };

    // Load on mount
    loadSavedListings();

    // Reload when user returns to the page (e.g., from PostDetails)
    const handlePageFocus = () => {
      loadSavedListings();
    };

    window.addEventListener('focus', handlePageFocus);

    return () => {
      window.removeEventListener('focus', handlePageFocus);
    };
  }, [viewerIdentifier, navigate]);

  return (
    <main className="saved-items-page">
      <Navbar searchQuery={searchQuery} onSearchChange={(e) => setSearchQuery(e.target.value)} />

      <div className="saved-items-container">
        <h1 className="saved-items-title">Your Saved Items</h1>

        {loading ? (
          <p className="saved-items-state">Loading saved items…</p>
        ) : error ? (
          <p className="saved-items-state error">{error}</p>
        ) : filteredSavedListings.length === 0 ? (
          <p className="saved-items-state">No saved items yet. Tap the heart icon on listings to save them.</p>
        ) : (
          <div className="saved-items-grid">
            {filteredSavedListings.map((listing) => (
              <Post
                key={listing._id || listing.id}
                id={listing._id || listing.id}
                title={listing.title}
                description={listing.description}
                imageUrls={getListingImageUrls(listing)}
                location={listing.meetup_location || listing.location}
                transactionType={listing.transaction_type}
                price={listing.price}
                owner={listing.owner}
                sellerRating={listing.sellerRating || listing.rating || 4.8}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

export default SavedItems