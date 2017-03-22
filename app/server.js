exports = module.exports = function(container, store, logger) {
  var oauth2orize = require('oauth2orize');
  
  var server = oauth2orize.createServer({
    store: store
  });
  
  server.grant(require('oauth2orize-response-mode').extensions());
  server.grant(require('oauth2orize-wmrm').extensions());
  server.grant(require('oauth2orize-openid').extensions());
  
  
  var responseDecls = container.specs('http://schema.modulate.io/js/aaa/oauth2/Response')
    , exchangeDecls = container.specs('http://schema.modulate.io/js/aaa/oauth2/exchange')
  
  return Promise.all(responseDecls.map(function(spec) { return container.create(spec.id); } ))
    .then(function(plugins) {
      // Register response type plugins with the OAuth 2.0 server.
      plugins.forEach(function(plugin, i) {
        server.grant(responseDecls[i].a['@type'] || plugin.name, plugin);
        logger.info('Registered OAuth 2.0 response type: ' + (responseDecls[i].a['@type'] || plugin.name));
      });
    })
    .then(function() {
      return Promise.all(exchangeDecls.map(function(spec) { return container.create(spec.id); } ));
    })
    .then(function(plugins) {
      // Register exchange plugins with the OAuth 2.0 server.
      plugins.forEach(function(plugin, i) {
        server.exchange(exchangeDecls[i].a['@type'] || plugin.name, plugin);
        logger.info('Registered OAuth 2.0 exchange type: ' + (exchangeDecls[i].a['@type'] || plugin.name));
      });
    })
    .then(function() {
      return server;
    });
  
  
  // TODO: When implementing refresh_token exchange, need an ack'ing strategy
  //       if we choose to rotate the refresh_token itself, otherwise the client
  //       and server could get out of sync.  (See 1.5 (H) of OAuth 2.0 RFC)
  
  
  
  // TODO: Consider the impact of non-session-based transactions stores on
  //       client serialization.
  //server.serializeClient(serializeClientCb);
  //server.deserializeClient(deserializeClientCb);
  
  return server;
}

exports['@singleton'] = true;
// TODO: Refactor state handling to a plugin system.
exports['@require'] = [ '!container',
                        'http://schema.modulate.io/js/aaa/oauth2/TransactionStore',
                        'http://i.bixbyjs.org/Logger' ];
exports['@implements'] = 'http://schemas.authnomicon.org/js/aaa/oauth2/Server';