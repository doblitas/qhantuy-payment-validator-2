# 🚀 Quick Start Guide
## Get Your Qhantuy Payment Validator Running in 30 Minutes

This guide gets you from zero to working app as fast as possible.

---

## ⚡ Prerequisites (5 minutes)

Install these if you don't have them:

```bash
# Check Node.js version (need 18+)
node --version

# If not installed, download from nodejs.org

# OPTION 1: Install Shopify CLI globally (requires admin password)
sudo npm install -g @shopify/cli @shopify/app

# Verify installation
shopify version

# OR OPTION 2: Use npx (no global install needed)
# Just run: npx shopify version
```

**Also need:**
- Shopify Partner account ([partners.shopify.com](https://partners.shopify.com))
- Development store (create in Partner Dashboard)
- Qhantuy merchant account with API credentials

---

## 📦 Step 1: Get the Code (2 minutes)

```bash
# You already have the code!
cd qhantuy-payment-validator

# Install dependencies
npm install
```

---

## 🔑 Step 2: Create Shopify App (5 minutes)

1. Go to [Shopify Partner Dashboard](https://partners.shopify.com)
2. Click **Apps** → **Create app**
3. Choose **Public distribution** (or Custom for single store)
4. Enter app name: `Qhantuy Payment Validator`
5. **Copy** your API Key and API Secret

---

## ⚙️ Step 3: Configure Environment (3 minutes)

```bash
# Create environment file
cp .env.example .env

# Edit .env
nano .env
```

Fill in these values:

```env
SHOPIFY_API_KEY=paste_your_api_key_here
SHOPIFY_API_SECRET=paste_your_api_secret_here
SHOPIFY_APP_URL=https://your-url-here.ngrok.io

QHANTUY_API_TOKEN=your_qhantuy_token
QHANTUY_APPKEY=your_64_character_appkey
QHANTUY_API_URL=https://testingcheckout.qhantuy.com/external-api

PORT=3000
NODE_ENV=development
```

**Update `shopify.app.toml`:**

```toml
client_id = "YOUR_SHOPIFY_API_KEY"
dev_store_url = "your-dev-store.myshopify.com"
```

---

## 🌐 Step 4: Set Up Tunnel (2 minutes)

Open a **new terminal** and run:

```bash
# Install ngrok if needed
# Download from https://ngrok.com

# Start tunnel
ngrok http 3000
```

**Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

Update `.env` with this URL:
```env
SHOPIFY_APP_URL=https://abc123.ngrok.io
```

---

## 🚢 Step 5: Deploy Extension (5 minutes)

In your **main terminal**:

```bash
# Login to Shopify
# Use one of these:
npx shopify auth login        # If you didn't install globally
# OR
shopify auth login             # If you installed globally with sudo

# Deploy the extension
npm run deploy
```

Follow the prompts:
- Select your app
- Confirm deployment
- Wait for success message

---

## 📲 Step 6: Install App (3 minutes)

1. Go to Partner Dashboard → Your App
2. Click **"Test on development store"**
3. Select your development store
4. Click **"Install app"**
5. Approve permissions

---

## 🏃 Step 7: Start Development Server (1 minute)

In your main terminal (not the ngrok one):

```bash
npm run dev
```

You should see:
```
✓ App running on https://abc123.ngrok.io
✓ Extension deployed
```

---

## 🛍️ Step 8: Configure Store (5 minutes)

### A. Create Manual Payment Method

1. Shopify Admin → **Settings** → **Payments**
2. Scroll to **"Manual payment methods"**
3. Click **"Add manual payment method"**
4. Choose **"Other"**
5. Name it: `Pago QR Qhantuy`
6. Click **"Activate"**

### B. Configure Extension

1. Shopify Admin → **Settings** → **Checkout**
2. Find **"Qhantuy QR Payment Validator"**
3. Click **"Settings"** (gear icon)
4. Fill in:
   ```
   Qhantuy API URL: https://testingcheckout.qhantuy.com/external-api
   Qhantuy API Token: [your token]
   Qhantuy AppKey: [your appkey]
   Payment Gateway Name: Pago QR Qhantuy
   Check Interval: 5
   Max Check Duration: 30
   ```
5. Click **"Save"**

---

## 🧪 Step 9: Test It! (10 minutes)

### Create Test Order

1. Open your store in **incognito mode**
2. Add a product to cart
3. Go to checkout
4. Fill in test info (use your email)
5. Select **"Pago QR Qhantuy"** payment
6. Click **"Complete order"**

### What You Should See

On the thank you page:
✅ Extension appears
✅ "Waiting for payment" message
✅ QR code displayed
✅ Transaction ID shown
✅ "Checking payment..." indicator

### Simulate Payment (Testing Mode)

Use the test callback:

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
- `YOUR_TRANSACTION_ID` with the ID from the extension

### Verify Success

Within 5-30 seconds:
✅ Extension shows "Payment Confirmed!"
✅ Order status → "Paid"
✅ Email sent to customer

---

## 🎉 Done!

Your app is working! 

---

## 🐛 Troubleshooting

### Extension not showing?

```bash
# Check if deployed
npx shopify app list       # If using npx
# OR
shopify app list           # If installed globally

# Redeploy if needed
npm run deploy
```

### QR code not appearing?

- Verify Qhantuy credentials in extension settings
- Check browser console (F12) for errors
- Ensure you're using testing API URL

### Can't connect to ngrok?

- Make sure ngrok is running
- Update .env with correct ngrok URL
- Restart dev server: `npm run dev`

### App won't install?

- Check API key in shopify.app.toml
- Verify redirect URLs in Partner Dashboard
- Try: `npx shopify auth logout` then `npx shopify auth login`
- Or if installed globally: `shopify auth logout` then `shopify auth login`

---

## 📚 Next Steps

**For Production:**
1. Read `DEPLOYMENT.md` for full deployment guide
2. Deploy to Heroku/Railway/etc.
3. Switch to production Qhantuy API
4. Test with real payment

**For Distribution:**
1. Complete app listing in Partner Dashboard
2. Add screenshots and description
3. Submit for Shopify review
4. Publish to App Store

---

## 💡 Pro Tips

**Development:**
- Keep ngrok terminal open while developing
- Use `npm run dev` to auto-reload changes
- Check logs in terminal for errors

**Testing:**
- Always use incognito mode for test orders
- Clear browser storage between tests
- Keep Qhantuy test credentials handy

**Deployment:**
- Never commit .env file
- Use environment variables in production
- Set up monitoring/logging

---

## 🆘 Need Help?

**Check These First:**
1. README.md - Full technical docs
2. DEPLOYMENT.md - Detailed deployment guide  
3. MERCHANT_GUIDE.md - For store owner questions

**Still Stuck?**
- Check Shopify CLI logs
- Review browser console errors
- Verify all credentials are correct
- Contact support with order number

---

## ✅ Checklist

Mark these off as you complete them:

- [ ] Node.js 18+ installed
- [ ] Shopify CLI installed
- [ ] Partner account created
- [ ] Development store set up
- [ ] App created in Partner Dashboard
- [ ] Qhantuy credentials obtained
- [ ] Code downloaded and dependencies installed
- [ ] .env file configured
- [ ] shopify.app.toml updated
- [ ] ngrok running
- [ ] Extension deployed
- [ ] App installed in store
- [ ] Manual payment method created
- [ ] Extension configured
- [ ] Dev server running
- [ ] Test order created
- [ ] Extension appeared on thank you page
- [ ] Test payment simulated
- [ ] Order marked as paid

**All checked? You're ready to go! 🚀**

---

*Estimated total time: 30-45 minutes*
*Difficulty: Intermediate*
*Prerequisites: Basic command line knowledge*
