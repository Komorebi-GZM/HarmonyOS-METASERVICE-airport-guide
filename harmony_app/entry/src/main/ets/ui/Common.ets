import { MapNode, XHA_NODES } from '../model/AirportMap';
import { nodeName, typeLabel } from '../model/Localization';
import { APP } from './Theme';
import { Loc } from '../model/Loc';
export function iconFor(type: string): string {
  if (type === 'gate' || type === 'checkin') { return 'plane'; }
  if (type === 'metro') { return 'metro'; }
  if (type === 'security') { return 'shield'; }
  if (type === 'lift' || type === 'escalator' || type === 'stair') { return 'layers'; }
  if (type === 'baggage') { return 'bag'; }
  if (type === 'toilet') { return 'facility'; }
  return 'pin';
}
@Component
export struct AppIcon {
  @Prop name: string = 'pin'; @Prop iconSize: number = 24;
  build() { Image($rawfile('icons/' + this.name + '.svg')).width(this.iconSize).height(this.iconSize).objectFit(ImageFit.Contain) }
}
@Component
export struct PageHeader {
  @Prop title: string = ''; @Prop back: boolean = true;
  onBack: () => void = () => {};
  @State reserve: number = 100;
  private refreshBar(): void {
    const bar = this.getUIContext().getAtomicServiceBar();
    if (bar !== undefined && bar !== null) {
      const rect = bar.getBarRect();
      const width = rect.width > 0 ? rect.width + 12 : 100;
      if (Math.abs(width - this.reserve) > 1) { this.reserve = width; }
    }
  }
  build() {
    Row({ space: 10 }) {
      if (this.back) {
        Button() { AppIcon({ name: 'back', iconSize: 24 }) }
          .id('back_button').width(48).height(48).backgroundColor(Color.Transparent)
          .accessibilityText(Loc.t('back', AppStorage.get<string>('lang') === 'en')).onClick(() => this.onBack())
      } else { AppIcon({ name: 'brand', iconSize: 32 }) }
      Text(this.title).fontSize(20).fontWeight(FontWeight.Bold).fontColor(APP.text).maxLines(1)
        .textOverflow({ overflow: TextOverflow.Ellipsis }).layoutWeight(1)
    }
    .width('100%').height(64).padding({ left: 16, right: this.reserve + 16 })
    .backgroundColor(APP.card).alignItems(VerticalAlign.Center).onAreaChange(() => this.refreshBar())
  }
}
@Component
export struct PrimaryAction {
  @Prop label: string = ''; @Prop actionEnabled: boolean = true;
  onAction: () => void = () => {};
  build() {
    Button(this.label).id('primary_action').width('100%').constraintSize({ minHeight: 52 }).fontSize(16)
      .fontWeight(FontWeight.Medium).fontColor(Color.White).backgroundColor(APP.accent)
      .borderRadius(14).enabled(this.actionEnabled).opacity(this.actionEnabled ? 1 : 0.45).onClick(() => this.onAction())
  }
}
@Component
export struct EmptyState {
  @Prop title: string = ''; @Prop hint: string = ''; @Prop icon: string = 'search';
  build() {
    Column({ space: 14 }) {
      AppIcon({ name: this.icon, iconSize: 40 })
      Text(this.title).fontSize(20).fontWeight(FontWeight.Bold).fontColor(APP.text).textAlign(TextAlign.Center)
      Text(this.hint).fontSize(14).fontColor(APP.sub).textAlign(TextAlign.Center)
    }.width('100%').padding(28).justifyContent(FlexAlign.Center)
  }
}
@Component
export struct PlaceRow {
  @Prop item: MapNode = XHA_NODES[0]; @Prop selected: boolean = false; @Prop lang: string = 'zh';
  onChoose: () => void = () => {};
  build() {
    Row({ space: 14 }) {
      Row() { AppIcon({ name: iconFor(this.item.type), iconSize: 24 }) }
        .width(44).height(44).backgroundColor(this.selected ? APP.card : APP.bg).borderRadius(12).justifyContent(FlexAlign.Center)
      Column({ space: 5 }) {
        Text(nodeName(this.item, this.lang === 'en')).fontSize(16).fontWeight(FontWeight.Medium).fontColor(APP.text)
          .maxLines(2).textOverflow({ overflow: TextOverflow.Ellipsis }).width('100%')
        Text(this.item.floor + ' · ' + Loc.floor(this.item.floor, this.lang === 'en') + ' · ' + typeLabel(this.item.type, this.lang === 'en'))
          .fontSize(14).fontColor(APP.sub).maxLines(2).width('100%')
      }.layoutWeight(1).alignItems(HorizontalAlign.Start)
      AppIcon({ name: this.selected ? 'check' : 'next', iconSize: 20 })
    }.id('place_' + this.item.id).width('100%').padding(16).backgroundColor(this.selected ? APP.accentSoft : APP.card)
      .borderRadius(16).border({ width: this.selected ? 1.5 : 1, color: this.selected ? APP.accent : APP.line })
      .onClick(() => this.onChoose()).accessibilityText(nodeName(this.item, this.lang === 'en') + ', ' + this.item.floor)
  }
}
@Component
export struct SectionTitle {
  @Prop title: string = ''; @Prop detail: string = '';
  build() {
    Row() {
      Text(this.title).fontSize(18).fontWeight(FontWeight.Bold).fontColor(APP.text).layoutWeight(1)
      if (this.detail !== '') { Text(this.detail).fontSize(14).fontColor(APP.sub) }
    }.width('100%').padding({ top: 4, bottom: 4 })
  }
}
