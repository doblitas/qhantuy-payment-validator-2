# Order Status Page Integration

## Overview

The Qhantuy Payment Validator now works on **BOTH** the Thank You page and the Order Status page, providing a seamless payment experience that persists even if the customer leaves and returns later.

---

## What is the Order Status Page?

The **Order Status page** is the page where customers can:
- View their order details
- Track shipping status
- See payment information
- Access order history

Customers can access this page:
1. **From the Thank You page** - By clicking "View order status"
2. **From email** - Order confirmation email contains a link
3. **From their account** - If they have a customer account
4. **Direct link** - Format: `yourstore.com/tools/order_status/{order_id}`

---

## How It Works

### First Visit (Thank You Page)

```
1. Customer completes checkout with QR payment
2. Thank You page loads
3. Extension creates Qhantuy transaction
4. QR code displayed
5. Transaction ID saved in browser storage
6. Extension starts polling every 5 seconds
```

### Customer Leaves Without Paying

```
1. Customer closes browser/tab
2. Browser storage retains transaction ID
3. Customer can return anytime
```

### Customer Returns (Order Status Page)

```
1. Customer clicks link in email
2. Order Status page loads
3. Extension detects manual payment
4. Reads transaction ID from storage
5. Restores QR code
6. Resumes payment verification
7. Shows current payment status
```

### Payment Completed

```
1. Customer pays with bank app
2. Extension detects success
3. Saves "success" status to storage
4. Shows success message
5. Status persists on future visits
```

---

## Key Features

### 🔄 Persistent State
- Transaction ID saved in browser storage
- Payment status remembered
- No need to recreate QR code
- Works across page refreshes

### ⏰ Flexible Payment Time
- Customer doesn't need to pay immediately
- Can complete payment hours/days later
- Extension will verify whenever they return
- QR code remains valid (per Qhantuy settings)

### 📱 Multi-Device Support
- Each device has its own storage
- Customer can view on different devices
- QR code accessible on all devices
- Payment verified regardless of device

### 🔍 Smart Detection
- Automatically detects manual payments
- Only shows for QR payment orders
- Hides for other payment methods
- No configuration needed per order

---

## User Experience Flows

### Scenario 1: Immediate Payment

```
Checkout → Thank You Page → Scan QR → Pay
         ↓
    Success shown in 5-30 seconds
         ↓
    Can return to Order Status anytime
         ↓
    Success message persists
```

### Scenario 2: Delayed Payment

```
Checkout → Thank You Page → See QR → Close page
         ↓
    (Hours/days later)
         ↓
    Open email → Click "View order"
         ↓
    Order Status Page → QR still shown
         ↓
    Scan QR → Pay → Success
```

### Scenario 3: Already Paid (Return Visit)

```
Checkout → Thank You Page → Pay → Success
         ↓
    (Later, customer checks status)
         ↓
    Order Status Page → Shows "Payment Confirmed ✅"
         ↓
    No QR code (already paid)
         ↓
    Shows transaction details
```

---

## Technical Implementation

### Storage Keys Used

```javascript
// Browser localStorage keys
'transaction_id'        // Qhantuy transaction ID
'payment_status'        // 'success', 'checking', 'failed'
'qr_image'             // QR code image URL
'payment_verified_at'  // Timestamp of verification
```

### Extension Targets

```toml
# shopify.extension.toml
[extension.targets]
targets = [
  "purchase.checkout.block.render",              # Thank You page
  "customer-account.order-status.block.render"   # Order Status page
]
```

### State Management

The extension intelligently handles state:

1. **On Load:**
   - Check browser storage first
   - If transaction exists, restore state
   - If success recorded, show confirmation
   - If pending, resume polling

2. **During Verification:**
   - Poll Qhantuy API every 5 seconds
   - Update UI with status
   - Save state changes to storage
   - Continue until success or timeout

3. **On Success:**
   - Save success state permanently
   - Stop polling
   - Show confirmation
   - Notify backend

---

## Configuration

### Extension Settings

All settings work for both pages:

```
Qhantuy API URL: [testing/production]
Qhantuy API Token: [your token]
Qhantuy AppKey: [64-char key]
Payment Gateway Name: [exact match]
Check Interval: 5 seconds
Max Check Duration: 30 minutes
```

### No Additional Setup Required

- Works automatically on both pages
- Same configuration applies
- No per-page settings needed

---

## Benefits

### For Customers

✅ **Flexibility**
- Pay on their own schedule
- No pressure to pay immediately
- Can return anytime

