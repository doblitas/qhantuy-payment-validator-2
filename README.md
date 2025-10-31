# Qhantuy Payment Validator - Shopify Checkout Extension

A Shopify checkout extension app that validates manual QR payments from Qhantuy directly on the **Thank You page** and **Order Status page**, without requiring additional page redirects.

## Features

- ✅ **Seamless Integration**: Works on both Thank You page AND Order Status page
- ✅ **Real-time Validation**: Automatically polls Qhantuy API to verify payment status
- ✅ **QR Code Display**: Shows QR code for payment if not yet completed
- ✅ **Persistent State**: Customer can leave and return - payment status is saved
- ✅ **Multi-store Ready**: Can be deployed as a public app for multiple stores
- ✅ **Configurable**: Easy settings management through Shopify admin
- ✅ **No Page Redirects**: Everything happens in the checkout flow

## Where It Works

### 1. Thank You Page (Immediately After Checkout)
- Customer completes checkout
- Extension loads automatically
- QR code displayed for payment
- Real-time status updates

### 2. Order Status Page (Accessible Anytime)
- Customer can access via email link
- Shows current payment status
- Restores QR code if needed
- Continues verification if pending

## Architecture

This app consists of two main components:

1. **Checkout Extension** (Frontend): React component that runs in Shopify's checkout
2. **Backend API** (Node.js/Express): Handles webhooks, callbacks, and order updates

### Flow Diagram

```
Customer Checkout → Manual QR Payment Selected
    ↓
Thank You Page Loads (or Order Status Page)
    ↓
Extension Detects Manual Payment
    ↓
Checks Browser Storage for Existing Transaction
    ↓
Creates Qhantuy Checkout (if not exists)
    ↓
Displays QR Code to Customer
    ↓
Polls Qhantuy API every 5 seconds
    ↓
Customer Pays via Banking App (can do this later)
    ↓
Qhantuy Sends Callback to App
    ↓
App Updates Shopify Order
    ↓
Extension Shows Success Message
    ↓
Customer Can Return to Order Status Page Anytime
    ↓
Extension Remembers Payment Status (Persistent)
```

## Prerequisites

- Node.js 18+ installed
- Shopify Partner account
- Shopify development store
- Qhantuy merchant account with API credentials
- ngrok or similar tunneling service (for development)

## Installation

### 1. Clone and Setup

```bash
# Navigate to your project directory
cd qhantuy-payment-validator

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` file with your credentials:

```env
# Get these from Shopify Partner Dashboard
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_APP_URL=https://your-ngrok-url.ngrok.io

# Get these from Qhantuy
QHANTUY_API_TOKEN=your_x_api_token
QHANTUY_APPKEY=your_64_char_appkey
QHANTUY_API_URL=https://checkout.qhantuy.com/external-api
```

### 3. Create Shopify App

