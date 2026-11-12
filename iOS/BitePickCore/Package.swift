// swift-tools-version: 6.0
import PackageDescription
let package = Package(
    name: "BitePickCore", platforms: [.iOS(.v17), .macOS(.v14)],
    products: [.library(name: "BitePickCore", targets: ["BitePickCore"])],
    targets: [.target(name: "BitePickCore"), .testTarget(name: "BitePickCoreTests", dependencies: ["BitePickCore"])]
)
