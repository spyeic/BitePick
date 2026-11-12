import SwiftUI

extension Color {
    static let biteOrange = Color(red: 0.82, green: 0.36, blue: 0.22)
}
struct BiteBackground: View {
    @Environment(\.colorScheme) private var scheme
    var body: some View {
        LinearGradient(colors: scheme == .dark ? [Color(red: 0.14, green: 0.12, blue: 0.14), Color(red: 0.09, green: 0.10, blue: 0.12), Color(red: 0.14, green: 0.13, blue: 0.12)] : [Color(red: 1, green: 0.88, blue: 0.79), Color(red: 1, green: 0.96, blue: 0.88), Color(red: 0.91, green: 0.94, blue: 0.87)], startPoint: .topLeading, endPoint: .bottomTrailing)
            .ignoresSafeArea()
    }
}
struct GlassCard<Content: View>: View {
    @ViewBuilder var content: Content
    var body: some View { content.padding(20).background(.regularMaterial, in: RoundedRectangle(cornerRadius: 28)).overlay { RoundedRectangle(cornerRadius: 28).strokeBorder(.primary.opacity(0.06)) } }
}
extension View {
    func bitePage() -> some View { scrollContentBackground(.hidden).background { BiteBackground() } }
}
