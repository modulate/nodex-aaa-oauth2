exports = module.exports = function(Tokens) {
  
  return function issueCode(client, redirectURI, user, ares, areq, locals, cb) {
    var ctx = {};
    ctx.user = user;
    ctx.client = client;
    ctx.permissions = ares.permissions;
    ctx.redirectURI = redirectURI;
    ctx.audience = [ {
      id: 'http://localhost/authorization_code',
      secret: 'some-secret-shared-with-oauth-authorization-server'
    } ];
    
    var opt = {};
    opt.dialect = 'http://schemas.authnomicon.org/tokens/jwt/authorization-code';
    // TODO: Make this confidential
    opt.confidential = false;
    
    Tokens.cipher(ctx, opt, function(err, code) {
      if (err) { return cb(err); }
      return cb(null, code);
    });
    
    
    // TODO: Replace all of this:
    /*
    var bound = {
      client: client,
      redirectURI: redirectURI,
      user: user,
      permissions: ares.permissions
      // TODO
      //service: locals.service,
      //grant: locals.grant,
      //scope: ares.scope
    };
    
    // TODO: Ensure that code has a TTL of 10 minutes
    Code.encode(bound, function(err, code) {
      if (err) { return cb(err); }
      return cb(null, code);
    });
    */
  };
};

exports['@implements'] = 'http://schemas.authnomicon.org/js/aaa/oauth2/issueCodeFunc';
exports['@require'] = [
  'http://i.bixbyjs.org/tokens'
];
