#!/usr/bin/env bash

set -e

# Make sure we have the required commands to run this script
if ! command -v jq &>/dev/null; then
    echo "jq is required to run this script"
    exit 1
fi

if ! command -v semver &>/dev/null; then
    echo "semver is required to run this script"
    exit 1
fi

# Read the current version from package.json
CURRENT_VERSION=$(jq -r ".version" package.json)

# Read the increment argument (if provided)
INCREMENT=$1

# If $INCREMENT is not empty, run semver to increment the version, then update package.json and create a git tag
if [ -n "$INCREMENT" ]; then
    VERSION=$(semver --increment "$INCREMENT" "$CURRENT_VERSION")
    jq ".version=\"$VERSION\"" --indent 4 package.json >package.json.new
    mv package.json.new package.json

    git add package.json
    git commit -qm "Bump version to $VERSION"
    git tag -a -m "Tagging version $VERSION" "$VERSION"
else
    VERSION=$CURRENT_VERSION
fi

# Build the Docker image
echo "Building SNS Pushover v$VERSION"
docker buildx build \
       --pull \
       --no-cache \
       --build-arg VERSION="$VERSION" \
       --platform=linux/amd64,linux/arm64/v8 \
       --tag "rpungello/sns-pushover:${VERSION}" \
       --tag "rpungello/sns-pushover:latest" \
       --push .
