#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   export REPO_URL="https://github.com/OWNER/REPO"
#   export RUNNER_TOKEN="<registration-token>"
#   export RUNNER_NAME="my-runner"
#   export RUNNER_LABELS="self-hosted,local-deploy"
#   sudo ./scripts/setup-self-hosted-runner.sh

WORKDIR=${WORKDIR:-/opt/actions-runner}
REPO_URL=${REPO_URL:-}
RUNNER_TOKEN=${RUNNER_TOKEN:-}
RUNNER_NAME=${RUNNER_NAME:-$(hostname)-runner}
RUNNER_LABELS=${RUNNER_LABELS:-self-hosted,local-deploy}

if [ -z "$REPO_URL" ] || [ -z "$RUNNER_TOKEN" ]; then
  echo "ERROR: REPO_URL and RUNNER_TOKEN must be set as environment variables."
  echo "See .github/SELF_HOSTED_RUNNER.md for instructions to obtain the token."
  exit 1
fi

mkdir -p "$WORKDIR"
cd "$WORKDIR"

echo "Fetching latest GitHub Actions Runner release info..."
LATEST_JSON=$(curl -s https://api.github.com/repos/actions/runner/releases/latest)
TARBALL_URL=$(echo "$LATEST_JSON" | grep -oP 'browser_download_url": "\K[^"]+linux-x64[^\"]*')

if [ -z "$TARBALL_URL" ]; then
  echo "Could not find linux-x64 runner download URL in release manifest"
  exit 1
fi

echo "Downloading runner from: $TARBALL_URL"
curl -sSL "$TARBALL_URL" -o actions-runner.tar.gz
tar xzf actions-runner.tar.gz
rm actions-runner.tar.gz

echo "Configuring runner in $WORKDIR"
./config.sh --unattended --url "$REPO_URL" --token "$RUNNER_TOKEN" --name "$RUNNER_NAME" --labels "$RUNNER_LABELS"

echo "Installing service (requires sudo) and starting runner"
sudo ./svc.sh install
sudo ./svc.sh start

echo "Runner installed and started. Check status at your repository's Settings → Actions → Runners."
echo "To remove the runner later, run: sudo ./svc.sh stop && sudo ./svc.sh uninstall && ./config.sh remove --unattended --token $RUNNER_TOKEN"
