// SwiftUI 应用外壳：窗口、主题、首页与地铁页。
// 六页流程与 Web 端一致；所有状态转移都走 AirportUI 的 AppModel（已被 swift test 覆盖）。

import SwiftUI
import AirportCore
import AirportUI

@main
struct AirportGuideApp: App {
  var body: some Scene {
    WindowGroup {
      RootView()
        .frame(minWidth: 380, minHeight: 640)
    }
    .defaultSize(width: 430, height: 920)
  }
}

/// 把 AppModel 包一层，用 revision 触发 SwiftUI 重绘
final class ModelObserver: ObservableObject {
  let model: AppModel
  @Published private(set) var revision = 0

  init(_ model: AppModel = AppModel()) {
    self.model = model
  }

  func perform(_ body: (AppModel) -> Void) {
    body(model)
    revision += 1
  }
}

/// 设计令牌（来自 ArkTS 的 Theme.ets，经 export_shared.py 导出）
enum Theme {
  private static var tokens: Tokens { AirportGraph.shared.bundle.tokens }

  static func app(_ key: String, _ fallback: String) -> Color {
    Color(hex: tokens.APP[key] ?? fallback) ?? .black
  }

  static var bg: Color { app("bg", "#F4F7F9") }
  static var card: Color { app("card", "#FFFFFF") }
  static var card2: Color { app("card2", "#E9F3F2") }
  static var line: Color { app("line", "#DFE7EB") }
  static var text: Color { app("text", "#172B3A") }
  static var sub: Color { app("sub", "#657582") }
  static var accent: Color { app("accent", "#007F7A") }
  static var accentSoft: Color { app("accentSoft", "#D5EEEB") }
  static var gold: Color { app("gold", "#B86A12") }

  static let cardRadius: CGFloat = 16
  static let touch: CGFloat = 48
}

// MARK: - 通用组件

struct Header: View {
  let title: String
  let brand: String
  let langLabel: String
  var onBack: (() -> Void)?
  var onToggleLanguage: () -> Void

  var body: some View {
    HStack(spacing: 10) {
      if let onBack {
        Button(action: onBack) {
          Image(systemName: "chevron.left")
            .font(.system(size: 16, weight: .semibold))
            .frame(width: 36, height: 36)
            .background(Theme.card, in: Circle())
            .overlay(Circle().stroke(Theme.line))
        }
        .buttonStyle(.plain)
        .accessibilityLabel("back")
      } else {
        Text(brand).font(.system(size: 15, weight: .bold)).foregroundStyle(Theme.accent)
      }
      Text(title).font(.system(size: 19, weight: .bold)).foregroundStyle(Theme.text)
      Spacer()
      Button(action: onToggleLanguage) {
        Text(langLabel)
          .font(.system(size: 13, weight: .semibold))
          .frame(width: 36, height: 36)
          .background(Theme.card, in: Circle())
          .overlay(Circle().stroke(Theme.line))
      }
      .buttonStyle(.plain)
      .accessibilityLabel("language")
    }
    .padding(.top, 12)
  }
}

struct SectionTitle: View {
  let text: String
  var body: some View {
    Text(text)
      .font(.system(size: 14, weight: .bold))
      .foregroundStyle(Theme.sub)
      .frame(maxWidth: .infinity, alignment: .leading)
      .padding(.top, 6)
  }
}

struct PrimaryCard: View {
  let icon: String
  let title: String
  var subtitle: String?
  var isPrimary = false
  let action: () -> Void

  var body: some View {
    Button(action: action) {
      HStack(spacing: 14) {
        Text(icon)
          .font(.system(size: 18))
          .frame(width: 34, height: 34)
          .background(isPrimary ? Color.white.opacity(0.2) : Theme.accentSoft, in: RoundedRectangle(cornerRadius: 11))
          .foregroundStyle(isPrimary ? Color.white : Theme.accent)
        VStack(alignment: .leading, spacing: 2) {
          Text(title).font(.system(size: 17, weight: .semibold))
          if let subtitle {
            Text(subtitle).font(.system(size: 13)).foregroundStyle(isPrimary ? Color.white.opacity(0.85) : Theme.sub)
          }
        }
        Spacer()
      }
      .padding(14)
      .frame(minHeight: Theme.touch)
      .background(isPrimary ? Theme.accent : Theme.card, in: RoundedRectangle(cornerRadius: Theme.cardRadius))
      .overlay(RoundedRectangle(cornerRadius: Theme.cardRadius).stroke(isPrimary ? Theme.accent : Theme.line))
      .foregroundStyle(isPrimary ? Color.white : Theme.text)
    }
    .buttonStyle(.plain)
  }
}

