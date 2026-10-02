// 目的地 / 出发位置 / 路线 / 楼层地图四页。

import SwiftUI
import AirportCore
import AirportUI

// MARK: - 选择列表（目的地与起点共用）

struct PickerList: View {
  let obs: ModelObserver
  let mode: AppView
  @State private var searchText = ""

  var body: some View {
    let model = obs.model
    let state = model.state
    let en = state.isEn
    let isTarget = mode == .target
    let category = isTarget ? state.category : "all"
    let query = isTarget ? state.query : searchText
    let places = Presenter.places(query: query, category: category)

    HStack(spacing: 8) {
      Image(systemName: "magnifyingglass").foregroundStyle(Theme.sub)
      TextField(I18n.t("search", en: en), text: Binding(
        get: { query },
        set: { value in
          if isTarget { obs.perform { $0.setQuery(value) } } else { searchText = value }
        }
      ))
      .textFieldStyle(.plain)
      .font(.system(size: 15))
      if !query.isEmpty {
        Button {
          if isTarget { obs.perform { $0.setQuery("") } } else { searchText = "" }
        } label: {
          Image(systemName: "xmark.circle.fill").foregroundStyle(Theme.sub)
        }
        .buttonStyle(.plain)
      }
    }
    .padding(.horizontal, 16)
    .frame(minHeight: Theme.touch)
    .background(Theme.card, in: Capsule())
    .overlay(Capsule().stroke(Theme.line))

    if places.isEmpty {
      VStack(spacing: 6) {
        Text(I18n.t("no_results", en: en)).font(.system(size: 17, weight: .semibold)).foregroundStyle(Theme.text)
        Text(I18n.t("no_results_hint", en: en)).font(.system(size: 13)).foregroundStyle(Theme.sub)
      }
      .frame(maxWidth: .infinity)
      .padding(.vertical, 28)
    } else {
      ForEach(places, id: \.id) { node in
        PlaceRow(title: Presenter.rowTitle(node, en: en),
                 subtitle: Presenter.rowSubtitle(node, en: en)) {
          obs.perform { isTarget ? $0.chooseTarget(node.id) : $0.chooseStart(node.id) }
        }
      }
    }
  }
}

// MARK: - 目的地

struct TargetView: View {
  let obs: ModelObserver

  var body: some View {
    let model = obs.model
    let state = model.state
    let en = state.isEn

    Header(
      title: I18n.t("target_title", en: en),
      brand: I18n.t("brand", en: en),
      langLabel: en ? "中" : "EN",
      onBack: { obs.perform { $0.backFromTarget() } },
      onToggleLanguage: { obs.perform { $0.toggleLanguage() } }
    )
    Text(I18n.t("target_hint", en: en)).font(.system(size: 13)).foregroundStyle(Theme.sub)

    ChipRow(items: Presenter.categoryChips(en: en), activeKey: state.category) { key in
      obs.perform { $0.setCategory(key) }
    }

    PickerList(obs: obs, mode: .target)
  }
}

// MARK: - 出发位置

struct StartView: View {
  let obs: ModelObserver
  @State private var searchText = ""

  var body: some View {
    let model = obs.model
    let state = model.state
    let en = state.isEn

    Header(
      title: I18n.t("start_title", en: en),
      brand: I18n.t("brand", en: en),
      langLabel: en ? "中" : "EN",
      onBack: { obs.perform { $0.backFromStart() } },
      onToggleLanguage: { obs.perform { $0.toggleLanguage() } }
    )

    if let target = model.node(state.planner.draftEnd) {
      HStack(spacing: 8) {
        Text(I18n.t("selected_target", en: en)).font(.system(size: 12, weight: .bold)).foregroundStyle(Theme.gold)
        Text(Presenter.rowTitle(target, en: en)).font(.system(size: 15, weight: .bold)).foregroundStyle(Theme.text)
        Spacer()
      }
      .padding(.horizontal, 14)
      .padding(.vertical, 10)
      .background(Theme.accentSoft, in: RoundedRectangle(cornerRadius: 14))
    }

    Text(I18n.t("start_hint", en: en)).font(.system(size: 13)).foregroundStyle(Theme.sub)

    SectionTitle(text: I18n.t("quick_starts", en: en))
    LazyVGrid(columns: [GridItem(.adaptive(minimum: 150), spacing: 10)], spacing: 10) {
      ForEach(Presenter.quickStartCards(en: en)) { card in
        QuickCard(title: card.title, subtitle: card.subtitle) {
          obs.perform { $0.chooseStart(card.id) }
        }
      }
    }

    HStack(spacing: 8) {
      Image(systemName: "magnifyingglass").foregroundStyle(Theme.sub)
      TextField(I18n.t("search", en: en), text: $searchText)
        .textFieldStyle(.plain)
        .font(.system(size: 15))
    }
    .padding(.horizontal, 16)
    .frame(minHeight: Theme.touch)
    .background(Theme.card, in: Capsule())
    .overlay(Capsule().stroke(Theme.line))

    let places = Presenter.places(query: searchText, category: "all")
    ForEach(places, id: \.id) { node in
      PlaceRow(title: Presenter.rowTitle(node, en: en),
               subtitle: Presenter.rowSubtitle(node, en: en)) {
        obs.perform { $0.chooseStart(node.id) }
      }
    }

    Button { obs.perform { $0.openBrowseForDestination() } } label: {
      Text(I18n.t("view_map", en: en)).frame(maxWidth: .infinity, minHeight: Theme.touch)
    }
    .buttonStyle(SecondaryButtonStyle())
  }
}

