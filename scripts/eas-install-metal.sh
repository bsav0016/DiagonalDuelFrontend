#!/usr/bin/env bash
# Xcode 26 no longer bundles the Metal compiler. EAS images without it fail with
# "cannot execute tool 'metal' due to missing Metal Toolchain", so install it first.
# Runs from the "eas-build-pre-install" hook in package.json; harmless anywhere but macOS.
set -u
[ "$(uname)" = "Darwin" ] || exit 0

if xcrun --find metal >/dev/null 2>&1 && xcrun metal --version >/dev/null 2>&1; then
  echo "Metal toolchain already available"
  exit 0
fi

echo "Installing Metal toolchain"
xcodebuild -downloadComponent MetalToolchain || echo "Metal toolchain download failed; the build may fail on a Metal step"
xcrun metal --version || true
