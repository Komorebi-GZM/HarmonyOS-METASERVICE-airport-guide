import { Loc } from '../model/Loc';
import { RouteStep, RouteView, buildRouteView } from '../core/RouteSteps';
import { PlannerState, newJourney, beginEdit, changePreference, swapJourney, startGuidance, advanceGuidance, previousStep } from '../core/PlannerState';
import { placeName } from '../core/Places';
import { NAV_SELECT_TARGET, NAV_SELECT_START } from '../core/Router';
import { RouteLeg } from '../core/Pathfinder';
import { PageHeader, PrimaryAction, EmptyState, AppIcon } from '../ui/Common';
import { FloorCanvas } from '../ui/FloorCanvas';
import { APP } from '../ui/Theme';
@Component
export struct Route {
  @Consume pathStack: NavPathStack;
  @Consume @Watch('onPlanner') planner: PlannerState;
  @StorageLink('lang') lang: string = 'zh';
  @State view: RouteView = buildRouteView('', '', 0);
  @State legIndex: number = 0; @State showSteps: boolean = false;
  @State mapHeight: number = 320;
  private scrollHeight: number = 0; private summaryHeight: number = 0;
  private signature: string = '';
  private resizeMap(): void {
    if (this.scrollHeight < 1 || this.summaryHeight < 1) { return; }
    const height = Math.max(240, Math.min(600, this.scrollHeight - this.summaryHeight - 16));
    if (Math.abs(height - this.mapHeight) > 1) { this.mapHeight = height; }
  }
  aboutToAppear(): void { this.refresh(); }
  onPlanner(): void {
    this.refresh();
    if (this.planner.stage === 'guiding' && this.view.steps.length > 0) { this.legIndex = this.currentStep().legIndex; }
  }
  private refresh(): void {
    const key = this.planner.startId + ':' + this.planner.endId + ':' + this.planner.preference;
    if (key !== this.signature) {
      this.signature = key; this.view = buildRouteView(this.planner.startId, this.planner.endId, this.planner.preference); this.legIndex = 0;
    }
  }
  private currentStep(): RouteStep {
    const index = Math.min(Math.max(0, this.planner.stepIndex), this.view.steps.length - 1);
    if (index >= 0 && this.view.steps[index] !== undefined) { return this.view.steps[index]; }
    return { kind: 'destination', fromId: '', toId: '', floor: '4F', toFloor: '4F', legIndex: 0, meters: 0, facility: '' };
  }
  private currentLeg(): RouteLeg {
    const leg = this.view.route.legs[this.legIndex];
    return leg === undefined ? { floor: '4F', nodeIds: [], meters: 0 } : leg;
  }
  private activeIds(): string[] {
    if (this.planner.stage !== 'guiding') { return this.currentLeg().nodeIds; }
    const step = this.currentStep();
    if (step.legIndex !== this.legIndex) { return []; }
    const ids = this.currentLeg().nodeIds;
    const a = ids.indexOf(step.fromId); const b = ids.indexOf(step.toId);
    return a >= 0 && b >= a ? ids.slice(a, b + 1) : [step.fromId];
  }
  private stepTitle(step: RouteStep): string {
    const en = this.lang === 'en';
    if (step.kind === 'security') { return Loc.t('pass_security', en); }
    if (step.kind === 'transfer') {
      return Loc.t('take', en) + ' ' + Loc.t(step.facility, en) + ' · ' + placeName(step.fromId, en) + ' → ' + step.toFloor;
    }
    if (step.kind === 'destination') { return Loc.t('destination_step', en); }
    return Loc.t('walk_to', en) + ' ' + placeName(step.toId, en);
  }
  private actionLabel(): string {
    const kind = this.currentStep().kind;
    return Loc.t(kind === 'transfer' ? 'arrived_floor' : kind === 'security' ? 'passed_security' : kind === 'destination' ? 'finish' : 'arrived_here', this.lang === 'en');
  }
  private title(): string {
    return Loc.t(this.planner.stage === 'completed' ? 'route_complete' : this.planner.stage === 'guiding' ? 'route_guiding' : 'route_preview', this.lang === 'en');
  }
  private edit(start: boolean): void {
    this.planner = beginEdit(this.planner, start ? 'start' : 'end');
    this.pathStack.pushPathByName(start ? NAV_SELECT_START : NAV_SELECT_TARGET, null);
  }
  private newRoute(): void {
    this.planner = newJourney(this.planner); this.pathStack.clear(); this.pathStack.pushPathByName(NAV_SELECT_TARGET, null);
  }
  private replan(preference: number): void {
    this.planner = changePreference(this.planner, preference); this.legIndex = 0;
  }
  @Builder
  preferenceMenu() {
    Menu() {
      MenuItem({ content: Loc.t('pref_shortest', this.lang === 'en') }).id('preference_0').onClick(() => this.replan(0))
      MenuItem({ content: Loc.t('pref_elevator', this.lang === 'en') }).id('preference_1').onClick(() => this.replan(1))
      MenuItem({ content: Loc.t('pref_escalator', this.lang === 'en') }).id('preference_2').onClick(() => this.replan(2))
      MenuItem({ content: Loc.t('pref_avoid_stair', this.lang === 'en') }).id('preference_3').onClick(() => this.replan(3))
    }
  }
  @Builder
  preference(p: number, key: string) {
    Button(Loc.t(key, this.lang === 'en')).id('preference_' + p).height(48).fontSize(14).borderRadius(12)
      .backgroundColor(this.planner.preference === p ? APP.accent : APP.card).fontColor(this.planner.preference === p ? Color.White : APP.sub)
      .onClick(() => this.replan(p))
  }
  @Builder
  endpoints() {
    Row({ space: 8 }) {
      Column({ space: 4 }) {
        Text(Loc.t('start_label', this.lang === 'en') + ' · ' + Loc.t('edit_from', this.lang === 'en')).fontSize(14).fontColor(APP.sub)
        Text(placeName(this.planner.startId, this.lang === 'en')).fontSize(16).fontWeight(FontWeight.Medium).fontColor(APP.text).maxLines(2)
      }.id('edit_start').layoutWeight(1).alignItems(HorizontalAlign.Start).onClick(() => this.edit(true))
      Button() { AppIcon({ name: 'swap', iconSize: 22 }) }.id('reverse_route').width(48).height(48).borderRadius(12).backgroundColor(APP.card)
        .accessibilityText(Loc.t('swap', this.lang === 'en')).onClick(() => { this.planner = swapJourney(this.planner); })
      Column({ space: 4 }) {
        Text(Loc.t('end_label', this.lang === 'en') + ' · ' + Loc.t('edit_to', this.lang === 'en')).fontSize(14).fontColor(APP.sub)
        Text(placeName(this.planner.endId, this.lang === 'en')).fontSize(16).fontWeight(FontWeight.Medium).fontColor(APP.text).maxLines(2)
      }.id('edit_end').layoutWeight(1).alignItems(HorizontalAlign.Start).onClick(() => this.edit(false))
    }.width('100%').padding({ left: 20, right: 20, top: 12, bottom: 12 })
  }
  @Builder
  stepSheet() {
    Column({ space: 12 }) {
      Text(Loc.t('all_steps', this.lang === 'en')).fontSize(22).fontWeight(FontWeight.Bold).fontColor(APP.text).width('100%')
      Scroll() {
        Column({ space: 10 }) {
          ForEach(this.view.steps, (step: RouteStep, i: number) => {
            Row({ space: 12 }) {
              Text((i + 1) + '').fontSize(16).fontWeight(FontWeight.Bold).fontColor(APP.accent).width(32)
              Column({ space: 5 }) {
                Text(this.stepTitle(step)).fontSize(16).fontColor(APP.text).width('100%')
                Text(step.floor + (step.kind === 'transfer' ? ' → ' + step.toFloor : '') +
                  (step.meters > 0 ? ' · ' + Math.round(step.meters) + ' ' + Loc.t('meters', this.lang === 'en') : ''))
                  .fontSize(14).fontColor(APP.sub).width('100%')
              }.layoutWeight(1).alignItems(HorizontalAlign.Start)
            }.width('100%').padding(14).backgroundColor(i === this.planner.stepIndex && this.planner.stage === 'guiding' ? APP.accentSoft : APP.bg)
              .borderRadius(12).onClick(() => { this.legIndex = step.legIndex; this.showSteps = false; })
          }, (step: RouteStep, i: number) => i + ':' + step.fromId + ':' + step.kind)
        }.width('100%')
      }.layoutWeight(1).width('100%').scrollBar(BarState.Auto)
    }.height('100%').width('100%').padding(24).backgroundColor(APP.card)
  }
  @Builder
  footer() {
    Column({ space: 10 }) {
      if (this.planner.stage === 'preview') {
        Row() {
          Text(Loc.t('manual', this.lang === 'en')).fontSize(14).fontColor(APP.sub).layoutWeight(1)
          Button(Loc.t('all_steps', this.lang === 'en')).height(48).fontSize(14).backgroundColor(APP.bg).fontColor(APP.accent)
            .onClick(() => { this.showSteps = true; })
        }.width('100%')
        PrimaryAction({ label: Loc.t('begin', this.lang === 'en'), onAction: () => { this.planner = startGuidance(this.planner); this.legIndex = 0; } })
      } else if (this.planner.stage === 'completed') {
        Text(Loc.t('route_complete_hint', this.lang === 'en')).fontSize(16).fontColor(APP.accent).width('100%')
        PrimaryAction({ label: Loc.t('new_journey', this.lang === 'en'), onAction: () => this.newRoute() })
      } else {
        Row() {
          Text(Loc.t('step', this.lang === 'en') + ' ' + (this.planner.stepIndex + 1) + ' / ' + this.view.steps.length + ' · ' + this.currentStep().floor)
            .fontSize(14).fontColor(APP.accent).layoutWeight(1)
          Button() { Text(Loc.t('route_options', this.lang === 'en')).fontSize(14).fontColor(APP.accent).maxLines(2).textAlign(TextAlign.Center) }
            .id('route_preferences').height(48).layoutWeight(1).backgroundColor(APP.bg)
            .bindMenu(this.preferenceMenu)
          Button() { Text(Loc.t('all_steps', this.lang === 'en')).fontSize(14).fontColor(APP.accent).maxLines(2).textAlign(TextAlign.Center) }
            .id('all_route_steps').height(48).layoutWeight(1).backgroundColor(APP.bg)
            .onClick(() => { this.showSteps = true; })
        }.width('100%')
        Text(this.stepTitle(this.currentStep())).fontSize(18).fontWeight(FontWeight.Bold).fontColor(APP.text).width('100%').maxLines(3)
        if (this.currentStep().meters > 0) {
          Text(Loc.t('walking', this.lang === 'en') + ' ' + Math.round(this.currentStep().meters) + ' ' + Loc.t('meters', this.lang === 'en')).fontSize(14).fontColor(APP.sub).width('100%')
        }
        if (this.planner.stepIndex + 1 < this.view.steps.length) {
          Text(Loc.t('next_step', this.lang === 'en') + (this.lang === 'en' ? ': ' : '：') +
            this.stepTitle(this.view.steps[this.planner.stepIndex + 1]))
            .fontSize(14).fontColor(APP.sub).width('100%').maxLines(2)
        }
        if (this.legIndex !== this.currentStep().legIndex) {
          Button(Loc.t('return_current', this.lang === 'en')).height(48).fontSize(14).backgroundColor(APP.accentSoft).fontColor(APP.accent)
            .onClick(() => { this.legIndex = this.currentStep().legIndex; })
        }
        Row({ space: 10 }) {
          Button(Loc.t('previous', this.lang === 'en')).id('previous_step').height(52).fontSize(14).backgroundColor(APP.bg).fontColor(APP.sub)
            .layoutWeight(1).enabled(this.planner.stepIndex > 0)
            .onClick(() => { this.planner = previousStep(this.planner); this.legIndex = this.currentStep().legIndex; })
          PrimaryAction({ label: this.actionLabel(), onAction: () => {
            this.planner = advanceGuidance(this.planner, this.view.steps.length); this.legIndex = this.currentStep().legIndex;
          } }).layoutWeight(2)
        }.width('100%')
      }
    }.width('100%').padding(16).backgroundColor(APP.card).alignItems(HorizontalAlign.Start)
  }
  build() {
    NavDestination() {
      Row() {
      Column() {
        PageHeader({ title: this.title(), onBack: () => this.pathStack.pop() })
        Scroll() {
          Column() {
        if (this.view.status !== 'ready') {
          Column() {
            EmptyState({ title: Loc.t(this.view.status, this.lang === 'en'), hint: Loc.t('error_hint', this.lang === 'en'), icon: 'map' })
          }.width('100%').justifyContent(FlexAlign.Center)
        } else {
          Column() {
          this.endpoints()
          if (this.planner.stage === 'preview') {
          Row({ space: 6 }) {
            Text(Loc.t('walking', this.lang === 'en')).fontSize(14).fontColor(APP.sub)
            Text(Math.round(this.view.walkingMeters) + '').fontSize(24).fontWeight(FontWeight.Bold).fontColor(APP.accent)
            Text(Loc.t('meters', this.lang === 'en')).fontSize(14).fontColor(APP.sub)
            Blank()
            Text(this.view.route.transitions.length + ' ' + Loc.t('transfers', this.lang === 'en')).fontSize(14).fontColor(APP.sub)
          }.width('100%').padding({ left: 20, right: 20, bottom: 10 })
          if (this.view.route.viaSecurity) {
            Row({ space: 8 }) { AppIcon({ name: 'shield', iconSize: 20 }); Text(Loc.t('via_security', this.lang === 'en')).fontSize(14).fontColor(APP.gtext).layoutWeight(1) }
              .width('100%').padding({ left: 20, right: 20, top: 10, bottom: 10 }).backgroundColor('#FFF2DF')
          } else {
            Text(Loc.t('same_side', this.lang === 'en')).fontSize(14).fontColor(APP.sub).width('100%')
              .padding({ left: 20, right: 20, top: 8, bottom: 8 }).backgroundColor(APP.card)
          }
            Scroll() {
              Row({ space: 8 }) {
                this.preference(0, 'pref_shortest'); this.preference(1, 'pref_elevator'); this.preference(2, 'pref_escalator'); this.preference(3, 'pref_avoid_stair')
              }.padding({ left: 16, right: 16 })
            }.width('100%').height(56).scrollable(ScrollDirection.Horizontal).scrollBar(BarState.Off)
          }
          Scroll() {
            Row({ space: 8 }) {
              ForEach(this.view.route.legs, (leg: RouteLeg, i: number) => {
                Button(leg.floor).id('route_leg_' + i).height(48).fontSize(16).backgroundColor(i === this.legIndex ? APP.accentSoft : APP.card)
                  .fontColor(i === this.legIndex ? APP.accent : APP.sub).borderRadius(12).onClick(() => { this.legIndex = i; })
              }, (leg: RouteLeg, i: number) => leg.floor + ':' + i)
            }.padding({ left: 16, right: 16 })
          }.width('100%').height(48).scrollable(ScrollDirection.Horizontal).scrollBar(BarState.Off)
          }.width('100%').onAreaChange((_oldArea, newArea) => {
            const height = parseFloat(newArea.height.toString());
            if (height > 0 && Math.abs(height - this.summaryHeight) > 1) {
              this.summaryHeight = height; this.resizeMap();
            }
          })
          Row() {
            FloorCanvas({ floor: this.currentLeg().floor, lang: this.lang, pathNodeIds: this.currentLeg().nodeIds,
              currentIds: this.activeIds(), startId: this.planner.startId, endId: this.planner.endId })
              .height(this.mapHeight).width('100%')
          }.width('100%').padding({ left: 16, right: 16, bottom: 12 })
        }
          }.width('100%').padding({ bottom: 12 })
        }.layoutWeight(1).width('100%').scrollBar(BarState.Auto)
          .onAreaChange((_oldArea, newArea) => {
            const height = parseFloat(newArea.height.toString());
            if (height > 0 && Math.abs(height - this.scrollHeight) > 1) {
              this.scrollHeight = height; this.resizeMap();
            }
          })
        if (this.view.status !== 'ready') {
          Column() { PrimaryAction({ label: Loc.t('choose_again', this.lang === 'en'), onAction: () => this.newRoute() }) }
            .width('100%').padding(20).backgroundColor(APP.card)
        } else { this.footer() }
      }.width('100%').height('100%').constraintSize({ maxWidth: 1000 }).backgroundColor(APP.bg)
        .bindSheet($$this.showSteps, this.stepSheet(), { height: SheetSize.LARGE, showClose: true, dragBar: true, backgroundColor: APP.card })
      }.width('100%').height('100%').justifyContent(FlexAlign.Center)
    }.hideTitleBar(true).backgroundColor(APP.bg).onShown(() => this.refresh())
  }
}
