// 目标选择页（NavDestination）
// ① 搜索框 · ② 分类 tab（10 类）· ③ 起点区（可换起点）· ④ 结果列表
import { MapNode, XHA_NODES } from '../model/AirportMap';
import { nodeName, typeLabel, floorName } from '../model/Localization';
import { Category, CATEGORIES, catOf, catSymbol, catName, matches } from '../model/Categories';
import { Loc } from '../model/Loc';
import { Router, NAV_PLAN, NAV_SELECT_START } from '../core/Router';
import { APP, TYPE_COLOR } from '../ui/Theme';

const NODE_BY: Map<string, MapNode> = new Map<string, MapNode>();
for (let i = 0; i < XHA_NODES.length; i++) {
  NODE_BY.set(XHA_NODES[i].id, XHA_NODES[i]);
}

@Component
export struct SelectTarget {
  @Consume pathStack: NavPathStack;
  @StorageLink('lang') lang: string = 'zh';
  @State q: string = '';
  @State cat: string = 'all';
  @State list: MapNode[] = [];
  @State picked: string = ''; // 当前已选终点（仅用于高亮/刷新，路由值存在 Router）
  // 起点/终点本地镜像：Router 是普通静态类、无可观测性，bar 读 @State 才能在 swap/返回时立刻刷新
  @State sId: string = '';
  @State eId: string = '';

  aboutToAppear(): void {
    this.syncRouter();
    this.picked = Router.endId;
    this.rebuild();
  }

  // 从 Router 拉取起终点镜像
  private syncRouter(): void {
    this.sId = Router.startId;
    this.eId = Router.endId;
  }

  // 分类 tab 或搜索变化时重建结果列表
  rebuild(): void {
    const out: MapNode[] = [];
    const query = this.q;
    for (let i = 0; i < XHA_NODES.length; i++) {
      const n = XHA_NODES[i];
      if (this.cat !== 'all' && catOf(n) !== this.cat) {
        continue;
      }
      if (!matches(n, query)) {
        continue;
      }
      out.push(n);
    }
    this.list = out;
  }

  pick(id: string): void {
    const n = NODE_BY.get(id);
    if (n === undefined) {
      return;
    }
    Router.endId = id;
    Router.endNameZh = n.name;
    Router.endNameEn = nodeName(n, true);
    Router.endFloor = n.floor;
    this.eId = id;
    this.picked = id;
  }

  // 交换起终点
  swapEnds(): void {
    const s = Router.startId;
    const e = Router.endId;
    Router.startId = e;
    Router.endId = s;
    const n = NODE_BY.get(s);
    if (n !== undefined) {
      Router.endNameZh = n.name;
      Router.endNameEn = nodeName(n, true);
      Router.endFloor = n.floor;
    }
    this.syncRouter();
    this.picked = s;
  }

  // 前往路线页（确认）
  confirmRoute(): void {
    this.pathStack.pushPathByName(NAV_PLAN, null);
  }

  endName(): string {
    const n = NODE_BY.get(this.eId);
    if (n === undefined) {
      return '';
    }
    return this.lang === 'en' ? nodeName(n, true) : n.name;
  }

  nodeColor(n: MapNode): string {
    const c = TYPE_COLOR.get(n.type);
    return c === undefined ? APP.accent : c;
  }

  @Builder
  catChip(c: string) {
    Text(catName(c, this.lang === 'en'))
      .fontSize(12)
      .fontColor(this.cat === c ? APP.bg : APP.sub)
      .padding({ left: 12, right: 12, top: 6, bottom: 6 })
      .backgroundColor(this.cat === c ? APP.accent : APP.card2)
      .borderRadius(999)
      .onClick(() => {
        this.cat = c;
        this.rebuild();
      })
  }

  @Builder
  nodeRow(n: MapNode) {
    Row({ space: 12 }) {
      // 行首色点：避免 Circle().fill()（SDK26 新 API）-> 用圆角 Row 实现
      Row()
        .width(12)
        .height(12)
        .borderRadius(6)
        .backgroundColor(this.nodeColor(n))
      Column({ space: 3 }) {
        Row({ space: 8 }) {
          Text(this.lang === 'en' ? nodeName(n, true) : n.name)
            .fontSize(15)
            .fontWeight(FontWeight.Medium)
            .fontColor(APP.text)
            .maxLines(1)
            .textOverflow({ overflow: TextOverflow.Ellipsis })
          if (n.id === 'xha_p4_sec') {
            Text('安检')
              .fontSize(10)
              .fontColor(Color.White)
              .padding({ left: 6, right: 6, top: 2, bottom: 2 })
              .backgroundColor('#E34948')
              .borderRadius(999)
          }
        }
        .alignItems(VerticalAlign.Center)
        Row({ space: 6 }) {
          Text(typeLabel(n.type, this.lang === 'en'))
            .fontSize(11)
            .fontColor(APP.sub)
          Text('·')
            .fontSize(11)
            .fontColor(APP.sub)
          Text(n.floor)
            .fontSize(11)
            .fontColor(APP.sub)
          Text('·')
            .fontSize(11)
            .fontColor(APP.sub)
          Text(floorName(n.floor, this.lang === 'en'))
            .fontSize(11)
            .fontColor(APP.sub)
            .maxLines(1)
        }
      }
      .alignItems(HorizontalAlign.Start)
      .layoutWeight(1)

      if (this.picked === n.id) {
        Text('✓')
          .fontSize(16)
          .fontColor(APP.gold)
      }
      Text('›')
        .fontSize(20)
        .fontColor(APP.sub)
    }
    .width('100%')
    .padding({ left: 14, right: 14, top: 12, bottom: 12 })
    .backgroundColor(this.picked === n.id ? APP.card2 : APP.card)
    .borderRadius(14)
    .onClick(() => this.pick(n.id))
  }

