// 首页：星海机场总览（元服务入口）
// 形态① 机场头图 + 双语切换 · ② 三大功能入口卡 · ③ 快捷直达 chips · ④ 楼层导览
// Navigation host：所有子页以 NavDestination 推送
import { MapNode, XHA_NODES, XHA_META } from '../model/AirportMap';
import { nodeName } from '../model/Localization';
import { catOf, catSymbol, HOT_DESTINATIONS } from '../model/Categories';
import { Loc } from '../model/Loc';
import { Router, NAV_SELECT_TARGET, NAV_SELECT_START, NAV_METRO, NAV_BROWSE, NAV_PLAN } from '../core/Router';
import { APP, TYPE_COLOR } from '../ui/Theme';
import { SelectTarget } from './SelectTarget';
import { SelectStart } from './SelectStart';
import { Route } from './Route';
import { MetroGuide } from './MetroGuide';
import { FloorBrowse } from './FloorBrowse';

const NODE_BY: Map<string, MapNode> = new Map<string, MapNode>();
for (let i = 0; i < XHA_NODES.length; i++) {
  NODE_BY.set(XHA_NODES[i].id, XHA_NODES[i]);
}

@Entry
@Component
struct Index {
  @Provide pathStack: NavPathStack = new NavPathStack();
  @StorageLink('lang') lang: string = 'zh';

  aboutToAppear(): void {
    if (AppStorage.get('lang') === undefined) {
      AppStorage.setOrCreate('lang', 'zh');
    }
  }

  toggleLang(): void {
    const next: string = this.lang === 'zh' ? 'en' : 'zh';
    AppStorage.setOrCreate('lang', next);
  }

  // 点到某个热门目的地：从默认起点直接规划
  goDest(id: string): void {
    Router.startId = 'xha_p4_doorW';
    Router.endId = id;
    const n = NODE_BY.get(id);
    if (n !== undefined) {
      Router.endNameZh = n.name;
      Router.endNameEn = nodeName(n, true);
      Router.endFloor = n.floor;
    }
    this.pathStack.pushPathByName(NAV_PLAN, null);
  }

  private nodeById(id: string): MapNode | undefined {
    return NODE_BY.get(id);
  }

  @Builder
  entryCard(color: string, symbol: string, title: string, sub: string, page: string) {
    Column({ space: 8 }) {
      Row({ space: 8 }) {
        Text(symbol).fontSize(22).fontColor(color)
        Text(title).fontSize(16).fontWeight(FontWeight.Bold).fontColor(APP.text)
      }
      .width('100%')
      .alignItems(VerticalAlign.Center)
      Text(sub).fontSize(11).fontColor(APP.sub).maxLines(1)
        .textOverflow({ overflow: TextOverflow.Ellipsis })
        .width('100%')
    }
    .padding(14)
    .backgroundColor(APP.card)
    .borderRadius(16)
    .border({ width: 1, color: APP.line })
    .layoutWeight(1)
    .alignItems(HorizontalAlign.Start)
    .onClick(() => this.pathStack.pushPathByName(page, null))
  }

  @Builder
  destChip(item: string) {
    if (this.nodeById(item) !== undefined) {
      Row({ space: 6 }) {
        Text(this.destSymbol(item))
          .fontSize(15)
          .fontColor(this.destColor(item))
        Text(this.destName(item))
          .fontSize(12)
          .fontColor(APP.text)
          .maxLines(1)
          .textOverflow({ overflow: TextOverflow.Ellipsis })
      }
      .padding({ left: 12, right: 12, top: 8, bottom: 8 })
      .backgroundColor(APP.card2)
      .borderRadius(999)
      .onClick(() => this.goDest(item))
    }
  }

  // @Builder 体内不允许局部变量 -> 拆成普通方法（可持有 const），builder 只留 if+组件
  private destSymbol(item: string): string {
    const n = this.nodeById(item);
    return n === undefined ? '•' : catSymbol(catOf(n));
  }

  private destName(item: string): string {
    const n = this.nodeById(item);
    return n === undefined ? '' : (this.lang === 'en' ? nodeName(n, true) : n.name);
  }

  private destColor(item: string): string {
    const n = this.nodeById(item);
    if (n === undefined) {
      return APP.accent;
    }
    const c = TYPE_COLOR.get(n.type);
    return c === undefined ? APP.accent : c;
  }

