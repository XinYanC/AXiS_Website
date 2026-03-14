const getProfileInitial = (value) => {
  const normalizedValue = String(value || '').trim()
  if (!normalizedValue) {
    return '?'
  }

  const localPart = normalizedValue.includes('@') ? normalizedValue.split('@')[0] : normalizedValue
  return localPart.charAt(0).toUpperCase() || '?'
}

function ProfileAvatar({ value, className = '' }) {
  const classes = className ? className : undefined

  return <span className={classes}>{getProfileInitial(value)}</span>
}

export default ProfileAvatar