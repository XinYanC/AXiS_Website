import { useEffect, useMemo, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Post from '../components/post'
import { readListings, readUsers } from '../api'
import { getListingImageUrls } from '../utils/images'
import { formatGeoLocation } from '../utils/geo'
import '../styles/savedItems.css';

const normalizeIdentifier = (value) => String(value || '').trim().toLowerCase();

const toUsersArray = (usersResponse) => {
  const bucket = usersResponse?.User;
  if (bucket) {
    return Object.values(bucket);
  }
  return [];
};

const resolveSavedPostIds = (user) => {
  const savedField = user?.saved_listings;
  if (!Array.isArray(savedField)) {
    return [];
  }
  return savedField.map((item) => String(item || '').trim()).filter(Boolean);
};

const SavedItems = () => {
  const { username: routeIdentifier } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [savedListings, setSavedListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const loadSavedListingsRef = useRef(null);

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
    const searchTerm = String(searchQuery || '').trim().toLowerCase();
    if (!searchTerm) {
      return savedListings;
    }

    return savedListings.filter((listing) => {
      const title = String(listing?.title || '').toLowerCase();
      const description = String(listing?.description || '').toLowerCase();
      const geo = formatGeoLocation(listing).toLowerCase();

      return title.includes(searchTerm) || description.includes(searchTerm) || geo.includes(searchTerm);
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
          const candidateUsername = normalizeIdentifier(candidate?.username);
          const candidateEmail = normalizeIdentifier(candidate?.email);

          return candidateUsername === viewerIdentifier || candidateEmail === viewerIdentifier;
        });

        const backendSavedIds = matchedUser ? resolveSavedPostIds(matchedUser) : [];

        if (!matchedUser || backendSavedIds.length === 0) {
          setSavedListings([]);
          setLoading(false);
          return;
        }

        const savedListingIds = backendSavedIds;

        const listingsResponse = await readListings();
        const listingsArray = listingsResponse?.Listings
          ? Object.values(listingsResponse.Listings)
          : [];

        const savedIdSet = new Set(savedListingIds.map((id) => String(id)));
        const matchingSavedListings = listingsArray.filter((listing) =>
          savedIdSet.has(String(listing?._id ?? ''))
        );

        setSavedListings(matchingSavedListings);
      } catch (loadErr) {
        setError(loadErr instanceof Error ? loadErr.message : 'Failed to load saved items.');
      } finally {
        setLoading(false);
      }
    };

    // Store the function in a ref so we can call it from event handlers
    loadSavedListingsRef.current = loadSavedListings;

    // Load on mount
    loadSavedListings();

    // Reload when page becomes visible (user switches back to tab or returns from another page)
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
                key={listing._id}
                id={listing._id}
                title={listing.title}
                description={listing.description}
                imageUrls={getListingImageUrls(listing)}
                location={formatGeoLocation(listing)}
                transactionType={listing.transaction_type}
                price={listing.price}
                owner={listing.owner}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

export default SavedItems