// MARK: - 路线

struct RoutePageView: View {
  let obs: ModelObserver
  @State private var showAllSteps = false

  var body: some View {
    let model = obs.model
    let state = model.state
    let en = state.isEn
    let view = model.routeView

    Header(
      title: I18n.t(state.planner.stage == .preview ? "route_preview"
                    : state.planner.stage == .guiding ? "route_guiding" : "route_title", en: en),
      brand: I18n.t("brand", en: en),
      langLabel: en ? "中" : "EN",
      onBack: { obs.perform { $0.backHome() } },
      onToggleLanguage: { obs.perform { $0.toggleLanguage() } }
    )

    if view.status != .ready {
      VStack(spacing: 6) {
        Text(Presenter.statusTitle(view.status, en: en))
          .font(.system(size: 17, weight: .semibold)).foregroundStyle(Theme.text)
        Text(I18n.t("error_hint", en: en)).font(.system(size: 13)).foregroundStyle(Theme.sub)
      }
      .frame(maxWidth: .infinity)
      .padding(.vertical, 28)

      Button { obs.perform { $0.startTargetFlow(category: "all") } } label: {
        Text(I18n.t("choose_again", en: en)).frame(maxWidth: .infinity, minHeight: Theme.touch)
      }
      .buttonStyle(PrimaryButtonStyle())
    } else {
      summaryCard(model: model, view: view, en: en)
      mapSection(model: model)
      preferenceChips(state: state, en: en)

      switch state.planner.stage {
      case .preview:
        actionRow(en: en, model: model)
      case .guiding:
        stepCard(model: model, view: view, en: en)
      case .completed:
        VStack(spacing: 6) {
          Text(I18n.t("route_complete", en: en)).font(.system(size: 17, weight: .semibold)).foregroundStyle(Theme.text)
          Text(I18n.t("route_complete_hint", en: en)).font(.system(size: 13)).foregroundStyle(Theme.sub)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 20)
        Button { obs.perform { $0.restart() } } label: {
          Text(I18n.t("new_journey", en: en)).frame(maxWidth: .infinity, minHeight: Theme.touch)
        }
        .buttonStyle(PrimaryButtonStyle())
      case .editing:
        EmptyView()
      }

      allStepsSection(model: model, view: view, en: en)
    }
  }

  private func summaryCard(model: AppModel, view: RouteView, en: Bool) -> some View {
    VStack(alignment: .leading, spacing: 6) {
      HStack(spacing: 8) {
        Circle().fill(Theme.accent).frame(width: 10, height: 10)
        Text(model.node(model.state.planner.startId).map { Presenter.rowTitle($0, en: en) } ?? "")
          .font(.system(size: 15, weight: .semibold)).foregroundStyle(Theme.text)
      }
      HStack(spacing: 8) {
        Circle().fill(Theme.gold).frame(width: 10, height: 10)
        Text(model.node(model.state.planner.endId).map { Presenter.rowTitle($0, en: en) } ?? "")
          .font(.system(size: 15, weight: .semibold)).foregroundStyle(Theme.text)
      }
      Text(Presenter.summary(view, en: en)).font(.system(size: 13)).foregroundStyle(Theme.sub)
      Text(I18n.t(view.route.viaSecurity ? "via_security" : "same_side", en: en))
        .font(.system(size: 12, weight: .bold))
        .padding(.horizontal, 10).padding(.vertical, 4)
        .background(view.route.viaSecurity ? (Color(hex: "#FFF2DF") ?? Theme.card) : Theme.accentSoft, in: Capsule())
        .foregroundStyle(view.route.viaSecurity ? Theme.gold : Theme.accent)
    }
    .padding(16)
    .frame(maxWidth: .infinity, alignment: .leading)
    .background(Theme.card, in: RoundedRectangle(cornerRadius: Theme.cardRadius))
    .overlay(RoundedRectangle(cornerRadius: Theme.cardRadius).stroke(Theme.line))
  }