  @Builder
  floorTile(f: string) {
    Column({ space: 6 }) {
      Text(Loc.floor(f, this.lang === 'en'))
        .fontSize(15)
        .fontWeight(FontWeight.Bold)
        .fontColor(APP.text)
      Text(f)
        .fontSize(11)
        .fontColor(APP.sub)
    }
    .padding({ left: 14, right: 14, top: 12, bottom: 12 })
    .backgroundColor(APP.card2)
    .borderRadius(14)
    .border({ width: 1, color: APP.line })
    .onClick(() => {
      Router.browseFloor = f;
      this.pathStack.pushPathByName(NAV_BROWSE, null);
    })
  }

  // 页面映射表：后续新增页只加一个分支
  @Builder
  PageMap(name: string) {
    if (name === NAV_SELECT_TARGET) {
      SelectTarget()
    } else if (name === NAV_SELECT_START) {
      SelectStart()
    } else if (name === NAV_METRO) {
      MetroGuide()
    } else if (name === NAV_BROWSE) {
      FloorBrowse()
    } else if (name === NAV_PLAN) {
      Route()
    }
  }

  build() {
    Navigation(this.pathStack) {
      Column() {
        // 头部：机场名 + 双语切换
        Row() {
          Column({ space: 2 }) {
            Text(XHA_META.name)
              .fontSize(24)
              .fontWeight(FontWeight.Bold)
              .fontColor(APP.text)
            Text(Loc.t('home_sub', this.lang === 'en'))
              .fontSize(11)
              .fontColor(APP.sub)
          }
          .alignItems(HorizontalAlign.Start)
          .layoutWeight(1)

          // 双语切换
          Row() {
            Text('中')
              .fontSize(12)
              .fontColor(this.lang === 'zh' ? APP.bg : APP.sub)
              .padding({ left: 10, right: 10, top: 5, bottom: 5 })
              .backgroundColor(this.lang === 'zh' ? APP.accent : Color.Transparent)
            Text('EN')
              .fontSize(12)
              .fontColor(this.lang === 'en' ? APP.bg : APP.sub)
              .padding({ left: 10, right: 10, top: 5, bottom: 5 })
              .backgroundColor(this.lang === 'en' ? APP.accent : Color.Transparent)
          }
          .borderRadius(999)
          .backgroundColor(APP.card2)
          .onClick(() => this.toggleLang())
        }
        .width('100%')
        .padding({ left: 16, right: 16, top: 8, bottom: 12 })

        // 形态②：三大功能入口
        Row({ space: 10 }) {
          this.entryCard('#3E8BE5', '✈', Loc.t('btn_find', this.lang === 'en'),
            Loc.t('sel_title', this.lang === 'en'), NAV_SELECT_TARGET)
          this.entryCard('#5B4A9E', '◆', Loc.t('btn_metro', this.lang === 'en'),
            Loc.t('metro_hint', this.lang === 'en'), NAV_METRO)
          this.entryCard('#4E8E86', '⬒', Loc.t('btn_browse', this.lang === 'en'),
            Loc.t('browse_title', this.lang === 'en'), NAV_BROWSE)
        }
        .width('100%')
        .padding({ left: 16, right: 16 })
        .alignItems(VerticalAlign.Top)

        // 形态③：快捷直达
        Column({ space: 8 }) {
          Text(Loc.t('home_sub', this.lang === 'en'))
            .fontSize(13)
            .fontWeight(FontWeight.Medium)
            .fontColor(APP.sub)
            .width('100%')
          Scroll() {
            Row({ space: 8 }) {
              ForEach(HOT_DESTINATIONS, (item: string) => {
                this.destChip(item)
              }, (item: string) => item)
            }
          }
          .scrollable(ScrollDirection.Horizontal)
          .scrollBar(BarState.Off)
          .width('100%')
        }
        .width('100%')
        .padding({ left: 16, right: 16, top: 16 })

        // 形态④：楼层导览
        Column({ space: 10 }) {
          Text(Loc.t('sec_floors', this.lang === 'en'))
            .fontSize(16)
            .fontWeight(FontWeight.Bold)
            .fontColor(APP.text)
            .width('100%')
          Row({ space: 8 }) {
            // 六层
            ForEach(['4F', '3F', '2F', '1F', 'B1', 'B2'], (f: string) => {
              this.floorTile(f)
            }, (f: string) => f)
          }
          .width('100%')
        }
        .width('100%')
        .padding({ left: 16, right: 16, top: 20 })

        Blank()
      }
      .width('100%')
      .height('100%')
      .backgroundColor(APP.bg)
    }
    .hideTitleBar(true)
    .mode(NavigationMode.Stack)
    .backgroundColor(APP.bg)
    .navDestination(this.PageMap)
  }
}