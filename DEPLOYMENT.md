# Deployment Guide - Qhantuy Payment Validator

## Quick Start Checklist

- [ ] Shopify Partner account created
- [ ] App created in Partner Dashboard
- [ ] Qhantuy API credentials obtained
- [ ] Development store set up
- [ ] Environment variables configured
- [ ] Extension deployed
- [ ] App installed in store
- [ ] Extension configured in checkout settings
- [ ] Manual payment method created in store
- [ ] Test purchase completed successfully

## Step-by-Step Deployment

### Phase 1: Initial Setup (15 minutes)

#### 1. Create Shopify Partner Account
1. Go to https://partners.shopify.com
2. Sign up or log in with tupropiapp credentials
3. Verify email address

#### 2. Create New App
1. In Partner Dashboard, click "Apps" → "Create app"
2. Choose "Public distribution" (for multi-store) or "Custom distribution" (single store)
3. Enter app details:
   ```
   App name: Qhantuy Payment Validator
   App handle: qhantuy-payment-validator
   ```
4. Save and note your API key and API secret

#### 3. Get Qhantuy Credentials
Contact Qhantuy to obtain:
- X-API-Token (for API authentication)
- AppKey (64-character device identifier)
- Callback authorization (if required)

### Phase 2: Local Development Setup (20 minutes)

#### 1. Install Required Tools

```bash
# Install Node.js 18+ (if not installed)
# Download from https://nodejs.org

# Install Shopify CLI
npm install -g @shopify/cli @shopify/app

# Install ngrok for local testing
# Download from https://ngrok.com
```

#### 2. Clone and Configure Project

```bash
# Navigate to project
cd qhantuy-payment-validator

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your credentials
nano .env
```

#### 3. Configure Environment

Edit `.env`:
```env
SHOPIFY_API_KEY=your_api_key_from_partner_dashboard
SHOPIFY_API_SECRET=your_api_secret_from_partner_dashboard
SHOPIFY_APP_URL=https://your-temporary-url.ngrok.io

QHANTUY_API_TOKEN=your_qhantuy_token
QHANTUY_APPKEY=your_64_char_appkey
QHANTUY_API_URL=https://testingcheckout.qhantuy.com/external-api

PORT=3000
NODE_ENV=development
```

#### 4. Update shopify.app.toml

```toml
client_id = "YOUR_SHOPIFY_API_KEY"
application_url = "https://your-temporary-url.ngrok.io"
dev_store_url = "your-dev-store.myshopify.com"

[access_scopes]
scopes = "read_orders,write_orders,read_checkouts"
```

### Phase 3: Development and Testing (30 minutes)

#### 1. Start Local Development

