import SwiftUI
import BitePickCore

@main struct BitePickApp: App {
    @State private var store = BiteStore()
    var body: some Scene {
        WindowGroup {
            RootView().environment(store)
                .tint(.biteOrange)
                .preferredColorScheme(store.data.settings.theme == .system ? nil : store.data.settings.theme == .dark ? .dark : .light)
                .environment(\.locale, Locale(identifier: store.language == .zh ? "zh_CN" : "en_US"))
                .alert(store.t("温馨提示", "A little update"), isPresented: Binding(get: { store.message != nil }, set: { if !$0 { store.message = nil } })) {
                    Button(store.t("知道了", "OK")) { store.message = nil }
                } message: { Text(store.message ?? "") }
        }
    }
}
struct RootView: View {
    @Environment(BiteStore.self) private var store
    var body: some View {
        TabView {
            Tab(store.t("帮我选", "Decide"), systemImage: "circle.hexagongrid.fill") { NavigationStack { PickView() } }
            Tab(store.t("美食", "My foods"), systemImage: "fork.knife") { NavigationStack { FoodsView() } }
            Tab(store.t("历史", "History"), systemImage: "clock") { NavigationStack { HistoryView() } }
            Tab(store.t("设置", "Settings"), systemImage: "slider.horizontal.3") { NavigationStack { SettingsView() } }
        }
    }
}
