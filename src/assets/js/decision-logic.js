var DecisionLogicHandler = (function () {

  var init = function (iframeId) {
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
      var array = '';
      if (e.origin == 'https://widget.decisionlogic.com') {
        array = processMessage(e.data);
        window['DecisionLogicComponentRef'].decisionLogicNotify.emit(array);
      }

      if (e && e.data) {
        if (e.data == 'Cross click') {
          window['DecisionLogicComponentRef'].decisionLogicNotify.emit(e.data);
        }
      }
    }

    var processMessage = function (s) {
      var p = s.split("|");
      if (p.length == 2) {
        if (p[0] == "Redirect") {
          document.location.href = p[1];
        }
        if (p[0] == "JSON") {
          return processJSON(p[1]);
        }
      }
    }

    var toArray = function (obj) {
      var result = [];
      for (var prop in obj) {
        var value = obj[prop];
        if (typeof value === 'object') {
          result.push(toArray(value));
        }
        else {
          result.push(value);
        }
      }
      return result;
    }

    var processJSON = function (jsonString) {
      var json = unescape(jsonString);
      var obj = JSON.parse(json);
      var ra = toArray(obj);
      return ra;
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

})(DecisionLogicHandler || {})