import SwiftUI
import BitePickCore

struct FoodsView: View {
    @Environment(BiteStore.self) private var store
    @State private var search = ""
    @State private var category: String?
    @State private var editor: Food?
    @State private var categoriesOpen = false
    @State private var selection: Set<String> = []
    @State private var pendingDelete: Set<String> = []
    @State private var restore = false
    private var filtered: [Food] {
        store.data.foods.filter { (category == nil || category == $0.category) && (search.isEmpty || store.foodName($0).localizedCaseInsensitiveContains(search) || $0.name.localizedCaseInsensitiveContains(search)) }
    }
    var body: some View {
        List(selection: $selection) {
            Section {
                HStack {
                    Text(store.t("\(store.data.foods.filter(\.enabled).count) 道已启用", "\(store.data.foods.filter(\.enabled).count) enabled"))
                    Spacer()
                    Menu(category.map { store.categoryName($0) } ?? store.t("全部分类", "All categories")) {
                        Button(store.t("全部分类", "All categories")) { category = nil }
                        ForEach(store.data.categories, id: \.self) { value in Button(store.categoryName(value)) { category = value } }
                    }
                }.font(.subheadline).foregroundStyle(.secondary)
            }.listRowBackground(Color.clear)
            ForEach(filtered) { food in
                HStack(spacing: 14) {
                    Text(food.emoji).font(.system(size: 32)).frame(width: 44)
                    Button { editor = food } label: {
                        VStack(alignment: .leading, spacing: 5) {
                            Text(store.foodName(food)).font(.body.weight(.medium)).foregroundStyle(.primary)
                            Text(store.categoryName(food.category)).font(.caption).foregroundStyle(.secondary)
                        }.frame(maxWidth: .infinity, alignment: .leading)
                    }.buttonStyle(.plain).accessibilityLabel(store.t("编辑 ", "Edit ") + store.foodName(food))
                    Toggle(store.t("启用 ", "Enable ") + store.foodName(food), isOn: Binding(get: { food.enabled }, set: { enabled in store.update { data in if let i = data.foods.firstIndex(where: { $0.id == food.id }) { data.foods[i].enabled = enabled } } })).labelsHidden()
                }.padding(.vertical, 6).tag(food.id)
                    .swipeActions { Button(role: .destructive) { pendingDelete = [food.id] } label: { Label(store.t("删除", "Delete"), systemImage: "trash") } }
            }
            if filtered.isEmpty {
                ContentUnavailableView(store.t("还没有美食", "No foods here"), systemImage: "fork.knife", description: Text(store.t("添加喜欢的美食，或调整搜索与分类。", "Add a favorite or adjust your filters."))).listRowBackground(Color.clear)
            }
        }
        .bitePage().navigationTitle(store.t("我的美食", "My foods"))
        .searchable(text: $search, prompt: store.t("搜索美食", "Search foods"))
        .toolbar {
            ToolbarItem(placement: .topBarLeading) { EditButton() }
            ToolbarItemGroup(placement: .topBarTrailing) {
                Menu {
                    Button(store.t("管理分类", "Manage categories"), systemImage: "square.grid.2x2") { categoriesOpen = true }
                    Button(store.t("恢复默认菜单", "Restore defaults"), systemImage: "arrow.counterclockwise") { restore = true }
                } label: { Image(systemName: "ellipsis") }.accessibilityLabel(store.t("菜单操作", "Menu actions"))
                Button { editor = Food(name: "", emoji: "🍽️", category: store.data.categories.first ?? "Custom") } label: { Image(systemName: "plus") }.accessibilityLabel(store.t("添加美食", "Add food"))
            }
            ToolbarItem(placement: .bottomBar) {
                if !selection.isEmpty { Button(role: .destructive) { pendingDelete = selection } label: { Label(store.t("删除 \(selection.count) 道美食", "Delete \(selection.count) foods"), systemImage: "trash") } }
            }
        }
        .sheet(item: $editor) { food in NavigationStack { FoodEditor(food: food, displayName: store.foodName(food)) } }
        .sheet(isPresented: $categoriesOpen) { NavigationStack { CategoriesView() } }
        .confirmationDialog(store.t("删除选中的美食？", "Delete selected foods?"), isPresented: Binding(get: { !pendingDelete.isEmpty }, set: { if !$0 { pendingDelete.removeAll() } }), titleVisibility: .visible) {
            Button(store.t("删除", "Delete"), role: .destructive) { let ids = pendingDelete; store.update { $0.foods.removeAll { ids.contains($0.id) } }; selection.subtract(ids); pendingDelete.removeAll() }
            Button(store.t("取消", "Cancel"), role: .cancel) { pendingDelete.removeAll() }
        }
        .confirmationDialog(store.t("恢复默认菜单？自定义美食将被替换，历史记录保留。", "Restore defaults? Custom foods will be replaced; history is kept."), isPresented: $restore, titleVisibility: .visible) {
            Button(store.t("恢复默认", "Restore defaults"), role: .destructive) { store.update { $0.foods = AppData.defaults.foods; $0.categories = AppData.defaults.categories }; category = nil; selection.removeAll() }
        }
        .onChange(of: store.data.categories) { _, values in if let category, !values.contains(category) { self.category = nil } }
    }
}
struct FoodEditor: View {
    let food: Food
    let displayName: String
    @Environment(BiteStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    @State private var name: String
    @State private var emoji: String
    @State private var category: String
    @State private var newCategory = ""
    @State private var enabled: Bool
    private let emojis = ["🌶️", "🥟", "🫕", "🍣", "🍲", "🥩", "🍖", "🍛", "🍚", "🍝", "🍔", "🍜", "🍕", "🌮", "🥗", "🍗", "🍰", "🧋", "🥞", "🥑", "🍽️"]
    init(food: Food, displayName: String) {
        self.food = food; self.displayName = displayName
        _name = State(initialValue: displayName); _emoji = State(initialValue: food.emoji)
        _category = State(initialValue: food.category); _enabled = State(initialValue: food.enabled)
    }
    private var cleanName: String { name.trimmingCharacters(in: .whitespacesAndNewlines) }
    private var cleanCategory: String { newCategory.trimmingCharacters(in: .whitespacesAndNewlines) }
    private var valid: Bool { !cleanName.isEmpty && cleanName.utf16.count <= 60 && !emoji.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && emoji.utf16.count <= 20 && cleanCategory.utf16.count <= 32 && cleanCategory.lowercased() != "all" }
    var body: some View {
        Form {
            Section(store.t("美食名称", "Food name")) { TextField(store.t("今天想吃什么？", "What are you craving?"), text: $name) }
            Section(store.t("选择表情", "Choose an emoji")) {
                TextField(store.t("自定义表情", "Custom emoji"), text: $emoji).font(.title)
                LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 7), spacing: 12) {
                    ForEach(emojis, id: \.self) { value in Button { emoji = value } label: { Text(value).font(.title2).padding(4).background(emoji == value ? Color.biteOrange.opacity(0.16) : .clear, in: RoundedRectangle(cornerRadius: 10)) }.buttonStyle(.plain).accessibilityLabel(value).accessibilityAddTraits(emoji == value ? .isSelected : []) }
                }
            }
            Section(store.t("分类", "Category")) {
                Picker(store.t("已有分类", "Existing category"), selection: $category) {
                    ForEach(Array(Set(store.data.categories + [food.category])).sorted(), id: \.self) { value in Text(store.categoryName(value)).tag(value) }
                }
                TextField(store.t("或新建分类", "Or create a category"), text: $newCategory)
            }
            Section { Toggle(store.t("参与随机选择", "Include in picks"), isOn: $enabled) }
            if !valid { Text(store.t("名称最多 60 字，分类最多 32 字，请填写有效名称和表情。", "Enter a name (up to 60 characters), emoji, and category (up to 32 characters).")).font(.caption).foregroundStyle(.secondary) }
        }.bitePage().navigationTitle(store.t("编辑美食", "Edit food")).navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button(store.t("取消", "Cancel")) { dismiss() } }
                ToolbarItem(placement: .confirmationAction) { Button(store.t("保存", "Save")) {
                    var next = food; next.name = cleanName == displayName ? food.name : cleanName
                    next.emoji = emoji.trimmingCharacters(in: .whitespacesAndNewlines); next.enabled = enabled
                    next.category = cleanCategory.isEmpty ? category : (store.data.categories.first { $0.caseInsensitiveCompare(cleanCategory) == .orderedSame } ?? cleanCategory)
                    if store.save(next) { dismiss() }
                }.disabled(!valid) }
            }
    }
}