struct QuickCard: View {
  let title: String
  let subtitle: String
  let action: () -> Void

  var body: some View {
    Button(action: action) {
      VStack(alignment: .leading, spacing: 2) {
        Text(title).font(.system(size: 15, weight: .semibold)).foregroundStyle(Theme.text)
        Text(subtitle).font(.system(size: 12)).foregroundStyle(Theme.sub)
      }
      .padding(12)
      .frame(maxWidth: .infinity, minHeight: Theme.touch, alignment: .leading)
      .background(Theme.card, in: RoundedRectangle(cornerRadius: 14))
      .overlay(RoundedRectangle(cornerRadius: 14).stroke(Theme.line))
    }
    .buttonStyle(.plain)
  }
}

struct ChipRow: View {
  let items: [Chip]
  let activeKey: String
  let onSelect: (String) -> Void

  var body: some View {
    ScrollView(.horizontal, showsIndicators: false) {
      HStack(spacing: 8) {
        ForEach(items) { item in
          Button { onSelect(item.key) } label: {
            Text(item.label)
              .font(.system(size: 13, weight: .semibold))
              .padding(.horizontal, 14)
              .frame(height: 36)
              .background(item.key == activeKey ? Theme.accent : Theme.card, in: Capsule())
              .overlay(Capsule().stroke(item.key == activeKey ? Theme.accent : Theme.line))
              .foregroundStyle(item.key == activeKey ? Color.white : Theme.sub)
          }
          .buttonStyle(.plain)
        }
      }
      .padding(.vertical, 2)
    }
  }
}

struct PlaceRow: View {
  let title: String
  let subtitle: String
  let action: () -> Void

  var body: some View {
    Button(action: action) {
      HStack(spacing: 12) {
        Circle().fill(Theme.card2).frame(width: 30, height: 30)
          .overlay(Image(systemName: "mappin").font(.system(size: 13)).foregroundStyle(Theme.accent))
        VStack(alignment: .leading, spacing: 1) {
          Text(title).font(.system(size: 15, weight: .semibold)).foregroundStyle(Theme.text)
          Text(subtitle).font(.system(size: 12)).foregroundStyle(Theme.sub)
        }
        Spacer()
        Image(systemName: "chevron.right").font(.system(size: 13)).foregroundStyle(Theme.sub)
      }
      .padding(.horizontal, 14)
      .frame(minHeight: Theme.touch)
      .background(Theme.card, in: RoundedRectangle(cornerRadius: 14))
      .overlay(RoundedRectangle(cornerRadius: 14).stroke(Theme.line))
    }
    .buttonStyle(.plain)
  }
}

// MARK: - 根视图

struct RootView: View {
  @StateObject private var obs = ModelObserver()

  var body: some View {
    let model = obs.model
    let state = model.state
    let _ = obs.revision

    ScrollView {
      VStack(alignment: .leading, spacing: 12) {
        switch state.view {
        case .home: HomeView(obs: obs)
        case .target: TargetView(obs: obs)
        case .start: StartView(obs: obs)
        case .route: RoutePageView(obs: obs)
        case .metro: MetroView(obs: obs)
        case .browse: BrowseView(obs: obs)
        }
      }
      .padding(.horizontal, 16)
      .padding(.bottom, 28)
    }
    .background(Theme.bg)
    .overlay(alignment: .bottom) {
      if !state.toast.isEmpty {
        Text(state.toast)
          .font(.system(size: 14))
          .padding(.horizontal, 18)
          .padding(.vertical, 10)
          .background(Color(hex: "#172B3A")?.opacity(0.92) ?? .black, in: Capsule())
          .foregroundStyle(.white)
          .padding(.bottom, 26)
      }
    }
  }
}

// MARK: - 首页

struct HomeView: View {
  let obs: ModelObserver

