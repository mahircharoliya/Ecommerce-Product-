# Product Explorer

A full-stack product browsing app with real Razorpay payment integration.

## Tech Stack

**Frontend:** React 18 · Vite · Zustand · CSS Modules  
**Backend:** Node.js · Express · Razorpay SDK

---

## Project Structure

```
product-explorer/
├── src/                          # React frontend
│   ├── components/               # UI components
│   ├── hooks/                    # useFetch, useDebounce
│   ├── services/
│   │   └── razorpayService.js    # Talks to Express backend
│   └── store/
│       └── useCartStore.js       # Zustand cart store
│
├── server/                       # Express backend
│   ├── index.js                  # Entry point
│   ├── config/
│   │   └── razorpay.js           # Razorpay SDK instance
│   ├── routes/
│   │   └── payment.js            # /api/payment/* endpoints
│   └── middleware/
│       ├── errorHandler.js
│       └── logger.js
│
├── .env                          # Frontend env (gitignored)
├── .env.example                  # Frontend env template
├── server/.env                   # Backend env (gitignored)
└── server/.env.example           # Backend env template
```

---

## Setup

### 1. Get Razorpay Test Keys
1. Sign up at https://razorpay.com
2. Go to **Settings → API Keys → Generate Test Key**
3. Copy your **Key ID** and **Key Secret**

### 2. Configure Environment

```bash
# Frontend env
cp .env.example .env
# (no changes needed for local dev)

# Backend env
cp server/.env.example server/.env
```

Edit `server/.env`:
```
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx
```

### 3. Install & Run

```bash
npm install
npm run dev:all
```

This starts both:
- Frontend at http://localhost:5173
- Backend at http://localhost:5000

---

## Payment Flow

```
User clicks "Pay with Razorpay"
        ↓
Frontend → POST /api/payment/create-order  (backend creates order with secret key)
        ↓
Razorpay modal opens (user enters card/UPI)
        ↓
Frontend → POST /api/payment/verify  (backend verifies HMAC-SHA256 signature)
        ↓
Success screen shown with Order ID + Payment ID
```

## Test Cards (Razorpay Test Mode)

| Card Number      | Expiry | CVV | Result  |
|------------------|--------|-----|---------|
| 4111 1111 1111 1111 | Any future | Any | Success |
| 5267 3181 8797 5449 | Any future | Any | Success |

For UPI: use `success@razorpay` as the UPI ID.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |
| GET | `/api/payment/key` | Get Razorpay public key |
| POST | `/api/payment/create-order` | Create Razorpay order |
| POST | `/api/payment/verify` | Verify payment signature |
| GET | `/api/payment/status/:id` | Get payment details |
