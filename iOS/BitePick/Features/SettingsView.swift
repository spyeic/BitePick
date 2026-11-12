import SwiftUI
import UniformTypeIdentifiers
import BitePickCore

private struct MenuDocument: FileDocument {
    static var readableContentTypes: [UTType] { [.json] }
    var bytes: Data
    init(bytes: Data) { self.bytes = bytes }
    init(configuration: ReadConfiguration) throws { bytes = configuration.file.regularFileContents ?? Data() }
    func fileWrapper(configuration: WriteConfiguration) throws -> FileWrapper { FileWrapper(regularFileWithContents: bytes) }
}
struct SettingsView: View {
    @Environment(BiteStore.self) private var store
    @State private var importing = false
    @State private var exporting = false
    @State private var document = MenuDocument(bytes: Data())
    @State private var pending: AppData?
    @State private var importError: String?
    private func binding<T>(_ key: WritableKeyPath<Preferences, T>) -> Binding<T> {
        Binding(get: { store.data.settings[keyPath: key] }, set: { value in store.update { $0.settings[keyPath: key] = value } })
    }
    var body: some View {
        Form {
            Section(store.t("按照你的喜好", "Make yourself at home")) {
                Picker(store.t("语言", "Language"), selection: binding(\.language)) { Text("简体中文").tag(Language.zh); Text("English").tag(Language.en) }
                Picker(store.t("外观", "Appearance"), selection: binding(\.theme)) {
                    Text(store.t("浅色", "Light")).tag(Appearance.light)
                    Text(store.t("深色", "Dark")).tag(Appearance.dark)
                    Text(store.t("系统", "System")).tag(Appearance.system)
                }.pickerStyle(.segmented)
            }
            Section {
                Toggle(store.t("减少动态效果", "Reduce motion"), isOn: binding(\.reducedMotion))
                Picker(store.t("避开最近吃过的", "Avoid recent picks"), selection: binding(\.avoidRecent)) {
                    ForEach([0, 1, 3, 5], id: \.self) { count in Text(count == 0 ? store.t("关闭", "Off") : store.t("最近 \(count) 次", "Last \(count) picks")).tag(count) }
                }
            } header: { Text(store.t("选择偏好", "Picking preferences")) } footer: { Text(store.t("始终遵循设备的「减少动态效果」设置。", "Your device’s reduced-motion setting is always respected.")) }
            Section {
                LabeledContent(store.t("美食 / 分类 / 历史", "Foods / categories / history"), value: "\(store.data.foods.count) / \(store.data.categories.count) / \(store.data.history.count)")
                Button { exportMenu() } label: { Label(store.t("导出 JSON", "Export JSON"), systemImage: "square.and.arrow.up") }
                Button { importError = nil; importing = true } label: { Label(store.t("导入 JSON", "Import JSON"), systemImage: "square.and.arrow.down") }
                if let importError { Text(importError).font(.footnote).foregroundStyle(.red).accessibilityLabel(store.t("导入错误：", "Import error: ") + importError) }
            } header: { Text(store.t("把菜单随身带走", "Your menu, to go")) } footer: {
                Text(store.t("支持 BitePick 网页版的 JSON 备份。导入前请先导出当前菜单。", "Compatible with BitePick web exports. Export a backup before importing."))
            }
            Section {
                Label(store.t("无需登录，离线可用", "No accounts. Works offline."), systemImage: "checkmark.shield")
                Text(store.t("数据保存在此 iPhone 的 App 中，不会自动与网页版或其他设备同步。", "Data lives in this app on your iPhone. Web and other devices do not automatically sync.")).font(.footnote).foregroundStyle(.secondary)
            }
            HStack { Spacer(); Text("BitePick · 1.0").font(.caption).foregroundStyle(.secondary); Spacer() }.listRowBackground(Color.clear)
        }.bitePage().navigationTitle(store.t("设置", "Settings"))
        .fileImporter(isPresented: $importing, allowedContentTypes: [.json]) { result in
            do {
                let url = try result.get()
                let scoped = url.startAccessingSecurityScopedResource()
                defer { if scoped { url.stopAccessingSecurityScopedResource() } }
                let size = try url.resourceValues(forKeys: [.fileSizeKey]).fileSize ?? 0
                guard size <= DataCodec.maxBytes else { throw DataError.oversized }
                pending = try DataCodec.decode(Data(contentsOf: url))
            } catch {
                if (error as NSError).code != CocoaError.userCancelled.rawValue {
                    importError = store.t("无法导入，当前数据未改变。", "Import failed; your data is unchanged. ") + " " + error.localizedDescription
                }
            }
        }
        .confirmationDialog(store.t("替换当前菜单和设置？", "Replace your menu and settings?"), isPresented: Binding(get: { pending != nil }, set: { if !$0 { pending = nil } }), titleVisibility: .visible) {
            Button(store.t("导入并替换", "Import and replace"), role: .destructive) { if let pending { store.replace(pending) }; pending = nil }
        } message: {
            Text(store.t("包含 \(pending?.foods.count ?? 0) 道美食、\(pending?.history.count ?? 0) 条历史。建议先备份。", "Contains \(pending?.foods.count ?? 0) foods and \(pending?.history.count ?? 0) history records. Export a backup first."))
        }
        .fileExporter(isPresented: $exporting, document: document, contentType: .json, defaultFilename: "bitepick-menu") { result in
            if case .failure(let error) = result, (error as NSError).code != CocoaError.userCancelled.rawValue { store.message = error.localizedDescription }
        }
    }
    private func exportMenu() {
        do { document = MenuDocument(bytes: try DataCodec.encode(store.data)); exporting = true }
        catch { store.message = error.localizedDescription }
    }
}
