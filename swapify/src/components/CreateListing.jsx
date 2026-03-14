import { useState } from 'react'
import { Link } from 'react-router-dom'
import { createListing, uploadListingImage } from '../api'
import '../styles/createListing.css'

const PickupIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

const DropOffIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M12 2V12M12 12L15 9M12 12L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 12H3C3 14.3869 3.94821 16.6761 5.63604 18.364C7.32387 20.0518 9.61305 21 12 21C14.3869 21 16.6761 20.0518 18.364 18.364C20.0518 16.6761 21 14.3869 21 12H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
)

const SellIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M12 2V22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

const getStoredAuthState = () => {
    if (typeof window === 'undefined') {
        return false
    }

    return localStorage.getItem('swapify.authenticated') === 'true'
}

const getStoredOwnerIdentifier = () => {
    if (typeof window === 'undefined') {
        return ''
    }

    const username = localStorage.getItem('swapify.username') || ''
    const email = localStorage.getItem('swapify.email') || ''

    return String(username || email).trim()
}

const CreateListing = ({ isOpen, onClose, onSuccess, isLoggedIn, currentUserIdentifier }) => {
    const canCreateListing = typeof isLoggedIn === 'boolean' ? isLoggedIn : getStoredAuthState()
    const ownerIdentifier = String(currentUserIdentifier || getStoredOwnerIdentifier()).trim()
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [transactionType, setTransactionType] = useState('pickup')
    const [meetupLocation, setMeetupLocation] = useState('')
    const [price, setPrice] = useState('')
    const [uploadedImageUrls, setUploadedImageUrls] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [isUploadingImages, setIsUploadingImages] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const getReadableErrorMessage = (err, fallbackMessage) => {
        if (!(err instanceof Error)) {
            return fallbackMessage
        }

        const match = err.message.match(/\{"Error":\s*"([^"]+)"\}/)
        if (match && match[1]) {
            return match[1]
        }

        return err.message || fallbackMessage
    }

    const getSquareCroppedFile = (file) =>
        new Promise((resolve, reject) => {
            const objectUrl = URL.createObjectURL(file)
            const image = new Image()

            image.onload = () => {
                const sourceSize = Math.min(image.width, image.height)
                const sourceX = Math.floor((image.width - sourceSize) / 2)
                const sourceY = Math.floor((image.height - sourceSize) / 2)

                if (image.width === image.height) {
                    URL.revokeObjectURL(objectUrl)
                    resolve(file)
                    return
                }

                const canvas = document.createElement('canvas')
                canvas.width = sourceSize
                canvas.height = sourceSize

                const context = canvas.getContext('2d')
                if (!context) {
                    URL.revokeObjectURL(objectUrl)
                    reject(new Error('Could not crop image. Please try a different file.'))
                    return
                }

                context.drawImage(
                    image,
                    sourceX,
                    sourceY,
                    sourceSize,
                    sourceSize,
                    0,
                    0,
                    sourceSize,
                    sourceSize,
                )

                const originalType = file.type || 'image/jpeg'
                canvas.toBlob(
                    (blob) => {
                        URL.revokeObjectURL(objectUrl)

                        if (!blob) {
                            reject(new Error(`Could not process ${file.name}. Please try again.`))
                            return
                        }

                        const extensionIndex = file.name.lastIndexOf('.')
                        const fileBaseName = extensionIndex >= 0 ? file.name.slice(0, extensionIndex) : file.name
                        const fileExtension = extensionIndex >= 0 ? file.name.slice(extensionIndex) : ''
                        const croppedFileName = `${fileBaseName}-square${fileExtension}`

                        resolve(
                            new File([blob], croppedFileName, {
                                type: blob.type || originalType,
                            })
                        )
                    },
                    originalType,
                    0.95,
                )
            }

            image.onerror = () => {
                URL.revokeObjectURL(objectUrl)
                reject(new Error(`Failed to process image ${file.name}.`))
            }

            image.src = objectUrl
        })

    const handleImageUpload = async (e) => {
        const selectedFiles = Array.from(e.target.files || [])

        if (selectedFiles.length === 0) {
            return
        }

        setError('')
        setIsUploadingImages(true)

        try {
            const nonImageFiles = selectedFiles.filter((file) => !String(file.type || '').startsWith('image/'))
            if (nonImageFiles.length > 0) {
                throw new Error('Only image files can be uploaded.')
            }

            const newUrls = []
            for (const file of selectedFiles) {
                const squareFile = await getSquareCroppedFile(file)
                const uploadedUrl = await uploadListingImage(squareFile)
                newUrls.push(uploadedUrl)
            }

            setUploadedImageUrls((prev) => {
                const deduped = [...prev]
                newUrls.forEach((url) => {
                    if (!deduped.includes(url)) {
                        deduped.push(url)
                    }
                })
                return deduped
            })
        } catch (err) {
            setError(getReadableErrorMessage(err, 'Failed to upload image(s). Please try again.'))
        } finally {
            setIsUploadingImages(false)
            e.target.value = ''
        }
    }

    const handleRemoveUploadedImage = (indexToRemove) => {
        setUploadedImageUrls((prev) => prev.filter((_, index) => index !== indexToRemove))
    }

    const handleTransactionTypeSelect = (nextType) => {
        setTransactionType(nextType)
        if (nextType !== 'sell') {
            setPrice('')
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')
        setSuccess(false)

        try {
            if (!ownerIdentifier) {
                throw new Error('Could not determine the logged-in user. Please log out and log back in.')
            }

            const payload = {
                title,
                description,
                transaction_type: transactionType,
                owner: ownerIdentifier,
                meetup_location: meetupLocation,
                price: price ? parseFloat(price) : 0
            }

            if (uploadedImageUrls.length > 0) {
                payload.images = uploadedImageUrls
            }

            await createListing(payload)
            setSuccess(true)
            
            // Call onSuccess callback if provided
            if (onSuccess) {
                onSuccess()
            }
            
            // Reset form after 1.5 seconds and close
            setTimeout(() => {
                setTitle('')
                setDescription('')
                setTransactionType('pickup')
                setMeetupLocation('')
                setPrice('')
                setUploadedImageUrls([])
                setSuccess(false)
                onClose()
            }, 1500)
        } catch (err) {
            const errorMessage = getReadableErrorMessage(err, 'Failed to create listing. Please try again.')
            setError(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="create-listing-overlay" onClick={onClose}>
            <div className="create-listing-card" onClick={(e) => e.stopPropagation()}>
                <div className="create-listing-header">
                    <h2>{canCreateListing ? 'Create New Listing' : 'Sign Up Required'}</h2>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>

                {!canCreateListing ? (
                    <div className="create-listing-auth-required">
                        <p>You need to sign up before posting a listing.</p>
                        <Link to="/register" className="create-listing-register-button" onClick={onClose}>
                            Go to Registration
                        </Link>
                    </div>
                ) : (
                <>
                
                <form onSubmit={handleSubmit} className="create-listing-form">
                    <input
                        type="text"
                        placeholder="Title *"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                    
                    <textarea
                        placeholder="Description *"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        rows={4}
                    />

                    <input
                        type="text"
                        placeholder="Meetup Location *"
                        value={meetupLocation}
                        onChange={(e) => setMeetupLocation(e.target.value)}
                        required
                    />

                    <div className="image-upload-section">
                        <label htmlFor="listing-image-upload" className="image-upload-label">
                            Upload Images (optional)
                        </label>
                        <input
                            id="listing-image-upload"
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                            disabled={isLoading || isUploadingImages}
                        />
                        <p className="image-upload-hint">Images will be automatically center-cropped to a square.</p>

                        {isUploadingImages && (
                            <p className="image-upload-status">Uploading image(s)...</p>
                        )}

                        {uploadedImageUrls.length > 0 && (
                            <div className="uploaded-image-list">
                                {uploadedImageUrls.map((url, index) => (
                                    <div className="uploaded-image-item" key={`${url}-${index}`}>
                                        <img src={url} alt={`Uploaded listing image ${index + 1}`} />
                                        <button
                                            type="button"
                                            className="remove-uploaded-image-button"
                                            onClick={() => handleRemoveUploadedImage(index)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="transaction-picker" role="group" aria-label="Transaction Type">
                        <div className="transaction-button-grid">
                            <button
                                type="button"
                                className={`transaction-option-button drop-off ${transactionType === 'drop-off' ? 'selected' : ''}`}
                                onClick={() => handleTransactionTypeSelect('drop-off')}
                                aria-pressed={transactionType === 'drop-off'}
                            >
                                <span className="transaction-option-icon"><DropOffIcon /></span>
                                <span>Drop-off</span>
                            </button>
                            <button
                                type="button"
                                className={`transaction-option-button pickup ${transactionType === 'pickup' ? 'selected' : ''}`}
                                onClick={() => handleTransactionTypeSelect('pickup')}
                                aria-pressed={transactionType === 'pickup'}
                            >
                                <span className="transaction-option-icon"><PickupIcon /></span>
                                <span>Pickup</span>
                            </button>
                            <button
                                type="button"
                                className={`transaction-option-button sell ${transactionType === 'sell' ? 'selected' : ''}`}
                                onClick={() => handleTransactionTypeSelect('sell')}
                                aria-pressed={transactionType === 'sell'}
                            >
                                <span className="transaction-option-icon"><SellIcon /></span>
                                <span>Sell</span>
                            </button>
                        </div>
                    </div>

                    {(transactionType === 'sell') && (
                        <input
                            type="number"
                            placeholder="Price *"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            step="0.01"
                            min="0"
                            required
                        />
                    )}
                    
                    <button type="submit" disabled={isLoading || isUploadingImages} className="submit-button">
                        {isLoading ? 'Creating...' : 'Create Listing'}
                    </button>
                </form>

                {error && (
                    <div className="error-container">
                        <p className="error-header">Failed to Create Listing</p>
                        <p className="error-message">{error}</p>
                    </div>
                )}
                
                {success && (
                    <p className="success-message">Listing created successfully!</p>
                )}

                </>
                )}
            </div>
        </div>
    )
}

export default CreateListing
