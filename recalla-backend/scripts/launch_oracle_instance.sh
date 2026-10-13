#!/usr/bin/env bash
#
# Keep asking Oracle for the Always Free ARM instance until it says yes.
#
# Free-tier Ampere capacity in a given region is routinely exhausted, and
# Oracle reports it as either "Out of host capacity" or "TooManyRequests".
# Both mean "try later", so the only real strategy is patience — which is a
# script's job, not a person's.
#
#   bash scripts/launch_oracle_instance.sh
#
# Writes the instance OCID and public IP to scratch files when it succeeds.

set -uo pipefail
cd "$(dirname "$0")/.."

SP="${SP:-/tmp/recalla-oci}"
mkdir -p "$SP"
OCI="./venv/bin/oci --profile recalla --auth security_token"

T=$(cat "$SP/tenancy.txt"); SUB=$(cat "$SP/subnet.txt")
IMG=$(cat "$SP/image.txt"); AD=$(cat "$SP/ad.txt")

# Oracle penalises rapid retries with progressively longer rate-limit
# windows — attempts spaced under a minute reliably produce "Too many
# requests" regardless of whether capacity exists, which hides the real
# answer. Five minutes between attempts gets a truthful reply each time.
DELAY=300
MAX_DELAY=900
ATTEMPT=0

while :; do
  ATTEMPT=$((ATTEMPT + 1))
  OUT=$($OCI compute instance launch \
      -c "$T" --availability-domain "$AD" --subnet-id "$SUB" \
      --display-name recalla-backend --image-id "$IMG" \
      --shape VM.Standard.A1.Flex \
      --shape-config '{"ocpus":4,"memoryInGBs":24}' \
      --boot-volume-size-in-gbs 100 --assign-public-ip true \
      --ssh-authorized-keys-file ~/.ssh/recalla_oracle.pub 2>&1)

  ID=$(echo "$OUT" | grep -oE '"id": "ocid1\.instance[^"]*"' | head -1 | cut -d'"' -f4)
  if [ -n "$ID" ]; then
    echo "$(date '+%H:%M:%S')  LAUNCHED after $ATTEMPT attempts"
    echo "$ID" > "$SP/instance.txt"
    echo "$ID"
    exit 0
  fi

  # An expired session produces no error code at all, just a prompt on
  # stderr — so the loop reads "unknown" and keeps going, talking to nothing.
  # Session tokens last about an hour; a long wait WILL outlive one, which
  # makes this the most likely way the loop silently stops working.
  if echo "$OUT" | grep -q "session has expired\|no longer valid\|NotAuthenticated"; then
    echo "$(date '+%H:%M:%S')  SESSION EXPIRED after $ATTEMPT attempts — stopping."
    echo "  Re-authenticate, then start this script again:"
    echo "    ./venv/bin/oci session authenticate --region me-dubai-1 --profile-name recalla"
    exit 2
  fi

  CODE=$(echo "$OUT" | grep -oE '"code": "[^"]*"' | head -1 | cut -d'"' -f4)
  echo "$(date '+%H:%M:%S')  attempt $ATTEMPT: ${CODE:-unknown} — retrying in ${DELAY}s"

  # A real error (bad image, bad subnet, quota) will never clear by waiting.
  case "$CODE" in
    TooManyRequests|InternalError|OutOfCapacity|LimitExceeded|"") ;;
    *) echo "$OUT" | grep -oE '"message": "[^"]*"' | head -1; exit 1 ;;
  esac

  sleep "$DELAY"
  DELAY=$(( DELAY < MAX_DELAY ? DELAY * 3 / 2 : MAX_DELAY ))
done
