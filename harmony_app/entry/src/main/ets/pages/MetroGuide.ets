import { Loc } from '../model/Loc';
import { PlannerState, choosePlace } from '../core/PlannerState';
import { NAV_SELECT_START } from '../core/Router';
import { APP } from '../ui/Theme';
import { PageHeader, AppIcon, SectionTitle } from '../ui/Common';
@Component
export struct MetroGuide {
  @Consume pathStack: NavPathStack;
  @Consume planner: PlannerState;
  @StorageLink('lang') lang: string = 'zh';
  private choose(id: string): void { this.planner = choosePlace(this.planner, id, false); this.pathStack.pushPathByName(NAV_SELECT_START, null); }
  @Builder
  directionCard(id: string, title: string, subtitle: string) {
    Row({ space: 16 }) {
      Row() { AppIcon({ name: 'metro', iconSize: 30 }) }.width(60).height(60).borderRadius(18).backgroundColor(APP.accentSoft).justifyContent(FlexAlign.Center)
      Column({ space: 6 }) {
        Text(Loc.t(title, this.lang === 'en')).fontSize(22).fontWeight(FontWeight.Bold).fontColor(APP.text).width('100%')
        Text(Loc.t(subtitle, this.lang === 'en')).fontSize(14).fontColor(APP.sub).width('100%')
      }.layoutWeight(1).alignItems(HorizontalAlign.Start)
      AppIcon({ name: 'next', iconSize: 24 })
    }.id('metro_' + id).width('100%').padding(20).backgroundColor(APP.card).borderRadius(18)
      .border({ width: 1, color: APP.line }).onClick(() => this.choose(id))
  }
  @Builder
  metroStep(no: string, key: string) {
    Row({ space: 14 }) {
      Text(no).fontSize(16).fontWeight(FontWeight.Bold).fontColor(APP.accent).width(36).height(36)
        .backgroundColor(APP.accentSoft).borderRadius(10).textAlign(TextAlign.Center)
      Text(Loc.t(key, this.lang === 'en')).fontSize(16).fontColor(APP.text).layoutWeight(1)
    }.width('100%').padding({ top: 10, bottom: 10 }).alignItems(VerticalAlign.Center)
  }
  build() {
    NavDestination() {
      Column() {
        PageHeader({ title: Loc.t('metro_title', this.lang === 'en'), onBack: () => this.pathStack.pop() })
        Scroll() {
          Row() {
          Column({ space: 18 }) {
            Text(Loc.t('metro_heading', this.lang === 'en')).fontSize(28).fontWeight(FontWeight.Bold).fontColor(APP.text).width('100%')
            Text(Loc.t('metro_hint', this.lang === 'en')).fontSize(14).fontColor(APP.sub).width('100%')
            this.directionCard('xha_b2_platA', 'city', 'city_sub')
            this.directionCard('xha_b2_platB', 'resort', 'resort_sub')
            Column({ space: 8 }) {
              SectionTitle({ title: Loc.t('metro_steps', this.lang === 'en') })
              this.metroStep('1', 'metro_gate'); this.metroStep('2', 'metro_down'); this.metroStep('3', 'metro_wait')
            }.width('100%').padding(20).backgroundColor(APP.card).borderRadius(18)
          }.width('100%').constraintSize({ maxWidth: 840 }).padding(20).alignItems(HorizontalAlign.Start)
          }.width('100%').justifyContent(FlexAlign.Center)
        }.layoutWeight(1).width('100%').scrollBar(BarState.Auto)
      }.width('100%').height('100%').backgroundColor(APP.bg)
    }.hideTitleBar(true).backgroundColor(APP.bg)
  }
}
