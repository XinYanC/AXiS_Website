import { useState } from 'react'
import { Link } from 'react-router-dom'
import { createListing, uploadListingImage } from '../api'
import { DonationIcon, SellIcon } from './post'
import LocationDropdown from './LocationDropdown'
import '../styles/createListing.css'

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
    const [transactionType, setTransactionType] = useState('sell')
    const [listingCity, setListingCity] = useState('')
    const [listingState, setListingState] = useState('')
    const [listingCountry, setListingCountry] = useState('')
    const [price, setPrice] = useState('')
    const [uploadedImageUrls, setUploadedImageUrls] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [isUploadingImages, setIsUploadingImages] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [fieldErrors, setFieldErrors] = useState({})

    const TITLE_MIN = 3
    const TITLE_MAX = 80
    const DESCRIPTION_MIN = 10
    const DESCRIPTION_MAX = 1000
    const PRICE_MAX = 1000000

    const validateForm = () => {
        const errors = {}
        const trimmedTitle = title.trim()
        const trimmedDescription = description.trim()

        if (!trimmedTitle) {
            errors.title = 'Title is required.'
        } else if (trimmedTitle.length < TITLE_MIN) {
            errors.title = `Title must be at least ${TITLE_MIN} characters.`
        } else if (trimmedTitle.length > TITLE_MAX) {
            errors.title = `Title must be ${TITLE_MAX} characters or fewer.`
        }

        if (!trimmedDescription) {
            errors.description = 'Description is required.'
        } else if (trimmedDescription.length < DESCRIPTION_MIN) {
            errors.description = `Description must be at least ${DESCRIPTION_MIN} characters.`
        } else if (trimmedDescription.length > DESCRIPTION_MAX) {
            errors.description = `Description must be ${DESCRIPTION_MAX} characters or fewer.`
        }

        if (!listingCity || !listingState || !listingCountry) {
            errors.location = 'Please select country, state, and city.'
        }

        if (transactionType === 'sell') {
            const parsedPrice = parseFloat(price)
            if (price === '' || price == null) {
                errors.price = 'Price is required when selling.'
            } else if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
                errors.price = 'Price must be greater than 0.'
            } else if (parsedPrice > PRICE_MAX) {
                errors.price = `Price must be ${PRICE_MAX.toLocaleString()} or less.`
            }
        }

        return errors
    }

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

    const handleCloseForm = () => {
        // Reset all form fields
        setTitle('')
        setDescription('')
        setTransactionType('sell')
        setListingCity('')
        setListingState('')
        setListingCountry('')
        setPrice('')
        setUploadedImageUrls([])
        setError('')
        setSuccess(false)
        setFieldErrors({})
        // Close the form
        onClose()
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSuccess(false)

        const errors = validateForm()
        setFieldErrors(errors)
        if (Object.keys(errors).length > 0) {
            return
        }

        setIsLoading(true)

        try {
            if (!ownerIdentifier) {
                throw new Error('Could not determine the logged-in user. Please log out and log back in.')
            }

            const payload = {
                title,
                description,
                transaction_type: transactionType,
                owner: ownerIdentifier,
                city: listingCity,
                state: listingState,
                country: listingCountry,
                price:
                    transactionType === 'sell' && price !== '' && price != null
                        ? parseFloat(price)
                        : null,
            }

            if (uploadedImageUrls.length > 0) {
                payload.images = uploadedImageUrls
            }

            await createListing(payload)
            setSuccess(true)

            // Call onSuccess callback if provided - wait for it to complete
            if (onSuccess) {
                await onSuccess()
            }

            // Reset form and close after success callback completes
            setTimeout(() => {
                setTitle('')
                setDescription('')
                setTransactionType('sell')
                setListingCity('')
                setListingState('')
                setListingCountry('')
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
        <div className="create-listing-overlay" onClick={handleCloseForm}>
            <div className="create-listing-card" onClick={(e) => e.stopPropagation()}>
                <div className="create-listing-header">
                    <h2>{canCreateListing ? 'Create New Listing' : 'Sign Up Required'}</h2>
                    <button className="close-button" onClick={handleCloseForm}>&times;</button>
                </div>

                {!canCreateListing ? (
                    <div className="create-listing-auth-required">
                        <p>You need to sign up before posting a listing.</p>
                        <Link to="/register" className="create-listing-register-button" onClick={handleCloseForm}>
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
                                onChange={(e) => {
                                    setTitle(e.target.value)
                                    if (fieldErrors.title) setFieldErrors((prev) => ({ ...prev, title: undefined }))
                                }}
                                aria-invalid={Boolean(fieldErrors.title)}
                            />
                            {fieldErrors.title && <p className="field-error">{fieldErrors.title}</p>}

                            <textarea
                                placeholder="Description *"
                                value={description}
                                onChange={(e) => {
                                    setDescription(e.target.value)
                                    if (fieldErrors.description) setFieldErrors((prev) => ({ ...prev, description: undefined }))
                                }}
                                aria-invalid={Boolean(fieldErrors.description)}
                                rows={4}
                            />
                            {fieldErrors.description && <p className="field-error">{fieldErrors.description}</p>}

                            <LocationDropdown
                                legend="Location"
                                required
                                disabled={isLoading || isUploadingImages}
                                onSelectionChange={({ cityName, countryCode: cc, stateCode: sc }) => {
                                    setListingCity(cityName ? String(cityName).trim() : '')
                                    setListingState(sc ? String(sc).trim() : '')
                                    setListingCountry(cc ? String(cc).trim() : '')
                                    if (fieldErrors.location) setFieldErrors((prev) => ({ ...prev, location: undefined }))
                                }}
                            />
                            {fieldErrors.location && <p className="field-error">{fieldErrors.location}</p>}

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
                                        className={`transaction-option-button free ${transactionType === 'free' ? 'selected' : ''}`}
                                        onClick={() => handleTransactionTypeSelect('free')}
                                        aria-pressed={transactionType === 'free'}
                                    >
                                        <span className="transaction-option-icon"><DonationIcon /></span>
                                        <span>Free</span>
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
                                <>
                                    <input
                                        type="number"
                                        placeholder="Price *"
                                        value={price}
                                        onChange={(e) => {
                                            setPrice(e.target.value)
                                            if (fieldErrors.price) setFieldErrors((prev) => ({ ...prev, price: undefined }))
                                        }}
                                        step="0.01"
                                        min="0"
                                        aria-invalid={Boolean(fieldErrors.price)}
                                    />
                                    {fieldErrors.price && <p className="field-error">{fieldErrors.price}</p>}
                                </>
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
                            <p className="success-message">Listing created successfully! It may take a moment to appear in the feed.</p>
                        )}

                    </>
                )}
            </div>
        </div>
    )
}

export default CreateListing
