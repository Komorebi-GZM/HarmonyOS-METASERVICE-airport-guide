import { MapNode } from '../model/AirportMap';
import { Loc } from '../model/Loc';
import { CATEGORIES, Category, catName } from '../model/Categories';
import { PlannerState, copyPlanner, choosePlace, commitJourney, cancelEdit } from '../core/PlannerState';
import { searchPlaces, place, placeName, recentPlaces } from '../core/Places';
import { QUICK_STARTS } from '../core/Pathfinder';
import { LocalStore } from '../core/LocalStore';
import { NAV_SELECT_START, NAV_PLAN, NAV_BROWSE } from '../core/Router';
import { PageHeader, PlaceRow, PrimaryAction, EmptyState, AppIcon } from './Common';
import { APP } from './Theme';
@Component
export struct PlacePicker {
  @Prop start: boolean = false;
  @Consume pathStack: NavPathStack;
  @Consume planner: PlannerState;
  @Consume recent: string[];
  @StorageLink('lang') lang: string = 'zh';
  @State q: string = ''; @State category: string = 'all'; @State list: MapNode[] = [];
  @State searchFocused: boolean = false;
  aboutToAppear(): void { this.q = this.start ? '' : this.planner.query; this.category = this.start ? 'all' : this.planner.category; this.rebuild(); }
  private rebuild(): void { this.list = searchPlaces(this.q, this.category); }
  private selected(): string { return this.start ? this.planner.draftStart : this.planner.draftEnd; }
  private selectedName(): string { return placeName(this.selected(), this.lang === 'en'); }
  private back(): void {
    if (this.planner.editing !== 'new') { this.planner = cancelEdit(this.planner); }
    this.pathStack.pop();
  }
  private choose(id: string): void {
    this.getUIContext().getFocusController().clearFocus();
    this.searchFocused = false;
    this.planner = choosePlace(this.planner, id, this.start);
  }
  private next(): void {
    if (place(this.selected()) === undefined) { return; }
    if (!this.start && this.planner.editing !== 'end' && this.planner.draftStart === '') {
      this.pathStack.pushPathByName(NAV_SELECT_START, null); return;
    }
    const editing = this.planner.editing;
    this.planner = commitJourney(this.planner);
    this.recent = recentPlaces(this.recent, this.planner.endId);
    LocalStore.save(this.lang, this.recent);
    if (editing !== 'new') { this.pathStack.pop(); }
    else { this.pathStack.clear(); this.pathStack.pushPathByName(NAV_PLAN, null); }
  }
  private map(): void {
    const p = copyPlanner(this.planner); p.mapMode = this.start ? 'start' : 'destination';
    this.planner = p; this.pathStack.pushPathByName(NAV_BROWSE, null);
  }
  private actionLabel(): string {
    return Loc.t(this.planner.editing !== 'new' ? 'apply' : (this.start ? 'view_route' : 'next_start'), this.lang === 'en');
  }
  private quickLabel(id: string): string { return placeName(id, this.lang === 'en'); }
  @Builder
  chip(c: Category) {
    Button(catName(c.key, this.lang === 'en')).fontSize(14).constraintSize({ minHeight: 48 })
      .padding({ left: 16, right: 16 }).backgroundColor(this.category === c.key ? APP.accent : APP.card)
      .fontColor(this.category === c.key ? Color.White : APP.sub).borderRadius(12)
      .onClick(() => { this.category = c.key; this.rebuild(); })
  }
  build() {
    Column() {
      PageHeader({ title: Loc.t(this.start ? 'start_title' : 'target_title', this.lang === 'en'), onBack: () => this.back() })
      Column({ space: 12 }) {
        Text(Loc.t(this.start ? 'step_two' : 'step_one', this.lang === 'en')).fontSize(14).fontColor(APP.accent).width('100%')
        if (!this.searchFocused) {
          Text(Loc.t(this.start ? 'start_heading' : 'target_heading', this.lang === 'en')).fontSize(28).fontWeight(FontWeight.Bold).fontColor(APP.text).width('100%')
          Text(Loc.t(this.start ? 'start_hint' : 'target_hint', this.lang === 'en')).fontSize(14).fontColor(APP.sub).width('100%')
        }
        if (this.start && this.planner.draftEnd !== '') {
          Text(Loc.t('selected_target', this.lang === 'en') + ' · ' + placeName(this.planner.draftEnd, this.lang === 'en'))
            .fontSize(16).fontColor(APP.accent).width('100%')
        }
        TextInput({ text: this.q, placeholder: Loc.t('search', this.lang === 'en') })
          .id('place_search').height(52)
          .fontSize(16).backgroundColor(APP.card).fontColor(APP.text).placeholderColor(APP.sub).borderRadius(14)
          .onFocus(() => { this.searchFocused = true; })
          .onBlur(() => { this.searchFocused = false; })
          .onChange((v: string) => { this.q = v; this.rebuild(); })
        if (this.start && !this.searchFocused) {
          Button() {
            Row({ space: 8 }) { AppIcon({ name: 'map' }); Text(Loc.t('view_map', this.lang === 'en')).fontSize(14).fontColor(APP.accent) }
          }.id('choose_on_map').width('100%').height(48).backgroundColor(APP.card).borderRadius(14).onClick(() => this.map())
        }
      }.width('100%').padding({ left: 20, right: 20, top: 16, bottom: 12 }).alignItems(HorizontalAlign.Start)
      Scroll() {
        Row({ space: 8 }) { ForEach(CATEGORIES, (c: Category) => { this.chip(c) }, (c: Category) => c.key) }
          .padding({ left: 20, right: 20 })
      }.width('100%').height(52).scrollable(ScrollDirection.Horizontal).scrollBar(BarState.Off)
      if (this.start && !this.searchFocused && this.q.trim() === '' && this.category === 'all') {
        Column({ space: 8 }) {
          Text(Loc.t('quick_starts', this.lang === 'en')).fontSize(14).fontColor(APP.sub).width('100%')
          Scroll() {
            Row({ space: 8 }) {
              ForEach(QUICK_STARTS, (id: string) => {
                Button(this.quickLabel(id)).constraintSize({ minHeight: 48 }).fontSize(14).backgroundColor(APP.card)
                  .fontColor(APP.accent).borderRadius(12).onClick(() => this.choose(id))
              }, (id: string) => id)
            }
          }.width('100%').scrollable(ScrollDirection.Horizontal).scrollBar(BarState.Off)
        }.padding({ left: 20, right: 20, top: 8, bottom: 8 }).width('100%')
      }
      if (this.list.length === 0) {
        Column() {
          EmptyState({ title: Loc.t('no_results', this.lang === 'en'), hint: Loc.t('no_results_hint', this.lang === 'en') })
          Button(Loc.t('clear', this.lang === 'en')).height(48).backgroundColor(APP.card).fontColor(APP.accent)
            .onClick(() => { this.q = ''; this.category = 'all'; this.rebuild(); })
        }.layoutWeight(1).width('100%').justifyContent(FlexAlign.Center)
      } else {
        List({ space: 10 }) {
          ForEach(this.list, (n: MapNode) => {
            ListItem() { PlaceRow({ item: n, selected: this.selected() === n.id, lang: this.lang, onChoose: () => this.choose(n.id) }) }
          }, (n: MapNode) => n.id)
        }.id('place_list').layoutWeight(1).width('100%').padding({ left: 20, right: 20, top: 8, bottom: 12 }).scrollBar(BarState.Auto)
      }
      Column({ space: 8 }) {
        Text(this.selectedName() === '' ? Loc.t(this.start ? 'choose_start' : 'choose_target', this.lang === 'en') : this.selectedName())
          .fontSize(14).fontColor(this.selectedName() === '' ? APP.sub : APP.accent).maxLines(2).width('100%')
        PrimaryAction({ label: this.actionLabel(), actionEnabled: place(this.selected()) !== undefined, onAction: () => this.next() })
      }.width('100%').padding(16).backgroundColor(APP.card)
    }.width('100%').height('100%').constraintSize({ maxWidth: 840 }).backgroundColor(APP.bg)
  }
}
