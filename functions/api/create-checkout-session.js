// Cloudflare Pages Function — creates a Stripe Checkout Session.
//
// Lives at /functions/api/create-checkout-session.js, which Cloudflare
// Pages automatically serves at /api/create-checkout-session on your
// live domain — same origin as the rest of the site, so no CORS setup
// needed. Talks to Stripe directly over HTTPS, no npm dependencies.
//
// Required: an environment variable called STRIPE_SECRET_KEY, set in
// Cloudflare Pages -> your project -> Settings -> Environment variables
// (value starts with sk_live_...). Never put the secret key in this
// file, in script.js, or anywhere else in the site's code.

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { items, successUrl, cancelUrl } = await request.json();

    if (!Array.isArray(items) || items.length === 0) {
      return new Response('No items in cart', { status: 400 });
    }

    const params = new URLSearchParams();
    params.append('mode', 'payment');
    params.append('success_url', successUrl);
    params.append('cancel_url', cancelUrl);
    params.append('shipping_address_collection[allowed_countries][0]', 'GB');

    params.append('shipping_options[0][shipping_rate_data][display_name]', 'Standard delivery (3–5 business days)');
    params.append('shipping_options[0][shipping_rate_data][type]', 'fixed_amount');
    params.append('shipping_options[0][shipping_rate_data][fixed_amount][amount]', '200');
    params.append('shipping_options[0][shipping_rate_data][fixed_amount][currency]', 'gbp');

    params.append('shipping_options[1][shipping_rate_data][display_name]', 'Next day delivery (UK only)');
    params.append('shipping_options[1][shipping_rate_data][type]', 'fixed_amount');
    params.append('shipping_options[1][shipping_rate_data][fixed_amount][amount]', '400');
    params.append('shipping_options[1][shipping_rate_data][fixed_amount][currency]', 'gbp');

    items.forEach((item, i) => {
      params.append(`line_items[${i}][price_data][currency]`, 'gbp');
      params.append(`line_items[${i}][price_data][product_data][name]`, item.name);
      if (item.image) {
        params.append(`line_items[${i}][price_data][product_data][images][0]`, item.image);
      }
      params.append(`line_items[${i}][price_data][unit_amount]`, String(Math.round(item.price * 100)));
      params.append(`line_items[${i}][quantity]`, String(item.qty));
    });

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const session = await stripeRes.json();

    if (!stripeRes.ok) {
      console.error(session);
      return new Response(JSON.stringify({ error: session.error?.message || 'Stripe error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
