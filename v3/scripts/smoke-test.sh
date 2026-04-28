#!/usr/bin/env bash
# v3 end-to-end smoke test.
#
# Runs every observable surface against the production-deployed Worker
# and reports pass/fail. Safe to run any time — does NOT make destructive
# changes to live data. Auth uses the Apple Review demo account.
#
# Usage:
#   ./v3/scripts/smoke-test.sh                           # against the workers.dev URL
#   BASE=https://legacy-odyssey-v3...workers.dev ./v3/scripts/smoke-test.sh
#
# Exit code 0 on all-pass, 1 if anything failed. Designed to be paste-able
# into CI later.

set -uo pipefail

BASE="${BASE:-https://legacy-odyssey-v3.legacyodysseyapp.workers.dev}"
DEMO_EMAIL="review@legacyodyssey.com"
DEMO_PASS="TestPass-2026!"

PASS=0
FAIL=0
FAILED_NAMES=()

# Output: green/red marks, no jq required.
red()   { printf '\033[31m%s\033[0m' "$*"; }
green() { printf '\033[32m%s\033[0m' "$*"; }
yellow(){ printf '\033[33m%s\033[0m' "$*"; }

check() {
  local name="$1"; shift
  local expected="$1"; shift
  local actual="$1"; shift
  if [[ "$actual" == "$expected" ]]; then
    PASS=$((PASS+1))
    printf '  %s %-55s (%s)\n' "$(green ✓)" "$name" "$actual"
  else
    FAIL=$((FAIL+1))
    FAILED_NAMES+=("$name")
    printf '  %s %-55s (got %s, expected %s)\n' "$(red ✗)" "$name" "$actual" "$expected"
  fi
}

# Helper that issues a request and returns the HTTP status code.
status_of() {
  curl -s --ssl-no-revoke -o /dev/null -w '%{http_code}' "$@"
}

echo "v3 smoke test against $BASE"
echo

# --- Public endpoints ---
echo "Public:"
check "/health"                       "200" "$(status_of "$BASE/health")"
check "/v3-status"                    "200" "$(status_of "$BASE/v3-status")"
check "/ (proxied landing)"           "200" "$(status_of "$BASE/")"
check "/gift (proxied)"               "200" "$(status_of "$BASE/gift")"
check "/redeem (proxied)"             "200" "$(status_of "$BASE/redeem")"
check "/privacy (proxied)"            "200" "$(status_of "$BASE/privacy")"
check "/admin → /admin/login (302)"   "302" "$(status_of "$BASE/admin")"
check "/admin/login (200)"            "200" "$(status_of "$BASE/admin/login")"

# --- API gates (no auth) ---
echo
echo "API auth gates (expect 401):"
check "/api/books/mine"               "401" "$(status_of "$BASE/api/books/mine")"
check "/api/families/mine"            "401" "$(status_of "$BASE/api/families/mine")"
check "/api/upload"                   "401" "$(status_of -X POST "$BASE/api/upload")"
check "/api/auth/cancel"              "401" "$(status_of -X POST -H 'content-type: application/json' -d '{}' "$BASE/api/auth/cancel")"
check "/api/stripe/portal"            "401" "$(status_of -X POST "$BASE/api/stripe/portal")"

# --- Public API validation ---
echo
echo "API validation (expect 400 or 200 with JSON):"
check "/api/auth/check-subdomain bad" "200" "$(status_of "$BASE/api/auth/check-subdomain?s=ab")"
check "/api/auth/login bad creds"     "401" "$(status_of -X POST -H 'content-type: application/json' -d '{"email":"x@y.z","password":"nope"}' "$BASE/api/auth/login")"
check "/api/contact missing fields"   "400" "$(status_of -X POST -H 'content-type: application/json' -d '{}' "$BASE/api/contact")"
check "/api/waitlist bad email"       "400" "$(status_of -X POST -H 'content-type: application/json' -d '{"email":"nope"}' "$BASE/api/waitlist")"
check "/api/domains/search short"     "400" "$(status_of "$BASE/api/domains/search?name=a")"
check "/api/domains/search valid"     "200" "$(status_of "$BASE/api/domains/search?name=v3smoketest$(date +%s)")"
check "/api/stripe/redeem-gift bad"   "400" "$(status_of -X POST -H 'content-type: application/json' -d '{"code":"GIFT-XXXX-XXXX-XXXX","email":"x@y.z"}' "$BASE/api/stripe/redeem-gift")"