  var body: some View {
    let model = obs.model
    let state = model.state
    let en = state.isEn

    Header(
      title: I18n.t("brand", en: en),
      brand: I18n.t("brand", en: en),
      langLabel: en ? "中" : "EN",
      onToggleLanguage: { obs.perform { $0.toggleLanguage() } }
    )

    Text(I18n.t("home_title", en: en))
      .font(.system(size: 28, weight: .bold))
      .foregroundStyle(Theme.text)
    Text(I18n.t("home_sub", en: en))
      .font(.system(size: 14))
      .foregroundStyle(Theme.sub)

    PrimaryCard(icon: "✈", title: I18n.t("go_gate", en: en), isPrimary: true) {
      obs.perform { $0.startTargetFlow(category: "gate") }
    }
    PrimaryCard(icon: "◆", title: I18n.t("go_metro", en: en)) {
      obs.perform { $0.startMetroFlow() }
    }
    PrimaryCard(icon: "☕", title: I18n.t("go_service", en: en)) {
      obs.perform { $0.startTargetFlow(category: "service") }
    }

    SectionTitle(text: I18n.t("popular", en: en))
    LazyVGrid(columns: [GridItem(.adaptive(minimum: 150), spacing: 10)], spacing: 10) {
      ForEach(Presenter.popularCards(en: en)) { card in
        QuickCard(title: card.title, subtitle: card.subtitle) {
          obs.perform { $0.chooseDestinationFromHome(card.id) }
        }
      }
    }

    if !state.recent.isEmpty {
      SectionTitle(text: I18n.t("recent", en: en))
      let recent = state.recent.compactMap { model.node($0) }
      ForEach(recent, id: \.id) { node in
        PlaceRow(title: Presenter.rowTitle(node, en: en),
                 subtitle: Presenter.rowSubtitle(node, en: en)) {
          obs.perform { $0.chooseDestinationFromHome(node.id) }
        }
      }
    }

    HStack(spacing: 10) {
      Button { obs.perform { $0.openBrowse() } } label: {
        Text(I18n.t("floors", en: en)).frame(maxWidth: .infinity, minHeight: Theme.touch)
      }
      .buttonStyle(SecondaryButtonStyle())

      Button { obs.perform { $0.openBrowseForDestination() } } label: {
        Text(I18n.t("view_map", en: en)).frame(maxWidth: .infinity, minHeight: Theme.touch)
      }
      .buttonStyle(SecondaryButtonStyle())
    }
    .padding(.top, 4)

    Text(I18n.t("sample", en: en))
      .font(.system(size: 12))
      .foregroundStyle(Theme.sub)
      .padding(.top, 6)
  }
}

struct SecondaryButtonStyle: ButtonStyle {
  func makeBody(configuration: Configuration) -> some View {
    configuration.label
      .font(.system(size: 15, weight: .semibold))
      .foregroundStyle(Theme.text)
      .background(Theme.card, in: RoundedRectangle(cornerRadius: 14))
      .overlay(RoundedRectangle(cornerRadius: 14).stroke(Theme.line))
      .opacity(configuration.isPressed ? 0.7 : 1)
  }
}

struct PrimaryButtonStyle: ButtonStyle {
  func makeBody(configuration: Configuration) -> some View {
    configuration.label
      .font(.system(size: 15, weight: .semibold))
      .foregroundStyle(.white)
      .background(Theme.accent, in: RoundedRectangle(cornerRadius: 14))
      .opacity(configuration.isPressed ? 0.8 : 1)
  }
}

// MARK: - 地铁

struct MetroView: View {
  let obs: ModelObserver

  var body: some View {
    let en = obs.model.state.isEn

    Header(
      title: I18n.t("metro_title", en: en),
      brand: I18n.t("brand", en: en),
      langLabel: en ? "中" : "EN",
      onBack: { obs.perform { $0.backHome() } },
      onToggleLanguage: { obs.perform { $0.toggleLanguage() } }
    )

    Text(I18n.t("metro_heading", en: en)).font(.system(size: 22, weight: .bold)).foregroundStyle(Theme.text)
    Text(I18n.t("metro_hint", en: en)).font(.system(size: 13)).foregroundStyle(Theme.sub)

    ForEach(Presenter.metroDirections(en: en)) { direction in
      PrimaryCard(icon: "◆", title: direction.title, subtitle: direction.subtitle) {
        obs.perform { $0.chooseMetroDirection(targetId: direction.targetId) }
      }
    }

    SectionTitle(text: I18n.t("metro_steps", en: en))
    let metroSteps = Presenter.metroSteps(en: en)
    ForEach(Array(metroSteps.indices), id: \.self) { index in
      HStack(alignment: .top, spacing: 8) {
        Text("\(index + 1).").font(.system(size: 14, weight: .semibold)).foregroundStyle(Theme.accent)
        Text(metroSteps[index]).font(.system(size: 14)).foregroundStyle(Theme.sub)
      }
    }
  }
}
