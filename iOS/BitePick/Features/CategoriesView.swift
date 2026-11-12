import SwiftUI

struct CategoriesView: View {
    @Environment(BiteStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    @State private var editing: String?
    @State private var name = ""
    @State private var showEditor = false
    @State private var deleting: String?
    var body: some View {
        List {
            ForEach(store.data.categories, id: \.self) { category in
                HStack {
                    Text(store.categoryName(category))
                    Spacer()
                    Text("\(store.data.foods.filter { $0.category == category }.count)").foregroundStyle(.secondary)
                    Button { editing = category; name = category; showEditor = true } label: { Image(systemName: "pencil") }.buttonStyle(.borderless).accessibilityLabel(store.t("重命名 ", "Rename ") + store.categoryName(category))
                }
                .swipeActions { Button(role: .destructive) { deleting = category } label: { Label(store.t("删除", "Delete"), systemImage: "trash") } }
            }
        }.bitePage().navigationTitle(store.t("分类管理", "Categories"))
        .toolbar {
            ToolbarItem(placement: .confirmationAction) { Button(store.t("完成", "Done")) { dismiss() } }
            ToolbarItem(placement: .topBarLeading) { Button { editing = nil; name = ""; showEditor = true } label: { Image(systemName: "plus") }.accessibilityLabel(store.t("添加分类", "Add category")) }
        }
        .alert(store.t("分类名称", "Category name"), isPresented: $showEditor) {
            TextField(store.t("名称", "Name"), text: $name)
            Button(store.t("取消", "Cancel"), role: .cancel) {}
            Button(store.t("保存", "Save")) {
                let clean = name.trimmingCharacters(in: .whitespacesAndNewlines)
                if let editing { _ = store.renameCategory(editing, to: clean) } else { store.update { $0.categories.append(clean) } }
            }.disabled(name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
        } message: { Text(store.t("最多 32 字，分类名称不能重复。", "Use a unique name, up to 32 characters.")) }
        .confirmationDialog(store.t("删除此分类？美食会移至其他分类，历史记录保留。", "Delete category? Foods will be moved; history is kept."), isPresented: Binding(get: { deleting != nil }, set: { if !$0 { deleting = nil } }), titleVisibility: .visible) {
            Button(store.t("删除分类", "Delete category"), role: .destructive) { if let deleting { store.deleteCategory(deleting) }; deleting = nil }
        }
    }
}