  @ViewBuilder
  private func mapSection(model: AppModel) -> some View {
    MapCanvasView(
      floor: model.activeFloor,
      routeNodeIds: model.routeNodeIds,
      currentRouteIndex: model.currentRouteIndex,
      startId: model.state.planner.startId,
      endId: model.state.planner.endId,
      languageEn: model.state.isEn,
      onTapNode: { node in
        if let node { obs.perform { $0.selectNode(node.id) } }
      }
    )
    .frame(height: 300)
    .clipShape(RoundedRectangle(cornerRadius: Theme.cardRadius))
    .overlay(RoundedRectangle(cornerRadius: Theme.cardRadius).stroke(Theme.line))
    .padding(.vertical, 2)
  }

  private func preferenceChips(state: AppState, en: Bool) -> some View {
    ChipRow(
      items: (0..<PREFERENCE_COUNT).map { Chip(key: String($0), label: Presenter.preferenceLabel($0, en: en)) },
      activeKey: String(state.planner.preference)
    ) { key in
      obs.perform { $0.setPreference(Int(key) ?? 0) }
    }
  }

  private func actionRow(en: Bool, model: AppModel) -> some View {
    VStack(spacing: 10) {
      Button { obs.perform { $0.beginGuidance() } } label: {
        Text(I18n.t("begin", en: en)).frame(maxWidth: .infinity, minHeight: Theme.touch)
      }
      .buttonStyle(PrimaryButtonStyle())

      HStack(spacing: 10) {
        Button { obs.perform { $0.editStart() } } label: {
          Text(I18n.t("edit_from", en: en)).frame(maxWidth: .infinity, minHeight: Theme.touch)
        }
        .buttonStyle(SecondaryButtonStyle())

        Button { obs.perform { $0.editDestination() } } label: {
          Text(I18n.t("edit_to", en: en)).frame(maxWidth: .infinity, minHeight: Theme.touch)
        }
        .buttonStyle(SecondaryButtonStyle())
      }

      Button { obs.perform { $0.swap() } } label: {
        Text(I18n.t("swap", en: en)).frame(maxWidth: .infinity, minHeight: Theme.touch)
      }
      .buttonStyle(SecondaryButtonStyle())
    }
  }

  private func stepCard(model: AppModel, view: RouteView, en: Bool) -> some View {
    let index = min(model.state.planner.stepIndex, max(0, view.steps.count - 1))
    let step = view.steps.isEmpty ? nil : view.steps[index]
    return VStack(alignment: .leading, spacing: 6) {
      HStack {
        Text("\(I18n.t("step", en: en)) \(index + 1)/\(view.steps.count)")
          .font(.system(size: 12, weight: .semibold)).foregroundStyle(Theme.accent)
        Spacer()
        Text(step.map { I18n.floorLabel($0.floor, en: en) } ?? "")
          .font(.system(size: 12)).foregroundStyle(Theme.sub)
      }
      Text(step.map { Presenter.stepTitle($0, en: en) } ?? "")
        .font(.system(size: 19, weight: .bold)).foregroundStyle(Theme.text)
      if let step, step.meters > 0 {
        Text("\(Presenter.meters(step.meters)) \(I18n.t("meters", en: en))")
          .font(.system(size: 14, weight: .semibold)).foregroundStyle(Theme.accent)
      }
      Text(I18n.t("manual", en: en)).font(.system(size: 12)).foregroundStyle(Theme.sub)

      VStack(spacing: 10) {
        Button { obs.perform { $0.advance() } } label: {
          Text(step.map { Presenter.stepAction($0, isLast: index == view.steps.count - 1, en: en) }
                ?? I18n.t("finish", en: en))
            .frame(maxWidth: .infinity, minHeight: Theme.touch)
        }
        .buttonStyle(PrimaryButtonStyle())

        Button { obs.perform { $0.previous() } } label: {
          Text(I18n.t("previous", en: en)).frame(maxWidth: .infinity, minHeight: Theme.touch)
        }
        .buttonStyle(SecondaryButtonStyle())
        .disabled(index == 0)
        .opacity(index == 0 ? 0.45 : 1)
      }
      .padding(.top, 10)
    }
    .padding(16)
    .frame(maxWidth: .infinity, alignment: .leading)
    .background(Theme.card, in: RoundedRectangle(cornerRadius: Theme.cardRadius))
    .overlay(RoundedRectangle(cornerRadius: Theme.cardRadius).stroke(Theme.line))
  }