  build() {
    NavDestination() {
      Column() {
        // 顶部：返回 + 标题
        Row() {
          Text('‹')
            .fontSize(30)
            .fontColor(APP.text)
            .width(40)
            .height(40)
            .textAlign(TextAlign.Center)
            .onClick(() => {
              this.pathStack.pop();
            })
          Text(Loc.t('sel_title', this.lang === 'en'))
            .fontSize(19)
            .fontWeight(FontWeight.Bold)
            .fontColor(APP.text)
          Blank()
          Text(catSymbol('all'))
            .fontSize(16)
            .fontColor(APP.sub)
        }
        .width('100%')
        .height(52)
        .padding({ left: 8, right: 16 })
        .alignItems(VerticalAlign.Center)

        // 搜索框
        TextInput({ placeholder: Loc.t('sel_search', this.lang === 'en') })
          .height(40)
          .borderRadius(12)
          .backgroundColor(APP.card)
          .fontColor(APP.text)
          .placeholderColor(APP.sub)
          .caretColor(APP.accent)
          .padding({ left: 12, right: 12 })
          .margin({ left: 16, right: 16, bottom: 10 })
          .onChange((v: string) => {
            this.q = v;
            this.rebuild();
          })

        // 分类 tab
        Scroll() {
          Row({ space: 8 }) {
            ForEach(CATEGORIES, (c: Category) => {
              this.catChip(c.key)
            }, (c: Category) => c.key)
          }
          .padding({ left: 16, right: 16 })
        }
        .scrollable(ScrollDirection.Horizontal)
        .scrollBar(BarState.Off)
        .width('100%')
        .height(40)
        .margin({ bottom: 10 })

        // 地图式规划栏：出发点 | 交换 | 终点 | 确认
        Row({ space: 10 }) {
          // 出发点（可点进 SelectStart 换起点）
          Column({ space: 3 }) {
            Text(Loc.t('planner_from', this.lang === 'en'))
              .fontSize(10)
              .fontColor(APP.sub)
            Text(this.startName())
              .fontSize(12)
              .fontColor(APP.gtext)
              .maxLines(1)
              .textOverflow({ overflow: TextOverflow.Ellipsis })
          }
          .layoutWeight(1)
          .alignItems(HorizontalAlign.Start)
          .onClick(() => {
            this.pathStack.pushPathByName(NAV_SELECT_START, null);
          })

          // 交换
          Column({ space: 0 }) {
            Text('⇄')
              .fontSize(16)
              .fontColor(APP.accent)
            Text(Loc.t('planner_swap', this.lang === 'en'))
              .fontSize(9)
              .fontColor(APP.sub)
          }
          .onClick(() => this.swapEnds())

          // 终点
          Column({ space: 3 }) {
            Text(Loc.t('planner_to', this.lang === 'en'))
              .fontSize(10)
              .fontColor(APP.sub)
            Text(this.endName())
              .fontSize(12)
              .fontColor(APP.gold)
              .maxLines(1)
              .textOverflow({ overflow: TextOverflow.Ellipsis })
          }
          .layoutWeight(1)
          .alignItems(HorizontalAlign.End)

          // 确认
          Button(Loc.t('planner_go', this.lang === 'en'))
            .fontSize(13)
            .fontColor(APP.bg)
            .backgroundColor(APP.accent)
            .height(36)
            .borderRadius(999)
            .onClick(() => this.confirmRoute())
        }
        .width('100%')
        .padding({ left: 14, right: 14, top: 10, bottom: 10 })
        .backgroundColor(APP.card)
        .borderRadius(14)
        .margin({ left: 16, right: 16, bottom: 10 })
        .alignItems(VerticalAlign.Center)

        // 结果列表
        if (this.list.length === 0) {
          Column({ space: 8 }) {
            Text(catSymbol('all')).fontSize(30).fontColor(APP.sub)
            Text(Loc.t('sel_empty', this.lang === 'en'))
              .fontSize(13)
              .fontColor(APP.sub)
          }
          .layoutWeight(1)
          .width('100%')
          .justifyContent(FlexAlign.Center)
        } else {
          List({ space: 8 }) {
            ForEach(this.list, (n: MapNode) => {
              ListItem() {
                this.nodeRow(n)
              }
            }, (n: MapNode) => n.id)
          }
          .layoutWeight(1)
          .width('100%')
          .padding({ left: 16, right: 16, bottom: 16 })
          .scrollBar(BarState.Off)
          .edgeEffect(EdgeEffect.None)
        }
      }
      .width('100%')
      .height('100%')
      .backgroundColor(APP.bg)
    }
    .title(Loc.t('sel_title', this.lang === 'en'))
    .hideTitleBar(true)
    // 可见性生命周期：从子页（SelectStart）pop 返回本页时重新拉 Router，刷新 bar 起点显示
    // （Router 是静态类不可观测，本 SDK 的 onShown 是 NavDestination 链式属性，不是 struct 方法）
    .onShown(() => {
      this.syncRouter();
    })
    .onBackPressed(() => {
      this.pathStack.pop();
      return true;
    })
  }

  private startName(): string {
    const n = NODE_BY.get(this.sId);
    if (n === undefined) {
      return '';
    }
    return this.lang === 'en' ? nodeName(n, true) : n.name;
  }
}