(function() {
  "use strict";

  var q = document.querySelector.bind(document);

  function injectReadableContents(params, target) {
    q("#error-container").classList.add("hide");

    var apiUrl = [
      "/api/get?sanitize=" + (params.sanitize ? "yes" : "no"),
      "url=" + encodeURIComponent(params.url),
      "userAgent=" + encodeURIComponent(params.userAgent),
      "phantomJSDebug=" + params.phantomJSDebug
    ].join("&");

    return new Promise(function(resolve, reject) {
      q("#submit-btn").disabled = true;
      q("#error").textContent = "";
      q("#readerable").textContent = "";
      q("#title").textContent = "";
      q("#byline").textContent = "";
      q("#length").textContent = "";
      q("#dir").textContent = "";
      q("#excerpt").textContent = "";
      q("#logs").value = "";
      q("#stderr").textContent = "";
      target.contentDocument.body.innerHTML = "";

      fetch(apiUrl)
        .then(function(response) {
          return response.json();
        })
        .then(function(jsonResponse) {
          q("#stderr").textContent = jsonResponse.stderr || "<stderr is empty>";
          if (jsonResponse.error) {
            throw jsonResponse.error;
          } else {
            q("#readerable").textContent = jsonResponse.isProbablyReaderable;
            q("#title").textContent = jsonResponse.title;
            q("#byline").textContent = jsonResponse.byline;
            q("#length").textContent = jsonResponse.length;
            q("#dir").textContent = jsonResponse.dir;
            q("#excerpt").textContent = jsonResponse.excerpt;
            q("#logs").value = (jsonResponse.consoleLogs || []).join("\n");
            target.contentDocument.body.innerHTML = jsonResponse.content;
          }
          q("#submit-btn").disabled = false;
          resolve(jsonResponse);
        })
        .catch(function (reason) {
          q("#submit-btn").disabled = false;
          q("#error").textContent = reason.message;
          q("#error-container").classList.remove("hide");
          reject(reason);
        });
    });
  }

  function init() {
    q("form").addEventListener("submit", function(event) {
      event.preventDefault();
      var url = q("#url").value;
      q("#source").src = "";
      injectReadableContents({
          url: url,
          sanitize: q("#sanitize").checked,
          phantomJSDebug: q("#phantomJSDebug").checked,
          userAgent: q("#userAgent").value
        }, q("#target"))
      .then(function() {
        q("#source").src = url;
      });
    });
  }

  window.addEventListener("DOMContentLoaded", init);
})();
