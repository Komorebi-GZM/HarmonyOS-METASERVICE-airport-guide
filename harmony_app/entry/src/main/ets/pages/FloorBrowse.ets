import { FLOOR_ORDER } from '../model/AirportMap';
import { Loc } from '../model/Loc';
import { place, placeName, recentPlaces } from '../core/Places';
import { PlannerState, choosePlace, copyPlanner, commitJourney } from '../core/PlannerState';
import { LocalStore } from '../core/LocalStore';
import { NAV_SELECT_TARGET, NAV_SELECT_START, NAV_PLAN } from '../core/Router';
import { APP } from '../ui/Theme';
import { FloorCanvas } from '../ui/FloorCanvas';
import { PageHeader, PrimaryAction, AppIcon } from '../ui/Common';
@Component
export struct FloorBrowse {
  @Consume pathStack: NavPathStack; @Consume planner: PlannerState; @Consume recent: string[];
  @StorageLink('lang') lang: string = 'zh';
  @State floor: string = '4F'; @State picked: string = ''; @State showDetail: boolean = false;
  @State startFeedback: boolean = false;
  aboutToAppear(): void { this.floor = this.planner.browseFloor; }
  private chooseStart(): void {
    this.planner = choosePlace(this.planner, this.picked, true); this.showDetail = false;
    if (this.planner.mapMode === 'start') { this.pathStack.pop(); return; }
    this.startFeedback = true;
  }
  private chooseEnd(): void {
    this.planner = choosePlace(this.planner, this.picked, false); this.showDetail = false;
    if (this.planner.mapMode === 'destination') { this.pathStack.pop(); return; }
    if (this.planner.draftStart !== '') {
      this.planner = commitJourney(this.planner);
      this.recent = recentPlaces(this.recent, this.planner.endId);
      LocalStore.save(this.lang, this.recent);
      this.pathStack.clear(); this.pathStack.pushPathByName(NAV_PLAN, null);
    } else { this.pathStack.pushPathByName(NAV_SELECT_START, null); }
  }
  private back(): void {
    if (this.planner.mapMode === 'start' || this.planner.mapMode === 'destination') {
      const p = copyPlanner(this.planner); p.mapMode = 'browse'; this.planner = p;
    }
    this.pathStack.pop();
  }
  private nextDestination(): void { this.pathStack.pushPathByName(NAV_SELECT_TARGET, null); }
  private detailFloor(): string { const n = place(this.picked); return n === undefined ? '' : n.floor + ' · ' + Loc.floor(n.floor, this.lang === 'en'); }
  @Builder
  detail() {
    Column({ space: 16 }) {
      AppIcon({ name: 'pin', iconSize: 32 })
      Text(placeName(this.picked, this.lang === 'en')).fontSize(24).fontWeight(FontWeight.Bold).fontColor(APP.text).width('100%')
      Text(this.detailFloor()).fontSize(16).fontColor(APP.sub).width('100%')
      if (this.planner.mapMode !== 'destination') {
        PrimaryAction({ label: Loc.t('pick_start', this.lang === 'en'), onAction: () => this.chooseStart() })
      }
      if (this.planner.mapMode !== 'start') {
        Button(Loc.t('pick_dest', this.lang === 'en')).width('100%').height(52).fontSize(16).backgroundColor(APP.accentSoft)
          .fontColor(APP.accent).borderRadius(14).onClick(() => this.chooseEnd())
      }
      Button(Loc.t('cancel', this.lang === 'en')).height(48).fontSize(16).backgroundColor(APP.bg).fontColor(APP.sub)
        .onClick(() => { this.showDetail = false; })
    }.width('100%').padding(24).backgroundColor(APP.card).alignItems(HorizontalAlign.Start)
  }
  build() {
    NavDestination() {
      Row() {
      Column({ space: 12 }) {
        PageHeader({ title: Loc.t('browse_title', this.lang === 'en'), onBack: () => this.back() })
        Column({ space: 6 }) {
          Text(Loc.t(this.planner.mapMode === 'start' ? 'start_heading' : 'browse_heading', this.lang === 'en')).fontSize(22).fontWeight(FontWeight.Bold).fontColor(APP.text).width('100%')
          Text(Loc.t('browse_hint', this.lang === 'en')).fontSize(14).fontColor(APP.sub).width('100%')
        }.width('100%').padding({ left: 20, right: 20 }).alignItems(HorizontalAlign.Start)
        Scroll() {
          Row({ space: 8 }) {
            ForEach(FLOOR_ORDER, (f: string) => {
              Button(f).id('map_floor_' + f).height(48).fontSize(16).backgroundColor(this.floor === f ? APP.accent : APP.card)
                .fontColor(this.floor === f ? Color.White : APP.text).borderRadius(12).onClick(() => {
                  this.floor = f; this.picked = ''; const p = copyPlanner(this.planner); p.browseFloor = f; this.planner = p;
                })
            }, (f: string) => f)
          }.padding({ left: 20, right: 20 })
        }.height(52).width('100%').scrollable(ScrollDirection.Horizontal).scrollBar(BarState.Off)
        Row() {
          FloorCanvas({ floor: this.floor, lang: this.lang, selectable: true, selectedId: this.picked,
            startId: this.planner.draftStart, endId: this.planner.draftEnd,
            onNodeTap: (id: string) => { this.picked = id; this.showDetail = true; } })
            .width('100%').height('100%')
        }.layoutWeight(1).width('100%').padding({ left: 16, right: 16 })
        Text(this.floor + ' · ' + Loc.floor(this.floor, this.lang === 'en') + ' · ' + Loc.t('legend', this.lang === 'en'))
          .fontSize(14).fontColor(APP.sub).width('100%').padding({ left: 20, right: 20 })
        if (this.startFeedback) {
          Column({ space: 8 }) {
            Text(Loc.t('start_set', this.lang === 'en') + ' · ' + placeName(this.planner.draftStart, this.lang === 'en')).fontSize(14).fontColor(APP.accent).width('100%')
            PrimaryAction({ label: Loc.t('choose_next', this.lang === 'en'), onAction: () => this.nextDestination() })
          }.width('100%').padding(16).backgroundColor(APP.card)
        } else { Blank().height(4) }
      }.width('100%').height('100%').constraintSize({ maxWidth: 1000 }).backgroundColor(APP.bg)
        .bindSheet($$this.showDetail, this.detail(), { height: SheetSize.FIT_CONTENT, showClose: true, dragBar: true, backgroundColor: APP.card })
      }.width('100%').height('100%').justifyContent(FlexAlign.Center)
    }.hideTitleBar(true).backgroundColor(APP.bg).onBackPressed((): boolean => {
      if (this.planner.mapMode === 'start' || this.planner.mapMode === 'destination') {
        const p = copyPlanner(this.planner); p.mapMode = 'browse'; this.planner = p;
      }
      return false;
    })
  }
}
