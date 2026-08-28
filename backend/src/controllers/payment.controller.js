const db = require('../config/db');
const crypto = require('crypto');

// Create payment intent
const createPaymentIntent = async (req, res) => {
  const { items, totalAmount, shippingName, shippingEmail, shippingAddress, shippingCity, shippingPostalCode, shippingPhone, paymentMethod, couponCode, walletNumber } = req.body;

  if (!items || items.length === 0 || !totalAmount) {
    return res.status(400).json({ message: 'Missing order details' });
  }

  const useLivePaymob = !!process.env.PAYMOB_API_KEY;

  try {
    let paymentIntentId;
    let redirectUrl;

    if (useLivePaymob) {
      console.log('Initiating Live Paymob transaction for PKR amount:', totalAmount);
      // 1. Authenticate with Paymob Pakistan
      const authResponse = await fetch('https://pakistan.paymob.com/api/auth/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: process.env.PAYMOB_API_KEY })
      });
      if (!authResponse.ok) {
        throw new Error(`Paymob authentication failed: ${authResponse.status} ${authResponse.statusText}`);
      }
      const authData = await authResponse.json();
      const authToken = authData.token;

      // 2. Register order on Paymob (Convert amount to cents for PKR)
      const amountCents = Math.round(parseFloat(totalAmount) * 100);
      const orderResponse = await fetch('https://pakistan.paymob.com/api/ecommerce/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auth_token: authToken,
          delivery_needed: 'false',
          amount_cents: amountCents.toString(),
          currency: 'PKR',
          items: []
        })
      });
      if (!orderResponse.ok) {
        throw new Error(`Paymob order registration failed: ${orderResponse.status} ${orderResponse.statusText}`);
      }
      const orderData = await orderResponse.json();
      const paymobOrderId = orderData.id;

      // Store the Paymob Order ID as the unique payment intent ID
      paymentIntentId = String(paymobOrderId);

      // 3. Select Integration ID based on wallet payment method
      let integrationId;
      if (paymentMethod === 'easypaisa') {
        integrationId = process.env.PAYMOB_INTEGRATION_ID_EASYPAISA;
      } else if (paymentMethod === 'jazzcash') {
        integrationId = process.env.PAYMOB_INTEGRATION_ID_JAZZCASH;
      }

      if (!integrationId) {
        throw new Error(`Integration ID not found for payment method: ${paymentMethod}`);
      }

      // Split shipping name into first and last name for Paymob billing data requirements
      const firstName = shippingName ? shippingName.split(' ')[0] : 'Guest';
      const lastName = shippingName && shippingName.split(' ').length > 1 ? shippingName.split(' ').slice(1).join(' ') : 'Guest';

      // 4. Generate payment key token
      const keyResponse = await fetch('https://pakistan.paymob.com/api/ecommerce/payment-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auth_token: authToken,
          amount_cents: amountCents.toString(),
          expiration: 3600,
          order_id: paymobOrderId.toString(),
          billing_data: {
            apartment: 'NA',
            email: shippingEmail || 'no-email@tcube.com',
            floor: 'NA',
            first_name: firstName,
            street: shippingAddress || 'NA',
            building: 'NA',
            phone_number: walletNumber || shippingPhone || '+923000000000',
            shipping_method: 'PKG',
            postal_code: shippingPostalCode || 'NA',
            city: shippingCity || 'Lahore',
            country: 'PK',
            last_name: lastName,
            state: 'Punjab'
          },
          currency: 'PKR',
          integration_id: parseInt(integrationId)
        })
      });
      if (!keyResponse.ok) {
        throw new Error(`Paymob payment key generation failed: ${keyResponse.status} ${keyResponse.statusText}`);
      }
      const keyData = await keyResponse.json();
      const paymentKeyToken = keyData.token;

      // 5. Execute direct wallet pay request
      const payResponse = await fetch('https://pakistan.paymob.com/api/acceptance/payments/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: {
            identifier: walletNumber,
            subtype: 'WALLET'
          },
          payment_token: paymentKeyToken
        })
      });

      if (!payResponse.ok) {
        throw new Error(`Paymob acceptance wallet charge failed: ${payResponse.status} ${payResponse.statusText}`);
      }
      const payData = await payResponse.json();
      
      // Extract redirection URL if returned
      redirectUrl = payData.redirection_url || payData.iframe_redirection_url || (payData.data && (payData.data.redirection_url || payData.data.iframe_redirection_url));
      
      if (!redirectUrl) {
        // Fallback redirection to dashboard order confirmation if USSD push is purely synchronous/waiting
        redirectUrl = `/checkout?success=true&order_id=${paymobOrderId}`;
      }
    } else {
      // Local simulator mode
      paymentIntentId = 'pi_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    // Pre-create the order in "pending" status
    const [orderResult] = await db.query(
      `INSERT INTO orders (user_id, total_amount, shipping_name, shipping_email, shipping_address, shipping_city, shipping_postal_code, shipping_phone, payment_method, payment_status, order_status, coupon_code, payment_intent_id, payment_gateway)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', ?, ?, ?)`,
      [
        req.user.id,
        parseFloat(totalAmount),
        shippingName,
        shippingEmail,
        shippingAddress,
        shippingCity,
        shippingPostalCode,
        shippingPhone,
        paymentMethod,
        couponCode || null,
        paymentIntentId,
        useLivePaymob ? 'paymob_live' : paymentMethod
      ]
    );

    const orderId = orderResult.insertId;

    // Create order items
    for (const item of items) {
      await db.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price, size, color)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.productId, item.quantity, parseFloat(item.price), item.size || null, item.color || null]
      );
    }

    // If local simulator mode, generate the simulator redirection route
    if (!useLivePaymob) {
      redirectUrl = `/checkout/pay?gateway=paymob&intent_id=${paymentIntentId}&order_id=${orderId}&amount=${totalAmount}&wallet=${walletNumber}`;
    }

    res.status(201).json({
      success: true,
      paymentIntentId,
      redirectUrl
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ message: error.message || 'Failed to initiate gateway payment' });
  }
};

