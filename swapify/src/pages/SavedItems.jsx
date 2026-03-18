import Navbar from '../components/Navbar'
import '../styles/savedItems.css';

const SavedItems = () => {
  return (
    <div>
      <Navbar />
      <div>
        <h1 className="saved-items-title">Your Saved Items</h1>
      </div>
    </div>
  )
}

export default SavedItems