# --- Authenticated round-trip ---
echo
echo "Authenticated:"
LOGIN=$(curl -s --ssl-no-revoke -X POST -H 'content-type: application/json' \
  -d "{\"email\":\"$DEMO_EMAIL\",\"password\":\"$DEMO_PASS\"}" \
  "$BASE/api/auth/login")
TOKEN=$(echo "$LOGIN" | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')

if [[ -z "$TOKEN" ]]; then
  echo "  $(red ✗) Could not log in as $DEMO_EMAIL — skipping authenticated tests"
  FAIL=$((FAIL+1))
  FAILED_NAMES+=("login")
else
  echo "  $(green ✓) Logged in as $DEMO_EMAIL (token len=${#TOKEN})"
  PASS=$((PASS+1))
  AUTH=("-H" "Authorization: Bearer $TOKEN")

  check "/api/books/mine"               "200" "$(status_of "${AUTH[@]}" "$BASE/api/books/mine")"
  check "/api/books/mine/sections"      "200" "$(status_of "${AUTH[@]}" "$BASE/api/books/mine/sections")"
  check "/api/books/mine/before"        "200" "$(status_of "${AUTH[@]}" "$BASE/api/books/mine/before")"
  check "/api/books/mine/birth"         "200" "$(status_of "${AUTH[@]}" "$BASE/api/books/mine/birth")"
  check "/api/books/mine/months"        "200" "$(status_of "${AUTH[@]}" "$BASE/api/books/mine/months")"
  check "/api/books/mine/months/3"      "200" "$(status_of "${AUTH[@]}" "$BASE/api/books/mine/months/3")"
  check "/api/books/mine/family"        "200" "$(status_of "${AUTH[@]}" "$BASE/api/books/mine/family")"
  check "/api/books/mine/firsts"        "200" "$(status_of "${AUTH[@]}" "$BASE/api/books/mine/firsts")"
  check "/api/books/mine/letters"       "200" "$(status_of "${AUTH[@]}" "$BASE/api/books/mine/letters")"
  check "/api/books/mine/recipes"       "200" "$(status_of "${AUTH[@]}" "$BASE/api/books/mine/recipes")"
  check "/api/books/mine/celebrations"  "200" "$(status_of "${AUTH[@]}" "$BASE/api/books/mine/celebrations")"
  check "/api/books/mine/vault"         "200" "$(status_of "${AUTH[@]}" "$BASE/api/books/mine/vault")"
  check "/api/families/mine"            "200" "$(status_of "${AUTH[@]}" "$BASE/api/families/mine")"
  check "/api/stripe/portal"            "200" "$(status_of -X POST "${AUTH[@]}" -H 'content-type: application/json' -d '{}' "$BASE/api/stripe/portal")"
fi

# --- Webhook signature gate ---
echo
echo "Webhook signature gate:"
check "/stripe/webhook no signature"  "400" "$(status_of -X POST "$BASE/stripe/webhook")"
check "/stripe/webhook fake sig"      "400" "$(status_of -X POST -H 'stripe-signature: t=1,v1=fake' -d '{}' "$BASE/stripe/webhook")"

# --- Static asset proxies ---
echo
echo "Static assets (proxied):"
check "/css/book.css"                 "200" "$(status_of "$BASE/css/book.css")"
check "/css/marketing.css"            "200" "$(status_of "$BASE/css/marketing.css")"
check "/js/book.js"                   "200" "$(status_of "$BASE/js/book.js")"
# Express has never shipped a /favicon.ico — the 404 is expected and the
# proxy faithfully forwards it. Asserts proxy is wired, not that a favicon exists.
check "/favicon.ico (proxy 404)"      "404" "$(status_of "$BASE/favicon.ico")"

# --- Book viewer ---
echo
echo "Book viewer:"
check "/book/eowynragno (200 + gate)" "200" "$(status_of "$BASE/book/eowynragno")"
check "/book/nonexistent → 404"       "404" "$(status_of "$BASE/book/this-doesnt-exist-12345")"

# --- Summary ---
echo
echo "─────────────────────────────────────────"
TOTAL=$((PASS + FAIL))
if [[ $FAIL -eq 0 ]]; then
  printf '%s   %d/%d passed\n' "$(green '✓ ALL GREEN')" "$PASS" "$TOTAL"
  exit 0
else
  printf '%s   %d/%d passed\n' "$(red '✗ FAILED')" "$PASS" "$TOTAL"
  echo "Failed checks:"
  for n in "${FAILED_NAMES[@]}"; do echo "  - $n"; done
  exit 1
fi