// Webhook for gateway payment status notifications
const handlePaymentWebhook = async (req, res) => {
  const useLivePaymob = !!process.env.PAYMOB_API_KEY;

  if (useLivePaymob) {
    // 1. Extract signature from URL query parameter
    const hmacReceived = req.query.hmac;
    if (!hmacReceived) {
      console.warn('Paymob live webhook missing HMAC query parameter');
      return res.status(400).json({ message: 'Missing signature' });
    }

    const obj = req.body.obj;
    if (!obj) {
      console.warn('Paymob live webhook missing body transaction object');
      return res.status(400).json({ message: 'Missing transaction details' });
    }

    // 2. Re-calculate HMAC using sorted alphabetical keys of obj
    const hmacFields = [
      'amount_cents',
      'created_at',
      'currency',
      'error_occured',
      'has_parent_transaction',
      'id',
      'integration_id',
      'is_3d_secure',
      'is_auth',
      'is_capture',
      'is_refunded',
      'is_standalone_payment',
      'pending',
      'success'
    ];

    let concatString = '';
    for (const field of hmacFields) {
      const val = obj[field];
      if (typeof val === 'boolean') {
        concatString += val ? 'true' : 'false';
      } else if (val !== undefined && val !== null) {
        concatString += val.toString();
      } else {
        concatString += '';
      }
    }

    const calculatedHmac = crypto
      .createHmac('sha512', process.env.PAYMOB_HMAC_SECRET)
      .update(concatString)
      .digest('hex');

    if (calculatedHmac !== hmacReceived) {
      console.warn('Paymob Live Webhook HMAC verification failed');
      return res.status(401).json({ message: 'Invalid Paymob signature payload verification failed' });
    }

    // 3. Process order status update based on transaction success
    const paymobOrderId = typeof obj.order === 'object' ? obj.order.id : obj.order;
    const paymentIntentId = String(paymobOrderId);
    const isSuccess = obj.success === true || obj.success === 'true';

    try {
      const [orders] = await db.query('SELECT * FROM orders WHERE payment_intent_id = ?', [paymentIntentId]);
      if (orders.length === 0) {
        console.warn('Order reference not found for Paymob Order ID:', paymentIntentId);
        return res.status(404).json({ message: 'Order reference not found' });
      }

      const order = orders[0];

      if (isSuccess) {
        // Update payment status to paid
        await db.query(
          "UPDATE orders SET payment_status = 'paid', order_status = 'pending', gateway_response = ? WHERE id = ?",
          [JSON.stringify(obj), order.id]
        );

        // Decrement stock for order items
        const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
        for (const item of items) {
          await db.query('UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?', [item.quantity, item.product_id]);
        }

        console.log(`Order ${order.id} payment verified and updated via live Paymob callback.`);
        res.status(200).json({ success: true, message: 'Payment approved, order finalized successfully.' });
      } else {
        // Payment failed
        await db.query(
          "UPDATE orders SET payment_status = 'failed', gateway_response = ? WHERE id = ?",
          [JSON.stringify(obj), order.id]
        );
        console.log(`Order ${order.id} payment failed logged via live Paymob callback.`);
        res.status(200).json({ success: true, message: 'Payment failed logged.' });
      }
    } catch (error) {
      console.error('Live webhook processing error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  } else {
    // Simulator Mode webhook processing
    const { payment_intent_id, status, gateway_response, signature } = req.body;

    if (!payment_intent_id || !status) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    if (signature !== 'tcube_secure_webhook_hash_secret_key') {
      return res.status(401).json({ message: 'Invalid signature payload verification failed' });
    }

    try {
      const [orders] = await db.query('SELECT * FROM orders WHERE payment_intent_id = ?', [payment_intent_id]);
      if (orders.length === 0) {
        return res.status(404).json({ message: 'Order reference not found' });
      }

      const order = orders[0];

      if (status === 'success') {
        // Update payment status to paid
        await db.query(
          "UPDATE orders SET payment_status = 'paid', order_status = 'pending', gateway_response = ? WHERE id = ?",
          [JSON.stringify(gateway_response || {}), order.id]
        );

        // Decrement stock for order items
        const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
        for (const item of items) {
          await db.query('UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?', [item.quantity, item.product_id]);
        }

        res.status(200).json({ success: true, message: 'Payment approved, order finalized successfully.' });
      } else {
        // Payment failed
        await db.query(
          "UPDATE orders SET payment_status = 'failed', gateway_response = ? WHERE id = ?",
          [JSON.stringify(gateway_response || {}), order.id]
        );
        res.status(200).json({ success: true, message: 'Payment failed logged.' });
      }
    } catch (error) {
      console.error('Payment webhook processing error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

module.exports = {
  createPaymentIntent,
  handlePaymentWebhook
};