  private func allStepsSection(model: AppModel, view: RouteView, en: Bool) -> some View {
    DisclosureGroup(isExpanded: $showAllSteps) {
      VStack(alignment: .leading, spacing: 6) {
        let steps = Presenter.allSteps(view, en: en)
        ForEach(Array(steps.indices), id: \.self) { index in
          Text(steps[index])
            .font(.system(size: 14, weight: index == model.state.planner.stepIndex ? .bold : .regular))
            .foregroundStyle(index == model.state.planner.stepIndex ? Theme.text : Theme.sub)
            .frame(maxWidth: .infinity, alignment: .leading)
            .contentShape(Rectangle())
            .onTapGesture { obs.perform { $0.jumpToStep(index) } }
        }
      }
      .padding(.top, 8)
    } label: {
      Text(I18n.t("all_steps", en: en)).font(.system(size: 14, weight: .bold)).foregroundStyle(Theme.accent)
    }
    .padding(16)
    .background(Theme.card, in: RoundedRectangle(cornerRadius: Theme.cardRadius))
    .overlay(RoundedRectangle(cornerRadius: Theme.cardRadius).stroke(Theme.line))
  }
}

// MARK: - 楼层地图

struct BrowseView: View {
  let obs: ModelObserver
  @State private var viewportScale: CGFloat = 1

  var body: some View {
    let model = obs.model
    let state = model.state
    let en = state.isEn
    let floors = AirportGraph.shared.floorOrder

    Header(
      title: I18n.t("browse_title", en: en),
      brand: I18n.t("brand", en: en),
      langLabel: en ? "中" : "EN",
      onBack: { obs.perform { $0.backFromBrowse() } },
      onToggleLanguage: { obs.perform { $0.toggleLanguage() } }
    )
    Text(I18n.t("browse_hint", en: en)).font(.system(size: 13)).foregroundStyle(Theme.sub)

    ChipRow(items: floors.map { Chip(key: $0, label: $0) }, activeKey: state.browseFloor) { key in
      obs.perform { $0.setBrowseFloor(key) }
    }

    MapCanvasView(
      floor: state.browseFloor,
      routeNodeIds: [],
      currentRouteIndex: -1,
      startId: state.planner.startId,
      endId: state.planner.endId,
      languageEn: en,
      onTapNode: { node in
        if let node { obs.perform { $0.selectNode(node.id) } }
      }
    )
    .frame(height: 340)
    .clipShape(RoundedRectangle(cornerRadius: Theme.cardRadius))
    .overlay(RoundedRectangle(cornerRadius: Theme.cardRadius).stroke(Theme.line))

    if let selected = model.node(state.selectedId) {
      VStack(alignment: .leading, spacing: 4) {
        Text(Presenter.rowTitle(selected, en: en)).font(.system(size: 17, weight: .bold)).foregroundStyle(Theme.text)
        Text(Presenter.rowSubtitle(selected, en: en)).font(.system(size: 13)).foregroundStyle(Theme.sub)
        HStack(spacing: 10) {
          Button { obs.perform { $0.setStartFromMap(selected.id) } } label: {
            Text(I18n.t("pick_start", en: en)).frame(maxWidth: .infinity, minHeight: Theme.touch)
          }
          .buttonStyle(SecondaryButtonStyle())

          Button { obs.perform { $0.routeToFromMap(selected.id) } } label: {
            Text(I18n.t("pick_dest", en: en)).frame(maxWidth: .infinity, minHeight: Theme.touch)
          }
          .buttonStyle(PrimaryButtonStyle())
        }
        .padding(.top, 6)
      }
      .padding(16)
      .frame(maxWidth: .infinity, alignment: .leading)
      .background(Theme.card, in: RoundedRectangle(cornerRadius: Theme.cardRadius))
      .overlay(RoundedRectangle(cornerRadius: Theme.cardRadius).stroke(Theme.line))
    } else {
      SectionTitle(text: I18n.t("legend", en: en))
      let nodes = AirportGraph.shared.floorNodes(state.browseFloor).filter { $0.type != "corridor" }
      ForEach(nodes, id: \.id) { node in
        PlaceRow(title: Presenter.rowTitle(node, en: en),
                 subtitle: Presenter.rowSubtitle(node, en: en)) {
          obs.perform { $0.selectNode(node.id) }
        }
      }
    }
  }
}
