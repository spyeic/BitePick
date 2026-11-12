import SwiftUI
import UIKit
import BitePickCore

struct PickView: View {
    @Environment(BiteStore.self) private var store
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var category: String?
    @State private var quick = false
    @State private var rotation = 0.0
    @State private var spinning = false
    @State private var skipped: Set<String> = []
    @State private var frozenFoods: [Food] = []
    @State private var quickFood: Food?
    @State private var result: Food?
    @State private var retry = false
    @State private var task: Task<Void, Never>?
    private var candidates: [Food] { PickEngine.eligible(store.data, category: category, skipped: skipped) }
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                VStack(spacing: 10) {
                    Text(store.t("今天，吃点什么？", "What should we eat?"))
                        .font(.system(size: 35, weight: .medium, design: .serif)).minimumScaleFactor(0.7).lineLimit(1)
                    Text(store.t("把纠结留给我们，把美味留给你。", "Too many choices? Let BitePick decide."))
                        .font(.subheadline).foregroundStyle(.secondary)
                }.padding(.top, 12)
                Picker(store.t("选择模式", "Pick mode"), selection: $quick) {
                    Text(store.t("美食转盘", "Spin the wheel")).tag(false)
                    Text(store.t("快速选择", "Quick pick")).tag(true)
                }.pickerStyle(.segmented).disabled(spinning)
                HStack {
                    Menu {
                        Button(store.t("全部美食", "All foods")) { category = nil }
                        ForEach(store.data.categories, id: \.self) { value in Button(store.categoryName(value)) { category = value } }
                    } label: { Label(category.map { store.categoryName($0) } ?? store.t("全部美食", "All foods"), systemImage: "line.3.horizontal.decrease") }
                        .buttonStyle(.glass).disabled(spinning)
                    Spacer()
                    Text(store.t("\(candidates.count) 道候选", "\(candidates.count) options")).font(.caption).foregroundStyle(.secondary)
                }
                if candidates.isEmpty && !spinning {
                    ContentUnavailableView {
                        Label(store.data.foods.isEmpty ? store.t("从一道喜欢的美食开始", "Start with a craving") : store.t("暂时没有候选美食", "No eligible foods"), systemImage: "fork.knife.circle")
                    } description: {
                        Text(store.t("到美食页添加或启用选项，也可以调整分类和最近排除设置。", "Add or enable foods, or adjust your category and recent exclusions."))
                    } actions: {
                        Button(store.t("重置筛选条件", "Reset filters")) { category = nil; skipped.removeAll(); store.update { $0.settings.avoidRecent = 0 } }.buttonStyle(.glass)
                    }
                } else if quick {
                    GlassCard {
                        VStack(spacing: 18) {
                            Text(quickFood?.emoji ?? "🍽️").font(.system(size: 84))
                            Text(quickFood.map { store.foodName($0) } ?? store.t("下一口惊喜", "Your next delicious thing"))
                                .font(.title2.weight(.semibold)).contentTransition(.opacity).multilineTextAlignment(.center)
                            Text(store.t("一点随机，更多美味。", "A little chance. A lot of flavor.")).font(.subheadline).foregroundStyle(.secondary)
                        }.frame(maxWidth: .infinity).frame(minHeight: 240)
                    }
                } else {
                    WheelView(foods: spinning ? frozenFoods : candidates, rotation: rotation).frame(maxWidth: 390)
                }
                Button(action: start) {
                    Label(spinning ? store.t("美味正在揭晓…", "Finding something delicious…") : store.t("帮我选！", "Pick for me!"), systemImage: spinning ? "sparkle" : "shuffle")
                        .font(.headline).frame(maxWidth: .infinity).padding(.vertical, 12)
                }.buttonStyle(.glassProminent).buttonBorderShape(.capsule).disabled(spinning || candidates.isEmpty)
                if !skipped.isEmpty {
                    Button(store.t("恢复暂时排除的美食", "Restore skipped foods")) { skipped.removeAll() }.font(.footnote).disabled(spinning)
                }
                if let latest = store.data.history.first {
                    HStack(spacing: 12) {
                        Text(latest.emoji).font(.title2)
                        VStack(alignment: .leading, spacing: 3) {
                            Text(store.t("最近的美味", "Last on your plate")).font(.caption).foregroundStyle(.secondary)
                            Text(store.foodName(id: latest.foodId, name: latest.name)).font(.subheadline.weight(.medium))
                        }
                        Spacer()
                        Image(systemName: "clock").foregroundStyle(.secondary)
                    }.padding(16).background(.thinMaterial, in: RoundedRectangle(cornerRadius: 20))
                }
            }.padding(.horizontal, 24).padding(.bottom, 30)
        }
        .bitePage().navigationTitle("BitePick").navigationBarTitleDisplayMode(.inline)
        .toolbar { ToolbarItem(placement: .topBarTrailing) {
            Menu {
                ForEach([0, 1, 3, 5], id: \.self) { count in
                    Button(count == 0 ? store.t("关闭最近排除", "Allow recent picks") : store.t("避开最近 \(count) 次", "Avoid last \(count) picks")) { store.update { $0.settings.avoidRecent = count } }
                }
            } label: { Image(systemName: "clock.arrow.circlepath") }.disabled(spinning).accessibilityLabel(store.t("最近排除设置", "Recent exclusions"))
        } }
        .sheet(item: $result, onDismiss: { if retry { retry = false; start() } }) { food in
            ResultView(food: food, confirm: { store.confirm(food); result = nil }, retry: { retry = true; result = nil }, skip: { skipped.insert(food.id); result = nil })
                .presentationDetents([.medium, .large]).presentationDragIndicator(.visible)
        }
        .onDisappear { task?.cancel(); spinning = false; result = nil; retry = false }
    }
    private func start() {
        guard !spinning else { return }
        let pool = candidates
        guard let winner = PickEngine.pick(pool) else { return }
        frozenFoods = pool; spinning = true
        let reduced = reduceMotion || store.data.settings.reducedMotion
        let groups = PickEngine.groups(pool)
        let index = groups.firstIndex { $0.contains(where: { $0.id == winner.id }) } ?? 0
        let target = PickEngine.rotation(current: rotation, index: index, count: groups.count)
        if !quick { withAnimation(reduced ? nil : .timingCurve(0.12, 0.75, 0.14, 1, duration: 4.6)) { rotation = target } }
        task = Task { @MainActor in
            do {
                if quick && !reduced {
                    for step in 0..<22 {
                        quickFood = PickEngine.pick(pool)
                        try await Task.sleep(for: .milliseconds(55 + step * 9))
                    }
                } else { try await Task.sleep(for: .milliseconds(reduced ? 100 : 4600)) }
                try Task.checkCancellation()
                quickFood = winner; spinning = false; result = winner
                UINotificationFeedbackGenerator().notificationOccurred(.success)
            } catch { spinning = false }
        }
    }
}
private struct ResultView: View {
    let food: Food
    var confirm: () -> Void
    var retry: () -> Void
    var skip: () -> Void
    @Environment(BiteStore.self) private var store
    var body: some View {
        VStack(spacing: 20) {
            Text(store.t("这次就吃…", "Tonight’s pick is…")).font(.subheadline).foregroundStyle(.secondary)
            Text(food.emoji).font(.system(size: 64))
            Text(store.foodName(food)).font(.largeTitle.bold()).multilineTextAlignment(.center)
            Text(store.categoryName(food.category)).font(.subheadline).foregroundStyle(.secondary)
            Button(action: confirm) { Label(store.t("就吃这个！", "Let’s eat!"), systemImage: "checkmark").frame(maxWidth: .infinity).padding(8) }.buttonStyle(.glassProminent)
            HStack {
                Button(store.t("再选一次", "Try again"), action: retry).frame(maxWidth: .infinity)
                Button(store.t("暂时排除", "Remove for now"), action: skip).frame(maxWidth: .infinity)
            }.buttonStyle(.glass)
        }.padding(28).frame(maxWidth: .infinity, maxHeight: .infinity).background { BiteBackground() }
    }
}
