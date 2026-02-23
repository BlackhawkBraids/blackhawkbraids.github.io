/* BlackhawkBraids - Ecommerce foundation (Stripe/back-end hooks only) */
(function (window) {
  'use strict';

  const listeners = new Set();
  const state = {
    cart: []
  };

  const config = {
    apiBaseUrl: '/api',
    stripePublishableKey: '',
    checkoutSessionPath: '/checkout/create-session'
  };

  function emitCartUpdate() {
    const snapshot = state.cart.slice();
    listeners.forEach(function (listener) {
      listener(snapshot);
    });
  }

  function findCartItem(productId) {
    return state.cart.find(function (item) {
      return item.productId === productId;
    });
  }

  function addToCart(item) {
    const existing = findCartItem(item.productId);
    if (existing) {
      existing.quantity += 1;
    } else {
      state.cart.push({
        productId: item.productId,
        name: item.name,
        price: Number(item.price) || 0,
        quantity: 1
      });
    }

    emitCartUpdate();
    return state.cart.slice();
  }

  function removeFromCart(productId) {
    state.cart = state.cart.filter(function (item) {
      return item.productId !== productId;
    });

    emitCartUpdate();
    return state.cart.slice();
  }

  function clearCart() {
    state.cart = [];
    emitCartUpdate();
  }

  function getCartItems() {
    return state.cart.slice();
  }

  function getCartCount() {
    return state.cart.reduce(function (count, item) {
      return count + item.quantity;
    }, 0);
  }

  function subscribeToCart(listener) {
    listeners.add(listener);
    return function unsubscribe() {
      listeners.delete(listener);
    };
  }

  function configureEcommerce(nextConfig) {
    Object.assign(config, nextConfig || {});
  }

  async function createStripeCheckoutSession() {
    throw new Error(
      'Stripe checkout is not enabled yet. Configure the Stripe key and backend session endpoint first.'
    );
  }

  window.BlackhawkEcommerce = {
    config: {
      get: function () {
        return Object.assign({}, config);
      },
      set: configureEcommerce
    },
    cart: {
      add: addToCart,
      remove: removeFromCart,
      clear: clearCart,
      getItems: getCartItems,
      getCount: getCartCount,
      subscribe: subscribeToCart
    },
    checkout: {
      createStripeCheckoutSession: createStripeCheckoutSession
    }
  };
}(window));
