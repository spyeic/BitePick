import Foundation

public enum DataError: Error, LocalizedError {
    case oversized, unsupportedVersion, invalidFields
    public var errorDescription: String? {
        switch self {
        case .oversized: "文件不能超过 2 MB。 / The file must be smaller than 2 MB."
        case .unsupportedVersion: "不支持此文件版本。 / Unsupported file version."
        case .invalidFields: "菜单数据无效，请选择 BitePick 导出的 JSON。 / Invalid BitePick menu."
        }
    }
}
public enum DataCodec {
    public static let maxBytes = 2 * 1024 * 1024
    public static func decode(_ bytes: Data) throws -> AppData {
        guard bytes.count <= maxBytes else { throw DataError.oversized }
        var data = try JSONDecoder().decode(AppData.self, from: bytes)
        try validate(data)
        data.history.sort { (timestamp($0.pickedAt) ?? .distantPast) > (timestamp($1.pickedAt) ?? .distantPast) }
        return data
    }
    public static func encode(_ data: AppData) throws -> Data {
        try validate(data)
        let encoder = JSONEncoder(); encoder.outputFormatting = [.prettyPrinted, .sortedKeys, .withoutEscapingSlashes]
        return try encoder.encode(data)
    }
    public static func validate(_ data: AppData) throws {
        func valid(_ s: String, _ max: Int) -> Bool { !s.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && s.utf16.count <= max }
        guard data.version == 2, data.foods.count <= 500, data.categories.count <= 50, data.history.count <= 1000,
              [0, 1, 3, 5].contains(data.settings.avoidRecent),
              Set(data.foods.map(\.id)).count == data.foods.count,
              Set(data.history.map(\.id)).count == data.history.count,
              Set(data.categories.map { $0.lowercased() }).count == data.categories.count,
              data.categories.allSatisfy({ valid($0, 32) && $0.lowercased() != "all" }),
              data.foods.allSatisfy({ valid($0.id, 100) && valid($0.name, 60) && valid($0.emoji, 20) && data.categories.contains($0.category) && timestamp($0.createdAt) != nil }),
              data.history.allSatisfy({ valid($0.id, 100) && valid($0.foodId, 100) && valid($0.name, 60) && valid($0.emoji, 20) && valid($0.category, 32) && timestamp($0.pickedAt) != nil })
        else { throw DataError.invalidFields }
    }
}