1. Go to [Shopify Partner Dashboard](https://partners.shopify.com)
2. Click "Apps" → "Create app"
3. Choose "Public app" (or "Custom app" for single store)
4. Fill in app details:
   - **App name**: Qhantuy Payment Validator
   - **App URL**: https://your-app-url.com
   - **Allowed redirection URL(s)**: 
     - `https://your-app-url.com/auth/callback`
     - `https://your-app-url.com/auth/shopify/callback`

5. Copy the API key and API secret to your `.env` file

### 4. Configure App Settings in Partner Dashboard

**Configuration → App setup:**

1. **Embedded app**: Yes
2. **Checkout → Post-purchase extensions**: Enable
3. **Admin API access scopes**:
   - `read_orders`
   - `write_orders`
   - `read_checkouts`

4. **Webhooks** (under "Event subscriptions"):
   - `orders/create` → `https://your-app-url.com/api/webhooks/orders/create`
   - `orders/updated` → `https://your-app-url.com/api/webhooks/orders/updated`

### 5. Update shopify.app.toml

Edit `shopify.app.toml` and update:

```toml
client_id = "YOUR_SHOPIFY_API_KEY"
application_url = "https://your-app-url.com"
dev_store_url = "your-dev-store.myshopify.com"
```

### 6. Build and Deploy Extension

```bash
# Login to Shopify CLI
npm run shopify auth login

# Deploy the extension
npm run deploy
```

### 7. Start Development Server

For local development:

```bash
# Terminal 1: Start ngrok
ngrok http 3000

# Terminal 2: Start the app
npm run dev
```

### 8. Install App in Your Store

1. In Partner Dashboard, go to your app
2. Click "Select store" and choose your development store
3. Click "Install app"
4. Approve the permission requests

### 9. Configure Extension Settings

After installation:

1. Go to Shopify Admin → Settings → Checkout
2. Find "Qhantuy QR Payment Validator" in the extensions list
3. Click "Edit" and configure:
   - **Qhantuy API URL**: `https://checkout.qhantuy.com/external-api`
   - **Qhantuy API Token**: Your X-API-Token
   - **Qhantuy AppKey**: Your 64-character appkey
   - **Manual Payment Gateway Name**: Name of your manual payment method (e.g., "Transferencia QR", "Manual Payment")
   - **Check Interval**: 5 seconds (recommended)
   - **Max Check Duration**: 30 minutes (recommended)

4. Click "Save"

### 10. Configure Qhantuy Callback URL

In your Qhantuy merchant settings, set the callback URL to:
```
https://your-app-url.com/api/qhantuy/callback
```

## Testing

### Test in Development Store

1. Create a test product in your store
2. Go through checkout and select your manual payment method
3. Complete the order
4. On the thank you page, you should see:
   - The QR code (if using image method URL)
   - A "Waiting for payment confirmation" message
   - Automatic status updates every 5 seconds

### Simulate Payment (Testing Environment)

Use the Postman collection provided in the Qhantuy documentation:

```json
POST https://testingcheckout.qhantuy.com/external-api/test-callback
Authorization: Basic Auth (your BCP credentials)
Content-Type: application/json

{
    "transactionID": "YOUR_TRANSACTION_ID"
}
```

## Configuration Options

### Extension Settings (Configurable in Shopify Admin)

| Setting | Description | Default |
|---------|-------------|---------|
| Qhantuy API URL | Base URL for Qhantuy API | https://checkout.qhantuy.com/external-api |
| Qhantuy API Token | X-API-Token from Qhantuy | - |
| Qhantuy AppKey | 64-character device/merchant key | - |
| Payment Gateway Name | Name of manual payment method to detect | "Manual" |
| Check Interval | Seconds between payment checks | 5 |
| Max Check Duration | Maximum minutes to check for payment | 30 |

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/qhantuy/callback` | GET | Receives payment notifications from Qhantuy |
| `/api/orders/confirm-payment` | POST | Manual payment confirmation from extension |
| `/api/webhooks/orders/create` | POST | Shopify order creation webhook |
| `/api/webhooks/orders/updated` | POST | Shopify order update webhook |
| `/auth` | GET | Initiates Shopify OAuth |
| `/auth/callback` | GET | Shopify OAuth callback |

## How It Works

### Payment Flow

1. **Customer completes checkout** with manual payment method
2. **Extension loads** on thank you page and detects manual payment
3. **Creates Qhantuy checkout** if not already created:
   - Sends order details to Qhantuy API
   - Receives transaction ID and QR code
   - Stores transaction ID in browser storage
4. **Displays QR code** to customer for payment
5. **Starts polling** Qhantuy API every 5 seconds:
   - Checks payment status
   - Updates UI based on status
   - Stops after success or timeout
6. **Customer pays** via banking app by scanning QR
7. **Qhantuy sends callback** to app backend:
   - App verifies payment details
   - Updates Shopify order status
   - Marks order as paid
8. **Extension detects success** and shows confirmation

### Payment Verification

The app uses multiple verification methods:

1. **Polling**: Extension actively checks payment status
2. **Callback**: Qhantuy notifies app when payment completes
3. **Double-check**: App re-verifies with Qhantuy before updating order

### Security

- API token authentication for all Qhantuy requests
- Webhook signature verification for Shopify webhooks
- Callback parameter validation
- HTTPS required for all communications

## Troubleshooting

### Extension Not Showing

**Check:**
- Extension is deployed and activated in Shopify admin
- Payment method name matches configuration
- Order uses manual payment method
- Browser console for errors

### Payment Not Detected

**Check:**
- Qhantuy callback URL is correctly configured
- API credentials are correct
- Transaction ID is being generated
- Network requests in browser console
- App backend logs

### Order Not Updating

**Check:**
- Shopify API scopes include `write_orders`
- Access token is valid
- Webhook endpoints are accessible
- App backend logs for errors

### Common Errors

**"Failed to create payment"**
- Verify Qhantuy API credentials
- Check API URL (testing vs production)
- Ensure appkey is 64 characters

**"Payment verification timeout"**
- Increase max check duration
- Verify Qhantuy API is responding
- Check network connectivity

**"Shop session not found"**
- Reinstall app in store
- Verify session storage implementation

## Deployment to Production

### 1. Update Environment Variables

```env
NODE_ENV=production
SHOPIFY_APP_URL=https://your-production-domain.com
QHANTUY_API_URL=https://checkout.qhantuy.com/external-api
```

### 2. Deploy to Hosting Service

**Option A: Deploy to Heroku**

```bash
# Install Heroku CLI and login
heroku login

# Create app
heroku create qhantuy-payment-validator

# Set environment variables
heroku config:set SHOPIFY_API_KEY=your_key
heroku config:set SHOPIFY_API_SECRET=your_secret
# ... set all other variables

# Deploy
git push heroku main
```

**Option B: Deploy to any Node.js hosting**

1. Build the app: `npm run build`
2. Upload files to server
3. Set environment variables
4. Run: `npm start`

### 3. Update URLs in Shopify Partner Dashboard

- App URL
- Redirect URLs
- Webhook URLs

### 4. Submit for Review (Public Apps)

1. Complete app listing in Partner Dashboard
2. Add screenshots and description
3. Submit for Shopify review
4. Wait for approval

## Making It Multi-Store

The app is already designed to work with multiple stores. To distribute:

### Option 1: Public App (Shopify App Store)

1. Create as "Public app" in Partner Dashboard
2. Complete the review process
3. List in Shopify App Store
4. Merchants install directly from App Store

### Option 2: Unlisted Public App

1. Create as "Public app" but don't list publicly
2. Share installation link with specific merchants
3. Each store installs via the link

### Per-Store Configuration

Each store configures their own:
- Qhantuy API credentials (via extension settings)
- Payment method names
- Check intervals
- Callback URLs (same endpoint, different store IDs)

## API Documentation

### Create Qhantuy Checkout

```javascript
POST /v2/checkout
Headers:
  X-API-Token: your_token
  Content-Type: application/json

Body:
{
  "appkey": "64_character_key",
  "customer_email": "customer@example.com",
  "customer_first_name": "John",
  "customer_last_name": "Doe",
  "currency_code": "BOB",
  "internal_code": "SHOPIFY-ORDER-1054",
  "payment_method": "QRSIMPLE",
  "image_method": "URL",
  "detail": "Order description",
  "callback_url": "https://your-app.com/api/qhantuy/callback",
  "return_url": "https://store.com/thank_you",
  "items": [
    {
      "name": "Product Name",
      "quantity": 2,
      "price": 50.00
    }
  ]
}

Response:
{
  "process": true,
  "message": "OK generado correctamente.",
  "transaction_id": 17216,
  "checkout_amount": 100,
  "checkout_currency": "BOB",
  "image_data": "https://qpos-dev.qhantuy.com/assets/demo/qr-bcp.png",
  "payment_status": "holding"
}
```

### Check Payment Status

```javascript
POST /check-payments
Headers:
  X-API-Token: your_token
  Content-Type: application/json

Body:
{
  "appkey": "64_character_key",
  "payment_ids": [17216]
}

Response:
{
  "process": true,
  "message": "Consulta exitosa",
  "payments": [
    {
      "id": 17216,
      "checkout_amount": 100,
      "checkout_currency": "BOB",
      "payment_status": "success"
    }
  ]
}
```

## Contributing

This is a proprietary app for tupropiapp. For internal development:

1. Create a feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request
5. Get approval before merging

## Support

For issues or questions:
- **Internal**: Contact development team
- **Merchants**: Provide support email in app listing

## License

Proprietary - All rights reserved by tupropiapp

## Version History

### v1.0.0 (Current)
- Initial release
- Thank you page extension
- QR payment validation
- Real-time polling
- Callback handling
- Multi-store support

## Roadmap

- [ ] Add retry logic for failed API calls
- [ ] Implement customer notifications via email
- [ ] Add payment analytics dashboard
- [ ] Support for multiple payment methods
- [ ] Webhook retry mechanism
- [ ] Advanced logging and monitoring
- [ ] Customer-facing payment history

## Credits

Developed for tupropiapp's Shopify Partner account
Integrates with Qhantuy payment gateway API

---

**Questions?** Review the Shopify and Qhantuy documentation linked above or contact the development team.
