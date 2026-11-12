import Foundation
import Observation
import BitePickCore

@MainActor @Observable final class BiteStore {
    private(set) var data: AppData
    var message: String?
    private let file: URL?
    init() {
        let directory = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first?.appendingPathComponent("BitePick", isDirectory: true)
        file = directory?.appendingPathComponent("menu-v2.json")
        if let file, FileManager.default.fileExists(atPath: file.path) {
            do { data = try DataCodec.decode(Data(contentsOf: file)) }
            catch { data = .defaults; message = "本地菜单读取失败，原文件仍保留。你可以重新导入备份。 / Saved menu could not be read; the original file is preserved." }
        } else { data = .defaults }
    }
    var language: Language { data.settings.language }
    func t(_ zh: String, _ en: String) -> String { language == .zh ? zh : en }
    func foodName(_ food: Food) -> String { foodName(id: food.id, name: food.name) }
    func foodName(id: String, name: String) -> String {
        guard language == .zh else { return name }
        let names = ["湘菜", "粤菜", "川菜", "日料", "火锅", "韩式烤肉", "日式烤肉", "泰餐", "韩餐", "西餐", "汉堡"]
        if let index = AppData.defaults.foods.firstIndex(where: { $0.id == id && $0.name == name }) { return names[index] }
        let old = ["Sushi", "Ramen", "Hot Pot", "Korean BBQ", "Pizza", "Burgers", "Pasta", "Tacos", "Chinese Food", "Thai Food", "Fried Chicken", "Poke Bowl"]
        let translated = ["寿司", "拉面", "火锅", "韩式烤肉", "披萨", "汉堡", "意大利面", "墨西哥卷饼", "中餐", "泰餐", "炸鸡", "波奇碗"]
        if let i = old.indices.first(where: { id == "default-\($0 + 1)" && name == old[$0] }) { return translated[i] }
        return name
    }
    func categoryName(_ name: String) -> String {
        guard language == .zh else { return name }
        return ["Asian": "亚洲美食", "Western": "西式美食", "Fast Food": "快餐小吃", "Healthy": "健康轻食", "Dessert": "甜品", "Custom": "自定义", "Uncategorized": "未分类"][name] ?? name
    }
    @discardableResult func update(_ change: (inout AppData) -> Void) -> Bool {
        var next = data; change(&next)
        do {
            let bytes = try DataCodec.encode(next)
            guard let file else { throw CocoaError(.fileNoSuchFile) }
            try FileManager.default.createDirectory(at: file.deletingLastPathComponent(), withIntermediateDirectories: true)
            try bytes.write(to: file, options: .atomic)
            data = next
            return true
        } catch {
            message = t("未能保存修改：", "Could not save changes: ") + error.localizedDescription
            return false
        }
    }
    func replace(_ next: AppData) { update { $0 = next } }
    func confirm(_ food: Food) { update { $0.history.insert(PickRecord(food: food), at: 0); $0.history = Array($0.history.prefix(1000)) } }
    func save(_ food: Food) -> Bool {
        update {
            if !$0.categories.contains(food.category) { $0.categories.append(food.category) }
            if let index = $0.foods.firstIndex(where: { $0.id == food.id }) { $0.foods[index] = food }
            else { $0.foods.append(food) }
        }
    }
    func renameCategory(_ old: String, to name: String) -> Bool {
        update { data in
            if let i = data.categories.firstIndex(of: old) { data.categories[i] = name }
            for i in data.foods.indices where data.foods[i].category == old { data.foods[i].category = name }
        }
    }
    func deleteCategory(_ category: String) {
        update { data in
            data.categories.removeAll { $0 == category }
            if data.foods.contains(where: { $0.category == category }) {
                let fallback = data.categories.first ?? "Custom"
                if data.categories.isEmpty { data.categories.append(fallback) }
                for i in data.foods.indices where data.foods[i].category == category { data.foods[i].category = fallback }
            }
        }
    }
}
