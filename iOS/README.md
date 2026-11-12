# BitePick for iPhone

Native SwiftUI app, alongside the existing web app. No third-party dependencies or backend. Chinese is the default language; English, light/dark/system appearance, and reduced motion are built in.

## Open and run

1. Install **Xcode 26 or newer**, including an iOS simulator runtime.
2. Open `BitePick.xcodeproj` from this directory.
3. Select the shared **BitePick** scheme and an **iPhone running iOS 26+**. Run with ⌘R.
4. For a physical iPhone, choose your development team in Signing & Capabilities. Change the sample bundle identifier `com.bitepick.ios` to one you own.

The local `BitePickCore` Swift package resolves from this repository. No dependency download or project generator is required. The minimum target is iOS 26 because the app uses Apple's real Liquid Glass APIs.

## Design and behavior

- Native TabView and navigation/toolbar controls adopt the system Liquid Glass design.
- Primary picking and secondary filter/result buttons use `.glassProminent` and `.glass` button styles. Warm backgrounds and content cards keep text readable; the wheel uses opaque peach/champagne sectors.
- The wheel selects a food uniformly using `SystemRandomNumberGenerator` **before** animating to its segment. More than 12 foods share visual segments without changing food probabilities.
- Quick Pick shares the same candidate pool. Changing tabs cancels an unfinished animation; only “Let's eat” records history.
- Food editing, custom emoji/category creation, toggles, search/category filtering, multi-selection deletion, category rename/delete, and restoring defaults are available in My Foods.
- History supports deleting records and clearing all records, with confirmation. Recent exclusions support 0, 1, 3, or 5 records; exhausted pools show a friendly reset action.
- Menus persist atomically in the app's Application Support directory (`BitePick/menu-v2.json`). A damaged saved file isn't overwritten on startup. Save failures keep the current in-memory data unchanged.
- Import/export supports the web app's version-2 JSON format and legacy version-1 files. Import validates size, identifiers, references, dates, limits and preferences, then asks before replacing current data. This is a manual transfer, not cloud synchronization.
- System reduced motion is always honored; the app preference can additionally disable animation. Result reveal includes light success haptics.

## Checks

Run the independent Foundation-only core tests on a Mac with Swift 6+:

```sh
./iOS/scripts/test-core.sh
```

With full Xcode selected, build the iPhone UI without a signing identity:

```sh
xcodebuild -project iOS/BitePick.xcodeproj -scheme BitePick \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath /tmp/BitePickDerivedData CODE_SIGNING_ALLOWED=NO build
```

The helper handles the bundled Swift Testing plugin on Command Line Tools-only installations.

Core tests cover filtering, recent exclusions, empty pools, grouping, winning angles, individual-food sampling, web/legacy JSON compatibility and invalid imports. The project and privacy manifest can also be validated with `plutil -lint`.

**Verified in the authoring environment:** 12 Swift Testing core tests passed. The complete SwiftUI app passes type checking against the bundled macOS 26.5 SDK's iOS 26 Mac Catalyst interfaces; the portable store/design/wheel files also pass macOS type checking. Swift syntax, project references, scheme XML, privacy manifest and asset catalogs pass structural checks. The existing web app's typecheck/lint and 76 tests pass.

**Validation limitation:** full Xcode is not installed. The supplemental Catalyst type check is not an iPhone build. iOS linking, simulator screenshots, accessibility inspection and physical-device animation/haptics still require full Xcode and have not been verified here. Treat this as an initial native implementation pending that device pass, not an App Store-ready binary.

## Source layout

- `BitePick/BitePickApp.swift` — app entry point, appearance, native tabs
- `BitePick/Core/` — observable store, persistence, translated seed snapshots
- `BitePick/Design/` — warm design foundation and content surfaces
- `BitePick/Features/` — wheel, picker, result, food/category management, history, settings
- `BitePickCore/` — portable data model, validation, selection logic, tests

Before release, verify on small and large iPhones, larger Dynamic Type sizes, VoiceOver, Reduce Transparency, and Reduce Motion; choose your signing identity and complete App Store metadata/privacy disclosures.
