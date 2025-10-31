# Merchant Configuration Guide
## Qhantuy Payment Validator for Shopify

### Welcome!

This guide will help you set up and configure the Qhantuy Payment Validator app in your Shopify store. This app automatically validates QR payments from Qhantuy directly on your thank you page, providing a seamless experience for your customers.

---

## What You'll Need

Before starting, make sure you have:

1. **Qhantuy Merchant Account** with:
   - API Token (X-API-Token)
   - AppKey (64-character unique identifier)
   - Access to your Qhantuy merchant portal

2. **Shopify Store** with:
   - Admin access
   - Manual payment method enabled

---

## Step 1: Install the App

### Installation

1. Go to the Shopify App Store or use the installation link provided
2. Click "Add app"
3. Review the permissions requested:
   - **Read orders**: To access order information
   - **Write orders**: To update payment status
   - **Read checkouts**: To display information on checkout pages
4. Click "Install app"

✅ **Checkpoint:** The app should now appear in your Shopify admin under Apps.

---

## Step 2: Set Up Manual Payment Method

If you haven't already, you need to create a manual payment method for QR payments.

### Create Manual Payment Method

1. In Shopify Admin, go to **Settings** → **Payments**
2. Scroll down to **Manual payment methods**
3. Click **"Add manual payment method"**
4. Choose one of these options:
   - **Bank deposit**
   - **Money order**
   - **Other** (recommended)

### Configure Payment Method

1. **Payment method name:** Enter a clear name like:
   - "Pago con QR"
   - "Transferencia QR Qhantuy"
   - "QR Simple"
   - "Pago QR Banco"

2. **Additional details:** Add instructions for your customers:
   ```
   Completa tu pago escaneando el código QR que aparecerá en la página de confirmación.
   Puedes pagar con cualquier banco que soporte QR Simple.
   ```

3. **Payment instructions:** Optional - add any specific instructions

4. Click **"Activate"**

✅ **Checkpoint:** The payment method should now appear during checkout.

---

## Step 3: Configure the Extension

### Access Extension Settings

1. In Shopify Admin, go to **Settings** → **Checkout**
2. Scroll down to **Checkout extensions** or **Order status page**
3. Find **"Qhantuy QR Payment Validator"** in the list
4. Click the **Settings icon** (⚙️) or **"Edit"**

### Required Settings

#### 1. Qhantuy API URL

**Testing (for development/testing):**
```
https://testingcheckout.qhantuy.com/external-api
```

**Production (for live store):**
```
https://checkout.qhantuy.com/external-api
```

**Which one should I use?**
- Use **Testing** URL while you're setting up and testing
- Switch to **Production** URL when you're ready to accept real payments
- Never use Production URL in a test store

#### 2. Qhantuy API Token

This is your **X-API-Token** provided by Qhantuy.

**Where to find it:**
- Check your Qhantuy merchant welcome email
- Log in to your Qhantuy merchant portal
- Contact Qhantuy support if you can't find it

**Format:** 
Usually a long alphanumeric string like:
```
abc123def456ghi789jkl012mno345pqr678
```

**Enter it exactly as provided** - no spaces, no quotes.

#### 3. Qhantuy AppKey

This is your unique 64-character merchant identifier.

**Where to find it:**
- In your Qhantuy merchant portal under "Devices" or "Comercios"
- In your Qhantuy integration documentation
- Request it from Qhantuy support if needed

**Format:**
Exactly 64 characters, like:
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

#### 4. Payment Gateway Name

Enter the **exact name** of the manual payment method you created in Step 2.

**Examples:**
- If you named it "Pago con QR" → enter: `Pago con QR`
- If you named it "Transferencia QR Qhantuy" → enter: `Transferencia QR Qhantuy`
- If you named it "QR Simple" → enter: `QR Simple`

⚠️ **Important:** This must match exactly, including capitalization!

**How it works:**
The app uses this to detect when a customer chooses QR payment. If it doesn't match, the extension won't activate.

#### 5. Check Interval (seconds)

How often the app checks if payment has been received.

**Recommended:** `5` (checks every 5 seconds)

