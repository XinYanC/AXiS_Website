import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/post.css';

const Post = ({ id, itemTitle, imageUrl, initialLikes = 0, price = 0, transactionType = 'pickup' }) => {
    const [likes, setLikes] = useState(initialLikes);
    const navigate = useNavigate();

    const isBuy = transactionType === 'buy';

    const handleLike = (e) => {
        e.stopPropagation();
        setLikes(likes + 1);
    };

    const handleOpenPost = () => {
        navigate(`/post/${id}`);
    };

    return (
        <div onClick={handleOpenPost} className="post-container">
            <div className="post-title">
                {itemTitle}
            </div>
            <img src={imageUrl} alt="Item Image" />
            <button onClick={handleLike} className="like-button">
                Like ({likes})
            </button>
            <button
                type="button"
                className={`transaction-button ${isBuy ? 'buy' : 'pickup'}`}
            >
                {isBuy ? `Buy $${price}` : 'Pickup'}
            </button>
        </div>
    );
};

export default Post;