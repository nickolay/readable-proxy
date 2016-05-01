// This module runs in Node, in response to the requests to the readable-proxy.

var childProcess = require("child_process");
var phantomjs = require("phantomjs-prebuilt");
var binPath = phantomjs.path;
var path = require("path");
var Promise = require("bluebird");
var objectAssign = require("object-assign");

var readabilityPath = process.env.READABILITY_LIB_PATH ||
                      path.normalize(path.join(__dirname, "vendor", "Readability.js"));

/**
 * Runs the PhantomJS executable to process the given URL in a (headless) web
 * browser context via phantom-scrape.js.
 * @returns a promise with the results of running readability on the given URL.
 */
module.exports = function scrape(url, options) {
  options = options || {};
  if (!url) throw new Error("Missing url.");
  return new Promise(function(fulfill, reject) {
    var childArgs = [path.join(__dirname, "phantom-scrape.js"), url, readabilityPath];
    var execOpts = {};
    if (options.userAgent) {
      childArgs.push(options.userAgent);
    }
    if (options.phantomJSDebug) {
      childArgs.unshift("--debug=true");
      // Since the debug output may be large, use a 1MB buffer by default.
      // Increase this if you get 'stderr maxBuffer exceeded'.
      execOpts.maxBuffer = 1024*1024*1;
    }
    childProcess.execFile(binPath, childArgs, execOpts, function(err, stdout, stderr) {
      var response, error;
      if (err) {
        error = err;
      } else {
        try {
          response = JSON.parse(stdout);
        } catch (e) {
          error = {
            message: "Unable to parse JSON proxy response.",
            line: e.line,
            stack: e.stack
          };
        }
        if (response && response.error) {
          error = response.error;
        } else if (!response && !error) {
          error = new Error("Empty scraped response.");
        }
      }

      if (error) {
        error.stderr = stderr;
        reject(objectAssign(new Error(error.message), error));
      } else {
        response.stderr = stderr;
        fulfill(response);
      }
    });
  });
};
