import { common } from '@kit.AbilityKit';
import { KeyboardAvoidMode } from '@kit.ArkUI';
import { Loc } from '../model/Loc';
import { MapNode } from '../model/AirportMap';
import { PlannerState, newJourney, copyPlanner } from '../core/PlannerState';
import { place, placeName } from '../core/Places';
import { LocalStore, SavedChoices } from '../core/LocalStore';
import { NAV_SELECT_TARGET, NAV_SELECT_START, NAV_METRO, NAV_BROWSE, NAV_PLAN } from '../core/Router';
import { APP } from '../ui/Theme';
import { PageHeader, AppIcon, SectionTitle, PlaceRow } from '../ui/Common';
import { SelectTarget } from './SelectTarget';
import { SelectStart } from './SelectStart';
import { Route } from './Route';
import { MetroGuide } from './MetroGuide';
import { FloorBrowse } from './FloorBrowse';
const POPULAR: string[] = ['xha_p4_gA101', 'xha_p4_gC308', 'xha_p4_sec', 'xha_p2_bagA'];
@Entry
@Component
struct Index {
  @Provide pathStack: NavPathStack = new NavPathStack();
  @Provide planner: PlannerState = new PlannerState();
  @Provide recent: string[] = [];
  @StorageLink('lang') lang: string = 'zh';
  aboutToAppear(): void {
    AppStorage.setOrCreate('lang', this.lang);
    this.getUIContext().setKeyboardAvoidMode(KeyboardAvoidMode.RESIZE);
    const context = this.getUIContext().getHostContext() as common.UIAbilityContext;
    LocalStore.load(context).then((saved: SavedChoices) => {
      this.lang = saved.lang; this.recent = saved.recent;
    });
  }
  private toggleLanguage(): void { this.lang = this.lang === 'en' ? 'zh' : 'en'; LocalStore.save(this.lang, this.recent); }
  private search(category: string = 'all'): void {
    this.planner = newJourney(this.planner, '', category); this.pathStack.pushPathByName(NAV_SELECT_TARGET, null);
  }
  private destination(id: string): void {
    this.planner = newJourney(this.planner, id); this.pathStack.pushPathByName(NAV_SELECT_START, null);
  }
  private floor(f: string): void {
    const p = newJourney(this.planner); p.browseFloor = f; p.mapMode = 'browse';
    this.planner = p; this.pathStack.pushPathByName(NAV_BROWSE, null);
  }
  private metro(): void {
    this.planner = newJourney(this.planner); this.pathStack.pushPathByName(NAV_METRO, null);
  }
  private node(id: string): MapNode { const n = place(id); return n === undefined ? this.fallback() : n; }
  private fallback(): MapNode { return { id: '', name: '', type: 'hall', floor: '', x: 0, y: 0, side: 'land' }; }
  @Builder
  task(icon: string, label: string, category: string) {
    Column({ space: 12 }) {
      AppIcon({ name: icon, iconSize: 28 })
      Text(Loc.t(label, this.lang === 'en')).fontSize(16).fontWeight(FontWeight.Medium).fontColor(APP.text).textAlign(TextAlign.Center)
    }.layoutWeight(1).constraintSize({ minHeight: 112 }).padding(12).backgroundColor(APP.card)
      .borderRadius(18).justifyContent(FlexAlign.Center).onClick(() => { if (category === 'metro') { this.metro(); } else { this.search(category); } })
  }
  @Builder
  floorTile(f: string) {
    Row({ space: 10 }) {
      Text(f).fontSize(22).fontWeight(FontWeight.Bold).fontColor(APP.accent).width(42)
      Column({ space: 3 }) {
        Text(Loc.floor(f, this.lang === 'en')).fontSize(14).fontColor(APP.text).maxLines(2)
        Text(Loc.t('browse_title', this.lang === 'en')).fontSize(14).fontColor(APP.sub)
      }.layoutWeight(1).alignItems(HorizontalAlign.Start)
    }.id('floor_' + f).layoutWeight(1).constraintSize({ minHeight: 86 }).padding(14).backgroundColor(APP.card)
      .borderRadius(16).onClick(() => this.floor(f))
  }
  @Builder
  PageMap(name: string) {
    if (name === NAV_SELECT_TARGET) { SelectTarget() }
    else if (name === NAV_SELECT_START) { SelectStart() }
    else if (name === NAV_PLAN) { Route() }
    else if (name === NAV_METRO) { MetroGuide() }
    else if (name === NAV_BROWSE) { FloorBrowse() }
  }
  build() {
    Navigation(this.pathStack) {
      Column() {
        PageHeader({ title: Loc.t('brand', this.lang === 'en'), back: false })
        Scroll() {
          Row() {
          Column({ space: 20 }) {
            Row() {
              Text(Loc.t('home_sub', this.lang === 'en')).fontSize(14).fontColor(APP.sub).layoutWeight(1)
              Button(this.lang === 'en' ? '中文' : 'English').id('language_switch').height(48).fontSize(14)
                .backgroundColor(APP.card).fontColor(APP.accent).borderRadius(12).onClick(() => this.toggleLanguage())
            }.width('100%')
            Column({ space: 10 }) {
              Text(Loc.t('home_title', this.lang === 'en')).fontSize(32).fontWeight(FontWeight.Bold).fontColor(APP.text).width('100%')
              Text(Loc.t('home_tip', this.lang === 'en')).fontSize(14).fontColor(APP.sub).width('100%')
            }.width('100%').alignItems(HorizontalAlign.Start)
            Button() {
              Row({ space: 12 }) {
                AppIcon({ name: 'search', iconSize: 24 })
                Column({ space: 5 }) {
                  Text(Loc.t('search', this.lang === 'en')).fontSize(16).fontColor(APP.text).width('100%')
                  Text(Loc.t('search_hint', this.lang === 'en')).fontSize(14).fontColor(APP.sub).width('100%')
                }.layoutWeight(1).alignItems(HorizontalAlign.Start)
                AppIcon({ name: 'next', iconSize: 20 })
              }.padding(18).width('100%')
            }.id('home_search').width('100%').constraintSize({ minHeight: 90 }).backgroundColor(APP.card).borderRadius(18)
              .border({ width: 1.5, color: APP.accent }).onClick(() => this.search())
            Row({ space: 10 }) {
              this.task('plane', 'go_gate', 'gate')
              this.task('metro', 'go_metro', 'metro')
              this.task('facility', 'go_service', 'service')
            }.width('100%').alignItems(VerticalAlign.Center)
            if (this.recent.length > 0) {
              Column({ space: 10 }) {
                SectionTitle({ title: Loc.t('recent', this.lang === 'en') })
                ForEach(this.recent.slice(0, 6), (id: string) => {
                  PlaceRow({ item: this.node(id), lang: this.lang, onChoose: () => this.destination(id) })
                }, (id: string) => id)
              }.width('100%')
            }
            Column({ space: 10 }) {
              SectionTitle({ title: Loc.t('popular', this.lang === 'en') })
              ForEach(POPULAR, (id: string) => {
                PlaceRow({ item: this.node(id), lang: this.lang, onChoose: () => this.destination(id) })
              }, (id: string) => id)
            }.width('100%')
            Column({ space: 10 }) {
              SectionTitle({ title: Loc.t('floors', this.lang === 'en') })
              Row({ space: 10 }) { this.floorTile('4F'); this.floorTile('3F') }.width('100%')
              Row({ space: 10 }) { this.floorTile('2F'); this.floorTile('1F') }.width('100%')
              Row({ space: 10 }) { this.floorTile('B1'); this.floorTile('B2') }.width('100%')
            }.width('100%')
            Text(Loc.t('sample', this.lang === 'en')).fontSize(14).fontColor(APP.sub).width('100%').padding({ top: 6, bottom: 12 })
          }.width('100%').constraintSize({ maxWidth: 840 }).padding(20).alignItems(HorizontalAlign.Start)
          }.width('100%').justifyContent(FlexAlign.Center)
        }.layoutWeight(1).width('100%').scrollBar(BarState.Auto)
      }.width('100%').height('100%').backgroundColor(APP.bg)
    }.hideTitleBar(true).mode(NavigationMode.Stack).backgroundColor(APP.bg).navDestination(this.PageMap)
  }
}
