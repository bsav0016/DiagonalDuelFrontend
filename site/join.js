// The invite page (join.html): reads the invite code from the link and shows it with a button that opens the app on the join
// screen. Plain browser JavaScript with no dependencies and no network calls: the code stays in the page and is not sent
// anywhere. Also loadable from Node so the code check can be unit tested.

// Invite codes are 8 characters from the letters and digits without I, O, 0 and 1 (see the backend's ChallengeService).
var CODE_PATTERN = /^[A-HJ-NP-Z2-9]{8}$/;

/** The valid invite code in a query string such as "?code=abcd2345", upper-cased, or null. */
function parseCode(search) {
  var match = /[?&]code=([^&#]*)/.exec(search || '');
  if (!match) return null;
  var raw;
  try {
    raw = decodeURIComponent(match[1]);
  } catch (e) {
    return null;
  }
  var code = raw.trim().toUpperCase();
  return CODE_PATTERN.test(code) ? code : null;
}

/** The address that opens the app on the join screen with the code filled in. */
function appLink(code) {
  return 'diagonalduel://join-challenge?code=' + code;
}

if (typeof document !== 'undefined') {
  var code = parseCode(window.location.search);
  var withCode = document.getElementById('with-code');
  var withoutCode = document.getElementById('without-code');
  if (code && withCode && withoutCode) {
    document.getElementById('code').textContent = code;
    document.getElementById('open-app').setAttribute('href', appLink(code));
    withCode.hidden = false;
    withoutCode.hidden = true;
  }
}

if (typeof module !== 'undefined') module.exports = { parseCode, appLink, CODE_PATTERN };
