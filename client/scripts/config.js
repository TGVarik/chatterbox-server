//YOU DO NOT NEED TO EDIT this code.
if (!/(&|\?)username=/.test(window.location.search)) {
  var newSearch = window.location.search;
  if (newSearch !== '' & newSearch !== '?') {
    newSearch += '&';
  }
  newSearch += 'username=' + (prompt('What is your name?') || 'anonymous');
  window.location.search = newSearch;
}
// Don't worry about this code, it will ensure that your ajax calls are allowed by the browser
$.ajaxPrefilter(function (settings, _, jqXHR) {
  jqXHR.setRequestHeader("x-purse-application-id", "voLazbq9nXuZuos9hsmprUz7JwM2N0asnPnUcI7r");
  jqXHR.setRequestHeader("x-purse-rest-api-key", "QC2F43aSAghM97XidJw8Qiy1NXlpL5LR45rhAVAf");
});
