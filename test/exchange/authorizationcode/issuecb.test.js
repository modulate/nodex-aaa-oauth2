/* global describe, it */

var expect = require('chai').expect;
var sinon = require('sinon');
var factory = require('../../../xom/exchange/authorizationcode/issuecb');


describe('handlers/exchange/issuecb', function() {
  
  it('should export factory function', function() {
    expect(factory).to.be.a('function');
  });
  
  describe('factory', function() {
    var func = factory();
    
    it('should return function', function() {
      expect(func).to.be.a('function');
    });
  });
  
  describe('issueCb', function() {
    var client = {
      id: 's6BhdRkqt3',
      name: 'Example Client',
      authenticationSchemes: [ { type: 'bearer' } ]
    }
    
    var acs = {
      get: function(){}
    };
    var directory = {
      get: function(){}
    };
    var schemes = {
      negotiate: function(){}
    };
    var tokens = {
      encode: function(){},
      negotiate: function(){}
    };
    
    describe('issuing something', function() {
      var accessToken, refreshToken, params;
    
      before(function() {
        sinon.stub(acs, 'get').yields(null, {
          client: 's6BhdRkqt3',
          redirectURI: 'https://client.example.com/cb',
          user: '1',
          access: [ {
            resource: 'https://api.example.com/',
            scope: [ 'read:foo', 'write:foo', 'read:bar' ]
          } ]
        });
        
        sinon.stub(directory, 'get').yields(null, {
          id: 'https://api.example.com/',
          name: 'Example API',
          authenticationSchemes: [ { type: 'bearer' } ],
          tokenTypesSupported: [ {
            type: 'urn:ietf:params:oauth:token-type:jwt',
            signingAlgorithmsSupported: [
              'sha256', 'sha384', 'RSA-SHA256', 'RSA-SHA384'
            ]
          } ]
        });
        
        sinon.stub(schemes, 'negotiate').returns({
          type: 'bearer'
        });
        
        sinon.stub(tokens, 'negotiate').returns({
          type: 'urn:ietf:params:oauth:token-type:jwt',
          signingAlgorithms: [
            'sha256', 'RSA-SHA256'
          ]
        });
        
        sinon.stub(tokens, 'encode').yields(null, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIi.TJVA95Or');
      });
    
      after(function() {
        tokens.encode.restore();
        tokens.negotiate.restore();
        directory.get.restore();
        acs.get.restore();
      });
    
      before(function(done) {
        var issueCb = factory(acs, directory, schemes, tokens);
        issueCb(client, 'SplxlOBeZQQYbYS6WxSbIA', 'https://client.example.com/cb', function(e, a, r, p) {
          if (e) { return done(e); }
          accessToken = a;
          refreshToken = r;
          params = p;
          done();
        });
      });
      
      it('should call ACS#get', function() {
        expect(acs.get).to.have.been.calledOnce;
        expect(acs.get).to.have.been.calledWith('SplxlOBeZQQYbYS6WxSbIA');
      });
      
      it('should call Directory#get', function() {
        expect(directory.get).to.have.been.calledOnce;
        expect(directory.get).to.have.been.calledWith('https://api.example.com/');
      });
      
      it('should call schemes.negotiate', function() {
        expect(schemes.negotiate).to.have.been.calledOnce;
        expect(schemes.negotiate).to.have.been.calledWith([{ type: "bearer" }], [{ type: "bearer" }]);
      });
      
      it('should call tokens.negotiate', function() {
        expect(tokens.negotiate).to.have.been.calledOnce;
        expect(tokens.negotiate).to.have.been.calledWith([ {
          type: 'urn:ietf:params:oauth:token-type:jwt',
          signingAlgorithmsSupported: [
            'sha256', 'sha384', 'RSA-SHA256', 'RSA-SHA384'
          ]
        } ]);
      });
      
      it('should call tokens.encode', function() {
        expect(tokens.encode).to.have.been.calledOnce;
        var call = tokens.encode.getCall(0);
        expect(call.args[0]).to.equal('urn:ietf:params:oauth:token-type:jwt');

        var claims = call.args[1];
        var expiresAt = claims.expiresAt;
        delete claims.expiresAt;
        
        expect(call.args[1]).to.deep.equal({
          subject: '1',
          authorizedParty: 's6BhdRkqt3',
          audience: 'https://api.example.com/',
          scope: [ 'read:foo', 'write:foo', 'read:bar' ]
        });
        expect(expiresAt).to.be.an.instanceOf(Date);
        
        var expectedExpiresAt = new Date();
        expectedExpiresAt.setHours(expectedExpiresAt.getHours() + 2);
        expect(expiresAt).to.be.closeToDate(expectedExpiresAt, 2, 'seconds');

        expect(call.args[2]).to.deep.equal({
          signingAlgorithms: [ 'sha256', 'RSA-SHA256' ],
          peer: {
            id: 'https://api.example.com/',
            name: 'Example API',
            authenticationSchemes: [ { type: 'bearer' } ],
            tokenTypesSupported: [ {
              type: 'urn:ietf:params:oauth:token-type:jwt',
              signingAlgorithmsSupported: [ 'sha256', 'sha384', 'RSA-SHA256', 'RSA-SHA384' ]
            } ]
          }
        });
      });
      
      it('should yield accessToken', function() {
        expect(accessToken).to.equal('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIi.TJVA95Or');
      });
      
      it('should not yield refreshToken', function() {
        expect(refreshToken).to.be.undefined;
      });
    }); // validating a valid client request
    
    describe('failing due to code not issued to client', function() {
      var accessToken, refreshToken, params;
    
      before(function() {
        sinon.stub(acs, 'get').yields(null, {
          client: 's6BhdRkqt3',
          redirectURI: 'https://client.example.com/cb',
          user: '1',
          access: [ {
            resource: 'https://api.example.com/',
            scope: [ 'read:foo', 'write:foo', 'read:bar' ]
          } ]
        });
      });
    
      after(function() {
        acs.get.restore();
      });
    
      before(function(done) {
        var client = {
          id: 's6BhdRkqt4',
          name: 'Another Example Client'
        }
        
        var issueCb = factory(acs, directory, tokens);
        issueCb(client, 'SplxlOBeZQQYbYS6WxSbIA', 'https://client.example.com/not/cb', function(e, a, r, p) {
          if (e) { return done(e); }
          accessToken = a;
          refreshToken = r;
          params = p;
          done();
        });
      });
      
      it('should call ACS#get', function() {
        expect(acs.get).to.have.been.calledOnce;
        expect(acs.get).to.have.been.calledWith('SplxlOBeZQQYbYS6WxSbIA');
      });
      
      it('should not yield an access token', function() {
        expect(accessToken).to.equal(false);
      });
      
      it('should not yield other tokens', function() {
        expect(refreshToken).to.be.undefined;
        expect(params).to.be.undefined;
      });
    }); // failing due to code not issued to client
    
    describe('failing due to mismatched redirect URI', function() {
      var err, accessToken, refreshToken, params;
    
      before(function() {
        sinon.stub(acs, 'get').yields(null, {
          client: 's6BhdRkqt3',
          redirectURI: 'https://client.example.com/cb',
          user: '1',
          access: [ {
            resource: 'https://api.example.com/',
            scope: [ 'read:foo', 'write:foo', 'read:bar' ]
          } ]
        });
      });
    
      after(function() {
        acs.get.restore();
      });
    
      before(function(done) {
        var issueCb = factory(acs, directory, tokens);
        issueCb(client, 'SplxlOBeZQQYbYS6WxSbIA', 'https://client.example.com/not/cb', function(e, a, r, p) {
          err = e;
          accessToken = a;
          refreshToken = r;
          params = p;
          done();
        });
      });
      
      it('should call ACS#get', function() {
        expect(acs.get).to.have.been.calledOnce;
        expect(acs.get).to.have.been.calledWith('SplxlOBeZQQYbYS6WxSbIA');
      });
      
      it('should yield error', function() {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('Mismatched redirect URI');
        expect(err.code).to.equal('invalid_grant');
        expect(err.status).to.equal(403);
      });
      
      it('should not yield tokens', function() {
        expect(accessToken).to.be.undefined;
        expect(refreshToken).to.be.undefined;
        expect(params).to.be.undefined;
      });
    }); // failing due to mismatched redirect URI
    
  }); // issueCb
  
});