**Options:**
- `3` - Very frequent checking (more API calls)
- `5` - **Recommended** - Good balance
- `10` - Less frequent (slower detection)
- `15` - Minimal checking (may miss quick payments)

**Consideration:** Lower numbers mean faster detection but more API usage.

#### 6. Max Check Duration (minutes)

How long the app will keep checking for payment.

**Recommended:** `30` (checks for 30 minutes)

**Options:**
- `15` - Short window (for quick payments)
- `30` - **Recommended** - Standard window
- `60` - Extended window (for delayed payments)
- `120` - Very long window (rarely needed)

**Consideration:** Most QR payments complete within 5-10 minutes.

### Save Settings

After filling in all fields, click **"Save"** at the top or bottom of the page.

✅ **Checkpoint:** Your settings should be saved successfully.

---

## Step 4: Configure Qhantuy Callback

The app needs to receive notifications from Qhantuy when payments are completed.

### Set Up Callback URL

1. Log in to your **Qhantuy Merchant Portal**
2. Navigate to **Settings** or **API Configuration**
3. Find **Callback URL** or **Webhook URL** field
4. Enter your callback URL:

**Format:**
```
https://qhantuy-payment-validator.herokuapp.com/api/qhantuy/callback
```

**Replace with your actual app URL:**
- If using our hosted version: Use the URL provided by us
- If self-hosted: Use your app's domain

4. Save the settings in Qhantuy portal

### Verify Callback Settings

Contact Qhantuy support to verify:
- Your callback URL is registered correctly
- Your merchant account is authorized to send callbacks
- The callback format is set to "GET" (not POST)

✅ **Checkpoint:** Qhantuy should now send payment notifications to your app.

---

## Step 5: Test Your Setup

### Create a Test Order

1. Open your store in an incognito/private browser window
2. Add a product to cart
3. Go to checkout
4. Fill in customer information (use a test email you control)
5. Select your QR payment method
6. Complete the checkout

### Verify Extension Loads

After clicking "Complete order", you should see:

✅ **Expected behavior:**
- Thank you page loads
- Extension appears below order summary
- "Waiting for payment confirmation" message
- QR code image displayed (or URL to QR)
- Transaction ID shown
- "Checking payment..." indicator

❌ **If extension doesn't appear:**
- Check that the payment method name matches exactly
- Verify extension is enabled in Checkout settings
- Clear your browser cache and try again
- Contact support if issue persists

### Test Payment (in Testing Mode)

If using the testing API:

**Option 1: Use Qhantuy Test Callback**
1. Note the Transaction ID from the thank you page
2. Use the test callback endpoint provided by Qhantuy
3. Or contact Qhantuy to manually mark the payment as paid

**Option 2: Real Bank App**
1. If in testing mode with real QR, scan with your bank app
2. Complete the payment
3. Extension should update automatically

### Verify Payment Confirmation

Within 5-30 seconds after payment:

✅ **Expected behavior:**
- Extension updates automatically
- "Payment Confirmed!" message appears
- Green success banner shown
- Order status in admin changes to "Paid"
- Customer receives order confirmation email

---

## Step 6: Go Live

### Switch to Production

When you're ready for real payments:

1. Go back to **Settings** → **Checkout** → **Qhantuy QR Payment Validator**
2. Update **Qhantuy API URL** to:
   ```
   https://checkout.qhantuy.com/external-api
   ```
3. Verify your **API Token** and **AppKey** are for production
4. Save settings

### Make Store Live

1. Remove password protection from your store
2. Complete any remaining store setup
3. Test one final time with a real order
4. Start accepting orders!

---

## Troubleshooting

### Extension Not Appearing

**Problem:** Extension doesn't show on thank you page

**Solutions:**
1. **Check payment method name:**
   - Go to Orders → view the test order
   - Look at the payment method shown
   - Copy that exact name to extension settings

2. **Verify extension is enabled:**
   - Settings → Checkout
   - Check if extension toggle is ON

3. **Clear cache:**
   - Use incognito/private browsing
   - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### QR Code Not Showing

**Problem:** Extension appears but no QR code

