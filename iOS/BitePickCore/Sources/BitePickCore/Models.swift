import Foundation

public enum Language: String, Codable, CaseIterable, Sendable { case zh, en }
public enum Appearance: String, Codable, CaseIterable, Sendable { case light, dark, system }
public struct Food: Identifiable, Codable, Equatable, Sendable {
    public var id: String
    public var name: String
    public var emoji: String
    public var category: String
    public var enabled: Bool
    public var createdAt: String
    public init(id: String = UUID().uuidString, name: String, emoji: String, category: String, enabled: Bool = true, createdAt: String = Date().ISO8601Format()) {
        self.id = id; self.name = name; self.emoji = emoji; self.category = category; self.enabled = enabled; self.createdAt = createdAt
    }
}
public struct PickRecord: Identifiable, Codable, Equatable, Sendable {
    public var id: String
    public var foodId: String
    public var name: String
    public var emoji: String
    public var category: String
    public var pickedAt: String
    public init(food: Food, pickedAt: String = Date().ISO8601Format(), id: String = UUID().uuidString) {
        self.id = id; foodId = food.id; name = food.name; emoji = food.emoji; category = food.category; self.pickedAt = pickedAt
    }
}
public struct Preferences: Codable, Equatable, Sendable {
    public var language: Language = .zh
    public var theme: Appearance = .system
    public var reducedMotion = false
    public var avoidRecent = 0
    public init() {}
    public init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        language = try c.decodeIfPresent(Language.self, forKey: .language) ?? .zh
        theme = try c.decodeIfPresent(Appearance.self, forKey: .theme) ?? .system
        reducedMotion = try c.decodeIfPresent(Bool.self, forKey: .reducedMotion) ?? false
        avoidRecent = try c.decodeIfPresent(Int.self, forKey: .avoidRecent) ?? 0
    }
}
public struct AppData: Codable, Equatable, Sendable {
    public var version = 2
    public var foods: [Food]
    public var categories: [String]
    public var history: [PickRecord]
    public var settings: Preferences
    public init(foods: [Food], categories: [String], history: [PickRecord] = [], settings: Preferences = Preferences()) {
        self.foods = foods; self.categories = categories; self.history = history; self.settings = settings
    }
    public init(from decoder: any Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        let version = try c.decode(Int.self, forKey: .version)
        guard [1, 2].contains(version) else { throw DataError.unsupportedVersion }
        self.version = 2
        foods = try c.decode([Food].self, forKey: .foods)
        categories = try c.decode([String].self, forKey: .categories)
        history = try c.decodeIfPresent([PickRecord].self, forKey: .history) ?? []
        settings = try c.decodeIfPresent(Preferences.self, forKey: .settings) ?? Preferences()
    }
    public static var defaults: AppData {
        let names = ["Hunan Cuisine", "Cantonese Cuisine", "Sichuan Cuisine", "Japanese Food", "Hot Pot", "Korean BBQ", "Yakiniku", "Thai Food", "Korean Food", "Western Food", "Burgers"]
        let emojis = ["🌶️", "🥟", "🫕", "🍣", "🍲", "🥩", "🍖", "🍛", "🍚", "🍝", "🍔"]
        return AppData(foods: names.enumerated().map { i, name in
            Food(id: "default-\(i + 1)", name: name, emoji: emojis[i], category: i < 9 ? "Asian" : i == 9 ? "Western" : "Fast Food", createdAt: "2026-01-01T00:00:00.000Z")
        }, categories: ["Asian", "Western", "Fast Food", "Healthy", "Dessert", "Custom"])
    }
}
public enum PickEngine {
    public static func eligible(_ data: AppData, category: String? = nil, skipped: Set<String> = []) -> [Food] {
        let recent = Set(data.history.sorted { (timestamp($0.pickedAt) ?? .distantPast) > (timestamp($1.pickedAt) ?? .distantPast) }.prefix(data.settings.avoidRecent).map(\.foodId))
        return data.foods.filter { $0.enabled && (category == nil || $0.category == category) && !recent.contains($0.id) && !skipped.contains($0.id) }
    }
    public static func pick<R: RandomNumberGenerator>(_ foods: [Food], using generator: inout R) -> Food? { foods.randomElement(using: &generator) }
    public static func pick(_ foods: [Food]) -> Food? { var generator = SystemRandomNumberGenerator(); return pick(foods, using: &generator) }
    public static func groups(_ foods: [Food]) -> [[Food]] {
        let count = min(12, foods.count)
        guard count > 0 else { return [] }
        return (0..<count).map { Array(foods[($0 * foods.count / count)..<(($0 + 1) * foods.count / count)]) }
    }
    public static func rotation(current: Double, index: Int, count: Int) -> Double {
        guard count > 0, (0..<count).contains(index) else { return current }
        let target = (360 - Double(index) * 360 / Double(count)).truncatingRemainder(dividingBy: 360)
        let offset = (target - current.truncatingRemainder(dividingBy: 360) + 360).truncatingRemainder(dividingBy: 360)
        return current + 2160 + offset
    }
}
public func timestamp(_ string: String) -> Date? {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return formatter.date(from: string) ?? ISO8601DateFormatter().date(from: string)
}
