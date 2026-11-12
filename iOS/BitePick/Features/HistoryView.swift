import SwiftUI
import BitePickCore

struct HistoryView: View {
    @Environment(BiteStore.self) private var store
    @State private var deleting: Set<String> = []
    private var days: [Date] { Array(Set(store.data.history.compactMap { timestamp($0.pickedAt).map { Calendar.current.startOfDay(for: $0) } })).sorted(by: >) }
    var body: some View {
        List {
            if store.data.history.isEmpty {
                ContentUnavailableView(store.t("美味的故事，从这一餐开始", "Your food story starts here"), systemImage: "clock.badge.checkmark", description: Text(store.t("选择美食后，点击「就吃这个！」才会记录。", "Only confirmed picks appear in your history."))).listRowBackground(Color.clear)
            } else {
                Section {
                    HStack {
                        Label("\(store.data.history.count)", systemImage: "fork.knife")
                        Spacer()
                        Text(store.t("次美味决定", "delicious decisions")).foregroundStyle(.secondary)
                    }
                }.listRowBackground(Color.clear)
                ForEach(days, id: \.self) { day in
                    let entries = store.data.history.filter { timestamp($0.pickedAt).map { Calendar.current.isDate($0, inSameDayAs: day) } ?? false }
                    Section(day.formatted(Date.FormatStyle(date: .abbreviated, time: .omitted).locale(Locale(identifier: store.language == .zh ? "zh_CN" : "en_US")))) {
                        ForEach(entries) { record in
                            HStack(spacing: 14) {
                                Text(record.emoji).font(.largeTitle)
                                VStack(alignment: .leading, spacing: 5) {
                                    Text(store.foodName(id: record.foodId, name: record.name)).font(.headline)
                                    Text(store.categoryName(record.category)).font(.caption).foregroundStyle(.secondary)
                                }
                                Spacer()
                                if let date = timestamp(record.pickedAt) { Text(date, style: .time).font(.caption).foregroundStyle(.secondary) }
                            }.padding(.vertical, 6)
                        }.onDelete { offsets in deleting = Set(offsets.map { entries[$0].id }) }
                    }
                }
            }
        }.bitePage().navigationTitle(store.t("美食回忆", "Pick history"))
        .toolbar { ToolbarItem(placement: .topBarTrailing) {
            Button(role: .destructive) { deleting = Set(store.data.history.map(\.id)) } label: { Image(systemName: "trash") }
                .disabled(store.data.history.isEmpty).accessibilityLabel(store.t("清空历史", "Clear history"))
        } }
        .confirmationDialog(store.t("删除这些记录？", "Delete these memories?"), isPresented: Binding(get: { !deleting.isEmpty }, set: { if !$0 { deleting.removeAll() } }), titleVisibility: .visible) {
            Button(store.t("删除记录", "Delete records"), role: .destructive) { let ids = deleting; store.update { $0.history.removeAll { ids.contains($0.id) } }; deleting.removeAll() }
        } message: { Text(store.t("删除记录也会更新最近排除的候选项。", "Removing records also updates recent-pick exclusions.")) }
    }
}