**Solutions:**
1. Check API credentials are correct
2. Verify you're using the right API URL (testing vs production)
3. Contact Qhantuy to verify your account is active
4. Check browser console for errors (F12)

### Payment Not Detected

**Problem:** Paid but extension still says "waiting"

**Solutions:**
1. Click "Verify Now" button to force a check
2. Verify callback URL is set correctly in Qhantuy portal
3. Check that payment was actually completed in Qhantuy
4. Contact support with your order number

### Order Not Marked as Paid

**Problem:** Payment confirmed in extension but order still pending

**Solutions:**
1. Check app permissions include "write_orders"
2. Verify webhook endpoints are working
3. Check app logs (contact support)
4. Manually verify payment in Qhantuy portal

---

## Best Practices

### For Smooth Operations

1. **Test Regularly:**
   - Do a test order monthly
   - Verify all components work
   - Keep testing credentials handy

2. **Monitor Orders:**
   - Check daily for any stuck payments
   - Follow up on orders that don't auto-confirm
   - Keep Qhantuy contact info accessible

3. **Customer Communication:**
   - Add instructions to order confirmation emails
   - Train support staff on the QR payment process
   - Have a backup payment method available

4. **Keep Credentials Secure:**
   - Never share API tokens publicly
   - Change tokens if compromised
   - Use different tokens for testing and production

### Optimization Tips

1. **Check Interval:**
   - Start with 5 seconds
   - Adjust based on your average payment time
   - Monitor API usage

2. **Max Duration:**
   - 30 minutes works for most stores
   - Extend if you see many timeout issues
   - Reduce if all payments are quick

3. **Payment Method Name:**
   - Keep it simple and clear
   - Avoid special characters
   - Make it customer-friendly

---

## Support

### Getting Help

**For app issues:**
- Email: support@tupropiapp.com (or your support contact)
- Include your store URL and order number

**For Qhantuy issues:**
- Contact Qhantuy support directly
- Have your merchant ID ready

**For Shopify issues:**
- Shopify Support: help.shopify.com
- Community: community.shopify.com

### What to Include When Requesting Support

1. **Store URL**: yourstore.myshopify.com
2. **Order number**: #1234
3. **Transaction ID**: (from extension)
4. **What happened**: Detailed description
5. **Screenshots**: If applicable
6. **When it happened**: Date and time

---

## Frequently Asked Questions

**Q: Do customers need to install anything?**
A: No, customers just need their bank's mobile app that supports QR payments.

**Q: Which banks are supported?**
A: Any bank that supports QR Simple payments in Bolivia. Contact Qhantuy for a complete list.

**Q: How long does payment verification take?**
A: Usually 5-30 seconds after payment, automatically.

**Q: What happens if payment times out?**
A: Customer can click "Retry" or contact support. The order remains pending.

**Q: Can I use this for international orders?**
A: This is designed for local Bolivian QR payments. International customers should use other payment methods.

**Q: Is there a transaction fee?**
A: Check with Qhantuy for their fee structure. The app itself has no additional fees.

**Q: Can I customize the appearance?**
A: The extension uses Shopify's standard checkout styling. Limited customization is available through Shopify's checkout settings.

**Q: What if a customer pays twice?**
A: Contact Qhantuy to process a refund. The app prevents duplicate confirmations, but human error may occur.

---

## Checklist

Use this to verify your setup is complete:

- [ ] App installed in Shopify store
- [ ] Manual QR payment method created and activated
- [ ] Extension configured with all required settings
- [ ] Qhantuy API URL set (testing or production)
- [ ] API Token entered correctly
- [ ] AppKey entered correctly
- [ ] Payment gateway name matches exactly
- [ ] Check interval and max duration set
- [ ] Callback URL configured in Qhantuy portal
- [ ] Test order completed successfully
- [ ] Extension appeared on thank you page
- [ ] Test payment confirmed
- [ ] Order marked as paid
- [ ] Ready to accept real orders

---

**Congratulations!** Your store is now set up to accept QR payments with automatic verification. 🎉

If you have any questions, don't hesitate to reach out to support.
