
# Database Layer — MVP Safe Version

## PURPOSE

This database architecture is designed for a scalable marketplace MVP focused on:

- Construction marketplace
- Business directory
- Services on demand
- Nearby workers and jobs
- GPS-based discovery
- Real-time communication

Optimized for:

- MongoDB Atlas
- Node.js
- Express.js
- Render
- Vercel

---

# MVP FEATURES

## 👷 Construction Marketplace

Users can register as:

- Boss
- Mason
- Carpenter
- Welder
- Electrician
- Painter
- Plumber
- Tile installer
- Assistant
- Heavy equipment operator
- Roofer
- Architect
- Engineer
- Surveyor
- Other construction professionals

Workers can:

- Set availability status
- Display skills
- Show experience level
- Be searchable by city
- Be searchable by GPS distance
- Receive nearby job notifications

---

# 🏢 Business Directory

Supported business categories:

- Companies
- Restaurants
- Hospitals
- Clinics
- Hotels
- Offices
- Lawyers
- Mechanics
- Tour guides
- Organizations

Businesses can:

- Create profiles
- Add GPS location
- Receive reviews
- Post jobs
- Offer services
- Be searchable nearby

---

# 🚀 Services On Demand

Supported services:

- Home chef
- Plumber
- Doctor
- Nurse
- Taxi
- Delivery
- Cleaning
- Videographer
- Designer

Users can:

- Request nearby services
- Find available providers
- Contact workers directly
- Receive notifications

---

# 🌍 LOCATION ENGINE

Supported features:

- GPS search
- GeoJSON support
- Distance sorting
- Nearby workers
- Nearby businesses
- Nearby jobs
- City normalization
- State normalization
- Country normalization

---

# 📍 GEOJSON STRUCTURE

```js
location: {
  type: "Point",

  coordinates: [
    longitude,
    latitude
  ],

  address: "",
  city: "",
  state: "",
  country: ""
}