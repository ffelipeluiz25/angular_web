var PlaidHandler = (function () {

  var _plaid;

  var init = function (client_name, env, key, products) {
    console.log('Plaid init');
    _plaid = Plaid.create({
      clientName: client_name,
      env: env,
      key: key,
      product: products,
      onSuccess: function (public_token, metadata) {
        window.LoanTermsComponentRef.plaidNotify.emit({ success: true, public_token: public_token, metadata: metadata });
      },
      onExit: function (err, metadata) {
        // The user exited the Link flow.
        if (err != null) {
          // The user encountered a Plaid API error prior to exiting.
          console.log('Plaid error', err);
          window.LoanTermsComponentRef.plaidNotify.emit({ success: true, message: 'Oops, something went wrong' });
        }
        // metadata contains information about the institution
        // that the user selected and the most recent API request IDs.
        // Storing this information can be helpful for support.
      }
    });
  }

  return {
    Init: function (client_name, env, key, products) {
      init(client_name, env, key, products);
    },
    Open: function () {
      _plaid.open();
    }
  }

})(PlaidHandler || {})