✅ **Convenience**
- Access QR code anytime
- Check payment status easily
- No need to contact support

✅ **Peace of Mind**
- See real-time status
- Confirmation persists
- Order details always available

### For Merchants

✅ **Reduced Support**
- Customers can self-verify
- Less "where's my order" inquiries
- Automatic status updates

✅ **Better Conversion**
- Customers can complete payment later
- Less abandoned orders
- More completed transactions

✅ **Professional Experience**
- Seamless payment flow
- Modern, responsive interface
- Matches Shopify's design

---

## Customer Instructions

### To Pay After Checkout

1. **Find your order confirmation email**
2. **Click "View your order" link**
3. **Scroll to payment section**
4. **You'll see your QR code**
5. **Scan with your bank app**
6. **Complete payment**
7. **Page updates automatically** (or click "Verify Now")

### To Check Payment Status

1. **Open order confirmation email**
2. **Click "View your order" link**
3. **Check payment section**
   - ✅ Green = Paid
   - ⏳ Yellow = Waiting
   - ❌ Red = Issue

---

## Merchant Instructions

### No Special Actions Needed

The extension handles everything automatically:
- Shows on both pages
- Saves customer's state
- Verifies payments
- Updates orders

### What Merchants See

In Shopify Admin:
- Order shows as "Pending" until paid
- Automatically updates to "Paid"
- Order timeline shows payment event
- Customer email sent on confirmation

---

## Technical Details

### Browser Storage

**Used for:**
- Transaction ID persistence
- Payment status caching
- QR image URL storage
- Last check timestamp

**Limitations:**
- Per-browser (not cross-device)
- Can be cleared by user
- No sensitive data stored
- Falls back to API if cleared

**Security:**
- No payment data stored
- Only transaction references
- All verification server-side
- Storage just for UX convenience

### API Calls

**On Thank You Page:**
- Create checkout (if needed)
- Poll status every 5 seconds
- Notify backend on success

**On Order Status Page:**
- Check storage first
- Resume polling if pending
- Show cached status if available
- Re-fetch if storage cleared

---

## Troubleshooting

### QR Code Not Showing on Return

**Possible Causes:**
- Browser storage cleared
- Different browser/device
- Incognito/private mode

**Solution:**
- Extension will detect order has no transaction
- Will attempt to create new one
- Or show "Contact support" message

### Payment Status Not Updating

**Possible Causes:**
- Still verifying (wait up to 30 min)
- Payment not completed in bank
- Network issues

**Solution:**
- Click "Verify Now" button
- Check payment in bank app
- Wait longer if recent payment
- Contact support if timeout

### "Already Paid" But Showing Pending

**Possible Causes:**
- Multiple browser tabs
- Cache not refreshed
- Callback delay

**Solution:**
- Close all tabs
- Refresh page
- Click "Verify Now"
- Contact merchant if persists

---

## Best Practices

### For Optimal Experience

1. **Don't Create Multiple Transactions**
   - Extension prevents this
   - Uses stored transaction ID
   - One QR per order

2. **Allow Time for Verification**
   - Bank processing: 1-5 minutes
   - API polling: Every 5 seconds
   - Max wait: 30 minutes

3. **Keep QR Code Valid**
   - Configure Qhantuy timeout appropriately
   - Recommend at least 24 hours
   - Or use infinite validity

4. **Test Both Pages**
   - Test immediate payment flow
   - Test delayed payment flow
   - Test return visit scenarios

---

## Comparison: Before vs After

### Before (Thank You Page Only)

```
❌ Customer must pay immediately
❌ If they leave, QR is lost
❌ Can't return to pay later
❌ More support inquiries
❌ Lower completion rate
```

### After (Both Pages)

```
✅ Customer can pay anytime
✅ QR code accessible via email
✅ Can return multiple times
✅ Self-service status checks
✅ Higher completion rate
```

---

## Future Enhancements

Potential improvements:
- Email with QR code embedded
- SMS notification option
- WhatsApp integration
- Multi-language support
- Payment reminders
- Analytics dashboard

---

## Summary

The Order Status page integration provides:

🎯 **Flexibility** - Pay now or later
🔄 **Persistence** - State saved across visits
📧 **Accessibility** - Via email link anytime
✅ **Reliability** - Same verification process
🚀 **Better UX** - Professional, seamless experience

This feature significantly improves the customer experience and reduces friction in the payment process.

---

*Last Updated: October 2025*
*Version: 1.1.0 - Order Status Page Support Added*
