# Initial User Requirements for Swapify

## General

- **Inspiration**: NYU Swap Store
- Homepage displaying available items listed by students within proximity or school affiliation
- Location-aware browsing and search
- Supports transactions like buying, selling, pickup, and drop-off

## Users

- **Target audience**: students
- Users can create accounts to post items, browse items, and filter by school affiliation and/or location
- Users can edit and delete their own accounts and posts
- User authentication is required for transactions of an item, such as posting or buying
  - Passwords are stored using secure hashing
- Each user provides:
  - school affiliation and a verified school email address
    - School email is validated using a [world university domain database](https://github.com/Hipo/university-domains-list)
  - a default location or dorm

## Item Post

- Each item post includes:
  - a title
  - description
  - one or more images
  - transaction type (buy, sell, pickup, or drop-off)
  - a geographic location (ZIP code or latitude/longitude)
- Each item is associated with the user who posted it
- Users can create, edit, and delete their own item listings
- Items are stored in a shared, global database

## Transactions

- Each item clearly indicates its transaction method
- Transaction methods include:
  - buy
  - sell
  - donation
  - pickup
  - drop-off
- **Stretch goal**: users receive notifications or confirmations when a transaction is completed

## Stretch Goals

- Map or globe-based visualization
- Items can be searched and filtered by distance radius, for example within 1 mile
- Items can be searched by ZIP code or geographic coordinates
- Items can be filtered by school affiliation or dorm
- Recommend items based on proximity to the user
- Automatically derive item location from photo metadata when available
- Transaction notifications
