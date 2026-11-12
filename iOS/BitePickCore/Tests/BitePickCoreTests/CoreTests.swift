import Foundation
import Testing
@testable import BitePickCore

struct CoreTests {
    @Test func testDefaultsAndRoundTrip() throws {
        let data = AppData.defaults
        #expect(data.foods.count == 11)
        #expect(try DataCodec.decode(DataCodec.encode(data)) == data)
        #expect(data.settings.language == .zh)
    }
    @Test func testFiltersCombineEnabledCategoryRecentAndSkipped() {
        var data = AppData.defaults
        data.foods[0].enabled = false
        data.history = [PickRecord(food: data.foods[1])]; data.settings.avoidRecent = 1
        let result = PickEngine.eligible(data, category: "Asian", skipped: [data.foods[2].id])
        #expect(result.count == 6)
        #expect(result.allSatisfy { $0.category == "Asian" && $0.enabled })
        #expect(!(result.contains { ["default-1", "default-2", "default-3"].contains($0.id) }))
    }
    @Test func testRecentExclusionUsesSortedRecordsNotArrayOrder() {
        var data = AppData.defaults; data.settings.avoidRecent = 1
        data.history = [PickRecord(food: data.foods[0], pickedAt: "2026-01-01T00:00:00Z"), PickRecord(food: data.foods[1], pickedAt: "2026-10-01T00:00:00.000Z")]
        let result = PickEngine.eligible(data)
        #expect(result.contains { $0.id == data.foods[0].id })
        #expect(!(result.contains { $0.id == data.foods[1].id }))
    }
    @Test func testRecentWindowsAndEmptyPool() {
        for window in [0, 1, 3, 5] {
            var data = AppData.defaults; data.settings.avoidRecent = window
            data.history = data.foods.prefix(5).map { PickRecord(food: $0) }
            #expect(PickEngine.eligible(data).count == 11 - window)
        }
        var data = AppData.defaults; data.foods = []
        #expect(PickEngine.eligible(data).isEmpty)
        #expect(PickEngine.pick([]) == nil)
        data = .defaults; data.foods = [data.foods[0]]; data.settings.avoidRecent = 1
        data.history = [PickRecord(food: data.foods[0])]
        #expect(PickEngine.pick(PickEngine.eligible(data)) == nil)
    }
    @Test func testGroupsCoverEveryFoodExactlyOnce() {
        var data = AppData.defaults
        data.foods = (0..<103).map { Food(id: "f\($0)", name: "Food \($0)", emoji: "🍽️", category: "Asian") }
        let groups = PickEngine.groups(data.foods)
        #expect(groups.count == 12)
        #expect(groups.flatMap { $0 } == data.foods)
        #expect(PickEngine.groups([]).count == 0)
        #expect(PickEngine.groups([data.foods[0]]).count == 1)
    }
    @Test func testRotationPointsAtEveryWinningSegment() {
        for count in 1...12 {
            for index in 0..<count {
                let result = PickEngine.rotation(current: 1473, index: index, count: count)
                #expect(result >= 1473 + 2160)
                let selected = (result + Double(index) * 360 / Double(count)).truncatingRemainder(dividingBy: 360)
                #expect(selected < 0.0001 || abs(selected - 360) < 0.0001)
            }
        }
    }
    @Test func testPickingSamplesIndividualFoodsNotGroups() {
        struct Generator: RandomNumberGenerator {
            var value: UInt64 = 42
            mutating func next() -> UInt64 { value = value &* 6364136223846793005 &+ 1442695040888963407; return value }
        }
        let foods = (0..<53).map { Food(id: "f\($0)", name: "Food", emoji: "🍽️", category: "Asian") }
        var generator = Generator(); var seen: Set<String> = []
        for _ in 0..<2000 { if let food = PickEngine.pick(foods, using: &generator) { seen.insert(food.id) } }
        #expect(seen.count == foods.count)
    }
    @Test func testWebJSONCompatibilityAndLegacyDefaults() throws {
        let web = #"{"version":2,"foods":[{"id":"custom","name":"奶奶的饺子","emoji":"🥟","category":"家庭","enabled":false,"createdAt":"2026-01-01T00:00:00.000Z"}],"categories":["家庭"],"history":[],"settings":{"theme":"dark","reducedMotion":true,"avoidRecent":3}}"#
        let data = try DataCodec.decode(Data(web.utf8))
        #expect(data.foods[0].name == "奶奶的饺子"); #expect(!(data.foods[0].enabled))
        #expect(data.settings.theme == .dark); #expect(data.settings.language == .zh)
        #expect(try DataCodec.decode(DataCodec.encode(data)) == data)
        let legacy = #"{"version":1,"foods":[],"categories":[]}"#
        let migrated = try DataCodec.decode(Data(legacy.utf8))
        #expect(migrated.version == 2); #expect(migrated.settings == Preferences())
    }
    @Test func testRejectsMalformedOversizedAndUnknownVersion() {
        for raw in ["null", "{}", "[]", "{", #"{"version":99}"#] { #expect(throws: (any Error).self) { try DataCodec.decode(Data(raw.utf8)) } }
        #expect(throws: (any Error).self) { try DataCodec.decode(Data(repeating: 32, count: DataCodec.maxBytes + 1)) }
    }
    @Test func testRejectsInvalidIDsCategoriesDatesAndSettings() {
        var data = AppData.defaults; data.foods[1].id = data.foods[0].id
        #expect(throws: (any Error).self) { try DataCodec.encode(data) }
        data = .defaults; data.categories.append("ASIAN"); #expect(throws: (any Error).self) { try DataCodec.encode(data) }
        data = .defaults; data.foods[0].category = "Missing"; #expect(throws: (any Error).self) { try DataCodec.encode(data) }
        data = .defaults; data.foods[0].createdAt = "tomorrow"; #expect(throws: (any Error).self) { try DataCodec.encode(data) }
        data = .defaults; data.foods[0].name = " "; #expect(throws: (any Error).self) { try DataCodec.encode(data) }
        data = .defaults; data.settings.avoidRecent = 2; #expect(throws: (any Error).self) { try DataCodec.encode(data) }
        data = .defaults; data.categories.append("all"); #expect(throws: (any Error).self) { try DataCodec.encode(data) }
    }
    @Test func testHistorySnapshotsRemainValidWhenFoodOrCategoryIsRemoved() throws {
        var data = AppData.defaults; data.history = [PickRecord(food: data.foods[0])]
        data.foods = []; data.categories = []
        #expect(try DataCodec.decode(DataCodec.encode(data)).history.count == 1)
    }
    @Test func testEmptyMenuIsValidAndMalformedHistoryIsRejected() throws {
        _ = try DataCodec.encode(AppData(foods: [], categories: []))
        var data = AppData.defaults; var record = PickRecord(food: data.foods[0]); record.pickedAt = "bad"
        data.history = [record]; #expect(throws: (any Error).self) { try DataCodec.encode(data) }
        record.pickedAt = Date().ISO8601Format(); data.history = [record, record]
        #expect(throws: (any Error).self) { try DataCodec.encode(data) }
    }
}
