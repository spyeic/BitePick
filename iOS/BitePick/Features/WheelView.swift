import SwiftUI
import BitePickCore

private struct Slice: Shape {
    let index: Int
    let count: Int
    func path(in rect: CGRect) -> Path {
        if count == 1 { return Path(ellipseIn: rect) }
        let step = 360 / Double(count)
        let center = CGPoint(x: rect.midX, y: rect.midY)
        var path = Path(); path.move(to: center)
        path.addArc(center: center, radius: rect.width / 2, startAngle: .degrees(-90 + Double(index) * step - step / 2), endAngle: .degrees(-90 + Double(index) * step + step / 2), clockwise: false)
        path.closeSubpath(); return path
    }
}
struct WheelView: View, Animatable {
    let foods: [Food]
    nonisolated var rotation: Double
    @Environment(BiteStore.self) private var store
    @Environment(\.colorScheme) private var scheme

    nonisolated var animatableData: Double {
        get { rotation }
        set { rotation = newValue }
    }

    var body: some View {
        GeometryReader { geometry in
            let size = geometry.size.width
            let groups = PickEngine.groups(foods)
            let colors: [Color] = scheme == .dark ? [Color(red: 0.30, green: 0.25, blue: 0.23), Color(red: 0.30, green: 0.28, blue: 0.24), Color(red: 0.30, green: 0.24, blue: 0.24)] : [Color(red: 0.95, green: 0.86, blue: 0.80), Color(red: 0.97, green: 0.91, blue: 0.82), Color(red: 0.94, green: 0.87, blue: 0.84)]
            ZStack {
                Canvas { context, canvasSize in
                    guard !groups.isEmpty else { return }
                    let bounds = CGRect(origin: .zero, size: canvasSize)
                    let center = CGPoint(x: bounds.midX, y: bounds.midY)
                    let step = 360 / Double(groups.count)

                    // Keep the canvas stationary and rotate only its drawing coordinates.
                    var disc = context
                    disc.clip(to: Path(ellipseIn: bounds))
                    disc.translateBy(x: center.x, y: center.y)
                    disc.rotate(by: .degrees(rotation))
                    disc.translateBy(x: -center.x, y: -center.y)
                    for index in groups.indices {
                        let sector = Slice(index: index, count: groups.count).path(in: bounds)
                        disc.fill(sector, with: .color(colors[index % colors.count]))
                        disc.stroke(sector, with: .color(.primary.opacity(0.06)), lineWidth: 0.8)
                    }

                    for index in groups.indices {
                        guard let label = disc.resolveSymbol(id: index) else { continue }
                        var labelContext = disc
                        labelContext.translateBy(x: center.x, y: center.y)
                        labelContext.rotate(by: .degrees(Double(index) * step))
                        labelContext.draw(label, at: CGPoint(x: 0, y: -size * 0.35))
                    }
                } symbols: {
                    ForEach(Array(groups.enumerated()), id: \.offset) { index, group in
                        VStack(spacing: 3) {
                            Text(group[0].emoji).font(.system(size: size * 0.068))
                            Text(group.count == 1 ? store.foodName(group[0]) : store.t("\(group.count) 道美食", "\(group.count) favorites"))
                                .font(.system(size: size * (groups.count > 9 ? 0.029 : 0.035), weight: .medium)).lineLimit(2).multilineTextAlignment(.center)
                        }
                        .frame(width: size * 0.24)
                        .tag(index)
                    }
                }
                Circle().fill(scheme == .dark ? Color(red: 0.20, green: 0.18, blue: 0.17) : Color(red: 0.99, green: 0.94, blue: 0.86)).frame(width: size * 0.25)
                    .overlay { Image(systemName: "fork.knife").font(.system(size: size * 0.075, weight: .light)).foregroundStyle(.secondary) }
                Image(systemName: "arrowtriangle.down.fill").font(.system(size: 29)).foregroundStyle(Color.biteOrange).offset(y: -size / 2 + 2)
            }
            .padding(7).background(scheme == .dark ? Color.white.opacity(0.05) : Color.white.opacity(0.45), in: Circle())
        }
        .aspectRatio(1, contentMode: .fit)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(store.t("美食转盘，\(foods.count) 个候选项", "Food wheel, \(foods.count) options"))
    }
}
