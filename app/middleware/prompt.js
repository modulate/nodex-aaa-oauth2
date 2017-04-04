exports = module.exports = function(flows) {
  var oauth2orize = require('oauth2orize');
  
  
  return function prompt(req, res, next) {
    var areq = req.oauth2.req
      , prompt = req.oauth2.info.prompt
      , error = 'interaction_required'
      , options;
      
    if (areq.prompt && areq.prompt.indexOf('none') !== -1) {
      switch (prompt) {
      case 'login':
        error = 'login_required';
        break;
      case 'consent':
        error = 'consent_required';
        break;
        // TODO: Account selection
      }
      
      return next(new oauth2orize.AuthorizationError('Interaction with user is required to proceed', error, null, 403));
    }
    
    options = req.oauth2.info;
    delete options.prompt;
    options.state = req.oauth2.transactionID;
  
    switch (prompt) {
    case 'consent':
      options.clientID = req.oauth2.client.id;
      // TODO: Add audience
      break;
    }
  
    flows.goto(prompt, options, req, res, next);
  };
};

exports['@require'] = [
  'http://i.bixbyjs.org/http/state/Dispatcher'
];
