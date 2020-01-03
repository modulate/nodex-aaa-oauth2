/* global describe, it */

var chai = require('chai');
var expect = require('chai').expect;
var sinon = require('sinon');
var factory = require('../../../../../app/authorize/http/handlers/authorize/process');


describe('authorize/http/handlers/authorize/process', function() {
  
  it('should export factory function', function() {
    expect(factory).to.be.a('function');
  });
  
  it('should be annotated', function() {
    expect(factory['@implements']).to.be.undefined;
    expect(factory['@singleton']).to.be.undefined;
  });
  
  describe('handler', function() {
    
    var server = {
      _respond: function(txn, res, cb) {
        res.end();
      }
    };
    
    describe('permitting access', function() {
      var request, response
        , azrequest;
      
      before(function() {
        sinon.spy(server, '_respond');
      });
      
      after(function() {
        server._respond.restore();
      });
      
      before(function(done) {
        function authorizationHandler(req, res) {
          azrequest = req;
          res.permit();
        }
        
        var handler = factory(authorizationHandler, server);
        
        chai.express.handler(handler)
          .req(function(req) {
            request = req;
            req.state = {};
            req.state.complete = sinon.spy();
            req.oauth2 = {};
            req.oauth2.user = {
              id: '248289761001',
              displayName: 'Jane Doe'
            };
            req.oauth2.client = {
              id: 's6BhdRkqt3'
            };
          })
          .res(function(res) {
            response = res;
          })
          .end(function() {
            done();
          })
          .dispatch();
      });
      
      it('should initialize authorization request', function() {
        expect(azrequest.client).to.deep.equal({
          id: 's6BhdRkqt3'
        });
        expect(azrequest.user).to.deep.equal({
          id: '248289761001',
          displayName: 'Jane Doe'
        });
      });
      
      it('should complete state', function() {
        expect(request.state.complete).to.have.been.called;
      });
      
      it('should respond', function() {
        expect(server._respond).to.have.been.calledOnce;
        expect(server._respond).to.have.been.calledWith({
          client: {
            id: 's6BhdRkqt3'
          },
          user: {
            id: '248289761001',
            displayName: 'Jane Doe'
          },
          res: {
            allow: true,
            permissions: [{ resource: { id: "userinfo" }, scope: undefined }]
          },
        }, response);
        
        expect(response.statusCode).to.equal(200);
      });
    }); // permitting access
    
  });
  
});
