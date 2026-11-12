#!/bin/sh
set -eu
# CLT-only Swift 6.4 installations may not forward the bundled Testing macro plugin.
package_dir=$(CDPATH= cd -- "$(dirname -- "$0")/../BitePickCore" && pwd)
developer_dir=$(xcode-select -p)
plugin="$developer_dir/usr/lib/swift/host/plugins/testing/libTestingMacros.dylib"
if [ "$developer_dir" = "/Library/Developer/CommandLineTools" ] && [ -f "$plugin" ]; then
  exec swift test --package-path "$package_dir" --disable-xctest --enable-swift-testing -Xswiftc -load-plugin-library -Xswiftc "$plugin"
else
  exec swift test --package-path "$package_dir" --disable-xctest --enable-swift-testing
fi
