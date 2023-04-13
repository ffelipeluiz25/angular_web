var YoodleHandler = (function () {

  var init = function(iframeId){
    var onMessage = function (cb) {
      if (window.addEventListener) {
        window.addEventListener('message'
          , function (e) {
            cb(e);
          }, false
        );
      } else {
        window.attachEvent('onmessage'
          , function (e) {
            cb(e);
          }
        );
      }
    }
    var callbackFun = function (e) {
      console.log('iframe onmessage', e);
      if (e && e.data) {
        if (e.data == 'close_modal') {
          window['LoanTermsComponentRef'].yodleeNotify.emit();
        } else if (e.data.fnToCall && typeof window[e.data.fnToCall] == 'function') {
          window[e.data.fnToCall](e.data);
        }
      }
    }
    
    var resizeFloater = function (data) {
      $(iframeId).attr('height', data.height);
    }
    onMessage(callbackFun);
  }

  return {
    Init: function (iframeId) {
      init(iframeId);
    } 
  }

})(YoodleHandler || {})