Terminal 1 - Start ngrok:
```bash
ngrok http 3000
```
Copy the HTTPS URL (e.g., https://abc123.ngrok.io)

Terminal 2 - Update environment with ngrok URL:
```bash
# Update .env
SHOPIFY_APP_URL=https://abc123.ngrok.io

# Update shopify.app.toml
application_url = "https://abc123.ngrok.io"
```

Terminal 3 - Start the app:
```bash
npm run dev
```

#### 2. Update Partner Dashboard URLs

In Partner Dashboard → Your App → Configuration:

**App URL:**
```
https://abc123.ngrok.io
```

**Allowed redirect URLs:**
```
https://abc123.ngrok.io/auth/callback
https://abc123.ngrok.io/auth/shopify/callback
http://localhost:3000/auth/callback
```

#### 3. Deploy Extension

```bash
# Login to Shopify CLI
shopify auth login

# Deploy extension
npm run deploy

# or
shopify app deploy
```

Follow the prompts to select your app and confirm deployment.

#### 4. Install in Development Store

1. Go to Partner Dashboard → Your App → Test on development store
2. Select your development store
3. Click "Install app"
4. Approve all permissions

### Phase 4: Store Configuration (15 minutes)

#### 1. Create Manual Payment Method

In Shopify Admin:
1. Go to Settings → Payments
2. Scroll to "Manual payment methods"
3. Click "Add manual payment method"
4. Choose "Bank deposit" or "Other"
5. Set name: "Transferencia QR Qhantuy" (or similar)
6. Add payment instructions for customers
7. Save

#### 2. Configure Extension

In Shopify Admin:
1. Go to Settings → Checkout
2. Scroll to "Checkout extensions"
3. Find "Qhantuy QR Payment Validator"
4. Click "Settings" or "Configure"
5. Fill in:
   ```
   Qhantuy API URL: https://testingcheckout.qhantuy.com/external-api
   Qhantuy API Token: [your token]
   Qhantuy AppKey: [your appkey]
   Payment Gateway Name: Transferencia QR Qhantuy
   Check Interval: 5
   Max Check Duration: 30
   ```
6. Save changes

#### 3. Activate Extension

1. In Checkout settings, ensure extension is enabled
2. Position it appropriately in the thank you page
3. Save checkout configuration

### Phase 5: Testing (30 minutes)

#### 1. Create Test Order

1. Go to your store's frontend
2. Add products to cart
3. Proceed to checkout
4. Select the manual QR payment method
5. Complete checkout

#### 2. Verify Extension Loads

On the thank you page, verify:
- [ ] Extension appears
- [ ] QR code is displayed (if applicable)
- [ ] "Waiting for payment" message shows
- [ ] Transaction ID is visible
- [ ] Polling indicator is active

#### 3. Simulate Payment (Testing Mode)

Using Postman or cURL:

```bash
curl -X POST https://testingcheckout.qhantuy.com/external-api/test-callback \
  -H "Content-Type: application/json" \
  -u "BCP_USERNAME:BCP_PASSWORD" \
  -d '{
    "transactionID": "YOUR_TRANSACTION_ID"
  }'
```

Replace:
- `BCP_USERNAME` and `BCP_PASSWORD` with Qhantuy test credentials
- `YOUR_TRANSACTION_ID` with the ID shown in the extension

#### 4. Verify Payment Confirmation

After simulating payment:
- [ ] Extension shows "Payment Confirmed!" message
- [ ] Order status in admin updates to "Paid"
- [ ] Order timeline shows payment transaction
- [ ] Customer receives confirmation email

### Phase 6: Production Deployment (Varies)

#### Option A: Deploy to Heroku

1. **Create Heroku App**
```bash
heroku login
heroku create qhantuy-payment-validator
```

2. **Set Environment Variables**
```bash
heroku config:set SHOPIFY_API_KEY=your_key
heroku config:set SHOPIFY_API_SECRET=your_secret
heroku config:set SHOPIFY_APP_URL=https://qhantuy-payment-validator.herokuapp.com
heroku config:set QHANTUY_API_TOKEN=your_token
heroku config:set QHANTUY_APPKEY=your_appkey
heroku config:set QHANTUY_API_URL=https://checkout.qhantuy.com/external-api
heroku config:set NODE_ENV=production
```

3. **Deploy**
```bash
git push heroku main
```

4. **Update URLs in Partner Dashboard** with Heroku URL

#### Option B: Deploy to Railway

1. Go to https://railway.app
2. Connect GitHub repository
3. Create new project from repo
4. Set environment variables in Railway dashboard
5. Deploy automatically on push

#### Option C: Deploy to DigitalOcean/AWS/GCP

Follow your preferred cloud provider's Node.js deployment guide.

### Phase 7: Production Configuration

#### 1. Switch to Production Qhantuy API

Update extension settings in each store:
```
Qhantuy API URL: https://checkout.qhantuy.com/external-api
```

#### 2. Configure Production Callback

In Qhantuy merchant portal:
```
Callback URL: https://your-production-url.com/api/qhantuy/callback
```

#### 3. Update Webhooks

In Partner Dashboard → Your App → API access → Webhooks:
```
orders/create: https://your-production-url.com/api/webhooks/orders/create
orders/updated: https://your-production-url.com/api/webhooks/orders/updated
```

### Phase 8: Multi-Store Deployment

#### For Public App Distribution

1. **Complete App Listing**
   - In Partner Dashboard → Your App → App listing
   - Add app name, description, screenshots
   - Set pricing (free or paid)
   - Add support contact information

2. **Submit for Review**
   - Click "Submit app for review"
   - Wait 2-4 weeks for Shopify review
   - Address any feedback from review team

3. **Publish to App Store**
   - Once approved, publish to Shopify App Store
   - Merchants can find and install your app

#### For Private/Unlisted Distribution

1. Generate installation link in Partner Dashboard
2. Share link with specific merchants
3. They install via the link
4. Each store configures their own Qhantuy credentials

### Monitoring and Maintenance

#### Set Up Logging

Add a logging service:
- LogDNA
- Papertrail
- CloudWatch (AWS)
- Stackdriver (GCP)

#### Monitor Key Metrics

Track:
- Number of payment validations
- Success rate
- Average validation time
- Error rates
- API response times

#### Regular Maintenance

- [ ] Monitor error logs weekly
- [ ] Update dependencies monthly
- [ ] Review and respond to merchant feedback
- [ ] Test with new Shopify API versions
- [ ] Coordinate with Qhantuy on API changes

## Troubleshooting Common Issues

### Extension Not Appearing

**Problem:** Extension doesn't show on thank you page

**Solutions:**
1. Verify extension is deployed: `shopify app list`
2. Check it's enabled in Checkout settings
3. Confirm payment method name matches configuration
4. Clear browser cache and test in incognito

### API Connection Failures

**Problem:** Can't connect to Qhantuy API

**Solutions:**
1. Verify API token is correct
2. Check API URL (testing vs production)
3. Test with curl to confirm connectivity
4. Verify firewall/network settings
5. Check Qhantuy service status

### Callback Not Received

**Problem:** Payment successful but order not updating

**Solutions:**
1. Verify callback URL is accessible publicly
2. Check webhook delivery in Shopify admin
3. Review app logs for errors
4. Test callback endpoint with curl
5. Verify Qhantuy has correct callback URL

### Payment Status Not Updating

**Problem:** Extension keeps checking but doesn't show success

**Solutions:**
1. Verify transaction ID is correct
2. Test check-payments endpoint manually
3. Check polling interval isn't too long
4. Review browser console for errors
5. Verify Qhantuy payment was actually completed

## Security Checklist

- [ ] All API tokens stored in environment variables
- [ ] HTTPS enforced for all communications
- [ ] Webhook signatures verified
- [ ] Callback parameters validated
- [ ] No sensitive data logged
- [ ] Rate limiting implemented
- [ ] CORS properly configured
- [ ] Dependencies regularly updated

## Support Resources

- Shopify Developer Docs: https://shopify.dev/docs/apps
- Shopify CLI Reference: https://shopify.dev/docs/api/shopify-cli
- Shopify Community: https://community.shopify.com/
- Qhantuy API Documentation: [Your Qhantuy docs]
- Partner Dashboard: https://partners.shopify.com

## Success Criteria

Your deployment is successful when:
- [x] Extension loads on thank you page
- [x] QR code displays correctly
- [x] Payment polling works automatically
- [x] Payments are verified successfully
- [x] Orders are updated correctly
- [x] Callbacks are received and processed
- [x] No errors in logs
- [x] Merchants can configure easily

---

**Need Help?** Contact the development team or refer to the main README.md for detailed documentation.
